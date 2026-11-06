'use client';

/** Quiet floating WhatsApp pill. Ink object on paper, expands label on hover. */
export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/917737220724?text=Hi,%20I%20would%20like%20to%20know%20more%20about%20Unfoldinn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 sm:right-6 z-nav flex h-12 items-center gap-0 overflow-hidden rounded-full border border-line dark:border-white/15 bg-paper/85 dark:bg-[#111822]/90 pl-1 pr-1 backdrop-blur-xl transition-[gap,padding] duration-500 ease-editorial hover:gap-2 hover:pr-4 md:bottom-7 md:right-7"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-ink dark:bg-white text-paper dark:text-[#0E1318]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.17-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
        </svg>
        <span aria-hidden="true" className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full border-2 border-ink bg-signal" />
      </span>
      <span className="max-w-0 whitespace-nowrap text-[0.8125rem] font-medium text-ink dark:text-white opacity-0 transition-[max-width,opacity] duration-500 ease-editorial group-hover:max-w-[10rem] group-hover:opacity-100">
        Chat on WhatsApp
      </span>
    </a>
  );
}
