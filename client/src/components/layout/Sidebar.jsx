import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs',      icon: Briefcase,       label: 'My Jobs'   },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile toggle button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Briefcase size={20} />
          </div>
          {!collapsed && <span className="sidebar-logo-text">Tracksy</span>}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Collapse sidebar"
        >
          <ChevronRight size={16} className={collapsed ? '' : 'rotated'} />
        </button>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={20} className="sidebar-link-icon" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <p className="sidebar-user-name">{user?.name}</p>
                <p className="sidebar-user-email">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
