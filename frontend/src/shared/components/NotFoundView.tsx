import { paths } from '@/shared/config/paths';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';
import { ButtonLink } from '@/shared/ui/ButtonLink';
import { Container } from '@/shared/ui/Container';

export interface NotFoundViewProps {
  title?: string;
  description?: string;
}

/** Shared 404 content for unknown URLs, invalid ids and titles TMDB doesn't know. */
export function NotFoundView({
  title = 'This page isn’t showing',
  description = 'The link may be broken, or the page may have moved.',
}: NotFoundViewProps) {
  useDocumentTitle('Not found');

  return (
    <Container className="flex flex-col items-center py-20 text-center sm:py-28">
      <p
        aria-hidden="true"
        className="font-display text-[clamp(6rem,22vw,11rem)] leading-none text-accent-text"
      >
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance text-fg">{title}</h1>
      <p className="mt-2 max-w-md text-pretty text-fg-muted">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to={paths.home}>Back to home</ButtonLink>
        <ButtonLink to={paths.search()} variant="secondary">
          Search titles
        </ButtonLink>
      </div>
    </Container>
  );
}
