import React from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Arrow from '../../components/ui/Arrow';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';
import { Reveal, RevealGroup, RevealItem } from '../../components/ui/Reveal';
import StudentOutcomesGrid from '../../components/home/StudentOutcomesGrid';

export const metadata = {
  title: 'For Students (Ages 16–25) | Perspective, Clarity & Next Steps — Unfoldinn',
  description:
    'Confused about career choices, college transitions, or what comes next? Private one-to-one conversations for ages 16–25 to think clearly and choose your path.',
  keywords: [
    'career confusion after 12th',
    'what to do after graduation if confused',
    'career guidance for college students',
    'feeling stuck in college career',
    'how to choose the right career path',
    'life guidance for 20 year olds',
    'how to build confidence for interviews',
    'finding direction in early 20s',
    'peer pressure and career choices',
    'how to talk to parents about career choice',
    'youth guidance India',
    'one on one student conversation',
  ],
  alternates: {
    canonical: 'https://unfoldinn.com/for-students',
  },
  openGraph: {
    title: 'For Students (16–25) — Unfoldinn',
    description:
      'You have the information. What you need is perspective. A space to talk openly, think clearly, and explore possibilities.',
    url: 'https://unfoldinn.com/for-students',
  },
};

const concerns = [
  "I don't know what career to choose",
  "Everyone seems to have a plan except me",
  "I'm good at studies but struggle with confidence",
  "My parents want one thing, I want another",
  "I don't know how to communicate in interviews or group settings",
  "I have no exposure beyond my classroom",
  "I'm about to graduate and I have no idea what comes next",
  "I want to do something meaningful but don't know where to start",
];

const topics = [
  "Career & higher-education uncertainty",
  "Confidence & self-belief",
  "Decision-making & ownership",
  "Communication & articulation",
  "Exposure to people, pathways & opportunities",
  "Leadership & participation",
  "Professional & life readiness",
  "Finding internships, fellowships, and scholarships",
  "Transition from education to adult life",
];

const STUDENT_FAQS = [
  {
    q: 'What can I talk about in a Unfoldinn conversation?',
    a: 'You can talk about anything on your mind: career uncertainty, feeling behind your peers, confidence hesitations, handling parental expectations, seeking exposure beyond college, or figuring out your next step after graduation.'
  },
  {
    q: 'Will Deepak Sir tell me which career to choose?',
    a: 'No. We do not provide ready-made answers or predetermined roadmaps. Your life and your choices belong to you. We help you think clearly, understand trade-offs, and see wider possibilities so you can make your own decisions with conviction.'
  },
  {
    q: 'Is my first conversation free?',
    a: 'Yes, your first conversation is complimentary. There is no fee, pressure, or commitment required.'
  },
  {
    q: 'What if I am under 18 years old?',
    a: 'If you are under 18, verifiable parent or guardian consent is required before we can schedule a conversation, ensuring full transparency and safeguarding.'
  }
];

export default function ForStudentsPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: STUDENT_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <div className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PageHero
        breadcrumbs={[{ name: 'For Students', href: '/for-students' }]}
        meta={['For Young People', 'Ages 16 to 25', 'Perspective & Possibilities']}
        title="You have the information. What you need is perspective."
        lede="Career confusion, confidence issues, and 'what next' anxiety are natural parts of growing up. You do not have to figure it all out alone."
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
          <Button href="/book">Start a Conversation</Button>
          <Button href="/how-it-works" variant="link" arrow="down">See How It Works</Button>
        </div>
      </PageHero>

      {/* S2: Sound Familiar? (Hairline Grid) */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Common questions"
            title="Sound familiar?"
            lede="These are some of the most frequent starting points young people bring into our conversations."
          />

          <RevealGroup className="hairline-grid mt-10 sm:mt-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {concerns.map((text, idx) => (
              <RevealItem
                key={idx}
                className="group flex min-h-[12rem] sm:min-h-[14rem] flex-col justify-between p-6 sm:p-7 transition-colors duration-500 ease-editorial hover:bg-paper-3"
              >
                <span className="meta">{String(idx + 1).padStart(2, '0')}</span>
                <p className="font-serif italic text-[1.25rem] sm:text-[1.375rem] leading-[1.2] text-ink">
                  &ldquo;{text}&rdquo;
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* S3: What Can We Talk About? */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Exploration areas"
            title="What Can We Talk About?"
            lede="Conversations span questions around direction, confidence, choices, and readiness for life."
          />

          <RevealGroup className="hairline-grid mt-10 sm:mt-16 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {topics.map((area, idx) => (
              <RevealItem
                key={idx}
                className="p-6 sm:p-8 transition-colors duration-500 ease-editorial hover:bg-paper-2"
              >
                <span className="meta">{String(idx + 1).padStart(2, '0')}</span>
                <h3 className="font-serif text-[1.375rem] sm:text-[1.5rem] leading-snug text-ink mt-4 sm:mt-6">
                  {area}
                </h3>
              </RevealItem>
            ))}
          </RevealGroup>

          {/* S4: Ownership Disclaimer Callout */}
          <Reveal className="mt-12 sm:mt-16 rounded-[1.5rem] sm:rounded-[1.75rem] border border-ink bg-paper p-6 sm:p-8 md:p-12">
            <p className="meta text-signal mb-3 sm:mb-4">Ownership principle</p>
            <p className="font-serif text-[clamp(1.35rem,2.5vw,2.25rem)] text-ink leading-snug max-w-[45ch]">
              We won&apos;t tell you what career to choose or what decision to make. Your life, your choices. We help you think more clearly so you can decide with confidence.
            </p>
          </Reveal>
        </div>
      </section>

      {/* S5: What We Hope These Conversations Can Help You Build */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Observable growth"
            title="What We Hope These Conversations Can Help You Build"
            lede="Five areas we work towards through sustained, thoughtful conversations."
          />

          <StudentOutcomesGrid className="mt-10 sm:mt-16" />
        </div>
      </section>

      {/* S6: Simple Public Journey */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-32 text-center">
          <RevealGroup className="max-w-3xl mx-auto">
            <RevealItem as="p" className="meta mb-3 sm:mb-4">The journey</RevealItem>
            <RevealItem as="h2" className="font-serif text-[clamp(1.85rem,3.5vw,3rem)] text-ink mb-6 sm:mb-10">
              How a Conversation Unfolds
            </RevealItem>
            <RevealItem className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
              {['Talk', 'Understand', 'Explore', 'Choose Your Next Step', 'Follow Through'].map((step, idx, arr) => (
                <React.Fragment key={step}>
                  <span className="meta rounded-full border border-line bg-paper px-3 sm:px-4 py-1.5 sm:py-2 text-[0.625rem] sm:text-xs text-ink">
                    {step}
                  </span>
                  {idx < arr.length - 1 && <span className="text-muted text-xs hidden sm:inline">→</span>}
                </React.Fragment>
              ))}
            </RevealItem>
            <RevealItem>
              <Button href="/how-it-works" variant="link">See the full approach</Button>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Questions from students"
            title="Things You Might Wonder"
            lede="Clear answers to help you feel comfortable before starting a conversation."
          />

          <div className="mt-10 sm:mt-16 max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <RevealGroup>
              {STUDENT_FAQS.map((faq, idx) => (
                <RevealItem
                  key={idx}
                  className="rounded-2xl border border-line bg-paper p-5 sm:p-6 md:p-8"
                >
                  <h4 className="font-serif text-[1.125rem] sm:text-[1.25rem] text-ink mb-2 sm:mb-3">{faq.q}</h4>
                  <p className="text-[0.875rem] sm:text-[0.9375rem] text-muted leading-relaxed">{faq.a}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* S7: CTA */}
      <section className="border-t border-line bg-paper">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <RevealGroup className="max-w-[56rem]">
            <RevealItem as="p" className="meta mb-4 sm:mb-6">Take the first step</RevealItem>
            <RevealItem as="h2" className="font-serif text-[clamp(2.25rem,5.5vw,5rem)] leading-[0.95] text-ink">
              Ready to start a conversation?
            </RevealItem>
            <RevealItem as="p" className="lede mt-5 sm:mt-6 text-[1rem] sm:text-[1.125rem]">
              A private conversation can bring clarity to questions you have been carrying for months. Your first conversation is complimentary.
            </RevealItem>
            <RevealItem className="mt-8 sm:mt-10">
              <Button href="/book">Start a Conversation</Button>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>
    </div>
  );
}
