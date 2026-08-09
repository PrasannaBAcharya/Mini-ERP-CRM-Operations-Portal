import React, { useEffect, useState } from 'react';
import { getCustomers } from '../api/customers';
import { getProducts } from '../api/products';
import { getChallans } from '../api/challans';
import { Link } from 'react-router-dom';
import { Challan, Product } from '../types';

/* ── Stat card ── */
interface StatCardProps {
  icon: string;
  iconVariant: 'accent' | 'success' | 'warning' | 'danger' | 'slate';
  title: string;
  value: number | string;
  sub?: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconVariant, title, value, sub, delay = 0 }) => (
  <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
    <div className={`stat-icon-wrap ${iconVariant}`}>{icon}</div>
    <div className="stat-body">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

/* ── Skeleton stat cards ── */
const SkeletonStatCard = () => (
  <div className="stat-card">
    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
    <div className="stat-body" style={{ flex: 1 }}>
      <div className="skeleton" style={{ height: 11, width: '55%', marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 26, width: '40%' }} />
    </div>
  </div>
);

/* ── Activity icon for challan status ── */
const challanActivityIcon = (status: string) => {
  if (status === 'CONFIRMED') return { cls: 'in',      icon: '↑' };
  if (status === 'CANCELLED') return { cls: 'out',     icon: '✕' };
  return                              { cls: 'neutral', icon: '◷' };
};

/* ── Dashboard ── */
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCustomers:  0,
    activeCustomers: 0,
    totalProducts:   0,
    lowStockProducts: 0,
    totalChallans:   0,
    confirmedChallans: 0,
    draftChallans:   0,
  });
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          allCust, activeCust,
          allProd,
          allChallans, confChallans, draftChallans,
          recentChallansRes,
        ] = await Promise.all([
          getCustomers({ page: 1, limit: 1 }),
          getCustomers({ status: 'ACTIVE', page: 1, limit: 1 }),
          getProducts({ page: 1, limit: 100 }),   // fetch enough to count low stock
          getChallans({ page: 1, limit: 1 }),
          getChallans({ status: 'CONFIRMED', page: 1, limit: 1 }),
          getChallans({ status: 'DRAFT',     page: 1, limit: 1 }),
          getChallans({ page: 1, limit: 5 }),
        ]);

        const lowStock = (allProd.data as Product[]).filter(
          (p) => p.currentStock <= p.minStockAlert,
        ).length;

        setStats({
          totalCustomers:   allCust.total,
          activeCustomers:  activeCust.total,
          totalProducts:    allProd.total,
          lowStockProducts: lowStock,
          totalChallans:    allChallans.total,
          confirmedChallans: confChallans.total,
          draftChallans:    draftChallans.total,
        });
        setRecentChallans(recentChallansRes.data);
      } catch (err) {
        console.error('Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statusBadge = (status: string) => {
    if (status === 'CONFIRMED') return 'badge-success';
    if (status === 'CANCELLED') return 'badge-error';
    return 'badge-info';
  };

  return (
    <div>
      {/* ── Stat cards ── */}
      <div className="stats-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <StatCard delay={0}   icon="👥" iconVariant="accent"  title="Total Customers"   value={stats.totalCustomers}   sub={`${stats.activeCustomers} active`} />
            <StatCard delay={60}  icon="📦" iconVariant="slate"   title="Total Products"    value={stats.totalProducts}    sub={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} low stock` : 'Stock healthy'} />
            <StatCard delay={120} icon="⚠️" iconVariant="warning" title="Low Stock Alerts"  value={stats.lowStockProducts} sub="At or below min level" />
            <StatCard delay={180} icon="📋" iconVariant="success" title="Draft Challans"    value={stats.draftChallans}   sub={`${stats.confirmedChallans} confirmed`} />
          </>
        )}
      </div>

      {/* ── Two-column second row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Recent challans */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="section-header">
            <span className="section-title">Recent Challans</span>
            <Link to="/challans" className="btn btn-secondary btn-sm">View all</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="activity-item">
                  <div className="skeleton" style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 10, width: '35%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : recentChallans.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <span className="empty-state-icon">📋</span>
              <div className="empty-state-title">No challans yet</div>
            </div>
          ) : (
            <div className="activity-list">
              {recentChallans.map((c) => {
                const { cls, icon } = challanActivityIcon(c.status);
                return (
                  <div key={c.id} className="activity-item">
                    <div className={`activity-icon ${cls}`}>{icon}</div>
                    <div className="activity-body">
                      <div className="activity-title">
                        <Link to={`/challans/${c.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {c.challanNumber}
                        </Link>
                        &nbsp;
                        <span className={`badge ${statusBadge(c.status)}`} style={{ verticalAlign: 'middle' }}>
                          {c.status}
                        </span>
                      </div>
                      <div className="activity-sub">Qty: {c.totalQuantity}</div>
                    </div>
                    <div className="activity-meta">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick summary card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="section-header">
            <span className="section-title">Overview</span>
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ height: 12, width: '45%' }} />
                <div className="skeleton" style={{ height: 12, width: '20%' }} />
              </div>
            ))
          ) : (
            <div>
              {[
                { label: 'Active Customers',    value: stats.activeCustomers,   color: 'var(--success-text)' },
                { label: 'Confirmed Challans',  value: stats.confirmedChallans, color: 'var(--success-text)' },
                { label: 'Draft Challans',      value: stats.draftChallans,     color: 'var(--info-text)'    },
                { label: 'Low Stock Products',  value: stats.lowStockProducts,  color: stats.lowStockProducts > 0 ? 'var(--warning-text)' : 'var(--muted-foreground)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>{label}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
