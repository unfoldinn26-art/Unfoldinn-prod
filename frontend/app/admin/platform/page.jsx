'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Database,
  MessageSquare,
  Star,
  CalendarClock,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  Send,
  Trash2,
  Plus
} from 'lucide-react';
import {
  getAdminThreads,
  replyToAdminThread,
  getAdminReviews,
  moderateAdminReview,
  getMentorAvailabilityAdmin,
  updateMentorAvailabilityAdmin,
  addMentorTimeOffAdmin,
  deleteMentorTimeOffAdmin,
  getAdminSystemStatus,
  triggerAdminDrBackup,
  createAdminRefund
} from '../../../lib/adminApi';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminPlatformPage() {
  const [activeTab, setActiveTab] = useState('backups'); // 'backups' | 'mentor' | 'messages' | 'reviews' | 'refunds'
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  const [systemStatus, setSystemStatus] = useState({
    backupRuns: [],
    auditLogs: [],
    refunds: [],
    paymentOrders: []
  });
  const [mentorData, setMentorData] = useState({ mentor: null, availabilities: [], timeOffs: [] });
  const [threads, setThreads] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Interactive states
  const [runningBackup, setRunningBackup] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [timeOffForm, setTimeOffForm] = useState({ startAt: '', endAt: '', reason: '' });
  const [refundForm, setRefundForm] = useState({ paymentOrderId: '', amount: '', reason: '' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sysRes, availRes, threadRes, revRes] = await Promise.all([
        getAdminSystemStatus().catch(() => ({ backupRuns: [], auditLogs: [], refunds: [], paymentOrders: [] })),
        getMentorAvailabilityAdmin().catch(() => ({ mentor: null, availabilities: [], timeOffs: [] })),
        getAdminThreads().catch(() => ({ data: [] })),
        getAdminReviews().catch(() => ({ data: [] }))
      ]);
      setSystemStatus({
        backupRuns: sysRes.backupRuns || [],
        auditLogs: sysRes.auditLogs || [],
        refunds: sysRes.refunds || [],
        paymentOrders: sysRes.paymentOrders || []
      });
      setMentorData({
        mentor: availRes.mentor || null,
        availabilities: availRes.availabilities || [],
        timeOffs: availRes.timeOffs || []
      });
      setThreads(threadRes.data || []);
      setReviews(revRes.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleRunBackup = async () => {
    setRunningBackup(true);
    setNotice(null);
    try {
      const res = await triggerAdminDrBackup();
      setNotice({ type: 'success', text: res.message || 'Encrypted DR backup completed & verified.' });
      await loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Backup failed.' });
    } finally {
      setRunningBackup(false);
    }
  };

  const handleToggleDay = async (avail) => {
    try {
      await updateMentorAvailabilityAdmin({ dayOfWeek: avail.dayOfWeek, isActive: !avail.isActive });
      await loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleToggleAcceptingBookings = async () => {
    if (!mentorData.mentor) return;
    try {
      await updateMentorAvailabilityAdmin({
        isAcceptingBookings: !mentorData.mentor.isAcceptingBookings
      });
      await loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleAddTimeOff = async (e) => {
    e.preventDefault();
    try {
      await addMentorTimeOffAdmin(timeOffForm);
      setTimeOffForm({ startAt: '', endAt: '', reason: '' });
      setNotice({ type: 'success', text: 'Mentor time-off block added.' });
      await loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleDeleteTimeOff = async (id) => {
    try {
      await deleteMentorTimeOffAdmin(id);
      await loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleReplyThread = async (threadId) => {
    const body = (replyDrafts[threadId] || '').trim();
    if (!body) return;
    try {
      await replyToAdminThread(threadId, body);
      setReplyDrafts((prev) => ({ ...prev, [threadId]: '' }));
      setNotice({ type: 'success', text: 'Reply sent & student notified.' });
      await loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleModerateReview = async (review, isApproved) => {
    try {
      await moderateAdminReview(review.id, { isApproved, isPublic: isApproved });
      await loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleRecordRefund = async (e) => {
    e.preventDefault();
    try {
      await createAdminRefund(refundForm);
      setRefundForm({ paymentOrderId: '', amount: '', reason: '' });
      setNotice({ type: 'success', text: 'Idempotent Refund & PaymentOrderEvent recorded in Neon PostgreSQL.' });
      await loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mentor, DR Vault &amp; Audit Operations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Neon PostgreSQL + Redis Cloud operations: encrypted backups, audit logs, mentor schedule, student messages, reviews &amp; refunds.
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-sm font-medium ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        {[
          { id: 'backups', label: `DR Backups & Audit (${systemStatus.backupRuns.length})`, icon: Database },
          { id: 'mentor', label: 'Mentor Availability & Time-Off', icon: CalendarClock },
          { id: 'messages', label: `Student Messages (${threads.length})`, icon: MessageSquare },
          { id: 'reviews', label: `Session Reviews (${reviews.length})`, icon: Star },
          { id: 'refunds', label: `Refunds & Order Ledger (${systemStatus.refunds.length})`, icon: RotateCcw }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DR BACKUPS & AUDIT LOGS */}
      {activeTab === 'backups' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Encrypted AES-256-GCM Disaster-Recovery Vault</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Scheduled nightly at 23:59 IST (18:29 UTC) with isolated restore verification before rotation.
                </p>
              </div>
              <button
                onClick={handleRunBackup}
                disabled={runningBackup}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                <span>{runningBackup ? 'Running & Verifying Restore...' : 'Run Encrypted Backup Now'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase">
                    <th className="py-2.5 pr-4">Backup Key</th>
                    <th className="py-2.5 pr-4">Status</th>
                    <th className="py-2.5 pr-4">Size</th>
                    <th className="py-2.5 pr-4">SHA-256</th>
                    <th className="py-2.5 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {systemStatus.backupRuns.map((b) => (
                    <tr key={b.id}>
                      <td className="py-2.5 pr-4 font-mono text-gray-800">{b.backupKey}</td>
                      <td className="py-2.5 pr-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">{(b.sizeBytes / 1024).toFixed(1)} KB</td>
                      <td className="py-2.5 pr-4 font-mono">{b.sha256Checksum?.slice(0, 16)}...</td>
                      <td className="py-2.5 pr-4">{new Date(b.createdAt).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  {systemStatus.backupRuns.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        No backup runs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Immutable Security &amp; Consent Audit Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase">
                    <th className="py-2 pr-4">Timestamp</th>
                    <th className="py-2 pr-4">Actor</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Entity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {systemStatus.auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 pr-4">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                      <td className="py-2 pr-4 font-mono">{log.actorRole}</td>
                      <td className="py-2 pr-4 font-semibold text-gray-800">{log.action}</td>
                      <td className="py-2 pr-4 font-mono text-gray-600">{log.entityType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENTOR AVAILABILITY & TIME-OFF */}
      {activeTab === 'mentor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Weekly Schedule ({mentorData.mentor?.displayName || 'Lead Mentor'})
              </h2>
              {mentorData.mentor && (
                <button
                  onClick={handleToggleAcceptingBookings}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    mentorData.mentor.isAcceptingBookings
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {mentorData.mentor.isAcceptingBookings ? 'Accepting Bookings' : 'Bookings Paused'}
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {mentorData.availabilities.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{DAY_NAMES[a.dayOfWeek]}</p>
                    <p className="text-xs text-gray-500">
                      {a.startTime} – {a.endTime} ({(a.slotLabels || []).length} slots)
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleDay(a)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      a.isActive ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {a.isActive ? 'Active' : 'Off'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Block Mentor Time-Off / Leave</h2>
            <form onSubmit={handleAddTimeOff} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={timeOffForm.startAt}
                    onChange={(e) => setTimeOffForm((p) => ({ ...p, startAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={timeOffForm.endAt}
                    onChange={(e) => setTimeOffForm((p) => ({ ...p, endAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
              <input
                type="text"
                placeholder="Reason (e.g., Travel / Conference)"
                value={timeOffForm.reason}
                onChange={(e) => setTimeOffForm((p) => ({ ...p, reason: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Leave Block</span>
              </button>
            </form>

            <div className="space-y-2 pt-3 border-t border-gray-100">
              {mentorData.timeOffs.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 text-xs">
                  <div>
                    <p className="font-semibold text-gray-800">{t.reason}</p>
                    <p className="text-gray-500">
                      {new Date(t.startAt).toLocaleString('en-IN')} → {new Date(t.endAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTimeOff(t.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {threads.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
              No student message threads yet.
            </div>
          ) : (
            threads.map((thread) => (
              <div key={thread.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{thread.subject}</h3>
                    <p className="text-xs text-gray-500">
                      {thread.student?.name} ({thread.student?.email})
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(thread.lastMessageAt).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(thread.messages || []).map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-lg text-xs ${
                        m.senderRole === 'mentor' ? 'bg-amber-50 border border-amber-200 ml-8' : 'bg-gray-50 mr-8'
                      }`}
                    >
                      <span className="font-bold uppercase text-[10px] text-gray-500 block mb-0.5">
                        {m.senderRole === 'mentor' ? 'Deepak Sir (You)' : thread.student?.name || 'Student'}
                      </span>
                      <p className="text-gray-800">{m.body}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={replyDrafts[thread.id] || ''}
                    onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))}
                    placeholder="Reply to student (triggers in-app notification)..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => handleReplyThread(thread.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reply</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: REVIEWS MODERATION */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Mentee Session Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No session reviews submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600 font-bold">{'★'.repeat(r.rating)}</span>
                      <span className="text-sm font-semibold text-gray-900">{r.student?.name}</span>
                      <span className="text-xs text-gray-500">({r.student?.email})</span>
                    </div>
                    <p className="text-xs text-gray-700">{r.comment || 'No written comment'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {r.isApproved ? (
                      <button
                        onClick={() => handleModerateReview(r, false)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700"
                      >
                        Hide
                      </button>
                    ) : (
                      <button
                        onClick={() => handleModerateReview(r, true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve &amp; Publish</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REFUNDS & PAYMENT ORDER LEDGER */}
      {activeTab === 'refunds' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleRecordRefund} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Record Idempotent Refund</h2>
            <input
              type="text"
              required
              placeholder="PaymentOrder UUID"
              value={refundForm.paymentOrderId}
              onChange={(e) => setRefundForm((p) => ({ ...p, paymentOrderId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
            />
            <input
              type="number"
              step="0.01"
              required
              placeholder="Refund Amount (INR)"
              value={refundForm.amount}
              onChange={(e) => setRefundForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <input
              type="text"
              required
              placeholder="Reason for refund"
              value={refundForm.reason}
              onChange={(e) => setRefundForm((p) => ({ ...p, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium">
              Record Refund in Ledger
            </button>
          </form>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Recent PaymentOrders &amp; Refunds</h2>
            <div className="space-y-2.5 max-h-80 overflow-y-auto text-xs">
              {systemStatus.paymentOrders.map((po) => (
                <div key={po.id} className="p-3 rounded-lg border border-gray-200 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="font-mono">{po.id}</span>
                    <span>₹{po.expectedAmount} • {po.status}</span>
                  </div>
                  <p className="text-gray-500">
                    {po.purpose} • Events: {(po.events || []).map((ev) => ev.toStatus).join(' → ')}
                  </p>
                </div>
              ))}
              {systemStatus.paymentOrders.length === 0 && (
                <p className="text-gray-500">No Neon PaymentOrder records yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
