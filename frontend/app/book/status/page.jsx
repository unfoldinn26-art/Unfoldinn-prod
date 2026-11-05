'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MessageCircle,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  verifyPaymentOrder,
  createPaymentOrder,
  savePostPaymentSlotPreference,
  generateIdempotencyKey
} from '../../../lib/api';
import { openCashfreeCheckout } from '../../../lib/cashfreeClient';
import { useUserAuth } from '../../../context/UserAuthContext';

const TIME_SLOTS = [
  'Morning (10:00 AM – 12:00 PM)',
  'Afternoon (2:00 PM – 5:00 PM)',
  'Evening (5:00 PM – 8:00 PM)',
  'Weekend Slot (Flexible)',
];

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const bookingId = searchParams.get('booking_id');
  const { isAuthenticated, refreshUser } = useUserAuth();

  const [state, setState] = useState({
    loading: true,
    isPaid: false,
    orderStatus: null,
    booking: null,
    subscription: null,
    slotUpdateToken: null,
    paymentDetails: null,
    error: null,
    retrying: false,
  });

  // Post-payment Slot Selection State
  const [slotForm, setSlotForm] = useState({
    preferredDate: '',
    preferredTime: TIME_SLOTS[2],
    topic: '',
    saving: false,
    saved: false,
    error: null,
  });

  useEffect(() => {
    if (!orderId && !bookingId) {
      setState({
        loading: false,
        isPaid: false,
        orderStatus: 'INVALID',
        booking: null,
        subscription: null,
        slotUpdateToken: null,
        paymentDetails: null,
        error: 'No payment order reference found in the URL.',
        retrying: false,
      });
      return;
    }

    verifyPaymentOrder({ orderId, bookingId })
      .then((res) => {
        setState({
          loading: false,
          isPaid: Boolean(res.isPaid),
          orderStatus: res.orderStatus,
          booking: res.data || null,
          subscription: res.subscription || null,
          slotUpdateToken: res.slotUpdateToken || null,
          paymentDetails: res.paymentDetails || null,
          error: null,
          retrying: false,
        });
        if (res.isPaid) {
          refreshUser();
        }
        if (res.data?.preferredDate) {
          setSlotForm((prev) => ({
            ...prev,
            preferredDate: new Date(res.data.preferredDate).toISOString().split('T')[0],
            preferredTime: res.data.preferredTime || TIME_SLOTS[2],
            saved: true,
          }));
        }
      })
      .catch((err) => {
        setState({
          loading: false,
          isPaid: false,
          orderStatus: 'ERROR',
          booking: null,
          subscription: null,
          slotUpdateToken: null,
          paymentDetails: null,
          error: err.message || 'Unable to verify payment status right now.',
          retrying: false,
        });
      });
  }, [orderId, bookingId, refreshUser]);

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    const targetId = state.booking?._id || bookingId;
    if (!targetId) return;

    if (!slotForm.preferredDate || !slotForm.preferredTime) {
      setSlotForm((prev) => ({ ...prev, error: 'Please select a preferred date and time slot.' }));
      return;
    }

    setSlotForm((prev) => ({ ...prev, saving: true, error: null }));
    try {
      const res = await savePostPaymentSlotPreference(targetId, {
        preferredDate: slotForm.preferredDate,
        preferredTime: slotForm.preferredTime,
        topic: slotForm.topic || undefined,
        slotUpdateToken: state.slotUpdateToken
      });
      setState((prev) => ({ ...prev, booking: res.data }));
      setSlotForm((prev) => ({ ...prev, saving: false, saved: true, error: null }));
    } catch (err) {
      setSlotForm((prev) => ({
        ...prev,
        saving: false,
        error: err.message || 'Could not save slot preference. Please message us on WhatsApp.',
      }));
    }
  };

  const handleRetryPayment = async () => {
    const targetBookingId = state.booking?._id || bookingId;
    if (!targetBookingId) return;

    setState((prev) => ({ ...prev, retrying: true, error: null }));
    try {
      const orderRes = await createPaymentOrder(
        { bookingId: targetBookingId },
        generateIdempotencyKey(`retry_${targetBookingId}`)
      );
      const { paymentSessionId, environment, alreadyPaid, orderId: confirmedOrder } = orderRes.data;
      if (alreadyPaid) {
        window.location.href = `/book/status?order_id=${confirmedOrder}`;
        return;
      }
      await openCashfreeCheckout(paymentSessionId, environment);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        retrying: false,
        error: err.message || 'Could not re-initiate payment. Please try again.',
      }));
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if (state.loading) {
    return (
      <div className="min-h-screen bg-paper pt-36 pb-24 flex items-center justify-center">
        <div className="card-editorial bg-white p-10 md:p-14 max-w-lg w-full text-center">
          <Loader2 className="w-12 h-12 text-terracotta animate-spin mx-auto mb-6" />
          <h1 className="font-serif text-3xl text-ink mb-3">Verifying Your Payment...</h1>
          <p className="text-charcoal text-sm leading-relaxed">
            Please wait a moment while we confirm your transaction and update your Mentee Account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pt-32 pb-24 md:pt-40">
      <div className="container-editorial max-w-2xl">
        <div className="card-editorial bg-white p-8 md:p-12 text-center">
          {state.isPaid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-sage/15 text-sage flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-sage mb-2">
                {state.subscription
                  ? `${state.subscription.planName} Activated`
                  : 'Payment Confirmed · Booking Received'}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-ink mb-4">
                {state.subscription
                  ? `You Have ${state.subscription.remainingCredits} Session Credits Ready!`
                  : 'Thank You! Your Payment is Confirmed.'}
              </h1>
              <p className="text-charcoal leading-relaxed mb-8">
                {state.subscription
                  ? `Your ${state.subscription.planName} (${state.subscription.totalCredits} sessions) is now active on your account. ${
                      state.booking
                        ? `Session #${state.booking.sessionNumber || 1} has also been confirmed!`
                        : 'You can book any session in 1 click from your Mentee Dashboard.'
                    }`
                  : `We have received your payment${
                      state.booking?.name ? `, ${state.booking.name}` : ''
                    }. Please choose your preferred date & time slot below so Deepak Sir can lock in your conversation.`}
              </p>

              {/* Payment Receipt Summary */}
              <div className="p-5 rounded-xl bg-warm border border-stone/50 text-left mb-8 space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-stone/40">
                  <span className="text-ash">Order Reference</span>
                  <span className="font-mono text-ink font-medium">
                    {state.paymentDetails?.orderId || state.booking?.cashfreeOrderId || orderId}
                  </span>
                </div>
                {state.paymentDetails?.cfPaymentId && (
                  <div className="flex justify-between py-1 border-b border-stone/40">
                    <span className="text-ash">Transaction ID</span>
                    <span className="font-mono text-ink">
                      {state.paymentDetails.cfPaymentId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-stone/40">
                  <span className="text-ash">Amount Paid</span>
                  <span className="font-semibold text-ink">
                    ₹{state.paymentDetails?.amount || state.booking?.paymentAmount || state.subscription?.amountPaid || ''}
                  </span>
                </div>
                {state.subscription && (
                  <div className="flex justify-between py-1 border-b border-stone/40">
                    <span className="text-ash">Remaining Session Credits</span>
                    <span className="font-semibold text-sage">
                      {state.subscription.remainingCredits} of {state.subscription.totalCredits} Credits
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-ash">Status</span>
                  <span className="text-sage font-semibold">Paid &amp; Verified</span>
                </div>
              </div>

              {/* Post-Payment Preferred Slot Picker (if a booking exists) */}
              {state.booking && (
                <div className="text-left p-6 rounded-xl border-2 border-terracotta/30 bg-paper mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-terracotta" />
                    <span className="font-mono text-xs uppercase tracking-widest text-terracotta">
                      Schedule Your Session Slot
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl text-ink mb-2">
                    {slotForm.saved
                      ? 'Your Preferred Slot is Saved!'
                      : 'When Would You Like to Have Your Conversation?'}
                  </h3>

                  {slotForm.saved ? (
                    <div className="p-4 rounded-lg bg-sage/10 border border-sage/30 text-sm text-ink space-y-1">
                      <p>
                        <strong>Preferred Date:</strong>{' '}
                        {new Date(slotForm.preferredDate).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p>
                        <strong>Preferred Time Window:</strong> {slotForm.preferredTime}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSlotForm((prev) => ({ ...prev, saved: false }))}
                        className="text-xs text-terracotta underline font-medium mt-2 inline-block"
                      >
                        Change preferred date/time
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveSlot} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-1.5">
                            <Calendar className="w-3.5 h-3.5 inline mr-1 text-terracotta" />
                            Preferred Date <span className="text-terracotta">*</span>
                          </label>
                          <input
                            type="date"
                            min={todayStr}
                            required
                            value={slotForm.preferredDate}
                            onChange={(e) =>
                              setSlotForm((prev) => ({ ...prev, preferredDate: e.target.value }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-lg border border-stone bg-white text-ink text-sm focus:outline-none focus:border-ink"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-charcoal mb-1.5">
                            <Clock className="w-3.5 h-3.5 inline mr-1 text-terracotta" />
                            Preferred Time Slot <span className="text-terracotta">*</span>
                          </label>
                          <select
                            value={slotForm.preferredTime}
                            onChange={(e) =>
                              setSlotForm((prev) => ({ ...prev, preferredTime: e.target.value }))
                            }
                            className="w-full px-3.5 py-2.5 rounded-lg border border-stone bg-white text-ink text-sm focus:outline-none focus:border-ink"
                          >
                            {TIME_SLOTS.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {slotForm.error && (
                        <p className="text-xs text-terracotta">{slotForm.error}</p>
                      )}

                      <button
                        type="submit"
                        disabled={slotForm.saving}
                        className="btn-editorial w-full justify-center disabled:opacity-50"
                      >
                        <span>{slotForm.saving ? 'Saving Slot...' : 'Save Preferred Session Slot'}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isAuthenticated && (
                  <Link href="/dashboard" className="btn-editorial">
                    <span>Go to My Mentee Dashboard</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                )}
                <a
                  href={`https://wa.me/917737220724?text=${encodeURIComponent(
                    `Hi Deepak Sir, I have completed my payment (Order ID: ${
                      state.paymentDetails?.orderId || orderId
                    })${
                      slotForm.preferredDate
                        ? ` and selected ${slotForm.preferredDate} (${slotForm.preferredTime})`
                        : ''
                    } for my Unfoldinn mentoring session.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-editorial-outline"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share Confirmation on WhatsApp</span>
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-terracotta/15 text-terracotta flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-9 h-9" />
              </div>
              <p className="font-mono text-xs uppercase tracking-widest text-terracotta mb-2">
                Payment Incomplete
              </p>
              <h1 className="font-serif text-3xl md:text-4xl text-ink mb-4">
                Payment Was Not Completed
              </h1>
              <p className="text-charcoal leading-relaxed mb-8">
                {state.error ||
                  'Your details are saved safely, so you do not need to fill the form again. You can retry the payment below or reach out to us on WhatsApp.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(state.booking?._id || bookingId) && (
                  <button
                    onClick={handleRetryPayment}
                    disabled={state.retrying}
                    className="btn-editorial disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${state.retrying ? 'animate-spin' : ''}`} />
                    <span>{state.retrying ? 'Opening Checkout...' : 'Retry Payment Now'}</span>
                  </button>
                )}
                <Link href="/book" className="btn-editorial-outline">
                  <span>Back to Booking Page</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-paper pt-36 pb-24 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-terracotta animate-spin" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}
