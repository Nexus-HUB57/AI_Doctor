import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, get, latencyStats } from './helpers.mjs';

describe('Stress 05: Health Endpoint Response Schema Validation Under Load', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('validates health schema across 70 requests', async () => {
    const N = 70;
    const latencies = [];
    let schemaErrors = 0;
    let httpErrors = 0;

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await get('/api/health');
        latencies.push(performance.now() - t0);

        if (!res.ok) { httpErrors++; continue; }

        const body = res.body;
        // Validate schema
        if (body.status !== 'healthy') schemaErrors++;
        if (typeof body.uptime !== 'number') schemaErrors++;
        if (typeof body.version !== 'string') schemaErrors++;
        if (!body.memory || typeof body.memory.rss !== 'string') schemaErrors++;
        if (!body.timestamp) schemaErrors++;
        if (typeof body.environment !== 'string') schemaErrors++;
      } catch {
        httpErrors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Health schema validation ${N} requests:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms`);
    console.log(`  schema errors: ${schemaErrors} | http errors: ${httpErrors}`);

    expect(schemaErrors).toBe(0);
    expect(httpErrors).toBe(0);
    expect(latencies.length).toBe(N);
  }, 60000);
});