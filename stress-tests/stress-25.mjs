import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post, get, latencyStats, wait } from './helpers.mjs';

describe('Stress 25: Analytics getSystemStats After Bulk Data', () => {
  beforeAll(async () => {
    await startServer();

    // Create bulk data to populate analytics
    // 20 patients
    for (let i = 0; i < 20; i++) {
      await post('/trpc/persistence.patients.create', {
        json: { name: `Analytics P${i}`, age: 30 + i, email: `s25-p${i}@test.com` },
      });
    }

    // 50 diagnoses
    for (let i = 0; i < 50; i++) {
      await post('/trpc/persistence.diagnoses.create', {
        json: {
          patientId: `patient_${Date.now() - (50 - i) * 100}`, // May or may not exist, that's ok
          diagnosis: `Stress Diagnosis ${i}`,
          tumorType: 'Test Tumor',
          stage: i % 4,
        },
      });
    }

    // 30 recommendations
    for (let i = 0; i < 30; i++) {
      await post('/trpc/persistence.recommendations.create', {
        json: {
          recommendation: `Recommendation ${i}: Consider immunotherapy trial`,
          confidenceScore: 0.7 + Math.random() * 0.3,
          interventions: ['Immunotherapy', 'Chemotherapy', 'Surgery'],
          source: 'Stress Test',
          status: 'pending',
        },
      });
    }

    await wait(500); // Let counters settle
  }, 60000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('calls getSystemStats 100 times after bulk data creation', async () => {
    const N = 100;
    const latencies = [];
    let validResponses = 0;
    let errors = 0;

    // Store first response for structure validation
    let firstResponse = null;

    for (let i = 0; i < N; i++) {
      const t0 = performance.now();
      try {
        const res = await get('/trpc/persistence.analytics.getSystemStats');
        latencies.push(performance.now() - t0);
        const data = res.body?.result?.data?.json;

        if (!firstResponse) firstResponse = data;

        if (data && typeof data.totalPatients === 'number' && typeof data.totalDiagnoses === 'number') {
          validResponses++;
        } else {
          errors++;
        }
      } catch {
        errors++;
      }
    }

    const stats = latencyStats(latencies);

    console.log(`\n  Analytics.getSystemStats ${N} calls:`);
    console.log(`  avg: ${stats.avg}ms | p50: ${stats.p50}ms | p95: ${stats.p95}ms | p99: ${stats.p99}ms`);
    console.log(`  valid: ${validResponses} | errors: ${errors}`);

    if (firstResponse) {
      console.log(`  First response: totalPatients=${firstResponse.totalPatients}, totalDiagnoses=${firstResponse.totalDiagnoses}, totalRecommendations=${firstResponse.totalRecommendations}`);
    }

    expect(validResponses).toBe(N);
    expect(errors).toBe(0);
    // Should be fast (in-memory stats)
    expect(parseFloat(stats.p95)).toBeLessThan(100);
  }, 120000);
});