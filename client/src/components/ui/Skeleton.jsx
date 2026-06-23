import './Skeleton.css';

// Reusable skeleton block pass width/height to customize
const Skeleton = ({ width = '100%', height = '16px', radius = '6px', className = '' }) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius: radius }}
  />
);

// Pre-built skeleton for a stat card
export const StatCardSkeleton = () => (
  <div className="card skeleton-stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <Skeleton width="44px" height="44px" radius="8px" />
      <Skeleton width="40px" height="22px" radius="999px" />
    </div>
    <Skeleton width="60px" height="32px" radius="6px" style={{ marginBottom: '0.5rem' }} />
    <Skeleton width="100px" height="14px" />
  </div>
);

// Pre-built skeleton for a table row
export const JobRowSkeleton = () => (
  <tr className="skeleton-row">
    <td><Skeleton width="120px" height="14px" /></td>
    <td><Skeleton width="160px" height="14px" /></td>
    <td><Skeleton width="80px"  height="24px" radius="999px" /></td>
    <td><Skeleton width="80px"  height="14px" /></td>
    <td><Skeleton width="24px"  height="24px" radius="6px" /></td>
    <td>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <Skeleton width="28px" height="28px" radius="6px" />
        <Skeleton width="28px" height="28px" radius="6px" />
      </div>
    </td>
  </tr>
);

export default Skeleton;
