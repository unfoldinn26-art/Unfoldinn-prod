import Link from 'next/link';
import Button from '../../components/ui/Button';
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

      <div className="page-x py-10 sm:py-16 md:py-24 max-w-[76rem]">
        <div className="max-w-[68ch] space-y-10 sm:space-y-16 text-[1rem] sm:text-[1.0625rem] leading-[1.75] text-ink-2">
          {/* Section 1 */}
          <section className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper-2 p-6 sm:p-8 md:p-12 space-y-3">
            <span className="meta text-signal block">Ethical Anchor</span>
            <h2 className="font-serif text-[1.5rem] sm:text-[1.75rem] text-ink leading-snug">
              Our Core Commitment
            </h2>
            <p className="text-muted leading-relaxed">
              Unfoldinn is committed to providing a respectful, responsible and non-judgmental environment for young people. Information shared during conversations is treated with discretion and respect for privacy.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className="font-serif text-[1.625rem] sm:text-[2rem] text-ink leading-snug">
              Confidentiality and Safety
            </h2>
            <p>
              While personal conversations are kept confidential, confidentiality cannot be absolute.
            </p>
            <p className="text-muted leading-relaxed">
              Where there is a reasonable concern involving risk of serious harm, personal safety, abuse, harassment or another situation requiring responsible intervention, appropriate steps may need to be taken. Depending on the circumstances, this could include encouraging or involving a parent/guardian, educational institution, qualified professional or other appropriate support.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className="font-serif text-[1.625rem] sm:text-[2rem] text-ink leading-snug">
              Professional Scope
            </h2>
            <p>
              Unfoldinn is not a medical, psychological, psychiatric, legal or emergency service.
            </p>
            <p className="text-muted leading-relaxed">
              Conversations through Unfoldinn should not be considered a substitute for qualified mental-health counselling, therapy, medical care or other specialist professional services.
            </p>
            <p className="text-muted leading-relaxed">
              Where a matter falls outside the scope of Unfoldinn, the young person will always be encouraged and supported to seek appropriate professional support.
            </p>
            <div className="p-5 rounded-2xl border border-line bg-paper-2 space-y-2 text-xs sm:text-sm">
              <p className="font-mono text-xs uppercase tracking-wider text-signal font-semibold">
                24×7 Government of India Emergency &amp; Mental Health Helplines (Mental Healthcare Act, 2017 &amp; POCSO Act, 2012)
              </p>
              <ul className="space-y-1 text-muted">
                <li><strong className="text-ink">Tele-MANAS (24×7 National Mental Health Helpline, MoHFW):</strong> Call <a href="tel:14416" className="underline text-ink font-mono">14416</a> or <a href="tel:18008914416" className="underline text-ink font-mono">1800-891-4416</a></li>
                <li><strong className="text-ink">Childline India (24×7 Protection for Minors Under 18):</strong> Call <a href="tel:1098" className="underline text-ink font-mono">1098</a></li>
                <li><strong className="text-ink">National Emergency Response Support System:</strong> Call <a href="tel:112" className="underline text-ink font-mono">112</a></li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-signal/30 bg-signal-soft/40 p-6 sm:p-8 space-y-3">
            <span className="meta text-signal block">Youth Safeguarding</span>
            <h2 className="font-serif text-[1.5rem] sm:text-[1.75rem] text-ink leading-snug">
              Participants Below Age 18
            </h2>
            <p className="leading-relaxed text-ink-2">
              For participants below the age of 18, appropriate parental/guardian consent and safeguarding requirements will always apply.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className="font-serif text-[1.625rem] sm:text-[2rem] text-ink leading-snug">
              Why These Boundaries Exist
            </h2>
            <p className="text-muted leading-relaxed">
              The purpose of these boundaries is not to restrict conversation, but to ensure that Unfoldinn remains a safe, responsible and professionally appropriate space.
            </p>
          </section>

          {/* Footer Navigation */}
          <div className="border-t border-line pt-6 sm:pt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Link href="/" className="meta text-muted hover:text-ink py-1">
              ← Return to Home
            </Link>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Link href="/privacy-policy" className="meta text-muted hover:text-ink py-1">
                Privacy Policy →
              </Link>
              <Button href="/book">Start a Conversation</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
