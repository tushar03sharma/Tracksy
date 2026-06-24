import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

// This page is only ever visited via redirect from the backend after Google login
// URL looks like: /auth/callback?token=eyJ...
const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const token    = searchParams.get('token');
      const error    = searchParams.get('error');

      // Backend signalled an error
      if (error) {
        toast.error('Google sign-in failed. Please try again.');
        navigate('/login');
        return;
      }

      // No token in URL
      if (!token) {
        toast.error('Authentication failed. No token received.');
        navigate('/login');
        return;
      }

      try {
        // Token is valid — fetch the user profile using it
        // The axios interceptor will attach it automatically since
        // we temporarily store it before calling login()
        localStorage.setItem('token', token);
        const res = await authAPI.getMe();
        const user = res.data.data.user;

        // Store in AuthContext (also persists to localStorage)
        login(token, user);
        toast.success(`Welcome, ${user.name}! 👋`);
        navigate('/dashboard');
      } catch {
        localStorage.removeItem('token');
        toast.error('Authentication failed. Please try again.');
        navigate('/login');
      }
    };

    handleCallback();
  }, []); // eslint-disable-line

  // Show a full-page spinner while processing
  return (
    <div className="full-page-loader">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Signing you in with Google...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
