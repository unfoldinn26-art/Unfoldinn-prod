import { Reveal, RevealGroup, RevealItem } from './Reveal';
import Breadcrumbs from './Breadcrumbs';

/**
 * Shared interior-page hero styled to match the Figma Unfoldinn theme:
 * Lavender-to-peach rounded container, Wix Madefor Display heading, and plum-charcoal ink.
 */
export default function PageHero({
  breadcrumbs,
  meta = [],
  title,
  lede,
  children,
  className = '',
}) {
  return (
    <section className={`px-3 pt-24 pb-8 sm:px-6 md:px-10 md:pt-28 ${className}`}>
      <div
        className="mx-auto max-w-[1240px] rounded-[28px] px-6 py-10 sm:px-10 md:px-14 md:py-14"
        style={{
          backgroundImage:
            'linear-gradient(153deg, rgb(238, 230, 255) 0%, rgb(245, 233, 242) 62%, rgb(248, 209, 173) 100%)',
        }}
      >
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <RevealGroup>
          {meta.length > 0 && (
            <RevealItem className="mb-4 sm:mb-6 flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-1.5">
              {meta.map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-3 font-wix-text text-[11px] font-bold uppercase tracking-[0.12em] text-[#765c9c]"
                >
                  {i > 0 && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#e39a5d]" />}
                  {m}
                </span>
              ))}
            </RevealItem>
          )}
          <RevealItem
            as="h1"
            className="max-w-[72rem] font-wix-display text-[clamp(2.1rem,5vw,4.25rem)] font-medium leading-[1.06] tracking-[-0.03em] text-[#29253a] break-words"
          >
            {title}
          </RevealItem>
          {lede && (
            <RevealItem
              as="p"
              className="mt-5 max-w-[60ch] font-wix-text text-[1rem] leading-[1.65] text-[#4c465d] sm:text-[1.0625rem]"
            >
              {lede}
            </RevealItem>
          )}
          {children && <RevealItem className="mt-6 sm:mt-8">{children}</RevealItem>}
        </RevealGroup>
      </div>
    </section>
  );
}
