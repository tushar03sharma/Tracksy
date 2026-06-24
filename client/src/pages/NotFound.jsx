import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import './NotFound.css';

const NotFound = () => (
  <div className="notfound-page">
    <div className="notfound-card animate-fadeInUp">
      <div className="notfound-icon">
        <SearchX size={52} />
      </div>
      <h1 className="notfound-code">404</h1>
      <h2 className="notfound-title">Page Not Found</h2>
      <p className="notfound-desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary btn-lg">
        <Home size={18} /> Back to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
