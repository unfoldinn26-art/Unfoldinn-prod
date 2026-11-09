'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Mail,
  KeyRound,
  User as UserIcon,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import Captcha from '../../components/Captcha';
import HoneypotField from '../../components/HoneypotField';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/dashboard';

  const {
    user,
    isAuthenticated,
    isOnboarded,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    requestEmailOtp,
    verifyEmailOtpAndLogin
  } = useUserAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState('register'); // 'register' | 'login_2fa'
  const [otpInfoMessage, setOtpInfoMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [hpWebsite, setHpWebsite] = useState('');
  const captchaRef = useRef(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (!isOnboarded) {
        router.replace(`/onboarding?next=${encodeURIComponent(nextPath)}`);
      } else {
        router.replace(nextPath);
      }
    }
  }, [isAuthenticated, isOnboarded, user, router, nextPath]);

  const handleGoogleSuccess = async ({ credential, accessToken }) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await loginWithGoogle({ credential, accessToken });
      if (!res.user?.onboardingCompleted) {
        router.push(`/onboarding?next=${encodeURIComponent(nextPath)}`);
      } else {
        router.push(nextPath);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (mode === 'register' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      setError('Please check the "I am not a robot" box before creating an account.');
      return;
    }

    setSubmitting(true);

    try {
      let res;
      if (mode === 'register') {
        res = await registerWithEmail({ name, email, password, captchaToken, _hp_website: hpWebsite });
      } else {
        res = await loginWithEmail({ email, password, _hp_website: hpWebsite });
      }

      if (res.requiresOtp) {
        setOtpStep(true);
        setOtpCode('');
        setOtpPurpose(res.purpose || (mode === 'register' ? 'register' : 'login_2fa'));
        setOtpInfoMessage(
          res.message ||
            `A 6-digit verification code has been sent to ${email.trim().toLowerCase()}.`
        );
        setResendCooldown(res.retryAfterSeconds || 45);
        setCaptchaToken('');
        setHpWebsite('');
        captchaRef.current?.reset();
        return;
      }

      if (!res.user?.onboardingCompleted) {
        router.push(`/onboarding?next=${encodeURIComponent(nextPath)}`);
      } else {
        router.push(nextPath);
      }
    } catch (err) {
      setError(err.message || (mode === 'register' ? 'Could not create account' : 'Invalid email or password'));
      captchaRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    const cleanOtp = otpCode.replace(/\D/g, '').slice(0, 6);
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await verifyEmailOtpAndLogin({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        name: mode === 'register' ? name.trim() : undefined
      });
      if (!res.user?.onboardingCompleted) {
        router.push(`/onboarding?next=${encodeURIComponent(nextPath)}`);
      } else {
        router.push(nextPath);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await requestEmailOtp({
        email: email.trim().toLowerCase(),
        name: mode === 'register' ? name.trim() : undefined
      });
      setOtpInfoMessage(
        res.message || `A fresh 6-digit code has been sent to ${email.trim().toLowerCase()}.`
      );
      setResendCooldown(res.retryAfterSeconds || 45);
    } catch (err) {
      setError(err.message || 'Could not resend verification code');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32 md:pt-44 pb-14 sm:pb-20">
      <div className="container-editorial max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Why One-Time Account */}
          <div className="lg:col-span-6 space-y-6">
            <p className="eyebrow">Mentee Account &amp; Continuity</p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink leading-[1.08]">
              Sign in once. <br />
              <span className="italic text-signal">Never re-fill the form again.</span>
            </h1>
            <p className="text-ink-2 leading-relaxed text-base md:text-lg">
              Your Unfoldinn account remembers your background, links all your past and upcoming mentoring conversations, tracks your <strong>7-Day Next Steps</strong>, and lets you book future sessions in one click.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl border border-line bg-paper-2 flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-sprout shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ink text-sm">One-Time Profile Onboarding</h3>
                  <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">
                    Answer the background &amp; safeguarding questions just once right after signup. Future bookings only ask what you want to talk about today.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-paper-2 flex items-start gap-3.5">
                <Calendar className="w-5 h-5 text-signal shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ink text-sm">Complete Past Session History &amp; 7-Day Actions</h3>
                  <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">
                    Review every past session, mentor notes shared by Deepak Sir, and update your 7-Day Next Step progress before your next conversation.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-line bg-paper-2 flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-signal shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-ink text-sm">Monthly Subscription (4 Sessions / Month) &amp; Multi-Packs</h3>
                  <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">
                    Subscribe once to a 4-session monthly rhythm or 8-session pack and book any slot in 1 click using your session credits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Login + Email & Password + OTP / 2FA Verification Card */}
          <div className="lg:col-span-6">
            <div className="card-editorial bg-white p-5 sm:p-7 md:p-9">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-signal block">
                    Unfoldinn Portal
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-ink mt-0.5">
                    {otpStep
                      ? otpPurpose === 'register'
                        ? 'Verify Your Email'
                        : '2-Step Verification'
                      : mode === 'register'
                      ? 'Create Account'
                      : 'Sign In'}
                  </h2>
                </div>
                <div className="inline-flex p-1 rounded-xl bg-paper-2 border border-line">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setOtpStep(false);
                      setOtpCode('');
                      setError('');
                      setCaptchaToken('');
                      captchaRef.current?.reset();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mode === 'login'
                        ? 'bg-ink text-paper shadow-sm'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setOtpStep(false);
                      setOtpCode('');
                      setError('');
                      setCaptchaToken('');
                      captchaRef.current?.reset();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mode === 'register'
                        ? 'bg-ink text-paper shadow-sm'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    New User
                  </button>
                </div>
              </div>

              {/* Google Sign-In */}
              {!otpStep && (
                <>
                  <div className="space-y-3 mb-6">
                    <GoogleSignInButton
                      text={mode === 'register' ? 'Sign up with Google (1-Click)' : 'Sign in with Google (1-Click)'}
                      onSuccess={handleGoogleSuccess}
                      onError={(msg) => setError(msg)}
                      onFallbackClick={() => {
                        const emailInput = document.getElementById('auth-email-input');
                        emailInput?.focus();
                      }}
                    />
                  </div>

                  <div className="relative flex py-2 items-center mb-6">
                    <div className="flex-grow border-t border-line"></div>
                    <span className="flex-shrink mx-3 text-[11px] font-mono uppercase tracking-widest text-muted">
                      Or with Email, Password &amp; OTP
                    </span>
                    <div className="flex-grow border-t border-line"></div>
                  </div>
                </>
              )}

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-signal/10 border border-signal/30 text-signal text-xs font-medium">
                  {error}
                </div>
              )}

              {otpStep ? (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  <div className="p-4 rounded-xl bg-sprout/10 border border-sprout/30 text-xs text-ink-2 space-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-sprout font-bold block">
                      {otpPurpose === 'register'
                        ? 'Step 2 of 2 • Legitimate Email Verification'
                        : 'Step 2 of 2 • 2-Factor Authentication (2FA)'}
                    </span>
                    <p className="text-ink font-medium">{otpInfoMessage}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1.5">
                      6-Digit Verification Code <span className="text-signal">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="field text-center font-mono text-2xl tracking-[0.35em] py-3"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || otpCode.length !== 6}
                    className="btn-editorial w-full justify-center py-3.5 text-sm disabled:opacity-50"
                  >
                    <span>
                      {submitting
                        ? 'Verifying Code...'
                        : otpPurpose === 'register'
                        ? 'Verify Email & Create Account'
                        : 'Verify 2FA Code & Sign In'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep(false);
                        setOtpCode('');
                        setError('');
                      }}
                      className="text-muted hover:text-ink font-medium"
                    >
                      ← Change Email / Back
                    </button>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || submitting}
                      onClick={handleResendOtp}
                      className="inline-flex items-center gap-1.5 font-semibold text-signal disabled:text-muted"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {resendCooldown > 0
                          ? `Resend Code in ${resendCooldown}s`
                          : 'Resend Verification Code'}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <HoneypotField value={hpWebsite} onChange={(e) => setHpWebsite(e.target.value)} />
                    {mode === 'register' && (
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1.5">
                          Your Full Name <span className="text-signal">*</span>
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Aarav Sharma"
                            className="field pl-10"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1.5">
                        Email Address <span className="text-signal">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="auth-email-input"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="yourname@gmail.com"
                          className="field pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-mono uppercase tracking-wider text-ink-2">
                          Password <span className="text-signal">*</span>
                        </label>
                        {mode === 'register' && (
                          <span className="text-[10px] text-muted font-mono">Min 6 characters</span>
                        )}
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="field pl-10"
                        />
                      </div>
                    </div>

                    {mode === 'register' && (
                      <Captcha
                        ref={captchaRef}
                        onVerify={setCaptchaToken}
                        onExpired={() => setCaptchaToken('')}
                      />
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-editorial w-full justify-center py-3.5 text-sm disabled:opacity-50"
                    >
                      <span>
                        {submitting
                          ? mode === 'register'
                            ? 'Sending Verification OTP...'
                            : 'Verifying & Sending 2FA Code...'
                          : mode === 'register'
                          ? 'Verify Email & Create Account'
                          : 'Continue with 2FA Verification'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'register' ? 'login' : 'register');
                        setOtpStep(false);
                        setOtpCode('');
                        setError('');
                        setCaptchaToken('');
                        captchaRef.current?.reset();
                      }}
                      className="text-xs text-muted hover:text-signal transition-colors font-medium"
                    >
                      {mode === 'register'
                        ? 'Already have an account? Sign in here →'
                        : "Don't have an account yet? Create one here →"}
                    </button>
                  </div>
                </>
              )}

              <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sprout" />
                  Past sessions with your email auto-sync
                </span>
                <Link href="/book" className="text-signal hover:underline font-medium">
                  Back to Booking →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper pt-36 pb-24 flex items-center justify-center">
          <p className="text-sm text-ink-2 font-mono">Loading account portal...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
