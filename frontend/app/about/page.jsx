import Link from 'next/link';
import PageHero from '../../components/ui/PageHero';
import SectionHead from '../../components/ui/SectionHead';

export const metadata = {
  title: 'About Deepak Sogani | Founder & Mentor — Unfoldinn',
  description:
    'Meet Deepak Sogani: 35+ years across corporate leadership, entrepreneurship, and higher education in Jaipur, dedicating his second innings to mentoring young people.',
  alternates: {
    canonical: 'https://www.unfoldinn.com/about',
  },
};

const STUDENT_REFLECTIONS = [
  {
    category: 'Life preparation',
    quote:
      'You never just prepared students for university, you prepared us for life. You taught us to take ownership, stay disciplined, think independently, stand by our decisions, and never compromise on our values.',
    name: 'Priya Kaushik',
    role: 'Project Manager | Business Analyst',
  },
  {
    category: 'Leadership',
    quote:
      'You were the person who saw potential in me before I did... The confidence to take on opportunities, make difficult decisions, and lead people is something I owe to you.',
    name: 'Bismanpreet Singh',
    role: 'Startup Ecosystem Professional | Former Student Council President',
  },
  {
    category: 'Perspective',
    quote:
      "Whenever I found myself unsure of the next step, your perspective helped me see possibilities I couldn't see on my own... every student deserves to have a mentor like you.",
    name: 'Himangi Chaturvedi',
    role: 'Associate Project Manager',
  },
  {
    category: 'Decision-making',
    quote:
      'What I value most is that you never simply gave answers - you helped me learn how to find them myself.',
    name: 'Omprakash Kumawat',
    role: 'Software Engineer',
  },
  {
    category: 'Real-world readiness',
    quote:
      "The professional world has made us realize exactly why you pushed us so hard. You didn't just teach us, you built our character and prepared us for reality.",
    name: 'Jia Soni',
    role: 'HR Manager | Coaching & Mentoring',
  },
  {
    category: 'Confidence',
    quote:
      "You've been more than a mentor, you've been a catalyst... Every conversation with you left me feeling clearer, stronger, and more capable.",
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

export default function AboutPage() {
  return (
    <div className="w-full bg-white text-[#29253a]">
      <PageHero
        breadcrumbs={[{ name: 'About Deepak', href: '/about' }]}
        meta={['Meet Deepak Sogani', 'Founder & Mentor', 'Jaipur, India']}
        title="Experience, offered with curiosity."
        lede="After decades across corporate leadership, entrepreneurship, and higher education, Deepak chose to dedicate his next chapter to helping young people think through the questions that shape their lives."
      />

      {/* Arch Portrait + Story */}
      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="relative mx-auto w-full max-w-[390px] lg:col-span-5">
            <div className="overflow-hidden rounded-t-[200px] rounded-b-[26px] bg-[#eee6ff]">
              <img
                src="/images/founder/deepak-sogani.webp"
                alt="Deepak Sogani smiling"
                className="h-[480px] w-full object-cover"
              />
            </div>
            <div className="absolute -right-2 bottom-6 -rotate-6 flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#ffe79a] p-3 text-center shadow-md">
              <span className="font-wix-text text-[10px] leading-[1.4] text-[#29253a]">
                Founder &amp; mentor
                <br />
                Jaipur, India
              </span>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-7">
            <blockquote className="border-l-[3px] border-[#f6b47d] pl-5 font-wix-display text-[24px] font-medium leading-[1.4] text-[#29253a]">
              “My role is not to hand over answers. It is to listen, ask useful questions and help
              a young person see more clearly for themselves.”
            </blockquote>

            <div className="flex items-center gap-4 pt-2">
              <span className="font-wix-display text-[44px] font-semibold leading-none text-[#29253a]">
                35+
              </span>
              <span className="max-w-[240px] font-wix-text text-[13px] leading-[1.5] text-[#686579]">
                years of lived, professional, entrepreneurial, and educational experience
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
              {WHAT_I_BRING.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[20px] border border-[#e5dfef] bg-[#faf8ff] p-5"
                >
                  <h3 className="font-wix-display text-[18px] font-medium text-[#29253a]">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 font-wix-text text-[13px] leading-[1.55] text-[#686579]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Student Reflections */}
      <section className="bg-[#f5f0ff] py-20">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-10">
          <SectionHead
            meta="Voices from alumni & students"
            title="Reflections from young people Deepak has mentored."
          />

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {STUDENT_REFLECTIONS.map((r) => (
              <div
                key={r.name}
                className="flex flex-col justify-between rounded-[24px] border border-[#e5dfef] bg-white p-6"
              >
                <div>
                  <span className="inline-block rounded-full bg-[#eee6ff] px-3 py-1 font-wix-text text-[11px] font-semibold text-[#524588]">
                    {r.category}
                  </span>
                  <p className="mt-4 font-wix-text text-[14px] leading-[1.65] text-[#4c465d]">
                    “{r.quote}”
                  </p>
                </div>
                <div className="mt-6 border-t border-[#e5dfef] pt-4">
                  <div className="font-wix-display text-[16px] font-semibold text-[#29253a]">
                    {r.name}
                  </div>
                  <div className="font-wix-text text-[12px] text-[#686579]">{r.role}</div>
                </div>
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
        <div className="mx-auto max-w-[740px]">
          <p className="font-wix-text text-[11px] font-bold uppercase tracking-[1.36px] text-[#765c9c]">
            Start a conversation
          </p>
          <h2 className="mt-3 font-wix-display text-[2.25rem] font-normal text-[#29253a] sm:text-[3rem]">
            Your first step doesn’t have to be a big one.
          </h2>
          <Link
            href="/book"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2.5 rounded-[100px] bg-[#29253a] px-7 font-wix-text text-[14px] font-semibold text-white transition hover:bg-[#3a3451]"
          >
            <span>Book a conversation with Deepak</span>
            <img src="/icons/arrow-right-circle-cta.svg" alt="" width={20} height={20} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
