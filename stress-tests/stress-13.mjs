import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, post } from './helpers.mjs';

describe('Stress 13: Auth Concurrent Registration Race Condition', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('sends 20 concurrent registrations with the same email', async () => {
    const EMAIL = 's13-race@test.com';
    const N = 20;

    const promises = Array.from({ length: N }, async () => {
      return post('/trpc/auth.register', {
        json: { email: EMAIL, name: 'Race User', password: 'password123', role: 'patient' },
      });
    });

    const results = await Promise.all(promises);

    let successes = 0;
    let duplicateErrors = 0;
    let serverErrors = 0;

    for (const res of results) {
      const data = res.body?.result?.data?.json;
      if (data?.success) {
        successes++;
      } else if (res.body?.error) {
        duplicateErrors++;
      } else if (res.status >= 500) {
        serverErrors++;
      } else {
        duplicateErrors++;
      }
    }

    console.log(`\n  Concurrent same-email registration ${N} requests:`);
    console.log(`  successes: ${successes} | duplicate_errors: ${duplicateErrors} | server_errors: ${serverErrors}`);

    // Exactly 1 should succeed, the rest should be duplicate errors
    expect(successes).toBe(1);
    expect(duplicateErrors).toBe(N - 1);
    expect(serverErrors).toBe(0);
  }, 60000);
});