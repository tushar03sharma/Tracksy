import { getBadgeClass, STATUS_LABELS } from '../../utils/statusHelpers';

// Displays a colored pill for any job status
const StatusBadge = ({ status }) => (
  <span className={`badge ${getBadgeClass(status)}`}>
    <span className="badge-dot" />
    {STATUS_LABELS[status] || status}
  </span>
);

export default StatusBadge;
