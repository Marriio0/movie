import { Outlet, ScrollRestoration } from 'react-router';
import { NavigationProgress } from '../shell/NavigationProgress';
import { OfflineBanner } from '../shell/OfflineBanner';

/** Top-level route element: things every screen needs, whatever its layout. */
export function RootShell() {
  return (
    <>
      <NavigationProgress />
      <Outlet />
      <ScrollRestoration />
      <OfflineBanner />
    </>
  );
}
