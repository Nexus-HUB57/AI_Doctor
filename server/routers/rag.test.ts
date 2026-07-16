import { describe, it, expect } from 'vitest';
import { ragRouter } from './rag';

describe('RAG Router', () => {
  it('should generate treatment recommendation', async () => {
    const caller = ragRouter.createCaller({});
    const input = {
      patientId: 'patient_123',
      tumorType: 'Melanoma',
      stage: 'IV',
      patientAge: 55,
      performanceStatus: 'ECOG 0-1'
    };
    
    const result = await caller.recommendTreatment(input);
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('confidenceScore');
    expect(result.interventions.length).toBeGreaterThan(0);
  });
});
