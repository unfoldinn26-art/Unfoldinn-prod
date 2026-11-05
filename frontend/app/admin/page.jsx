'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Briefcase, 
  FileText, 
  Mail, 
  Building2, 
  MessageSquareQuote, 
  Users, 
  Clock, 
  AlertCircle,
  CreditCard,
  ArrowRight,
  ArrowUpRight,
  PlusCircle,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  Video,
  Link2,
  Unlink,
  RefreshCw,
  Tag
} from 'lucide-react';
import {
  getDashboard,
  getAdminPaymentSettings,
  getGoogleIntegrationStatus,
  getGoogleConnectUrl,
  disconnectGoogleIntegration
} from '../../lib/adminApi';
import StatsCard from '../../components/admin/StatsCard';
import StatusBadge from '../../components/admin/StatusBadge';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [googleStatus, setGoogleStatus] = useState(null);
  const [googleActionLoading, setGoogleActionLoading] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rightTab, setRightTab] = useState('contacts'); // 'contacts' | 'support' | 'institutions'
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchAll = useCallback(async (isSilentRefresh = false) => {
    if (isSilentRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [dashData, payData, gStatus] = await Promise.all([
        getDashboard(),
        getAdminPaymentSettings().catch(() => null),
        getGoogleIntegrationStatus().catch(() => null)
      ]);
      setData(dashData);
      if (payData?.success) {
        setPaymentConfig(payData);
      }
      if (gStatus?.data) {
        setGoogleStatus(gStatus.data);
      }
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get('google_connected');
      const email = params.get('google_email') || params.get('email');
      const gErr = params.get('google_error');
      if (connected === 'true') {
        setGoogleNotice({
          type: 'success',
          message: `Google Calendar & Meet connected successfully${email ? ` (${email})` : ''}! Confirmed bookings will now automatically generate unique Google Meet links.`
        });
        window.history.replaceState({}, '', window.location.pathname);
      } else if (gErr) {
        setGoogleNotice({
          type: 'error',
          message: `Google Calendar connection error: ${gErr}`
        });
        window.history.replaceState({}, '', window.location.pathname);
      }
    }

    fetchAll(false);
  }, [fetchAll]);

  const handleConnectGoogle = async () => {
    setGoogleActionLoading(true);
    setGoogleNotice(null);
    try {
      let preferredRedirectUri = '';
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
          preferredRedirectUri = 'http://localhost:5000/api/admin/google/callback';
        } else {
          preferredRedirectUri = 'https://www.unfoldinn.com/api/admin/google/callback';
        }
      }
      const res = await getGoogleConnectUrl(preferredRedirectUri);
      const authUrl = res?.authUrl || res?.data?.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error('Could not generate Google OAuth redirect URL.');
      }
    } catch (err) {
      setGoogleNotice({
        type: 'error',
        message: err.message || 'Failed to initiate Google Calendar OAuth flow'
      });
      setGoogleActionLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm('Disconnect Google Calendar & Meet integration? Automated Meet link generation will pause until reconnected.')) {
      return;
    }
    setGoogleActionLoading(true);
    try {
      await disconnectGoogleIntegration();
      const updated = await getGoogleIntegrationStatus().catch(() => null);
      if (updated?.data) setGoogleStatus(updated.data);
      setGoogleNotice({
        type: 'success',
        message: 'Google Calendar & Meet integration disconnected.'
      });
    } catch (err) {
      setGoogleNotice({
        type: 'error',
        message: err.message || 'Failed to disconnect Google Calendar'
      });
    } finally {
      setGoogleActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-200/70 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200/70 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="h-96 bg-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-96 bg-slate-200/70 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={() => fetchAll(false)}
          className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  // Normalize stats whether backend returned flat `data.stats` or nested `data.data.stats`
  const rawStats = data?.stats || data?.data?.stats || {};
  const stats = {
    totalBookings: rawStats.totalBookings ?? rawStats.bookings?.total ?? 0,
    pendingBookings: rawStats.pendingBookings ?? rawStats.bookings?.pending ?? 0,
    confirmedBookings: rawStats.confirmedBookings ?? rawStats.bookings?.confirmed ?? 0,
    completedBookings: rawStats.completedBookings ?? rawStats.bookings?.completed ?? 0,
    totalUsers: rawStats.totalUsers ?? rawStats.users?.total ?? 0,
    activeSubscriptions: rawStats.activeSubscriptions ?? rawStats.users?.activeSubscriptions ?? 0,
    activeOpportunities: rawStats.activeOpportunities ?? rawStats.opportunities?.active ?? 0,
    publishedResources: rawStats.publishedResources ?? rawStats.resources?.published ?? 0,
    totalContacts: rawStats.totalContacts ?? rawStats.contacts?.total ?? 0,
    newContacts: rawStats.newContacts ?? rawStats.contacts?.new ?? 0,
    institutionalEnquiries: rawStats.institutionalEnquiries ?? rawStats.institutions?.total ?? 0,
    approvedTestimonials: rawStats.approvedTestimonials ?? rawStats.testimonials?.approved ?? 0,
    newsletterSubscribers: rawStats.newsletterSubscribers ?? rawStats.newsletter?.active ?? 0,
    totalSupport: rawStats.totalSupport ?? rawStats.support?.total ?? 0,
    openSupport: rawStats.openSupport ?? rawStats.support?.open ?? 0
  };

  const recentBookings =
    data?.recentBookings || data?.data?.recentBookings || data?.data?.recent?.bookings || [];
  const recentContacts =
    data?.recentContacts || data?.data?.recentContacts || data?.data?.recent?.contacts || [];
  const recentInstitutions =
    data?.recentInstitutions || data?.data?.recentInstitutions || data?.data?.recent?.institutions || [];
  const recentSupport =
    data?.recentSupport || data?.data?.recentSupport || data?.data?.recent?.support || [];

  const isFeeActive = Boolean(paymentConfig?.settings?.paymentsEnabled);
  const firstSessionFree = paymentConfig?.settings?.firstSessionFreeEnabled !== false;
  const limitOneFree = paymentConfig?.settings?.limitOneFreeSessionPerUser !== false;
  const currentFee = paymentConfig?.settings?.sessionFee ?? 500;
  const activeCouponsCount = (paymentConfig?.settings?.coupons || []).filter((c) => c.isActive).length;

  return (
    <div className="space-y-7">
      
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-[#131C27] via-[#192534] to-[#213044] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-md relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#F59E0B]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#FBBF24] text-xs font-mono font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Founder&apos;s Console • Live Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Welcome, Mr. Deepak Sogani
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Manage 1-on-1 mentoring bookings, Google Meet sessions, post-session continuity summaries, fee rules, and discount coupons from one unified workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-mono font-semibold rounded-xl transition-colors border border-white/15 flex items-center gap-2 cursor-pointer"
              title="Refresh Live Metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#FBBF24]' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/bookings')}
              className="px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#111720] text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span>View Bookings ({stats.totalBookings})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => router.push('/admin/payments')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-semibold uppercase tracking-wider rounded-xl transition-colors border border-white/15 flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>Fees &amp; Coupons</span>
            </button>
          </div>
        </div>

        {/* Live Session Pipeline Pill Strip inside Banner */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Confirmed</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{stats.confirmedBookings}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Pending</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{stats.pendingBookings}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Completed</span>
            <span className="font-mono font-bold text-sky-400 text-sm">{stats.completedBookings}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Mentees</span>
            <span className="font-mono font-bold text-white text-sm">{stats.totalUsers}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Active Plans</span>
            <span className="font-mono font-bold text-purple-300 text-sm">{stats.activeSubscriptions}</span>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Coupons</span>
            <span className="font-mono font-bold text-[#FBBF24] text-sm">{activeCouponsCount}</span>
          </div>
        </div>
      </div>

      {/* Google Calendar & Meet Connection Status Card */}
      {googleNotice && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between gap-4 ${
            googleNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{googleNotice.message}</span>
          <button
            onClick={() => setGoogleNotice(null)}
            className="text-xs font-mono uppercase font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              googleStatus?.connected
                ? 'bg-emerald-100 text-emerald-700'
                : googleStatus?.status === 'revoked_or_expired'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">
                Google Calendar &amp; Google Meet Automation
              </h2>
              {googleStatus?.connected ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Connected
                </span>
              ) : googleStatus?.status === 'revoked_or_expired' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  Token Expired / Revoked — Reconnect Needed
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  Not Connected Yet
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {googleStatus?.connected
                ? `Connected to ${googleStatus.connectedEmail || 'Mentor Google Calendar'} (${googleStatus.calendarId || 'primary'}). Every confirmed booking automatically creates a Google Calendar event and a unique Google Meet conference link.`
                : googleStatus?.lastError
                ? `Last status: ${googleStatus.lastError}. Click "Connect Google Calendar & Meet" to authorize automatic Google Meet link creation.`
                : 'Connect Deepak’s Google account once using OAuth 2.0 so confirmed bookings automatically generate a Calendar invite and unique Google Meet link.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {googleStatus?.connected ? (
            <>
              <button
                type="button"
                disabled={googleActionLoading}
                onClick={handleConnectGoogle}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>{googleActionLoading ? 'Redirecting...' : 'Reconnect Account'}</span>
              </button>
              <button
                type="button"
                disabled={googleActionLoading}
                onClick={handleDisconnectGoogle}
                className="px-3.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={googleActionLoading}
              onClick={handleConnectGoogle}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>
                {googleActionLoading
                  ? 'Redirecting to Google...'
                  : 'Connect Google Calendar & Meet'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard 
          icon={Calendar} 
          title="Total Bookings" 
          value={stats.totalBookings} 
          badge={`${stats.confirmedBookings} Confirmed`}
          subtitle="Click to manage sessions & Meet links"
          variant="navy" 
          onClick={() => router.push('/admin/bookings')}
        />
        <StatsCard 
          icon={Clock} 
          title="Pending Sessions" 
          value={stats.pendingBookings} 
          subtitle={stats.pendingBookings > 0 ? 'Requires slot confirmation' : 'All sessions confirmed!'}
          variant="amber" 
          onClick={() => router.push('/admin/bookings')}
        />
        <StatsCard 
          icon={CreditCard} 
          title="Session Fee & Rules" 
          value={isFeeActive ? `₹${currentFee}` : firstSessionFree ? '1st Free' : `₹${currentFee}`} 
          badge={limitOneFree ? 'Max 1 Free/User' : 'Unlimited Free'}
          subtitle={
            isFeeActive
              ? `Paid mode ON • Session #2+ ₹${currentFee}`
              : `1st Intro Free • Session #2+ ₹${currentFee} or Coupon`
          }
          variant="teal" 
          onClick={() => router.push('/admin/payments')}
        />
        <StatsCard 
          icon={AlertCircle} 
          title="Support & Bug Desk" 
          value={stats.openSupport || stats.totalSupport || 0} 
          badge={stats.openSupport > 0 ? `${stats.openSupport} Open` : '0 Open'}
          subtitle="Website issue & support tickets"
          variant={stats.openSupport > 0 ? 'coral' : 'white'} 
          onClick={() => router.push('/admin/support')}
        />
      </div>

      {/* Secondary Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          icon={Mail} 
          title="Mentoring Inquiries" 
          value={stats.totalContacts} 
          badge={stats.newContacts > 0 ? `${stats.newContacts} New` : undefined}
          subtitle="Contact form messages"
          variant="white" 
          onClick={() => router.push('/admin/contacts')}
        />
        <StatsCard 
          icon={Building2} 
          title="Institutional Enquiries" 
          value={stats.institutionalEnquiries} 
          subtitle="Schools, colleges & orgs"
          variant="white" 
          onClick={() => router.push('/admin/institutions')}
        />
        <StatsCard 
          icon={Briefcase} 
          title="Curated Opportunities" 
          value={stats.activeOpportunities} 
          subtitle="Live fellowships & programs"
          variant="white" 
          onClick={() => router.push('/admin/opportunities')}
        />
        <StatsCard 
          icon={FileText} 
          title="Framework Articles" 
          value={stats.publishedResources} 
          subtitle="Published mentoring guides"
          variant="white" 
          onClick={() => router.push('/admin/resources')}
        />
      </div>

      {/* Main Tables Row: Recent Bookings (7 cols) & Inquiries/Support (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">
        
        {/* Recent Bookings (7 cols) */}
        <div className="xl:col-span-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm">Recent Mentoring Bookings</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-200/80 text-slate-800">
                  {stats.totalBookings} Total
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any booking to open intake details, Google Meet link, or 9-part session summary
              </p>
            </div>
            <button 
              onClick={() => router.push('/admin/bookings')} 
              className="text-xs font-mono font-bold text-[#B45309] hover:text-[#92400E] flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/90 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3 font-semibold">Student &amp; Ref</th>
                  <th className="px-5 py-3 font-semibold">Slot &amp; Topic</th>
                  <th className="px-5 py-3 font-semibold">Mode / Fee</th>
                  <th className="px-5 py-3 font-semibold">Status &amp; Meet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentBookings.length > 0 ? (
                  recentBookings.map((b) => {
                    const bookingRef = b._id ? `#${String(b._id).slice(-6).toUpperCase()}` : '';
                    return (
                      <tr 
                        key={b._id} 
                        className="hover:bg-amber-50/30 cursor-pointer transition-colors" 
                        onClick={() => router.push('/admin/bookings')}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{b.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                              #{b.sessionNumber || 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {bookingRef && (
                              <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                Ref: {bookingRef}
                              </span>
                            )}
                            {b.phone && (
                              <span className="text-[11px] text-slate-400 font-mono">{b.phone}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 max-w-[200px]">
                          <div className="font-medium text-slate-800 truncate" title={b.topic || b.concern}>
                            {b.topic || b.concern || 'Mentoring Session'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {b.preferredDate
                              ? `${new Date(b.preferredDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short'
                                })}${b.preferredTime ? ` • ${b.preferredTime.split(' (')[0]}` : ''}`
                              : b.createdAt
                              ? `Booked ${new Date(b.createdAt).toLocaleDateString('en-IN')}`
                              : '—'}
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {b.bookingMode === 'coupon_waiver' || b.couponCode ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 font-mono">
                              Coupon {b.couponCode || ''}
                            </span>
                          ) : b.bookingMode === 'subscription_credit' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                              Plan Credit
                            </span>
                          ) : b.paymentStatus === 'paid' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Paid ₹{b.paymentAmount || 0}
                            </span>
                          ) : b.paymentStatus === 'pending' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              Payment Due
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              1st Intro Free
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex flex-col items-start gap-1.5">
                            <StatusBadge status={b.status} />
                            {b.meetingLink && b.meetingLink.startsWith('https://meet.google.com/') && (
                              <a
                                href={b.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-2xs"
                              >
                                <Video className="w-3 h-3" />
                                <span>Join Meet</span>
                                <ArrowUpRight className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      No bookings recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols): Tabbed Inquiries, Institutions & Support Desk */}
        <div className="xl:col-span-5 bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden flex flex-col">
          <div className="px-5 pt-3.5 pb-0 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-900 text-sm">Inquiries &amp; Support Feed</h2>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    rightTab === 'contacts'
                      ? '/admin/contacts'
                      : rightTab === 'institutions'
                      ? '/admin/institutions'
                      : '/admin/support'
                  )
                }
                className="text-xs font-mono font-bold text-[#B45309] hover:text-[#92400E] flex items-center gap-1 cursor-pointer"
              >
                <span>Open Desk</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              {[
                { id: 'contacts', label: `Mentoring (${stats.totalContacts})` },
                { id: 'institutions', label: `Institutions (${stats.institutionalEnquiries})` },
                { id: 'support', label: `Support (${stats.totalSupport})` }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setRightTab(t.id)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                    rightTab === t.id
                      ? 'border-[#F59E0B] text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            {rightTab === 'contacts' && (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-2.5">Name</th>
                    <th className="px-5 py-2.5">Message / Subject</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentContacts.length > 0 ? (
                    recentContacts.map((c) => (
                      <tr
                        key={c._id}
                        onClick={() => router.push('/admin/contacts')}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          <div>{c.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{c.phone || c.email}</div>
                        </td>
                        <td className="px-5 py-3 truncate max-w-[180px] text-slate-600">
                          {c.subject || c.message || 'Mentoring Inquiry'}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={c.status || 'new'} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-slate-400">
                        No mentoring contact inquiries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {rightTab === 'institutions' && (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-2.5">Institution</th>
                    <th className="px-5 py-2.5">Contact</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInstitutions.length > 0 ? (
                    recentInstitutions.map((inst) => (
                      <tr
                        key={inst._id}
                        onClick={() => router.push('/admin/institutions')}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          <div>{inst.institutionName || inst.name}</div>
                          <div className="text-[10px] text-slate-400">{inst.city || inst.institutionType}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          <div>{inst.contactPerson || inst.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{inst.phone}</div>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={inst.status || 'new'} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-slate-400">
                        No institutional enquiries recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {rightTab === 'support' && (
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-2.5">User</th>
                    <th className="px-5 py-2.5">Issue / Subject</th>
                    <th className="px-5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSupport.length > 0 ? (
                    recentSupport.map((t) => (
                      <tr
                        key={t._id}
                        onClick={() => router.push('/admin/support')}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-5 py-3 font-semibold text-slate-900">{t.name}</td>
                        <td className="px-5 py-3 truncate max-w-[180px] text-slate-700">{t.subject}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-5 py-12 text-center text-slate-400">
                        No support tickets recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* Quick Administrative Actions Bar */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-4">
          Quick Administrative Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/admin/bookings"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#F59E0B] hover:bg-amber-50/40 transition-all flex items-center gap-3 text-xs font-semibold text-slate-800 group"
          >
            <Calendar className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
            <span>Manage Bookings</span>
          </Link>

          <Link
            href="/admin/payments"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#F59E0B] hover:bg-amber-50/40 transition-all flex items-center gap-3 text-xs font-semibold text-slate-800 group"
          >
            <Tag className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
            <span>Fees &amp; Coupons</span>
          </Link>

          <Link
            href="/admin/opportunities/new"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#F59E0B] hover:bg-amber-50/40 transition-all flex items-center gap-3 text-xs font-semibold text-slate-800 group"
          >
            <PlusCircle className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
            <span>Post Opportunity</span>
          </Link>

          <Link
            href="/admin/resources/new"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#F59E0B] hover:bg-amber-50/40 transition-all flex items-center gap-3 text-xs font-semibold text-slate-800 group"
          >
            <PlusCircle className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
            <span>Publish Article</span>
          </Link>

          <Link
            href="/admin/settings"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#F59E0B] hover:bg-amber-50/40 transition-all flex items-center gap-3 text-xs font-semibold text-slate-800 group"
          >
            <ShieldCheck className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
            <span>Account Security</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
