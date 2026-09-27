import { cn } from '@/shared/lib/cn';

const sizes = { sm: 'size-4', md: 'size-5', lg: 'size-8' } as const;

export interface SpinnerProps {
  size?: keyof typeof sizes;
  /** When set, the spinner becomes a polite status message for screen readers. */
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  const icon = (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn('animate-spin', sizes[size], !label && className)}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <path
        d="M21.5 12A9.5 9.5 0 0 0 12 2.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!label) return icon;

  return (
    <span role="status" className={cn('inline-flex', className)}>
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}
