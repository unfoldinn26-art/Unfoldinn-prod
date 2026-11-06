import { Instrument_Serif, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import LayoutShell from '../components/LayoutShell';

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FAF6EE',
};

export const metadata = {
  metadataBase: new URL('https://www.unfoldinn.com'),
  title: {
    default: 'Unfoldinn | Young Minds. New Perspectives. Wider Possibilities.',
    template: '%s | Unfoldinn',
  },
  description:
    'Unfoldinn is a space for young people aged 16–25 to talk openly, understand themselves better, explore possibilities and find their own way forward. Founded by Deepak Sogani in Jaipur, India.',
  applicationName: 'Unfoldinn',
  authors: [{ name: 'Deepak Sogani', url: 'https://unfoldinn.com/about' }],
  generator: 'Next.js',
    keywords: [
    // Brand, Unfold Variations & Founder
    'unfold',
    'Unfoldinn',
    'unfolding your potential',
    'unfold possibilities',
    'unfold your future',
    'unfold young minds',
    'unfold new perspectives',
    'unfold mentoring',
    'unfold youth guidance',
    'unfold career clarity',
    'unfold life decisions',
    'unfold inner confidence',
    'unfolding personal growth',
    'unfoldinn.com',
    'www.unfoldinn.com',
    'Unfoldinn mentoring',
    'Unfoldinn youth platform',
    'Unfoldinn Deepak Sogani',
    'Unfoldinn conversations',
    'Deepak Sogani',
    'Deepak Sogani mentor',
    'Deepak Sogani JKLU',
    'Unfoldinn Jaipur',

    // Student Pain Points & Decision Making (Ages 16–25)
    'career confusion after 12th',
    'what to do after graduation if confused',
    'career guidance for college students',
    'feeling stuck in college career',
    'how to choose the right career path',
    'life guidance for 20 year olds',
    'fear of failure after college',
    'how to build confidence for interviews',
    'finding direction in early 20s',
    'career mentoring vs coaching',
    'peer pressure and career choices',
    'how to talk to parents about career choice',
    'quarter life crisis India',
    'how to find what I am good at',
    'confused between jobs and higher studies',
    'what should I do with my life at 20',
    'career advice for engineering students',
    'career choices for commerce graduates',
    'arts and humanities career opportunities India',
    'study in India vs study abroad dilemma',
    'gap year guidance for students India',
    'switching careers in early 20s',
    'finding purpose and clarity',
    'how to make big life decisions without regret',
    'academic pressure and future anxiety',
    'safe space to talk about career',

    // Solutions & Mentoring Practice
    'youth mentoring platform India',
    'one on one student mentoring',
    'career mentorship for teenagers',
    'personal development mentor for students',
    'online mentor for young adults',
    'life transition mentoring',
    'college to corporate transition guidance',
    'human led mentoring',
    'independent career guidance',
    'practical next steps career advice',
    'perspective mentoring Deepak Sogani',
    'life beyond the classroom',

    // Parents & Family Guidance
    'how to support child career choice',
    'how to talk to teenager about future without arguing',
    'guidance for parents of college students',
    'parent child communication about career',
    'mentor for my teenage son daughter',
    'helping child choose career without pressure',
    'new age careers advice for parents',
    'understanding modern career options India',
    'how to guide my child without forcing them',
    'parent child gap in career expectations',
    'talking to parents about unconventional careers',
    'trusted mentor for young people India',

    // Institutions, Schools & Universities
    'student development program for colleges',
    'mentoring programs for higher education institutions',
    'school to university transition workshop',
    'student affairs leadership program',
    'holistic student mentoring pilot',
    'career exposure workshops for schools',
    'student mental clarity and leadership',
    'institution student retention and engagement',
    '90 day student development pilot',
    'freshman transition program India',
    'student wellbeing and life readiness',
    'preparing students for the real world',

    // Curated Opportunities & Fellowships
    'best fellowships for college graduates India',
    'scholarships for undergraduate students India',
    'how to find genuine internships in college',
    'social impact fellowships India',
    'youth leadership opportunities India',
    'curated student opportunities portal',
    'gap year opportunities Indian students',

    // Regional & Local SEO (Jaipur / Rajasthan / Pan-India)
    'student mentor in Jaipur',
    'career mentoring in Jaipur',
    'youth counselor mentor Rajasthan',
    'career guidance in Jaipur for students',
    'student development workshops Jaipur',
    'best youth mentor in Rajasthan',
    'online student mentor India',
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Deepak Sogani',
  publisher: 'Unfoldinn',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://www.unfoldinn.com',
    languages: {
      'en-IN': 'https://www.unfoldinn.com',
    },
  },
  openGraph: {
    title: 'Unfoldinn | Young Minds. New Perspectives. Wider Possibilities.',
    description:
      'Unfoldinn is a space for young people aged 16–25 to talk openly, understand themselves better, explore possibilities and find their own way forward.',
    url: 'https://www.unfoldinn.com',
    siteName: 'Unfoldinn',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Unfoldinn — Young Minds. New Perspectives. Wider Possibilities.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unfoldinn | Young Minds. New Perspectives. Wider Possibilities.',
    description:
      'Sometimes, you don’t need another answer. You need the right conversation. A space for young people aged 16–25.',
    creator: '@Unfoldinn',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '08CBBEF04FF2915E3D43FC9C8CD43BC6',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://www.unfoldinn.com/#organization',
      name: 'Unfoldinn',
      alternateName: ['Unfoldinn Mentoring', 'Unfoldinn Youth Platform'],
      url: 'https://www.unfoldinn.com',
      logo: 'https://www.unfoldinn.com/logo.jpg',
      slogan: 'Young Minds. New Perspectives. Wider Possibilities.',
      description:
        'An independent mentoring practice for young people aged 16–25, parents, and educational institutions to explore perspectives, clarity, and life readiness beyond the classroom.',
      disambiguatingDescription:
        'Unfoldinn is a human-led youth mentoring practice founded by Deepak Sogani in Jaipur, India. It is distinct from competitive coaching institutes, test-prep centers, or commercial college admissions consultants.',
      founder: {
        '@type': 'Person',
        '@id': 'https://www.unfoldinn.com/about#deepaksogani',
        name: 'Deepak Sogani',
        jobTitle: 'Founder & Lead Mentor',
        alumniOf: 'JK Lakshmipat University',
        url: 'https://www.unfoldinn.com/about',
        sameAs: ['https://www.linkedin.com/in/deepak-sogani/'],
        knowsAbout: [
          'Youth Development',
          'Student Affairs',
          'Higher Education Mentoring',
          'Career Transitions',
          'Life Beyond the Classroom'
        ],
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Jaipur',
        addressRegion: 'Rajasthan',
        addressCountry: 'IN',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91 77372 20724',
        contactType: 'mentoring inquiry',
        email: 'unfoldinn26@gmail.com',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
      knowsAbout: [
        'Youth Mentoring (Ages 16–25)',
        'Career Decision Frameworks',
        'College to Corporate Transitions',
        'Parent-Child Career Communication',
        'Holistic Student Development'
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Unfoldinn Mentoring Programs',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Introductory 1-on-1 Mentoring Conversation',
              description: 'Complimentary private 1-on-1 conversation for young people aged 16–25 with Deepak Sogani.',
            },
            price: '0',
            priceCurrency: 'INR',
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: '1-on-1 Perspective Mentoring Session',
              description: 'In-depth private mentoring session with continuity notes and decision frameworks.',
            },
            price: '500',
            priceCurrency: 'INR',
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Higher Education & School Student Development Pilots',
              description: '90-day institutional student development and life-readiness transition workshops.',
            },
          },
        ],
      },
      sameAs: [
        'https://www.unfoldinn.com',
        'https://www.linkedin.com/in/deepak-sogani/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.unfoldinn.com/#website',
      url: 'https://www.unfoldinn.com',
      name: 'Unfoldinn',
      publisher: {
        '@id': 'https://www.unfoldinn.com/#organization',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('theme');
                  // Default force is light
                  if (t === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <link rel="help" type="text/plain" href="https://www.unfoldinn.com/llms.txt" title="LLM Knowledge Documentation" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="grain font-sans antialiased bg-paper text-ink min-h-[100dvh]">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
