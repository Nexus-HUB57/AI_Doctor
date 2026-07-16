import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the gemini-service module to avoid @google/genai dependency
vi.mock('../../src/services/gemini-service', () => ({
  generateTreatmentRecommendation: vi.fn().mockResolvedValue({
    recommendation: 'Imunoterapia com Pembrolizumab',
    confidenceScore: 0.88,
    interventions: ['Pembrolizumab 200mg q3w', 'Monitoramento a cada 6 semanas'],
    primaryRecommendation: {
      treatment: 'Pembrolizumab',
      rationale: 'Alta expressão de PD-L1',
      confidenceScore: 0.88,
      expectedOutcome: 'Resposta parcial em 60% dos casos',
    },
    alternativeRecommendations: [
      { treatment: 'Nivolumab', rationale: 'Alternativa anti-PD1', confidenceScore: 0.82 },
    ],
    contraindications: ['Doença autoimune ativa'],
    monitoringParameters: ['Função hepática', 'TSH'],
    sources: ['NCCN Guidelines 2024'],
  }),
  queryOncology: vi.fn().mockResolvedValue({
    response: 'Para melanoma estágio IV com mutação BRAF V600E...',
    sources: ['PubMed: 12345678'],
    confidenceScore: 0.85,
    citations: [],
  }),
  analyzeMutations: vi.fn().mockResolvedValue({
    analysis: 'Mutação BRAF V600E é acionadora em melanoma',
    therapeuticImplications: ['Resposta a inibidores BRAF/MEK', 'Pior prognóstico sem tratamento direcionado'],
    predictiveValue: 0.9,
    sources: ['NCCN 2026', 'NEJM 2024'],
  }),
  analyzeBiomarkers: vi.fn().mockResolvedValue({
    analysis: 'PD-L1 alto (85%) indica boa resposta a anti-PD-1. LDH elevado sugere carga tumoral alta.',
    implications: ['Candidato a imunoterapia', 'Necessidade de monitoramento de progressão'],
    prognosticScore: 0.65,
    treatmentRelevance: ['Anti-PD-1 de primeira linha', 'Combinações com anti-CTLA-4'],
    confidenceScore: 0.88,
  }),
  analyzeDIMHEX: vi.fn().mockResolvedValue({
    suitability: 0.78,
    protocol: 'DIMHEX adaptado: coleta de 200mL com fração leucocitária > 80%, ativação Th1 com IL-2 e anti-CD3, engenharia de Ac biespecífico anti-GD3, eritrócitos carregados com asparaginase.',
    expectedOutcome: 'Resposta imunológica em 60-70% dos casos com tumor inflamatório',
    risks: ['Síndrome de liberação de citocinas grau 1-2', 'Reação transfusional leve'],
    monitoringPlan: ['CD4/CD8 semanal', 'Citocinas séricas (IL-2, IFN-gamma)', 'Marcadores tumorais a cada 2 semanas'],
    confidenceScore: 0.78,
  }),
  predictTreatmentResponse: vi.fn().mockResolvedValue({
    responseScore: 0.72,
    survivalProbability: 0.65,
    toxicityRisk: 0.25,
    progressionRisk: 0.35,
    confidenceScore: 0.75,
    explanation: 'Paciente com BRAF V600E e PD-L1 alto tem boa perspectiva de resposta a anti-PD-1. Idade jovem e ECOG 0-1 favorecem tolerabilidade.',
  }),
  predictToxicity: vi.fn().mockResolvedValue({
    toxicityScore: 0.45,
    severeEventRisk: 0.12,
    managementStrategies: ['Corticoterapia precoce para irAEs', 'Monitoramento de tireoide', 'Hidratação profilática'],
    monitoringProtocol: ['TSH/T4 livre a cada 4 semanas', 'Creatinina semanal nas primeiras 6 semanas', 'Hemograma completo antes de cada ciclo'],
    confidenceScore: 0.72,
  }),
  recommendImmunotherapy: vi.fn().mockResolvedValue({
    recommendations: [
      { strategy: 'Pembrolizumab monoterapia', rationale: 'PD-L1 > 80% em melanoma', target: 'PD-1', expectedResponseRate: 0.55, evidence: 'KEYNOTE-006, NEJM 2018' },
      { strategy: 'Nivolumab + Ipilimumab', rationale: 'Combinação sinérgica para tumor com alta carga mutacional', target: 'PD-1 + CTLA-4', expectedResponseRate: 0.58, evidence: 'CheckMate-067, NEJM 2019' },
    ],
    rationale: 'Melanoma com mutação BRAF e alta expressão de PD-L1 é excelente candidato para imunoterapia de checkpoint.',
    expectedOutcome: 'Taxa de resposta objetiva de 55-58%, com sobrevida global mediana > 36 meses',
    monitoringParameters: ['LDH sérico', 'TC de tórax/abdome/pelve a cada 8 semanas', 'TSH, T4 livre'],
    confidenceScore: 0.85,
  }),
  recommendNanotherapy: vi.fn().mockResolvedValue({
    recommendations: [
      { nanoplatform: 'Nanopartículas Lipídicas (LNP) com siRNA anti-BRAF', mechanism: 'Silenciamento gênico direcionado via EPR effect', target: 'BRAF V600E mRNA', advantages: ['Entrega tumoral seletiva', 'Menor toxicidade sistêmica'], developmentStage: 'Fase II' },
    ],
    mechanism: 'Nanopartículas lipídicas de 80-100nm exploram o efeito EPR para acumulação tumoral, liberando siRNA que silencia a expressão de BRAF V600E.',
    expectedOutcome: 'Redução de 60-80% da expressão do oncogene alvo no tumor',
    deliveryMethod: 'Infusão intravenosa a cada 2 semanas',
    confidenceScore: 0.65,
  }),
  recommendComplementaryMedicine: vi.fn().mockResolvedValue({
    recommendations: [
      { therapy: 'Suplementação de Vitamina D3', evidence: 'Meta-análise Cochrane 2023', mechanism: 'Modulação imunológica e inibição da proliferação', benefits: ['Melhora resposta imune', 'Saúde óssea'], risks: ['Hipercalcemia'], interactionWithPrimary: 'Seguro, monitorar cálcio' },
      { therapy: 'Exercício aeróbico moderado', evidence: 'ACS Guidelines 2024', mechanism: 'Redução de inflamação sistêmica', benefits: ['Menor fadiga', 'Melhora qualidade de vida'], risks: ['Cuidado com neutropenia'], interactionWithPrimary: 'Benéfico, adaptar intensidade' },
    ],
    evidence: ['Cochrane Database 2023', 'ACS Guidelines 2024', 'J Clin Oncol 2024'],
    expectedBenefits: ['Melhora de qualidade de vida', 'Potencialização da resposta imunológica'],
    contraindications: ['Suspender fitoterápicos 48h antes da quimioterapia'],
    confidenceScore: 0.75,
  }),
  generateSpecialistPerspective: vi.fn().mockResolvedValue({
    analysis: 'Análise do especialista',
    recommendation: 'Recomendação baseada em expertise',
    confidenceScore: 0.85,
    rationale: 'Baseado em evidências clínicas',
    references: ['Ref 1', 'Ref 2'],
  }),
  calculateConsensus: vi.fn().mockResolvedValue({
    consensusLevel: 0.82,
    primaryRecommendation: 'Imunoterapia combinada',
    alternativeRecommendations: ['Quimioterapia', 'Cirurgia'],
    dissents: [],
    confidenceScore: 0.82,
    summary: 'Consenso favorável à imunoterapia',
  }),
}));

import { ragRouter } from './rag';

describe('RAG Router', () => {
  let caller: ReturnType<typeof ragRouter.createCaller>;

  beforeEach(() => {
    caller = ragRouter.createCaller({});
  });

  it('should handle oncologyQuery.mutate with valid input', async () => {
    const result = await caller.oncologyQuery({
      query: 'Tratamento para melanoma estágio IV',
      context: {
        tumorType: 'Melanoma',
        stage: 4,
        mutations: ['BRAF V600E'],
      },
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('sources');
    expect(result).toHaveProperty('confidenceScore');
  });

  it('should handle recommendTreatment.mutate with valid input', async () => {
    const result = await caller.recommendTreatment({
      patientId: 'patient_001',
      tumorType: 'Melanoma',
      stage: 'IV',
      mutations: ['BRAF V600E'],
      biomarkers: ['PD-L1 80%'],
      patientAge: 55,
      performanceStatus: 'ECOG 0-1',
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('confidenceScore');
    expect(result).toHaveProperty('interventions');
    expect(result.interventions.length).toBeGreaterThan(0);
  });

  it('should handle analyzeMutations.mutate with valid input', async () => {
    const result = await caller.analyzeMutations({
      mutations: ['BRAF V600E', 'TP53 R175H'],
      tumorType: 'Melanoma',
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('analysis');
    expect(typeof result.analysis).toBe('string');
    expect(result.analysis.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('implications');
    expect(Array.isArray(result.implications)).toBe(true);
    expect(result).toHaveProperty('treatmentOptions');
    expect(Array.isArray(result.treatmentOptions)).toBe(true);
    expect(result).toHaveProperty('confidenceScore');
    expect(typeof result.confidenceScore).toBe('number');
  });

  it('should handle analyzeBiomarkers.mutate with valid input', async () => {
    const result = await caller.analyzeBiomarkers({
      biomarkers: [
        { type: 'PD-L1', value: 85, unit: '%' },
        { type: 'LDH', value: 300, unit: 'U/L' },
      ],
      tumorType: 'Melanoma',
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('analysis');
    expect(result.analysis.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('implications');
    expect(Array.isArray(result.implications)).toBe(true);
    expect(result).toHaveProperty('prognosticScore');
    expect(typeof result.prognosticScore).toBe('number');
    expect(result).toHaveProperty('treatmentRelevance');
    expect(result).toHaveProperty('confidenceScore');
  });

  it('should handle analyzeDIMHEX.mutate with valid input', async () => {
    const result = await caller.analyzeDIMHEX({
      patientProfile: {
        tumorType: 'Melanoma',
        stage: 3,
        immuneProfile: 'Hot tumor',
      },
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('suitability');
    expect(typeof result.suitability).toBe('number');
    expect(result.suitability).toBeGreaterThan(0);
    expect(result).toHaveProperty('protocol');
    expect(result.protocol.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('expectedOutcome');
    expect(result).toHaveProperty('risks');
    expect(Array.isArray(result.risks)).toBe(true);
    expect(result).toHaveProperty('monitoringPlan');
    expect(result).toHaveProperty('confidenceScore');
  });

  it('should handle predictTreatmentResponse.mutate with valid input', async () => {
    const result = await caller.predictTreatmentResponse({
      treatment: 'Pembrolizumab',
      patientProfile: {
        tumorType: 'Melanoma',
        stage: 4,
        mutations: ['BRAF V600E'],
        biomarkers: ['PD-L1 80%'],
        age: 50,
      },
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('responseScore');
    expect(result).toHaveProperty('survivalProbability');
    expect(result).toHaveProperty('toxicityRisk');
    expect(result).toHaveProperty('progressionRisk');
    expect(result).toHaveProperty('explanation');
    expect(result.explanation.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('confidenceScore');
  });

  it('should handle predictToxicity.mutate with valid input', async () => {
    const result = await caller.predictToxicity({
      treatment: 'Ipilimumab + Nivolumab',
      patientProfile: {
        age: 65,
        comorbidities: ['Hipertensão'],
        organFunction: {
          hepatic: 'Normal',
          renal: 'Normal',
        },
      },
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('toxicityScore');
    expect(result).toHaveProperty('severeEventRisk');
    expect(result).toHaveProperty('managementStrategies');
    expect(Array.isArray(result.managementStrategies)).toBe(true);
    expect(result).toHaveProperty('monitoringProtocol');
    expect(Array.isArray(result.monitoringProtocol)).toBe(true);
    expect(result).toHaveProperty('confidenceScore');
  });

  it('should handle recommendImmunotherapy.mutate with valid input', async () => {
    const result = await caller.recommendImmunotherapy({
      tumorType: 'Melanoma',
      stage: 4,
      immuneProfile: 'Inflamado',
      previousTreatments: ['Dacarbazina'],
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('rationale');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('expectedOutcome');
    expect(result).toHaveProperty('monitoringParameters');
    expect(result).toHaveProperty('confidenceScore');
  });

  it('should handle recommendNanotherapy.mutate with valid input', async () => {
    const result = await caller.recommendNanotherapy({
      tumorType: 'Glioblastoma',
      stage: 4,
      targetMolecules: ['EGFRvIII'],
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result).toHaveProperty('mechanism');
    expect(result.mechanism.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('expectedOutcome');
    expect(result).toHaveProperty('deliveryMethod');
    expect(result).toHaveProperty('confidenceScore');
  });

  it('should handle recommendComplementaryMedicine.mutate with valid input', async () => {
    const result = await caller.recommendComplementaryMedicine({
      tumorType: 'Mama',
      primaryTreatment: 'Quimioterapia AC-T',
      patientPreferences: ['Acupuntura', 'Meditação'],
    });
    expect(result).toBeDefined();
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('evidence');
    expect(Array.isArray(result.evidence)).toBe(true);
    expect(result).toHaveProperty('expectedBenefits');
    expect(result).toHaveProperty('contraindications');
    expect(result).toHaveProperty('confidenceScore');
  });
});