import Link from 'next/link';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/ui/Breadcrumbs';

export const metadata = {
  title: 'Privacy Policy | Unfoldinn',
  description:
    'Privacy Policy for Unfoldinn outlining how personal data is collected, used, protected, and respected under DPDP Act.',
  alternates: {
    canonical: 'https://www.unfoldinn.com/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy — Unfoldinn',
    description: 'Privacy Policy for Unfoldinn outlining how personal data is collected, used, and safeguarded.',
    url: 'https://www.unfoldinn.com/privacy-policy',
  },
};

const TOC = [
  { id: 'section-1', title: '1. Personal Data We Collect' },
  { id: 'section-2', title: '2. Purpose of Data Processing' },
  { id: 'under-18', title: '3. Minors Under 18 Safeguarding' },
  { id: 'section-4', title: '4. Storage & Security' },
  { id: 'section-5', title: '5. Retention Policy' },
  { id: 'section-6', title: '6. Your Privacy Rights' },
  { id: 'section-7', title: '7. Privacy & Grievance Contact' },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full">
      <div className="page-x pt-20 sm:pt-28 md:pt-36 pb-16 sm:pb-24 md:pb-36">
        <Breadcrumbs items={[{ name: 'Privacy Policy', href: '/privacy-policy' }]} />
        {/* Header */}
        <div className="border-b border-line pb-8 sm:pb-12 mb-10 sm:mb-16 mt-4 sm:mt-8">
          <span className="meta text-signal mb-3 sm:mb-4 block">Data Protection Notice</span>
          <h1 className="font-serif text-[clamp(2.1rem,5.5vw,5rem)] leading-[1] sm:leading-[0.95] tracking-[-0.02em] text-ink mb-4 sm:mb-6">
            Privacy Policy
          </h1>
          <p className="meta text-muted mb-6">
            Last Updated: October 2026 • Responsible Collection &amp; Privacy Safeguards
          </p>
          <p className="lede text-[1.125rem]">
            Unfoldinn (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;), founded by Deepak Sogani and based in Jaipur, Rajasthan, operates as a human-led mentoring and perspective platform for young people aged 16–25. This Privacy Policy outlines how we collect, process, store, and protect your personal data, and details your rights.
          </p>
        </div>

        {/* Two-Column Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left: Sticky Table of Contents */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-32 space-y-4">
              <p className="meta text-ink mb-4">Table of Contents</p>
              <ul className="space-y-2.5 border-l border-line pl-4 text-xs font-mono uppercase tracking-wider">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-muted hover:text-ink transition-colors block py-1"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right: Policy Content */}
          <div className="lg:col-span-8 max-w-[68ch] space-y-16 text-[1.0625rem] leading-[1.75] text-ink-2">
            {/* Section 1 */}
            <section id="section-1" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                1. Personal Data We Collect
              </h2>
              <p>
                We collect only the personal information reasonably necessary to evaluate your inquiry, arrange mentoring conversations, and ensure student safety:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[0.9375rem] text-muted">
                <li>
                  <strong className="text-ink">Identity and Contact Information:</strong> Full name, mobile number / WhatsApp, email address, and city of residence.
                </li>
                <li>
                  <strong className="text-ink">Academic and Demographic Context:</strong> Age, school, college, university, or current professional/educational stage.
                </li>
                <li>
                  <strong className="text-ink">Mentoring and Conversation Context:</strong> The topics, questions, or concerns you choose to write in your own words, and what would make the conversation useful.
                </li>
                <li>
                  <strong className="text-ink">Parent / Guardian Information (for Minors under 18):</strong> Parent or guardian&apos;s full name, mobile number, email, and affirmative consent record.
                </li>
                <li>
                  <strong className="text-ink">Referral Source:</strong> Information regarding how you discovered Unfoldinn (e.g., friend, LinkedIn, educator, alumni).
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                2. Purpose of Data Processing
              </h2>
              <p>We process your data strictly for legitimate mentoring purposes:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-2xl border border-line bg-paper-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-1">Scheduling &amp; Communication</p>
                  <p className="text-xs text-muted leading-relaxed">To review your conversation request and contact you directly via phone, WhatsApp, or email to schedule sessions.</p>
                </div>
                <div className="p-5 rounded-2xl border border-line bg-paper-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-1">Context Preparation</p>
                  <p className="text-xs text-muted leading-relaxed">To understand your background and situation so the mentor can provide meaningful, individualized perspective.</p>
                </div>
                <div className="p-5 rounded-2xl border border-line bg-paper-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-1">7-Day Follow-Through</p>
                  <p className="text-xs text-muted leading-relaxed">To follow up on agreed practical next steps where mutually beneficial.</p>
                </div>
                <div className="p-5 rounded-2xl border border-line bg-paper-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-1">Safeguarding &amp; Consent</p>
                  <p className="text-xs text-muted leading-relaxed">To ensure verifiable parental consent for young people under 18 and comply with legal duty of care.</p>
                </div>
              </div>
              <p className="text-xs text-muted italic pt-2">
                We do <strong>not</strong> sell, rent, monetize, or share your personal data with third-party advertisers, coaching institutes, or marketing agencies.
              </p>
            </section>

            {/* Section 3 */}
            <section id="under-18" className="scroll-mt-32 rounded-[1.75rem] border border-signal/30 bg-signal-soft/40 p-8 space-y-4">
              <span className="meta text-signal block">Mandatory Protection</span>
              <h2 className="font-serif text-[1.75rem] text-ink leading-snug">
                3. Processing Data of Individuals Under 18 (Minors)
              </h2>
              <p className="text-[0.9375rem] leading-relaxed">
                In accordance with India&apos;s Digital Personal Data Protection Act and recognized student safeguarding standards, we apply enhanced protections to individuals under the age of 18:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[0.875rem] text-muted">
                <li>
                  <strong className="text-ink">Verifiable Parental/Guardian Consent:</strong> Mentoring conversations with individuals under 18 require affirmative parental or guardian awareness and consent before any session is arranged.
                </li>
                <li>
                  <strong className="text-ink">No Behavioral Profiling or Targeted Advertising:</strong> We never engage in tracking, behavioral profiling, or commercial targeting of children.
                </li>
                <li>
                  <strong className="text-ink">Parental Involvement:</strong> Parents or guardians may request to inspect the personal data processed regarding their minor child or request deletion at any time.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                4. Data Storage and Security Measures
              </h2>
              <p>
                Your personal data is transmitted using modern Secure Sockets Layer (SSL/TLS) encryption and stored in secure, access-controlled databases (MongoDB Atlas) protected by network firewalls and strong authentication credentials. Access to intake submissions is strictly restricted to Deepak Sogani and authorized administrative oversight.
              </p>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                5. Data Retention Policy
              </h2>
              <p>
                We retain personal data only for the duration necessary to conduct your mentoring discussions and reasonable follow-through (typically 12 to 24 months after your last engagement), unless a longer retention period is required by law or safeguarding necessity. Inquiries that do not proceed to a conversation may be deleted periodically.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                6. Your Rights Under the DPDP Act
              </h2>
              <p>You have full autonomy over your personal data. You are entitled to:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="p-5 rounded-2xl border border-line bg-paper-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-1">Right to Access</p>
                  <p className="text-xs text-muted leading-relaxed">Request a summary of personal data held about you.</p>
                </div>
                <div className="p-5 rounded-2xl border border-line bg-paper-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-1">Right to Correction</p>
                  <p className="text-xs text-muted leading-relaxed">Correct inaccurate or outdated information.</p>
                </div>
                <div className="p-5 rounded-2xl border border-line bg-paper-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink font-semibold mb-1">Right to Erasure</p>
                  <p className="text-xs text-muted leading-relaxed">Request complete deletion of your records from our systems.</p>
                </div>
              </div>
              <p className="text-sm text-muted pt-2">
                To exercise any of these rights, email us at{' '}
                <a href="mailto:unfoldinn26@gmail.com" className="text-ink underline decoration-ink/20 hover:decoration-signal font-medium">
                  unfoldinn26@gmail.com
                </a>{' '}
                with the subject line &ldquo;Data Request&rdquo;. We respond within 7 business days.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="scroll-mt-32 rounded-[1.75rem] border border-line bg-paper-2 p-8 space-y-3">
              <span className="meta text-signal block">Safeguarding &amp; Privacy</span>
              <h2 className="font-serif text-[1.75rem] text-ink leading-snug">
                7. Privacy &amp; Grievance Contact
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                For any questions, concerns, or inquiries regarding personal information and privacy safeguards, you may contact:
              </p>
              <div className="text-xs sm:text-sm text-ink-2 font-mono space-y-1.5 pt-2">
                <p><strong>Contact:</strong> Deepak Sogani</p>
                <p><strong>Designation:</strong> Founder, Unfoldinn</p>
                <p><strong>Email:</strong> <a href="mailto:unfoldinn26@gmail.com" className="underline hover:text-signal">unfoldinn26@gmail.com</a></p>
                <p><strong>Location:</strong> Jaipur, Rajasthan, India</p>
              </div>
            </section>

            {/* Bottom Nav */}
            <div className="border-t border-line pt-8 flex flex-wrap items-center justify-between gap-4">
              <Link href="/" className="meta text-muted hover:text-ink">
                ← Return to Home
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/privacy-boundaries" className="meta text-muted hover:text-ink">
                  Mentoring Boundaries →
                </Link>
                <Button href="/book">Start a Conversation</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
