import Link from 'next/link';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'For Parents | Guidance, Perspective & Support for Your Child — Unfoldinn',
  description:
    'Supporting your child through career uncertainty and life decisions. Thoughtful guidance that complements parenting while respecting young people’s independence.',
  keywords: [
    'unfold child potential',
    'unfold opportunities for youth',
    'career guidance for children parents',
    'how to help confused teenager career',
    'talking to children about career decisions',
    'parenting young adults career India',
    'career mentoring for my son daughter',
    'independent mentor for teenager',
    'parent child communication career',
    'guidance for parents of college students',
    'Deepak Sogani parent guidance',
  ],
  alternates: {
    canonical: 'https://www.unfoldinn.com/for-parents',
  },
  openGraph: {
    title: 'For Parents — Unfoldinn',
    description:
      'Every parent wants their child to make thoughtful choices. We provide an additional space for exploration that complements family guidance.',
    url: 'https://www.unfoldinn.com/for-parents',
  },
};

const concerns = [
  "My child seems confused about career choices, but doesn't open up to me.",
  'They are overwhelmed by options and expectations.',
  'I want to help, but every conversation turns into an argument.',
  'They are capable, but lack confidence or direction.',
  'They are preparing for a major transition (college, career) and need guidance.',
  "I want them to explore beyond conventional paths, but don't know where to start.",
];

const principles = [
  {
    num: '01',
    title: 'Complementing, not replacing',
    text: 'Unfoldinn works alongside parents and educators, providing an additional, objective sounding board for young people.',
  },
  {
    num: '02',
    title: 'Encouraging ownership',
    text: 'The goal is to help your child develop the confidence and clarity to make decisions they understand and own, rather than simply complying with advice.',
  },
  {
    num: '03',
    title: 'Broadening horizons',
    text: 'We help young people explore possibilities, career paths, and opportunities they may not have considered or encountered.',
  },
  {
    num: '04',
    title: 'Respecting boundaries',
    text: 'Conversations with young people are private and confidential, creating a safe space for honest exploration within clear safeguarding boundaries.',
  },
  {
    num: '05',
    title: 'Action-oriented',
    text: 'Every conversation works towards concrete next steps: exploring an opportunity, trying an experience, or building a practical habit.',
  },
];

const PARENT_FAQS = [
  {
    q: 'Can parents participate in the conversations?',
    a: 'While our primary engagement is directly with the young person to foster independence, an initial joint check-in or dedicated parent perspective call can be arranged where helpful.',
  },
  {
    q: 'What safeguarding measures are in place for students under 18?',
    a: 'For minors (under 18), written parent or guardian consent is mandatory before the first session. In cases involving personal safety or serious harm, parent or guardian communication is initiated immediately.',
  },
  {
    q: 'Will Deepak Sir convince my child to follow a specific career?',
    a: 'No. Unfoldinn is not a conduit for imposing choices. We help young people evaluate options objectively, understand trade-offs, and develop rational ownership over their education and life trajectory.',
  },
  {
    q: 'How is my family’s privacy protected?',
    a: 'All consent records and personal data follow strict DPDP 2023/2025 privacy boundaries and are never shared with third parties.',
  },
];

export default function ForParentsPage() {
  return (
    <div className="w-full bg-white text-[#29253a]">
      <PageHero
        breadcrumbs={[{ name: 'For Parents', href: '/for-parents' }]}
        meta={['For Parents', 'Ages 16–25', 'Safeguarded Space']}
        title="Support their thinking, not just their decision."
        lede="Unfoldinn complements a parent’s role by offering an objective, calm sounding board where young people can reflect honestly and grow into independent decision-makers."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/book"
            className="inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
          >
            <span>Book an introductory conversation</span>
            <img src="/icons/arrow-right-circle-white.svg" alt="" width={20} height={20} aria-hidden="true" />
          </Link>
          <Link
            href="/privacy-boundaries"
            className="inline-flex h-12 items-center justify-center rounded-[100px] border border-[#e5dfef] bg-white/85 px-7 font-wix-text text-[14px] font-semibold text-[#29253a] transition hover:bg-white"
          >
            Safeguarding &amp; Boundaries
          </Link>
        </div>
      </PageHero>

      {/* Parent Concerns */}
      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
        <SectionHead
          meta="What parents often notice"
          title="Caring deeply doesn’t always make the conversation easy."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {concerns.map((c, idx) => (
            <div
              key={c}
              className="rounded-[24px] border border-[#e5dfef] bg-[#faf8ff] p-6"
            >
              <span className="font-mono text-[11px] font-semibold text-[#765c9c]">
                0{idx + 1}
              </span>
              <p className="mt-3 font-wix-display text-[18px] font-medium leading-[1.4] text-[#29253a]">
                “{c}”
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Principles Dark Band */}
      <section className="bg-[#29253a] py-20 text-white">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
          <p className="font-wix-text text-[11px] font-bold uppercase tracking-[0.12em] text-[#f6b47d]">
            How we work with families
          </p>
          <h2 className="mt-3 max-w-[18ch] font-wix-display text-[2.25rem] font-medium leading-[1.08] text-white sm:text-[3.25rem]">
            Five principles behind every session.
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {principles.map((p) => (
              <div
                key={p.num}
                className="rounded-[22px] border border-white/10 bg-white/5 p-5"
              >
                <span className="font-mono text-[11px] text-[#f6b47d]">{p.num}</span>
                <h3 className="mt-3 font-wix-display text-[20px] font-medium text-white">
                  {p.title}
                </h3>
                <p className="mt-2 font-wix-text text-[13px] leading-[1.6] text-[#c9c3d5]">
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safeguarding Callout */}
      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
        <div className="flex flex-col justify-between gap-6 rounded-[28px] bg-[#eee6ff] p-8 sm:p-12 md:flex-row md:items-center">
          <div className="max-w-[60ch]">
            <div className="inline-flex items-center gap-2 font-wix-text text-[12px] font-bold uppercase tracking-[0.12em] text-[#524588]">
              <ShieldCheck className="h-4 w-4" />
              <span>Under-18 Safeguarding</span>
            </div>
            <h3 className="mt-3 font-wix-display text-[28px] font-medium text-[#29253a]">
              Explicit parent consent &amp; clear boundaries.
            </h3>
            <p className="mt-2 font-wix-text text-[15px] leading-[1.65] text-[#4c465d]">
              For participants under 18, verifiable parent/guardian consent is collected during
              onboarding before any 1:1 conversation is scheduled.
            </p>
          </div>
          <Link
            href="/privacy-boundaries"
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
          >
            Read Safeguarding Policy
          </Link>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#f5f0ff] py-16">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
          <SectionHead meta="Questions" title="Parent FAQs." />
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {PARENT_FAQS.map((f) => (
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
    </div>
  );
}
