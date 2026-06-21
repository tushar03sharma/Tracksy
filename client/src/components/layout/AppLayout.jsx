import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './AppLayout.css';

// Wraps all protected pages — Sidebar + main content area
const AppLayout = () => (
  <div className="app-layout">
    <Sidebar />
    <main className="app-main">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
