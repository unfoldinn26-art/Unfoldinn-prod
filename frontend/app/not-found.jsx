import Link from 'next/link';
import Button from '../components/ui/Button';

export const metadata = {
  title: '404 — Page Not Found | Unfoldinn',
  description: 'The page you requested could not be found.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="page-x flex min-h-[75vh] flex-col items-start justify-center pt-36 pb-24">
      <p className="meta text-signal mb-6">404 • Page Not Found</p>
      <h1 className="max-w-[20ch] font-serif text-[clamp(2.75rem,6vw,5.5rem)] leading-[0.95] tracking-[-0.02em] text-ink mb-6">
        This page took a different path.
      </h1>
      <p className="lede text-[1.125rem] text-muted mb-10">
        The destination you were looking for doesn&apos;t exist or has moved. Navigating unexpected transitions is what we do best.
      </p>
      <div className="flex flex-wrap items-center gap-6">
        <Button href="/">Return to Home</Button>
        <Link href="/book" className="meta text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-signal">
          Start a Conversation →
        </Link>
      </div>
    </div>
  );
}
