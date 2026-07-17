import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { get, startServer, stopServer } from './helpers.mjs';

/**
 * Stress 56: CSP header absence (configured as false for nginx)
 * Category: Security Headers & Middleware
 *
 * Helmet is configured with contentSecurityPolicy: false because
 * CSP is managed by nginx in production. Verify the header is absent.
 */
describe('Stress-56: CSP header absence (nginx-managed)', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should NOT have Content-Security-Policy header on 50 requests', async () => {
    const N = 50;
    let cspPresentCount = 0;
    const statuses = [];

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const res = await get('/api/health');
      statuses.push(res.status);
      if (res.headers['content-security-policy']) {
        cspPresentCount++;
      }
    }

    const elapsed = Date.now() - start;

    console.log(`\n📊 Stress-56 Metrics:`);
    console.log(`  Requests: ${N}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  CSP header present (unexpected): ${cspPresentCount}`);
    console.log(`  CSP header absent (expected): ${N - cspPresentCount}`);

    // CSP should NOT be present (managed by nginx)
    expect(cspPresentCount).toBe(0);

    // All requests should succeed
    expect(statuses.every(s => s === 200)).toBe(true);
  });

  it('should NOT have Content-Security-Policy-Report-Only header', async () => {
    const N = 50;
    let reportOnlyCount = 0;

    for (let i = 0; i < N; i++) {
      const res = await get('/api/health');
      if (res.headers['content-security-policy-report-only']) {
        reportOnlyCount++;
      }
    }

    console.log(`\n📊 Stress-56 (Report-Only) Metrics:`);
    console.log(`  CSP-Report-Only present (unexpected): ${reportOnlyCount}`);

    expect(reportOnlyCount).toBe(0);
  });
});