/**
 * Stress Test 90: tRPC Telemedicine Chat Send
 * 50 messages via tRPC telemedicine.chat.send with concurrency
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics, wait, concurrent } from './helpers.mjs';

describe('STRESS-90: tRPC Telemedicine Chat — 50 messages concurrent', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 50 concurrent tRPC chat.send requests', async () => {
    const N = 50;
    const durations = [];
    let errors = 0;
    let responsesWithContent = 0;

    const messages = [
      'Preciso de uma segunda opinião sobre meu diagnóstico.',
      'Quais são as opções de tratamento para NSCLC estágio III?',
      'A imunoterapia é indicada para o meu caso?',
      'Como funciona a terapia com células CAR-T?',
      'Quais biomarcadores devo monitorar?',
    ];

    const start = Date.now();

    const results = await Promise.all(
      Array.from({ length: N }, async (i) => {
        const t0 = Date.now();
        const res = await post('/trpc/telemedicine.chat.send', {
          json: {
            patientId: `trpc-chat-patient-${i}`,
            role: 'patient',
            content: messages[i % messages.length] + ` [msg ${i}]`,
          }
        });
        const dur = Date.now() - t0;
        durations.push(dur);

        const hasContent = !!res.body?.result?.data?.json?.content;
        if (hasContent) responsesWithContent++;
        if (res.status !== 200) errors++;

        return { idx: i, status: res.status, dur, hasContent };
      })
    );

    const totalDur = Date.now() - start;

    printMetrics('tRPC Chat Concurrent (50)', durations, errors, N);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Throughput: ${(N / (totalDur / 1000)).toFixed(1)} msg/s`);
    console.log(`  Responses with content: ${responsesWithContent}/${N}`);

    // All should succeed
    expect(errors).toBe(0);
    expect(responsesWithContent).toBe(N);

    // Server healthy
    const health = await get('/api/health');
    expect(health.status).toBe(200);
  });
});