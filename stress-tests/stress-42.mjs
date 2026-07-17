/**
 * Stress Test 42: tRPC Multiple Routers in Parallel
 * auth, persistence, and board stats queried simultaneously
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, reqId } from './helpers.mjs';

const ROUNDS = 50;

describe('Stress Test 42: tRPC Multiple Routers in Parallel', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should handle 50 rounds of parallel requests to auth, persistence, and board routers',
    { timeout: 60000 },
    async () => {
      const start = Date.now();
      const stats = {
        auth: { ok: 0, fail: 0, durations: [] },
        persistence: { ok: 0, fail: 0, durations: [] },
        board: { ok: 0, fail: 0, durations: [] },
      };

      for (let i = 0; i < ROUNDS; i++) {
        const [authRes, persRes, boardRes] = await Promise.all([
          get('/trpc/auth.rolesInfo', { 'X-Request-ID': reqId() }),
          get('/trpc/persistence.analytics.getSystemStats', { 'X-Request-ID': reqId() }),
          get('/trpc/persistence.analytics.getSystemHealth', { 'X-Request-ID': reqId() }),
        ]);

        // Auth
        if (authRes.ok) stats.auth.ok++; else stats.auth.fail++;
        stats.auth.durations.push(authRes.duration);

        // Persistence
        if (persRes.ok) stats.persistence.ok++; else stats.persistence.fail++;
        stats.persistence.durations.push(persRes.duration);

        // Board (system health)
        if (boardRes.ok) stats.board.ok++; else stats.board.fail++;
        stats.board.durations.push(boardRes.duration);
      }

      const elapsed = Date.now() - start;
      const totalRequests = ROUNDS * 3;
      const totalOk = stats.auth.ok + stats.persistence.ok + stats.board.ok;

      console.log(`\n  [Stress-42] Rounds: ${ROUNDS}, Total requests: ${totalRequests}, Elapsed: ${elapsed}ms`);
      console.log(`  [Stress-42] Auth: ${stats.auth.ok}/${ROUNDS} OK, avg ${avg(stats.auth.durations)}ms`);
      console.log(`  [Stress-42] Persistence: ${stats.persistence.ok}/${ROUNDS} OK, avg ${avg(stats.persistence.durations)}ms`);
      console.log(`  [Stress-42] Board: ${stats.board.ok}/${ROUNDS} OK, avg ${avg(stats.board.durations)}ms`);
      console.log(`  [Stress-42] Total OK: ${totalOk}/${totalRequests}, Throughput: ${Math.round(totalRequests / (elapsed / 1000))} req/s`);

      // Most should succeed
      expect(totalOk).toBeGreaterThan(totalRequests * 0.9);
    }
  );
});

function avg(arr) {
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}