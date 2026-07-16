import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';

/**
 * Contexto do tRPC
 * Pode ser expandido para incluir informações de autenticação, banco de dados, etc.
 */
export const createContext = async () => {
  return {
    // Adicionar propriedades do contexto aqui
    // Ex: db, user, etc.
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Inicializar tRPC
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
