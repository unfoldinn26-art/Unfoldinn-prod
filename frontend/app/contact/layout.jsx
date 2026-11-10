export const metadata = {
  title: 'Contact | Get in Touch — Unfoldinn',
  description:
    'Reach Deepak Sogani at Unfoldinn. Email: unfoldinn26@gmail.com | WhatsApp: +91 77372 20724. Based in Jaipur, Rajasthan, serving young people pan-India.',
  keywords: [
    'contact Unfoldinn',
    'Deepak Sogani contact',
    'student conversation inquiries',
    'institutional partnerships schools colleges',
    'Jaipur Rajasthan',
    'reach out to Unfoldinn',
  ],
  alternates: {
    canonical: 'https://www.unfoldinn.com/contact',
  },
  openGraph: {
    title: 'Contact — Unfoldinn',
    description:
      'We welcome inquiries from students, parents, schools, and colleges. Start a conversation with us.',
    url: 'https://www.unfoldinn.com/contact',
  },
};

export default function ContactLayout({ children }) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.unfoldinn.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Contact',
        item: 'https://www.unfoldinn.com/contact',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
