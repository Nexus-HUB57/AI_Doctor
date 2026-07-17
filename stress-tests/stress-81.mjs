/**
 * Stress Test 81: Simulated User Journey
 * 10 users: register → login → create patient → create diagnosis → get patient
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, makePatient, printMetrics, wait } from './helpers.mjs';

describe('STRESS-81: Simulated User Journey — 10 users full lifecycle', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should complete 10 user journeys: register → login → create patient → diagnosis → get', async () => {
    const NUM_USERS = 10;
    const journeys = [];
    const allDurations = [];

    for (let u = 0; u < NUM_USERS; u++) {
      const journey = { user: u, steps: {}, token: null, patientId: null };
      const t0 = Date.now();

      // Step 1: Register
      const regBody = { json: { email: `journey.user.${u}@test.com`, name: `JourneyUser${u}`, password: 'password123', role: 'patient' } };
      const reg = await post('/trpc/auth.register', regBody);
      journey.steps.register = { status: reg.status, dur: reg.duration };
      if (reg.body?.result?.data?.json?.token) journey.token = reg.body.result.data.json.token;

      // Step 2: Login
      const login = await post('/trpc/auth.login', { json: { email: `journey.user.${u}@test.com`, password: 'password123' } });
      journey.steps.login = { status: login.status, dur: login.duration };
      if (login.body?.result?.data?.json?.token) journey.token = login.body.result.data.json.token;

      // Step 3: Create patient
      const patient = makePatient(u);
      const authHeaders = journey.token ? { Authorization: `Bearer ${journey.token}` } : {};
      const createP = await post('/trpc/persistence.patients.create', { json: patient }, authHeaders);
      journey.steps.createPatient = { status: createP.status, dur: createP.duration };
      if (createP.body?.result?.data?.json?.id) {
        journey.patientId = createP.body.result.data.json.id;
      }

      // Step 4: Create diagnosis
      if (journey.patientId) {
        const diag = await post('/trpc/persistence.diagnoses.create', {
          json: {
            patientId: journey.patientId,
            diagnosis: 'Non-Small Cell Lung Cancer',
            tumorType: 'NSCLC',
            stage: 'IIIA',
          }
        }, authHeaders);
        journey.steps.createDiagnosis = { status: diag.status, dur: diag.duration };
      } else {
        journey.steps.createDiagnosis = { status: 'skipped', dur: 0 };
      }

      // Step 5: Get patient
      if (journey.patientId) {
        const getP = await get(`/trpc/persistence.patients.getById?input=${encodeURIComponent(JSON.stringify({ patientId: journey.patientId }))}`, authHeaders);
        journey.steps.getPatient = { status: getP.status, dur: getP.duration };
      } else {
        journey.steps.getPatient = { status: 'skipped', dur: 0 };
      }

      const totalDur = Date.now() - t0;
      journey.totalDuration = totalDur;
      journeys.push(journey);
      allDurations.push(totalDur);
    }

    // Print journey results
    console.log('\n  === User Journey Results ===');
    for (const j of journeys) {
      const regOk = j.steps.register.status === 200 ? '✓' : '✗';
      const loginOk = j.steps.login.status === 200 ? '✓' : '✗';
      const createOk = j.steps.createPatient.status === 200 ? '✓' : '✗';
      const diagOk = j.steps.createDiagnosis.status === 200 ? '✓' : (j.steps.createDiagnosis.status === 'skipped' ? '⊘' : '✗');
      const getOk = j.steps.getPatient.status === 200 ? '✓' : (j.steps.getPatient.status === 'skipped' ? '⊘' : '✗');
      console.log(`  User ${j.user}: reg=${regOk} login=${loginOk} createP=${createOk} diag=${diagOk} getP=${getOk} (${j.totalDuration}ms)`);
    }

    printMetrics('User Journeys (5-step)', allDurations, 0, NUM_USERS);

    const successfulJourneys = journeys.filter(j =>
      j.steps.register.status === 200 &&
      j.steps.login.status === 200 &&
      j.steps.createPatient.status === 200 &&
      j.steps.createDiagnosis.status === 200
    ).length;

    console.log(`  Fully successful journeys: ${successfulJourneys}/${NUM_USERS}`);
    expect(successfulJourneys).toBeGreaterThanOrEqual(8);
  });
});