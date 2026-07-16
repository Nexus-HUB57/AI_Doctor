import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/index';

/**
 * Cliente tRPC para o frontend
 * Fornece acesso tipado aos procedimentos do backend
 * Inclui automaticamente o token JWT Bearer em todas as requisições
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
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