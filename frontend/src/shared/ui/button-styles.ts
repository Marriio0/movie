import { cn } from '@/shared/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ' +
  'transition-[background-color,color,box-shadow,transform] duration-(--dur-1) ease-out ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ' +
  '[&_svg]:pointer-events-none [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
  secondary: 'bg-surface-2 text-fg ring-1 ring-line-strong ring-inset hover:bg-surface-3',
  ghost: 'text-fg-muted hover:bg-surface-3 hover:text-fg',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm [&_svg]:size-4',
  md: 'h-10 px-4 text-sm [&_svg]:size-4',
  lg: 'h-12 px-6 text-base [&_svg]:size-5',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: 'size-8 [&_svg]:size-4',
  md: 'size-10 [&_svg]:size-5',
  lg: 'size-12 [&_svg]:size-6',
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Class names for anything that looks like a button: <button>, <Link> or a Radix trigger. */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export function iconButtonStyles({
  variant = 'ghost',
  size = 'md',
  className,
}: ButtonStyleOptions = {}) {
  return cn(base, variants[variant], iconSizes[size], 'px-0', className);
}
