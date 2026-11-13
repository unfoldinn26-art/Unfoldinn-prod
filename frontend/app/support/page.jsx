'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Arrow from '../../components/ui/Arrow';
import PageHero from '../../components/ui/PageHero';
import Captcha from '../../components/Captcha';
import HoneypotField from '../../components/HoneypotField';
import { submitSupportTicket } from '../../lib/api';

const CATEGORY_OPTIONS = [
  { value: 'bug_report', label: 'Bug Report / Visual Glitch' },
  { value: 'page_not_working', label: 'Page Not Loading / 404 Error' },
  { value: 'booking_issue', label: 'Booking or Form Submission Issue' },
  { value: 'broken_link', label: 'Broken Link or Missing Opportunity' },
  { value: 'feedback_suggestion', label: 'Feature Suggestion or UX Feedback' },
  { value: 'account_login_help', label: 'Admin or Portal Access Help' },
  { value: 'other', label: 'Other Technical Query' },
];

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'bug_report',
    pageUrl: '',
    subject: '',
    description: '',
    deviceInfo: '',
  });

  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [hpWebsite, setHpWebsite] = useState('');
  const captchaRef = useRef(null);
  const [status, setStatus] = useState({ type: '', message: '', ticketId: null });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      setFormData((prev) => ({
        ...prev,
        deviceInfo: `${navigator.platform || 'Desktop'} — ${navigator.userAgent.slice(0, 80)}`,
        pageUrl: prev.pageUrl || currentUrl,
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      setStatus({
        type: 'error',
        message: 'Please complete the "I am not a robot" checkbox before submitting.',
        ticketId: null,
      });
      return;
    }
    setLoading(true);
    setStatus({ type: '', message: '', ticketId: null });

    try {
      const res = await submitSupportTicket({ ...formData, captchaToken, _hp_website: hpWebsite });
      setStatus({
        type: 'success',
        message: 'Your support ticket has been recorded in our technical system. Our team will review the issue and follow up via email.',
        ticketId: res?.data?._id || 'SI-TKT-' + Math.floor(1000 + Math.random() * 9000),
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'bug_report',
        pageUrl: '',
        subject: '',
        description: '',
        deviceInfo: '',
      });
      setHpWebsite('');
      setCaptchaToken('');
      captchaRef.current?.reset();
    } catch (err) {
      console.error(err);
      setStatus({
        type: 'error',
        message: err.message || 'Failed to submit support ticket. Please email us directly at unfoldinn26@gmail.com or message us on WhatsApp.',
        ticketId: null,
      });
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <PageHero
        breadcrumbs={[{ name: 'Support', href: '/support' }]}
        meta={['Helpdesk & Bug Reporting', 'Website Support', 'Jaipur, India']}
        title="Website Support & Technical Helpdesk"
        lede="Encountered a bug, broken page, or booking problem? Submit the details below. Our technical team monitors this queue directly to keep Unfoldinn seamless."
      />

      {/* Disambiguation Banner */}
      <section className="page-x pt-6 sm:pt-8">
        <div className="rounded-[20px] border border-[#e5dfef] bg-[#f5f0ff] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e39a5d] animate-pulse shrink-0" />
            <p className="text-xs sm:text-sm text-[#4c465d]">
              <strong className="text-[#29253a]">Looking for mentoring or institutional consulting?</strong> This form is specifically for website bugs and technical issues.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-wix-text font-semibold text-[#b56727] hover:underline shrink-0 py-1"
          >
            Go to Mentoring &amp; Consulting Contact →
          </Link>
        </div>
      </section>

      {/* Main Support Form & Quick Channels */}
      <section className="page-x py-10 sm:py-14 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
          {/* Left Column: Form */}
          <div className="lg:col-span-8">
            <div className="rounded-[28px] border border-[#e5dfef] bg-white p-6 sm:p-8 md:p-12 shadow-[0_14px_40px_rgba(41,37,58,0.05)]">
              <h2 className="font-wix-display text-[1.5rem] sm:text-[1.875rem] text-[#29253a] font-semibold tracking-[-0.02em] mb-2">
                Submit an Issue Ticket
              </h2>
              <p className="text-[#686579] text-xs sm:text-[0.9375rem] mb-6 sm:mb-8">
                Please provide specific details so we can reproduce and resolve the problem rapidly.
              </p>

              {status.type === 'success' ? (
                <div className="p-6 sm:p-8 rounded-2xl bg-sprout-soft border border-sprout-border text-center space-y-4">
                  <span className="w-12 h-12 rounded-full bg-sprout text-paper font-bold text-xl flex items-center justify-center mx-auto">
                    ✓
                  </span>
                  <h3 className="font-serif text-[1.25rem] sm:text-[1.5rem] text-ink font-semibold">
                    Ticket Received Successfully
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-2 max-w-md mx-auto leading-relaxed">
                    {status.message}
                  </p>
                  {status.ticketId && (
                    <div className="inline-block px-4 py-2 rounded-lg bg-paper border border-sprout-border font-mono text-xs text-sprout font-bold">
                      Ticket ID: {status.ticketId}
                    </div>
                  )}
                  <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setStatus({ type: '', message: '', ticketId: null })}
                      className="px-5 py-2.5 rounded-full border border-line bg-paper text-ink text-xs font-mono uppercase tracking-wider hover:border-ink transition-colors min-h-[44px] inline-flex items-center justify-center"
                    >
                      Submit Another Ticket
                    </button>
                    <Button href="/">Return to Home</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                  <HoneypotField value={hpWebsite} onChange={(e) => setHpWebsite(e.target.value)} />
                  {status.type === 'error' && (
                    <div className="p-4 rounded-xl bg-coral-soft border border-coral-border text-coral text-sm">
                      {status.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="field"
                        placeholder="e.g. Priya Sharma"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="field"
                        placeholder="priya@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                        Mobile / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="field"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                        Issue Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="field bg-paper"
                      >
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                      Page URL or Affected Area (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.pageUrl}
                      onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
                      className="field"
                      placeholder="e.g. https://unfoldinn.com/opportunities or /book"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                      Issue Summary (Subject) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="field"
                      placeholder="e.g. Opportunity filters don't update on mobile Safari"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                      Detailed Description &amp; What Happened *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="field resize-none"
                      placeholder="Please tell us what you clicked, what you expected to happen, and any error message you saw."
                    />
                  </div>

                  <Captcha
                    ref={captchaRef}
                    onVerify={setCaptchaToken}
                    onExpired={() => setCaptchaToken('')}
                  />

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="group inline-flex w-full sm:w-auto items-center justify-between sm:justify-start gap-3 font-medium transition-all duration-300 rounded-full bg-ink text-paper pl-6 sm:pl-8 pr-2 py-2 text-[0.9375rem] hover:bg-coral disabled:opacity-50 min-h-[48px]"
                    >
                      <span>{loading ? 'Submitting Ticket...' : 'Submit Support Ticket'}</span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/10 text-paper shrink-0">
                        <Arrow direction="right" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Direct Help & SLAs */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[1.75rem] border border-line bg-paper-2 space-y-4 sm:space-y-5">
              <span className="meta text-sun">Direct Channels</span>
              <h3 className="font-serif text-[1.25rem] sm:text-[1.375rem] text-ink">
                Prefer Direct Communication?
              </h3>
              <p className="text-xs sm:text-sm text-ink-2 leading-relaxed">
                If an issue is blocking your urgent conversation booking, reach out directly:
              </p>
              <div className="space-y-3 pt-2 text-sm">
                <div>
                  <span className="block text-xs text-muted font-mono uppercase">Direct Support Email</span>
                  <a href="mailto:unfoldinn26@gmail.com" className="font-medium text-ink hover:text-coral transition-colors underline break-all py-1 inline-block">
                    unfoldinn26@gmail.com
                  </a>
                </div>
                <div>
                  <span className="block text-xs text-muted font-mono uppercase">Urgent WhatsApp Help</span>
                  <a
                    href="https://wa.me/917737220724?text=Hi%20Mr.%20Deepak%20Sogani,%20I%20am%20facing%20a%20website%20technical%20issue."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink hover:text-coral transition-colors py-1 inline-block"
                  >
                    +91 77372 20724 (WhatsApp ↗)
                  </a>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[1.75rem] border border-line bg-paper space-y-3 sm:space-y-4">
              <span className="meta text-sprout">Support Commitment</span>
              <h3 className="font-serif text-[1.125rem] sm:text-[1.25rem] text-ink">
                Our Resolution Timeline
              </h3>
              <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-muted">
                <li className="flex items-start gap-2">
                  <span className="text-sprout font-bold shrink-0">✓</span>
                  <span><strong>Acknowledgement:</strong> Automated ticket creation instantly in database.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sprout font-bold shrink-0">✓</span>
                  <span><strong>First Response:</strong> Within 12 to 24 hours.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-sprout font-bold shrink-0">✓</span>
                  <span><strong>Bug Fixes:</strong> Deployed immediately to production upon verification.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
