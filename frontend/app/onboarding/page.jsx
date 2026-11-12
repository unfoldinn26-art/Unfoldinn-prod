'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  ShieldCheck,
  
  UserCheck
} from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';

const CURRENT_STAGE_OPTIONS = [
  'School (Class 11–12)',
  'College (UG)',
  'Postgraduate',
  'Working',
  'Taking a gap / figuring things out',
  'Other',
];

const SOURCE_OPTIONS = [
  'Friend / Classmate',
  'Parent / Family',
  'LinkedIn',
  'Instagram / Social Media',
  'School / College / University',
  'Search / Website',
  'Other',
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/book';

  const { user, loading, isAuthenticated, completeOnboarding } = useUserAuth();

  const [formData, setFormData] = useState({
    name: '',
    userType: 'student',
    age: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentRelation: 'Parent / Guardian',
    parentConsentConfirmed: false,
    dpdpConsentConfirmed: false,
    whereCurrently: '',
    institutionOrOrg: '',
    city: '',
    phone: '',
    source: '',
    referredBy: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
    }
  }, [loading, isAuthenticated, router, nextPath]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        userType: user.userType || prev.userType,
        age: user.age ? String(user.age) : prev.age,
        parentName: user.parentName || prev.parentName,
        parentPhone: user.parentPhone || prev.parentPhone,
        parentEmail: user.parentEmail || prev.parentEmail,
        parentConsentConfirmed: Boolean(user.parentConsentConfirmed),
        dpdpConsentConfirmed: Boolean(user.dpdpConsentConfirmed || user.onboardingCompleted),
        whereCurrently: user.whereCurrently || prev.whereCurrently,
        institutionOrOrg: user.institutionOrOrg || prev.institutionOrOrg,
        city: user.city || prev.city,
        phone: user.phone || prev.phone,
        source: user.source || prev.source,
        referredBy: user.referredBy || prev.referredBy
      }));
    }
  }, [user]);

  const numericAge = Number(formData.age);
  const isUnder18 =
    formData.userType === 'student' &&
    formData.age !== '' &&
    !isNaN(numericAge) &&
    numericAge < 18;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.userType === 'student' && (!formData.age || numericAge < 10 || numericAge > 99)) {
      setError('Please enter a valid age between 10 and 99.');
      return;
    }

    const cleanPhone = (formData.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile / WhatsApp number.');
      return;
    }

    if (isUnder18) {
      if (
        !formData.parentName.trim() ||
        !formData.parentPhone.trim() ||
        !formData.parentEmail.trim() ||
        !formData.parentConsentConfirmed
      ) {
        setError(
          'Under India’s DPDP Act (Section 9) for minors under 18, please share your parent/guardian’s name, phone number, email address, and confirm their consent.'
        );
        return;
      }
    }

    if (!formData.dpdpConsentConfirmed) {
      setError(
        'Please confirm that you have read and consent to the Unfoldinn Privacy Notice (DPDP Act, 2023).'
      );
      return;
    }

    setSubmitting(true);
    try {
      await completeOnboarding({
        ...formData,
        age: formData.age ? Number(formData.age) : undefined
      });
      router.push(nextPath);
    } catch (err) {
      setError(err.message || 'Could not save your profile. Please check the fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-paper pt-36 pb-24 flex items-center justify-center">
        <p className="text-sm text-charcoal font-mono">Preparing your one-time profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32 md:pt-44 pb-14 sm:pb-20">
      <div className="container-editorial max-w-3xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sage/15 text-sage text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-signal inline-block" />
            <span>One-Time Profile Setup • Asked Only Once</span>
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-ink leading-tight">
            Welcome, {user.name.split(' ')[0]}. <br />
            <span className="italic text-terracotta">Tell us a little about yourself once.</span>
          </h1>
          <p className="text-charcoal text-sm md:text-base mt-3 leading-relaxed">
            We save these details to your Mentee Profile so that every time you book a session—whether a single session or part of a 4-session monthly plan—you can book in seconds without re-filling forms.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card-editorial bg-white p-5 sm:p-7 md:p-10 space-y-6">
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2.5">
              I am joining Unfoldinn as a: <span className="text-terracotta">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'student', title: 'Young Person / Student (16–25)', desc: 'School, college, PG, early work, or figuring things out' },
                { id: 'parent', title: 'Parent / Guardian', desc: 'Exploring mentoring support for my son or daughter' }
              ].map((role) => {
                const active = formData.userType === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, userType: role.id }))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      active
                        ? 'border-ink bg-ink text-paper shadow-sm'
                        : 'border-stone/60 bg-paper/60 text-ink hover:border-ink/40'
                    }`}
                  >
                    <p className="font-semibold text-sm">{role.title}</p>
                    <p className={`text-xs mt-1 ${active ? 'text-paper/75' : 'text-charcoal'}`}>
                      {role.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* 1. Name */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
                1. Your Full Name <span className="text-terracotta">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-stone bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
              />
            </div>

            {/* 2. Age */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
                2. {formData.userType === 'parent' ? "Your Child's Age" : 'Your Age'}{' '}
                <span className="text-terracotta">*</span>
              </label>
              <input
                type="number"
                name="age"
                min="10"
                max="99"
                required={formData.userType === 'student'}
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g., 19"
                className="w-full px-4 py-3 rounded-lg border border-stone bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
              />
            </div>
          </div>

          {/* Under-18 Safeguarding Block */}
          {isUnder18 && (
            <div className="p-5 rounded-xl bg-warm border border-terracotta/30 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-serif text-lg text-ink">
                    Parent / Guardian Consent (Under 18 Safeguarding)
                  </h4>
                  <p className="text-xs text-charcoal leading-relaxed mt-1">
                    Since you are under 18, we keep a one-time parent or guardian consent record on your profile for your safety.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal mb-1.5">
                    Parent / Guardian Name <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    required={isUnder18}
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone bg-paper text-ink text-sm focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal mb-1.5">
                    Parent Mobile / WhatsApp <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    required={isUnder18}
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone bg-paper text-ink text-sm focus:outline-none focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-charcoal mb-1.5">
                    Parent Email (Safeguarding Notice) <span className="text-terracotta">*</span>
                  </label>
                  <input
                    type="email"
                    name="parentEmail"
                    required={isUnder18}
                    value={formData.parentEmail}
                    onChange={handleChange}
                    placeholder="parent@email.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-stone bg-paper text-ink text-sm focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="parentConsentConfirmed"
                  checked={formData.parentConsentConfirmed}
                  onChange={handleChange}
                  className="mt-1 rounded border-stone text-terracotta focus:ring-terracotta"
                />
                <span className="text-xs text-ink font-medium leading-relaxed">
                  My parent or guardian is aware that I am creating a Unfoldinn mentoring account and consents to these conversations. <span className="text-terracotta">*</span>
                </span>
              </label>
            </div>
          )}

          {/* 3 & 4: Current Stage & Institution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
                3. Where are you currently? <span className="text-terracotta">*</span>
              </label>
              <select
                name="whereCurrently"
                required
                value={formData.whereCurrently}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-stone bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
              >
                <option value="">Select current stage</option>
                {CURRENT_STAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
                4. School / College / Organisation
              </label>
              <input
                type="text"
                name="institutionOrOrg"
                value={formData.institutionOrOrg}
                onChange={handleChange}
                placeholder="e.g., JKLU, St. Xavier's, etc."
                className="w-full px-4 py-3 rounded-lg border border-stone bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
              />
            </div>
          </div>

          {/* 5 & 6: City & WhatsApp Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
                5. Which city are you in? <span className="text-terracotta">*</span>
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g., Jaipur"
                className="w-full px-4 py-3 rounded-lg border border-stone bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
                6. Mobile / WhatsApp Number <span className="text-terracotta">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-lg border border-stone bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
              />
            </div>
          </div>

          {/* 7 & 8: How did you hear & Referred by */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
                7. How did you hear about Unfoldinn?
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-stone bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
              >
                <option value="">Select an option</option>
                {SOURCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-2">
                8. Did someone suggest you speak with us?
              </label>
              <input
                type="text"
                name="referredBy"
                value={formData.referredBy}
                onChange={handleChange}
                placeholder="Name of teacher, friend, or parent (optional)"
                className="w-full px-4 py-3 rounded-lg border border-stone bg-paper text-ink focus:outline-none focus:border-ink transition-colors text-sm"
              />
            </div>
          </div>

          {/* Mandatory DPDP Act 2023 Section 6(1) Affirmative Privacy Notice Consent */}
          <div className="p-4 rounded-xl border border-stone bg-paper/70">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="dpdpConsentConfirmed"
                required
                checked={formData.dpdpConsentConfirmed}
                onChange={handleChange}
                className="mt-1 rounded border-stone text-ink focus:ring-ink"
              />
              <span className="text-xs text-charcoal leading-relaxed">
                I have read the{' '}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink underline font-medium"
                >
                  DPDP Data Protection &amp; Privacy Notice
                </a>{' '}
                and give my free, specific, and informed affirmative consent for Unfoldinn to process my personal data for mentoring conversations. I understand I can withdraw consent or erase my data anytime from my Dashboard. <span className="text-terracotta">*</span>
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-terracotta/10 border border-terracotta/30 text-terracotta text-xs font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-ash flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-sage" />
              Saved to {user.email} — editable anytime in Dashboard
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="btn-editorial w-full sm:w-auto justify-center py-3.5 px-8 text-sm disabled:opacity-50"
            >
              <span>{submitting ? 'Saving Profile...' : 'Save Profile & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper pt-36 pb-24 flex items-center justify-center">
          <p className="text-sm text-charcoal font-mono">Loading onboarding...</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
