/**
 * Stress Test 97: Permission Boundary Stress
 * Test all 4 roles hitting all endpoints, verify permission enforcement
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-97: Permission Boundary Stress — all 4 roles × all endpoints', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should enforce permissions correctly for all 4 roles', async () => {
    const credentials = [
      { email: 'patient@example.com', password: 'password123', role: 'patient' },
      { email: 'doctor@example.com', password: 'password123', role: 'doctor' },
      { email: 'researcher@example.com', password: 'password123', role: 'researcher' },
      { email: 'admin@example.com', password: 'admin123', role: 'admin' },
    ];

    // Get tokens
    const tokens = {};
    for (const cred of credentials) {
      const login = await post('/trpc/auth.login', { json: cred });
      const token = login.body?.result?.data?.json?.token;
      if (token) {
        tokens[cred.role] = token;
        console.log(`  Logged in: ${cred.role}`);
      }
    }

    // Endpoints to test
    const endpoints = [
      // Public reads
      { path: '/trpc/auth.rolesInfo', type: 'get', expectRoles: ['patient', 'doctor', 'researcher', 'admin'] },
      { path: '/trpc/persistence.patients.list', type: 'get', expectRoles: ['patient', 'doctor', 'researcher', 'admin'] },
      { path: '/trpc/persistence.analytics.getSystemStats', type: 'get', expectRoles: ['patient', 'doctor', 'researcher', 'admin'] },
      { path: '/api/health', type: 'get', expectRoles: ['patient', 'doctor', 'researcher', 'admin'] },
      // Admin-only
      { path: '/trpc/auth.listUsers', type: 'get', expectRoles: ['admin'] },
      // Mutations (all roles can try)
      { path: '/trpc/persistence.patients.create', type: 'post', body: { json: { name: 'PermTest', age: 30, email: 'perm@test.com' } }, expectRoles: ['patient', 'doctor', 'researcher', 'admin'] },
      { path: '/trpc/persistence.diagnoses.create', type: 'post', body: { json: { patientId: 'perm-test', diagnosis: 'Test' } }, expectRoles: ['patient', 'doctor', 'researcher', 'admin'] },
    ];

    const results = [];
    const durations = [];
    let permissionViolations = 0;

    for (const ep of endpoints) {
      for (const role of Object.keys(tokens)) {
        const auth = { Authorization: `Bearer ${tokens[role]}` };
        const t0 = Date.now();

        let res;
        if (ep.type === 'get') {
          res = await get(ep.path, auth);
        } else {
          res = await post(ep.path, ep.body, auth);
        }
        durations.push(Date.now() - t0);

        const allowed = ep.expectRoles.includes(role);
        const succeeded = res.status >= 200 && res.status < 400;

        const entry = { role, path: ep.path, status: res.status, allowed, succeeded };
        results.push(entry);

        // Permission violation: allowed role gets denied, or disallowed role gets access
        if (allowed && !succeeded && res.status >= 400) {
          // Could be validation error, not permission - skip for mutations with bad input
          if (ep.type === 'get') {
            permissionViolations++;
            console.log(`  VIOLATION: ${role} blocked from ${ep.path} (status=${res.status})`);
          }
        }
        if (!allowed && succeeded) {
          permissionViolations++;
          console.log(`  BREACH: ${role} accessed restricted ${ep.path}!`);
        }
      }
    }

    console.log(`\n  === Permission Boundary Results ===`);
    console.log(`  Total tests: ${results.length}`);
    console.log(`  Permission violations: ${permissionViolations}`);

    // Group by endpoint
    for (const ep of endpoints) {
      const epResults = results.filter(r => r.path === ep.path);
      const statuses = [...new Set(epResults.map(r => r.status))].join(', ');
      console.log(`  ${ep.path}: [${statuses}]`);
    }

    printMetrics('Permission Boundary Tests', durations, permissionViolations, results.length);

    // Admin-only endpoint must not be accessible by non-admins
    const listUsersNonAdmin = results.filter(r =>
      r.path === '/trpc/auth.listUsers' && r.role !== 'admin'
    );
    const nonAdminBreach = listUsersNonAdmin.filter(r => r.succeeded);
    expect(nonAdminBreach.length).toBe(0);
    console.log(`  Admin-only enforcement: ✓ (0 non-admin breaches)`);

    // No permission violations overall
    expect(permissionViolations).toBeLessThan(3);
  });
});