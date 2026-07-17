/**
 * Stress Test 89: Telemedicine Chat Simulation
 * 50 sequential chat sends via REST telemedicine endpoints
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-89: Telemedicine Chat Simulation — 50 sequential messages', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should handle 50 sequential telemedicine chat messages', async () => {
    const N = 50;
    const durations = [];
    let errors = 0;
    const responses = [];

    const messages = [
      'Olá, preciso de ajuda com meu tratamento.',
      'Estou sentindo muito cansaço lately.',
      'O médico disse que meu tumor respondeu bem à imunoterapia.',
      'Tenho medo dos efeitos colaterais da quimioterapia.',
      'Qual a probabilidade de recidiva?',
      'Posso fazer exercícios durante o tratamento?',
      'Meus exames de sangue mostram melhora.',
      'A radioterapia vai afetar minha qualidade de vida?',
      'Quero saber mais sobre nanotecnologia para câncer.',
      'Como estão meus marcadores tumorais?',
    ];

    // Create a session first
    const session = await post('/trpc/telemedicine.support.createSession', { json: { patientId: 'chat-stress-patient' } });
    console.log(`  Session created: status=${session.status}`);
    const sessionId = session.body?.result?.data?.json?.sessionId || 'stress-session';

    const start = Date.now();

    for (let i = 0; i < N; i++) {
      const t0 = Date.now();
      const res = await post('/trpc/telemedicine.chat.send', {
        json: {
          patientId: `chat-patient-${i}`,
          role: 'patient',
          content: messages[i % messages.length],
        }
      });
      const dur = Date.now() - t0;
      durations.push(dur);

      const content = res.body?.result?.data?.json?.content;
      responses.push({ idx: i, status: res.status, dur, hasResponse: !!content });

      if (res.status !== 200) errors++;
    }

    const totalDur = Date.now() - start;

    printMetrics('Telemedicine Chat (50 sequential)', durations, errors, N);
    console.log(`  Total wall time: ${totalDur}ms`);
    console.log(`  Messages with AI response: ${responses.filter(r => r.hasResponse).length}/${N}`);

    // Check response quality
    const withResponse = responses.filter(r => r.hasResponse).length;
    console.log(`  Response rate: ${(withResponse / N * 100).toFixed(1)}%`);

    expect(errors).toBe(0);
    expect(withResponse).toBe(N); // All should get a response

    // End session
    const endSession = await post('/trpc/telemedicine.support.endSession', { json: { sessionId } });
    console.log(`  Session ended: status=${endSession.status}`);
  });
});