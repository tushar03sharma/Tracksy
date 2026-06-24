import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, SlidersHorizontal, Briefcase,
  ExternalLink, Pencil, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsAPI } from '../api';
import StatusBadge from '../components/ui/StatusBadge';
import { JobRowSkeleton } from '../components/ui/Skeleton';
import { ALL_STATUSES, formatDate } from '../utils/statusHelpers';
import './Jobs.css';

const SORT_OPTIONS = [
  { value: '-appliedDate', label: 'Newest First' },
  { value: 'appliedDate',  label: 'Oldest First' },
  { value: 'company',      label: 'Company A–Z'  },
  { value: '-company',     label: 'Company Z–A'  },
];

const Jobs = () => {
  const [jobs, setJobs]         = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sort,   setSort]   = useState('-appliedDate');
  const [page,   setPage]   = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort, page, limit: 8 };
      if (search.trim()) params.search = search.trim();
      if (status !== 'All') params.status = status;
      const res = await jobsAPI.getAll(params);
      setJobs(res.data.data.jobs);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [search, status, sort, page]);

  // Debounce search — wait 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchJobs();
    }, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line

  // Immediate fetch on filter/sort/page change
  useEffect(() => { fetchJobs(); }, [status, sort, page]); // eslint-disable-line

  const handleDelete = async (id, company) => {
    if (!window.confirm(`Delete application for ${company}?`)) return;
    setDeleting(id);
    try {
      await jobsAPI.delete(id);
      toast.success('Application deleted');
      fetchJobs();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="jobs-page animate-fadeIn">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Applications</h1>
          <p className="page-subtitle">
            {pagination.total ?? 0} total application{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/jobs/new" className="btn btn-primary">
          <Plus size={18} /> Add New
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar card">
        {/* Search */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters-right">
          {/* Status filter */}
          <div className="filter-group">
            <SlidersHorizontal size={15} />
            <select
              className="form-select filter-select"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="All">All Statuses</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Sort */}
          <select
            className="form-select filter-select"
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="jobs-table-wrapper card card-elevated">
          <table className="jobs-table">
            <thead><tr>
              <th>Company</th><th>Role</th><th>Status</th>
              <th>Applied</th><th>Link</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {[...Array(5)].map((_, i) => <JobRowSkeleton key={i} />)}
            </tbody>
          </table>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card empty-state">
          <Briefcase size={48} />
          <h3>No applications found</h3>
          <p>{search || status !== 'All' ? 'Try adjusting your filters' : 'Start by adding your first job application'}</p>
          {!search && status === 'All' && (
            <Link to="/jobs/new" className="btn btn-primary">
              <Plus size={16} /> Add Application
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="jobs-table-wrapper card card-elevated">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="job-row">
                    <td className="job-company">{job.company}</td>
                    <td className="job-role">{job.role}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td className="job-date">{formatDate(job.appliedDate)}</td>
                    <td>
                      {job.jobLink ? (
                        <a
                          href={job.jobLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm job-link-btn"
                          title="Open job link"
                        >
                          <ExternalLink size={14} />
                        </a>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <div className="job-actions">
                        <Link
                          to={`/jobs/${job._id}/edit`}
                          className="btn btn-ghost btn-sm"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          className="btn btn-danger btn-sm"
                          title="Delete"
                          onClick={() => handleDelete(job._id, job.company)}
                          disabled={deleting === job._id}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="pagination-info">
                Page {page} of {pagination.pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page === pagination.pages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Jobs;
