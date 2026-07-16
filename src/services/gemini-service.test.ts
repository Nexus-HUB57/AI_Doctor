// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Gemini Service Integration Tests (Mock-based)
 *
 * Uses vi.hoisted() to ensure mock references are available when vi.mock runs.
 * Tests both happy path (Gemini returns valid JSON) and fallback paths (Gemini throws).
 */

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(function () {
    return { models: { generateContent: mockGenerateContent } };
  }),
}));

// Import after mock is set up
import {
  generateTreatmentRecommendation,
  queryOncology,
  analyzeMutations,
  analyzeBiomarkers,
  analyzeDIMHEX,
  predictTreatmentResponse,
  predictToxicity,
  recommendImmunotherapy,
  recommendNanotherapy,
  recommendComplementaryMedicine,
  generateSpecialistPerspective,
  calculateConsensus,
} from './gemini-service';

function mockGeminiJson(data: object) {
  return { text: JSON.stringify(data) };
}

describe('Gemini Service - Integration Tests (Mock-based)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateTreatmentRecommendation', () => {
    it('returns parsed recommendation from Gemini JSON response', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        primaryTreatment: 'Pembrolizumab 200mg q3w',
        primaryRationale: 'Alta expressão de PD-L1',
        primaryConfidence: 0.88,
        expectedOutcome: 'Resposta parcial em 60%',
        alternatives: [
          { treatment: 'Nivolumab', rationale: 'Alternativa anti-PD1', confidence: 0.82 },
        ],
        monitoring: ['Função hepática', 'TSH'],
        contraindications: ['Doença autoimune'],
        sources: ['NCCN 2026'],
      }));

      const result = await generateTreatmentRecommendation({
        tumorType: 'Melanoma',
        stage: 'IV',
        mutations: ['BRAF V600E'],
        biomarkers: ['PD-L1 80%'],
      });

      expect(result.recommendation).toBe('Pembrolizumab 200mg q3w');
      expect(result.confidenceScore).toBe(0.88);
      expect(result.interventions).toContain('Pembrolizumab 200mg q3w');
      expect(result.interventions).toContain('Nivolumab');
      expect(result.contraindications).toEqual(['Doença autoimune']);
      expect(result.sources).toEqual(['NCCN 2026']);
    });

    it('returns fallback recommendation when Gemini throws', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API unavailable'));

      const result = await generateTreatmentRecommendation({
        tumorType: 'Melanoma',
        stage: 'IV',
      });

      expect(result.recommendation).toContain('Imunoterapia');
      expect(result.confidenceScore).toBe(0.65);
      expect(result.interventions.length).toBeGreaterThan(0);
    });
  });

  describe('queryOncology', () => {
    it('returns response text and sources from Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Para melanoma estágio IV com mutação BRAF V600E, recomenda-se imunoterapia.',
      });

      const result = await queryOncology('Tratamento para melanoma estágio IV');

      expect(result.response).toContain('melanoma');
      expect(result.confidenceScore).toBe(0.8);
      expect(result.sources).toContain('Gemini API');
    });

    it('returns error message when Gemini throws', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Network error'));

      const result = await queryOncology('Test query');

      expect(result.response).toContain('Desculpe');
      expect(result.confidenceScore).toBe(0);
    });
  });

  describe('analyzeMutations', () => {
    it('parses mutation analysis from Gemini JSON', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        analysis: 'BRAF V600E é mutação acionadora em melanoma',
        therapeuticImplications: ['Inibidores BRAF/MEK', 'Pior prognóstico sem tratamento'],
        predictiveValue: 0.9,
        sources: ['NCCN 2026'],
      }));

      const result = await analyzeMutations(['BRAF V600E', 'TP53 R175H'], 'Melanoma');

      expect(result.analysis).toBe('BRAF V600E é mutação acionadora em melanoma');
      expect(result.therapeuticImplications).toHaveLength(2);
      expect(result.predictiveValue).toBe(0.9);
    });

    it('returns fallback when Gemini throws', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API error'));

      const result = await analyzeMutations(['BRAF'], 'Melanoma');

      expect(result.analysis).toContain('não disponível');
      expect(result.predictiveValue).toBe(0);
    });
  });

  describe('analyzeBiomarkers', () => {
    it('returns biomarker analysis with prognostic score', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        analysis: 'PD-L1 alto indica boa resposta a anti-PD-1',
        implications: ['Candidato a imunoterapia'],
        prognosticScore: 0.72,
        treatmentRelevance: ['Anti-PD-1 primeira linha'],
        confidenceScore: 0.88,
      }));

      const result = await analyzeBiomarkers(
        [{ type: 'PD-L1', value: 85, unit: '%' }],
        'Melanoma'
      );

      expect(result.prognosticScore).toBe(0.72);
      expect(result.confidenceScore).toBe(0.88);
      expect(result.treatmentRelevance).toContain('Anti-PD-1 primeira linha');
    });
  });

  describe('analyzeDIMHEX', () => {
    it('returns DIMHEX protocol assessment', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        suitability: 0.78,
        protocol: 'DIMHEX adaptado com ativação Th1',
        expectedOutcome: 'Resposta imunológica em 60-70%',
        risks: ['Síndrome de liberação de citocinas'],
        monitoringPlan: ['CD4/CD8 semanal'],
        confidenceScore: 0.78,
      }));

      const result = await analyzeDIMHEX({
        tumorType: 'Melanoma',
        stage: 3,
        immuneProfile: 'Hot tumor',
      });

      expect(result.suitability).toBe(0.78);
      expect(result.risks).toHaveLength(1);
      expect(result.monitoringPlan).toHaveLength(1);
    });

    it('returns fallback when Gemini throws', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error'));

      const result = await analyzeDIMHEX({ tumorType: 'Melanoma', stage: 3 });

      expect(result.suitability).toBe(0.5);
      expect(result.confidenceScore).toBe(0);
      expect(result.risks.length).toBeGreaterThan(0);
    });
  });

  describe('predictTreatmentResponse', () => {
    it('returns prediction scores from Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        responseScore: 0.72,
        survivalProbability: 0.65,
        toxicityRisk: 0.25,
        progressionRisk: 0.35,
        confidenceScore: 0.75,
        explanation: 'Bom perfil para imunoterapia',
      }));

      const result = await predictTreatmentResponse({
        treatment: 'Pembrolizumab',
        patientProfile: { tumorType: 'Melanoma', stage: 4 },
      });

      expect(result.responseScore).toBe(0.72);
      expect(result.survivalProbability).toBe(0.65);
      expect(result.toxicityRisk).toBe(0.25);
    });
  });

  describe('predictToxicity', () => {
    it('returns toxicity assessment from Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        toxicityScore: 0.45,
        severeEventRisk: 0.12,
        managementStrategies: ['Corticoterapia precoce'],
        monitoringProtocol: ['TSH a cada 4 semanas'],
        confidenceScore: 0.72,
      }));

      const result = await predictToxicity({
        treatment: 'Ipilimumab',
        patientProfile: { age: 65, comorbidities: ['Hipertensão'] },
      });

      expect(result.toxicityScore).toBe(0.45);
      expect(result.severeEventRisk).toBe(0.12);
      expect(result.managementStrategies).toContain('Corticoterapia precoce');
    });

    it('returns comprehensive fallback when Gemini throws', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error'));

      const result = await predictToxicity({
        treatment: 'Any treatment',
        patientProfile: { age: 50 },
      });

      expect(result.toxicityScore).toBe(0.4);
      expect(result.managementStrategies.length).toBeGreaterThan(0);
      expect(result.monitoringProtocol.length).toBeGreaterThan(0);
      expect(result.confidenceScore).toBe(0);
    });
  });

  describe('recommendImmunotherapy', () => {
    it('returns immunotherapy strategies from Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        recommendations: [
          { strategy: 'Pembrolizumab', rationale: 'PD-L1 alto', target: 'PD-1', expectedResponseRate: 0.55, evidence: 'KEYNOTE-006' },
        ],
        rationale: 'Excelente candidato',
        expectedOutcome: 'Resposta objetiva 55%',
        monitoringParameters: ['LDH sérico'],
        confidenceScore: 0.85,
      }));

      const result = await recommendImmunotherapy({
        tumorType: 'Melanoma',
        stage: 4,
        immuneProfile: 'Inflamado',
      });

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].strategy).toBe('Pembrolizumab');
      expect(result.confidenceScore).toBe(0.85);
    });

    it('returns fallback immunotherapy recommendation', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error'));

      const result = await recommendImmunotherapy({ tumorType: 'Melanoma', stage: 4 });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].target).toBe('PD-1/PD-L1');
      expect(result.confidenceScore).toBe(0);
    });
  });

  describe('recommendNanotherapy', () => {
    it('returns nanotherapy recommendations from Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        recommendations: [
          { nanoplatform: 'LNP-siRNA', mechanism: 'Silenciamento gênico', target: 'BRAF', advantages: ['Direcionado'], developmentStage: 'Fase II' },
        ],
        mechanism: 'EPR effect para entrega tumoral',
        expectedOutcome: 'Redução 60-80% expressão oncogene',
        deliveryMethod: 'Infusão intravenosa',
        confidenceScore: 0.65,
      }));

      const result = await recommendNanotherapy({
        tumorType: 'Glioblastoma',
        stage: 4,
        targetMolecules: ['EGFRvIII'],
      });

      expect(result.recommendations).toHaveLength(1);
      expect(result.deliveryMethod).toBe('Infusão intravenosa');
    });

    it('returns fallback nanotherapy recommendation', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error'));

      const result = await recommendNanotherapy({ tumorType: 'Glioblastoma', stage: 4 });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].nanoplatform).toContain('Lipídicas');
      expect(result.confidenceScore).toBe(0);
    });
  });

  describe('recommendComplementaryMedicine', () => {
    it('returns evidence-based complementary therapies from Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        recommendations: [
          { therapy: 'Vitamina D3', evidence: 'Meta-análise Cochrane', mechanism: 'Modulação imune', benefits: ['Resposta imune'], risks: ['Hipercalcemia'], interactionWithPrimary: 'Seguro' },
        ],
        evidence: ['Cochrane 2023'],
        expectedBenefits: ['Qualidade de vida'],
        contraindications: ['Suspender fitoterápicos 48h antes'],
        confidenceScore: 0.75,
      }));

      const result = await recommendComplementaryMedicine({
        tumorType: 'Mama',
        primaryTreatment: 'AC-T',
        patientPreferences: ['Acupuntura'],
      });

      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].therapy).toBe('Vitamina D3');
      expect(result.contraindications.length).toBeGreaterThan(0);
    });

    it('returns fallback complementary medicine recommendation', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error'));

      const result = await recommendComplementaryMedicine({
        tumorType: 'Mama',
        primaryTreatment: 'Quimioterapia',
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].therapy).toContain('Vitamina D');
      expect(result.confidenceScore).toBe(0);
    });
  });

  describe('generateSpecialistPerspective', () => {
    it('returns specialist analysis from Gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        analysis: 'Análise sob perspectiva de imunologia oncológica',
        recommendation: 'Imunoterapia combinada',
        confidenceScore: 0.85,
        rationale: 'Baseado em perfil imune do tumor',
        references: ['Ref 1', 'Ref 2'],
      }));

      const result = await generateSpecialistPerspective({
        agent: {
          name: 'Dr. Immunology',
          specialty: 'Imunooncologia',
          credentials: 'PhD, MD',
          research_focus: 'Checkpoint inhibitors',
          expertise_areas: ['Imunoterapia'],
          h_index: 45,
        },
        patientProfile: { tumorType: 'Melanoma', stage: 4 },
        topic: 'Imunoterapia',
      });

      expect(result.analysis).toContain('imunologia');
      expect(result.confidenceScore).toBe(0.85);
      expect(result.references).toHaveLength(2);
    });

    it('returns fallback when Gemini throws', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error'));

      const result = await generateSpecialistPerspective({
        agent: {
          name: 'Dr. Test',
          specialty: 'Oncologia',
          credentials: 'PhD',
          research_focus: 'Cancer',
          expertise_areas: ['Treatment'],
          h_index: 30,
        },
        patientProfile: { tumorType: 'Melanoma', stage: 4 },
        topic: 'Treatment',
      });

      expect(result.confidenceScore).toBe(0.4);
      expect(result.recommendation).toContain('indisponível');
    });
  });

  describe('calculateConsensus', () => {
    it('returns consensus from Gemini with multiple perspectives', async () => {
      mockGenerateContent.mockResolvedValueOnce(mockGeminiJson({
        consensusLevel: 0.82,
        primaryRecommendation: 'Imunoterapia combinada',
        alternativeRecommendations: ['Quimioterapia'],
        dissents: [],
        confidenceScore: 0.82,
        summary: 'Consenso favorável à imunoterapia',
      }));

      const result = await calculateConsensus({
        perspectives: [
          {
            agentId: '1',
            agentName: 'Dr. A',
            specialty: 'Imunologia',
            analysis: 'Good candidate',
            recommendation: 'Imunoterapia',
            confidenceScore: 0.85,
            rationale: 'Hot tumor',
          },
          {
            agentId: '2',
            agentName: 'Dr. B',
            specialty: 'Cirurgia',
            analysis: 'Consider surgery',
            recommendation: 'Cirurgia + Imunoterapia',
            confidenceScore: 0.75,
            rationale: 'Ressecável',
          },
        ],
        patientProfile: { tumorType: 'Melanoma', stage: 3 },
      });

      expect(result.consensusLevel).toBe(0.82);
      expect(result.primaryRecommendation).toBe('Imunoterapia combinada');
      expect(result.summary).toContain('imunoterapia');
    });

    it('calculates simple fallback consensus when Gemini throws', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Error'));

      const result = await calculateConsensus({
        perspectives: [
          {
            agentId: '1',
            agentName: 'Dr. A',
            specialty: 'Imunologia',
            analysis: 'Analysis',
            recommendation: 'Treatment A',
            confidenceScore: 0.8,
            rationale: 'Rationale',
          },
        ],
        patientProfile: { tumorType: 'Melanoma', stage: 3 },
      });

      expect(result.consensusLevel).toBe(0.8);
      expect(result.primaryRecommendation).toBe('Treatment A');
      expect(result.summary).toContain('1 especialistas');
    });
  });
});