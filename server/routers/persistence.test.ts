import { describe, it, expect } from 'vitest';
import { persistenceRouter } from './persistence';
import { createTRPCContext } from '../trpc';

describe('Persistence Router', () => {
  it('should list patients (initially empty)', async () => {
    const caller = persistenceRouter.createCaller({});
    const patients = await caller.patients.list();
    expect(Array.isArray(patients)).toBe(true);
    expect(patients.length).toBe(0);
  });

  it('should create a new patient', async () => {
    const caller = persistenceRouter.createCaller({});
    const newPatient = {
      name: 'João Silva',
      age: 45,
      email: 'joao@example.com',
      medicalHistory: 'Hipertensão',
    };
    
    const result = await caller.patients.create(newPatient);
    expect(result).toHaveProperty('id');
    expect(result.name).toBe(newPatient.name);
    expect(result.age).toBe(newPatient.age);
  });

  it('should create a diagnosis', async () => {
    const caller = persistenceRouter.createCaller({});
    const diagnosis = {
      patientId: 'patient_123',
      tumorType: 'Melanoma',
      stage: 3,
      notes: 'Paciente em observação',
    };
    
    const result = await caller.diagnoses.create(diagnosis);
    expect(result).toHaveProperty('id');
    expect(result.tumorType).toBe(diagnosis.tumorType);
    expect(result.stage).toBe(diagnosis.stage);
  });
});
