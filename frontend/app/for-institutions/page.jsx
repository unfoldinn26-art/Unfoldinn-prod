import React from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Arrow from '../../components/ui/Arrow';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';
import { Reveal, RevealGroup, RevealItem } from '../../components/ui/Reveal';

export const metadata = {
  title: 'For Institutions | Schools, Colleges & Universities — Unfoldinn',
  description:
    'Complementing academic systems with thoughtful student conversations on choices, transitions, confidence, and real-world exposure for schools and colleges.',
  keywords: [
    'student development schools colleges',
    'student transition workshops',
    'student conversations India',
    'campus workshops Jaipur',
    'higher education student support',
  ],
  alternates: {
    canonical: 'https://www.unfoldinn.com/for-institutions',
  },
  openGraph: {
    title: 'For Institutions — Unfoldinn',
    description:
      'Working alongside existing student-support systems to create an additional space for perspective and life readiness.',
    url: 'https://www.unfoldinn.com/for-institutions',
  },
};

const FORMATS = [
  {
    title: 'Individual Conversations',
    text: 'One-to-one conversations on choices, transitions, self-understanding, and finding direction beyond the classroom.',
  },
  {
    title: 'Small-Group Conversations',
    text: 'Interactive cohort sessions addressing shared questions around future paths, peer comparisons, and building confidence.',
  },
  {
    title: 'Parent Conversations',
    text: 'Constructive dialogues helping parents understand modern career landscapes and communicate supportively with their children.',
  },
  {
    title: 'Transition & Exposure Programmes',
    text: 'Focused sessions preparing students for upcoming transitions—school to university, campus to workplace, or stepping into adulthood.',
  },
];

export default function ForInstitutionsPage() {
  return (
    <div className="w-full">
      <PageHero
        breadcrumbs={[{ name: 'For Institutions', href: '/for-institutions' }]}
        meta={['For Schools, Colleges & Universities', 'Campus Collaboration', 'Student Support']}
        title="An additional space for perspective alongside existing academic systems."
        lede="Unfoldinn can work alongside existing student-support systems to create an additional space for conversations around choices, transitions, exposure, confidence and life beyond the classroom."
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
          <Button href="/contact">Talk to Us About Your Institution</Button>
          <Button href="#formats" variant="link" arrow="down">See Engagement Formats</Button>
        </div>
      </PageHero>

      {/* The Core Role: Editorial Split */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x grid grid-cols-1 gap-8 sm:gap-12 py-16 sm:py-24 md:grid-cols-12 md:py-36">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-32">
              <SectionHead
                meta="Our role"
                title="Complementing what you already do"
              />
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <RevealGroup className="space-y-5 sm:space-y-6">
              <RevealItem as="p" className="lede">
                Educational institutions carry the essential responsibility of academic learning, administration, and formal placement systems.
              </RevealItem>
              <RevealItem as="p" className="lede">
                Unfoldinn does not seek to replace or replicate these functions. Instead, it provides a quiet, trusted sounding board where students can pause, reflect on their individual strengths and hesitations, and make sense of their options without fear of judgment.
              </RevealItem>
              <RevealItem as="blockquote" className="mt-6 sm:mt-8 border-l-2 border-signal pl-4 sm:pl-6 font-serif italic text-[1.125rem] sm:text-[1.25rem] text-ink leading-relaxed">
                &ldquo;Institutional engagements can begin small, allowing both sides to understand the need and evaluate value before considering a longer association.&rdquo;
              </RevealItem>
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* The 4 Formats */}
      <section id="formats" className="scroll-mt-24 border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Engagement formats"
            title="How we can work together"
            lede="Four focused formats structured around practical student needs."
          />

          <RevealGroup className="hairline-grid mt-10 sm:mt-16 grid-cols-1 sm:grid-cols-2">
            {FORMATS.map((fmt, idx) => (
              <RevealItem
                key={idx}
                className="group flex min-h-[14rem] sm:min-h-[16rem] flex-col justify-between p-6 sm:p-8 md:p-10 transition-colors duration-500 ease-editorial hover:bg-paper-2"
              >
                <span className="meta">{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-serif text-[1.375rem] sm:text-[1.625rem] text-ink mb-2 sm:mb-3 leading-snug">
                    {fmt.title}
                  </h3>
                  <p className="text-[0.875rem] sm:text-[1rem] text-muted leading-relaxed">
                    {fmt.text}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Starting Small & Contact CTA */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <RevealGroup className="max-w-[56rem]">
            <RevealItem as="p" className="meta mb-4 sm:mb-6">Discovery &amp; Evaluation</RevealItem>
            <RevealItem as="h2" className="font-serif text-[clamp(2.25rem,5.5vw,5rem)] leading-[0.95] text-ink">
              Start small. Understand first.
            </RevealItem>
            <RevealItem as="p" className="lede mt-5 sm:mt-6 text-[1rem] sm:text-[1.125rem]">
              We believe every campus environment is unique. A brief initial conversation helps us understand your students&apos; context and explore whether Unfoldinn can add genuine value.
            </RevealItem>
            <RevealItem className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
              <Button href="/contact">Talk to Us About Your Institution</Button>
              <Link href="mailto:unfoldinn26@gmail.com" className="meta text-ink underline decoration-ink/20 hover:decoration-signal py-1 inline-block">
                Write directly to unfoldinn26@gmail.com →
              </Link>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>
    </div>
  );
}
