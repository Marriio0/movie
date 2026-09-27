import type { ComponentPropsWithRef } from 'react';
import { iconButtonStyles, type ButtonSize, type ButtonVariant } from './button-styles';

export interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'aria-label'> {
  /** Accessible name. Required because the button has no visible text. */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function IconButton({
  label,
  variant,
  size,
  className,
  type = 'button',
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={iconButtonStyles({ variant, size, className })}
      {...props}
    >
      {children}
    </button>
  );
}
