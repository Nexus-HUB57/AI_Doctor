import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ZodError } from 'zod';

// Mock the db module to avoid drizzle-orm/mysql2 dependency
vi.mock('../../src/services/db', () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getAllPatients: vi.fn().mockResolvedValue([]),
  getPatientById: vi.fn().mockResolvedValue(null),
  createPatient: vi.fn().mockResolvedValue(undefined),
  upsertPatient: vi.fn().mockResolvedValue(undefined),
  createDiagnosis: vi.fn().mockResolvedValue(undefined),
  getDiagnosesByPatient: vi.fn().mockResolvedValue([]),
  createMutation: vi.fn().mockResolvedValue(undefined),
  getMutationsByPatient: vi.fn().mockResolvedValue([]),
  createBiomarker: vi.fn().mockResolvedValue(undefined),
  getBiomarkersByPatient: vi.fn().mockResolvedValue([]),
  createTreatment: vi.fn().mockResolvedValue(undefined),
  getTreatmentsByPatient: vi.fn().mockResolvedValue([]),
  createTreatmentRecommendation: vi.fn().mockResolvedValue(undefined),
  getRecommendationsByPatient: vi.fn().mockResolvedValue([]),
}));

import { persistenceRouter } from './persistence';

describe('Persistence Router', () => {
  let caller: ReturnType<typeof persistenceRouter.createCaller>;

  beforeEach(() => {
    caller = persistenceRouter.createCaller({});
  });

  // ─── Patients ───────────────────────────────────────────

  describe('patients.create', () => {
    it('should create a patient with valid data', async () => {
      const result = await caller.patients.create({
        name: 'Maria Santos',
        age: 52,
        email: 'maria@example.com',
        phone: '+5511999990000',
        medicalHistory: 'Diabetes tipo 2',
      });
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^patient_/);
      expect(result.name).toBe('Maria Santos');
      expect(result.age).toBe(52);
      expect(result.email).toBe('maria@example.com');
      expect(result.phone).toBe('+5511999990000');
      expect(result.medicalHistory).toBe('Diabetes tipo 2');
    });

    it('should throw ZodError for invalid email', async () => {
      await expect(
        caller.patients.create({
          name: 'Bad Email',
          age: 30,
          email: 'not-an-email',
        })
      ).rejects.toThrow();
    });

    it('should throw for missing required fields', async () => {
      await expect(
        caller.patients.create({} as any)
      ).rejects.toThrow();
    });
  });

  describe('patients.list', () => {
    it('should return an array', async () => {
      const result = await caller.patients.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('patients.getById', () => {
    it('should return a patient after creation', async () => {
      const created = await caller.patients.create({
        name: 'João Pereira',
        age: 40,
        email: 'joao.pereira@example.com',
      });
      const found = await caller.patients.getById({ patientId: created.id });
      expect(found).not.toBeNull();
      expect(found!.name).toBe('João Pereira');
    });

    it('should return null for non-existent patient', async () => {
      const found = await caller.patients.getById({ patientId: 'non_existent_id' });
      expect(found).toBeNull();
    });
  });

  describe('patients.update', () => {
    it('should modify an existing patient record', async () => {
      const created = await caller.patients.create({
        name: 'Ana Costa',
        age: 35,
        email: 'ana.costa@example.com',
      });
      const updated = await caller.patients.update({
        id: created.id,
        name: 'Ana Costa Silva',
        age: 36,
        email: 'ana.silva@example.com',
      });
      expect(updated.name).toBe('Ana Costa Silva');
      expect(updated.age).toBe(36);
      expect(updated.email).toBe('ana.silva@example.com');

      // Verify via getById
      const found = await caller.patients.getById({ patientId: created.id });
      expect(found!.name).toBe('Ana Costa Silva');
    });
  });

  describe('patients.delete', () => {
    it('should remove a patient record', async () => {
      const created = await caller.patients.create({
        name: 'To Delete',
        age: 60,
        email: 'delete@example.com',
      });
      const result = await caller.patients.delete({ patientId: created.id });
      expect(result).toEqual({ success: true });

      // Verify it's gone
      const found = await caller.patients.getById({ patientId: created.id });
      expect(found).toBeNull();
    });
  });

  // ─── Diagnoses ──────────────────────────────────────────

  describe('diagnoses.create', () => {
    it('should create a diagnosis with valid data', async () => {
      const result = await caller.diagnoses.create({
        patientId: 'patient_test_1',
        patientName: 'Test Patient',
        diagnosis: 'Carcinoma basocelular',
        tumorType: 'Melanoma',
        stage: 2,
        date: new Date('2024-06-01'),
        notes: 'Biópsia confirmada',
      });
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^diagnosis_/);
      expect(result.tumorType).toBe('Melanoma');
      expect(result.stage).toBe(2);
    });
  });

  describe('diagnoses.getByPatient', () => {
    it('should return an array of diagnoses for a patient', async () => {
      await caller.diagnoses.create({
        patientId: 'patient_diag_1',
        diagnosis: 'Diagnóstico A',
      });
      await caller.diagnoses.create({
        patientId: 'patient_diag_1',
        diagnosis: 'Diagnóstico B',
      });
      const results = await caller.diagnoses.getByPatient({ patientId: 'patient_diag_1' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Mutations ──────────────────────────────────────────

  describe('mutations.create', () => {
    it('should create a genetic mutation record', async () => {
      const result = await caller.mutations.create({
        patientId: 'patient_mut_1',
        gene: 'BRAF',
        mutationType: 'V600E',
        frequency: 0.45,
      });
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^mutation_/);
      expect(result.gene).toBe('BRAF');
      expect(result.mutationType).toBe('V600E');
    });
  });

  describe('mutations.getByPatient', () => {
    it('should return mutations for a patient', async () => {
      await caller.mutations.create({
        patientId: 'patient_mut_2',
        gene: 'TP53',
        mutationType: 'R175H',
      });
      const results = await caller.mutations.getByPatient({ patientId: 'patient_mut_2' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].gene).toBe('TP53');
    });
  });

  // ─── Biomarkers ─────────────────────────────────────────

  describe('biomarkers.create', () => {
    it('should create a biomarker record', async () => {
      const result = await caller.biomarkers.create({
        patientId: 'patient_bio_1',
        biomarkerType: 'PD-L1',
        value: 75,
        unit: '%',
      });
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^biomarker_/);
      expect(result.biomarkerType).toBe('PD-L1');
      expect(result.value).toBe(75);
      expect(result.unit).toBe('%');
    });
  });

  describe('biomarkers.getByPatient', () => {
    it('should return biomarkers for a patient', async () => {
      await caller.biomarkers.create({
        patientId: 'patient_bio_2',
        biomarkerType: 'LDH',
        value: 250,
        unit: 'U/L',
      });
      const results = await caller.biomarkers.getByPatient({ patientId: 'patient_bio_2' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].biomarkerType).toBe('LDH');
    });
  });

  // ─── Treatments ─────────────────────────────────────────

  describe('treatments.create', () => {
    it('should create a treatment record', async () => {
      const result = await caller.treatments.create({
        patientId: 'patient_trt_1',
        type: 'Imunoterapia com Pembrolizumab',
        startDate: new Date('2024-01-15'),
        status: 'active',
      });
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^treatment_/);
      expect(result.type).toBe('Imunoterapia com Pembrolizumab');
      expect(result.status).toBe('active');
    });
  });

  describe('treatments.getByPatient', () => {
    it('should return treatments for a patient', async () => {
      await caller.treatments.create({
        patientId: 'patient_trt_2',
        type: 'Quimioterapia',
        startDate: new Date('2024-03-01'),
        status: 'completed',
      });
      const results = await caller.treatments.getByPatient({ patientId: 'patient_trt_2' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Recommendations ────────────────────────────────────

  describe('recommendations.create', () => {
    it('should create a treatment recommendation', async () => {
      const result = await caller.recommendations.create({
        patientId: 'patient_rec_1',
        diagnosisId: 'diag_001',
        recommendation: 'Iniciar imunoterapia com Nivolumab',
        confidenceScore: 0.92,
        interventions: ['Nivolumab 240mg q2w', 'Monitoramento de toxicidade'],
        source: 'AI_Doctor Gemini',
      });
      expect(result).toHaveProperty('id');
      expect(result.id).toMatch(/^recommendation_/);
      expect(result.recommendation).toBe('Iniciar imunoterapia com Nivolumab');
      expect(result.confidenceScore).toBe(0.92);
      expect(result.interventions).toHaveLength(2);
    });
  });

  describe('recommendations.getByPatient', () => {
    it('should return recommendations for a patient', async () => {
      await caller.recommendations.create({
        patientId: 'patient_rec_2',
        recommendation: 'Tratamento A',
      });
      await caller.recommendations.create({
        patientId: 'patient_rec_2',
        recommendation: 'Tratamento B',
      });
      const results = await caller.recommendations.getByPatient({ patientId: 'patient_rec_2' });
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('recommendations.accept', () => {
    it('should mark a recommendation as accepted', async () => {
      const rec = await caller.recommendations.create({
        patientId: 'patient_rec_3',
        recommendation: 'Accept this',
        status: 'pending',
      });
      const result = await caller.recommendations.accept({ recommendationId: rec.id });
      expect(result).toEqual({ success: true });

      const list = await caller.recommendations.getByPatient({ patientId: 'patient_rec_3' });
      const accepted = list.find((r: any) => r.id === rec.id);
      expect(accepted.status).toBe('accepted');
    });
  });

  describe('recommendations.reject', () => {
    it('should mark a recommendation as rejected', async () => {
      const rec = await caller.recommendations.create({
        patientId: 'patient_rec_4',
        recommendation: 'Reject this',
        status: 'pending',
      });
      const result = await caller.recommendations.reject({ recommendationId: rec.id });
      expect(result).toEqual({ success: true });

      const list = await caller.recommendations.getByPatient({ patientId: 'patient_rec_4' });
      const rejected = list.find((r: any) => r.id === rec.id);
      expect(rejected.status).toBe('rejected');
    });
  });

  // ─── Analytics ──────────────────────────────────────────

  describe('analytics.getSystemStats', () => {
    it('should return the expected shape', async () => {
      const result = await caller.analytics.getSystemStats();
      expect(result).toHaveProperty('totalPatients');
      expect(result).toHaveProperty('totalDiagnoses');
      expect(result).toHaveProperty('avgLatency');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('consensusRate');
      expect(result).toHaveProperty('activeAgents');
      expect(result).toHaveProperty('totalRecommendations');
      expect(typeof result.totalPatients).toBe('number');
      expect(typeof result.totalDiagnoses).toBe('number');
    });
  });

  describe('analytics.getQueryTrends', () => {
    it('should return an array of trend data', async () => {
      const result = await caller.analytics.getQueryTrends();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('avgResponseTime');
    });

    it('should accept optional days parameter', async () => {
      const result = await caller.analytics.getQueryTrends({ days: 3 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });
  });

  describe('analytics.getAgentPerformance', () => {
    it('should return an array of agent performance data', async () => {
      const result = await caller.analytics.getAgentPerformance();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('agentName');
      expect(result[0]).toHaveProperty('accuracy');
      expect(result[0]).toHaveProperty('totalTasks');
      expect(result[0]).toHaveProperty('successRate');
    });
  });

  describe('analytics.getSpecialtyDistribution', () => {
    it('should return an array of specialty distribution data', async () => {
      const result = await caller.analytics.getSpecialtyDistribution();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('specialty');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('percentage');
    });
  });

  describe('analytics.getTreatmentOutcomes', () => {
    it('should return an array of treatment outcome data', async () => {
      const result = await caller.analytics.getTreatmentOutcomes();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('treatment');
      expect(result[0]).toHaveProperty('successRate');
      expect(result[0]).toHaveProperty('casesCount');
      expect(result[0]).toHaveProperty('avgDuration');
    });
  });

  describe('analytics.getSystemHealth', () => {
    it('should return the expected shape', async () => {
      const result = await caller.analytics.getSystemHealth();
      expect(result).toHaveProperty('cpuUsage');
      expect(result).toHaveProperty('memoryUsage');
      expect(result).toHaveProperty('diskUsage');
      expect(result).toHaveProperty('networkLatency');
      expect(result).toHaveProperty('databaseConnections');
      expect(result).toHaveProperty('activeUsers');
      expect(result).toHaveProperty('errorRate');
      expect(result).toHaveProperty('lastHealthCheck');
      expect(result).toHaveProperty('dbConnected');
      expect(result).toHaveProperty('geminiConfigured');
    });
  });
});