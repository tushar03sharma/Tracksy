import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Building2, Briefcase, Link2, MapPin, DollarSign,
  FileText, CalendarDays, ArrowLeft, Loader2, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsAPI } from '../api';
import { ALL_STATUSES } from '../utils/statusHelpers';
import './JobForm.css';

const EMPTY_FORM = {
  company: '',
  role: '',
  status: 'Applied',
  jobLink: '',
  location: '',
  salary: '',
  notes: '',
  appliedDate: new Date().toISOString().split('T')[0],
  deadline: '',
};

const JobForm = () => {
  const { id } = useParams();          // Present → edit mode, absent → create mode
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm]       = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // In edit mode — fetch the job and pre-fill the form
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await jobsAPI.getOne(id);
        const j = res.data.data.job;
        setForm({
          company:     j.company     || '',
          role:        j.role        || '',
          status:      j.status      || 'Applied',
          jobLink:     j.jobLink     || '',
          location:    j.location    || '',
          salary:      j.salary      || '',
          notes:       j.notes       || '',
          appliedDate: j.appliedDate ? j.appliedDate.split('T')[0] : '',
          deadline:    j.deadline    ? j.deadline.split('T')[0]    : '',
        });
      } catch {
        toast.error('Failed to load job details');
        navigate('/jobs');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Client-side validation before submit
  const validate = () => {
    const errs = {};
    if (!form.company.trim())   errs.company = 'Company name is required';
    if (!form.role.trim())      errs.role    = 'Job role is required';
    if (form.jobLink && !/^https?:\/\/.+/.test(form.jobLink))
      errs.jobLink = 'Must be a valid URL (https://...)';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Remove empty optional fields before sending
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== '')
    );

    setLoading(true);
    try {
      if (isEdit) {
        await jobsAPI.update(id, payload);
        toast.success('Application updated!');
      } else {
        await jobsAPI.create(payload);
        toast.success('Application added!');
      }
      navigate('/jobs');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="full-page-loader" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="job-form-page animate-fadeIn">
      {/* Back button + title */}
      <div className="page-header">
        <div className="page-header-left">
          <Link to="/jobs" className="btn btn-ghost btn-sm back-btn">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="page-title">
              {isEdit ? 'Edit Application' : 'Add Application'}
            </h1>
            <p className="page-subtitle">
              {isEdit ? 'Update the details below' : 'Fill in the job details below'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="job-form-grid">

          {/* ── Left Column ─────────────────────────────────── */}
          <div className="form-column">

            {/* Core Info Card */}
            <div className="card card-elevated form-section">
              <h3 className="form-section-title">
                <Briefcase size={18} /> Core Details
              </h3>

              <div className="form-group">
                <label className="form-label" htmlFor="company">
                  Company <span className="required">*</span>
                </label>
                <div className="input-icon-wrap">
                  <Building2 size={16} className="field-icon" />
                  <input
                    id="company"
                    name="company"
                    type="text"
                    className={`form-input icon-input ${errors.company ? 'error' : ''}`}
                    placeholder="e.g. Google"
                    value={form.company}
                    onChange={handleChange}
                  />
                </div>
                {errors.company && <span className="field-error">{errors.company}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="role">
                  Job Role <span className="required">*</span>
                </label>
                <div className="input-icon-wrap">
                  <Briefcase size={16} className="field-icon" />
                  <input
                    id="role"
                    name="role"
                    type="text"
                    className={`form-input icon-input ${errors.role ? 'error' : ''}`}
                    placeholder="e.g. Software Engineer"
                    value={form.role}
                    onChange={handleChange}
                  />
                </div>
                {errors.role && <span className="field-error">{errors.role}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={form.status}
                    onChange={handleChange}
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="location">Location</label>
                  <div className="input-icon-wrap">
                    <MapPin size={16} className="field-icon" />
                    <input
                      id="location"
                      name="location"
                      type="text"
                      className="form-input icon-input"
                      placeholder="e.g. Remote, Bangalore"
                      value={form.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="jobLink">Job Link</label>
                <div className="input-icon-wrap">
                  <Link2 size={16} className="field-icon" />
                  <input
                    id="jobLink"
                    name="jobLink"
                    type="url"
                    className={`form-input icon-input ${errors.jobLink ? 'error' : ''}`}
                    placeholder="https://..."
                    value={form.jobLink}
                    onChange={handleChange}
                  />
                </div>
                {errors.jobLink && <span className="field-error">{errors.jobLink}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="salary">
                  Salary / Package
                </label>
                <div className="input-icon-wrap">
                  <DollarSign size={16} className="field-icon" />
                  <input
                    id="salary"
                    name="salary"
                    type="text"
                    className="form-input icon-input"
                    placeholder="e.g. 18 LPA, $120k"
                    value={form.salary}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Column ─────────────────────────────────── */}
          <div className="form-column">

            {/* Dates Card */}
            <div className="card card-elevated form-section">
              <h3 className="form-section-title">
                <CalendarDays size={18} /> Dates
              </h3>

              <div className="form-group">
                <label className="form-label" htmlFor="appliedDate">Applied Date</label>
                <div className="input-icon-wrap">
                  <CalendarDays size={16} className="field-icon" />
                  <input
                    id="appliedDate"
                    name="appliedDate"
                    type="date"
                    className="form-input icon-input date-input"
                    value={form.appliedDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="deadline">
                  Application Deadline
                </label>
                <div className="input-icon-wrap">
                  <CalendarDays size={16} className="field-icon" />
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    className="form-input icon-input date-input"
                    value={form.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="card card-elevated form-section">
              <h3 className="form-section-title">
                <FileText size={18} /> Notes
              </h3>
              <div className="form-group">
                <textarea
                  id="notes"
                  name="notes"
                  className="form-input form-textarea"
                  placeholder="Interview rounds, contacts, prep notes..."
                  value={form.notes}
                  onChange={handleChange}
                  rows={5}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <Link to="/jobs" className="btn btn-secondary btn-lg">
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 size={18} className="spin-icon" /> Saving...</>
                  : <><Save size={18} /> {isEdit ? 'Save Changes' : 'Add Application'}</>
                }
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default JobForm;
