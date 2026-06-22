import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobForm from './pages/JobForm';
import JobDetail from './pages/JobDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16161f',
              color: '#f0f0ff',
              border: '1px solid #2a2a3a',
              borderRadius: '10px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#16161f' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#16161f' } },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — renders inside AppLayout (Sidebar + main) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"       element={<Dashboard />} />
              <Route path="/jobs"            element={<Jobs />} />
              <Route path="/jobs/new"        element={<JobForm />} />
              <Route path="/jobs/:id"        element={<JobDetail />} />
              <Route path="/jobs/:id/edit"   element={<JobForm />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
