import Link from 'next/link';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/ui/Breadcrumbs';

export const metadata = {
  title: 'Refund & Engagement Policy | Unfoldinn',
  description:
    'Engagement and refund policy for Unfoldinn. Introductory conversations are currently complimentary with full fee transparency.',
  keywords: [
    'Unfoldinn refund policy',
    'mentoring fee terms',
    'cancellation policy',
    'complimentary conversation terms',
  ],
  alternates: {
    canonical: 'https://www.unfoldinn.com/refund-policy',
  },
  openGraph: {
    title: 'Refund & Engagement Policy — Unfoldinn',
    description: 'Engagement policy for Unfoldinn. Introductory conversations are currently complimentary.',
    url: 'https://www.unfoldinn.com/refund-policy',
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="w-full">
      <div className="page-x pt-20 sm:pt-28 md:pt-36 pb-16 sm:pb-24 md:pb-36">
        <div className="max-w-3xl mx-auto">
          <Breadcrumbs items={[{ name: 'Refund Policy', href: '/refund-policy' }]} />
          {/* Header */}
          <div className="border-b border-line pb-8 sm:pb-10 mb-8 sm:mb-12 mt-4 sm:mt-6">
            <span className="meta text-signal mb-3 sm:mb-4 block">Fair Practice Notice</span>
            <h1 className="font-serif text-[clamp(2.1rem,5.5vw,4.5rem)] leading-[1] sm:leading-[0.95] tracking-[-0.02em] text-ink mb-4 sm:mb-6">
              Engagement &amp; Refund Policy
            </h1>
            <p className="meta text-muted">
              Last Updated: October 2026
            </p>
          </div>

          {/* Core Policy Statement */}
          <div className="space-y-8 text-[1rem] leading-[1.75] text-ink-2">
            <div className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper-2 p-6 sm:p-8 md:p-10 space-y-4">
              <span className="meta text-signal block">Consumer Protection (E-Commerce) Rules, 2020 &amp; RBI Guidelines</span>
              <h2 className="font-serif text-[clamp(1.35rem,2.5vw,2rem)] text-ink leading-snug">
                1. Transparent Fee &amp; Complimentary First Session Policy
              </h2>
              <p>
                Your first introductory mentoring conversation on Unfoldinn is complimentary (unless otherwise noted during special cohort programs). For subsequent 1-on-1 sessions or multi-session mentorship plans, the exact fee in Indian Rupees (INR) is displayed upfront before checkout with <strong>zero hidden charges, drip pricing, or automatic recurring debits</strong>, in compliance with the CCPA Guidelines for Prevention and Regulation of Dark Patterns, 2023.
              </p>
            </div>

            <div className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper p-6 sm:p-8 md:p-10 space-y-4">
              <h2 className="font-serif text-[1.5rem] sm:text-[1.75rem] text-ink leading-snug">
                2. Rescheduling &amp; Cancellation of Single Sessions
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[0.9375rem] text-muted">
                <li>
                  <strong className="text-ink">Free Rescheduling:</strong> You may reschedule a confirmed session at no extra cost up to <strong>12 hours before</strong> the scheduled session start time via your Mentee Dashboard or by messaging us on WhatsApp/Email.
                </li>
                <li>
                  <strong className="text-ink">100% Refund on Timely Cancellation:</strong> Paid single sessions cancelled at least <strong>24 hours prior</strong> to the scheduled time slot are eligible for a <strong>100% full refund</strong>.
                </li>
                <li>
                  <strong className="text-ink">Mentor-Initiated Rescheduling:</strong> In the rare event that Deepak Sogani needs to reschedule a session and the alternative slot does not suit you, a <strong>100% full refund</strong> (or instant credit restoration) is issued immediately.
                </li>
              </ul>
            </div>

            <div className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper p-6 sm:p-8 md:p-10 space-y-4">
              <h2 className="font-serif text-[1.5rem] sm:text-[1.75rem] text-ink leading-snug">
                3. Multi-Session Plans (Monthly 4-Session &amp; Quarterly 8-Session Packs)
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-[0.9375rem] text-muted">
                <li>
                  <strong className="text-ink">Unused Plan Cancellation:</strong> If you purchase a multi-session plan and request a cancellation within <strong>7 days of purchase</strong> before consuming any session credits, you are entitled to a <strong>100% full refund</strong>.
                </li>
                <li>
                  <strong className="text-ink">Pro-Rata Refund on Partially Used Plans:</strong> If you wish to discontinue a multi-session plan after attending 1 or more sessions, we refund the remaining balance after deducting completed sessions at the standard single-session rate.
                </li>
                <li>
                  <strong className="text-ink">Duplicate / Accidental Double Payments:</strong> Our system automatically detects duplicate order payments and flags them for an automatic 100% refund.
                </li>
              </ul>
            </div>

            <div className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper-2 p-6 sm:p-8 md:p-10 space-y-4">
              <h2 className="font-serif text-[1.5rem] sm:text-[1.75rem] text-ink leading-snug">
                4. Refund Processing Timeline &amp; Grievance Redressal
              </h2>
              <p className="text-[0.9375rem] text-muted leading-relaxed">
                Approved refunds are initiated within <strong>48 hours</strong> and credited back to your original payment method (UPI, Debit/Credit Card, or NetBanking via <strong>Cashfree Payments India Pvt. Ltd.</strong>) within <strong>5 to 7 working days</strong> as per Reserve Bank of India (RBI) payment aggregator norms.
              </p>
              <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <Button href="/book">Start a Conversation</Button>
                <Link href="/contact" className="meta text-ink underline decoration-ink/20 hover:decoration-signal py-1 inline-block">
                  Request a Refund or Reschedule: unfoldinn26@gmail.com →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
