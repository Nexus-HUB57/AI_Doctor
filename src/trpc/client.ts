import { createTRPCClient, httpBatchLink, TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import type { AppRouter } from '../../server/index';

/**
 * Error interceptor link: handles UNAUTHORIZED → auto-logout,
 * TOO_MANY_REQUESTS → user feedback, and logs all tRPC errors.
 */
function errorInterceptorLink(): TRPCLink<AppRouter> {
  return () =>
    ({ next, op }) =>
      observable((observer) => {
        const unsubscribe = next(op).subscribe({
          next(value) {
            observer.next(value);
          },
          error(err) {
            const error = err as any;
            const data = error?.data;

            // UNAUTHORIZED: auto-logout
            if (data?.code === 'UNAUTHORIZED' || error?.message?.includes('Não autenticado')) {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              // Trigger a soft reload to re-evaluate auth state
              window.dispatchEvent(new CustomEvent('auth:session-expired'));
            }

            // TOO_MANY_REQUESTS: show rate limit message
            if (data?.code === 'TOO_MANY_REQUESTS') {
              console.warn('[tRPC] Rate limit exceeded:', data?.message);
            }

            // Log all tRPC errors for debugging
            console.error(`[tRPC] ${op.type}.${String(op.path)}:`, error?.message || error);

            observer.error(err);
          },
          complete() {
            observer.complete();
          },
        });
        return unsubscribe;
      });
}

/**
 * Retry link: retries transient 5xx errors with exponential backoff.
 * Max 2 retries, starting at 1s delay, doubling each time.
 */
function retryLink(): TRPCLink<AppRouter> {
  const MAX_RETRIES = 2;
  const BASE_DELAY = 1000;

  return () =>
    ({ next, op }) =>
      observable((observer) => {
        let attempts = 0;

        function attempt() {
          const unsubscribe = next(op).subscribe({
            next(value) {
              observer.next(value);
            },
            error(err) {
              attempts++;
              const status = (err as any)?.data?.httpStatus || 0;
              const isRetryable = status >= 500 && status < 600;

              if (isRetryable && attempts <= MAX_RETRIES) {
                const delay = BASE_DELAY * Math.pow(2, attempts - 1);
                console.warn(`[tRPC] Retry ${attempts}/${MAX_RETRIES} for ${op.type}.${String(op.path)} in ${delay}ms`);
                setTimeout(attempt, delay);
              } else {
                observer.error(err);
              }
            },
            complete() {
              observer.complete();
            },
          });
          return unsubscribe;
        }

        return attempt();
      });
}

/**
 * Cliente tRPC para o frontend
 * Inclui automaticamente o token JWT Bearer em todas as requisições.
 * Possui error interceptor (auto-logout em 401) e retry com backoff (5xx).
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    errorInterceptorLink(),
    retryLink(),
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/trpc`,
      headers: () => {
        const token = localStorage.getItem('auth_token');
        return {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
});