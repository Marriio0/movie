import { isRouteErrorResponse, useRouteError } from 'react-router';
import { NotFoundView } from '@/shared/components/NotFoundView';
import { paths } from '@/shared/config/paths';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { ErrorState } from '@/shared/ui/ErrorState';

// Failed lazy-route imports usually mean a new deploy replaced the old chunks.
const CHUNK_ERROR =
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i;

/** Route-level error boundary: 404 responses, stale deploy chunks, and unexpected render errors. */
export function RouteErrorPage() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const isStaleChunk = error instanceof Error && CHUNK_ERROR.test(error.message);

  useDocumentTitle(isNotFound ? 'Not found' : 'Something went wrong');

  if (isNotFound) return <NotFoundView />;

  return (
    <div className="container-page py-(--section-y)">
      <ErrorState
        titleAs="h1"
        title={isStaleChunk ? 'A new version is available' : 'Something went wrong'}
        description={
          isStaleChunk
            ? 'Reload the page to get the latest version.'
            : 'This page hit an unexpected error. Reloading usually fixes it.'
        }
        retryLabel="Reload page"
        onRetry={() => window.location.reload()}
        actions={
          <ButtonLink to={paths.home} variant="ghost">
            Go home
          </ButtonLink>
        }
      />
    </div>
  );
}
