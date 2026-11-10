import React from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Arrow from '../../components/ui/Arrow';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';
import { Reveal, RevealGroup, RevealItem } from '../../components/ui/Reveal';

export const metadata = {
  title: 'How It Works | The 5-Step Conversation Approach — Unfoldinn',
  description:
    'Our 5-stage human-led approach: Talk, Understand, Explore, Choose Your Next Step, and Follow Through. No tests, scores, or sales pitches. Just thoughtful conversation.',
  keywords: [
    'mentoring process students',
    'how career mentoring works',
    'student conversation approach',
    'one on one mentorship steps',
    'youth guidance methodology India',
  ],
  alternates: {
    canonical: 'https://www.unfoldinn.com/how-it-works',
  },
  openGraph: {
    title: 'How It Works — Unfoldinn',
    description:
      'A structured yet open five-step approach to exploring possibilities and taking ownership of your next steps.',
    url: 'https://www.unfoldinn.com/how-it-works',
  },
};

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    name: 'Talk',
    tagline: 'What’s on your mind?',
    description: 'You don’t need to arrive with a perfectly framed question. Sometimes even "I am confused" is enough to begin.',
    detail: 'An open space without judgment, agendas, or preconceived notions. You share where you are, what you’re feeling, and what’s causing hesitation.',
  },
  {
    step: '02',
    name: 'Understand',
    tagline: 'We look beyond the immediate question.',
    description: 'What matters to you? What are you experiencing? What are your concerns? Understanding comes before advice.',
    detail: 'We uncover the underlying factors: expectations, peer pressure, lack of exposure, or fear of making the wrong move.',
  },
  {
    step: '03',
    name: 'Explore',
    tagline: 'There may be possibilities you haven’t considered yet.',
    description: 'Together, we explore different perspectives, alternatives, opportunities and questions worth thinking about.',
    detail: 'Broadening your horizon beyond standard formulas. Introducing relevant industries, roles, experiences, and pathways.',
  },
  {
    step: '04',
    name: 'Choose Your Next Step',
    tagline: 'You decide what makes sense for you.',
    description: 'The objective isn’t for someone else to make the decision for you. It is to help you move towards a step you are willing to own.',
    detail: 'Distilling options into one or two clear, actionable experiments or decisions that fit your values and circumstances.',
  },
  {
    step: '05',
    name: 'Follow Through',
    tagline: 'Where appropriate, we reconnect.',
    description: 'What did you try? What happened? What did you discover? A conversation becomes truly valuable when it leads to action.',
    detail: 'Reflecting on what worked, what didn’t, and calibrating your next move with steady encouragement and accountability.',
  },
];

const COMPARISON_ITEMS = [
  { is: 'A space to talk.', isNot: 'A coaching institute.' },
  { is: 'An opportunity to think.', isNot: 'A motivational programme.' },
  { is: 'A place to explore possibilities.', isNot: 'A conventional career-selection service.' },
  { is: 'A source of new perspectives.', isNot: 'A substitute for professional mental-health support.' },
  { is: 'A conversation that can lead to action.', isNot: 'A place where somebody else decides your future for you.' },
  { is: "A journey towards greater ownership of one's choices.", isNot: 'A system that tells you what you should become.' },
];

const FAQS = [
  {
    q: 'How does a conversation with Deepak Sogani work?',
    a: 'Every conversation follows a five-step path: Talk (sharing your thoughts freely), Understand (uncovering what is behind the question), Explore (discovering perspectives and options), Choose Your Next Step (deciding what you want to try), and Follow Through (reviewing what happened and what comes next).'
  },
  {
    q: 'Do I need to prepare anything before we talk?',
    a: 'You do not need to prepare anything. There are no tests, presentations, or resumes required. You can begin with a simple thought or question.'
  },
  {
    q: 'Is the introductory conversation free?',
    a: 'Yes, your first conversation is complimentary. There is no fee, pressure, or commitment.'
  },
  {
    q: 'Is Unfoldinn a career coaching service or therapy?',
    a: 'Neither. Unfoldinn is not psychological therapy, clinical counselling, or commercial coaching. It is a quiet, thoughtful space for perspective, reflection, and life readiness.'
  },
  {
    q: 'What if the participant is below 18 years old?',
    a: 'For participants under 18, verifiable parent or guardian consent is required before scheduling, in accordance with our safeguarding and privacy policy.'
  }
];

export default function HowItWorks() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
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
        breadcrumbs={[{ name: 'How It Works', href: '/how-it-works' }]}
        meta={['The Approach', 'Methodology', '5 Stages']}
        title="One conversation can be a beginning."
        lede="Unfoldinn does not begin with a presentation, a questionnaire full of scores or a predetermined solution. It begins with you."
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
          <Button href="/book">Start a Conversation</Button>
          <Button href="#methodology" variant="link" arrow="down">See the 5 stages</Button>
        </div>
      </PageHero>

      {/* 5-Step Methodology */}
      <section id="methodology" className="scroll-mt-24 border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="How it works"
            title="From confusion to practical action"
            lede="Understanding comes before suggestion. Exploration comes before decision."
          />

          <div className="mt-10 sm:mt-16 md:mt-24 space-y-4 sm:space-y-6">
            <RevealGroup>
              {HOW_IT_WORKS_STEPS.map((s) => (
                <RevealItem
                  key={s.step}
                  className="mb-4 sm:mb-6 rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper p-6 sm:p-8 md:p-12 transition-colors duration-500 ease-editorial"
                >
                  <div className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-12 md:gap-12">
                    <div className="md:col-span-3 flex sm:flex-col justify-between items-center sm:items-start">
                      <span className="meta">Step {s.step}</span>
                      <p aria-hidden="true" className="text-outline font-serif text-[clamp(3.5rem,8vw,7rem)] leading-[0.8] mt-2 sm:mt-4">
                        {s.step}
                      </p>
                    </div>
                    <div className="md:col-span-9 flex flex-col justify-center">
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                        <h3 className="font-serif text-[clamp(1.5rem,3vw,2.5rem)] text-ink">
                          {s.name}
                        </h3>
                        <span className="font-serif italic text-muted text-base sm:text-lg">— {s.tagline}</span>
                      </div>
                      <p className="mt-3 sm:mt-4 text-[1rem] sm:text-[1.125rem] text-ink font-medium leading-relaxed">
                        {s.description}
                      </p>
                      <p className="mt-2 sm:mt-3 text-[0.875rem] sm:text-[0.9375rem] text-muted leading-relaxed">
                        {s.detail}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          {/* Benchmark Quote */}
          <Reveal className="mt-12 sm:mt-16 rounded-[1.25rem] sm:rounded-[1.75rem] border border-line bg-paper p-6 sm:p-8 md:p-12 text-center max-w-3xl mx-auto">
            <p className="meta text-signal mb-3 sm:mb-4">The benchmark for every conversation</p>
            <p className="font-serif italic text-[clamp(1.35rem,2.4vw,2.125rem)] text-ink leading-snug">
              &ldquo;After speaking with Mr. Deepak Sogani, I understand myself better and I know what I should do next.&rdquo;
            </p>
          </Reveal>
        </div>
      </section>

      {/* What It Is / What It Is Not: Swiss Table */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Expectations and boundaries"
            title="What Unfoldinn is, and isn't"
            lede="Clear boundaries create trusted spaces."
          />

          <div className="mt-10 sm:mt-16 border-t border-ink">
            <div className="grid grid-cols-2 border-b border-line py-3 sm:py-4">
              <p className="meta text-ink text-[0.625rem] sm:text-[0.6875rem]">Unfoldinn is</p>
              <p className="meta pl-3 sm:pl-4 md:pl-8 text-[0.625rem] sm:text-[0.6875rem]">Unfoldinn is not</p>
            </div>
            <RevealGroup>
              {COMPARISON_ITEMS.map((row) => (
                <RevealItem key={row.is} className="grid grid-cols-2 border-b border-line">
                  <p className="py-4 sm:py-6 pr-2 sm:pr-4 font-serif text-[clamp(1.05rem,2.2vw,1.875rem)] leading-[1.15] text-ink md:py-8">
                    {row.is}
                  </p>
                  <p className="border-l border-line py-4 sm:py-6 pl-3 sm:pl-4 text-[0.8125rem] sm:text-[0.9375rem] leading-[1.5] text-muted md:py-8 md:pl-8 md:text-[1.0625rem]">
                    <span className="strike-signal">{row.isNot}</span>
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <Reveal className="mt-8 sm:mt-12 text-center">
            <Link
              href="/privacy-boundaries"
              className="meta text-muted hover:text-ink transition-colors underline decoration-ink/20 underline-offset-4 py-1 inline-block"
            >
              Read our full Privacy, Safety &amp; Professional Boundaries statement →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FAQ Accordion Section for SEO and Reader Clarity */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Frequently Asked Questions"
            title="Common Questions About Our Conversations"
            lede="Clear answers to help you understand how Unfoldinn works before reaching out."
          />

          <div className="mt-10 sm:mt-16 max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <RevealGroup>
              {FAQS.map((faq, idx) => (
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

      {/* CTA */}
      <section className="border-t border-line bg-paper">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <RevealGroup className="max-w-[56rem]">
            <RevealItem as="p" className="meta mb-4 sm:mb-6">Start here</RevealItem>
            <RevealItem as="h2" className="font-serif text-[clamp(2.25rem,5.5vw,5rem)] leading-[0.95] text-ink">
              Start with a single conversation.
            </RevealItem>
            <RevealItem as="p" className="lede mt-5 sm:mt-6 text-[1rem] sm:text-[1.125rem]">
              No preparation needed. You don&apos;t need to arrive with an answer: you can begin with the question.
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
