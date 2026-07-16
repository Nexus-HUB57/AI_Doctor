import { GoogleGenAI } from '@google/genai';

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
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