import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/customers')) return 'Customers';
    if (path.startsWith('/products')) return 'Products';
    if (path.startsWith('/challans')) return 'Challans';
    if (path.startsWith('/users')) return 'Users';
    return 'ERP CRM';
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{getPageTitle()}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 500 }}>{user?.name}</span>
            <span className="badge badge-info">{user?.role}</span>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
