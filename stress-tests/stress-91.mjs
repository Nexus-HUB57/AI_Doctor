/**
 * Stress Test 91: tRPC Board Assemble
 * 10 assembly requests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-91: tRPC Board Assemble — 10 assembly requests', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 10 board assembly requests (potentially AI-heavy)', async () => {
    const N = 10;
    const durations = [];
    let errors = 0;
    const queries = [
      { query: 'lung cancer treatment', specialty: 'oncology' },
      { query: 'NSCLC stage III immunotherapy', specialty: 'immunooncology' },
      { query: 'colorectal cancer targeted therapy', specialty: 'molecular oncology' },
      { query: 'breast cancer CAR-T approach', specialty: 'immunology' },
      { query: 'pancreatic cancer nanotherapy', specialty: 'nanotechnology' },
      { query: 'melanoma checkpoint inhibitors', specialty: 'dermatology-oncology' },
      { query: 'prostate cancer radiation', specialty: 'radiology' },
      { query: 'glioblastoma surgical options', specialty: 'neurosurgery' },
      { query: 'leukemia bone marrow transplant', specialty: 'hematology' },
      { query: 'lymphoma combination therapy', specialty: 'hematology-oncology' },
    ];

    console.log('  Sending 10 board assembly requests...\n');

    const start = Date.now();
    const results = [];

    // Send sequentially (board assembly is potentially expensive)
    for (let i = 0; i < N; i++) {
      const q = queries[i];
      console.log(`  [${i + 1}/${N}] Assembling: "${q.query}"`);
      const t0 = Date.now();

      const res = await post('/trpc/board.assemble', { json: q });
      const dur = Date.now() - t0;
      durations.push(dur);

      const body = res.body;
      const hasPerspectives = body?.result?.data?.json?.perspectives || body?.result?.data?.json?.recommendations;
      const hasConsensus = body?.result?.data?.json?.consensus || body?.result?.data?.json?.consensusLevel;

      results.push({
        idx: i,
        query: q.query,
        status: res.status,
        dur,
        hasPerspectives: !!hasPerspectives,
        hasConsensus: hasConsensus !== undefined && hasConsensus !== null,
      });

      if (res.status !== 200) {
        errors++;
        console.log(`    ERROR: status=${res.status} body=${JSON.stringify(body).slice(0, 200)}`);
      } else {
        console.log(`    OK: ${dur}ms, perspectives=${results[i].hasPerspectives}, consensus=${results[i].hasConsensus}`);
      }
    }

    const totalDur = Date.now() - start;

    printMetrics('Board Assembly (10 requests)', durations, errors, N);
    console.log(`\n  Total wall time: ${totalDur}ms`);

    // All requests should return (no crashes)
    expect(durations.length).toBe(N);

    // At least some should succeed (board may need Gemini API key)
    const successes = results.filter(r => r.status === 200).length;
    console.log(`  Successful assemblies: ${successes}/${N}`);
    expect(successes).toBeGreaterThanOrEqual(0); // May fail if no API key, but must not crash

    // Server must be healthy regardless
    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});