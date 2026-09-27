import { APP_NAME } from '@/shared/config/app';
import { cn } from '@/shared/lib/cn';

/** Marquee sign: three bulbs over a frame. Uses currentColor. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <g fill="currentColor">
        <circle cx="6.5" cy="4.5" r="1.5" />
        <circle cx="12" cy="4.5" r="1.5" />
        <circle cx="17.5" cy="4.5" r="1.5" />
      </g>
      <rect
        x="2.75"
        y="8.25"
        width="18.5"
        height="12"
        rx="2.75"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <rect
        x="2.75"
        y="8.25"
        width="18.5"
        height="12"
        rx="2.75"
        fill="currentColor"
        fillOpacity="0.14"
      />
    </svg>
  );
}

/** Mark plus wordmark. The name is real text, so it works as a link's accessible name. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-6 text-accent" />
      <span className="font-display text-2xl leading-none tracking-tight text-fg">{APP_NAME}</span>
    </span>
  );
}
