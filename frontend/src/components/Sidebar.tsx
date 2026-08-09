import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        ERP CRM
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Customers
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Products
        </NavLink>
        <NavLink to="/challans" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Challans
        </NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Users
          </NavLink>
        )}
      </nav>
      <div className="sidebar-footer">
        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
          {user?.email}
        </div>
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
