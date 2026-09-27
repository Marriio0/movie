import '@tanstack/react-query';
import type { ApiError } from './api-error';

// Every queryFn goes through the API layer, which only throws ApiError
// (catalog.api.ts normalizes mapping failures too), so query errors are typed as ApiError.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
  }
}
