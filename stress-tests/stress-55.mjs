import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, rawFetch, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 55: Security headers on error responses (404, 500)
 * Category: Security Headers & Middleware
 */
describe('Stress-55: Security headers on error responses', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  const EXPECTED_HEADERS = [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
  ];

  it('should have security headers on 404 error responses', async () => {
    const N = 50;
    const missingCounts = {};
    EXPECTED_HEADERS.forEach(h => { missingCounts[h] = 0; });
    const statuses = [];

    for (let i = 0; i < N; i++) {
      const res = await get(`/api/nonexistent-endpoint-${i}`);
      statuses.push(res.status);
      for (const h of EXPECTED_HEADERS) {
        if (!res.headers[h]) missingCounts[h]++;
      }
    }

    console.log(`\n📊 Stress-55 (404) Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Status 404 count: ${statuses.filter(s => s === 404).length}`);
    for (const [h, count] of Object.entries(missingCounts)) {
      console.log(`  ${h}: missing in ${count}/${N}`);
    }

    // All should be 404
    expect(statuses.every(s => s === 404)).toBe(true);

    // Security headers should still be present
    for (const h of EXPECTED_HEADERS) {
      expect(missingCounts[h]).toBe(0);
    }
  });

  it('should have security headers on tRPC error responses', async () => {
    const N = 50;
    const missingCounts = {};
    EXPECTED_HEADERS.forEach(h => { missingCounts[h] = 0; });
    const statuses = [];

    // Trigger tRPC errors with invalid input
    for (let i = 0; i < N; i++) {
      const res = await rawFetch('/trpc/auth.login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: { email: 'not-an-email', password: 'short' } }),
      });
      statuses.push(res.status);
      for (const h of EXPECTED_HEADERS) {
        if (!res.headers[h]) missingCounts[h]++;
      }
    }

    console.log(`\n📊 Stress-55 (tRPC error) Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Status distribution: ${[...new Set(statuses)].join(', ')}`);
    for (const [h, count] of Object.entries(missingCounts)) {
      console.log(`  ${h}: missing in ${count}/${N}`);
    }

    // All should be error status
    expect(statuses.every(s => s >= 400)).toBe(true);

    // Security headers should be present even on errors
    for (const h of EXPECTED_HEADERS) {
      expect(missingCounts[h]).toBe(0);
    }
  });
});