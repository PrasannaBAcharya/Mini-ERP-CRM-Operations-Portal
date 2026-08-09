import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChallan, confirmChallan, cancelChallan } from '../../api/challans';
import { Challan, ChallanStatus } from '../../types';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

const statusBadgeClass = (status: ChallanStatus): string => {
  switch (status) {
    case 'CONFIRMED': return 'badge-success';
    case 'DRAFT':     return 'badge-info';
    case 'CANCELLED': return 'badge-error';
    default:          return 'badge-gray';
  }
};

const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchChallan = async () => {
    try {
      if (id) {
        const res = await getChallan(id);
        setChallan(res);
      }
    } catch (err) {
      showToast('Failed to fetch challan details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!challan) return;
    setConfirming(true);
    try {
      await confirmChallan(challan.id);
      showToast(`${challan.challanNumber} confirmed successfully`, 'success');
      fetchChallan();
    } catch (err: any) {
      // Show server's specific stock-error message in the toast
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to confirm challan';
      showToast(msg, 'error');
    } finally {
      setConfirming(false);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!challan) return;
    if (!window.confirm(`Cancel challan ${challan.challanNumber}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      await cancelChallan(challan.id);
      showToast(`${challan.challanNumber} cancelled`, 'success');
      fetchChallan();
    } catch (err) {
      showToast('Failed to cancel challan', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <div className="loading-center"><div className="loading-spinner"></div></div>;
  if (!challan)  return <div>Challan not found</div>;

  const grandTotal = challan.items
    ? challan.items.reduce(
        (sum, item) => sum + parseFloat(item.unitPriceSnapshot) * item.quantity,
        0
      )
    : 0;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
          <h2>{challan.challanNumber}</h2>
          <span className={`badge ${statusBadgeClass(challan.status)}`}>
            {challan.status}
          </span>
        </div>

        {/* Action buttons — based on status and role */}
        <div className="btn-group">
          {challan.status === 'DRAFT' && (user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <button
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={confirming || cancelling}
            >
              {confirming ? 'Confirming...' : 'Confirm'}
            </button>
          )}
          {(challan.status === 'DRAFT' || challan.status === 'CONFIRMED') && user?.role === 'ADMIN' && (
            <button
              className="btn btn-danger"
              onClick={handleCancel}
              disabled={confirming || cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Challan'}
            </button>
          )}
        </div>
      </div>

      {/* ── Info Cards ──────────────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Customer
          </h3>
          <p><strong>Name:</strong> {challan.customer?.name ?? challan.customerId}</p>
          {challan.customer?.businessName && (
            <p><strong>Business:</strong> {challan.customer.businessName}</p>
          )}
          {challan.customer?.mobile && (
            <p><strong>Mobile:</strong> {challan.customer.mobile}</p>
          )}
          {challan.customer?.gstNumber && (
            <p><strong>GST:</strong> {challan.customer.gstNumber}</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Challan Details
          </h3>
          <p><strong>Challan No:</strong> {challan.challanNumber}</p>
          <p><strong>Status:</strong> {challan.status}</p>
          <p><strong>Total Qty:</strong> {challan.totalQuantity} unit(s)</p>
          <p><strong>Created:</strong> {new Date(challan.createdAt).toLocaleString()}</p>
          <p><strong>Updated:</strong> {new Date(challan.updatedAt).toLocaleString()}</p>
          <p><strong>Created By:</strong> {challan.createdBy}</p>
        </div>
      </div>

      {/* ── Line Items ──────────────────────────────────────────────────────── */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Line Items</h3>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Unit Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items && challan.items.length > 0 ? (
                <>
                  {challan.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.productNameSnapshot}</td>
                      <td><span className="badge badge-gray">{item.skuSnapshot}</span></td>
                      <td>₹{parseFloat(item.unitPriceSnapshot).toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td>₹{(parseFloat(item.unitPriceSnapshot) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Grand total row */}
                  <tr style={{ borderTop: '2px solid #e5e7eb', fontWeight: 700 }}>
                    <td colSpan={3} style={{ textAlign: 'right', color: '#374151' }}>Grand Total</td>
                    <td>{challan.totalQuantity} units</td>
                    <td>₹{grandTotal.toFixed(2)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={5} className="empty-state">No items on this challan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChallanDetail;
