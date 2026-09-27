import { cn } from '@/shared/lib/cn';

export interface SkeletonProps {
  className?: string;
}

/**
 * Placeholder block with the exact size of the content it stands in for, so nothing shifts
 * when data arrives. Hidden from assistive tech; the surrounding region announces loading.
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('skeleton rounded-md', className)} />;
}
