import React, { useState, useEffect } from 'react';
import { getProducts, createProduct, updateProduct, addStockMovement } from '../../api/products';
import { Product } from '../../types';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import TableSkeleton from '../../components/TableSkeleton';
import EmptyState from '../../components/EmptyState';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lowStockDismissed, setLowStockDismissed] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', unitPrice: '', currentStock: 0, minStockAlert: 0, location: ''
  });

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({ quantity: 0, type: 'IN' as 'IN' | 'OUT', reason: '' });

  const { showToast } = useToast();
  const { user } = useAuth();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts({ search, category, page });
      setProducts(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      showToast('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delaySearch = setTimeout(() => { fetchProducts(); }, 300);
    return () => clearTimeout(delaySearch);
  }, [search, category, page]);

  const lowStockProducts = products.filter(p => p.currentStock <= p.minStockAlert);

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, sku: product.sku, category: product.category,
        unitPrice: product.unitPrice, currentStock: product.currentStock,
        minStockAlert: product.minStockAlert, location: product.location || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', sku: '', category: '', unitPrice: '', currentStock: 0, minStockAlert: 0, location: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, currentStock: Number(formData.currentStock), minStockAlert: Number(formData.minStockAlert) };
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await createProduct(payload);
        showToast('Product created successfully', 'success');
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      showToast('Failed to save product', 'error');
    }
  };

  const openStockModal = (product: Product) => {
    setStockProduct(product);
    setStockForm({ quantity: 0, type: 'IN', reason: '' });
    setIsStockModalOpen(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct) return;
    if (stockForm.quantity <= 0) { showToast('Quantity must be greater than 0', 'error'); return; }
    try {
      await addStockMovement(stockProduct.id, {
        quantityChanged: Number(stockForm.quantity),
        type: stockForm.type,
        reason: stockForm.reason
      });
      showToast('Stock updated successfully', 'success');
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast('Failed to update stock', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
          <button className="btn btn-primary" onClick={() => openModal()}>＋ Add Product</button>
        )}
      </div>

      {/* ── Low-stock dismissible banner ── */}
      {!lowStockDismissed && !loading && lowStockProducts.length > 0 && (
        <div className="alert-banner alert-banner-warning">
          <span className="alert-banner-icon">⚠️</span>
          <div className="alert-banner-body">
            <div className="alert-banner-title">
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
            </div>
            <div className="alert-banner-products">
              {lowStockProducts.map(p => `${p.name} (${p.currentStock} left)`).join(' · ')}
            </div>
          </div>
          <button className="alert-banner-dismiss" onClick={() => setLowStockDismissed(true)}>✕</button>
        </div>
      )}

      <div className="card">
        <div className="filters-bar">
          <input
            type="text"
            placeholder="Search name, SKU..."
            className="form-input"
            style={{ width: 280 }}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <input
            type="text"
            placeholder="Filter by category..."
            className="form-input"
            style={{ width: 200 }}
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={7} rows={6} />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon="📦"
                      title="No products found"
                      description={search || category ? 'Try adjusting your search or category filter.' : 'Add your first product to get started.'}
                      action={(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') ? (
                        <button className="btn btn-primary btn-sm" onClick={() => openModal()}>Add Product</button>
                      ) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td><span className="badge badge-gray">{p.sku}</span></td>
                      <td>{p.category}</td>
                      <td>₹{p.unitPrice}</td>
                      <td>
                        <span style={{ color: isLow ? 'var(--danger)' : 'inherit', fontWeight: isLow ? 600 : 400 }}>
                          {p.currentStock} {isLow && '⚠️'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--muted-foreground)' }}>{p.location || '—'}</td>
                      <td>
                        <div className="btn-group">
                          <Link to={`/products/${p.id}`} className="btn btn-sm btn-secondary">View</Link>
                          {(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE') && (
                            <>
                              <button className="btn btn-sm btn-secondary" onClick={() => openModal(p)}>Edit</button>
                              <button className="btn btn-sm btn-primary" onClick={() => openStockModal(p)}>Stock</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      {/* ── Product create/edit modal ── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU *</label>
                  <input className="form-input" required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input className="form-input" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price *</label>
                  <input type="number" step="0.01" className="form-input" required value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} />
                </div>
                {!editingProduct && (
                  <div className="form-group">
                    <label className="form-label">Initial Stock *</label>
                    <input type="number" className="form-input" required value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: Number(e.target.value)})} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Min Stock Alert *</label>
                  <input type="number" className="form-input" required value={formData.minStockAlert} onChange={e => setFormData({...formData, minStockAlert: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Stock adjustment modal ── */}
      {isStockModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Adjust Stock — {stockProduct?.name}</h2>
              <button className="modal-close-btn" onClick={() => setIsStockModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleStockSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Movement Type</label>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="type" checked={stockForm.type === 'IN'} onChange={() => setStockForm({...stockForm, type: 'IN'})} />
                      <span>IN — Add Stock</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="type" checked={stockForm.type === 'OUT'} onChange={() => setStockForm({...stockForm, type: 'OUT'})} />
                      <span>OUT — Remove Stock</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input type="number" className="form-input" min="1" required value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: Number(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <input type="text" className="form-input" required placeholder="e.g. Received new shipment" value={stockForm.reason} onChange={e => setStockForm({...stockForm, reason: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsStockModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
