import { Link } from 'react-router';
import { PagePlaceholder } from '@/shared/components/PagePlaceholder';
import { paths } from '@/shared/config/paths';

export function LoginPage() {
  return (
    <PagePlaceholder
      layout="card"
      title="Sign in"
      description="Email/password and Google sign-in with Firebase Authentication are built in the authentication phase."
    >
      <p className="text-sm text-fg-muted">
        New here?{' '}
        <Link to={paths.signup()} className="font-medium text-accent-text hover:underline">
          Create an account
        </Link>
      </p>
    </PagePlaceholder>
  );
}
