/**
 * Stress Test 28: Rate Limit Reset Timing
 * Hit limit, wait briefly, verify 429 persists (15-min window is long)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, wait, reqId } from './helpers.mjs';

const BURST_COUNT = 105;

describe('Stress Test 28: Rate Limit Reset Timing — verify 429 persists after burst', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should still return 429 a few seconds after exhausting the rate limit',
    { timeout: 60000 },
    async () => {
      // Phase 1: Exhaust the rate limit
      const phase1 = [];
      for (let i = 0; i < BURST_COUNT; i++) {
        const res = await get('/api/health', { 'X-Request-ID': reqId() });
        phase1.push(res.status);
      }

      const phase1Ok = phase1.filter((s) => s === 200).length;
      const phase1Limited = phase1.filter((s) => s === 429).length;
      console.log(`  [Stress-28] Phase 1: ${BURST_COUNT} requests — OK: ${phase1Ok}, 429: ${phase1Limited}`);

      // Confirm we got rate limited
      expect(phase1Limited).toBeGreaterThan(0);

      // Phase 2: Wait 3 seconds and try again
      await wait(3000);

      const phase2 = [];
      for (let i = 0; i < 10; i++) {
        const res = await get('/api/health', { 'X-Request-ID': reqId() });
        phase2.push(res.status);
      }

      const phase2Ok = phase2.filter((s) => s === 200).length;
      const phase2Limited = phase2.filter((s) => s === 429).length;
      console.log(`  [Stress-28] Phase 2 (after 3s): 10 requests — OK: ${phase2Ok}, 429: ${phase2Limited}`);

      // The window is 15 minutes, so 429 should still appear
      expect(phase2Limited).toBeGreaterThan(0);
    }
  );
});