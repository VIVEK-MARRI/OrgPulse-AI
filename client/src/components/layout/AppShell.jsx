import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
