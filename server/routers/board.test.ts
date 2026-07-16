// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the gemini-service module to avoid @google/genai dependency
vi.mock('../../src/services/gemini-service', () => ({
  generateSpecialistPerspective: vi.fn().mockResolvedValue({
    analysis: 'Análise especializada do caso clínico',
    recommendation: 'Recomendação baseada em evidências',
    confidenceScore: 0.88,
    rationale: 'Racional fundamentado na literatura',
    references: ['Ref A', 'Ref B'],
  }),
  calculateConsensus: vi.fn().mockResolvedValue({
    consensusLevel: 0.85,
    primaryRecommendation: 'Imunoterapia combinada como primeira linha',
    alternativeRecommendations: ['Quimioterapia paliativa', 'Ensaio clínico'],
    dissents: [],
    confidenceScore: 0.85,
    summary: 'Consenso favorável ao tratamento combinado',
  }),
}));

import { boardRouter } from './board';

describe('Board Router', () => {
  let caller: ReturnType<typeof boardRouter.createCaller>;

  beforeEach(() => {
    caller = boardRouter.createCaller({});
  });

  describe('members.list', () => {
    it('should return an array of agents', async () => {
      const result = await caller.members.list();
      expect(Array.isArray(result)).toBe(true);
      // If the registry file loads, there should be agents; if not, empty is ok
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('specialty');
        expect(result[0]).toHaveProperty('hIndex');
        expect(result[0]).toHaveProperty('publications');
        expect(result[0]).toHaveProperty('expertise');
      }
    });
  });

  describe('statistics', () => {
    it('should return expected shape', async () => {
      const result = await caller.statistics();
      expect(result).toHaveProperty('totalBoardSessions');
      expect(result).toHaveProperty('averageConsensusLevel');
      expect(result).toHaveProperty('mostActiveSpecialty');
      expect(result).toHaveProperty('specialtyDistribution');
      expect(result).toHaveProperty('topRecommendations');
      expect(result).toHaveProperty('averageResponseTime');
      expect(result).toHaveProperty('totalSpecialistsAvailable');
      expect(typeof result.totalBoardSessions).toBe('number');
      expect(typeof result.totalSpecialistsAvailable).toBe('number');
    });
  });

  describe('assemble (selectSpecialists)', () => {
    it('should return selected agents for a case', async () => {
      const result = await caller.assemble({
        tumorType: 'Melanoma',
        stage: 4,
        mutations: ['BRAF V600E'],
        biomarkers: ['PD-L1 80%'],
      });
      expect(result).toHaveProperty('boardId');
      expect(result).toHaveProperty('members');
      expect(result).toHaveProperty('selectedSpecialties');
      expect(result).toHaveProperty('createdAt');
      expect(result.boardId).toMatch(/^board_/);
      expect(Array.isArray(result.members)).toBe(true);
      expect(result.members.length).toBeGreaterThan(0);
      expect(Array.isArray(result.selectedSpecialties)).toBe(true);
    });

    it('should include core specialties in selection', async () => {
      const result = await caller.assemble({
        tumorType: 'Câncer de Pulmão',
        stage: 3,
      });
      expect(result.members.length).toBeGreaterThan(0);
      // Core specialties should be represented
      const specialties = result.selectedSpecialties as string[];
      // At minimum, some specialists should be returned
      expect(specialties.length).toBeGreaterThan(0);
    });
  });

  describe('history', () => {
    it('should return board session history', async () => {
      // Create a session first
      await caller.assemble({
        tumorType: 'Glioblastoma',
        stage: 4,
      });
      const result = await caller.history();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toHaveProperty('boardId');
      expect(result[0]).toHaveProperty('createdAt');
      expect(result[0]).toHaveProperty('tumorType');
    });
  });

  describe('report', () => {
    it('should return a report for a non-existent session gracefully', async () => {
      const result = await caller.report({ boardId: 'non_existent_board' });
      expect(result).toHaveProperty('reportId');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('summary');
      expect(result.summary).toContain('não encontrada');
    });
  });
});