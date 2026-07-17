/**
 * Stress Test 31: Rate Limit AI Endpoints
 * 25 rapid POST /api/orchestrate — should hit the 20/min AI limit
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, reqId } from './helpers.mjs';

const TOTAL = 25;
const AI_LIMIT = 20;

describe('Stress Test 31: Rate Limit AI Endpoints — 25 rapid POST /api/orchestrate', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should return 429 after 20 AI orchestrate requests',
    { timeout: 60000 },
    async () => {
      const results = [];

      for (let i = 0; i < TOTAL; i++) {
        const res = await post(
          '/api/orchestrate',
          {
            sequence: 'AUGCGAUCGAUCGAU',
            agentName: 'TestAgent',
            agentRole: 'Stress Tester',
            customPrompt: 'Analyze',
          },
          { 'X-Request-ID': reqId() }
        );
        results.push({ status: res.status, duration: res.duration });
      }

      const ok200 = results.filter((r) => r.status === 200).length;
      const ok500 = results.filter((r) => r.status === 500).length; // Gemini may 500 without key
      const rateLimited = results.filter((r) => r.status === 429).length;

      console.log(`\n  [Stress-31] Total: ${TOTAL}`);
      console.log(`  [Stress-31] 200 OK: ${ok200}, 500 Error: ${ok500}, 429 RateLimited: ${rateLimited}`);

      const accepted = ok200 + ok500; // accepted by rate limiter (may fail for other reasons)
      console.log(`  [Stress-31] Accepted (not rate-limited): ${accepted}`);

      // After 20 requests, the AI limiter should kick in
      // Total accepted should not exceed AI_LIMIT
      expect(accepted).toBeLessThanOrEqual(AI_LIMIT);
      expect(rateLimited).toBeGreaterThan(0);

      const avgDuration = Math.round(
        results.filter((r) => r.status !== 429).reduce((a, r) => a + r.duration, 0) /
        Math.max(1, results.filter((r) => r.status !== 429).length)
      );
      console.log(`  [Stress-31] Avg duration (non-429): ${avgDuration}ms`);
    }
  );
});