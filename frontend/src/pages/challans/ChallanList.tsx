import React, { useState, useEffect } from 'react';
import { getChallans } from '../../api/challans';
import { Challan, ChallanStatus } from '../../types';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import TableSkeleton from '../../components/TableSkeleton';
import EmptyState from '../../components/EmptyState';

const statusBadgeClass = (status: ChallanStatus): string => {
  switch (status) {
    case 'CONFIRMED': return 'badge-success';
    case 'DRAFT':     return 'badge-info';
    case 'CANCELLED': return 'badge-error';
    default:          return 'badge-gray';
  }
};

const ChallanList: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { showToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await getChallans({ status: statusFilter || undefined, page });
      setChallans(res.data);
      setTotalPages(res.totalPages);
    } catch (err) {
      showToast('Failed to fetch challans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => { fetchChallans(); }, 300);
    return () => clearTimeout(delay);
  }, [statusFilter, page]);

  return (
    <div>
      <div className="page-header">
        <h2>Challans</h2>
        {(user?.role === 'ADMIN' || user?.role === 'SALES') && (
          <button className="btn btn-primary" onClick={() => navigate('/challans/new')}>
            ＋ New Challan
          </button>
        )}
      </div>

      <div className="card">
        <div className="filters-bar">
          <select
            className="form-select"
            style={{ width: 200 }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total Qty</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton columns={6} rows={6} />
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon="📋"
                      title="No challans found"
                      description={statusFilter ? `No ${statusFilter.toLowerCase()} challans match your filter.` : 'Create your first challan to get started.'}
                      action={(user?.role === 'ADMIN' || user?.role === 'SALES') ? (
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/challans/new')}>New Challan</button>
                      ) : undefined}
                    />
                  </td>
                </tr>
              ) : (
                challans.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem' }}>
                      {c.challanNumber}
                    </td>
                    <td>{c.customer?.name ?? c.customerId}</td>
                    <td>
                      <span className={`badge ${statusBadgeClass(c.status)}`}>{c.status}</span>
                    </td>
                    <td>{c.totalQuantity}</td>
                    <td style={{ color: 'var(--muted-foreground)' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="btn-group">
                        <Link to={`/challans/${c.id}`} className="btn btn-sm btn-secondary">View</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </div>
  );
};

export default ChallanList;
