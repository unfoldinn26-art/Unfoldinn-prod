import Link from 'next/link';
import Button from '../../components/ui/Button';
import Breadcrumbs from '../../components/ui/Breadcrumbs';

export const metadata = {
  title: 'Terms & Conditions | Unfoldinn',
  description:
    'Terms of service and mentoring agreements for Unfoldinn youth mentoring platform. Transparent principles governing private conversations.',
  alternates: {
    canonical: 'https://www.unfoldinn.com/terms-and-conditions',
  },
  openGraph: {
    title: 'Terms & Conditions — Unfoldinn',
    description: 'Terms of service and mentoring agreements for Unfoldinn youth mentoring platform.',
    url: 'https://www.unfoldinn.com/terms-and-conditions',
  },
};

const TOC = [
  { id: 'section-1', title: '1. Acceptance of Terms' },
  { id: 'section-2', title: '2. Mentoring Scope & Philosophy' },
  { id: 'section-3', title: '3. Non-Therapeutic Disclosure' },
  { id: 'section-4', title: '4. Eligibility & Minor Safeguards' },
  { id: 'section-5', title: '5. Student Responsibility & Autonomy' },
  { id: 'section-6', title: '6. Institutional Engagements & Pilots' },
  { id: 'section-7', title: '7. Intellectual Property & Content' },
  { id: 'section-8', title: '8. Limitation of Liability & Disclaimers' },
  { id: 'section-9', title: '9. Governing Law & Jurisdiction' },
  { id: 'section-10', title: '10. Contact Information' },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="w-full">
      <div className="page-x pt-20 sm:pt-28 md:pt-36 pb-16 sm:pb-24 md:pb-36">
        <Breadcrumbs items={[{ name: 'Terms & Conditions', href: '/terms-and-conditions' }]} />
        {/* Header */}
        <div className="border-b border-line pb-8 sm:pb-12 mb-10 sm:mb-16 mt-4 sm:mt-8">
          <span className="meta text-signal mb-3 sm:mb-4 block">Legal Agreement</span>
          <h1 className="font-serif text-[clamp(2.1rem,5.5vw,5rem)] leading-[1] sm:leading-[0.95] tracking-[-0.02em] text-ink mb-4 sm:mb-6">
            Terms &amp; Conditions
          </h1>
          <p className="meta text-muted mb-6">
            Effective Date: October 2026 • Governing Unfoldinn Mentoring Platform
          </p>
          <p className="lede text-[1.125rem]">
            Please review these Terms &amp; Conditions carefully before engaging with Unfoldinn (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;the Platform&rdquo;), founded by Mr. Deepak Sogani and based in Jaipur, Rajasthan. By accessing our website, booking a conversation, or participating in any mentoring engagement, you agree to be bound by these Terms.
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

          {/* Right: Terms Content */}
          <div className="lg:col-span-8 max-w-[68ch] space-y-16 text-[1.0625rem] leading-[1.75] text-ink-2">
            {/* Section 1 */}
            <section id="section-1" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                1. Acceptance of Terms
              </h2>
              <p>
                By visiting <strong className="text-ink">unfoldinn.com</strong>, submitting a conversation request, interacting with our curated opportunity banks, or entering into a mentoring agreement, you acknowledge that you have read, understood, and agreed to comply with these Terms and Conditions along with our{' '}
                <Link href="/privacy-policy" className="text-ink underline decoration-ink/20 hover:decoration-signal">
                  Privacy Policy
                </Link>
                . If you do not agree with any part of these terms, you should refrain from using our services.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                2. Mentoring Scope &amp; Philosophy
              </h2>
              <p>
                Unfoldinn is a human-led mentoring and perspective platform founded to support young people (predominantly aged 16–25) through the critical transitions of education, career exploration, and adulthood.
              </p>
              <p>
                Our core methodology centers on <strong>listening, perspective, and structured reflection</strong>. The mentor acts as a trusted sounding board to help students understand context, evaluate alternatives, and identify one practical next step.
              </p>
            </section>

            {/* Section 3: Essential Non-Therapeutic Disclosure */}
            <section id="section-3" className="scroll-mt-32 rounded-[1.75rem] border border-line bg-paper-2 p-8 space-y-4">
              <span className="meta text-signal block">Important Boundary &amp; Disclosure</span>
              <h2 className="font-serif text-[1.75rem] text-ink leading-snug">
                3. Distinction from Counselling, Therapy, and Coaching
              </h2>
              <p className="text-[0.9375rem] text-ink-2 leading-relaxed">
                Unfoldinn is explicitly <strong>not</strong> a mental health clinic, psychological therapy provider, psychiatric care service, or coaching institute.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[0.875rem] text-muted">
                <li>
                  <strong>Not Medical Treatment (Mental Healthcare Act, 2017):</strong> Mentoring conversations do not substitute for clinical mental healthcare, diagnosis, or crisis intervention. If a student is experiencing clinical depression, self-harm ideation, or severe distress, they must immediately consult qualified medical professionals or call India&apos;s 24×7 Toll-Free National Mental Health Helpline (<strong>Tele-MANAS: 14416 / 1800-891-4416</strong>, or <strong>Childline: 1098</strong> for minors under 18).
                </li>
                <li>
                  <strong>Not Competitive Exam Coaching (MoE Guidelines, 2024 &amp; CCPA Norms):</strong> We do not operate as a cramming/coaching center, nor do we make misleading claims or guarantee entrance exam ranks or admissions.
                </li>
                <li>
                  <strong>Not Placement Agency:</strong> While we connect students to curated fellowships, internships, and opportunities, we do not operate as an employment consultancy or promise job offers.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                4. Eligibility &amp; Minor Safeguards (Ages 16–25)
              </h2>
              <p>
                Unfoldinn is intended for students and young adults aged 16 to 25. For any participant under the age of 18 (minors), <strong>verifiable affirmative consent from a parent or legal guardian is mandatory</strong> prior to any mentoring session.
              </p>
              <p>
                Parents have the right to attend an initial orientation conversation or request details regarding the framework used during discussions with their child.
              </p>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                5. Student Responsibility &amp; Autonomy
              </h2>
              <p>
                A core pillar of Unfoldinn is <strong>student ownership</strong>. We never tell a young person which career they must choose or make pivotal life decisions on their behalf.
              </p>
              <p>
                All final academic, vocational, and personal decisions rest entirely with the student and their family. The student is solely responsible for acting on agreed next steps and conducting their own due diligence before committing to any college, course, or employer.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                6. Institutional Engagements &amp; 90-Day Pilots
              </h2>
              <p>
                When schools, universities, or corporate foundations partner with Unfoldinn for campus cohort pilots or student leadership programs, the specific deliverables, timelines, fee structures, and reporting criteria are governed by dedicated Institutional Memoranda of Understanding (MoUs) or Service Level Agreements.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                7. Intellectual Property &amp; Content
              </h2>
              <p>
                All brand marks, logos (including the Unfoldinn Zen Ensō and dawn symbols), written essays, frameworks (such as the 7-Stage Methodology and 7-Day Next Step format), graphics, and software code on this website are the proprietary intellectual property of Mr. Deepak Sogani and Unfoldinn.
              </p>
              <p className="text-sm text-muted">
                You may read, download, or share our published resources for personal, non-commercial educational use, provided appropriate credit is visibly attributed to Unfoldinn.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                8. Limitation of Liability &amp; Disclaimers
              </h2>
              <p>
                Mentoring is a developmental process based on subjective human interaction. While Mr. Deepak Sogani brings over 35 years of corporate leadership and higher-education student affairs governance, Unfoldinn makes no warranties, express or implied, regarding specific university admissions, employment outcomes, or salary packages.
              </p>
              <p className="text-sm text-muted">
                To the fullest extent permitted by Indian law, Unfoldinn, its mentors, and associates shall not be liable for any indirect, incidental, or consequential damages resulting from choices made following a mentoring conversation.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="scroll-mt-32 space-y-4">
              <h2 className="font-serif text-[2rem] text-ink leading-snug">
                9. Governing Law &amp; Jurisdiction
              </h2>
              <p>
                These Terms and Conditions shall be governed by, construed, and enforced in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of or relating to these terms or our services shall be subject to the exclusive jurisdiction of the competent courts in <strong>Jaipur, Rajasthan, India</strong>.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="scroll-mt-32 rounded-[1.75rem] border border-line bg-paper-2 p-8 space-y-3">
              <span className="meta text-signal block">Official Notices &amp; Enquiries</span>
              <h2 className="font-serif text-[1.75rem] text-ink leading-snug">
                10. Contact Information
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                For questions regarding these Terms, legal notices, or institutional inquiries, please contact:
              </p>
              <div className="text-xs sm:text-sm text-ink-2 font-mono space-y-1.5 pt-2">
                <p><strong>Entity:</strong> Unfoldinn</p>
                <p><strong>Founder:</strong> Mr. Deepak Sogani</p>
                <p><strong>Primary Email:</strong> <a href="mailto:unfoldinn26@gmail.com" className="underline hover:text-signal">unfoldinn26@gmail.com</a></p>
                <p><strong>Helpline / WhatsApp:</strong> +91 77372 20724</p>
                <p><strong>Headquarters:</strong> Jaipur, Rajasthan, India</p>
              </div>
            </section>

            {/* Bottom Nav */}
            <div className="border-t border-line pt-8 flex flex-wrap items-center justify-between gap-4">
              <Link href="/" className="meta text-muted hover:text-ink">
                ← Return to Home
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/refund-policy" className="meta text-muted hover:text-ink">
                  Refund Policy →
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
