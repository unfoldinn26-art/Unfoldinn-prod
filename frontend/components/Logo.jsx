'use client';

/**
 * Unfoldinn Brand Logo supporting all 3 official Figma lockups:
 * 1. layout="mark"       -> Icon mark + peach dot (emails, avatars, badges)
 * 2. layout="horizontal" -> Icon mark + dot + Unfoldinn wordmark (Navbar, Footer)
 * 3. layout="stacked"    -> Large icon mark above, dot + Unfoldinn at bottom-left
 */
export default function Logo({
  size = 'md',
  layout = 'horizontal',
  showText = true,
  showTagline = false,
  variant = 'light',
  className = '',
}) {
  const effectiveLayout = showText === false ? 'mark' : layout;

  const iconSizes = {
    sm: 'w-11 h-9',
    md: 'w-14 h-11',
    lg: 'w-20 h-16',
    xl: 'w-28 h-22',
  };

  const textSizes = {
    sm: 'text-[1.45rem] leading-none',
    md: 'text-[1.875rem] leading-none',
    lg: 'text-[2.25rem] leading-none',
    xl: 'text-[2.75rem] leading-none',
  };

  const markSrc =
    variant === 'dark'
      ? '/logo/unfoldinn-mark-dark.svg'
      : '/logo/unfoldinn-mark-light.svg';

  const foldinnColor =
    variant === 'dark' ? 'text-[#e5dfef]' : 'text-[#29253a] dark:text-[#e5dfef]';

  if (effectiveLayout === 'stacked') {
    return (
      <div className={`inline-flex flex-col items-start select-none ${className}`}>
        <div className="relative ml-2 w-28 h-22 sm:w-36 sm:h-28">
          <img
            src={markSrc}
            alt="Unfoldinn"
            width={144}
            height={112}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 shrink-0 rounded-full bg-[#f6b47d]"
          />
          <span className="font-shantell text-[1.625rem] font-medium leading-none tracking-[-0.02em]">
            <span className="text-[#e39a5d]">Un</span>
            <span className={foldinnColor}>foldinn</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative shrink-0 ${iconSizes[size] || iconSizes.md}`}>
        <img
          src={markSrc}
          alt={effectiveLayout === 'mark' ? 'Unfoldinn' : ''}
          width={58}
          height={45}
          aria-hidden={effectiveLayout !== 'mark'}
          className="h-full w-full object-contain"
        />
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -left-0.5 h-1.5 w-1.5 rounded-full bg-[#f6b47d]"
        />
      </div>

      {effectiveLayout !== 'mark' && (
        <div className="flex flex-col">
          <span
            className={`font-shantell font-medium tracking-[-0.02em] ${
              textSizes[size] || textSizes.md
            }`}
          >
            <span className="text-[#e39a5d]">Un</span>
            <span className={foldinnColor}>foldinn</span>
          </span>
          {showTagline && (
            <span
              className={`mt-1.5 font-wix-text text-[0.75rem] leading-[1.4] ${
                variant === 'dark' ? 'text-[#9b95ad]' : 'text-[#686579] dark:text-[#b4aec4]'
              }`}
            >
              Young Minds. New Perspectives. Wider Possibilities.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
