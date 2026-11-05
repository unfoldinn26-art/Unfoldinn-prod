import Link from 'next/link';

/**
 * Editorial Breadcrumbs component with embedded Schema.org BreadcrumbList JSON-LD
 * items: Array of { name: string, href?: string }
 */
export default function Breadcrumbs({ items = [], className = '' }) {
  const allItems = [{ name: 'Home', href: '/' }, ...items];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.href ? `https://unfoldinn.com${item.href}` : 'https://unfoldinn.com',
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className={`mb-4 sm:mb-6 flex items-center text-[0.75rem] sm:text-xs text-muted ${className}`}>
        <ol className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            return (
              <li key={item.name} className="flex items-center gap-1.5 sm:gap-2">
                {isLast || !item.href ? (
                  <span className="text-ink font-medium" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="py-0.5 hover:text-ink transition-colors">
                    {item.name}
                  </Link>
                )}
                {!isLast && <span aria-hidden="true" className="text-line select-none">/</span>}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
