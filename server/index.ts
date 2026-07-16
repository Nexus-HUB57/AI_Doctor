import { router } from './trpc';
import { persistenceRouter } from './routers/persistence';
import { literatureRouter } from './routers/literature';
import { ragRouter } from './routers/rag';
import { boardRouter } from './routers/board';
import { telemedicineRouter } from './routers/telemedicine';

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
});

export type AppRouter = typeof appRouter;
