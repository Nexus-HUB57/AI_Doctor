import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, wait } from './helpers.mjs';

/**
 * Stress 66: Memory growth under rapid register/login cycles (50 cycles)
 * Category: Memory Leak & Sustained Load
 */
describe('Stress-66: Memory growth under rapid register/login cycles', () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should not leak memory across 50 register+login cycles', async () => {
    const CYCLES = 50;
    const memorySnapshots = [];
    const results = { registerOk: 0, registerDup: 0, loginOk: 0, loginFail: 0 };

    const start = Date.now();

    for (let i = 0; i < CYCLES; i++) {
      // Register with unique email
      const regRes = await post('/trpc/auth.register', {
        json: {
          email: `cycle${i}_${Date.now()}@stress.test`,
          name: `Cycle User ${i}`,
          password: 'password123',
          role: 'patient',
        },
      });

      if (regRes.status === 200) {
        results.registerOk++;
      } else {
        results.registerDup++;
      }

      // Login with seed user
      const loginRes = await post('/trpc/auth.login', {
        json: { email: 'patient@example.com', password: 'password123' },
      });

      if (loginRes.status === 200) {
        results.loginOk++;
      } else {
        results.loginFail++;
      }

      // Memory snapshot every 10 cycles
      if ((i + 1) % 10 === 0) {
        const health = await get('/api/health');
        const memMB = health.json?.memory?.heapUsed;
        memorySnapshots.push({ cycle: i + 1, heapUsed: memMB });
      }
    }

    const elapsed = Date.now() - start;

    console.log(`\n📊 Stress-66 Metrics:`);
    console.log(`  Cycles: ${CYCLES}`);
    console.log(`  Registers OK: ${results.registerOk}`);
    console.log(`  Logins OK: ${results.loginOk}`);
    console.log(`  Total time: ${elapsed}ms`);
    console.log(`  Avg per cycle: ${(elapsed / CYCLES).toFixed(1)}ms`);
    console.log(`  Memory snapshots:`);
    for (const snap of memorySnapshots) {
      console.log(`    Cycle ${snap.cycle}: ${snap.heapUsed}`);
    }

    // Memory growth analysis
    if (memorySnapshots.length >= 2) {
      const firstMB = parseFloat(memorySnapshots[0].heapUsed) || 0;
      const lastMB = parseFloat(memorySnapshots[memorySnapshots.length - 1].heapUsed) || 0;
      const growth = lastMB - firstMB;
      console.log(`  Memory growth (first→last): ${growth.toFixed(1)}MB`);

      if (firstMB > 0 && lastMB > 0) {
        // Growth per cycle
        const growthPerCycle = growth / CYCLES;
        console.log(`  Growth per cycle: ${growthPerCycle.toFixed(3)}MB`);
        // Should not grow more than 1MB per cycle
        expect(growthPerCycle).toBeLessThan(1);
      }
    }

    // Most logins should succeed
    expect(results.loginOk).toBeGreaterThan(CYCLES * 0.9);
  });
});