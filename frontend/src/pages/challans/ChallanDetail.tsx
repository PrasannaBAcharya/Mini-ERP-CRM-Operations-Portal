import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChallan, confirmChallan, cancelChallan } from '../../api/challans';
import { Challan, ChallanStatus } from '../../types';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';

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

  // Confirm dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

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

  useEffect(() => { fetchChallan(); }, [id]);

  // ── Confirm (called after dialog confirmed) ───────────────────────────────
  const handleConfirm = async () => {
    if (!challan) return;
    setConfirming(true);
    try {
      await confirmChallan(challan.id);
      showToast(`${challan.challanNumber} confirmed successfully`, 'success');
      setConfirmDialogOpen(false);
      fetchChallan();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to confirm challan';
      showToast(msg, 'error');
      setConfirmDialogOpen(false);
    } finally {
      setConfirming(false);
    }
  };

  // ── Cancel (called after dialog confirmed) ────────────────────────────────
  const handleCancel = async () => {
    if (!challan) return;
    setCancelling(true);
    try {
      await cancelChallan(challan.id);
      showToast(`${challan.challanNumber} cancelled`, 'success');
      setCancelDialogOpen(false);
      fetchChallan();
    } catch (err) {
      showToast('Failed to cancel challan', 'error');
      setCancelDialogOpen(false);
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
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
          <h2 style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
            {challan.challanNumber}
          </h2>
          <span className={`badge ${statusBadgeClass(challan.status)}`}>{challan.status}</span>
        </div>

        <div className="btn-group">
          {challan.status === 'DRAFT' && (user?.role === 'ADMIN' || user?.role === 'SALES') && (
            <button
              className="btn btn-primary"
              onClick={() => setConfirmDialogOpen(true)}
              disabled={confirming || cancelling}
            >
              Confirm Challan
            </button>
          )}
          {(challan.status === 'DRAFT' || challan.status === 'CONFIRMED') && user?.role === 'ADMIN' && (
            <button
              className="btn btn-danger"
              onClick={() => setCancelDialogOpen(true)}
              disabled={confirming || cancelling}
            >
              Cancel Challan
            </button>
          )}
        </div>
      </div>

      {/* ── Info Cards ──────────────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '0.9375rem' }}>
            Customer
          </h3>
          <p style={{ marginBottom: '0.375rem' }}><strong>Name:</strong> {challan.customer?.name ?? challan.customerId}</p>
          {challan.customer?.businessName && (
            <p style={{ marginBottom: '0.375rem' }}><strong>Business:</strong> {challan.customer.businessName}</p>
          )}
          {challan.customer?.mobile && (
            <p style={{ marginBottom: '0.375rem' }}><strong>Mobile:</strong> {challan.customer.mobile}</p>
          )}
          {challan.customer?.gstNumber && (
            <p style={{ marginBottom: '0.375rem' }}><strong>GST:</strong> {challan.customer.gstNumber}</p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '0.9375rem' }}>
            Challan Details
          </h3>
          <p style={{ marginBottom: '0.375rem' }}><strong>Challan No:</strong> <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{challan.challanNumber}</span></p>
          <p style={{ marginBottom: '0.375rem' }}><strong>Total Qty:</strong> {challan.totalQuantity} unit(s)</p>
          <p style={{ marginBottom: '0.375rem' }}><strong>Created:</strong> {new Date(challan.createdAt).toLocaleString()}</p>
          <p style={{ marginBottom: '0.375rem' }}><strong>Updated:</strong> {new Date(challan.updatedAt).toLocaleString()}</p>
          <p><strong>Created By:</strong> {challan.createdBy}</p>
        </div>
      </div>

      {/* ── Line Items ──────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="section-header">
          <span className="section-title">Line Items</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
            {challan.items?.length ?? 0} item(s)
          </span>
        </div>

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
                      <td style={{ fontWeight: 500 }}>{item.productNameSnapshot}</td>
                      <td><span className="badge badge-gray">{item.skuSnapshot}</span></td>
                      <td>₹{parseFloat(item.unitPriceSnapshot).toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 500 }}>₹{(parseFloat(item.unitPriceSnapshot) * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--muted)' }}>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600, color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                      Grand Total
                    </td>
                    <td style={{ fontWeight: 700 }}>{challan.totalQuantity} units</td>
                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>₹{grandTotal.toFixed(2)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <span className="empty-state-icon">📦</span>
                      <div className="empty-state-title">No items on this challan</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirm challan dialog ─────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        variant="accent"
        title="Confirm this challan?"
        description={`This will deduct stock for all ${challan.items?.length ?? 0} item(s) in ${challan.challanNumber}. This action cannot be undone.`}
        confirmLabel="Yes, Confirm"
        cancelLabel="Go back"
        loading={confirming}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialogOpen(false)}
      />

      {/* ── Cancel challan dialog ──────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        variant="danger"
        title="Cancel this challan?"
        description={
          challan.status === 'CONFIRMED'
            ? `Cancelling ${challan.challanNumber} will restore stock for all items. This cannot be undone.`
            : `Cancel draft challan ${challan.challanNumber}? It will be marked as Cancelled.`
        }
        confirmLabel="Yes, Cancel Challan"
        cancelLabel="Go back"
        loading={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setCancelDialogOpen(false)}
      />
    </div>
  );
};

export default ChallanDetail;
