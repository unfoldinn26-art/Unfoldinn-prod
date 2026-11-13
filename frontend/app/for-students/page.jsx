import Link from 'next/link';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';
import { CheckCircle2, ChevronRight } from 'lucide-react';

export const metadata = {
  title: 'For Students (Ages 16–25) | Perspective, Clarity & Next Steps — Unfoldinn',
  description:
    'Confused about career choices, college transitions, or what comes next? Private one-to-one conversations for ages 16–25 to think clearly and choose your path.',
  keywords: [
    'unfold',
    'unfold potential',
    'unfold your future',
    'unfold clarity',
    'unfold possibilities',
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
    canonical: 'https://www.unfoldinn.com/for-students',
  },
  openGraph: {
    title: 'For Students (16–25) — Unfoldinn',
    description:
      'You have the information. What you need is perspective. A space to talk openly, think clearly, and explore possibilities.',
    url: 'https://www.unfoldinn.com/for-students',
  },
};

const concerns = [
  "I don't know what career to choose",
  'Everyone seems to have a plan except me',
  "I'm good at studies but struggle with confidence",
  'My parents want one thing, I want another',
  "I don't know how to communicate in interviews or group settings",
  'I have no exposure beyond my classroom',
  "I'm about to graduate and I have no idea what comes next",
  "I want to do something meaningful but don't know where to start",
];

const topics = [
  'Career & higher-education uncertainty',
  'Confidence & self-belief',
  'Decision-making & ownership',
  'Communication & articulation',
  'Exposure to people, pathways & opportunities',
  'Leadership & participation',
  'Professional & life readiness',
  'Finding internships, fellowships, and scholarships',
  'Transition from education to adult life',
];

const outcomes = [
  { num: '01', title: 'Clarity', desc: 'See what matters beneath the noise of expectations and comparisons.' },
  { num: '02', title: 'Confidence', desc: 'Trust your ability to evaluate choices and move forward.' },
  { num: '03', title: 'Exposure', desc: 'Notice pathways, internships, and roles you had not considered.' },
  { num: '04', title: 'Action', desc: 'Turn reflection into a realistic 7-day next step.' },
  { num: '05', title: 'Ownership', desc: 'Make thoughtful choices that genuinely feel like yours.' },
];

const STUDENT_FAQS = [
  {
    q: 'What can I talk about in an Unfoldinn conversation?',
    a: 'You can talk about anything on your mind: career uncertainty, feeling behind your peers, confidence hesitations, handling parental expectations, seeking exposure beyond college, or figuring out your next step after graduation.',
  },
  {
    q: 'Will Deepak Sir tell me which career to choose?',
    a: 'No. We do not provide ready-made answers or predetermined roadmaps. Your life and your choices belong to you. We help you think clearly, understand trade-offs, and see wider possibilities so you can make your own decisions with conviction.',
  },
  {
    q: 'Is my first conversation free?',
    a: 'Yes, your first conversation is complimentary. There is no fee, pressure, or commitment required.',
  },
  {
    q: 'Are conversations confidential?',
    a: 'Yes. Everything you share stays private within clear professional and safeguarding boundaries.',
  },
];

export default function ForStudentsPage() {
  return (
    <div className="w-full bg-white text-[#29253a]">
      <PageHero
        breadcrumbs={[{ name: 'For Students', href: '/for-students' }]}
        meta={['For Students', 'Ages 16–25', '1:1 Mentoring']}
        title="You have the information. What you need is perspective."
        lede="A calm, honest space to talk through what is on your mind, see beyond familiar options, and choose a next step you actually own."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/book"
            className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition-all hover:bg-[#3a3451]"
          >
            <span>Start a conversation</span>
            <img
              src="/icons/arrow-right-circle-white.svg"
              alt=""
              width={20}
              height={20}
              aria-hidden="true"
            />
          </Link>
          <a
            href="#topics"
            className="inline-flex h-12 items-center justify-center rounded-[100px] border border-[#e5dfef] bg-white/85 px-7 font-wix-text text-[14px] font-semibold text-[#29253a] transition hover:bg-white"
          >
            See What We Explore
          </a>
        </div>
      </PageHero>

      {/* Concerns Grid */}
      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
        <SectionHead
          meta="If any of this sounds familiar"
          title="You don’t need a perfect question to begin."
          lede="Most students arrive feeling caught between advice, comparison, and uncertainty. Start with whichever thought feels closest."
        />

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {concerns.map((c, idx) => (
            <Link
              key={c}
              href="/book"
              className="group flex flex-col justify-between rounded-[22px] border border-[#e5dfef] bg-[#faf8ff] p-5 transition-all hover:-translate-y-0.5 hover:border-[#765c9c] hover:bg-white hover:shadow-sm"
            >
              <span className="font-mono text-[11px] font-semibold text-[#765c9c]">
                0{idx + 1}
              </span>
              <p className="mt-4 font-wix-display text-[17px] font-medium leading-[1.35] text-[#29253a]">
                “{c}”
              </p>
              <span className="mt-5 inline-flex items-center gap-1 font-wix-text text-[12px] font-semibold text-[#b56727]">
                <span>Talk this through</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Topics Dark Band */}
      <section id="topics" className="bg-[#29253a] py-20 text-white">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="font-wix-text text-[11px] font-bold uppercase tracking-[0.12em] text-[#f6b47d]">
                Conversation Scope
              </p>
              <h2 className="mt-3 font-wix-display text-[2.25rem] font-medium leading-[1.08] text-white sm:text-[3rem]">
                What we talk through together.
              </h2>
              <p className="mt-4 font-wix-text text-[15px] leading-[1.65] text-[#c9c3d5]">
                No tests, no scores, and no predetermined career templates—just real perspective
                tailored to where you are right now.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:col-span-7">
              {topics.map((t) => (
                <div
                  key={t}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f6b47d]" />
                  <span className="font-wix-text text-[14px] text-[#e5dfef]">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="mx-auto max-w-[1240px] px-6 py-20 sm:px-10">
        <SectionHead
          meta="What shifts"
          title="Outcomes built on clarity, not hype."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {outcomes.map((o) => (
            <div
              key={o.num}
              className="rounded-[22px] border border-[#e5dfef] bg-white p-5"
            >
              <span className="font-mono text-[11px] font-semibold text-[#765c9c]">{o.num}</span>
              <h3 className="mt-4 font-wix-display text-[20px] font-medium text-[#29253a]">
                {o.title}
              </h3>
              <p className="mt-2 font-wix-text text-[13px] leading-[1.6] text-[#686579]">
                {o.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#f5f0ff] py-16">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
          <SectionHead meta="Questions" title="Common student questions." />
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {STUDENT_FAQS.map((f) => (
              <div key={f.q} className="rounded-[24px] border border-[#e5dfef] bg-white p-6">
                <h3 className="font-wix-display text-[19px] font-medium text-[#29253a]">
                  {f.q}
                </h3>
                <p className="mt-2.5 font-wix-text text-[14px] leading-[1.65] text-[#686579]">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Gradient CTA */}
      <section
        className="px-6 py-20 text-center sm:px-10"
        style={{
          backgroundImage:
            'linear-gradient(165deg, rgb(238, 230, 255) 0%, rgb(248, 213, 194) 100%)',
        }}
      >
        <div className="mx-auto max-w-[740px]">
          <p className="font-wix-text text-[11px] font-bold uppercase tracking-[1.36px] text-[#765c9c]">
            Complimentary first session
          </p>
          <h2 className="mt-3 font-wix-display text-[2.25rem] font-normal text-[#29253a] sm:text-[3rem]">
            Start with one honest conversation.
          </h2>
          <Link
            href="/book"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
          >
            <span>Book your conversation</span>
            <img src="/icons/arrow-right-circle-cta.svg" alt="" width={20} height={20} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
