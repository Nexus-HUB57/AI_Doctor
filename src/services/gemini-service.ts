import { GoogleGenAI } from '@google/genai';

let _client: GoogleGenAI | null = null;

// Modelo padrão. Pode ser sobrescrito via GEMINI_MODEL no .env.
// Usar alias "latest" evita quebrar quando o Google desativa versões específicas.
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

function getModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

/**
 * Serviço de Integração com Google Gemini API
 * Fornece funções para consultas RAG, recomendações de tratamento e análises clínicas
 * Usa o SDK @google/genai (compatível com package.json)
 */

export interface TreatmentRecommendationInput {
  tumorType: string;
  stage: string | number;
  mutations?: string[];
  biomarkers?: string[];
  previousTreatments?: string[];
  patientAge?: number;
  performanceStatus?: string;
}

export interface TreatmentRecommendationOutput {
  recommendation: string;
  confidenceScore: number;
  interventions: string[];
  primaryRecommendation: {
    treatment: string;
    rationale: string;
    confidenceScore: number;
    expectedOutcome: string;
  };
  alternativeRecommendations: Array<{
    treatment: string;
    rationale: string;
    confidenceScore: number;
  }>;
  contraindications: string[];
  monitoringParameters: string[];
  sources: string[];
}

/**
 * Gera recomendações de tratamento personalizadas usando Gemini
 */
export async function generateTreatmentRecommendation(
  input: TreatmentRecommendationInput
): Promise<TreatmentRecommendationOutput> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um especialista em oncologia de precisão com acesso a base de conhecimento atualizada sobre:
- Imunoterapia moderna (CAR-T, checkpoint inhibidores)
- Nanotecnologia em oncologia
- Protocolo DIMHEX
- Biomarcadores e perfil molecular
- Estudos clínicos em andamento

Forneça recomendações de tratamento personalizadas, baseadas em evidências científicas atualizadas.
Sempre inclua score de confiança (0-1), rationale científica e alternativas.`;

    const userPrompt = `Paciente com:
- Tipo de tumor: ${input.tumorType}
- Estágio: ${input.stage}
- Idade: ${input.patientAge || 'Não informada'}
- Performance Status: ${input.performanceStatus || 'Não informado'}
- Mutações: ${input.mutations?.join(', ') || 'Nenhuma identificada'}
- Biomarcadores: ${input.biomarkers?.join(', ') || 'Não avaliados'}
- Tratamentos anteriores: ${input.previousTreatments?.join(', ') || 'Nenhum'}

Forneça:
1. Recomendação principal com score de confiança
2. Até 3 alternativas
3. Parâmetros de monitoramento
4. Contraindicações importantes

Responda em JSON com estrutura: {
  "primaryTreatment": "...",
  "primaryRationale": "...",
  "primaryConfidence": 0.0-1.0,
  "expectedOutcome": "...",
  "alternatives": [{"treatment": "...", "rationale": "...", "confidence": 0.0-1.0}],
  "monitoring": ["...", "..."],
  "contraindications": ["...", "..."],
  "sources": ["..."]
}`;

    const response = await client.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return {
      recommendation: parsed.primaryTreatment,
      confidenceScore: parsed.primaryConfidence || 0.75,
      interventions: [
        parsed.primaryTreatment,
        ...(parsed.alternatives?.map((a: any) => a.treatment) || [])
      ],
      primaryRecommendation: {
        treatment: parsed.primaryTreatment,
        rationale: parsed.primaryRationale,
        confidenceScore: parsed.primaryConfidence || 0.75,
        expectedOutcome: parsed.expectedOutcome,
      },
      alternativeRecommendations: parsed.alternatives || [],
      contraindications: parsed.contraindications || [],
      monitoringParameters: parsed.monitoring || [],
      sources: parsed.sources || [],
    };
  } catch (error) {
    console.error('Error generating treatment recommendation:', error);
    return generateFallbackRecommendation(input);
  }
}

/**
 * Recomendação fallback baseada em regras quando Gemini não está disponível
 */
function generateFallbackRecommendation(
  input: TreatmentRecommendationInput
): TreatmentRecommendationOutput {
  const recommendations: Record<string, string> = {
    'melanoma': 'Imunoterapia com Inibidores de Checkpoint (anti-PD-1/PD-L1)',
    'carcinoma': 'Quimioterapia combinada com imunoterapia',
    'linfoma': 'Terapia CAR-T ou Rituximab',
    'sarcoma': 'Quimioterapia neoadjuvante seguida de cirurgia',
  };

  const tumorLower = input.tumorType.toLowerCase();
  const primaryTreatment = Object.entries(recommendations).find(
    ([key]) => tumorLower.includes(key)
  )?.[1] || 'Protocolo DIMHEX com monitoramento';

  return {
    recommendation: primaryTreatment,
    confidenceScore: 0.65,
    interventions: [
      primaryTreatment,
      'Monitoramento de Biomarcadores',
      'Suporte Nutricional',
    ],
    primaryRecommendation: {
      treatment: primaryTreatment,
      rationale: `Baseado no tipo de tumor (${input.tumorType}) e estágio (${input.stage})`,
      confidenceScore: 0.65,
      expectedOutcome: 'Redução de carga tumoral com melhor tolerância',
    },
    alternativeRecommendations: [
      {
        treatment: 'Protocolo DIMHEX',
        rationale: 'Abordagem ex vivo para tumores refratários',
        confidenceScore: 0.55,
      }
    ],
    contraindications: ['Insuficiência renal grave', 'Infecção ativa'],
    monitoringParameters: [
      'Contagem de células tumorais circulantes',
      'Marcadores tumorais séricos',
      'Função hepática e renal',
      'Perfil imunológico',
    ],
    sources: ['Base de conhecimento local', 'Literatura oncológica'],
  };
}

/**
 * Consulta geral sobre oncologia usando RAG
 */
export async function queryOncology(query: string, context?: any): Promise<{
  response: string;
  confidenceScore: number;
  sources: string[];
  citations: string[];
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um especialista em oncologia com acesso a base de conhecimento RAG.
Responda perguntas sobre câncer, tratamentos, biomarcadores e protocolos clínicos.
Sempre cite fontes e forneça score de confiança.`;

    const contextStr = context ? JSON.stringify(context) : '';
    const userPrompt = `Contexto: ${contextStr}\n\nPergunta: ${query}`;

    const response = await client.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
    });

    return {
      response: response.text || 'Sem resposta disponível',
      confidenceScore: 0.8,
      sources: ['Gemini API', 'Base de conhecimento RAG'],
      citations: [],
    };
  } catch (error) {
    console.error('Error querying oncology:', error);
    return {
      response: 'Desculpe, não consegui processar sua consulta no momento.',
      confidenceScore: 0,
      sources: [],
      citations: [],
    };
  }
}

/**
 * Analisa mutações genéticas e impacto no tratamento
 */
export async function analyzeMutations(
  mutations: string[],
  tumorType: string
): Promise<{
  analysis: string;
  therapeuticImplications: string[];
  predictiveValue: number;
  sources: string[];
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um especialista em genômica do câncer e medicina de precisão.
Analise mutações genéticas e seu impacto em seleção de tratamento.`;

    const userPrompt = `Tumor: ${tumorType}
Mutações identificadas: ${mutations.join(', ')}

Forneça:
1. Análise das mutações
2. Implicações terapêuticas
3. Score de valor preditivo (0-1)

Responda em JSON: {
  "analysis": "...",
  "therapeuticImplications": ["...", "..."],
  "predictiveValue": 0.0-1.0,
  "sources": ["..."]
}`;

    const response = await client.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      analysis: parsed.analysis || 'Análise não disponível',
      therapeuticImplications: parsed.therapeuticImplications || [],
      predictiveValue: parsed.predictiveValue || 0.5,
      sources: parsed.sources || ['Gemini API'],
    };
  } catch (error) {
    console.error('Error analyzing mutations:', error);
    return {
      analysis: 'Análise não disponível no momento',
      therapeuticImplications: [],
      predictiveValue: 0,
      sources: [],
    };
  }
}

/**
 * Gera perspectiva de especialista para a Junta Médica PhD
 * Usa a persona do agente do registry para personalizar a resposta
 */
export async function generateSpecialistPerspective(params: {
  agent: {
    name: string;
    specialty: string;
    credentials: string;
    research_focus: string;
    expertise_areas: string[];
    h_index: number;
  };
  patientProfile: {
    tumorType: string;
    stage: number;
    mutations?: string[];
    biomarkers?: string[];
    age?: number;
    comorbidities?: string[];
  };
  topic: string;
}): Promise<{
  analysis: string;
  recommendation: string;
  confidenceScore: number;
  rationale: string;
  references: string[];
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const { agent, patientProfile, topic } = params;

    const systemPrompt = `Você é ${agent.name}, especialista em ${agent.specialty}.
Credenciais: ${agent.credentials}
Foco de pesquisa: ${agent.research_focus}
Áreas de expertise: ${agent.expertise_areas.join(', ')}
H-index: ${agent.h_index}

Forneça sua perspectiva clínica como especialista, considerando sua área de atuação.
Seja detalhado, cite evidências quando possível, e inclua seu nível de confiança.`;

    const userPrompt = `Caso clínico para discussão da junta médica:
- Tópico: ${topic}
- Tipo tumoral: ${patientProfile.tumorType}
- Estágio: ${patientProfile.stage}
- Mutações: ${patientProfile.mutations?.join(', ') || 'Nenhuma identificada'}
- Biomarcadores: ${patientProfile.biomarkers?.join(', ') || 'Não avaliados'}
- Idade: ${patientProfile.age || 'Não informada'}
- Comorbidades: ${patientProfile.comorbidities?.join(', ') || 'Nenhuma'}

Forneça sua perspectiva especializada em JSON:
{
  "analysis": "Sua análise detalhada do caso sob a ótica da ${agent.specialty}",
  "recommendation": "Sua recomendação terapêutica",
  "confidenceScore": 0.0-1.0,
  "rationale": "Justificativa científica detalhada",
  "references": ["Referência 1", "Referência 2"]
}`;

    const response = await client.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
      ],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      analysis: parsed.analysis || '',
      recommendation: parsed.recommendation || '',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.7,
      rationale: parsed.rationale || '',
      references: parsed.references || [],
    };
  } catch (error) {
    console.error('Error generating specialist perspective:', error);
    return {
      analysis: `Perspectiva de ${params.agent.specialty}: Análise baseada no perfil do paciente com ${params.patientProfile.tumorType} estágio ${params.patientProfile.stage}.`,
      recommendation: 'Recomendação indisponível temporariamente. Favor rever o caso.',
      confidenceScore: 0.4,
      rationale: 'Serviço de IA temporariamente indisponível.',
      references: [],
    };
  }
}

/**
 * Calcula consenso entre perspectivas de especialistas
 */
export async function calculateConsensus(params: {
  perspectives: Array<{
    agentId: string;
    agentName: string;
    specialty: string;
    analysis: string;
    recommendation: string;
    confidenceScore: number;
    rationale: string;
  }>;
  patientProfile: {
    tumorType: string;
    stage: number;
  };
}): Promise<{
  consensusLevel: number;
  primaryRecommendation: string;
  alternativeRecommendations: string[];
  dissents: string[];
  confidenceScore: number;
  summary: string;
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const perspectivesSummary = params.perspectives.map(p =>
      `### ${p.agentName} (${p.specialty}) - Confiança: ${(p.confidenceScore * 100).toFixed(0)}%
Análise: ${p.analysis}
Recomendação: ${p.recommendation}
Racional: ${p.rationale}`
    ).join('\n\n');

    const prompt = `Como coordenador de uma junta médica PhD, analise as seguintes perspectivas de especialistas e gere um consenso clínico:

${perspectivesSummary}

Paciente: ${params.patientProfile.tumorType}, Estágio ${params.patientProfile.stage}

Gere em JSON:
{
  "consensusLevel": 0.0-1.0,
  "primaryRecommendation": "Recomendação consensuada principal",
  "alternativeRecommendations": ["Alternativa 1", "Alternativa 2"],
  "dissents": ["Ponto de discordância 1"],
  "confidenceScore": 0.0-1.0,
  "summary": "Resumo executivo do consenso da junta médica"
}`;

    const response = await client.models.generateContent({
      model,
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      consensusLevel: typeof parsed.consensusLevel === 'number' ? parsed.consensusLevel : 0.7,
      primaryRecommendation: parsed.primaryRecommendation || '',
      alternativeRecommendations: parsed.alternativeRecommendations || [],
      dissents: parsed.dissents || [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.7,
      summary: parsed.summary || '',
    };
  } catch (error) {
    console.error('Error calculating consensus:', error);
    // Fallback: calcular consenso simples por maioria
    const recommendations = params.perspectives.map(p => p.recommendation);
    const avgConfidence = params.perspectives.reduce((sum, p) => sum + p.confidenceScore, 0) / params.perspectives.length;

    return {
      consensusLevel: avgConfidence,
      primaryRecommendation: recommendations[0] || 'Recomendação não disponível',
      alternativeRecommendations: recommendations.slice(1, 3),
      dissents: [],
      confidenceScore: avgConfidence,
      summary: `Consenso calculado a partir de ${params.perspectives.length} especialistas com confiança média de ${(avgConfidence * 100).toFixed(0)}%.`,
    };
  }
}

/**
 * Analisa biomarcadores tumorais e suas implicações clínicas
 */
export async function analyzeBiomarkers(
  biomarkers: Array<{ type: string; value: number; unit: string }>,
  tumorType: string
): Promise<{
  analysis: string;
  implications: string[];
  prognosticScore: number;
  treatmentRelevance: string[];
  confidenceScore: number;
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const biomarkersStr = biomarkers.map(b => `${b.type}: ${b.value} ${b.unit}`).join(', ');

    const systemPrompt = `Você é um patologista molecular especializado em biomarcadores tumorais.
Interprete os valores de biomarcadores e suas implicações para tratamento e prognóstico.`;

    const userPrompt = `Tumor: ${tumorType}
Biomarcadores: ${biomarkersStr}

Forneça:
1. Análise interpretativa dos biomarcadores
2. Implicações clínicas
3. Score prognóstico (0-1)
4. Relevância para tratamento

Responda em JSON: {
  "analysis": "Análise detalhada dos biomarcadores",
  "implications": ["Implicação 1", "Implicação 2"],
  "prognosticScore": 0.0-1.0,
  "treatmentRelevance": ["Relevância 1", "Relevância 2"],
  "confidenceScore": 0.0-1.0
}`;

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      analysis: parsed.analysis || 'Análise não disponível',
      implications: parsed.implications || [],
      prognosticScore: typeof parsed.prognosticScore === 'number' ? parsed.prognosticScore : 0.5,
      treatmentRelevance: parsed.treatmentRelevance || [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.6,
    };
  } catch (error) {
    console.error('Error analyzing biomarkers:', error);
    return {
      analysis: `Análise de biomarcadores para ${tumorType}: ${biomarkers.map(b => b.type).join(', ')}. Serviço de IA temporariamente indisponível.`,
      implications: ['Interpretação limitada — serviço indisponível'],
      prognosticScore: 0.3,
      treatmentRelevance: [],
      confidenceScore: 0,
    };
  }
}

/**
 * Analisa adequação do Protocolo DIMHEX para um paciente específico
 * DIMHEX = Imuno-Oncologia Ex Vivo (Depletion, Immunotherapy, Hex)
 */
export async function analyzeDIMHEX(params: {
  tumorType: string;
  stage: number;
  immuneProfile?: string;
}): Promise<{
  suitability: number;
  protocol: string;
  expectedOutcome: string;
  risks: string[];
  monitoringPlan: string[];
  confidenceScore: number;
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um especialista no Protocolo DIMHEX de imunoterapia ex vivo.
O DIMHEX consiste em 4 fases:
1. Coleta Estratificada: Sangria fracionada com seleção de frações ricas em leucócitos
2. Potencialização de Leucócitos: Ativação e expansão ex vivo de linfócitos T (polarização Th1)
3. Engenharia de Anticorpos: Geração de anticorpos biespecíficos para direcionamento tumoral
4. Eritrócitos Carregados: Encapsulamento de enzimas para inanição metabólica seletiva

Avalie a adequação do protocolo para o perfil do paciente.`;

    const userPrompt = `Perfil do paciente:
- Tipo tumoral: ${params.tumorType}
- Estágio: ${params.stage}
- Perfil imunológico: ${params.immuneProfile || 'Não avaliado'}

Avalie a adequação do DIMHEX e forneça:
1. Score de adequação (0-1)
2. Descrição do protocolo adaptado
3. Resultado esperado
4. Riscos
5. Plano de monitoramento

Responda em JSON: {
  "suitability": 0.0-1.0,
  "protocol": "Descrição do protocolo DIMHEX adaptado ao caso",
  "expectedOutcome": "Resultado esperado",
  "risks": ["Risco 1", "Risco 2"],
  "monitoringPlan": ["Monitoramento 1", "Monitoramento 2"],
  "confidenceScore": 0.0-1.0
}`;

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      suitability: typeof parsed.suitability === 'number' ? parsed.suitability : 0.6,
      protocol: parsed.protocol || 'Protocolo DIMHEX padrão',
      expectedOutcome: parsed.expectedOutcome || '',
      risks: parsed.risks || [],
      monitoringPlan: parsed.monitoringPlan || [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.6,
    };
  } catch (error) {
    console.error('Error analyzing DIMHEX:', error);
    return {
      suitability: 0.5,
      protocol: `Protocolo DIMHEX para ${params.tumorType} estágio ${params.stage}: Coleta estratificada > Ativação de LT > Engenharia de Ac. Biespecíficos > Eritrócitos carregados.`,
      expectedOutcome: 'Potencial resposta imunológica adaptada — serviço de IA indisponível para avaliação detalhada.',
      risks: ['Reação infusão', 'Síndrome de liberação de citocinas', 'Toxicidade hepática transitória'],
      monitoringPlan: ['Hemograma completo semanal', 'Perfil imunológico (CD4/CD8)', 'Marcadores tumorais séricos', 'Função hepática e renal'],
      confidenceScore: 0,
    };
  }
}

/**
 * Prediz resposta ao tratamento baseado em perfil do paciente
 */
export async function predictTreatmentResponse(params: {
  treatment: string;
  patientProfile: {
    tumorType: string;
    stage: number;
    mutations?: string[];
    biomarkers?: string[];
    age?: number;
    comorbidities?: string[];
  };
}): Promise<{
  responseScore: number;
  survivalProbability: number;
  toxicityRisk: number;
  progressionRisk: number;
  confidenceScore: number;
  explanation: string;
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um especialista em predição de resposta terapêutica em oncologia.
Use dados clínicos, moleculares e evidência científica para predizer a probabilidade de resposta.`;

    const userPrompt = `Tratamento proposto: ${params.treatment}
Perfil do paciente:
- Tumor: ${params.patientProfile.tumorType}
- Estágio: ${params.patientProfile.stage}
- Mutações: ${params.patientProfile.mutations?.join(', ') || 'Nenhuma'}
- Biomarcadores: ${params.patientProfile.biomarkers?.join(', ') || 'Não avaliados'}
- Idade: ${params.patientProfile.age || 'Não informada'}
- Comorbidades: ${params.patientProfile.comorbidities?.join(', ') || 'Nenhuma'}

Forneça predições quantitativas:
Responda em JSON: {
  "responseScore": 0.0-1.0,
  "survivalProbability": 0.0-1.0 (probabilidade de sobrevida em 2 anos),
  "toxicityRisk": 0.0-1.0,
  "progressionRisk": 0.0-1.0,
  "confidenceScore": 0.0-1.0,
  "explanation": "Explicação detalhada da predição"
}`;

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      responseScore: typeof parsed.responseScore === 'number' ? parsed.responseScore : 0.5,
      survivalProbability: typeof parsed.survivalProbability === 'number' ? parsed.survivalProbability : 0.5,
      toxicityRisk: typeof parsed.toxicityRisk === 'number' ? parsed.toxicityRisk : 0.3,
      progressionRisk: typeof parsed.progressionRisk === 'number' ? parsed.progressionRisk : 0.4,
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.6,
      explanation: parsed.explanation || 'Predição não disponível',
    };
  } catch (error) {
    console.error('Error predicting treatment response:', error);
    return {
      responseScore: 0.5,
      survivalProbability: 0.5,
      toxicityRisk: 0.3,
      progressionRisk: 0.4,
      confidenceScore: 0,
      explanation: `Predição de resposta para ${params.treatment} em ${params.patientProfile.tumorType} estágio ${params.patientProfile.stage}. Serviço de IA indisponível — valores estimados.`,
    };
  }
}

/**
 * Prediz risco de toxicidade para um tratamento específico
 */
export async function predictToxicity(params: {
  treatment: string;
  patientProfile: {
    age: number;
    comorbidities?: string[];
    organFunction?: {
      hepatic?: string;
      renal?: string;
      cardiac?: string;
    };
  };
}): Promise<{
  toxicityScore: number;
  severeEventRisk: number;
  managementStrategies: string[];
  monitoringProtocol: string[];
  confidenceScore: number;
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um farmacologista oncológico especialista em toxicidade de quimioterápicos e imunoterápicos.
Avalie o risco de toxicidade baseado no perfil do paciente e tratamento proposto.`;

    const userPrompt = `Tratamento: ${params.treatment}
Perfil do paciente:
- Idade: ${params.patientProfile.age}
- Comorbidades: ${params.patientProfile.comorbidities?.join(', ') || 'Nenhuma'}
- Função Hepática: ${params.patientProfile.organFunction?.hepatic || 'Normal'}
- Função Renal: ${params.patientProfile.organFunction?.renal || 'Normal'}
- Função Cardíaca: ${params.patientProfile.organFunction?.cardiac || 'Normal'}

Forneça:
Responda em JSON: {
  "toxicityScore": 0.0-1.0,
  "severeEventRisk": 0.0-1.0,
  "managementStrategies": ["Estratégia 1", "Estratégia 2"],
  "monitoringProtocol": ["Monitoramento 1", "Monitoramento 2"],
  "confidenceScore": 0.0-1.0
}`;

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      toxicityScore: typeof parsed.toxicityScore === 'number' ? parsed.toxicityScore : 0.4,
      severeEventRisk: typeof parsed.severeEventRisk === 'number' ? parsed.severeEventRisk : 0.2,
      managementStrategies: parsed.managementStrategies || [],
      monitoringProtocol: parsed.monitoringProtocol || [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.6,
    };
  } catch (error) {
    console.error('Error predicting toxicity:', error);
    return {
      toxicityScore: 0.4,
      severeEventRisk: 0.15,
      managementStrategies: [
        'Pré-hidratação',
        'Antieméticos profiláticos',
        'Monitoramento laborarial frequente',
        'Ajuste de dose baseado em função orgânica',
      ],
      monitoringProtocol: [
        'Hemograma completo antes de cada ciclo',
        'Função hepática (TGO, TGO, FA, GGT) semanal',
        'Função renal (creatinina, ureia) semanal',
        'Eletrocardiograma basal e a cada 3 ciclos',
      ],
      confidenceScore: 0,
    };
  }
}

/**
 * Recomenda estratégias de imunoterapia baseadas no perfil do paciente
 */
export async function recommendImmunotherapy(params: {
  tumorType: string;
  stage: number;
  immuneProfile?: string;
  previousTreatments?: string[];
}): Promise<{
  recommendations: Array<{
    strategy: string;
    rationale: string;
    target: string;
    expectedResponseRate: number;
    evidence: string;
  }>;
  rationale: string;
  expectedOutcome: string;
  monitoringParameters: string[];
  confidenceScore: number;
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um imunooncologista de ponta com expertise em:
- Inibidores de checkpoint (anti-PD-1, anti-PD-L1, anti-CTLA-4)
- Terapia CAR-T
- Anticorpos biespecíficos
- Vacinas terapêuticas
- Adjuvantes imunológicos

Recomende as melhores estratégias de imunoterapia baseadas no perfil do paciente.`;

    const userPrompt = `Perfil do paciente:
- Tumor: ${params.tumorType}
- Estágio: ${params.stage}
- Perfil imunológico: ${params.immuneProfile || 'Não avaliado'}
- Tratamentos anteriores: ${params.previousTreatments?.join(', ') || 'Nenhum'}

Forneça recomendações de imunoterapia:
Responda em JSON: {
  "recommendations": [
    {
      "strategy": "Nome da estratégia",
      "rationale": "Justificativa científica",
      "target": "Alvo molecular ou celular",
      "expectedResponseRate": 0.0-1.0,
      "evidence": "Nível de evidência (ex: Fase III, NEJM 2024)"
    }
  ],
  "rationale": "Racional geral para a escolha",
  "expectedOutcome": "Resultado esperado",
  "monitoringParameters": ["Parâmetro 1", "Parâmetro 2"],
  "confidenceScore": 0.0-1.0
}`;

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      rationale: parsed.rationale || '',
      expectedOutcome: parsed.expectedOutcome || '',
      monitoringParameters: parsed.monitoringParameters || [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.7,
    };
  } catch (error) {
    console.error('Error recommending immunotherapy:', error);
    return {
      recommendations: [
        {
          strategy: 'Inibidores de Checkpoint (anti-PD-1)',
          rationale: 'Primeira linha para tumores sólidos avançados',
          target: 'PD-1/PD-L1',
          expectedResponseRate: 0.4,
          evidence: 'NCCN Guidelines 2026',
        },
      ],
      rationale: `Recomendação padrão para ${params.tumorType} estágio ${params.stage}. Serviço de IA indisponível para análise personalizada.`,
      expectedOutcome: 'Resposta parcial ou completa em 30-40% dos casos',
      monitoringParameters: ['LDH sérico', 'Perfil imunológico', 'TC de controle a cada 8 semanas'],
      confidenceScore: 0,
    };
  }
}

/**
 * Recomenda aplicações de nanotecnologia em tratamento oncológico
 */
export async function recommendNanotherapy(params: {
  tumorType: string;
  stage: number;
  targetMolecules?: string[];
}): Promise<{
  recommendations: Array<{
    nanoplatform: string;
    mechanism: string;
    target: string;
    advantages: string[];
    developmentStage: string;
  }>;
  mechanism: string;
  expectedOutcome: string;
  deliveryMethod: string;
  confidenceScore: number;
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um nanotecnologista especializado em oncologia com expertise em:
- Nanopartículas lipídicas (LNP)
- Nanopartículas de ouro
- Dendrímeros
- Micelas poliméricas
- Nanocápsulas
- Antibody-drug conjugates (ADCs)

Recomende aplicações de nanotecnologia para tratamento oncológico.`;

    const userPrompt = `Perfil do paciente:
- Tumor: ${params.tumorType}
- Estágio: ${params.stage}
- Moléculas-alvo: ${params.targetMolecules?.join(', ') || 'Não especificadas'}

Forneça recomendações de nanoterapia:
Responda em JSON: {
  "recommendations": [
    {
      "nanoplatform": "Nome da plataforma nanotecnológica",
      "mechanism": "Mecanismo de ação",
      "target": "Alvo molecular",
      "advantages": ["Vantagem 1", "Vantagem 2"],
      "developmentStage": "Pré-clínico/Fase I/Fase II/Fase III/Aprovado"
    }
  ],
  "mechanism": "Mecanismo geral da abordagem recomendada",
  "expectedOutcome": "Resultado esperado",
  "deliveryMethod": "Método de entrega/administração",
  "confidenceScore": 0.0-1.0
}`;

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      mechanism: parsed.mechanism || '',
      expectedOutcome: parsed.expectedOutcome || '',
      deliveryMethod: parsed.deliveryMethod || '',
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.6,
    };
  } catch (error) {
    console.error('Error recommending nanotherapy:', error);
    return {
      recommendations: [
        {
          nanoplatform: 'Nanopartículas Lipídicas (LNP)',
          mechanism: 'Encapsulamento de quimioterápicos para entrega direcionada ao tumor via EPR effect',
          target: params.targetMolecules?.[0] || 'Células tumorais',
          advantages: ['Entrega direcionada', 'Redução de toxicidade sistêmica', 'Maior biodisponibilidade intratumoral'],
          developmentStage: 'Fase II-III',
        },
      ],
      mechanism: 'Nanopartículas exploram o efeito EPR (Enhanced Permeability and Retention) para acumular no tecido tumoral, liberando o fármaco de forma controlada.',
      expectedOutcome: 'Maior eficácia com menor toxicidade sistêmica comparado à quimioterapia convencional',
      deliveryMethod: 'Infusão intravenosa',
      confidenceScore: 0,
    };
  }
}

/**
 * Recomenda terapias complementares baseadas em evidências científicas
 */
export async function recommendComplementaryMedicine(params: {
  tumorType: string;
  primaryTreatment: string;
  patientPreferences?: string[];
}): Promise<{
  recommendations: Array<{
    therapy: string;
    evidence: string;
    mechanism: string;
    benefits: string[];
    risks: string[];
    interactionWithPrimary: string;
  }>;
  evidence: string[];
  expectedBenefits: string[];
  contraindications: string[];
  confidenceScore: number;
}> {
  try {
    const client = getClient();
    const model = 'gemini-2.0-flash';

    const systemPrompt = `Você é um especialista em medicina integrativa e complementar em oncologia.
Recomende APENAS terapias com evidência científica (estudos clínicos, meta-análises).
NÃO recomende terapias sem evidência. Seja rigoroso e científico.
Considere fitofármacos, suplementação, acupuntura, exercício, mindfulness.`;

    const userPrompt = `Perfil do paciente:
- Tumor: ${params.tumorType}
- Tratamento primário: ${params.primaryTreatment}
- Preferências do paciente: ${params.patientPreferences?.join(', ') || 'Sem preferências específicas'}

Forneça recomendações de medicina complementar baseadas em EVIDÊNCIA:
Responda em JSON: {
  "recommendations": [
    {
      "therapy": "Nome da terapia complementar",
      "evidence": "Nível de evidência (ex: Meta-análise Cochrane, ensaio clínico Fase III)",
      "mechanism": "Mecanismo de ação",
      "benefits": ["Benefício 1", "Benefício 2"],
      "risks": ["Risco 1"],
      "interactionWithPrimary": "Interações com tratamento primário"
    }
  ],
  "evidence": ["Referência 1", "Referência 2"],
  "expectedBenefits": ["Benefício geral 1", "Benefício geral 2"],
  "contraindications": ["Contraindicação 1"],
  "confidenceScore": 0.0-1.0
}`;

    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      evidence: parsed.evidence || [],
      expectedBenefits: parsed.expectedBenefits || [],
      contraindications: parsed.contraindications || [],
      confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.6,
    };
  } catch (error) {
    console.error('Error recommending complementary medicine:', error);
    return {
      recommendations: [
        {
          therapy: 'Suplementação de Vitamina D',
          evidence: 'Meta-análise de estudos observacionais',
          mechanism: 'Modulação imunológica e regulação da proliferação celular',
          benefits: ['Melhora da resposta imunológica', 'Saúde óssea durante tratamento'],
          risks: ['Hipercalcemia em doses excessivas'],
          interactionWithPrimary: 'Geralmente seguro, monitorar cálcio sérico',
        },
      ],
      evidence: ['Literatura oncológica — serviço de IA indisponível'],
      expectedBenefits: ['Suporte ao tratamento primário', 'Melhora de qualidade de vida'],
      contraindications: ['Suspender fitoterápicos 48h antes de quimioterapia'],
      confidenceScore: 0,
    };
  }
}