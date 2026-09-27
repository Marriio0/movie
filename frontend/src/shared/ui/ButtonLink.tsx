import { Link, type LinkProps } from 'react-router';
import { buttonStyles, type ButtonSize, type ButtonVariant } from './button-styles';

export interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Navigation styled as a button. Use this, not <Button onClick={navigate}>, so links stay links. */
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
