import Link from 'next/link';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';

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
    description:
      'You don’t need to arrive with a perfectly framed question. Sometimes even "I am confused" is enough to begin.',
    detail:
      'An open space without judgment, agendas, or preconceived notions. You share where you are, what you’re feeling, and what’s causing hesitation.',
  },
  {
    step: '02',
    name: 'Understand',
    tagline: 'We look beyond the immediate question.',
    description:
      'What matters to you? What are you experiencing? What are your concerns? Understanding comes before advice.',
    detail:
      'We uncover the underlying factors: expectations, peer pressure, lack of exposure, or fear of making the wrong move.',
  },
  {
    step: '03',
    name: 'Explore',
    tagline: 'There may be possibilities you haven’t considered yet.',
    description:
      'Together, we explore different perspectives, alternatives, opportunities and questions worth thinking about.',
    detail:
      'Broadening your horizon beyond standard formulas. Introducing relevant industries, roles, experiences, and pathways.',
  },
  {
    step: '04',
    name: 'Choose Your Next Step',
    tagline: 'You decide what makes sense for you.',
    description:
      'The objective isn’t for someone else to make the decision for you. It is to help you move towards a step you are willing to own.',
    detail:
      'Distilling options into one or two clear, actionable experiments or decisions that fit your values and circumstances.',
  },
  {
    step: '05',
    name: 'Follow Through',
    tagline: 'Where appropriate, we reconnect.',
    description:
      'What did you try? What happened? What did you discover? A conversation becomes truly valuable when it leads to action.',
    detail:
      'Reflecting on what worked, what didn’t, and calibrating your next move with steady encouragement and accountability.',
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

export default function HowItWorksPage() {
  return (
    <div className="w-full bg-white text-[#29253a]">
      <PageHero
        breadcrumbs={[{ name: 'How It Works', href: '/how-it-works' }]}
        meta={['A Human Process, Not a Formula', '5 Steps', '1:1 Mentoring']}
        title="How a conversation moves forward."
        lede="Structured enough to create momentum. Flexible enough to meet a young person where they actually are."
      >
        <Link
          href="/book"
          className="inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
        >
          <span>Start a conversation</span>
          <img src="/icons/arrow-right-circle-white.svg" alt="" width={20} height={20} aria-hidden="true" />
        </Link>
      </PageHero>

      {/* 5 Steps */}
      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
        <div className="space-y-5">
          {HOW_IT_WORKS_STEPS.map((s) => (
            <div
              key={s.step}
              className="grid grid-cols-1 gap-6 rounded-[24px] border border-[#e5dfef] bg-[#faf8ff] p-7 sm:p-9 lg:grid-cols-12"
            >
              <div className="lg:col-span-4">
                <span className="inline-flex rounded-full bg-[#ffe79a] px-3 py-1 font-mono text-[12px] font-semibold text-[#29253a]">
                  STEP {s.step}
                </span>
                <h2 className="mt-4 font-wix-display text-[28px] font-medium text-[#29253a]">
                  {s.name}
                </h2>
                <p className="mt-1 font-wix-text text-[14px] font-semibold text-[#765c9c]">
                  {s.tagline}
                </p>
              </div>
              <div className="space-y-3 font-wix-text text-[15px] leading-[1.65] text-[#4c465d] lg:col-span-8">
                <p className="text-[17px] font-medium text-[#29253a]">{s.description}</p>
                <p className="text-[#686579]">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What It Is / Is Not */}
      <section className="bg-[#29253a] py-20 text-white">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
          <p className="font-wix-text text-[11px] font-bold uppercase tracking-[0.12em] text-[#f6b47d]">
            Clear Boundaries
          </p>
          <h2 className="mt-3 font-wix-display text-[2.25rem] font-medium text-white sm:text-[3rem]">
            What Unfoldinn is — and what it isn’t.
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {COMPARISON_ITEMS.map((item) => (
              <div
                key={item.is}
                className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#f6b47d]">
                    What it is
                  </span>
                  <p className="mt-1.5 font-wix-text text-[14px] font-semibold text-white">
                    {item.is}
                  </p>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#938da0]">
                    What it isn’t
                  </span>
                  <p className="mt-1.5 font-wix-text text-[14px] text-[#c9c3d5]">{item.isNot}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="px-6 py-20 text-center sm:px-10"
        style={{
          backgroundImage:
            'linear-gradient(165deg, rgb(238, 230, 255) 0%, rgb(248, 213, 194) 100%)',
        }}
      >
        <div className="mx-auto max-w-[740px]">
          <SectionHead
            meta="Ready when you are"
            title="Begin with one conversation."
            className="mx-auto flex flex-col items-center text-center"
          />
          <Link
            href="/book"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
          >
            <span>Book your first session</span>
            <img src="/icons/arrow-right-circle-cta.svg" alt="" width={20} height={20} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
