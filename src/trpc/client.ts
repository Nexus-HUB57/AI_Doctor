import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/index';

/**
 * Cliente tRPC para o frontend
 * Fornece acesso tipado aos procedimentos do backend
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/trpc`,
      // Opcional: adicionar headers customizados
      headers: () => ({
        // Adicionar token de autenticação aqui se necessário
      }),
    }),
  ],
});
