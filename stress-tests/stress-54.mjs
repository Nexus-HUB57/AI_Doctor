import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 54: X-Request-ID presence and uniqueness across 200 requests
 * Category: Security Headers & Middleware
 */
describe('Stress-54: X-Request-ID presence and uniqueness', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should have unique X-Request-ID headers across 200 requests', async () => {
    const N = 200;
    const ids = [];
    let missingCount = 0;
    let duplicateCount = 0;

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const res = await get('/api/health');
      const reqId = res.headers['x-request-id'];

      if (!reqId) {
        missingCount++;
      } else if (ids.includes(reqId)) {
        duplicateCount++;
      } else {
        ids.push(reqId);
      }
    }

    const elapsed = Date.now() - start;
    const avgMs = (elapsed / N).toFixed(1);

    console.log(`\n📊 Stress-54 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg per request: ${avgMs}ms`);
    console.log(`  Missing X-Request-ID: ${missingCount}`);
    console.log(`  Duplicate IDs: ${duplicateCount}`);
    console.log(`  Unique IDs: ${ids.length}/${N}`);
    console.log(`  Sample IDs: ${ids.slice(0, 3).join(', ')}`);

    // All requests should have an X-Request-ID
    expect(missingCount).toBe(0);

    // No duplicates allowed
    expect(duplicateCount).toBe(0);

    // All IDs should be unique
    expect(ids.length).toBe(N);
  });
});