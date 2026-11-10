'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  submitBooking,
  getAvailableBookingSlots,
  getPaymentConfig,
  validateCouponCode,
  createPaymentOrder,
  bookWithSubscriptionCredit,
  generateIdempotencyKey
} from '../../lib/api';
import { openCashfreeCheckout } from '../../lib/cashfreeClient';
import { useUserAuth } from '../../context/UserAuthContext';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import Captcha from '../../components/Captcha';
import HoneypotField from '../../components/HoneypotField';
import Reveal from '../../components/ui/Reveal';
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  Lock,
  Calendar,
  UserCheck,
  Edit3,
  RefreshCw,
  User as UserIcon
} from 'lucide-react';

const TOPIC_PROMPTS = [
  'Confusion about stream, course or career',
  'Postgraduate study vs work',
  'Confidence or communication',
  'How to make better use of college life',
  'Preparing for work or interviews',
  'Handling family expectations',
  'Finding direction when feeling stuck',
];

const TIME_SLOTS = [
  '10:00 AM – 10:45 AM (Morning)',
  '11:00 AM – 11:45 AM (Late Morning)',
  '02:00 PM – 02:45 PM (Afternoon)',
  '03:30 PM – 04:15 PM (Late Afternoon)',
  '05:00 PM – 05:45 PM (Evening)',
  '06:15 PM – 07:00 PM (Evening)',
  '07:30 PM – 08:15 PM (Night)'
];

export default function BookPage() {
  const router = useRouter();
  const {
    user,
    loading: authLoading,
    isAuthenticated,
    isOnboarded,
    remainingCredits,
    activeSubscription,
    sessionCount,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    requestEmailOtp,
    verifyEmailOtpAndLogin,
    refreshUser
  } = useUserAuth();

  // Synchronous ref lock to block rapid double-clicks
  const isSubmittingRef = useRef(false);
  const currentIdempotencyKeyRef = useRef(null);

  // Inline Login / Register + OTP / 2FA State (Shown when user is not logged in)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtpStep, setAuthOtpStep] = useState(false);
  const [authOtpCode, setAuthOtpCode] = useState('');
  const [authOtpPurpose, setAuthOtpPurpose] = useState('register'); // 'register' | 'login_2fa'
  const [authOtpInfoMsg, setAuthOtpInfoMsg] = useState('');
  const [authResendCooldown, setAuthResendCooldown] = useState(0);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [hpWebsite, setHpWebsite] = useState('');

  // Session-only fields (Shown ONLY after login & 1-time onboarding)
  const [sessionForm, setSessionForm] = useState({
    topic: '',
    usefulGoal: '',
    preferredDate: '',
    preferredTime: '',
    aiNotesConsent: true
  });

  // Booking Factor: 'CREDIT' | 'SINGLE_SESSION' | 'MONTHLY_4' | 'QUARTERLY_8'
  const [selectedBookingFactor, setSelectedBookingFactor] = useState('SINGLE_SESSION');

  const [status, setStatus] = useState({
    loading: false,
    success: false,
    error: null,
    confirmedBooking: null
  });

  const [paymentConfig, setPaymentConfig] = useState({
    paymentsEnabled: false,
    sessionFee: 500,
    firstSessionFreeEnabled: true,
    limitOneFreeSessionPerUser: true,
    feeNotice: '',
    canBookFreeSession: true,
    hasAlreadyBookedFirstSession: false,
    currency: 'INR',
    plans: [],
    loaded: false
  });

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Live slot availability state for selected date (prevents double-booking & clashes)
  const [slotAvailability, setSlotAvailability] = useState({
    loading: false,
    date: '',
    slots: TIME_SLOTS.map((slot) => ({ slot, available: true, reason: 'available' }))
  });

  const refreshSlotsForDate = async (dateStr) => {
    if (!dateStr) {
      setSlotAvailability({
        loading: false,
        date: '',
        slots: TIME_SLOTS.map((slot) => ({ slot, available: true, reason: 'available' }))
      });
      return;
    }
    setSlotAvailability((prev) => ({ ...prev, loading: true, date: dateStr }));
    try {
      const res = await getAvailableBookingSlots(dateStr);
      const fetchedSlots = res?.data?.slots || [];
      setSlotAvailability({
        loading: false,
        date: dateStr,
        slots:
          fetchedSlots.length > 0
            ? fetchedSlots
            : TIME_SLOTS.map((slot) => ({ slot, available: true, reason: 'available' }))
      });
      // If currently selected preferredTime is no longer available on this date, clear it
      setSessionForm((prev) => {
        if (!prev.preferredTime) return prev;
        const found = fetchedSlots.find((s) => s.slot === prev.preferredTime);
        if (found && !found.available) {
          return { ...prev, preferredTime: '' };
        }
        return prev;
      });
    } catch {
      setSlotAvailability({
        loading: false,
        date: dateStr,
        slots: TIME_SLOTS.map((slot) => ({ slot, available: true, reason: 'available' }))
      });
    }
  };

  useEffect(() => {
    if (sessionForm.preferredDate) {
      refreshSlotsForDate(sessionForm.preferredDate);
    }
  }, [sessionForm.preferredDate]);

  useEffect(() => {
    if (authResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setAuthResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [authResendCooldown]);

  // Automatically redirect logged-in user to /onboarding if they haven't completed the 1-time post-login intake yet!
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isOnboarded) {
      router.replace('/onboarding?next=/book');
    }
  }, [authLoading, isAuthenticated, isOnboarded, router]);

  useEffect(() => {
    getPaymentConfig()
      .then((res) => {
        if (res?.data) {
          setPaymentConfig({
            paymentsEnabled: Boolean(res.data.paymentsEnabled),
            sessionFee: res.data.sessionFee ?? 500,
            firstSessionFreeEnabled:
              res.data.firstSessionFreeEnabled !== undefined
                ? Boolean(res.data.firstSessionFreeEnabled)
                : true,
            limitOneFreeSessionPerUser:
              res.data.limitOneFreeSessionPerUser !== undefined
                ? Boolean(res.data.limitOneFreeSessionPerUser)
                : true,
            feeNotice: res.data.feeNotice || '',
            canBookFreeSession: Boolean(res.data.canBookFreeSession),
            hasAlreadyBookedFirstSession: Boolean(res.data.hasAlreadyBookedFirstSession),
            currency: res.data.currency || 'INR',
            plans: res.data.plans || [],
            loaded: true
          });
        }
      })
      .catch(() => {
        setPaymentConfig((prev) => ({ ...prev, loaded: true }));
      });
  }, [isAuthenticated, sessionCount]);

  // Clear or re-validate coupon if selected plan changes
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponError('');
  }, [selectedBookingFactor]);

  // Automatically select 'CREDIT' mode if user has active subscription credits
  useEffect(() => {
    if (isAuthenticated && remainingCredits > 0) {
      setSelectedBookingFactor('CREDIT');
    } else if (selectedBookingFactor === 'CREDIT' && remainingCredits === 0) {
      setSelectedBookingFactor('SINGLE_SESSION');
    }
  }, [isAuthenticated, remainingCredits, selectedBookingFactor]);

  // Refresh idempotency key when session topic or plan changes
  useEffect(() => {
    currentIdempotencyKeyRef.current = generateIdempotencyKey('book');
  }, [sessionForm.topic, selectedBookingFactor, sessionForm.preferredDate, sessionForm.preferredTime]);

  const handleGoogleLoginSuccess = async ({ credential, accessToken }) => {
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const res = await loginWithGoogle({ credential, accessToken });
      if (!res.user?.onboardingCompleted) {
        router.push('/onboarding?next=/book');
      }
    } catch (err) {
      setAuthError(err.message || 'Google sign-in failed');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleEmailAuthSubmit = async (e) => {
    e?.preventDefault();
    setAuthError('');
    if (!authEmail || !authEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!authPassword || authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (authMode === 'register' && !authName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (authMode === 'register' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !captchaToken) {
      setAuthError('Please complete the "I am not a robot" security check.');
      return;
    }

    setAuthSubmitting(true);
    try {
      let res;
      if (authMode === 'register') {
        res = await registerWithEmail({
          name: authName,
          email: authEmail,
          password: authPassword,
          captchaToken,
          _hp_website: hpWebsite
        });
      } else {
        res = await loginWithEmail({
          email: authEmail,
          password: authPassword,
          _hp_website: hpWebsite
        });
      }

      if (res.requiresOtp) {
        setAuthOtpStep(true);
        setAuthOtpCode('');
        setAuthOtpPurpose(res.purpose || (authMode === 'register' ? 'register' : 'login_2fa'));
        setAuthOtpInfoMsg(
          res.message ||
            `A 6-digit verification code has been sent to ${authEmail.trim().toLowerCase()}.`
        );
        setAuthResendCooldown(res.retryAfterSeconds || 45);
        return;
      }

      if (!res.user?.onboardingCompleted) {
        router.push('/onboarding?next=/book');
      }
    } catch (err) {
      setCaptchaToken('');
      setCaptchaResetKey((prev) => prev + 1);
      setAuthError(
        err.message || (authMode === 'register' ? 'Could not create account' : 'Invalid email or password')
      );
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleVerifyAuthOtpSubmit = async (e) => {
    e?.preventDefault();
    setAuthError('');
    const cleanOtp = authOtpCode.replace(/\D/g, '').slice(0, 6);
    if (cleanOtp.length !== 6) {
      setAuthError('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await verifyEmailOtpAndLogin({
        email: authEmail.trim().toLowerCase(),
        otp: cleanOtp,
        name: authMode === 'register' ? authName.trim() : undefined
      });
      if (!res.user?.onboardingCompleted) {
        router.push('/onboarding?next=/book');
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid or expired verification code');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendAuthOtp = async () => {
    if (authResendCooldown > 0 || authSubmitting) return;
    setAuthError('');
    setAuthSubmitting(true);
    try {
      const res = await requestEmailOtp({
        email: authEmail.trim().toLowerCase(),
        name: authMode === 'register' ? authName.trim() : undefined
      });
      setAuthOtpInfoMsg(
        res.message || `A fresh 6-digit code has been sent to ${authEmail.trim().toLowerCase()}.`
      );
      setAuthResendCooldown(res.retryAfterSeconds || 45);
    } catch (err) {
      setAuthError(err.message || 'Could not resend verification code');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleAddTopicPrompt = (promptText) => {
    setSessionForm((prev) => {
      const current = prev.topic.trim();
      const updated = current ? `${current}; ${promptText}` : promptText;
      return { ...prev, topic: updated };
    });
  };

  const selectedPlanObj = (paymentConfig.plans || []).find(
    (p) => p.code === selectedBookingFactor
  );

  // Determine whether this user has already used their 1st complimentary session
  const hasUsedFirstFreeSession =
    Boolean(user?.hasUsedFreeSession) ||
    Number(sessionCount || 0) >= 1 ||
    Boolean(paymentConfig.hasAlreadyBookedFirstSession);

  // Determine whether a Single Session is free (without coupon) for this user right now
  const isSingleSessionFreeWithoutCoupon = !hasUsedFirstFreeSession
    ? !paymentConfig.paymentsEnabled || paymentConfig.firstSessionFreeEnabled
    : !paymentConfig.limitOneFreeSessionPerUser && !paymentConfig.paymentsEnabled;

  const singleSessionBaseFee = Number(paymentConfig.sessionFee || 500);

  const handleApplyCoupon = async () => {
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const targetPlanCode =
        selectedBookingFactor === 'MONTHLY_4' || selectedBookingFactor === 'QUARTERLY_8'
          ? selectedBookingFactor
          : 'SINGLE_SESSION';
      const res = await validateCouponCode({
        code: cleanCode,
        planCode: targetPlanCode
      });
      if (res?.data) {
        setAppliedCoupon(res.data);
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Invalid or expired coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  // Main Session / Subscription Booking Submit Handler (Only accessible after Login + Onboarding)
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || status.loading) return;

    if (!isAuthenticated) {
      router.push('/login?next=/book');
      return;
    }
    if (!isOnboarded) {
      router.push('/onboarding?next=/book');
      return;
    }

    if (!sessionForm.topic.trim()) {
      setStatus({
        loading: false,
        success: false,
        error: 'Please share in 2–3 lines what you would like to focus on in this session.',
        confirmedBooking: null
      });
      return;
    }

    if (!sessionForm.preferredDate || !sessionForm.preferredTime) {
      setStatus({
        loading: false,
        success: false,
        error: 'Please select both a Preferred Date and an available Time Slot so we can reserve your non-clashing Google Meet session.',
        confirmedBooking: null
      });
      return;
    }

    isSubmittingRef.current = true;
    setStatus({ loading: true, success: false, error: null, confirmedBooking: null });

    if (!currentIdempotencyKeyRef.current) {
      currentIdempotencyKeyRef.current = generateIdempotencyKey('book');
    }
    const idempKey = currentIdempotencyKeyRef.current;

    try {
      // =====================================================================
      // CASE A: REDEEM 1 CREDIT FROM ACTIVE SUBSCRIPTION (1-CLICK, ₹0 CHECKOUT)
      // =====================================================================
      if (selectedBookingFactor === 'CREDIT' && remainingCredits > 0) {
        const creditRes = await bookWithSubscriptionCredit(
          {
            topic: sessionForm.topic,
            usefulGoal: sessionForm.usefulGoal,
            preferredDate: sessionForm.preferredDate || undefined,
            preferredTime: sessionForm.preferredTime || undefined,
            aiNotesConsent: Boolean(sessionForm.aiNotesConsent)
          },
          idempKey
        );

        await refreshUser();
        setStatus({
          loading: false,
          success: true,
          error: null,
          confirmedBooking: creditRes.data
        });
        return;
      }

      // =====================================================================
      // CASE B: SUBSCRIBE TO MULTI-SESSION / MONTHLY PLAN (E.G. 4 SESSIONS/MONTH)
      // =====================================================================
      if (selectedBookingFactor === 'MONTHLY_4' || selectedBookingFactor === 'QUARTERLY_8') {
        const orderRes = await createPaymentOrder(
          {
            purpose: 'subscription_purchase',
            planCode: selectedBookingFactor,
            couponCode: appliedCoupon?.code || undefined,
            bookingData: {
              topic: sessionForm.topic,
              usefulGoal: sessionForm.usefulGoal,
              preferredDate: sessionForm.preferredDate || undefined,
              preferredTime: sessionForm.preferredTime || undefined,
              aiNotesConsent: Boolean(sessionForm.aiNotesConsent)
            }
          },
          idempKey
        );

        const { paymentSessionId, environment, alreadyPaid, couponWaived, booking, orderId } = orderRes.data;
        if (alreadyPaid) {
          await refreshUser();
          if (couponWaived && booking) {
            setStatus({
              loading: false,
              success: true,
              error: null,
              confirmedBooking: booking
            });
            return;
          }
          router.push(`/book/status?order_id=${orderId}`);
          return;
        }
        await openCashfreeCheckout(paymentSessionId, environment);
        return;
      }

      // =====================================================================
      // CASE C: SINGLE SESSION (COMPLIMENTARY 1ST SESSION, COUPON WAIVER, OR PAID)
      // =====================================================================
      const payload = {
        topic: sessionForm.topic,
        concern: sessionForm.topic,
        usefulGoal: sessionForm.usefulGoal,
        preferredDate: sessionForm.preferredDate || undefined,
        preferredTime: sessionForm.preferredTime || undefined,
        aiNotesConsent: Boolean(sessionForm.aiNotesConsent),
        couponCode: appliedCoupon?.code || undefined
      };

      const requiresPaidCheckout =
        !isSingleSessionFreeWithoutCoupon && !appliedCoupon?.isFreeWithCoupon;

      if (requiresPaidCheckout) {
        const orderRes = await createPaymentOrder(
          {
            purpose: 'single_booking',
            planCode: 'SINGLE_SESSION',
            couponCode: appliedCoupon?.code || undefined,
            bookingData: payload
          },
          idempKey
        );

        const { paymentSessionId, environment, alreadyPaid, couponWaived, booking, orderId } = orderRes.data;
        if (alreadyPaid) {
          await refreshUser();
          if (couponWaived && booking) {
            setStatus({
              loading: false,
              success: true,
              error: null,
              confirmedBooking: booking
            });
            return;
          }
          router.push(`/book/status?order_id=${orderId}`);
          return;
        }
        await openCashfreeCheckout(paymentSessionId, environment);
        return;
      }

      // Complimentary 1st Session OR 100% Coupon Waiver
      const freeRes = await submitBooking(payload, idempKey);
      await refreshUser();
      setStatus({
        loading: false,
        success: true,
        error: null,
        confirmedBooking: freeRes.data
      });
    } catch (err) {
      // If a concurrent user booked the same slot milliseconds earlier (409 Conflict), refresh slot availability immediately
      if (sessionForm.preferredDate) {
        refreshSlotsForDate(sessionForm.preferredDate);
      }
      // Reset idempotency key so the user can retry after choosing a new slot
      currentIdempotencyKeyRef.current = null;
      setStatus({
        loading: false,
        success: false,
        error: err.message || 'Failed to submit request. Please try again.',
        confirmedBooking: null
      });
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* S1: Hero */}
      <section className="pt-24 sm:pt-32 md:pt-40 pb-10 sm:pb-14 md:pb-16 border-b border-line">
        <div className="container-editorial">
          <Reveal>
            <p className="eyebrow mb-4">Start a Conversation</p>
            <h1 className="font-serif text-display-lg text-ink max-w-4xl mb-5">
              You do not need to have everything <span className="italic text-signal">figured out</span> before reaching out.
            </h1>
            <p className="text-base md:text-lg text-ink-2 max-w-2xl leading-relaxed">
              {isAuthenticated && isOnboarded
                ? `Welcome back, ${user.name.split(' ')[0]}. Your one-time profile is saved—choose your booking plan or subscription credit below and tell us what you want to focus on today.`
                : 'Sign in with Google first. Right after signing in, we ask your background & consent questions once—and then you can book single sessions or a 4-session monthly plan in one click.'}
            </p>
          </Reveal>
        </div>
      </section>

      {/* S2: Main Content */}
      <section className="section-padding">
        <div className="container-editorial">
          {authLoading ? (
            <div className="card-editorial bg-white p-12 text-center max-w-xl mx-auto">
              <p className="text-sm font-mono text-muted">Checking your account session...</p>
            </div>
          ) : !isAuthenticated ? (
            /* =============================================================== */
            /* STATE 1: NOT LOGGED IN -> SIGN IN REQUIRED FIRST (NO FORM!)     */
            /* =============================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-5xl mx-auto">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-signal/10 text-signal text-xs font-mono uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal inline-block" />
                  <span>Step 1 of 2 • Sign In Required</span>
                </div>
                <h2 className="font-serif text-3xl md:text-4xl text-ink leading-tight">
                  Sign in once to start your mentoring journey.
                </h2>
                <p className="text-sm md:text-base text-ink-2 leading-relaxed">
                  We no longer ask you to fill out a long intake form for every session. Here is how it works:
                </p>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-xl bg-paper-2 border border-line flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-signal mt-0.5">01</span>
                    <div>
                      <p className="font-semibold text-ink text-sm">Sign In with Google (or Email + OTP)</p>
                      <p className="text-xs text-muted mt-0.5">
                        Creates your secure Mentee Account with verified email &amp; 2FA protection.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-paper-2 border border-line flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-signal mt-0.5">02</span>
                    <div>
                      <p className="font-semibold text-ink text-sm">Answer Background &amp; Consent Questions Once</p>
                      <p className="text-xs text-muted mt-0.5">
                        Asked immediately after your first sign-in and saved permanently to your profile.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-paper-2 border border-line flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-signal mt-0.5">03</span>
                    <div>
                      <p className="font-semibold text-ink text-sm">Book Single Sessions or 4 Sessions / Month</p>
                      <p className="text-xs text-muted mt-0.5">
                        Book in seconds using subscription credits and view all past sessions &amp; 7-Day Next Steps in your Dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="card-editorial bg-white p-5 sm:p-7 md:p-9">
                  <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-signal block">
                        Mentee Account
                      </span>
                      <h3 className="font-serif text-2xl text-ink mt-0.5">
                        {authOtpStep
                          ? authOtpPurpose === 'register'
                            ? 'Verify Your Email'
                            : '2-Step Verification'
                          : authMode === 'register'
                          ? 'Create Account'
                          : 'Sign In to Book'}
                      </h3>
                    </div>
                    <div className="inline-flex p-1 rounded-xl bg-paper-2 border border-line">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setAuthOtpStep(false);
                          setAuthOtpCode('');
                          setAuthError('');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          authMode === 'login'
                            ? 'bg-ink text-paper shadow-sm'
                            : 'text-muted hover:text-ink'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setAuthOtpStep(false);
                          setAuthOtpCode('');
                          setAuthError('');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          authMode === 'register'
                            ? 'bg-ink text-paper shadow-sm'
                            : 'text-muted hover:text-ink'
                        }`}
                      >
                        New User
                      </button>
                    </div>
                  </div>

                  {/* Google 1-Click Login */}
                  {!authOtpStep && (
                    <>
                      <div className="mb-6">
                        <GoogleSignInButton
                          text={authMode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}
                          onSuccess={handleGoogleLoginSuccess}
                          onError={(msg) => setAuthError(msg)}
                          onFallbackClick={() => {
                            const el = document.getElementById('book-auth-email');
                            el?.focus();
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

                  {authError && (
                    <div className="mb-4 p-3.5 rounded-xl bg-signal/10 border border-signal/30 text-signal text-xs font-medium">
                      {authError}
                    </div>
                  )}

                  {authOtpStep ? (
                    <form onSubmit={handleVerifyAuthOtpSubmit} className="space-y-4">
                      <div className="p-4 rounded-xl bg-sprout/10 border border-sprout/30 text-xs text-ink-2 space-y-1">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-sprout font-bold block">
                          {authOtpPurpose === 'register'
                            ? 'Step 2 of 2 • Legitimate Email Verification'
                            : 'Step 2 of 2 • 2-Factor Authentication (2FA)'}
                        </span>
                        <p className="text-ink font-medium">{authOtpInfoMsg}</p>
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
                          value={authOtpCode}
                          onChange={(e) => setAuthOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          className="field text-center font-mono text-2xl tracking-[0.35em] py-3"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={authSubmitting || authOtpCode.length !== 6}
                        className="btn-editorial w-full justify-center py-3.5 text-sm disabled:opacity-50"
                      >
                        <span>
                          {authSubmitting
                            ? 'Verifying Code...'
                            : authOtpPurpose === 'register'
                            ? 'Verify Email & Create Account'
                            : 'Verify 2FA Code & Sign In'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <div className="flex items-center justify-between pt-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthOtpStep(false);
                            setAuthOtpCode('');
                            setAuthError('');
                          }}
                          className="text-muted hover:text-ink font-medium"
                        >
                          ← Change Email / Back
                        </button>

                        <button
                          type="button"
                          disabled={authResendCooldown > 0 || authSubmitting}
                          onClick={handleResendAuthOtp}
                          className="inline-flex items-center gap-1.5 font-semibold text-signal disabled:text-muted"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>
                            {authResendCooldown > 0
                              ? `Resend Code in ${authResendCooldown}s`
                              : 'Resend Verification Code'}
                          </span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                        <HoneypotField value={hpWebsite} onChange={setHpWebsite} />
                        {authMode === 'register' && (
                          <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1.5">
                              Your Full Name <span className="text-signal">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={authName}
                              onChange={(e) => setAuthName(e.target.value)}
                              placeholder="e.g., Aarav Sharma"
                              className="field"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1.5">
                            Email Address <span className="text-signal">*</span>
                          </label>
                          <input
                            id="book-auth-email"
                            type="email"
                            required
                            value={authEmail}
                            onChange={(e) => setAuthEmail(e.target.value)}
                            placeholder="yourname@gmail.com"
                            className="field"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-mono uppercase tracking-wider text-ink-2">
                              Password <span className="text-signal">*</span>
                            </label>
                            {authMode === 'register' && (
                              <span className="text-[10px] text-muted font-mono">Min 6 characters</span>
                            )}
                          </div>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="••••••••"
                            className="field"
                          />
                        </div>

                        {authMode === 'register' && (
                          <div className="pt-1">
                            <Captcha
                              onVerify={(token) => {
                                setCaptchaToken(token);
                                setAuthError('');
                              }}
                              onExpired={() => setCaptchaToken('')}
                              resetKey={captchaResetKey}
                            />
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={authSubmitting}
                          className="btn-editorial w-full justify-center py-3.5 text-sm disabled:opacity-50"
                        >
                          <span>
                            {authSubmitting
                              ? authMode === 'register'
                                ? 'Sending Verification OTP...'
                                : 'Verifying & Sending 2FA Code...'
                              : authMode === 'register'
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
                            setAuthMode(authMode === 'register' ? 'login' : 'register');
                            setAuthOtpStep(false);
                            setAuthOtpCode('');
                            setAuthError('');
                          }}
                          className="text-xs text-muted hover:text-signal transition-colors font-medium"
                        >
                          {authMode === 'register'
                            ? 'Already have an account? Sign in here →'
                            : "Don't have an account yet? Create one here →"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : !isOnboarded ? (
            /* =============================================================== */
            /* STATE 2: LOGGED IN BUT NOT ONBOARDED -> REDIRECTING TO SETUP    */
            /* =============================================================== */
            <div className="card-editorial bg-white p-10 text-center max-w-xl mx-auto space-y-4">
              <UserCheck className="w-8 h-8 text-signal mx-auto" />
              <h2 className="font-serif text-3xl text-ink">
                Let&apos;s Complete Your One-Time Profile First
              </h2>
              <p className="text-sm text-ink-2">
                Taking you to your one-time background &amp; consent questions so you never have to fill them again...
              </p>
              <Link href="/onboarding?next=/book" className="btn-editorial">
                <span>Continue to One-Time Profile Setup</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* =============================================================== */
            /* STATE 3: LOGGED IN & ONBOARDED -> STREAMLINED BOOKING ENGINE!   */
            /* =============================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
              {/* Left Sidebar: Saved Profile & Past Sessions */}
              <div className="lg:col-span-4 space-y-6">
                <div className="card-editorial bg-white p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-sprout font-bold">
                      <UserCheck className="w-4 h-4" />
                      1-Time Profile Verified
                    </span>
                    <Link
                      href="/onboarding?next=/book"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-signal hover:underline"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                  </div>

                  <div>
                    <p className="font-serif text-2xl text-ink">{user.name}</p>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      {user.whereCurrently || 'Participant'}
                      {user.institutionOrOrg ? ` • ${user.institutionOrOrg}` : ''}
                      {user.city ? ` • ${user.city}` : ''}
                      <br />
                      WhatsApp: {user.phone} • {user.email}
                    </p>
                  </div>

                  {remainingCredits > 0 && (
                    <div className="p-3.5 rounded-xl bg-sprout/10 border border-sprout/30 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-ink block">
                          Subscription Credits
                        </span>
                        <span className="text-[11px] text-muted">
                          {activeSubscription?.planName}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-sprout text-white font-mono text-xs font-bold">
                        {remainingCredits} Left
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                    <span className="text-muted">Past / Active Sessions: <strong>{sessionCount}</strong></span>
                    <Link href="/dashboard" className="font-semibold text-signal hover:underline">
                      Open Dashboard →
                    </Link>
                  </div>
                </div>

                {/* Direct Contact Fallback */}
                <div className="p-6 rounded-2xl bg-paper-2 border border-line space-y-3 text-sm">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted">
                    Need Help Scheduling?
                  </p>
                  <a
                    href="https://wa.me/917737220724"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-ink-2 hover:text-signal transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-signal" />
                    <span>WhatsApp: +91 77372 20724</span>
                  </a>
                  <a
                    href="mailto:unfoldinn26@gmail.com"
                    className="flex items-center gap-2.5 text-ink-2 hover:text-signal transition-colors"
                  >
                    <Mail className="w-4 h-4 text-signal" />
                    <span>unfoldinn26@gmail.com</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Plan / Credit Picker + Topic & Slot */}
              <div className="lg:col-span-8">
                <div className="card-editorial bg-white p-5 sm:p-7 md:p-10">
                  {status.success ? (
                    <div className="py-8 text-center max-w-lg mx-auto space-y-6">
                      <div className="w-16 h-16 rounded-full bg-sprout/15 text-sprout flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="font-serif text-3xl text-ink">
                        Session #{status.confirmedBooking?.sessionNumber || sessionCount} Confirmed!
                      </h3>
                      <p className="text-sm text-ink-2 leading-relaxed">
                        {status.confirmedBooking?.bookingMode === 'subscription_credit'
                          ? `1 credit has been redeemed from your subscription plan (${remainingCredits} credits remaining).`
                          : 'Your session has been recorded in your Mentee Dashboard. We will confirm your exact time on WhatsApp shortly.'}
                      </p>

                      <div className="p-5 rounded-xl bg-paper-2 border border-line text-left text-sm space-y-2">
                        {status.confirmedBooking?._id && (
                          <div className="flex items-center justify-between pb-2 mb-1 border-b border-line">
                            <span className="text-xs font-mono uppercase tracking-wider text-muted">
                              Booking Reference
                            </span>
                            <span className="px-2.5 py-0.5 rounded bg-ink text-paper font-mono text-xs font-bold">
                              #{String(status.confirmedBooking._id).slice(-6).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <p><strong>Focus:</strong> {status.confirmedBooking?.topic || sessionForm.topic}</p>
                        {(status.confirmedBooking?.preferredDate || sessionForm.preferredDate) && (
                          <p>
                            <strong>Preferred Slot:</strong>{' '}
                            {new Date(
                              status.confirmedBooking?.preferredDate || sessionForm.preferredDate
                            ).toLocaleDateString('en-IN')}{' '}
                            {status.confirmedBooking?.preferredTime || sessionForm.preferredTime}{' '}
                            <span className="text-xs text-muted">(IST • Asia/Kolkata)</span>
                          </p>
                        )}
                        {status.confirmedBooking?.meetingLink &&
                          status.confirmedBooking.meetingLink.startsWith('https://meet.google.com/') && (
                            <div className="pt-2.5 mt-2.5 border-t border-line space-y-2">
                              <p className="text-xs font-mono uppercase tracking-wider text-sprout font-bold">
                                ✓ Google Meet Session Link Ready
                              </p>
                              <a
                                href={status.confirmedBooking.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sprout text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                              >
                                <span>Join Google Meet Session</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </a>
                              <p className="text-xs text-muted break-all">
                                {status.confirmedBooking.meetingLink}
                              </p>
                            </div>
                          )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/dashboard" className="btn-editorial">
                          <span>View in My Dashboard</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSessionForm({
                              topic: '',
                              usefulGoal: '',
                              preferredDate: '',
                              preferredTime: '',
                              aiNotesConsent: true
                            });
                            setStatus({ loading: false, success: false, error: null, confirmedBooking: null });
                          }}
                          className="btn-editorial-outline"
                        >
                          Book Another Session
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleBookingSubmit} className="space-y-8">
                      {/* 1. Choose Plan or Subscription Credit */}
                      <div className="space-y-4">
                        <div className="border-b border-line pb-3">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-signal block">
                            1. Select Booking Option or Subscription Model
                          </span>
                          <h2 className="font-serif text-2xl text-ink mt-0.5">
                            How would you like to book this session?
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                          {remainingCredits > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedBookingFactor('CREDIT')}
                              className={`md:col-span-3 p-4 rounded-xl border-2 text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                selectedBookingFactor === 'CREDIT'
                                  ? 'border-sprout bg-sprout/10 shadow-sm'
                                  : 'border-line bg-paper hover:border-sprout/50'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-2.5 py-0.5 rounded-full bg-sprout text-white text-[10px] font-mono uppercase font-bold">
                                    1-Click Instant Booking
                                  </span>
                                  <span className="font-serif text-lg text-ink font-semibold">
                                    Redeem 1 Credit from {activeSubscription?.planName || 'Your Subscription'}
                                  </span>
                                </div>
                                <p className="text-xs text-ink-2 mt-1">
                                  You have <strong>{remainingCredits} session credits remaining</strong>. Zero checkout needed.
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-serif text-2xl text-sprout font-bold">₹0 Due</span>
                                <span className="block text-[10px] font-mono text-muted">Uses 1 Credit</span>
                              </div>
                            </button>
                          )}

                          {/* Single Session */}
                          <button
                            type="button"
                            onClick={() => setSelectedBookingFactor('SINGLE_SESSION')}
                            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              selectedBookingFactor === 'SINGLE_SESSION'
                                ? 'border-ink bg-ink text-paper shadow-sm'
                                : 'border-line bg-paper text-ink hover:border-ink/40'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider opacity-75 block">
                                  Single Session
                                </span>
                                {!isSingleSessionFreeWithoutCoupon && hasUsedFirstFreeSession && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-signal/20 text-signal font-mono uppercase font-bold">
                                    Session #{Number(sessionCount || 1) + 1}
                                  </span>
                                )}
                              </div>
                              <p className="font-serif text-xl mt-0.5">1 Session</p>
                              <p className="text-xs mt-1 opacity-80 leading-snug">
                                {isSingleSessionFreeWithoutCoupon && !hasUsedFirstFreeSession
                                  ? 'Your 1st introductory conversation with Deepak Sir is complimentary'
                                  : 'One focused 30–45 min conversation + 7-Day Next Step'}
                              </p>
                            </div>
                            <div className="mt-4 pt-2.5 border-t border-current/15 flex items-baseline justify-between">
                              <span className="font-serif text-xl">
                                {isSingleSessionFreeWithoutCoupon
                                  ? 'Complimentary'
                                  : `₹${singleSessionBaseFee}`}
                              </span>
                              <span className="text-[10px] font-mono opacity-75">
                                {isSingleSessionFreeWithoutCoupon && !hasUsedFirstFreeSession
                                  ? '1st Intro Free'
                                  : '1 Session'}
                              </span>
                            </div>
                          </button>

                          {/* Monthly Subscription (4 Sessions / Month) */}
                          <button
                            type="button"
                            onClick={() => setSelectedBookingFactor('MONTHLY_4')}
                            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              selectedBookingFactor === 'MONTHLY_4'
                                ? 'border-signal bg-signal text-white shadow-sm'
                                : 'border-signal/40 bg-paper-2 text-ink hover:border-signal'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                                  Monthly Plan
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/15 font-mono uppercase font-bold">
                                  Popular
                                </span>
                              </div>
                              <p className="font-serif text-xl mt-0.5">4 Sessions / Month</p>
                              <p className="text-xs mt-1 opacity-85 leading-snug">
                                Weekly mentoring rhythm (1/week) + 1-click credit booking
                              </p>
                            </div>
                            <div className="mt-4 pt-2.5 border-t border-current/15 flex items-baseline justify-between">
                              <span className="font-serif text-xl">
                                ₹{selectedPlanObj?.code === 'MONTHLY_4' ? selectedPlanObj.price : 1600}
                              </span>
                              <span className="text-[10px] font-mono opacity-85">Save 20%</span>
                            </div>
                          </button>

                          {/* 90-Day Pack (8 Sessions / 3 Months) */}
                          <button
                            type="button"
                            onClick={() => setSelectedBookingFactor('QUARTERLY_8')}
                            className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                              selectedBookingFactor === 'QUARTERLY_8'
                                ? 'border-ink bg-ink text-paper shadow-sm'
                                : 'border-line bg-paper text-ink hover:border-ink/40'
                            }`}
                          >
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider opacity-75 block">
                                90-Day Pack
                              </span>
                              <p className="font-serif text-xl mt-0.5">8 Sessions / 3 Mo</p>
                              <p className="text-xs mt-1 opacity-80 leading-snug">
                                Complete career, college &amp; confidence transition pack
                              </p>
                            </div>
                            <div className="mt-4 pt-2.5 border-t border-current/15 flex items-baseline justify-between">
                              <span className="font-serif text-xl">
                                ₹{selectedPlanObj?.code === 'QUARTERLY_8' ? selectedPlanObj.price : 2800}
                              </span>
                              <span className="text-[10px] font-mono opacity-75">Save 30%</span>
                            </div>
                          </button>
                        </div>

                        {!isSingleSessionFreeWithoutCoupon && hasUsedFirstFreeSession && selectedBookingFactor === 'SINGLE_SESSION' && (
                          <div className="p-3.5 rounded-xl bg-paper-2 border border-line text-xs text-ink-2 flex items-center justify-between gap-3">
                            <span>
                              You have already used your <strong>1st Complimentary Introductory Session</strong>. For Session #{Number(sessionCount || 1) + 1}, you can pay the session fee (₹{singleSessionBaseFee}), choose a Monthly Plan, or apply an Admin Coupon Code below.
                            </span>
                          </div>
                        )}

                        {/* Coupon Code Box (Shown whenever booking a paid single session or subscription plan, or if user wants to enter a coupon) */}
                        {selectedBookingFactor !== 'CREDIT' &&
                          (!isSingleSessionFreeWithoutCoupon ||
                            selectedBookingFactor === 'MONTHLY_4' ||
                            selectedBookingFactor === 'QUARTERLY_8') && (
                            <div className="p-4 rounded-xl bg-paper-2 border border-line space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <label className="text-xs font-mono uppercase tracking-wider text-ink-2 font-semibold">
                                  Have an Admin Coupon Code?
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={couponInput}
                                    onChange={(e) => {
                                      setCouponInput(e.target.value.toUpperCase());
                                      setCouponError('');
                                    }}
                                    placeholder="e.g. FREE100 or MENTOR50"
                                    className="px-3 py-1.5 rounded-lg border border-line bg-white text-xs font-mono uppercase text-ink focus:outline-none focus:border-ink"
                                  />
                                  {appliedCoupon ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAppliedCoupon(null);
                                        setCouponInput('');
                                        setCouponError('');
                                      }}
                                      className="px-3 py-1.5 rounded-lg border border-line bg-white text-xs font-semibold text-signal hover:bg-paper"
                                    >
                                      Remove
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={couponLoading || !couponInput.trim()}
                                      onClick={handleApplyCoupon}
                                      className="px-3.5 py-1.5 rounded-lg bg-ink text-paper text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                                    >
                                      {couponLoading ? 'Checking...' : 'Apply Coupon'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {couponError && (
                                <p className="text-xs text-signal font-medium">{couponError}</p>
                              )}

                              {appliedCoupon && (
                                <div className="p-2.5 rounded-lg bg-sprout/10 border border-sprout/30 text-xs text-ink flex flex-wrap items-center justify-between gap-2">
                                  <span>
                                    ✓ Coupon <strong className="font-mono">{appliedCoupon.code}</strong> applied (
                                    {appliedCoupon.discountType === 'PERCENTAGE'
                                      ? `${appliedCoupon.discountValue}% OFF`
                                      : `₹${appliedCoupon.discountValue} OFF`}
                                    )
                                  </span>
                                  <span className="font-mono font-bold text-sprout">
                                    <s>₹{appliedCoupon.originalAmount}</s> → ₹{appliedCoupon.finalAmount}{' '}
                                    {appliedCoupon.isFreeWithCoupon ? '(100% Free Waiver!)' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                      </div>

                      {/* 2. Session Focus & Slot (Only 2 inputs!) */}
                      <div className="space-y-5 pt-2 border-t border-line">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1.5">
                            2. What would you like to talk about in this session? <span className="text-signal">*</span>
                          </label>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {TOPIC_PROMPTS.map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() => handleAddTopicPrompt(prompt)}
                                className="text-[11px] px-2.5 py-1 rounded-full border border-line bg-paper-2 text-ink-2 hover:border-signal hover:text-signal transition-colors"
                              >
                                + {prompt}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={3}
                            maxLength={1000}
                            required
                            value={sessionForm.topic}
                            onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })}
                            placeholder="Write 2–3 lines about what is on your mind for this session..."
                            className="field resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1.5">
                            What would make this session useful for you? (Optional)
                          </label>
                          <input
                            type="text"
                            maxLength={500}
                            value={sessionForm.usefulGoal}
                            onChange={(e) => setSessionForm({ ...sessionForm, usefulGoal: e.target.value })}
                            placeholder="e.g., Clarity on my next 7-day action step..."
                            className="field"
                          />
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-mono uppercase tracking-wider text-ink-2 mb-1.5">
                              Preferred Date <span className="text-signal">*</span>
                            </label>
                            <input
                              type="date"
                              required
                              min={new Date().toISOString().split('T')[0]}
                              value={sessionForm.preferredDate}
                              onChange={(e) => setSessionForm({ ...sessionForm, preferredDate: e.target.value })}
                              className="field max-w-xs"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs font-mono uppercase tracking-wider text-ink-2">
                                Select Non-Clashing Time Slot (45 Min • IST) <span className="text-signal">*</span>
                              </label>
                              {sessionForm.preferredDate && (
                                <button
                                  type="button"
                                  onClick={() => refreshSlotsForDate(sessionForm.preferredDate)}
                                  className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-2 hover:text-signal"
                                >
                                  <RefreshCw className={`w-3 h-3 ${slotAvailability.loading ? 'animate-spin' : ''}`} />
                                  <span>{slotAvailability.loading ? 'Checking slots...' : 'Refresh availability'}</span>
                                </button>
                              )}
                            </div>

                            {!sessionForm.preferredDate ? (
                              <div className="p-4 rounded-xl border border-dashed border-line bg-paper-2 text-xs text-muted">
                                Please select a <strong>Preferred Date</strong> above first to see live available time slots for that day.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {slotAvailability.slots.map((slotItem) => {
                                  const isSelected = sessionForm.preferredTime === slotItem.slot;
                                  const isAvailable = slotItem.available;
                                  const isBooked = slotItem.reason === 'booked';
                                  const isPast = slotItem.reason === 'past';

                                  return (
                                    <button
                                      key={slotItem.slot}
                                      type="button"
                                      disabled={!isAvailable || slotAvailability.loading}
                                      onClick={() =>
                                        setSessionForm({ ...sessionForm, preferredTime: slotItem.slot })
                                      }
                                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                                        !isAvailable
                                          ? 'border-line bg-paper-2/60 text-muted opacity-60 cursor-not-allowed'
                                          : isSelected
                                          ? 'border-ink bg-ink text-paper shadow-sm'
                                          : 'border-line bg-paper hover:border-ink/40 text-ink'
                                      }`}
                                    >
                                      <span className="text-xs font-medium">{slotItem.slot}</span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold shrink-0 ${
                                          isBooked
                                            ? 'bg-signal/15 text-signal'
                                            : isPast
                                            ? 'bg-stone/40 text-muted'
                                            : isSelected
                                            ? 'bg-sprout text-white'
                                            : 'bg-sprout/15 text-sprout'
                                        }`}
                                      >
                                        {isBooked ? 'Booked' : isPast ? 'Passed' : isSelected ? 'Selected' : 'Available'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Session Continuity & AI-Assisted Notes Consent Disclosure */}
                        <div className="p-4 rounded-xl bg-paper-2 border border-line">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(sessionForm.aiNotesConsent)}
                              onChange={(e) =>
                                setSessionForm({ ...sessionForm, aiNotesConsent: e.target.checked })
                              }
                              className="mt-1 h-4 w-4 rounded border-line text-signal focus:ring-signal"
                            />
                            <div className="text-xs text-ink-2 leading-relaxed">
                              <span className="font-semibold text-ink block">
                                Consent for Structured Session Notes &amp; Continuity Briefs (Optional)
                              </span>
                              Allow Unfoldinn to generate structured post-session notes and a 7-day continuity summary (using Google Meet notes/transcripts when enabled or mentor notes) so Deepak Sir can prepare for your future sessions. If unchecked, only manual mentor-entered notes will be used.
                            </div>
                          </label>
                        </div>
                      </div>

                      {status.error && (
                        <div className="p-4 rounded-xl bg-signal/10 border border-signal/30 text-signal text-sm">
                          {status.error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={status.loading}
                        className="btn-editorial w-full md:w-auto py-3.5 px-8 disabled:opacity-50"
                      >
                        {selectedBookingFactor === 'CREDIT' && remainingCredits > 0 ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {status.loading
                                ? 'Confirming Session...'
                                : `Confirm Session Using 1 Credit (${remainingCredits} Left)`}
                            </span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        ) : appliedCoupon?.isFreeWithCoupon ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {status.loading
                                ? 'Confirming with Coupon...'
                                : `Confirm with 100% Coupon (${appliedCoupon.code} • ₹0)`}
                            </span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        ) : selectedBookingFactor === 'MONTHLY_4' ? (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>
                              {status.loading
                                ? 'Opening Secure Checkout...'
                                : `Subscribe (4 Sessions / Month • ₹${
                                    appliedCoupon
                                      ? appliedCoupon.finalAmount
                                      : selectedPlanObj?.code === 'MONTHLY_4'
                                      ? selectedPlanObj.price
                                      : 1600
                                  }) & Book Session`}
                            </span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        ) : selectedBookingFactor === 'QUARTERLY_8' ? (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>
                              {status.loading
                                ? 'Opening Secure Checkout...'
                                : `Activate 8-Session Pack (₹${
                                    appliedCoupon
                                      ? appliedCoupon.finalAmount
                                      : selectedPlanObj?.code === 'QUARTERLY_8'
                                      ? selectedPlanObj.price
                                      : 2800
                                  }) & Book Session`}
                            </span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        ) : !isSingleSessionFreeWithoutCoupon ? (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>
                              {status.loading
                                ? 'Opening Secure Checkout...'
                                : `Pay ₹${
                                    appliedCoupon ? appliedCoupon.finalAmount : singleSessionBaseFee
                                  } & Confirm Session`}
                            </span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            <span>
                              {status.loading
                                ? 'Confirming...'
                                : !hasUsedFirstFreeSession
                                ? 'Confirm 1st Complimentary Session'
                                : 'Confirm Session Request'}
                            </span>
                            <ArrowUpRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
