export const metadata = {
  title: 'About Deepak Sogani | Founder, Unfoldinn',
  description:
    'Meet Deepak Sogani: 35+ years across corporate leadership, entrepreneurship, and higher education. Dedicated to listening, perspective, and youth development.',
  keywords: [
    'unfold',
    'unfold mentoring',
    'Deepak Sogani unfoldinn',
    'Deepak Sogani',
    'Deepak Sogani mentor',
    'Deepak Sogani JKLU',
    'Unfoldinn founder',
    'corporate to mentorship journey',
    'student mentor Jaipur',
    'youth guidance Deepak Sogani',
  ],
  alternates: {
    canonical: 'https://www.unfoldinn.com/about',
  },
  openGraph: {
    title: 'About Deepak Sogani — Unfoldinn',
    description:
      '35+ years across corporate life, entrepreneurship and higher education. Dedicated to bringing perspective and possibilities to young people.',
    url: 'https://www.unfoldinn.com/about',
    type: 'profile',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Deepak Sogani | Unfoldinn',
    description:
      '35+ years across corporate life, entrepreneurship and higher education. Dedicated to bringing perspective to the next generation.',
  },
};

export default function AboutLayout({ children }) {
  const authorSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      '@id': 'https://www.unfoldinn.com/about#deepaksogani',
      name: 'Deepak Sogani',
      jobTitle: 'Founder',
      worksFor: {
        '@type': 'EducationalOrganization',
        name: 'Unfoldinn',
        url: 'https://www.unfoldinn.com',
      },
      image: 'https://www.unfoldinn.com/deepaksogani.jpeg',
      description:
        '35+ Years Across Corporate Life, Entrepreneurship & Higher Education. Dedicated to helping young people aged 16–25 explore possibilities and choose their own next step.',
      email: 'unfoldinn26@gmail.com',
      telephone: '+91 77372 20724',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Jaipur',
        addressRegion: 'Rajasthan',
        addressCountry: 'IN',
      },
      sameAs: [
        'https://www.linkedin.com/in/deepak-sogani/',
        'https://www.unfoldinn.com/about',
      ],
      knowsAbout: [
        'Youth Development',
        'Student Affairs',
        'Career Exploration',
        'Higher Education Transitions',
        'Leadership Mentoring',
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }}
      />
      {children}
    </>
  );
}
