import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Trash2, Building2, MapPin,
  DollarSign, CalendarDays, Link2, FileText, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsAPI } from '../api';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../utils/statusHelpers';
import './JobDetail.css';

const DetailRow = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="detail-row">
      <div className="detail-label">
        <Icon size={15} />
        <span>{label}</span>
      </div>
      <div className="detail-value">{value}</div>
    </div>
  );
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await jobsAPI.getOne(id);
        setJob(res.data.data.job);
      } catch {
        toast.error('Job not found');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete application for ${job.company}?`)) return;
    setDeleting(true);
    try {
      await jobsAPI.delete(id);
      toast.success('Application deleted');
      navigate('/jobs');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="full-page-loader" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="job-detail-page animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/jobs" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="page-title">{job.company}</h1>
            <p className="page-subtitle">{job.role}</p>
          </div>
        </div>
        <div className="detail-actions">
          <Link to={`/jobs/${id}/edit`} className="btn btn-secondary">
            <Pencil size={16} /> Edit
          </Link>
          <button
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? <><Loader2 size={16} className="spin-icon" /> Deleting...</>
              : <><Trash2 size={16} /> Delete</>
            }
          </button>
        </div>
      </div>

      <div className="job-detail-grid">
        {/* Main Card */}
        <div className="card card-elevated detail-main">
          <div className="detail-status-row">
            <StatusBadge status={job.status} />
            <span className="detail-timestamp">
              Added {formatDate(job.createdAt)}
            </span>
          </div>

          <div className="detail-info">
            <DetailRow icon={Building2}    label="Company"     value={job.company} />
            <DetailRow icon={MapPin}       label="Location"    value={job.location} />
            <DetailRow icon={DollarSign}   label="Salary"      value={job.salary} />
            <DetailRow icon={CalendarDays} label="Applied"     value={formatDate(job.appliedDate)} />
            <DetailRow icon={CalendarDays} label="Deadline"    value={formatDate(job.deadline)} />
            {job.jobLink && (
              <div className="detail-row">
                <div className="detail-label">
                  <Link2 size={15} />
                  <span>Job Link</span>
                </div>
                <a
                  href={job.jobLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="detail-link"
                >
                  Open listing ↗
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Notes Card */}
        {job.notes && (
          <div className="card card-elevated detail-notes">
            <h3 className="form-section-title" style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              <FileText size={18} /> Notes
            </h3>
            <p className="notes-text">{job.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
