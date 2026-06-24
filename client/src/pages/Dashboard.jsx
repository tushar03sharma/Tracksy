import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, TrendingUp, Plus, Trophy, XCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { jobsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import { STATUS_COLORS, formatDate } from '../utils/statusHelpers';
import './Dashboard.css';

// Month number → short label
const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [recentJobs, setRecent] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          jobsAPI.getStats(),
          jobsAPI.getAll({ limit: 5, sort: '-createdAt' }),
        ]);
        setStats(statsRes.data.data);
        setRecent(jobsRes.data.data.jobs);
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard animate-fadeIn">
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // Derive counts from statusStats array
  const getCount = (status) =>
    stats?.statusStats?.find(s => s._id === status)?.count || 0;

  const offerCount    = getCount('Offer');
  const rejectedCount = getCount('Rejected');
  const interviewCount= getCount('Interview');

  // Pie chart data
  const pieData = stats?.statusStats?.map(s => ({
    name: s._id, value: s.count, color: STATUS_COLORS[s._id],
  })) || [];

  // Bar chart data (monthly, reversed to show oldest → newest)
  const barData = [...(stats?.monthlyStats || [])]
    .reverse()
    .map(m => ({
      month: `${MONTH_NAMES[m._id.month]} ${String(m._id.year).slice(2)}`,
      Applications: m.count,
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <p className="chart-tooltip-value">{payload[0].value} apps</p>
      </div>
    );
  };

  return (
    <div className="dashboard animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {getGreeting()},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">Here's your job search overview</p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">
          <Plus size={18} /> Add Application
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard icon={Briefcase}    label="Total Applications" value={stats?.total || 0}  color="#0ea5e9" />
        <StatCard icon={TrendingUp}   label="In Progress"        value={interviewCount}       color="#f59e0b" />
        <StatCard icon={Trophy}       label="Offers Received"    value={offerCount}           color="#22c55e" />
        <StatCard icon={XCircle}      label="Rejected"           value={rejectedCount}        color="#ef4444" />
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Monthly Bar Chart */}
        <div className="card card-elevated chart-card">
          <h3 className="chart-title">Monthly Applications</h3>
          {barData.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No data yet. Start adding applications!</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={28}>
                <XAxis
                  dataKey="month"
                  stroke="transparent"
                  tick={{ fill: '#8888aa', fontSize: 12 }}
                />
                <YAxis
                  stroke="transparent"
                  tick={{ fill: '#8888aa', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(14,165,233,0.08)' }} />
                <Bar dataKey="Applications" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Pie Chart */}
        <div className="card card-elevated chart-card">
          <h3 className="chart-title">By Status</h3>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <p>No data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#16161f',
                    border: '1px solid #2a2a3a',
                    borderRadius: '8px',
                    color: '#f0f0ff',
                    fontSize: '0.82rem',
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ color: '#8888aa', fontSize: '0.8rem' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card card-elevated">
        <div className="section-header">
          <h3>Recent Applications</h3>
          <Link to="/jobs" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recentJobs.length === 0 ? (
          <div className="empty-state">
            <Briefcase size={40} />
            <p>No applications yet</p>
            <Link to="/jobs/new" className="btn btn-primary btn-sm">
              <Plus size={16} /> Add your first
            </Link>
          </div>
        ) : (
          <div className="recent-jobs-list">
            {recentJobs.map((job) => (
              <Link key={job._id} to={`/jobs/${job._id}`} className="recent-job-row">
                <div className="recent-job-info">
                  <div className="recent-job-company">{job.company}</div>
                  <div className="recent-job-role">{job.role}</div>
                </div>
                <div className="recent-job-meta">
                  <StatusBadge status={job.status} />
                  <span className="recent-job-date">{formatDate(job.appliedDate)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default Dashboard;
