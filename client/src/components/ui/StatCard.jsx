import './StatCard.css';

// Dashboard metric card — icon, value, label, optional trend
const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="stat-card animate-fadeInUp">
    <div className="stat-card-top">
      <div className="stat-icon" style={{ '--icon-color': color }}>
        <Icon size={22} />
      </div>
      {trend !== undefined && (
        <span className={`stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}
        </span>
      )}
    </div>
    <p className="stat-value">{value}</p>
    <p className="stat-label">{label}</p>
  </div>
);

export default StatCard;
