import { APP_NAME } from '@/shared/config/app';
import { cn } from '@/shared/lib/cn';

/** Netfarjo modern cinematic prism / stylized N play mark */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="nf-grad-1" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f5b544" />
          <stop offset="0.5" stopColor="#e0901e" />
          <stop offset="1" stopColor="#b36200" />
        </linearGradient>
        <linearGradient id="nf-grad-2" x1="14" y1="4" x2="14" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffc862" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      {/* Background soft glow shield */}
      <rect x="2" y="2" width="24" height="24" rx="6" fill="#17171b" stroke="url(#nf-grad-1)" strokeWidth="1.5" />
      {/* Dynamic N & Play Ribbon */}
      <path
        d="M8 8V20L13.5 12V20L20 8"
        stroke="url(#nf-grad-2)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Vibrant center Play accent pip */}
      <polygon points="12,11 16.5,14 12,17" fill="#f5b544" />
    </svg>
  );
}

/** Mark plus wordmark. Uses APP_NAME for accessible text. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 select-none', className)}>
      <LogoMark className="size-7 shrink-0 transition-transform duration-200 group-hover:scale-105" />
      <span className="flex items-center gap-1.5">
        <span className="text-xl font-extrabold tracking-tight text-fg font-sans">
          {APP_NAME.slice(0, 3)}<span className="text-accent">{APP_NAME.slice(3)}</span>
        </span>
        <span className="hidden xs:inline-flex items-center rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent border border-accent/25">
          نتفرجو
        </span>
      </span>
    </span>
  );
}
