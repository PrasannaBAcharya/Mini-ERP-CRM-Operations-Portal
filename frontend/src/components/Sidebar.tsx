import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  icon: '⊞' },
  { to: '/customers', label: 'Customers',  icon: '👥' },
  { to: '/products',  label: 'Products',   icon: '📦' },
  { to: '/challans',  label: 'Challans',   icon: '📋' },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">E</div>
        <div>
          <div className="sidebar-logo-text">ERP CRM</div>
          <div className="sidebar-logo-sub">Management Suite</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>

        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-link-icon">{icon}</span>
            {label}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="nav-section-label">Admin</div>
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-icon">🔑</span>
              Users
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="sidebar-user-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="sidebar-user-role">{user?.role}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button
          className="btn btn-secondary"
          style={{ width: '100%', fontSize: '0.8125rem' }}
          onClick={logout}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
