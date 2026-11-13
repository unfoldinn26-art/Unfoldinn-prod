import Link from 'next/link';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';

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
    num: '01',
    title: 'Individual Conversations',
    text: 'One-to-one conversations on choices, transitions, self-understanding, and finding direction beyond the classroom.',
  },
  {
    num: '02',
    title: 'Small-Group Conversations',
    text: 'Interactive cohort sessions addressing shared questions around future paths, peer comparisons, and building confidence.',
  },
  {
    num: '03',
    title: 'Parent Conversations',
    text: 'Constructive dialogues helping parents understand modern career landscapes and communicate supportively with their children.',
  },
  {
    num: '04',
    title: 'Transition & Exposure Programmes',
    text: 'Focused sessions preparing students for upcoming transitions—school to university, campus to workplace, or stepping into adulthood.',
  },
];

export default function ForInstitutionsPage() {
  return (
    <div className="w-full bg-white text-[#29253a]">
      <PageHero
        breadcrumbs={[{ name: 'For Institutions', href: '/for-institutions' }]}
        meta={['For Schools, Colleges & Universities', 'Campus Collaboration', 'Student Support']}
        title="Life readiness belongs alongside academics."
        lede="Unfoldinn works alongside existing academic and placement systems to create an additional space for thoughtful student conversations on choices, transitions, and confidence."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/contact"
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
          >
            <span>Explore a collaboration</span>
            <img src="/icons/arrow-right-circle-institutions.svg" alt="" width={20} height={20} aria-hidden="true" />
          </Link>
          <a
            href="#formats"
            className="inline-flex h-12 items-center justify-center rounded-[100px] border border-[#e5dfef] bg-white/85 px-7 font-wix-text text-[14px] font-semibold text-[#29253a] transition hover:bg-white"
          >
            See Engagement Formats
          </a>
        </div>
      </PageHero>

      {/* Our Role Split */}
      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
        <div className="grid grid-cols-1 gap-8 rounded-[28px] bg-[#f5f0ff] p-8 sm:p-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHead meta="Our role" title="Complementing what you already do" />
          </div>
          <div className="space-y-4 font-wix-text text-[16px] leading-[1.7] text-[#4c465d] lg:col-span-7">
            <p>
              Educational institutions carry the essential responsibility of academic learning,
              administration, and formal placement systems.
            </p>
            <p>
              Yet many students still sit quietly with questions about who they are becoming, how
              to handle setbacks, and how to make thoughtful decisions beyond grades and exams.
            </p>
            <p className="font-semibold text-[#29253a]">
              Unfoldinn adds a calm, human-led layer of perspective without disrupting existing
              campus workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Formats */}
      <section id="formats" className="bg-[#29253a] py-20 text-white">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
          <p className="font-wix-text text-[11px] font-bold uppercase tracking-[0.12em] text-[#f6b47d]">
            Engagement Formats
          </p>
          <h2 className="mt-3 font-wix-display text-[2.25rem] font-medium text-white sm:text-[3.25rem]">
            Designed to fit your campus rhythm.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {FORMATS.map((f) => (
              <div
                key={f.num}
                className="rounded-[24px] border border-white/10 bg-white/5 p-7"
              >
                <span className="font-mono text-[12px] text-[#f6b47d]">{f.num}</span>
                <h3 className="mt-3 font-wix-display text-[24px] font-medium text-white">
                  {f.title}
                </h3>
                <p className="mt-2.5 font-wix-text text-[14px] leading-[1.65] text-[#c9c3d5]">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="px-6 py-20 text-center sm:px-10"
        style={{
          backgroundImage:
            'linear-gradient(165deg, rgb(238, 230, 255) 0%, rgb(248, 213, 194) 100%)',
        }}
      >
        <div className="mx-auto max-w-[760px]">
          <p className="font-wix-text text-[11px] font-bold uppercase tracking-[1.36px] text-[#765c9c]">
            Campus Partnerships
          </p>
          <h2 className="mt-3 font-wix-display text-[2.25rem] font-normal text-[#29253a] sm:text-[3rem]">
            Bring thoughtful mentoring conversations to your students.
          </h2>
          <Link
            href="/contact"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
          >
            <span>Talk to Us About Your Institution</span>
            <img src="/icons/arrow-right-circle-cta.svg" alt="" width={20} height={20} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
