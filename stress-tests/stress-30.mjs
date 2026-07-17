/**
 * Stress Test 30: Rate Limit Headers
 * Verify X-RateLimit-* headers are present on /api/ responses
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, reqId } from './helpers.mjs';

describe('Stress Test 30: Rate Limit Headers — verify X-RateLimit-* headers', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it(
    'should include rate limit headers in responses',
    { timeout: 60000 },
    async () => {
      const res = await get('/api/health', { 'X-Request-ID': reqId() });

      console.log(`\n  [Stress-30] Response headers:`);
      Object.entries(res.headers).forEach(([k, v]) => {
        if (k.toLowerCase().includes('ratelimit') || k.toLowerCase().includes('limit') || k.toLowerCase().includes('retry')) {
          console.log(`    ${k}: ${v}`);
        }
      });

      // The server uses standardHeaders: true, so we expect:
      // RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
      const headerKeys = Object.keys(res.headers).map((k) => k.toLowerCase());

      // At least one rate limit header should be present (standard or legacy)
      const hasStandardHeader =
        headerKeys.includes('ratelimit-limit') ||
        headerKeys.includes('ratelimit-remaining') ||
        headerKeys.includes('ratelimit-reset');

      const hasLegacyHeader =
        headerKeys.includes('x-ratelimit-limit') ||
        headerKeys.includes('x-ratelimit-remaining') ||
        headerKeys.includes('x-ratelimit-reset');

      // server.ts sets legacyHeaders: false, so standard headers should be present
      console.log(`  [Stress-30] Has standard headers: ${hasStandardHeader}`);
      console.log(`  [Stress-30] Has legacy headers: ${hasLegacyHeader}`);
      console.log(`  [Stress-30] Status: ${res.status}`);

      // Response should be OK
      expect(res.status).toBe(200);

      // Check for standard rate limit headers
      expect(hasStandardHeader).toBe(true);
    }
  );
});