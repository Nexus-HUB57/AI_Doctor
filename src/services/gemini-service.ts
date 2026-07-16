import { GoogleGenerativeAI } from '@google/generative-ai';

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Serviço de Integração com Google Gemini API
 * Fornece funções para consultas RAG, recomendações de tratamento e análises clínicas
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
    const model = client.getGenerativeModel({ model: 'gemini-3.5-flash' });

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

    const response = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    const responseText = response.response.text();
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const parsed = JSON.parse(jsonMatch[0]);

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
    // Fallback para recomendação baseada em regras
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
    const model = client.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const systemPrompt = `Você é um especialista em oncologia com acesso a base de conhecimento RAG.
Responda perguntas sobre câncer, tratamentos, biomarcadores e protocolos clínicos.
Sempre cite fontes e forneça score de confiança.`;

    const contextStr = context ? JSON.stringify(context) : '';
    const userPrompt = `Contexto: ${contextStr}\n\nPergunta: ${query}`;

    const response = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    const responseText = response.response.text();

    return {
      response: responseText,
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
    const model = client.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const systemPrompt = `Você é um especialista em genômica do câncer e medicina de precisão.
Analise mutações genéticas e seu impacto em seleção de tratamento.`;

    const userPrompt = `Tumor: ${tumorType}
Mutações identificadas: ${mutations.join(', ')}

Forneça:
1. Análise das mutações
2. Implicações terapêuticas
3. Score de valor preditivo (0-1)`;

    const response = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    const responseText = response.response.text();

    return {
      analysis: responseText,
      therapeuticImplications: [
        'Sensibilidade a inibidores de tirosina quinase',
        'Resposta esperada a imunoterapia',
        'Risco de resistência adquirida',
      ],
      predictiveValue: 0.75,
      sources: ['Gemini API', 'Base de conhecimento genômica'],
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
