import Link from 'next/link';
import PageHero from '../../components/ui/PageHero';

export const metadata = {
  title: 'Privacy, Safety & Professional Boundaries | Unfoldinn',
  description:
    'Our commitment to privacy, discretion, and safeguarding. Understand how private conversations work and our ethical boundaries for participants under and over 18.',
  alternates: {
    canonical: 'https://www.unfoldinn.com/privacy-boundaries',
  },
  openGraph: {
    title: 'Privacy, Safety & Professional Boundaries — Unfoldinn',
    description:
      'A respectful, responsible, and non-judgmental environment for young people aged 16 to 25.',
    url: 'https://www.unfoldinn.com/privacy-boundaries',
  },
};

export default function PrivacyBoundariesPage() {
  return (
    <div className="w-full">
      <PageHero
        breadcrumbs={[{ name: 'Privacy & Boundaries', href: '/privacy-boundaries' }]}
        meta={['Safeguarding & Boundaries', 'Duty of Care', 'Professional Scope']}
        title="Privacy, safety &amp; professional boundaries."
        lede="A respectful, responsible, and non-judgmental environment for young people aged 16 to 25."
      />

      <div className="page-x py-12 sm:py-16 md:py-24 max-w-[78rem]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-8 space-y-8 sm:space-y-10 text-[1rem] sm:text-[1.0625rem] leading-[1.75] text-[#4c465d]">
            {/* Section 1 */}
            <section className="rounded-[24px] border border-[#e5dfef] bg-[#f5f0ff] p-7 sm:p-10 space-y-3">
              <span className="text-[12px] font-wix-text font-semibold uppercase tracking-[0.06em] text-[#765c9c] block">
                Ethical Anchor
              </span>
              <h2 className="font-wix-display text-[1.5rem] sm:text-[1.875rem] font-semibold text-[#29253a] leading-snug tracking-[-0.02em]">
                Our Core Commitment
              </h2>
              <p className="text-[#686579] leading-relaxed">
                Unfoldinn is committed to providing a respectful, responsible and non-judgmental environment for young people. Information shared during conversations is treated with discretion and respect for privacy.
              </p>
            </section>

            {/* Section 2 */}
            <section className="rounded-[24px] border border-[#e5dfef] bg-white p-7 sm:p-10 space-y-4">
              <span className="text-[12px] font-wix-text font-semibold uppercase tracking-[0.06em] text-[#765c9c] block">
                02 · Discretion &amp; Duty of Care
              </span>
              <h2 className="font-wix-display text-[1.5rem] sm:text-[1.875rem] font-semibold text-[#29253a] leading-snug tracking-[-0.02em]">
                Confidentiality and Safety
              </h2>
              <p className="font-medium text-[#29253a]">
                While personal conversations are kept confidential, confidentiality cannot be absolute.
              </p>
              <p className="text-[#686579] leading-relaxed">
                Where there is a reasonable concern involving risk of serious harm, personal safety, abuse, harassment or another situation requiring responsible intervention, appropriate steps may need to be taken. Depending on the circumstances, this could include encouraging or involving a parent/guardian, educational institution, qualified professional or other appropriate support.
              </p>
            </section>

            {/* Section 3 */}
            <section className="rounded-[24px] border border-[#e5dfef] bg-white p-7 sm:p-10 space-y-4">
              <span className="text-[12px] font-wix-text font-semibold uppercase tracking-[0.06em] text-[#765c9c] block">
                03 · Clear Scope
              </span>
              <h2 className="font-wix-display text-[1.5rem] sm:text-[1.875rem] font-semibold text-[#29253a] leading-snug tracking-[-0.02em]">
                Professional Scope
              </h2>
              <p className="font-medium text-[#29253a]">
                Unfoldinn is not a medical, psychological, psychiatric, legal or emergency service.
              </p>
              <p className="text-[#686579] leading-relaxed">
                Conversations through Unfoldinn should not be considered a substitute for qualified mental-health counselling, therapy, medical care or other specialist professional services.
              </p>
              <p className="text-[#686579] leading-relaxed">
                Where a matter falls outside the scope of Unfoldinn, the young person will always be encouraged and supported to seek appropriate professional support.
              </p>
              <div className="p-6 rounded-[20px] border border-[#e5dfef] bg-[#faf8ff] space-y-3 text-xs sm:text-sm">
                <p className="text-[11px] font-wix-text uppercase tracking-[0.06em] text-[#b56727] font-semibold">
                  24×7 Government of India Emergency &amp; Mental Health Helplines (Mental Healthcare Act, 2017 &amp; POCSO Act, 2012)
                </p>
                <ul className="space-y-2 text-[#686579]">
                  <li>
                    <strong className="text-[#29253a]">Tele-MANAS (24×7 National Mental Health Helpline, MoHFW):</strong>{' '}
                    Call{' '}
                    <a href="tel:14416" className="underline text-[#29253a] font-semibold">14416</a>{' '}
                    or{' '}
                    <a href="tel:18008914416" className="underline text-[#29253a] font-semibold">1800-891-4416</a>
                  </li>
                  <li>
                    <strong className="text-[#29253a]">Childline India (24×7 Protection for Minors Under 18):</strong>{' '}
                    Call{' '}
                    <a href="tel:1098" className="underline text-[#29253a] font-semibold">1098</a>
                  </li>
                  <li>
                    <strong className="text-[#29253a]">National Emergency Response Support System:</strong>{' '}
                    Call{' '}
                    <a href="tel:112" className="underline text-[#29253a] font-semibold">112</a>
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="rounded-[24px] border border-[#e5dfef] bg-[#eee6ff] p-7 sm:p-10 space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ffe79a] text-[#29253a] text-[12px] font-wix-text font-semibold uppercase tracking-[0.05em]">
                Youth Safeguarding
              </span>
              <h2 className="font-wix-display text-[1.5rem] sm:text-[1.875rem] font-semibold text-[#29253a] leading-snug tracking-[-0.02em]">
                Participants Below Age 18
              </h2>
              <p className="leading-relaxed text-[#4c465d]">
                For participants below the age of 18, appropriate parental/guardian consent and safeguarding requirements will always apply.
              </p>
            </section>

            {/* Section 5 */}
            <section className="rounded-[24px] border border-[#e5dfef] bg-white p-7 sm:p-10 space-y-3">
              <span className="text-[12px] font-wix-text font-semibold uppercase tracking-[0.06em] text-[#765c9c] block">
                05 · Purpose
              </span>
              <h2 className="font-wix-display text-[1.5rem] sm:text-[1.875rem] font-semibold text-[#29253a] leading-snug tracking-[-0.02em]">
                Why These Boundaries Exist
              </h2>
              <p className="text-[#686579] leading-relaxed">
                The purpose of these boundaries is not to restrict conversation, but to ensure that Unfoldinn remains a safe, responsible and professionally appropriate space.
              </p>
            </section>
          </div>

          {/* Right Summary Card */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="rounded-[24px] bg-[#29253a] text-white p-7 space-y-5">
              <span className="inline-block px-3 py-1 rounded-full bg-[#ffe79a] text-[#29253a] text-[12px] font-wix-text font-semibold uppercase tracking-[0.05em]">
                At a Glance
              </span>
              <h3 className="font-wix-display text-[1.375rem] font-semibold leading-snug">
                Safe, human, and transparent by design.
              </h3>
              <ul className="space-y-3 text-sm text-[#e5dfef] leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffe79a] mt-2 shrink-0" />
                  <span>Discreet, non-judgmental 1:1 conversations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffe79a] mt-2 shrink-0" />
                  <span>Clear duty-of-care escalation only for safety risks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffe79a] mt-2 shrink-0" />
                  <span>Mandatory parent/guardian consent under age 18</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffe79a] mt-2 shrink-0" />
                  <span>Not a replacement for clinical or emergency care</span>
                </li>
              </ul>
              <Link
                href="/book"
                className="inline-flex items-center gap-3 w-full justify-center px-5 py-3 rounded-[100px] bg-white text-[#29253a] text-[15px] font-wix-text font-medium hover:bg-[#ffe79a] transition-colors"
              >
                Start a Conversation
                <img src="/icons/arrow-right-circle-dark.svg" alt="" className="w-5 h-5" />
              </Link>
            </div>

            <div className="rounded-[24px] border border-[#e5dfef] bg-[#f5f0ff] p-6 space-y-3">
              <p className="text-[12px] font-wix-text font-semibold uppercase tracking-[0.06em] text-[#765c9c]">
                Related Policies
              </p>
              <div className="flex flex-col gap-2 text-sm font-wix-text">
                <Link href="/privacy-policy" className="text-[#29253a] hover:text-[#b56727] transition-colors">
                  Privacy Policy →
                </Link>
                <Link href="/terms" className="text-[#29253a] hover:text-[#b56727] transition-colors">
                  Terms &amp; Conditions →
                </Link>
                <Link href="/" className="text-[#686579] hover:text-[#29253a] transition-colors">
                  ← Return to Home
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
