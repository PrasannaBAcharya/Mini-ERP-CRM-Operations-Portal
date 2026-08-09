import React, { useEffect, useState } from 'react';
import { getCustomers } from '../api/customers';
import { getProducts } from '../api/products';
import { getChallans } from '../api/challans';
import { Link } from 'react-router-dom';
import { Challan } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalChallans: 0,
    confirmedChallans: 0,
  });
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          allCust, activeCust, allProd, allChallans, confChallans,
          recentChallansRes
        ] = await Promise.all([
          getCustomers({ page: 1, limit: 1 }),
          getCustomers({ status: 'ACTIVE', page: 1, limit: 1 }),
          getProducts({ page: 1, limit: 1 }),
          getChallans({ page: 1, limit: 1 }),
          getChallans({ status: 'CONFIRMED', page: 1, limit: 1 }),
          getChallans({ page: 1, limit: 5 })
        ]);

        // To get low stock products, we might need an API endpoint or we just show a placeholder 
        // if API doesn't support filtering by low stock. For now, 0 or fake data.
        
        setStats({
          totalCustomers: allCust.total,
          activeCustomers: activeCust.total,
          totalProducts: allProd.total,
          lowStockProducts: 0, // Placeholder
          totalChallans: allChallans.total,
          confirmedChallans: confChallans.total,
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

  if (loading) return <div className="loading-center"><div className="loading-spinner"></div></div>;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Customers</div>
          <div className="stat-value">{stats.totalCustomers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Active Customers</div>
          <div className="stat-value">{stats.activeCustomers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Products</div>
          <div className="stat-value">{stats.totalProducts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Challans</div>
          <div className="stat-value">{stats.totalChallans}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Confirmed Challans</div>
          <div className="stat-value">{stats.confirmedChallans}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Recent Challans</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Status</th>
                <th>Total Qty</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentChallans.map((challan) => (
                <tr key={challan.id}>
                  <td>{challan.challanNumber}</td>
                  <td>
                    <span className={`badge badge-${challan.status === 'CONFIRMED' ? 'success' : challan.status === 'CANCELLED' ? 'error' : 'info'}`}>
                      {challan.status}
                    </span>
                  </td>
                  <td>{challan.totalQuantity}</td>
                  <td>{new Date(challan.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/challans/${challan.id}`} className="btn btn-sm btn-secondary">View</Link>
                  </td>
                </tr>
              ))}
              {recentChallans.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">No recent challans</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
