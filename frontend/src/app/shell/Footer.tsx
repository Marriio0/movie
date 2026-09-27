import { Link } from 'react-router';
import { Logo } from '@/shared/components/Logo';
import { APP_NAME, APP_TAGLINE } from '@/shared/config/app';
import { paths } from '@/shared/config/paths';
import { Container } from '@/shared/ui/Container';
import { PRIMARY_NAV } from './nav-items';

const FOOTER_NAV = [...PRIMARY_NAV, { to: paths.search(), label: 'Search' }];

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas-deep">
      <Container>
        <div className="flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm text-pretty text-fg-muted">{APP_TAGLINE}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
              {FOOTER_NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-fg-muted transition-colors hover:text-fg">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* TMDB's API terms require this attribution. */}
        <div className="flex flex-col gap-2 border-t border-line py-6 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            This product uses the TMDB API but is not endorsed or certified by{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-fg"
            >
              TMDB
            </a>
            .
          </p>
          <p>
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </Container>
    </footer>
  );
}
