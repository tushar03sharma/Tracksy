// Maps status values to CSS badge classes and display labels
export const getBadgeClass = (status) => {
  const map = {
    Applied:   'badge-applied',
    OA:        'badge-oa',
    Interview: 'badge-interview',
    Offer:     'badge-offer',
    Rejected:  'badge-rejected',
  };
  return map[status] || 'badge-applied';
};

export const STATUS_LABELS = {
  Applied:   'Applied',
  OA:        'Online Assessment',
  Interview: 'Interview',
  Offer:     'Offer',
  Rejected:  'Rejected',
};

export const ALL_STATUSES = ['Applied', 'OA', 'Interview', 'Offer', 'Rejected'];

// Status color for charts
export const STATUS_COLORS = {
  Applied:   '#38bdf8',
  OA:        '#f59e0b',
  Interview: '#f97316',
  Offer:     '#10b981',
  Rejected:  '#ef4444',
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};
