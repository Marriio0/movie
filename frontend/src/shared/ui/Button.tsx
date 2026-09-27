import type { ComponentPropsWithRef } from 'react';
import { buttonStyles, type ButtonSize, type ButtonVariant } from './button-styles';
import { Spinner } from './Spinner';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Disables the button and shows a spinner while an action is in flight. */
  loading?: boolean;
}

export function Button({
  variant,
  size,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
