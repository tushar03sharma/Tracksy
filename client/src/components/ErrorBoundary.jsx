import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import '../pages/NotFound.css';

// Class component required — React error boundaries only work as class components
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to a service like Sentry
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary-page">
        <div className="error-boundary-card">
          <div className="error-boundary-icon">
            <AlertTriangle size={40} />
          </div>
          <h2>Something went wrong</h2>
          <p className="error-boundary-msg">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button className="btn btn-primary" onClick={this.handleReset}>
            <RefreshCw size={16} /> Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
