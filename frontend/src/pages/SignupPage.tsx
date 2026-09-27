import { Link } from 'react-router';
import { PagePlaceholder } from '@/shared/components/PagePlaceholder';
import { paths } from '@/shared/config/paths';

export function SignupPage() {
  return (
    <PagePlaceholder
      layout="card"
      title="Create your account"
      description="Account creation with Firebase Authentication is built in the authentication phase."
    >
      <p className="text-sm text-fg-muted">
        Already have an account?{' '}
        <Link to={paths.login()} className="font-medium text-accent-text hover:underline">
          Sign in
        </Link>
      </p>
    </PagePlaceholder>
  );
}
