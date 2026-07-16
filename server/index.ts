import { router } from './trpc';
import { persistenceRouter } from './routers/persistence';
import { literatureRouter } from './routers/literature';
import { ragRouter } from './routers/rag';
import { boardRouter } from './routers/board';
import { telemedicineRouter } from './routers/telemedicine';
import { authRouter } from './routers/auth';
import { s3Router } from './routers/s3';

/**
 * Agregação de todos os routers tRPC
 * Define a estrutura da API tRPC
 */
export const appRouter = router({
  persistence: persistenceRouter,
  literature: literatureRouter,
  rag: ragRouter,
  board: boardRouter,
  telemedicine: telemedicineRouter,
  auth: authRouter,
  s3: s3Router,
});

export type AppRouter = typeof appRouter;