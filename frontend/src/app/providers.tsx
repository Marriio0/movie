import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { LanguageProvider } from '@/shared/i18n/language-context';
import { createQueryClient } from './query-client';

/** App-wide providers. The auth provider joins here in the authentication phase. */
export function AppProviders({ children }: { children: ReactNode }) {
  // Lazy state keeps one client per mounted app (stable across re-renders and StrictMode).
  const [queryClient] = useState(createQueryClient);
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </LanguageProvider>
  );
}
