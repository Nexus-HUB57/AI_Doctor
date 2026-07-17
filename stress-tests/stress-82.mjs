/**
 * Stress Test 82: Simulated Doctor Workflow
 * 5 doctors: login → list patients → create diagnosis → create treatment → list treatments
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { post, get, startServer, stopServer, printMetrics, wait } from './helpers.mjs';

describe('STRESS-82: Doctor Workflow — 5 doctors full clinical workflow', { timeout: 120000 }, () => {
  beforeAll(async () => { await startServer(); }, 30000);
  afterAll(async () => { await stopServer(); }, 10000);

  it('should complete 5 doctor workflows: login → list → diagnose → treat → verify', async () => {
    // First create a shared patient for all doctors to work with
    const createP = await post('/trpc/persistence.patients.create', {
      json: { name: 'DoctorWorkflowPatient', age: 55, email: 'shared.doctor.patient@test.com' }
    });
    const patientId = createP.body?.result?.data?.json?.id;
    console.log(`  Shared patient ID: ${patientId}`);

    const doctors = [
      { email: 'doctor@example.com', password: 'password123' },
      { email: 'doctor1@test.com', password: 'password123' },
      { email: 'doctor2@test.com', password: 'password123' },
      { email: 'doctor3@test.com', password: 'password123' },
      { email: 'doctor4@test.com', password: 'password123' },
    ];

    // Register extra doctors
    for (let i = 1; i < doctors.length; i++) {
      await post('/trpc/auth.register', {
        json: { email: doctors[i].email, name: `Doctor${i}`, password: doctors[i].password, role: 'doctor' }
      });
    }

    const workflows = [];
    const allDurations = [];

    for (let d = 0; d < doctors.length; d++) {
      const wf = { doctor: d, steps: {}, token: null };
      const t0 = Date.now();

      // Step 1: Login
      const login = await post('/trpc/auth.login', { json: doctors[d] });
      wf.steps.login = { status: login.status };
      const token = login.body?.result?.data?.json?.token;
      if (token) {
        wf.token = token;
      }
      const auth = token ? { Authorization: `Bearer ${token}` } : {};

      // Step 2: List patients
      const listP = await get('/trpc/persistence.patients.list', auth);
      wf.steps.listPatients = { status: listP.status, count: Array.isArray(listP.body?.result?.data?.json) ? listP.body.result.data.json.length : 0 };

      // Step 3: Create diagnosis for shared patient
      const diag = await post('/trpc/persistence.diagnoses.create', {
        json: {
          patientId: patientId || `doc-patient-${d}`,
          diagnosis: `Doctor${d} diagnosis: NSCLC Stage IIIB`,
          tumorType: 'NSCLC',
          stage: 'IIIB',
        }
      }, auth);
      wf.steps.createDiagnosis = { status: diag.status };

      // Step 4: Create treatment
      const treat = await post('/trpc/persistence.treatments.create', {
        json: {
          patientId: patientId || `doc-patient-${d}`,
          type: d % 2 === 0 ? 'Immunotherapy' : 'Chemotherapy',
          startDate: new Date().toISOString(),
          status: 'active',
        }
      }, auth);
      wf.steps.createTreatment = { status: treat.status };

      // Step 5: Get patient diagnoses
      if (patientId) {
        const getDiag = await get(
          `/trpc/persistence.diagnoses.getByPatient?input=${encodeURIComponent(JSON.stringify({ patientId }))}`,
          auth
        );
        wf.steps.getDiagnoses = { status: getDiag.status };
      }

      // Step 6: Get treatments
      if (patientId) {
        const getTreat = await get(
          `/trpc/persistence.treatments.getByPatient?input=${encodeURIComponent(JSON.stringify({ patientId }))}`,
          auth
        );
        wf.steps.getTreatments = { status: getTreat.status };
      }

      const dur = Date.now() - t0;
      wf.totalDuration = dur;
      workflows.push(wf);
      allDurations.push(dur);
    }

    console.log('\n  === Doctor Workflow Results ===');
    for (const w of workflows) {
      console.log(`  Doctor ${w.doctor}: login=${w.steps.login.status} listP=${w.steps.listPatients?.status}(${w.steps.listPatients?.count}pts) diag=${w.steps.createDiagnosis?.status} treat=${w.steps.createTreatment?.status} (${w.totalDuration}ms)`);
    }

    printMetrics('Doctor Workflows', allDurations, 0, doctors.length);

    const fullySuccessful = workflows.filter(w =>
      w.steps.login.status === 200 &&
      w.steps.createDiagnosis?.status === 200 &&
      w.steps.createTreatment?.status === 200
    ).length;

    console.log(`  Fully successful workflows: ${fullySuccessful}/${doctors.length}`);
    expect(fullySuccessful).toBeGreaterThanOrEqual(4);
  });
});