import { useState, useEffect, useCallback } from 'react';
import { Mail, CheckCircle, XCircle, RefreshCw, Unlink, Clock, Zap, AlertCircle } from 'lucide-react';
import { gmailAPI } from '../api';
import toast from 'react-hot-toast';
import './GmailSettings.css';

// ── Status badge text per job status ─────────────────────────────────────────
const STATUS_COLORS = {
  Applied: 'badge-applied',
  OA: 'badge-oa',
  Interview: 'badge-interview',
  Offer: 'badge-offer',
  Rejected: 'badge-rejected',
};

const GmailSettings = () => {
  const [status, setStatus] = useState(null);   // { connected, lastChecked, recentUpdates }
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // ── Fetch current Gmail status ──────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await gmailAPI.getStatus();
      setStatus(res.data.data);
    } catch {
      toast.error('Failed to load Gmail status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Check for ?connected=true in URL (redirect back from OAuth)
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast.success('Gmail connected successfully! 🎉 First scan starts in a few seconds.');
      // Clean up URL
      window.history.replaceState({}, '', '/settings/gmail');
    }
  }, [fetchStatus]);

  // ── Connect Gmail ───────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await gmailAPI.getAuthUrl();
      window.location.href = res.data.data.url; // Redirect to Google consent
    } catch {
      toast.error('Could not initiate Gmail connection.');
      setConnecting(false);
    }
  };

  // ── Scan Now ────────────────────────────────────────────────────────────────
  const handleScanNow = async () => {
    setScanning(true);
    try {
      const res = await gmailAPI.scanNow();
      const { message } = res.data.data;
      toast.success(message);
      await fetchStatus(); // Refresh activity log
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed.');
    } finally {
      setScanning(false);
    }
  };

  // ── Disconnect ──────────────────────────────────────────────────────────────
  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Gmail? Auto status updates will stop.')) return;
    setDisconnecting(true);
    try {
      await gmailAPI.disconnect();
      toast.success('Gmail disconnected.');
      setStatus((prev) => ({ ...prev, connected: false, lastChecked: null }));
    } catch {
      toast.error('Failed to disconnect Gmail.');
    } finally {
      setDisconnecting(false);
    }
  };

  // ── Format relative time ────────────────────────────────────────────────────
  const formatRelative = (date) => {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="gmail-settings animate-fadeIn">
        <div className="gmail-settings-skeleton">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-body" />
          <div className="skeleton-line skeleton-body short" />
        </div>
      </div>
    );
  }

  return (
    <div className="gmail-settings animate-fadeInUp">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Email Sync</h1>
          <p className="page-subtitle">
            Automatically detect status changes from your job application emails.
          </p>
        </div>
      </div>

      {/* Connection Card */}
      <div className="gmail-card card card-elevated">
        <div className="gmail-card-header">
          <div className="gmail-icon-wrap">
            <Mail size={24} />
          </div>
          <div className="gmail-card-info">
            <h3>Gmail Integration</h3>
            <p className="gmail-card-desc">
              Connect your Gmail to let Tracksy scan for application confirmations,
              interview invitations, assessments, and rejections — automatically.
            </p>
          </div>
          <div className={`gmail-status-pill ${status?.connected ? 'connected' : 'disconnected'}`}>
            {status?.connected ? (
              <><CheckCircle size={14} /> Connected</>
            ) : (
              <><XCircle size={14} /> Not Connected</>
            )}
          </div>
        </div>

        {status?.connected && (
          <div className="gmail-meta">
            <div className="gmail-meta-item">
              <Clock size={14} />
              <span>Last scanned: <strong>{formatRelative(status.lastChecked)}</strong></span>
            </div>
            <div className="gmail-meta-item">
              <Zap size={14} />
              <span>Auto-scans every <strong>15 minutes</strong></span>
            </div>
          </div>
        )}

        <div className="gmail-card-actions">
          {status?.connected ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handleScanNow}
                disabled={scanning}
              >
                <RefreshCw size={16} className={scanning ? 'spin' : ''} />
                {scanning ? 'Scanning...' : 'Scan Now'}
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                <Unlink size={16} />
                {disconnecting ? 'Disconnecting...' : 'Disconnect Gmail'}
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleConnect}
              disabled={connecting}
            >
              <Mail size={18} />
              {connecting ? 'Redirecting to Google...' : 'Connect Gmail'}
            </button>
          )}
        </div>
      </div>

      {/* How it works */}
      {!status?.connected && (
        <div className="gmail-how-it-works card">
          <h4>How it works</h4>
          <div className="gmail-steps">
            {[
              { icon: '1', text: 'Click "Connect Gmail" and approve read-only access on Google\'s consent screen.' },
              { icon: '2', text: 'Tracksy scans your inbox every 15 minutes for job-related emails.' },
              { icon: '3', text: 'When a matching email is found (interview invite, rejection, etc.), your job status updates automatically.' },
              { icon: '4', text: 'View the full change history on any job\'s detail page.' },
            ].map((step) => (
              <div key={step.icon} className="gmail-step">
                <div className="gmail-step-num">{step.icon}</div>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
          <div className="gmail-privacy-note">
            <AlertCircle size={14} />
            <span>
              Tracksy only reads email subjects and bodies to detect job signals. 
              No emails are stored. You can disconnect at any time.
            </span>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {status?.connected && (
        <div className="gmail-activity card">
          <div className="gmail-activity-header">
            <h3>Auto-Detected Changes</h3>
            <span className="gmail-activity-count">
              {status.recentUpdates?.length || 0} recent updates
            </span>
          </div>

          {!status.recentUpdates?.length ? (
            <div className="gmail-activity-empty">
              <Mail size={40} />
              <p>No auto-detected changes yet.</p>
              <span>
                Updates appear here when Tracksy detects job emails. Try{' '}
                <button className="gmail-inline-btn" onClick={handleScanNow}>
                  scanning now
                </button>
                .
              </span>
            </div>
          ) : (
            <div className="gmail-activity-list">
              {status.recentUpdates.map((update, i) => (
                <div key={i} className="gmail-activity-item">
                  <div className="gmail-activity-left">
                    <Mail size={16} className="gmail-activity-icon" />
                    <div>
                      <p className="gmail-activity-company">
                        {update.company} — <em>{update.role}</em>
                      </p>
                      {update.statusHistory?.note && (
                        <p className="gmail-activity-note">{update.statusHistory.note}</p>
                      )}
                    </div>
                  </div>
                  <div className="gmail-activity-right">
                    <span className={`badge ${STATUS_COLORS[update.statusHistory?.status]}`}>
                      {update.statusHistory?.status}
                    </span>
                    <span className="gmail-activity-time">
                      {formatRelative(update.statusHistory?.changedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GmailSettings;
