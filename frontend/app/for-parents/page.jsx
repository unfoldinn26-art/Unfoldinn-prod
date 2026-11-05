import React from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Arrow from '../../components/ui/Arrow';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';
import { Reveal, RevealGroup, RevealItem } from '../../components/ui/Reveal';

export const metadata = {
  title: 'For Parents | Guidance, Perspective & Support for Your Child — Unfoldinn',
  description:
    'Supporting your child through career uncertainty and life decisions. Thoughtful guidance that complements parenting while respecting young people’s independence.',
  keywords: [
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
    canonical: 'https://unfoldinn.com/for-parents',
  },
  openGraph: {
    title: 'For Parents — Unfoldinn',
    description:
      'Every parent wants their child to make thoughtful choices. We provide an additional space for exploration that complements family guidance.',
    url: 'https://unfoldinn.com/for-parents',
  },
};

const concerns = [
  "My child seems confused about career choices, but doesn't open up to me.",
  "They are overwhelmed by options and expectations.",
  "I want to help, but every conversation turns into an argument.",
  "They are capable, but lack confidence or direction.",
  "They are preparing for a major transition (college, career) and need guidance.",
  "I want them to explore beyond conventional paths, but don't know where to start.",
];

const principles = [
  {
    title: 'Complementing, not replacing',
    text: 'Unfoldinn works alongside parents and educators, providing an additional, objective sounding board for young people.',
  },
  {
    title: 'Encouraging ownership',
    text: "The goal is to help your child develop the confidence and clarity to make decisions they understand and own, rather than simply complying with advice.",
  },
  {
    title: 'Broadening horizons',
    text: 'We help young people explore possibilities, career paths, and opportunities they may not have considered or encountered.',
  },
  {
    title: 'Respecting boundaries',
    text: 'Conversations with young people are private and confidential, creating a safe space for honest exploration. Parents are kept informed within appropriate safeguarding boundaries.',
  },
  {
    title: 'Action-oriented',
    text: 'Every conversation works towards concrete next steps: exploring an opportunity, trying an experience, or building a practical habit.',
  },
];

const PARENT_FAQS = [
  {
    q: 'Can parents participate in the conversations?',
    a: 'While our primary engagement is directly with the young person to foster independence, an initial joint check-in or dedicated parent perspective call can be arranged where helpful.'
  },
  {
    q: 'What safeguarding measures are in place for students under 18?',
    a: 'For minors (under 18), written parent or guardian consent is mandatory before the first session. In cases involving personal safety or serious harm, parent or guardian communication is initiated immediately.'
  },
  {
    q: 'Will Deepak Sir convince my child to follow a specific career?',
    a: 'No. Unfoldinn is not a conduit for imposing choices. We help young people evaluate options objectively, understand trade-offs, and develop rational ownership over their education and life trajectory.'
  },
  {
    q: 'How does this complement what the school or college provides?',
    a: 'Schools focus on academics and bulk placements. Unfoldinn provides individualized, unhurried space for personal clarity, character building, and navigating intergenerational conversations.'
  }
];

export default function ForParentsPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PARENT_FAQS.map((item) => ({
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
        breadcrumbs={[{ name: 'For Parents', href: '/for-parents' }]}
        meta={['For Parents', 'Family & Perspective', 'Intergenerational Dialogue']}
        title="Every parent wants their child to make thoughtful choices and build a meaningful future."
        lede="Unfoldinn seeks to complement, not replace, the role of parents, teachers, educational institutions or qualified professionals."
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
          <Button href="/book">Start a Conversation About Your Child</Button>
          <Button href="#principles" variant="link" arrow="down">Explore Guiding Principles</Button>
        </div>
      </PageHero>

      {/* The Core Role: Editorial Split */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x grid grid-cols-1 gap-8 sm:gap-12 py-16 sm:py-24 md:grid-cols-12 md:py-36">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-32">
              <SectionHead
                meta="The parent-mentor bridge"
                title="A space for perspective and exploration"
              />
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <RevealGroup className="space-y-5 sm:space-y-6">
              <RevealItem as="p" className="lede">
                As young people grow, they also need opportunities to question, explore and gradually take ownership of their decisions.
              </RevealItem>
              <RevealItem as="p" className="lede">
                The objective is not to decide a young person&apos;s future for them.
              </RevealItem>
              <RevealItem as="p" className="lede">
                It is to provide an additional space for thoughtful conversation, broader perspective and exploration: helping young people become more confident in making choices they understand and own.
              </RevealItem>
              <RevealItem as="blockquote" className="mt-6 sm:mt-8 border-l-2 border-signal pl-4 sm:pl-6 font-serif italic text-[1.125rem] sm:text-[1.25rem] text-ink leading-relaxed">
                &ldquo;Where appropriate, parents may also become part of the broader conversation while respecting the young person&apos;s privacy and independence.&rdquo;
              </RevealItem>
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Principles: Hairline Grid */}
      <section id="principles" className="scroll-mt-24 border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Guiding principles"
            title="How parents can support"
            lede="A few principles that can make parent-child conversations more constructive."
          />

          <RevealGroup className="hairline-grid mt-10 sm:mt-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((item, idx) => (
              <RevealItem
                key={idx}
                className="group flex min-h-[14rem] sm:min-h-[16rem] flex-col justify-between p-6 sm:p-8 transition-colors duration-500 ease-editorial hover:bg-paper-2"
              >
                <span className="meta">{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-serif text-[1.375rem] sm:text-[1.625rem] text-ink mb-2 sm:mb-3 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[0.875rem] sm:text-[0.9375rem] text-muted leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </RevealItem>
            ))}
            <RevealItem className="!bg-ink text-paper flex flex-col justify-between p-6 sm:p-8">
              <span className="meta text-paper/60">Perspective</span>
              <div>
                <p className="font-serif italic text-[1.25rem] sm:text-[1.375rem] leading-snug text-paper">
                  Every generation navigates a world the previous one did not inhabit.
                </p>
                <p className="text-[0.8125rem] sm:text-[0.875rem] text-paper/70 mt-3">
                  Patience and listening anchor long-term trust.
                </p>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* Common Concerns: Editorial List */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Empathy and understanding"
            title="Does this sound familiar?"
            lede="Every parent encounters these moments of uncertainty."
          />

          <div className="mt-10 sm:mt-16 border-t border-ink">
            <RevealGroup>
              {concerns.map((concern, idx) => (
                <RevealItem
                  key={idx}
                  className="grid grid-cols-12 border-b border-line py-5 sm:py-7 md:py-8 items-baseline gap-3 sm:gap-4"
                >
                  <span className="meta col-span-2 md:col-span-1">{String(idx + 1).padStart(2, '0')}</span>
                  <p className="col-span-10 md:col-span-11 font-serif italic text-[clamp(1.125rem,2.2vw,1.875rem)] text-ink">
                    &ldquo;{concern}&rdquo;
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Parent FAQs Section */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Parent inquiries"
            title="Questions Parents Frequently Ask"
            lede="Reassurance and clarity on how we collaborate with families."
          />

          <div className="mt-10 sm:mt-16 max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <RevealGroup>
              {PARENT_FAQS.map((faq, idx) => (
                <RevealItem
                  key={idx}
                  className="rounded-2xl border border-line bg-paper-2 p-5 sm:p-6 md:p-8"
                >
                  <h4 className="font-serif text-[1.125rem] sm:text-[1.25rem] text-ink mb-2 sm:mb-3">{faq.q}</h4>
                  <p className="text-[0.875rem] sm:text-[0.9375rem] text-muted leading-relaxed">{faq.a}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Confidentiality & Safeguarding */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-12 sm:py-16 md:py-24">
          <Reveal className="rounded-[1.5rem] sm:rounded-[1.75rem] border border-line bg-paper p-6 sm:p-8 md:p-12 max-w-4xl mx-auto">
            <p className="meta text-signal mb-2 sm:mb-3">Safeguarding &amp; ethics</p>
            <h4 className="font-serif text-[1.375rem] sm:text-[1.75rem] text-ink mb-3 sm:mb-4">Safety and Professional Boundaries</h4>
            <p className="text-[0.9375rem] sm:text-[1.0625rem] text-muted leading-relaxed">
              For participants below the age of 18, appropriate parental/guardian consent and safeguarding requirements always apply. Unfoldinn is committed to providing a responsible and transparent environment.
            </p>
            <div className="mt-5 sm:mt-6">
              <Link href="/privacy-boundaries" className="meta text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-signal py-1 inline-block">
                Read our full Privacy &amp; Boundaries Policy →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-paper">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <RevealGroup className="max-w-[56rem]">
            <RevealItem as="p" className="meta mb-4 sm:mb-6">Partnering together</RevealItem>
            <RevealItem as="h2" className="font-serif text-[clamp(2.25rem,5.5vw,5rem)] leading-[0.95] text-ink">
              Start a conversation about your child.
            </RevealItem>
            <RevealItem as="p" className="lede mt-5 sm:mt-6 text-[1rem] sm:text-[1.125rem]">
              We are here to listen, offer perspective, and partner in your child&apos;s growth.
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
