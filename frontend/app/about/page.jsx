import React from 'react';
import Link from 'next/link';
import Button from '../../components/ui/Button';
import Arrow from '../../components/ui/Arrow';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';
import ScalePortrait from '../../components/ui/ScalePortrait';
import { Reveal, RevealGroup, RevealItem } from '../../components/ui/Reveal';

const STUDENT_REFLECTIONS = [
  {
    category: 'Life preparation',
    quote: 'You never just prepared students for university, you prepared us for life. You taught us to take ownership, stay disciplined, think independently, stand by our decisions, and never compromise on our values.',
    name: 'Priya Kaushik',
    role: 'Project Manager | Business Analyst',
  },
  {
    category: 'Leadership',
    quote: 'You were the person who saw potential in me before I did... The confidence to take on opportunities, make difficult decisions, and lead people is something I owe to you.',
    name: 'Bismanpreet Singh',
    role: 'Startup Ecosystem Professional | Former Student Council President',
  },
  {
    category: 'Perspective',
    quote: "Whenever I found myself unsure of the next step, your perspective helped me see possibilities I couldn't see on my own... every student deserves to have a mentor like you.",
    name: 'Himangi Chaturvedi',
    role: 'Associate Project Manager',
  },
  {
    category: 'Decision-making',
    quote: 'What I value most is that you never simply gave answers - you helped me learn how to find them myself.',
    name: 'Omprakash Kumawat',
    role: 'Software Engineer',
  },
  {
    category: 'Real-world readiness',
    quote: "The professional world has made us realize exactly why you pushed us so hard. You didn't just teach us, you built our character and prepared us for reality.",
    name: 'Jia Soni',
    role: 'HR Manager | Coaching & Mentoring',
  },
  {
    category: 'Confidence',
    quote: "You've been more than a mentor, you've been a catalyst... Every conversation with you left me feeling clearer, stronger, and more capable.",
    name: 'Diya Garg',
    role: 'Data Science Student',
  },
];

const WHAT_I_BRING = [
  {
    title: 'Perspective from experience',
    desc: 'More than three decades across different professional worlds.',
  },
  {
    title: 'Experience with young people',
    desc: 'Working closely with university students and understanding questions beyond academics.',
  },
  {
    title: 'Exposure to possibilities',
    desc: 'Connecting conversations with people, opportunities and perspectives where relevant.',
  },
  {
    title: 'No predetermined agenda',
    desc: 'The objective is not to decide a young person’s future, but to help them think and choose with greater ownership.',
  },
];

const PRINCIPLES = [
  {
    title: 'Listen before advising',
    desc: 'Young people rarely need another person telling them what to do. They need someone who hears the real story behind the question.',
  },
  {
    title: 'Wider possibilities',
    desc: 'Opening doors to paths, opportunities and alternatives that conventional education pathways rarely expose students to.',
  },
  {
    title: 'Action and ownership',
    desc: 'Every conversation moves towards a practical next step that the young person understands, chooses, and is willing to own.',
  },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      <PageHero
        breadcrumbs={[{ name: 'About Deepak', href: '/about' }]}
        meta={['About Deepak', 'Founder, Unfoldinn', '35+ Years of Experience']}
        title="35+ Years Across Corporate Life, Entrepreneurship & Higher Education."
        lede="More than three decades of experience, now dedicated to helping young people explore possibilities, gain perspective, and choose their own next step with confidence."
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
          <Button href="/book">Start a Conversation</Button>
          <Button href="#journey" variant="link" arrow="down">Read the journey</Button>
        </div>
      </PageHero>

      {/* Portrait & Core Quote */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x grid grid-cols-1 gap-8 sm:gap-12 py-16 sm:py-24 md:grid-cols-12 md:gap-10 md:py-36">
          <div className="md:col-span-5">
            <ScalePortrait
              src="/deepaksogani.jpeg"
              alt="Deepak Sogani - Founder, Unfoldinn"
              className="aspect-[4/5] w-full"
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="meta">Deepak Sogani</span>
              <span className="meta">Founder, Unfoldinn</span>
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6 flex flex-col justify-center">
            <RevealGroup>
              <RevealItem as="blockquote" className="border-l-2 border-signal pl-4 sm:pl-6 md:pl-8">
                <p className="font-serif italic text-[clamp(1.5rem,2.8vw,2.5rem)] text-ink leading-snug">
                  &ldquo;I am not here to decide a young person&apos;s future. I want to help them understand themselves, see possibilities and make choices they can own.&rdquo;
                </p>
                <footer className="meta mt-4 sm:mt-6 text-muted">Deepak Sogani</footer>
              </RevealItem>
              <RevealItem className="mt-8 sm:mt-10">
                <p className="lede">
                  His years in higher education reinforced something he values deeply: some of the most meaningful contributions happen through conversations that help a young person gain perspective, discover an opportunity, reconsider a choice or take a meaningful next step.
                </p>
              </RevealItem>
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* S2: The Journey */}
      <section id="journey" className="scroll-mt-24 border-t border-line">
        <div className="page-x grid grid-cols-1 gap-8 sm:gap-12 py-16 sm:py-24 md:grid-cols-12 md:py-36">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-32">
              <SectionHead
                meta="The background"
                title="The journey to Unfoldinn"
              />
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6">
            <RevealGroup className="space-y-5 sm:space-y-6">
              <RevealItem as="p" className="lede">
                Deepak Sogani brings over 35 years of experience across the corporate world, entrepreneurship and higher education, a journey that has given him the opportunity to work with people across different ages, backgrounds and stages of life.
              </RevealItem>
              <RevealItem as="p" className="lede">
                His experience in higher education brought him particularly close to young people: not only through formal responsibilities, but through countless conversations about their aspirations, choices, opportunities, challenges and life beyond the classroom.
              </RevealItem>
              <RevealItem as="p" className="lede">
                Over time, he discovered that what he valued most was not telling young people what to do, but helping them think, bringing a different perspective to the conversation and opening their minds to possibilities they may not have considered.
              </RevealItem>
              <RevealItem as="p" className="lede">
                This understanding, combined with the perspective gained from his own professional and life journey, became the foundation for Unfoldinn.
              </RevealItem>
              <RevealItem as="p" className="lede">
                Today, he is dedicating this next phase of his journey to creating a space where young people can speak openly, explore widely, think independently and move forward with greater clarity and ownership.
              </RevealItem>
            </RevealGroup>

            {/* Why "Unfoldinn"? Callout */}
            <Reveal className="mt-12 sm:mt-16 rounded-[1.5rem] sm:rounded-[1.75rem] border border-ink bg-paper p-6 sm:p-8 md:p-12">
              <span className="meta text-signal mb-3 sm:mb-4 block">The origin</span>
              <h3 className="font-serif text-[clamp(1.5rem,2.5vw,2.25rem)] text-ink mb-3 sm:mb-4">
                Why &ldquo;Unfoldinn&rdquo;?
              </h3>
              <p className="text-[1rem] sm:text-[1.0625rem] text-ink-2 leading-relaxed mb-6">
                After more than three decades across the corporate world, entrepreneurship, and higher education, Deepak chose to dedicate this phase of his life to working with young people.
              </p>
              <blockquote className="border-l-2 border-signal pl-4 sm:pl-6 font-serif italic text-[1.125rem] sm:text-[1.25rem] text-ink leading-snug">
                &ldquo;The earlier phase of my career was about building my own path. Unfoldinn is about helping young people think clearly, discover what matters to them, and unfold theirs.&rdquo;
              </blockquote>
            </Reveal>
          </div>
        </div>
      </section>

      {/* S3: What I Bring to the Conversation */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="Core capabilities"
            title="What I Bring to the Conversation"
            lede="Grounded perspective, student empathy, and wide exposure without a predetermined agenda."
          />

          <RevealGroup className="hairline-grid mt-10 sm:mt-16 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {WHAT_I_BRING.map((item, idx) => (
              <RevealItem
                key={idx}
                className="group flex min-h-[14rem] sm:min-h-[16rem] flex-col justify-between p-6 sm:p-8 transition-colors duration-500 ease-editorial hover:bg-paper"
              >
                <span className="meta">{String(idx + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-serif text-[1.375rem] sm:text-[1.5rem] text-ink mb-2 sm:mb-3 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[0.875rem] sm:text-[0.9375rem] text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* S4: Philosophy */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <SectionHead
            meta="The philosophy"
            title="What informs every conversation"
            lede="The core commitments guiding every interaction at Unfoldinn."
          />

          <RevealGroup className="hairline-grid mt-10 sm:mt-16 grid-cols-1 md:grid-cols-3">
            {PRINCIPLES.map((item, idx) => (
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
                    {item.desc}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* S5: In Their Words – Student Reflections (All 6 Voices) */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-12 md:items-end mb-10 sm:mb-16">
            <SectionHead
              className="md:col-span-7"
              meta="In their words"
              title="Student voices"
              lede="Reflections shared voluntarily by students and alumni who worked closely with Deepak."
            />
            <Reveal className="md:col-span-5 text-left md:text-right">
              <Button href="https://www.linkedin.com/in/deepak-sogani/" variant="link" arrow="up-right">
                View on LinkedIn
              </Button>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {STUDENT_REFLECTIONS.map((item, idx) => (
              <Reveal key={idx} delay={idx * 0.06} className="rounded-[1.25rem] sm:rounded-[1.5rem] border border-line bg-paper p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <span className="meta text-signal mb-3 sm:mb-4 block">{item.category}</span>
                  <p className="font-serif italic text-[1.125rem] sm:text-[1.25rem] text-ink leading-snug mb-5 sm:mb-6">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>
                <div className="pt-4 sm:pt-5 border-t border-line">
                  <p className="font-medium text-ink text-[0.9375rem]">{item.name}</p>
                  <p className="text-xs text-muted mt-0.5">{item.role}</p>
                  <div className="flex items-center justify-between text-[0.75rem] text-muted mt-3">
                    <span>Former Student</span>
                    <a
                      href="https://www.linkedin.com/in/deepak-sogani/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-ink transition-colors py-1 inline-block"
                    >
                      Source: LinkedIn ↗
                    </a>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 sm:mt-12 text-sm text-muted max-w-2xl">
            <p>
              These voices come from different experiences, but a common thread runs through them: perspective, confidence, ownership and readiness for life beyond the classroom.
            </p>
          </div>
        </div>
      </section>

      {/* S6: CTA */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <RevealGroup className="max-w-[56rem]">
            <RevealItem as="p" className="meta mb-4 sm:mb-6">Connect with Deepak</RevealItem>
            <RevealItem as="h2" className="font-serif text-[clamp(2.25rem,5.5vw,5rem)] leading-[0.95] text-ink">
              Ready to start a conversation?
            </RevealItem>
            <RevealItem as="p" className="lede mt-5 sm:mt-6 text-[1rem] sm:text-[1.125rem]">
              No commitment, no pressure. Just perspective.
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
