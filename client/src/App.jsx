import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobForm from './pages/JobForm';
import JobDetail from './pages/JobDetail';
import NotFound from './pages/NotFound';
import AuthCallback from './pages/AuthCallback';

function App() {
  return (
    <BrowserRouter>
      {/* Catches any render crash in the entire app tree */}
      <ErrorBoundary>
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
            <Route path="/"             element={<Navigate to="/dashboard" replace />} />
            <Route path="/login"        element={<Login />} />
            <Route path="/register"     element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected — rendered inside AppLayout (Sidebar + main) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard"       element={<Dashboard />} />
                <Route path="/jobs"            element={<Jobs />} />
                <Route path="/jobs/new"        element={<JobForm />} />
                <Route path="/jobs/:id"        element={<JobDetail />} />
                <Route path="/jobs/:id/edit"   element={<JobForm />} />
              </Route>
            </Route>

            {/* 404 — catches all unmatched routes */}
            <Route path="/404" element={<NotFound />} />
            <Route path="*"    element={<Navigate to="/404" replace />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
