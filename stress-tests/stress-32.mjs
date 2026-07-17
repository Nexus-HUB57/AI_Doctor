/**
 * Stress Test 32: Rate Limit Mixed Endpoints
 * Interleave AI and general requests to verify separate limiters
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, post, reqId } from './helpers.mjs';

describe('Stress Test 32: Rate Limit Mixed — interleaved AI and general requests', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should apply AI limiter to AI endpoints independently from general limiter',
    { timeout: 60000 },
    async () => {
      const stats = { general: { ok: 0, limited: 0 }, ai: { ok: 0, limited: 0, error: 0 } };

      // Interleave: 25 AI requests mixed with 25 general requests
      for (let i = 0; i < 25; i++) {
        // AI request
        const aiRes = await post(
          '/api/orchestrate',
          { sequence: 'AUCG', agentName: 'A', agentRole: 'R' },
          { 'X-Request-ID': reqId() }
        );
        if (aiRes.status === 200) stats.ai.ok++;
        else if (aiRes.status === 429) stats.ai.limited++;
        else stats.ai.error++;

        // General request
        const genRes = await get('/api/health', { 'X-Request-ID': reqId() });
        if (genRes.status === 200) stats.general.ok++;
        else if (genRes.status === 429) stats.general.limited++;
      }

      console.log(`\n  [Stress-32] General endpoint: OK=${stats.general.ok}, 429=${stats.general.limited}`);
      console.log(`  [Stress-32] AI endpoint: OK=${stats.ai.ok}, 429=${stats.ai.limited}, Err=${stats.ai.error}`);

      // General limiter (100/15min): 25 requests should all pass
      expect(stats.general.ok).toBe(25);
      expect(stats.general.limited).toBe(0);

      // AI limiter (20/min): 25 requests, so at least 5 should be rate limited
      const aiAccepted = stats.ai.ok + stats.ai.error;
      expect(aiAccepted).toBeLessThanOrEqual(20);
      expect(stats.ai.limited).toBeGreaterThanOrEqual(5);
    }
  );
});