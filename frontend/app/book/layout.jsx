export const metadata = {
  title: 'Start a Conversation | Unfoldinn — Deepak Sogani',
  description:
    'Start a conversation with Deepak Sogani. No preparation needed. Tell us what is on your mind. Your first introductory conversation is complimentary.',
  keywords: [
    'start a conversation',
    'youth mentor conversation',
    'career guidance conversation',
    'talk to youth mentor',
    'private one to one conversation',
    'Deepak Sogani conversation',
  ],
  alternates: {
    canonical: 'https://www.unfoldinn.com/book',
  },
  openGraph: {
    title: 'Start a Conversation — Unfoldinn',
    description:
      'No ready-made answers. No predetermined path. Just a quiet, private conversation to explore what comes next.',
    url: 'https://www.unfoldinn.com/book',
  },
};

export default function BookLayout({ children }) {
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
        name: 'Start a Conversation',
        item: 'https://www.unfoldinn.com/book',
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
