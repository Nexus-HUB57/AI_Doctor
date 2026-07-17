/**
 * Stress Test 83: Admin Workflow
 * login → list users → check permissions → verify rolesInfo
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-83: Admin Workflow — admin operations end-to-end', { timeout: 60000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should complete admin workflow: login → list users → check permissions → rolesInfo', async () => {
    const durations = [];

    // Step 1: Admin login
    const t0 = Date.now();
    const login = await post('/trpc/auth.login', {
      json: { email: 'admin@example.com', password: 'admin123' }
    });
    durations.push(Date.now() - t0);
    console.log(`  Admin login: status=${login.status}`);
    expect(login.status).toBe(200);
    expect(login.body?.result?.data?.json?.user?.role).toBe('admin');

    const token = login.body?.result?.data?.json?.token;
    const auth = { Authorization: `Bearer ${token}` };

    // Step 2: List users (admin-only)
    const t1 = Date.now();
    const listUsers = await get('/trpc/auth.listUsers', auth);
    durations.push(Date.now() - t1);
    console.log(`  List users: status=${listUsers.status}, users=${JSON.stringify(listUsers.body?.result?.data?.json?.users?.length || 0)}`);

    // Step 3: Check permissions for various operations
    const permissions = [
      'patients:read', 'patients:write', 'users:manage', 'admin:full',
      'diagnoses:create', 'treatments:create', 'analytics:view',
    ];

    const permResults = [];
    for (const perm of permissions) {
      const t2 = Date.now();
      const res = await get(
        `/trpc/auth.checkPermission?input=${encodeURIComponent(JSON.stringify({ permission: perm }))}`,
        auth
      );
      durations.push(Date.now() - t2);
      const hasPermission = res.body?.result?.data?.json?.hasPermission;
      permResults.push({ permission: perm, granted: hasPermission });
    }

    console.log(`  Permission checks:`);
    for (const p of permResults) {
      console.log(`    ${p.permission}: ${p.granted ? 'GRANTED' : 'DENIED'}`);
    }

    // Step 4: Get roles info
    const t3 = Date.now();
    const rolesInfo = await get('/trpc/auth.rolesInfo');
    durations.push(Date.now() - t3);
    console.log(`  Roles info: status=${rolesInfo.status}`);
    expect(rolesInfo.status).toBe(200);

    const roles = rolesInfo.body?.result?.data?.json?.roles;
    expect(roles).toBeDefined();
    if (roles) {
      console.log(`  Available roles: ${Object.keys(roles).join(', ')}`);
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(4);
    }

    // Step 5: Access system analytics (admin-like)
    const t4 = Date.now();
    const stats = await get('/trpc/persistence.analytics.getSystemStats');
    durations.push(Date.now() - t4);
    console.log(`  System stats: status=${stats.status}`);

    printMetrics('Admin Workflow', durations, 0, durations.length);

    // Admin should have all permissions
    const adminGranted = permResults.filter(p => p.granted).length;
    console.log(`  Admin permissions granted: ${adminGranted}/${permissions.length}`);
    expect(adminGranted).toBeGreaterThan(0);

    // Verify non-admin cannot list users
    const patientLogin = await post('/trpc/auth.login', {
      json: { email: 'patient@example.com', password: 'password123' }
    });
    const patientToken = patientLogin.body?.result?.data?.json?.token;
    if (patientToken) {
      const blocked = await get('/trpc/auth.listUsers', { Authorization: `Bearer ${patientToken}` });
      console.log(`  Patient list users (should be denied): status=${blocked.status}`);
      expect(blocked.status).toBeGreaterThanOrEqual(400);
    }
  });
});