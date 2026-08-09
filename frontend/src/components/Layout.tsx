import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/products':  'Products',
  '/challans':  'Challans',
  '/users':     'Users',
};

const Layout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    for (const [prefix, title] of Object.entries(PAGE_TITLES)) {
      if (path.startsWith(prefix)) return title;
    }
    return 'ERP CRM';
  };

  const roleBadgeClass = () => {
    switch (user?.role) {
      case 'ADMIN':     return 'badge-info';
      case 'SALES':     return 'badge-success';
      case 'WAREHOUSE': return 'badge-warning';
      case 'ACCOUNTS':  return 'badge-gray';
      default:          return 'badge-gray';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="top-header-left">
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="top-header-right">
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>
              {user?.name}
            </span>
            <span className={`badge ${roleBadgeClass()}`}>{user?.role}</span>
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
