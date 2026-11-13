/** Section heading block matching the Figma Unfoldinn design system. */
import { RevealGroup, RevealItem } from './Reveal';

export default function SectionHead({ meta, title, lede, className = '', titleClassName = '' }) {
  return (
    <RevealGroup className={className}>
      {meta && (
        <RevealItem
          as="p"
          className="mb-3 sm:mb-4 font-wix-text text-[11px] font-bold uppercase tracking-[0.12em] text-[#765c9c]"
        >
          {meta}
        </RevealItem>
      )}
      <RevealItem
        as="h2"
        className={`max-w-[22ch] font-wix-display text-[clamp(1.85rem,4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.03em] text-[#29253a] ${titleClassName}`}
      >
        {title}
      </RevealItem>
      {lede && (
        <RevealItem
          as="p"
          className="mt-4 sm:mt-5 max-w-[58ch] font-wix-text text-[1rem] leading-[1.65] text-[#686579]"
        >
          {lede}
        </RevealItem>
      )}
    </RevealGroup>
  );
}
