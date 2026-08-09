import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createChallan, confirmChallan } from '../../api/challans';
import { getCustomers } from '../../api/customers';
import { getProducts } from '../../api/products';
import { Customer, Product } from '../../types';
import { useToast } from '../../components/Toast';

interface LineItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
}

const ChallanCreate: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Customer search / selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Product search / selection
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productQty, setProductQty] = useState<number>(1);
  const [productLoading, setProductLoading] = useState(false);

  // Line items already added to the challan
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Submission state
  const [saving, setSaving] = useState(false);

  // ── Customer search (debounced) ──────────────────────────────────────────────
  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setCustomerLoading(true);
      try {
        const res = await getCustomers({ search: customerSearch, page: 1 });
        setCustomerResults(res.data);
      } catch {
        showToast('Failed to search customers', 'error');
      } finally {
        setCustomerLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // ── Product search (debounced) ───────────────────────────────────────────────
  useEffect(() => {
    if (!productSearch.trim()) {
      setProductResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setProductLoading(true);
      try {
        const res = await getProducts({ search: productSearch, page: 1 });
        setProductResults(res.data);
      } catch {
        showToast('Failed to search products', 'error');
      } finally {
        setProductLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setCustomerResults([]);
  };

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductSearch(p.name);
    setProductResults([]);
    setProductQty(1);
  };

  const addLineItem = () => {
    if (!selectedProduct) {
      showToast('Please select a product first', 'error');
      return;
    }
    if (productQty < 1) {
      showToast('Quantity must be at least 1', 'error');
      return;
    }
    // Merge with existing item if same product
    const existing = lineItems.findIndex((i) => i.productId === selectedProduct.id);
    if (existing !== -1) {
      const updated = [...lineItems];
      updated[existing].quantity += productQty;
      setLineItems(updated);
    } else {
      setLineItems([
        ...lineItems,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          unitPrice: selectedProduct.unitPrice,
          quantity: productQty,
        },
      ]);
    }
    // Reset product picker
    setSelectedProduct(null);
    setProductSearch('');
    setProductQty(1);
  };

  const removeLineItem = (productId: string) => {
    setLineItems(lineItems.filter((i) => i.productId !== productId));
  };

  const totalQty = lineItems.reduce((sum, i) => sum + i.quantity, 0);

  // ── Save helpers ─────────────────────────────────────────────────────────────
  const buildPayload = () => ({
    customerId: selectedCustomer!.id,
    items: lineItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  });

  const validate = (): boolean => {
    if (!selectedCustomer) {
      showToast('Please select a customer', 'error');
      return false;
    }
    if (lineItems.length === 0) {
      showToast('Please add at least one product', 'error');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const challan = await createChallan(buildPayload());
      showToast('Draft challan saved', 'success');
      navigate(`/challans/${challan.id}`);
    } catch (err) {
      showToast('Failed to save draft challan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndConfirm = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const challan = await createChallan(buildPayload());
      try {
        await confirmChallan(challan.id);
        showToast('Challan confirmed successfully', 'success');
      } catch (confirmErr: any) {
        // Stock insufficient or other confirm error — show server message
        const msg =
          confirmErr?.response?.data?.message ||
          confirmErr?.response?.data?.error ||
          'Failed to confirm challan';
        showToast(msg, 'error');
        // Redirect to the draft so user can edit
        navigate(`/challans/${challan.id}`);
        return;
      }
      navigate(`/challans/${challan.id}`);
    } catch (err) {
      showToast('Failed to create challan', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            Back
          </button>
          <h2>New Challan</h2>
        </div>
      </div>

      {/* ── Step 1: Select Customer ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          Step 1 — Select Customer
        </h3>

        {selectedCustomer ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1, padding: '0.75rem 1rem', background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: '6px' }}>
              <strong>{selectedCustomer.name}</strong>
              {selectedCustomer.businessName && (
                <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>— {selectedCustomer.businessName}</span>
              )}
              <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>{selectedCustomer.mobile}</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSelectedCustomer(null); setCustomerSearch(''); }}
            >
              Change
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Search customer by name or mobile</label>
              <input
                type="text"
                className="form-input"
                placeholder="Type to search..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            {customerLoading && (
              <div style={{ padding: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>Searching...</div>
            )}
            {customerResults.length > 0 && (
              <div style={{
                position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'
              }}>
                {customerResults.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => selectCustomer(c)}
                    style={{
                      padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <strong>{c.name}</strong>
                    {c.businessName && <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>— {c.businessName}</span>}
                    <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.875rem' }}>{c.mobile}</span>
                  </div>
                ))}
              </div>
            )}
            {customerSearch.trim() && !customerLoading && customerResults.length === 0 && (
              <div style={{ padding: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>No customers found</div>
            )}
          </div>
        )}
      </div>

      {/* ── Step 2: Add Products ────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          Step 2 — Add Products
        </h3>

        {/* Product picker row */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: '1 1 280px', marginBottom: 0, position: 'relative' }}>
            <label className="form-label">Search product by name or SKU</label>
            <input
              type="text"
              className="form-input"
              placeholder="Type to search..."
              value={productSearch}
              onChange={(e) => { setProductSearch(e.target.value); setSelectedProduct(null); }}
            />
            {productLoading && (
              <div style={{ padding: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>Searching...</div>
            )}
            {productResults.length > 0 && (
              <div style={{
                position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0,
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto'
              }}>
                {productResults.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    style={{
                      padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <strong>{p.name}</strong>
                    <span style={{ color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                      {p.sku} — ₹{p.unitPrice} — Stock: {p.currentStock}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
            <label className="form-label">Quantity</label>
            <input
              type="number"
              className="form-input"
              min={1}
              value={productQty}
              onChange={(e) => setProductQty(Number(e.target.value))}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={addLineItem}
            disabled={!selectedProduct}
            style={{ marginBottom: 0 }}
          >
            Add Item
          </button>
        </div>

        {selectedProduct && (
          <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#eff6ff', borderRadius: '6px', fontSize: '0.875rem', color: '#1d4ed8' }}>
            Selected: <strong>{selectedProduct.name}</strong> ({selectedProduct.sku}) — ₹{selectedProduct.unitPrice} — Available stock: {selectedProduct.currentStock}
          </div>
        )}

        {/* Line items table */}
        {lineItems.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.productName}</td>
                    <td><span className="badge badge-gray">{item.sku}</span></td>
                    <td>₹{item.unitPrice}</td>
                    <td>{item.quantity}</td>
                    <td>₹{(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeLineItem(item.productId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '1.5rem' }}>
            No products added yet. Search and add products above.
          </div>
        )}
      </div>

      {/* ── Step 3: Summary & Submit ────────────────────────────────────────── */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          Step 3 — Summary
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Customer</p>
            <p style={{ fontWeight: 600 }}>{selectedCustomer?.name ?? '—'}</p>
            {selectedCustomer?.businessName && (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{selectedCustomer.businessName}</p>
            )}
          </div>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Items / Total Qty</p>
            <p style={{ fontWeight: 600 }}>{lineItems.length} item(s) — {totalQty} unit(s)</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSaveAndConfirm}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save & Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallanCreate;
