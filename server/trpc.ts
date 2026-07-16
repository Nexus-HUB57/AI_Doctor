import { initTRPC } from '@trpc/server';
import { ZodError } from 'zod';
import type { IncomingMessage } from 'http';
import { authenticateRequest, JWTPayload } from './auth';

export interface CreateContextOptions {
  req?: IncomingMessage;
}

/**
 * Contexto do tRPC
 * Inclui informações de autenticação do usuário extraídas do JWT
 */
export const createContext = async (opts?: CreateContextOptions) => {
  let user: JWTPayload | null = null;

  if (opts?.req) {
    const authHeader = opts.req.headers['authorization'] as string | undefined;
    // Também suportar token via query param
    const url = opts.req.url || '';
    const urlObj = new URL(url, 'http://localhost');
    const queryToken = urlObj.searchParams.get('token') || undefined;
    user = await authenticateRequest(authHeader, queryToken);
  }

  return {
    user,
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

/**
 * Procedimento protegido que requer autenticação
 */
export const protectedProcedure = publicProcedure.use(
  middleware(async (opts) => {
    if (!opts.ctx.user) {
      throw new Error('Não autenticado. Faça login para continuar.');
    }
    return opts.next({
      ctx: {
        user: opts.ctx.user,
      },
    });
  })
);

/**
 * Procedimento que requer um papel específico
 */
export function roleProtectedProcedure(requiredRoles: string[]) {
  return publicProcedure.use(
    middleware(async (opts) => {
      if (!opts.ctx.user) {
        throw new Error('Não autenticado. Faça login para continuar.');
      }
      if (!requiredRoles.includes(opts.ctx.user.role)) {
        throw new Error('Acesso negado. Você não tem permissão para esta ação.');
      }
      return opts.next({
        ctx: {
          user: opts.ctx.user,
        },
      });
    })
  );
}