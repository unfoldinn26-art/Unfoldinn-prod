'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Bell,
  Star,
  Send,
  CheckCheck,
  CheckCircle2
} from 'lucide-react';
import {
  startMessageThread,
  sendMessageInThread,
  markNotificationRead,
  markAllNotificationsRead,
  submitSessionReview
} from '../../lib/api';

export function MenteeMessagesPanel({ threads = [], onRefresh }) {
  const [selectedThreadId, setSelectedThreadId] = useState(threads[0]?.id || null);
  const [subject, setSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const activeThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const handleStartThread = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await startMessageThread({
        subject: subject.trim() || 'Mentoring Question for Deepak Sir',
        message: newMessage.trim()
      });
      setNewMessage('');
      setSubject('');
      if (res?.data?.id) setSelectedThreadId(res.data.id);
      await onRefresh?.();
    } catch (err) {
      setError(err.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    setSending(true);
    setError('');
    try {
      await sendMessageInThread(activeThread.id, replyText.trim());
      setReplyText('');
      await onRefresh?.();
    } catch (err) {
      setError(err.message || 'Could not send reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-xl bg-signal/10 border border-signal/30 text-signal text-xs font-medium">
          {error}
        </div>
      )}

      {threads.length === 0 ? (
        <form onSubmit={handleStartThread} className="card-editorial bg-white p-6 md:p-8 space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 text-terracotta text-xs font-mono uppercase tracking-widest">
            <MessageSquare className="w-4 h-4" />
            <span>Direct Mentor Conversation</span>
          </div>
          <h3 className="font-serif text-2xl text-ink">Message Deepak Sir</h3>
          <p className="text-xs text-charcoal leading-relaxed">
            Have a quick follow-up question on your 7-Day Next Step or upcoming session? Send a private message here.
          </p>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Topic (e.g., Follow-up on Internship Shortlist)"
            className="field text-sm"
          />
          <textarea
            rows={4}
            required
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write your message..."
            className="field text-sm"
          />
          <button type="submit" disabled={sending} className="btn-editorial text-xs py-2.5 px-5">
            <Send className="w-3.5 h-3.5" />
            <span>{sending ? 'Sending...' : 'Send Message'}</span>
          </button>
        </form>
      ) : (
        <div className="card-editorial bg-white p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-stone/40 pb-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta block">
                Private Mentoring Thread
              </span>
              <h3 className="font-serif text-xl text-ink mt-0.5">{activeThread?.subject}</h3>
            </div>
            <span className="text-xs text-charcoal">
              With {activeThread?.mentorProfile?.displayName || 'Mr. Deepak Sogani'}
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {(activeThread?.messages || []).map((m) => {
              const isStudent = m.senderRole === 'student';
              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl text-sm max-w-[85%] ${
                    isStudent
                      ? 'ml-auto bg-ink text-paper'
                      : 'mr-auto bg-paper-2 border border-stone/40 text-ink'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70 mb-1">
                    {isStudent ? 'You' : 'Deepak Sir'} •{' '}
                    {new Date(m.createdAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-stone/40">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="field text-sm flex-1"
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="btn-editorial text-xs py-2.5 px-5 shrink-0 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export function MenteeNotificationsPanel({ notifications = [], onRefresh }) {
  const [busy, setBusy] = useState(false);

  const handleMarkRead = async (id) => {
    setBusy(true);
    try {
      await markNotificationRead(id);
      await onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleMarkAll = async () => {
    setBusy(true);
    try {
      await markAllNotificationsRead();
      await onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card-editorial bg-white p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between border-b border-stone/40 pb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-terracotta" />
          <h3 className="font-serif text-xl text-ink">Notifications</h3>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            disabled={busy}
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-terracotta hover:underline"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-sm text-charcoal py-6 text-center">
          No notifications yet. Mentor replies, session updates, and reminders will appear here.
        </p>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                n.isRead ? 'bg-paper border-stone/40 opacity-80' : 'bg-warm/50 border-terracotta/40'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-ink">{n.title}</p>
                <p className="text-xs text-charcoal mt-0.5">{n.body}</p>
                <span className="text-[10px] font-mono text-muted mt-1 block">
                  {new Date(n.createdAt).toLocaleString('en-IN')}
                </span>
              </div>
              {!n.isRead && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs font-semibold text-terracotta hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MenteeReviewPanel({ myReviews = [], onRefresh }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSavedMsg('');
    try {
      const res = await submitSessionReview({ rating, comment, isPublic });
      setSavedMsg(res.message || 'Review submitted!');
      setComment('');
      await onRefresh?.();
    } catch (err) {
      setError(err.message || 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleSubmit} className="card-editorial bg-white p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-terracotta text-xs font-mono uppercase tracking-widest">
          <Star className="w-4 h-4" />
          <span>Share Your Mentoring Experience</span>
        </div>
        <h3 className="font-serif text-2xl text-ink">Rate Your Session</h3>
        {error && (
          <div className="p-3 rounded-xl bg-signal/10 border border-signal/30 text-signal text-xs">
            {error}
          </div>
        )}
        {savedMsg && (
          <div className="p-3 rounded-xl bg-sprout/15 border border-sprout/40 text-ink text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sprout" />
            <span>{savedMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
            Rating (1 to 5 Stars)
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setRating(num)}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
                  rating >= num
                    ? 'bg-amber-400/20 border-amber-500 text-amber-700'
                    : 'bg-paper border-stone/40 text-charcoal/60'
                }`}
              >
                ★ {num}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-1.5">
            Your Reflection / Feedback
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did the conversation help you gain clarity?"
            className="field text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-charcoal cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-stone"
          />
          <span>Allow Unfoldinn to display this review anonymously/publicly after moderation</span>
        </label>

        <button type="submit" disabled={submitting} className="btn-editorial text-xs py-2.5 px-5">
          <span>{submitting ? 'Submitting...' : 'Submit Review'}</span>
        </button>
      </form>

      <div className="card-editorial bg-white p-6 md:p-8 space-y-4">
        <h3 className="font-serif text-xl text-ink">Your Submitted Reviews</h3>
        {myReviews.length === 0 ? (
          <p className="text-sm text-charcoal">You haven&apos;t submitted a session review yet.</p>
        ) : (
          <div className="space-y-3">
            {myReviews.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border border-stone/40 bg-paper space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-600 font-semibold text-sm">
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-paper-2 border border-stone/40">
                    {r.isApproved ? 'Published' : 'Pending Moderation'}
                  </span>
                </div>
                {r.comment && <p className="text-xs text-ink-2 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
