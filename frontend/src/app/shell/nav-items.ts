import { paths } from '@/shared/config/paths';

export interface NavItem {
  to: string;
  label: string;
  /** Match the path exactly. Only Home needs this; the others stay active on child routes. */
  end?: boolean;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { to: paths.home, label: 'Home', end: true },
  { to: paths.movies, label: 'Movies' },
  { to: paths.series, label: 'Series' },
];
