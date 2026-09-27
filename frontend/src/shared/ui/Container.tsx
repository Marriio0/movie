import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/shared/lib/cn';

/** Centered page column with the responsive gutters defined in tokens.css. */
export function Container({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={cn('container-page', className)} {...props} />;
}
