import { Download, Film, Home, Search, Tv } from 'lucide-react';
import { NavLink } from 'react-router';
import { paths } from '@/shared/config/paths';
import { cn } from '@/shared/lib/cn';
import { useState } from 'react';
import { InstallModal } from '@/shared/components/InstallModal';
import { usePwaInstall } from '@/shared/hooks/usePwaInstall';
import { useLanguage } from '@/shared/i18n/language-context';

export function MobileBottomNav() {
  const { t } = useLanguage();
  const [installOpen, setInstallOpen] = useState(false);
  const { isInstallable, installApp } = usePwaInstall();

  const navItems = [
    { to: paths.home, label: t('home') || 'Home', icon: Home, end: true },
    { to: paths.search(), label: t('search') || 'Search', icon: Search },
    { to: paths.movies, label: t('movies') || 'Movies', icon: Film },
    { to: paths.series, label: t('series') || 'Series', icon: Tv },
  ];

  return (
    <>
      <nav
        aria-label="Mobile Navigation"
        className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t border-line/80 bg-canvas/92 backdrop-blur-xl supports-backdrop-filter:bg-canvas/80 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 transition-all shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
      >
        <ul className="flex items-center justify-around px-2">
          {navItems.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'text-accent font-semibold scale-105'
                      : 'text-fg-muted hover:text-fg',
                  )
                }
              >
                {({ isActive }) => {
                  const Icon = item.icon;
                  return (
                    <>
                      <div className="relative">
                        <Icon className={cn('size-5', isActive && 'stroke-[2.5] text-accent')} />
                        {isActive && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-accent" />
                        )}
                      </div>
                      <span>{item.label}</span>
                    </>
                  );
                }}
              </NavLink>
            </li>
          ))}

          {/* App / APK Download Tab */}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setInstallOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <div className="relative">
                <div className="flex size-5 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
                  <Download className="size-3.5" />
                </div>
                <span className="absolute -top-1.5 -right-2 rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-black leading-tight">
                  APK
                </span>
              </div>
              <span className="font-semibold">App</span>
            </button>
          </li>
        </ul>
      </nav>

      <InstallModal
        isOpen={installOpen}
        onClose={() => setInstallOpen(false)}
        canPromptNative={isInstallable}
        onInstallNative={installApp}
      />
    </>
  );
}
