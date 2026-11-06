import Link from 'next/link';
import Image from 'next/image';
import Button from '../components/ui/Button';
import Arrow from '../components/ui/Arrow';
import ScrubText from '../components/ui/ScrubText';
import SectionHead from '../components/ui/SectionHead';
import ScalePortrait from '../components/ui/ScalePortrait';
import { Reveal, RevealGroup, RevealItem } from '../components/ui/Reveal';
import StepStack from '../components/home/StepStack';
import StudentOutcomesGrid from '../components/home/StudentOutcomesGrid';
import StudentHero from '../components/home/StudentHero';
import StudentCrossroads from '../components/home/StudentCrossroads';

export const metadata = {
  title: 'Unfoldinn | Young Minds. New Perspectives. Wider Possibilities. — Deepak Sogani',
  description:
    'A human-led space for young people (ages 16–25) navigating career choices, life transitions, and self-belief through thoughtful private conversations. Founded by Deepak Sogani in Jaipur & Pan-India.',
  alternates: {
    canonical: 'https://unfoldinn.com',
  },
  openGraph: {
    title: 'Unfoldinn | Young Minds. New Perspectives. Wider Possibilities. — Deepak Sogani',
    description:
      'Young Minds. New Perspectives. Wider Possibilities. Thoughtful private conversations for education, career, and life decisions.',
    url: 'https://unfoldinn.com',
  },
};

const PERSONAL_QUESTIONS = [
  'What do I really want?',
  'What am I actually good at?',
  'Am I choosing for myself, or following what others expect?',
  'What possibilities am I not even aware of?',
  'And what should I do next?',
];

const WHO_IS_IT_FOR = [
  { title: 'Trying to understand yourself better', desc: 'Your marks, degree or résumé tell only part of your story.' },
  { title: 'Wondering what comes next', desc: "You have options but aren't sure how to think about them." },
  { title: 'Exploring education or career possibilities', desc: 'Not simply "Which course should I choose?" but also "Why does this choice make sense for me?"' },
  { title: 'Looking beyond conventional options', desc: 'You want to discover opportunities, experiences or paths you may not have encountered before.' },
  { title: 'Preparing for a transition', desc: 'School to university. University life. Internships. Projects. First career decisions. Life after graduation.' },
  { title: 'Dealing with a setback or change of plan', desc: "Something hasn't worked as expected, and you're trying to understand what comes next." },
  { title: "Carrying a question you haven't been able to discuss openly", desc: "Sometimes the starting point isn't a career decision at all. It is simply something you need to talk through." },
];

const METHODOLOGY_STEPS = [
  { step: '01', name: 'Talk', subtitle: "What's on your mind?", description: 'You don\'t need to arrive with a perfectly framed question. Sometimes even "I am confused" is enough to begin.' },
  { step: '02', name: 'Understand', subtitle: 'We look beyond the immediate question.', description: 'What matters to you? What are you experiencing? What are your concerns? What might be influencing your thinking? Understanding comes before advice.' },
  { step: '03', name: 'Explore', subtitle: "There may be possibilities you haven't considered yet.", description: 'Together, we explore different perspectives, alternatives, opportunities and questions worth thinking about.' },
  { step: '04', name: 'Choose your next step', subtitle: "The objective isn't for someone else to make the decision for you.", description: 'It is to help you move towards a next step that makes sense to you and that you are willing to own.' },
  { step: '05', name: 'Follow through', subtitle: 'Where appropriate, we reconnect.', description: 'What did you try? What happened? What did you discover? What should happen next? Because a meaningful conversation becomes more valuable when it leads to action.' },
];

const STUDENT_VOICES = [
  { category: 'Life preparation', quote: 'You never just prepared students for university, you prepared us for life. You taught us to take ownership, stay disciplined, think independently, stand by our decisions, and never compromise on our values.', name: 'Priya Kaushik', role: 'Project Manager | Business Analyst' },
  { category: 'Leadership', quote: 'You were the person who saw potential in me before I did... The confidence to take on opportunities, make difficult decisions, and lead people is something I owe to you.', name: 'Bismanpreet Singh', role: 'Startup Ecosystem Professional | Former Student Council President' },
  { category: 'Perspective', quote: "Whenever I found myself unsure of the next step, your perspective helped me see possibilities I couldn't see on my own... every student deserves to have a mentor like you.", name: 'Himangi Chaturvedi', role: 'Associate Project Manager' },
  { category: 'Decision-making', quote: 'What I value most is that you never simply gave answers. You helped me learn how to find them myself.', name: 'Omprakash Kumawat', role: 'Software Engineer' },
  { category: 'Real-world readiness', quote: "The professional world has made us realize exactly why you pushed us so hard. You didn't just teach us, you built our character and prepared us for reality.", name: 'Jia Soni', role: 'HR Manager | Coaching & Mentoring' },
  { category: 'Confidence', quote: "You've been more than a mentor, you've been a catalyst... Every conversation with you left me feeling clearer, stronger, and more capable.", name: 'Diya Garg', role: 'Data Science Student' },
];

const WHAT_IT_IS_AND_ISNT = [
  { is: 'A space to talk.', isNot: 'A coaching institute.' },
  { is: 'An opportunity to think.', isNot: 'A motivational programme.' },
  { is: 'A place to explore possibilities.', isNot: 'A conventional career-selection service.' },
  { is: 'A source of new perspectives.', isNot: 'A substitute for professional mental-health support.' },
  { is: 'A conversation that can lead to action.', isNot: 'A place where somebody else decides your future for you.' },
  { is: "A journey towards greater ownership of one's choices.", isNot: 'A system that tells you what you should become.' },
];

export default function Home() {
  return (
    <div className="w-full">
      {/* 1. HERO: Student-centric sunrise canvas with animated Ensō & interactive crossroads */}
      <StudentHero />
      <StudentCrossroads />

      {/* 2. HOOK: scrubbed paragraph + personal questions */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-40">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <Reveal>
                <h2 className="font-serif text-[clamp(2.25rem,4vw,3.75rem)] leading-[1] tracking-[-0.02em]">
                  Not every question has an obvious answer.
                </h2>
              </Reveal>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <ScrubText
                className="font-serif text-[clamp(1.5rem,2.4vw,2.125rem)] leading-[1.25] tracking-[-0.01em] text-ink"
                text="You have information everywhere. Courses to choose from. Careers to consider. Opportunities to explore. Opinions to listen to. Expectations to meet. And countless stories telling you what success should look like. But more information doesn't always bring more clarity."
              />
            </div>
          </div>

          <div className="mt-24 md:mt-32">
            <Reveal>
              <p className="meta mb-6">Sometimes, the questions are more personal</p>
            </Reveal>
            <RevealGroup as="ol" className="border-t border-line">
              {PERSONAL_QUESTIONS.map((q, i) => (
                <RevealItem
                  as="li"
                  key={q}
                  className="group grid grid-cols-12 items-baseline gap-4 border-b border-line py-4 sm:py-6 md:py-8"
                >
                  <span className="meta col-span-2 md:col-span-1">{String(i + 1).padStart(2, '0')}</span>
                  <span className="col-span-10 md:col-span-11 font-serif italic text-[clamp(1.35rem,4.5vw,3rem)] leading-[1.12] sm:leading-[1.05] tracking-[-0.015em] text-ink transition-transform duration-700 ease-editorial group-hover:translate-x-2">
                    {q}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-10 md:grid-cols-12">
            <Reveal className="md:col-span-6 md:col-start-2">
              <p className="lede">
                You don&apos;t need to have all the answers. Sometimes, you need a space where you can talk openly, think differently and explore without being judged or told what you should become.
              </p>
            </Reveal>
            <Reveal className="md:col-span-4" delay={0.1}>
              <p className="font-serif text-[1.5rem] leading-[1.2] text-ink">
                That&apos;s where Unfoldinn begins. A conversation can bring a new perspective. A new perspective can open wider possibilities.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. ABOUT: editorial split with sticky title */}
      <section id="about-unfoldinn" className="scroll-mt-24 border-t border-line bg-paper-2">
        <div className="page-x grid grid-cols-1 gap-12 py-28 md:grid-cols-12 md:py-40">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-32">
              <SectionHead meta="About Unfoldinn" title="A space for perspective, possibilities and action" />
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <RevealGroup className="space-y-6">
              {[
                'Unfoldinn is an initiative created to support young people as they navigate the choices, transitions and possibilities that shape their lives beyond the classroom.',
                'It is built on the belief that preparing for life requires more than academic achievement or access to information. Young people also benefit from opportunities to understand themselves, broaden their exposure, consider different perspectives and develop the confidence to make choices they can own.',
                'Unfoldinn brings these elements together through individual conversations, meaningful exposure, exploration of opportunities and thoughtful follow-through.',
                'It is deliberately different from a conventional counselling, coaching or motivational model. There are no ready-made prescriptions and no attempt to define success for the young person.',
                'Instead, the approach is to listen before responding, understand before suggesting, explore before narrowing choices, and encourage action rather than dependence.',
              ].map((p) => (
                <RevealItem as="p" key={p.slice(0, 24)} className="lede">
                  {p}
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal className="mt-16 border-y border-ink py-10">
              <p className="meta mb-5 text-signal">The purpose is simple</p>
              <p className="font-serif text-[clamp(1.75rem,2.8vw,2.5rem)] leading-[1.1] tracking-[-0.015em] text-ink">
                To help young people see more, think more clearly and move forward with greater ownership of their choices.
              </p>
            </Reveal>

            <RevealGroup className="mt-16 space-y-5">
              <RevealItem as="h3" className="font-serif text-[2rem] leading-none">
                Why &ldquo;Unfoldinn&rdquo;?
              </RevealItem>
              <RevealItem as="p" className="lede">
                After more than three decades across the corporate world, entrepreneurship and higher education, Deepak Sogani chose to dedicate the next phase of his professional life to working with young people.
              </RevealItem>
              <RevealItem as="p" className="lede">
                His experience working closely with university students reinforced something he came to value deeply: real progress rarely comes from more advice. It comes from honest conversations that help a young person gain perspective, reconsider a choice, or take a grounded next step.
              </RevealItem>
              <RevealItem as="blockquote" className="border-l-2 border-signal pl-6 font-serif italic text-[1.375rem] leading-[1.3] text-ink">
                &ldquo;The earlier phase was about building my own journey. Unfoldinn is about using that experience to help young people unfold theirs.&rdquo;
              </RevealItem>
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* 4. WHO IT IS FOR: Swiss hairline grid, 7 + 1 */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-40">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
            <SectionHead className="md:col-span-7" meta="Who it is for" title="You don't need to have everything figured out." />
            <Reveal className="md:col-span-4 md:col-start-9">
              <p className="lede">
                Unfoldinn is primarily for young people navigating important questions, choices and transitions in their lives.
              </p>
            </Reveal>
          </div>

          <RevealGroup className="hairline-grid mt-16 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {WHO_IS_IT_FOR.map((item, i) => {
              const accents = [
                'hover:bg-sun-soft/50 group-hover:text-sun',
                'hover:bg-coral-soft/50 group-hover:text-coral',
                'hover:bg-sprout-soft/50 group-hover:text-sprout',
                'hover:bg-sky-soft/50 group-hover:text-sky',
                'hover:bg-sun-soft/50 group-hover:text-sun',
                'hover:bg-coral-soft/50 group-hover:text-coral',
                'hover:bg-sprout-soft/50 group-hover:text-sprout',
              ];
              const accent = accents[i % accents.length];
              const [hoverBg, hoverText] = accent.split(' ');
              return (
                <RevealItem
                  key={item.title}
                  className={`group flex min-h-[17rem] flex-col justify-between p-7 transition-colors duration-500 ease-editorial ${hoverBg}`}
                >
                  <span className={`meta transition-colors duration-300 ${hoverText}`}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-serif text-[1.625rem] leading-[1.05] tracking-[-0.01em] text-ink">{item.title}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-[1.55] text-muted">{item.desc}</p>
                  </div>
                </RevealItem>
              );
            })}
            <RevealItem className="!bg-ink">
              <Link href="/book" className="group flex h-full min-h-[17rem] flex-col justify-between p-7 text-paper">
                <span className="meta text-sun">Begin here</span>
                <div>
                  <p className="font-serif italic text-[1.625rem] leading-[1.1]">
                    You don&apos;t need to arrive with an answer. You can begin with the question.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-paper group-hover:text-sun transition-colors">
                    Start a Conversation
                    <Arrow className="h-3.5 w-3.5 transition-transform duration-500 ease-editorial group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* 5. HOW IT WORKS: sticky stacking cards */}
      <section id="how-it-works" className="scroll-mt-24 border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-40">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
            <SectionHead className="md:col-span-7" meta="How it works" title="One conversation can be a beginning" />
            <Reveal className="md:col-span-4 md:col-start-9">
              <p className="lede">
                Unfoldinn does not begin with a presentation, a questionnaire full of scores or a predetermined solution. It begins with you.
              </p>
            </Reveal>
          </div>
          <div className="mt-16 md:mt-24">
            <StepStack steps={METHODOLOGY_STEPS} />
          </div>
          <Reveal className="mt-10">
            <Button href="/how-it-works" variant="link">See the full approach</Button>
          </Reveal>
        </div>
      </section>

      {/* 5.5: 5 STUDENT OUTCOMES TRANSFORMATION GRID */}
      <section className="border-t border-line bg-paper">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end mb-14">
            <SectionHead
              className="md:col-span-8"
              meta="Observable growth & transformation"
              title="What students walk away with"
              lede="Five pillars of real movement, ownership, and clarity that develop through sustained, thoughtful conversations."
            />
            <Reveal className="md:col-span-4 flex md:justify-end">
              <Button href="/for-students" variant="link" arrow="up-right">
                Explore student pathways
              </Button>
            </Reveal>
          </div>

          <StudentOutcomesGrid />
        </div>
      </section>

      {/* 6. MEET DEEPAK */}
      <section className="border-t border-line">
        <div className="page-x grid grid-cols-1 gap-12 py-28 md:grid-cols-12 md:gap-10 md:py-40">
          <div className="md:col-span-5">
            <ScalePortrait
              src="/deepaksogani.jpeg"
              alt="Deepak Sogani, Founder of Unfoldinn"
              className="aspect-[4/5] w-full"
            />
            <div className="mt-4 flex items-center justify-between">
              <span className="meta">Deepak Sogani</span>
              <span className="meta">Founder, Unfoldinn</span>
            </div>
          </div>

          <div className="md:col-span-6 md:col-start-7 flex flex-col justify-center">
            <SectionHead meta="About Deepak" title="Meet Deepak Sogani" />
            <RevealGroup className="mt-8 space-y-5">
              <RevealItem as="p" className="lede">
                Deepak Sogani brings over 35 years of experience across the corporate world, entrepreneurship and higher education, giving him the opportunity to work with people across different ages, backgrounds and stages of life.
              </RevealItem>
              <RevealItem as="p" className="lede">
                His experience in higher education brought him particularly close to young people: not only through formal responsibilities, but through countless conversations about their aspirations, choices, opportunities, challenges and life beyond the classroom.
              </RevealItem>
              <RevealItem as="p" className="lede">
                Over time, he discovered that what he valued most was not telling young people what to do, but helping them think, bringing a different perspective to the conversation and opening their minds to possibilities they may not have considered.
              </RevealItem>
            </RevealGroup>
            <Reveal as="blockquote" className="mt-12 border-t border-line pt-10">
              <p className="font-serif text-[clamp(1.5rem,2.4vw,2.125rem)] leading-[1.2] tracking-[-0.01em] text-ink">
                &ldquo;I am not here to decide a young person&apos;s future. I want to help them understand themselves, see possibilities and make choices they can own.&rdquo;
              </p>
              <footer className="meta mt-6">Deepak Sogani</footer>
            </Reveal>
            <Reveal className="mt-10">
              <Button href="/about" variant="link">Read Deepak&apos;s story</Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. STUDENT VOICES: masonry */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x py-16 sm:py-24 md:py-40">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
            <SectionHead className="md:col-span-6" meta="In their words" title="Student voices" />
            <Reveal className="md:col-span-5 md:col-start-8">
              <p className="lede">
                Long before Unfoldinn took shape, young people were already describing the value they found in their interactions with Deepak. These reflections, shared voluntarily by students and alumni on LinkedIn, offer a glimpse of the approach that now informs Unfoldinn.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 columns-1 gap-5 md:columns-2 lg:columns-3 [column-fill:_balance]">
            {STUDENT_VOICES.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) * 0.06} className="mb-5 break-inside-avoid">
                <figure className="rounded-[1.5rem] border border-line bg-paper p-7 md:p-8">
                  <p className="meta mb-6 text-signal">{t.category}</p>
                  <blockquote className={`font-serif leading-[1.3] text-ink ${i % 3 === 0 ? 'text-[1.5rem]' : 'text-[1.25rem]'}`}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-8 border-t border-line pt-5">
                    <p className="text-[0.9375rem] font-medium text-ink">{t.name}</p>
                    <p className="text-[0.8125rem] text-muted">{t.role}</p>
                    <div className="mt-3 flex items-center justify-between text-[0.75rem] text-muted">
                      <span>Former Student</span>
                      <a
                        href="https://www.linkedin.com/in/deepak-sogani/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-ink transition-colors"
                      >
                        Source: LinkedIn ↗
                      </a>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-[60ch] text-[0.9375rem] text-muted">
              These voices come from different experiences, but a common thread runs through them: perspective, confidence, ownership and readiness for life beyond the classroom.
            </p>
            <Button href="https://www.linkedin.com/in/deepak-sogani/" variant="link" arrow="up-right">
              More reflections on LinkedIn
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 8. IS / ISN'T: Swiss table */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-40">
          <SectionHead meta="Clarity and expectations" title="What Unfoldinn is, and isn't" />

          <div className="mt-16 border-t border-ink">
            <div className="grid grid-cols-2 border-b border-line py-4">
              <p className="meta text-ink">Unfoldinn is</p>
              <p className="meta pl-4 md:pl-8">Unfoldinn is not</p>
            </div>
            <RevealGroup>
              {WHAT_IT_IS_AND_ISNT.map((row) => (
                <RevealItem key={row.is} className="grid grid-cols-2 border-b border-line">
                  <p className="py-4 sm:py-6 pr-2 sm:pr-4 font-serif text-[clamp(1.0625rem,2.2vw,1.875rem)] leading-[1.18] sm:leading-[1.15] text-ink md:py-8">
                    {row.is}
                  </p>
                  <p className="border-l border-line py-4 sm:py-6 pl-2 sm:pl-4 text-[0.875rem] sm:text-[0.9375rem] leading-[1.45] sm:leading-[1.5] text-muted md:py-8 md:pl-8 md:text-[1.0625rem]">
                    <span className="strike-signal">{row.isNot}</span>
                  </p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* 9. FOR PARENTS */}
      <section className="border-t border-line bg-paper-2">
        <div className="page-x grid grid-cols-1 gap-12 py-28 md:grid-cols-12 md:py-40">
          <div className="md:col-span-6">
            <SectionHead
              meta="For parents"
              title="Every parent wants their child to make thoughtful choices and build a meaningful future."
              titleClassName="max-w-[20ch]"
            />
          </div>
          <div className="md:col-span-5 md:col-start-8 flex flex-col justify-end">
            <RevealGroup className="space-y-5">
              <RevealItem as="p" className="lede">
                But as young people grow, they also need opportunities to question, explore and gradually take ownership of their decisions.
              </RevealItem>
              <RevealItem as="p" className="lede">
                Unfoldinn seeks to complement, not replace, the role of parents, teachers, educational institutions or qualified professionals.
              </RevealItem>
              <RevealItem as="p" className="lede">
                The objective is not to decide a young person&apos;s future for them. It is to provide an additional space for thoughtful conversation, broader perspective and exploration: helping young people become more confident in making choices they understand and own.
              </RevealItem>
              <RevealItem as="p" className="text-[0.875rem] leading-[1.6] text-muted">
                Where appropriate, parents may also become part of the broader conversation while respecting the young person&apos;s privacy and independence.
              </RevealItem>
            </RevealGroup>
            <Reveal className="mt-10">
              <Button href="/for-parents" variant="secondary">Know more for parents</Button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 10. FINAL INVITATION */}
      <section className="border-t border-line">
        <div className="page-x py-16 sm:py-24 md:py-36">
          <RevealGroup className="max-w-[60rem]">
            <RevealItem as="p" className="meta mb-8">Your first step</RevealItem>
            <RevealItem as="h2" className="font-serif text-[clamp(2.75rem,6vw,6rem)] leading-[0.95] tracking-[-0.025em] text-ink">
              Your first step doesn&apos;t have to be a big one.
            </RevealItem>
            <RevealItem as="p" className="lede mt-8 text-[1.1875rem]">
              Sometimes, it can simply be a conversation. No commitment, no pressure, just perspective.
            </RevealItem>
            <RevealItem className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Button href="/book">Start a Conversation</Button>
              <Link href="/privacy-boundaries" className="text-[0.875rem] text-muted underline decoration-ink/20 underline-offset-4 hover:text-ink">
                Read our Privacy, Safety &amp; Professional Boundaries
              </Link>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>
    </div>
  );
}
