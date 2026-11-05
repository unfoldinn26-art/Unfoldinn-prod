import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Button from '../../../components/ui/Button';
import Arrow from '../../../components/ui/Arrow';
import { getResourceBySlug } from '../../../lib/api';
import { getCuratedArticleBySlug } from '../../../lib/curatedArticles';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  let resource = null;
  try {
    resource = await getResourceBySlug(params.slug);
  } catch (e) {
    // ignore
  }
  if (!resource) {
    resource = getCuratedArticleBySlug(params.slug);
  }

  if (!resource) {
    return { title: 'Resource Not Found | Unfoldinn' };
  }
  const url = `https://unfoldinn.com/resources/${params.slug}`;
  return {
    title: `${resource.title} | Unfoldinn Guidance`,
    description: resource.excerpt || 'Thoughtful perspective and mentoring insights by Deepak Sogani.',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: resource.title,
      description: resource.excerpt,
      url,
      type: 'article',
      authors: [resource.author || 'Deepak Sogani'],
      publishedTime: resource.createdAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: resource.title,
      description: resource.excerpt,
    },
  };
}

export default async function ResourceDetailPage({ params }) {
  let resource = null;
  try {
    resource = await getResourceBySlug(params.slug);
  } catch (e) {
    // fallback
  }

  if (!resource) {
    resource = getCuratedArticleBySlug(params.slug);
  }

  if (!resource) {
    notFound();
  }

  return (
    <div className="w-full">
      <article className="page-x pt-36 md:pt-48 pb-20 md:pb-28">
        {/* Back Link */}
        <div className="mb-12">
          <Link 
            href="/resources" 
            className="group inline-flex items-center gap-2 meta text-ink hover:text-signal transition-colors"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
            <span>Back to Resources</span>
          </Link>
        </div>

        {/* Header */}
        <header className="max-w-[76rem]">
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <span className="meta text-signal">
              {resource.category?.replace(/-/g, ' ')}
            </span>
            <span aria-hidden="true" className="h-px w-6 bg-line" />
            <span className="meta">
              {resource.readingTime || resource.readTime || 5} min read
            </span>
            {resource.createdAt && (
              <>
                <span aria-hidden="true" className="h-px w-6 bg-line" />
                <span className="meta">
                  {new Date(resource.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </>
            )}
          </div>
          
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-[-0.02em] text-ink mb-8">
            {resource.title}
          </h1>

          <div className="flex items-center border-t border-b border-line py-4 text-xs font-mono uppercase tracking-wider text-muted">
            <span>By {resource.author || 'Deepak Sogani'}</span>
          </div>
        </header>

        {/* Article Body */}
        <div 
          className="mt-12 md:mt-16 max-w-[68ch] space-y-6 text-[1.125rem] leading-[1.75] text-ink-2 font-sans [&>p]:leading-relaxed [&>h2]:font-serif [&>h2]:text-[2rem] [&>h2]:text-ink [&>h2]:mt-12 [&>h2]:mb-4 [&>h3]:font-serif [&>h3]:text-[1.5rem] [&>h3]:text-ink [&>h3]:mt-8 [&>h3]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>blockquote]:border-l-2 [&>blockquote]:border-signal [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:my-8 [&>blockquote]:text-ink"
          dangerouslySetInnerHTML={{ __html: resource.content }}
        />

        {/* Footer CTA */}
        <div className="mt-24 rounded-[1.75rem] border border-line bg-paper-2 p-8 md:p-14 max-w-[76rem]">
          <span className="meta text-signal mb-3 block">Perspective &amp; Action</span>
          <h3 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] text-ink mb-4">
            Want to discuss this perspective?
          </h3>
          <p className="text-[1.0625rem] text-muted max-w-[55ch] leading-relaxed mb-8">
            Let&apos;s talk about how these concepts apply to your specific situation, choices, and next steps.
          </p>
          <Button href="/book">Start a Conversation</Button>
        </div>
      </article>
    </div>
  );
}
