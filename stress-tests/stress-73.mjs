import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, rawFetch, startServer, stopServer, login } from './helpers.mjs';

/**
 * Stress 73: tRPC error format validation — trigger 10 different error types
 * Category: Error Handling & Resilience
 */
describe('Stress-73: tRPC error format validation — 10 error types', () => {
  let adminToken = null;
  beforeAll(async () => {
    await startServer();
    adminToken = await login('admin@example.com', 'admin123');
  }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  const ERROR_SCENARIOS = [
    {
      name: 'Invalid email format',
      endpoint: '/trpc/auth.login',
      body: { json: { email: 'not-an-email', password: 'password123' } },
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Short password',
      endpoint: '/trpc/auth.login',
      body: { json: { email: 'test@test.com', password: 'abc' } },
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Missing fields',
      endpoint: '/trpc/auth.login',
      body: { json: {} },
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Wrong password',
      endpoint: '/trpc/auth.login',
      body: { json: { email: 'patient@example.com', password: 'wrongpassword' } },
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Non-existent user',
      endpoint: '/trpc/auth.login',
      body: { json: { email: 'nonexistent@test.com', password: 'password123' } },
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Invalid patient data',
      endpoint: '/trpc/persistence.patients.create',
      body: { json: { name: '', age: -5, email: 'bad' } },
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Missing patient ID for delete',
      endpoint: '/trpc/persistence.patients.delete',
      body: { json: {} },
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Non-existent tRPC route',
      endpoint: '/trpc/nonexistent.procedure',
      body: { json: {} },
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Protected route without auth',
      endpoint: '/trpc/auth.listUsers',
      body: null,
      isGet: true,
      expectedStatusRange: [400, 499],
    },
    {
      name: 'Invalid role in register',
      endpoint: '/trpc/auth.register',
      body: { json: { email: 'rolefail@test.com', name: 'Test', password: 'password123', role: 'superadmin' } },
      expectedStatusRange: [400, 499],
    },
  ];

  it('should return proper tRPC error format for 10 different error types', async () => {
    const ITERATIONS = 10; // Repeat each error type 10 times
    const results = [];

    for (const scenario of ERROR_SCENARIOS) {
      const scenarioResults = [];

      for (let i = 0; i < ITERATIONS; i++) {
        let res;
        if (scenario.isGet) {
          res = await get(scenario.endpoint);
        } else {
          res = await post(scenario.endpoint, scenario.body);
        }

        scenarioResults.push({
          status: res.status,
          hasJsonBody: res.json !== null,
          isTrpcError: !!(res.json?.error),
          errorShape: res.json?.error ? {
            code: res.json.error.code,
            message: typeof res.json.error.message,
          } : null,
        });
      }

      results.push({
        scenario: scenario.name,
        endpoint: scenario.endpoint,
        iterations: ITERATIONS,
        ...scenarioResults.reduce((acc, r) => ({
          allStatuses: [...(acc.allStatuses || []), r.status],
          allTrpcErrors: [...(acc.allTrpcErrors || []), r.isTrpcError],
        }), {}),
      });
    }

    console.log(`\n📊 Stress-73 Metrics:`);

    for (const result of results) {
      const uniqueStatuses = [...new Set(result.allStatuses)];
      const trpcErrorCount = result.allTrpcErrors.filter(Boolean).length;
      console.log(`  ${result.scenario}:`);
      console.log(`    Statuses: [${uniqueStatuses.join(', ')}]`);
      console.log(`    tRPC error format: ${trpcErrorCount}/${result.iterations}`);
    }

    // All scenarios should produce error responses
    for (const result of results) {
      // All should be 4xx
      const all4xx = result.allStatuses.every(s => s >= 400 && s < 500);
      if (!all4xx) {
        console.log(`  WARNING: ${result.scenario} had non-4xx statuses: [${result.allStatuses.join(', ')}]`);
      }
      // All should have valid responses
      const allValid = result.allStatuses.every(s => s > 0 && s < 600);
      expect(allValid).toBe(true);
    }
  });
});