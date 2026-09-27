import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

const tones = {
  neutral: 'bg-surface-3 text-fg-muted ring-line',
  accent: 'bg-accent/15 text-accent-text ring-accent/30',
} as const;

export interface BadgeProps {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
