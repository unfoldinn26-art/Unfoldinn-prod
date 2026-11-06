'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  
  CheckCircle2,
  ArrowUpRight,
  CreditCard,
  FileText,
  User as UserIcon,
  LogOut,
  Edit3,
  ShieldCheck,
  Layers,
  Video
} from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import {
  getMySessionsAndSubscriptions,
  updateMySessionReflection,
  getSubscriptionPlans,
  createPaymentOrder,
  generateIdempotencyKey
} from '../../lib/api';
import { openCashfreeCheckout } from '../../lib/cashfreeClient';

export default function MenteeDashboardPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    isOnboarded,
    remainingCredits,
    activeSubscription,
    refreshUser,
    logout
  } = useUserAuth();

  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'plans' | 'receipts'
  const [sessions, setSessions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Reflection / 7-Day Next Step update state
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [reflectionDraft, setReflectionDraft] = useState({
    actionStatus: 'not-started',
    studentReflection: '',
    feedback: ''
  });
  const [savingReflection, setSavingReflection] = useState(false);
  const [reflectionSavedMsg, setReflectionSavedMsg] = useState('');

  // Subscription checkout lock
  const isBuyingPlanRef = useRef(false);
  const [buyingPlanCode, setBuyingPlanCode] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login?next=/dashboard');
      } else if (!isOnboarded) {
        router.replace('/onboarding?next=/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, isOnboarded, router]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [myData, plansRes] = await Promise.all([
        getMySessionsAndSubscriptions(),
        getSubscriptionPlans()
      ]);
      setSessions(myData.sessions || []);
      setSubscriptions(myData.subscriptions || []);
      setTransactions(myData.transactions || []);
      setPlans((plansRes.data || []).filter((p) => p.code !== 'SINGLE_SESSION'));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isOnboarded) {
      loadDashboardData();
    }
  }, [isAuthenticated, isOnboarded]);

  const handleOpenReflectionEditor = (session) => {
    setEditingSessionId(session._id);
    setReflectionDraft({
      actionStatus: session.actionStatus || 'not-started',
      studentReflection: session.studentReflection || '',
      feedback: session.feedback || ''
    });
    setReflectionSavedMsg('');
  };

  const handleSaveReflection = async (sessionId) => {
    setSavingReflection(true);
    setReflectionSavedMsg('');
    try {
      await updateMySessionReflection(sessionId, reflectionDraft);
      setReflectionSavedMsg('Progress saved!');
      await loadDashboardData();
      setTimeout(() => {
        setEditingSessionId(null);
        setReflectionSavedMsg('');
      }, 900);
    } catch (err) {
      alert(err.message || 'Could not save reflection');
    } finally {
      setSavingReflection(false);
    }
  };

  const handlePurchaseSubscriptionPlan = async (plan) => {
    if (isBuyingPlanRef.current) return;
    isBuyingPlanRef.current = true;
    setBuyingPlanCode(plan.code);
    setCheckoutError('');

    try {
      const idempKey = generateIdempotencyKey(`sub_${plan.code}`);
      const orderRes = await createPaymentOrder(
        {
          purpose: 'subscription_purchase',
          planCode: plan.code
        },
        idempKey
      );

      const { orderId, paymentSessionId, environment, alreadyPaid } = orderRes.data;
      if (alreadyPaid) {
        await refreshUser();
        await loadDashboardData();
        router.push(`/book/status?order_id=${orderId}`);
        return;
      }

      await openCashfreeCheckout(paymentSessionId, environment);
    } catch (err) {
      setCheckoutError(err.message || 'Unable to start subscription checkout.');
    } finally {
      isBuyingPlanRef.current = false;
      setBuyingPlanCode(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-paper pt-36 pb-24 flex items-center justify-center">
        <p className="text-sm text-charcoal font-mono">Loading your Mentee Dashboard...</p>
      </div>
    );
  }

  // Find latest session that has an agreed 7-day next step
  const latestActionSession = sessions.find((s) => s.actionAgreed && s.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32 md:pt-44 pb-16 sm:pb-24">
      <div className="container-editorial">
        {/* Top Profile & Subscription Banner */}
        <div className="card-editorial bg-white p-5 sm:p-6 md:p-9 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-stone/40">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-terracotta/15 border border-terracotta/30 text-terracotta flex items-center justify-center font-serif text-2xl shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-terracotta font-semibold">
                    {user.userType === 'parent' ? 'Parent / Guardian' : 'Student'}
                  </span>
                </div>
                <h1 className="font-serif text-3xl md:text-4xl text-ink mt-1">
                  {user.name}
                </h1>
                <p className="text-xs md:text-sm text-charcoal mt-1">
                  {user.whereCurrently || 'Participant'}
                  {user.institutionOrOrg ? ` • ${user.institutionOrOrg}` : ''}
                  {user.city ? ` • ${user.city}` : ''}
                  {user.phone ? ` • ${user.phone}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/onboarding?next=/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-stone/60 text-xs font-semibold text-charcoal hover:text-ink hover:bg-warm/50 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Link>

              <Link
                href="/book"
                className="btn-editorial text-xs py-2.5 px-5"
              >
                <span>
                  {remainingCredits > 0
                    ? `Book Session (Use 1 of ${remainingCredits} Credits)`
                    : 'Book Next Session'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-medium text-ash hover:text-terracotta transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Stats & Active Subscription Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-warm/40 border border-stone/40">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ash block">
                Total Mentoring Sessions
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-serif text-3xl text-ink">{sessions.length}</span>
                <span className="text-xs text-charcoal">
                  {sessions.filter((s) => s.status === 'completed').length} Completed
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-warm/40 border border-stone/40">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ash block">
                Available Session Credits
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-serif text-3xl text-sage">{remainingCredits}</span>
                <span className="text-xs text-charcoal">
                  {activeSubscription
                    ? `${activeSubscription.planName}`
                    : 'No active monthly pack'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-warm/40 border border-stone/40 flex flex-col justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ash block">
                Subscription Plan Status
              </span>
              {activeSubscription ? (
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs font-semibold text-ink">
                    Valid until{' '}
                    {new Date(activeSubscription.expiresAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <Link href="/book" className="text-xs font-semibold text-terracotta hover:underline">
                    Use Credit →
                  </Link>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-charcoal">Switch to 4 Sessions / Month</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('plans')}
                    className="text-xs font-semibold text-terracotta hover:underline"
                  >
                    View Plans →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Highlighted 7-Day Next Step Card (If present) */}
        {latestActionSession && (
          <div className="card-editorial bg-warm/60 border-terracotta/40 p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-terracotta mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sprout inline-block" />
                  <span>Active 7-Day Next Step • Session #{latestActionSession.sessionNumber || 1}</span>
                </div>
                <h2 className="font-serif text-2xl text-ink">
                  {latestActionSession.actionAgreed}
                </h2>
                {latestActionSession.followUpDate && (
                  <p className="text-xs text-charcoal mt-1">
                    Target 7-Day Review Date:{' '}
                    <strong>
                      {new Date(latestActionSession.followUpDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </strong>
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenReflectionEditor(latestActionSession)}
                className="btn-editorial text-xs py-2.5 px-5 shrink-0"
              >
                <span>Update My 7-Day Progress</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone/50 mb-8 overflow-x-auto">
          {[
            { id: 'sessions', label: `My Sessions History (${sessions.length})`, icon: Calendar },
            { id: 'plans', label: 'Monthly Subscription & Multi-Packs', icon: Layers },
            { id: 'receipts', label: `Subscriptions & Payment Receipts (${transactions.length})`, icon: CreditCard }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-5 py-3.5 text-xs md:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'border-terracotta text-ink'
                    : 'border-transparent text-charcoal/70 hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4 text-terracotta" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: MY SESSIONS HISTORY */}
        {activeTab === 'sessions' && (
          <div className="space-y-5">
            {loadingData ? (
              <div className="card-editorial bg-white p-10 text-center text-sm text-charcoal">
                Loading your mentoring sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="card-editorial bg-white p-10 md:p-14 text-center max-w-2xl mx-auto space-y-4">
                <Calendar className="w-10 h-10 text-terracotta mx-auto" />
                <h3 className="font-serif text-2xl md:text-3xl text-ink">
                  Your Mentoring Journey Starts Here
                </h3>
                <p className="text-sm text-charcoal leading-relaxed">
                  Your one-time profile is ready. Book your first conversation with Deepak Sir—or start a 4-session monthly mentorship plan—in just one click.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <Link href="/book" className="btn-editorial text-xs py-3 px-6">
                    <span>Book Your Session Now</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveTab('plans')}
                    className="btn-editorial-outline text-xs py-3 px-6"
                  >
                    <span>Explore 4 Sessions / Month Plan</span>
                  </button>
                </div>
              </div>
            ) : (
              sessions.map((session, idx) => {
                const isEditing = editingSessionId === session._id;
                const displayNum = sessions.length - idx;
                const bookingRef = session._id
                  ? `#${String(session._id).slice(-6).toUpperCase()}`
                  : '';

                return (
                  <div
                    key={session._id}
                    className="card-editorial bg-white p-6 md:p-8 space-y-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone/30">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 rounded-full bg-ink text-paper font-mono text-xs font-bold">
                          Session #{displayNum}
                        </span>
                        {bookingRef && (
                          <span className="px-2.5 py-1 rounded-full bg-paper border border-stone/60 text-ink font-mono text-xs font-bold">
                            Ref: {bookingRef}
                          </span>
                        )}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            session.status === 'completed'
                              ? 'bg-sage/15 text-sage'
                              : session.status === 'confirmed'
                              ? 'bg-blue-50 text-blue-700'
                              : session.status === 'cancelled'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {session.status}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-warm border border-stone/40 text-[11px] text-charcoal font-mono">
                          {session.bookingMode === 'subscription_credit'
                            ? 'Booked via Subscription Credit'
                            : session.paymentStatus === 'paid'
                            ? `Paid (₹${session.paymentAmount})`
                            : 'Introductory / Complimentary'}
                        </span>
                      </div>

                      <div className="text-xs text-ash font-mono">
                        Booked on{' '}
                        {new Date(session.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-8 space-y-3">
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-ash block">
                            What We Focused On
                          </span>
                          <p className="text-ink font-medium text-base mt-1 leading-relaxed">
                            {session.topic || session.concern || 'Mentoring Conversation'}
                          </p>
                        </div>

                        {session.usefulGoal && (
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-ash block">
                              Desired Outcome for This Session
                            </span>
                            <p className="text-charcoal text-sm mt-0.5">{session.usefulGoal}</p>
                          </div>
                        )}

                        {session.sharedNotes && (
                          <div className="p-4 rounded-xl bg-warm/50 border border-stone/40">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta block mb-1">
                              Mentor Summary &amp; Perspective Notes
                            </span>
                            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                              {session.sharedNotes}
                            </p>
                          </div>
                        )}

                        {session.actionAgreed && (
                          <div className="p-4 rounded-xl bg-sage/10 border border-sage/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-sage font-bold">
                                Agreed 7-Day Next Step
                              </span>
                              <span className="text-[11px] font-semibold uppercase text-sage">
                                Status: {session.actionStatus || 'not-started'}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-ink">{session.actionAgreed}</p>
                          </div>
                        )}

                        {session.studentReflection && !isEditing && (
                          <div className="p-3.5 rounded-xl bg-paper border border-stone/40">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-ash block mb-1">
                              Your 7-Day Reflection
                            </span>
                            <p className="text-xs text-charcoal leading-relaxed whitespace-pre-wrap">
                              {session.studentReflection}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-paper border border-stone/40 space-y-4">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-ash block">
                              Session Slot &amp; Meeting Link
                            </span>
                            {bookingRef && (
                              <span className="font-mono text-[10px] font-bold text-ink">
                                {bookingRef}
                              </span>
                            )}
                          </div>
                          {session.preferredDate ? (
                            <p className="font-semibold text-ink flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-terracotta" />
                              {new Date(session.preferredDate).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          ) : (
                            <p className="text-charcoal">Date to be scheduled with mentor</p>
                          )}
                          {session.preferredTime && (
                            <p className="text-charcoal flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-terracotta" />
                              {session.preferredTime}
                            </p>
                          )}
                          <p className="text-[11px] text-ash font-mono">
                            Timezone: {session.timezone || 'Asia/Kolkata'} (IST, UTC+05:30)
                          </p>

                          {session.meetingLink &&
                          session.meetingLink.startsWith('https://meet.google.com/') &&
                          session.status !== 'cancelled' ? (
                            <div className="pt-2 space-y-1.5">
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-3 rounded-lg bg-sage text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-xs"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Join Google Meet Session</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                              <p className="text-[10px] text-ash break-all text-center font-mono">
                                {session.meetingLink}
                              </p>
                            </div>
                          ) : session.status === 'confirmed' ? (
                            <div className="pt-2">
                              <div className="p-2.5 rounded-lg bg-warm/60 border border-stone/40 text-[11px] text-charcoal leading-snug">
                                Google Meet link will appear here automatically once the mentor calendar is synced.
                              </div>
                            </div>
                          ) : null}
                        </div>

                        <div className="space-y-2 pt-2 border-t border-stone/30">
                          <button
                            type="button"
                            onClick={() =>
                              isEditing
                                ? setEditingSessionId(null)
                                : handleOpenReflectionEditor(session)
                            }
                            className="w-full py-2 px-3 rounded-lg border border-stone/60 bg-white hover:bg-warm text-ink text-xs font-semibold transition-colors"
                          >
                            {isEditing
                              ? 'Close Editor'
                              : 'Update 7-Day Progress / Reflection'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Inline 7-Day Next Step & Reflection Editor */}
                    {isEditing && (
                      <div className="pt-4 border-t border-stone/40 bg-warm/30 p-5 rounded-xl space-y-4">
                        <h4 className="font-serif text-lg text-ink">
                          Update Your 7-Day Next Step &amp; Session Reflection
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-1.5">
                              7-Day Action Status
                            </label>
                            <select
                              value={reflectionDraft.actionStatus}
                              onChange={(e) =>
                                setReflectionDraft({ ...reflectionDraft, actionStatus: e.target.value })
                              }
                              className="w-full px-3.5 py-2.5 rounded-lg border border-stone bg-white text-sm text-ink"
                            >
                              <option value="not-started">Not Started Yet</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed (Done!)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-1.5">
                            What did you try, what happened, and what did you learn?
                          </label>
                          <textarea
                            rows={3}
                            value={reflectionDraft.studentReflection}
                            onChange={(e) =>
                              setReflectionDraft({
                                ...reflectionDraft,
                                studentReflection: e.target.value
                              })
                            }
                            placeholder="Write your notes or progress before your next conversation with Deepak Sir..."
                            className="w-full px-3.5 py-2.5 rounded-lg border border-stone bg-white text-sm text-ink"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          {reflectionSavedMsg ? (
                            <span className="text-xs font-semibold text-sage">
                              ✓ {reflectionSavedMsg}
                            </span>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingSessionId(null)}
                              className="px-4 py-2 text-xs text-charcoal hover:text-ink"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={savingReflection}
                              onClick={() => handleSaveReflection(session._id)}
                              className="btn-editorial text-xs py-2 px-5"
                            >
                              <span>{savingReflection ? 'Saving...' : 'Save Update'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: MONTHLY SUBSCRIPTION & MULTI-SESSION PACKS */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="max-w-2xl">
              <p className="eyebrow mb-2">Multi-Session &amp; Monthly Mentorship</p>
              <h2 className="font-serif text-3xl text-ink">
                Subscribe Once. Book Any Session in One Click.
              </h2>
              <p className="text-sm text-charcoal mt-2 leading-relaxed">
                Real clarity comes from a rhythm of conversation, action, and review. Choose a monthly 4-session subscription or a 90-day transition pack to unlock instant credit bookings.
              </p>
            </div>

            {checkoutError && (
              <div className="p-4 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-xs font-medium">
                {checkoutError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className={`card-editorial p-7 md:p-8 flex flex-col justify-between relative ${
                    plan.isPopular
                      ? 'bg-white border-2 border-terracotta shadow-md'
                      : 'bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-terracotta">
                        {plan.subtitle || `${plan.sessionsCount} Sessions`}
                      </span>
                      {plan.badgeText && (
                        <span className="px-3 py-1 rounded-full bg-terracotta/15 text-terracotta text-xs font-bold">
                          {plan.badgeText}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-2xl md:text-3xl text-ink">{plan.name}</h3>
                    <p className="text-xs md:text-sm text-charcoal mt-2 leading-relaxed">
                      {plan.description}
                    </p>

                    <div className="mt-5 pt-5 border-t border-stone/40 flex items-baseline gap-3">
                      <span className="font-serif text-4xl text-ink">₹{plan.price}</span>
                      {plan.originalPrice && plan.originalPrice > plan.price && (
                        <span className="text-sm text-ash line-through">₹{plan.originalPrice}</span>
                      )}
                      <span className="text-xs text-charcoal font-mono">
                        • ₹{Math.round(plan.price / plan.sessionsCount)} / session
                      </span>
                    </div>

                    <ul className="mt-5 space-y-2.5">
                      {(plan.features || []).map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs md:text-sm text-charcoal">
                          <CheckCircle2 className="w-4 h-4 text-sage shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-7 pt-4 border-t border-stone/30">
                    <button
                      type="button"
                      disabled={buyingPlanCode === plan.code}
                      onClick={() => handlePurchaseSubscriptionPlan(plan)}
                      className="btn-editorial w-full justify-center py-3.5 text-sm disabled:opacity-50"
                    >
                      <span>
                        {buyingPlanCode === plan.code
                          ? 'Opening Secure Checkout...'
                          : `Activate ${plan.sessionsCount} Session Credits (₹${plan.price})`}
                      </span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SUBSCRIPTIONS & PAYMENT RECEIPTS */}
        {activeTab === 'receipts' && (
          <div className="space-y-8">
            {/* Active & Past Subscriptions */}
            <div className="card-editorial bg-white p-6 md:p-8">
              <h3 className="font-serif text-2xl text-ink mb-4">My Subscription Packages</h3>
              {subscriptions.length === 0 ? (
                <p className="text-sm text-charcoal">No subscription packages purchased yet.</p>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub._id}
                      className="p-4 rounded-xl border border-stone/50 bg-paper flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink text-sm">{sub.planName}</span>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold capitalize ${
                              sub.status === 'active'
                                ? 'bg-sage/15 text-sage'
                                : 'bg-stone/40 text-charcoal'
                            }`}
                          >
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal mt-1">
                          Credits: <strong>{sub.remainingCredits} remaining</strong> of {sub.totalCredits} total •{' '}
                          {sub.expiresAt
                            ? `Valid until ${new Date(sub.expiresAt).toLocaleDateString('en-IN')}`
                            : ''}
                        </p>
                      </div>
                      <div className="text-right font-mono text-xs text-ink">
                        ₹{sub.amountPaid}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Receipts */}
            <div className="card-editorial bg-white p-6 md:p-8">
              <h3 className="font-serif text-2xl text-ink mb-4">Payment Receipts</h3>
              {transactions.length === 0 ? (
                <p className="text-sm text-charcoal">No online payment transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-stone/50 text-ash font-mono text-[11px] uppercase">
                        <th className="py-3 pr-4">Date</th>
                        <th className="py-3 pr-4">Order ID</th>
                        <th className="py-3 pr-4">Type</th>
                        <th className="py-3 pr-4">Amount</th>
                        <th className="py-3 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone/30">
                      {transactions.map((tx) => (
                        <tr key={tx._id}>
                          <td className="py-3.5 pr-4 text-charcoal">
                            {new Date(tx.paidAt || tx.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3.5 pr-4 font-mono text-xs text-ink">
                            {tx.cashfreeOrderId}
                          </td>
                          <td className="py-3.5 pr-4 text-charcoal capitalize">
                            {tx.purpose?.replace(/_/g, ' ')} ({tx.planCode || 'Session'})
                          </td>
                          <td className="py-3.5 pr-4 font-semibold text-ink">
                            ₹{tx.paidAmount || tx.expectedAmount}
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-sage/15 text-sage text-xs font-semibold">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
