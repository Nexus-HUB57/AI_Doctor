import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSpecialistPerspective, calculateConsensus } from '../../src/services/gemini-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache do registry de agentes médicos
interface MedicalAgent {
  id: string;
  name: string;
  specialty: string;
  expertise_areas: string[];
  credentials: string;
  research_focus: string;
  publications_count: number;
  h_index: number;
  active: boolean;
}

let _agentsCache: MedicalAgent[] | null = null;

function loadAgents(): MedicalAgent[] {
  if (_agentsCache) return _agentsCache;
  try {
    const registryPath = path.resolve(__dirname, '../../medical_agents_registry.json');
    const raw = fs.readFileSync(registryPath, 'utf-8');
    const data = JSON.parse(raw);
    _agentsCache = (data.medical_agents || []).filter((a: MedicalAgent) => a.active);
    return _agentsCache!;
  } catch (err) {
    console.warn('[Board] Could not load agents registry:', err);
    return [];
  }
}

/**
 * Seleciona os especialistas mais relevantes para um caso clínico
 * Baseado em matching de keywords entre o caso e as áreas de expertise
 */
function selectRelevantAgents(params: {
  tumorType: string;
  stage: number;
  mutations?: string[];
  biomarkers?: string[];
}, maxAgents: number = 6): MedicalAgent[] {
  const allAgents = loadAgents();
  const tumorLower = params.tumorType.toLowerCase();
  const mutationStr = (params.mutations || []).join(' ').toLowerCase();
  const biomarkerStr = (params.biomarkers || []).join(' ').toLowerCase();

  // Sempre inclui especialistas nucleares
  const coreSpecialties = [
    'Oncologia Clínica',
    'Oncologia Molecular',
    'Imunooncologia',
    'Patologia Oncológica',
  ];

  // Mapeamento de keywords para especialidades
  const keywordMap: Record<string, string[]> = {
    'imunoterapia': ['Imunooncologia'],
    'car-t': ['Imunooncologia'],
    'checkpoint': ['Imunooncologia'],
    'nanoparticula': ['Nanotecnologia em Oncologia'],
    'nano': ['Nanotecnologia em Oncologia'],
    'radioterapia': ['Radiologia Oncológica'],
    'radiologia': ['Radiologia Oncológica'],
    'genetica': ['Genômica', 'Oncologia Molecular'],
    'genomica': ['Genômica', 'Oncologia Molecular'],
    'mutacao': ['Genômica', 'Oncologia Molecular', 'Bioinformática'],
    'biomarcador': ['Patologia Oncológica', 'Genômica'],
    'pediatrico': ['Oncologia Pediátrica'],
    'infantil': ['Oncologia Pediátrica'],
    'cirurgia': ['Cirurgia Oncológica'],
    'cirurgico': ['Cirurgia Oncológica'],
    'psicologico': ['Psico-Oncologia'],
    'mental': ['Psico-Oncologia'],
    'farmaco': ['Farmacocinética'],
    'dosagem': ['Farmacocinética'],
    'integrativa': ['Medicina Integrativa'],
    'natural': ['Medicina Integrativa'],
    'complementar': ['Medicina Integrativa'],
    'epidemiologia': ['Epidemiologia'],
    'prevencao': ['Epidemiologia'],
    'translacional': ['Oncologia Translacional'],
    'machine learning': ['Bioinformática'],
    'bioinformatica': ['Bioinformática'],
    'sequenciamento': ['Bioinformática', 'Genômica'],
  };

  const caseText = `${tumorLower} ${mutationStr} ${biomarkerStr}`;
  const matchedSpecialties = new Set<string>();

  // Adiciona especialidades nucleares
  coreSpecialties.forEach(s => matchedSpecialties.add(s));

  // Faz matching de keywords
  Object.entries(keywordMap).forEach(([keyword, specialties]) => {
    if (caseText.includes(keyword)) {
      specialties.forEach(s => matchedSpecialties.add(s));
    }
  });

  // Rankeia e seleciona agentes
  const scored = allAgents.map(agent => {
    let score = 0;
    if (matchedSpecialties.has(agent.specialty)) score += 10;
    // Bonus por relevância de expertise areas
    agent.expertise_areas.forEach(ea => {
      if (caseText.includes(ea.toLowerCase())) score += 3;
    });
    // Bonus por h-index (mais experiência)
    score += agent.h_index * 0.1;
    return { agent, score };
  }).sort((a, b) => b.score - a.score);

  return scored.slice(0, maxAgents).map(s => s.agent);
}

// In-memory store para sessões de junta
interface BoardSession {
  boardId: string;
  createdAt: Date;
  members: MedicalAgent[];
  patientProfile: any;
  perspectives: Array<{
    agentId: string;
    agentName: string;
    specialty: string;
    analysis: string;
    recommendation: string;
    confidenceScore: number;
    rationale: string;
    references: string[];
  }>;
  consensusResult: any | null;
}

const boardSessions = new Map<string, BoardSession>();

// Statistics tracking
const boardStats = {
  totalSessions: 0,
  totalConsensusReached: 0,
  specialtyCount: new Map<string, number>(),
};

/**
 * Schemas de validação para junta médica
 */
const PatientProfileSchema = z.object({
  tumorType: z.string(),
  stage: z.number(),
  mutations: z.array(z.string()).optional(),
  biomarkers: z.array(z.string()).optional(),
  age: z.number().optional(),
  comorbidities: z.array(z.string()).optional(),
});

const PerspectiveSchema = z.object({
  agentId: z.string(),
  analysis: z.string(),
  recommendation: z.string(),
  confidenceScore: z.number(),
  rationale: z.string(),
});

/**
 * Router de Junta Médica PhD
 * Implementa procedimentos para orquestração de consenso entre especialistas virtuais
 */
export const boardRouter = router({
  /**
   * Listar Membros da Junta
   */
  members: router({
    list: publicProcedure
      .query(async () => {
        const agents = loadAgents();
        return agents.map(a => ({
          id: a.id,
          name: a.name,
          specialty: a.specialty,
          hIndex: a.h_index,
          publications: a.publications_count,
          expertise: a.expertise_areas,
          credentials: a.credentials,
          researchFocus: a.research_focus,
        }));
      }),

    getBySpecialty: publicProcedure
      .input(z.object({ specialty: z.string() }))
      .query(async ({ input }) => {
        const agents = loadAgents();
        const filtered = agents.filter(a =>
          a.specialty.toLowerCase().includes(input.specialty.toLowerCase()) ||
          a.expertise_areas.some(e => e.toLowerCase().includes(input.specialty.toLowerCase()))
        );
        return filtered.map(a => ({
          id: a.id,
          name: a.name,
          specialty: a.specialty,
          hIndex: a.h_index,
          publications: a.publications_count,
          expertise: a.expertise_areas,
        }));
      }),

    getById: publicProcedure
      .input(z.object({ agentId: z.string() }))
      .query(async ({ input }) => {
        const agents = loadAgents();
        const agent = agents.find(a => a.id === input.agentId);
        if (!agent) return null;
        return {
          id: agent.id,
          name: agent.name,
          specialty: agent.specialty,
          hIndex: agent.h_index,
          publications: agent.publications_count,
          expertise: agent.expertise_areas,
          credentials: agent.credentials,
          researchFocus: agent.research_focus,
        };
      }),
  }),

  /**
   * Montar Junta para Caso Específico
   * Seleciona especialistas relevantes para o caso baseado em keyword matching
   */
  assemble: publicProcedure
    .input(z.object({
      tumorType: z.string(),
      stage: z.number(),
      mutations: z.array(z.string()).optional(),
      biomarkers: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const members = selectRelevantAgents(input, 6);
      const boardId = `board_${Date.now()}`;

      // Track specialty usage
      members.forEach(m => {
        boardStats.specialtyCount.set(
          m.specialty,
          (boardStats.specialtyCount.get(m.specialty) || 0) + 1
        );
      });
      boardStats.totalSessions++;

      // Store session
      const session: BoardSession = {
        boardId,
        createdAt: new Date(),
        members,
        patientProfile: input,
        perspectives: [],
        consensusResult: null,
      };
      boardSessions.set(boardId, session);

      return {
        boardId,
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          specialty: m.specialty,
          hIndex: m.h_index,
          publications: m.publications_count,
          expertise: m.expertise_areas,
          credentials: m.credentials,
        })),
        selectedSpecialties: members.map(m => m.specialty),
        createdAt: session.createdAt,
      };
    }),

  /**
   * Obter Perspectiva de Especialista Individual
   * Chama Gemini API com a persona do especialista do registry
   */
  perspective: publicProcedure
    .input(z.object({
      agentId: z.string(),
      patientProfile: PatientProfileSchema,
      topic: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const agents = loadAgents();
      const agent = agents.find(a => a.id === input.agentId);

      if (!agent) {
        return {
          agentId: input.agentId,
          analysis: 'Especialista não encontrado no registry.',
          recommendation: '',
          confidenceScore: 0,
          rationale: '',
          references: [],
        };
      }

      const result = await generateSpecialistPerspective({
        agent: {
          name: agent.name,
          specialty: agent.specialty,
          credentials: agent.credentials,
          research_focus: agent.research_focus,
          expertise_areas: agent.expertise_areas,
          h_index: agent.h_index,
        },
        patientProfile: input.patientProfile,
        topic: input.topic || `Caso de ${input.patientProfile.tumorType} estágio ${input.patientProfile.stage}`,
      });

      return {
        agentId: input.agentId,
        agentName: agent.name,
        specialty: agent.specialty,
        ...result,
      };
    }),

  /**
   * Discussão entre Especialistas
   * Gera perspectivas de cada membro da junta em paralelo e calcula consenso
   */
  discuss: publicProcedure
    .input(z.object({
      boardId: z.string(),
      topic: z.string(),
      patientProfile: PatientProfileSchema,
    }))
    .mutation(async ({ input }) => {
      const session = boardSessions.get(input.boardId);
      let members: MedicalAgent[];

      if (session && session.members.length > 0) {
        members = session.members;
      } else {
        // Se não tem sessão, monta uma nova junta
        members = selectRelevantAgents(input.patientProfile, 6);
      }

      // Gera perspectivas de todos os especialistas em paralelo
      const perspectivePromises = members.map(async (agent) => {
        try {
          const result = await generateSpecialistPerspective({
            agent: {
              name: agent.name,
              specialty: agent.specialty,
              credentials: agent.credentials,
              research_focus: agent.research_focus,
              expertise_areas: agent.expertise_areas,
              h_index: agent.h_index,
            },
            patientProfile: input.patientProfile,
            topic: input.topic,
          });

          return {
            agentId: agent.id,
            agentName: agent.name,
            specialty: agent.specialty,
            analysis: result.analysis,
            recommendation: result.recommendation,
            confidenceScore: result.confidenceScore,
            rationale: result.rationale,
            references: result.references,
          };
        } catch (err) {
          console.error(`[Board] Error getting perspective from ${agent.name}:`, err);
          return {
            agentId: agent.id,
            agentName: agent.name,
            specialty: agent.specialty,
            analysis: `Erro ao gerar perspectiva de ${agent.specialty}.`,
            recommendation: 'Indisponível',
            confidenceScore: 0,
            rationale: 'Erro interno do serviço.',
            references: [],
          };
        }
      });

      const perspectives = await Promise.all(perspectivePromises);

      // Calcula consenso usando Gemini
      const consensusResult = await calculateConsensus({
        perspectives,
        patientProfile: input.patientProfile,
      });

      // Identifica dissensões (especialistas com score < 0.5 de diferença da média)
      const avgConfidence = perspectives.reduce((s, p) => s + p.confidenceScore, 0) / perspectives.length;
      const dissents = perspectives
        .filter(p => Math.abs(p.confidenceScore - avgConfidence) > 0.2)
        .map(p => `${p.agentName} (${p.specialty}): Score ${(p.confidenceScore * 100).toFixed(0)}% — ${p.recommendation}`);

      // Update session
      if (session) {
        session.perspectives = perspectives;
        session.consensusResult = consensusResult;
      }

      boardStats.totalConsensusReached++;

      return {
        discussionId: `discussion_${Date.now()}`,
        topic: input.topic,
        perspectives,
        consensus: consensusResult.consensusLevel,
        majorityOpinion: consensusResult.primaryRecommendation,
        consensusSummary: consensusResult.summary,
        dissents,
        alternativeRecommendations: consensusResult.alternativeRecommendations,
      };
    }),

  /**
   * Calcular Consenso
   * Aceita perspectivas pré-geradas e calcula consenso via Gemini
   */
  consensus: publicProcedure
    .input(z.object({
      boardId: z.string(),
      perspectives: z.array(PerspectiveSchema),
    }))
    .mutation(async ({ input }) => {
      // Enriquece perspectivas com dados dos agentes
      const agents = loadAgents();
      const enrichedPerspectives = input.perspectives.map(p => {
        const agent = agents.find(a => a.id === p.agentId);
        return {
          ...p,
          agentName: agent?.name || 'Especialista',
          specialty: agent?.specialty || 'Desconhecida',
        };
      });

      // Extrai profile do board session se disponível
      const session = boardSessions.get(input.boardId);
      const patientProfile = session?.patientProfile || { tumorType: 'Desconhecido', stage: 0 };

      const result = await calculateConsensus({
        perspectives: enrichedPerspectives,
        patientProfile,
      });

      const avgConfidence = enrichedPerspectives.reduce((s, p) => s + p.confidenceScore, 0) / enrichedPerspectives.length;

      return {
        consensusLevel: result.consensusLevel,
        primaryRecommendation: result.primaryRecommendation,
        alternativeRecommendations: result.alternativeRecommendations,
        dissents: result.dissents,
        confidenceScore: result.confidenceScore,
        summary: result.summary,
        reportUrl: `/api/board/report/${input.boardId}`,
      };
    }),

  /**
   * Gerar Relatório da Junta
   */
  report: publicProcedure
    .input(z.object({
      boardId: z.string(),
      patientId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const session = boardSessions.get(input.boardId);

      if (!session) {
        return {
          reportId: `report_${Date.now()}`,
          boardId: input.boardId,
          patientId: input.patientId || '',
          title: 'Relatório não disponível',
          summary: 'Sessão de junta médica não encontrada.',
          recommendations: [],
          createdAt: new Date(),
          url: '',
        };
      }

      const consensus = session.consensusResult;
      const memberSummaries = session.perspectives.map(p => ({
        specialist: p.agentName,
        specialty: p.specialty,
        recommendation: p.recommendation,
        confidence: `${(p.confidenceScore * 100).toFixed(0)}%`,
      }));

      return {
        reportId: `report_${Date.now()}`,
        boardId: input.boardId,
        patientId: input.patientId || 'paciente_local',
        title: `Relatório da Junta Médica PhD — ${session.patientProfile.tumorType} Estágio ${session.patientProfile.stage}`,
        summary: consensus?.summary || 'Consenso não calculado.',
        recommendations: [
          ...(consensus?.primaryRecommendation ? [`Primária: ${consensus.primaryRecommendation}`] : []),
          ...(consensus?.alternativeRecommendations || []).map(a => `Alternativa: ${a}`),
        ],
        memberSummaries,
        consensusLevel: consensus?.consensusLevel || 0,
        totalSpecialists: session.members.length,
        specialties: session.members.map(m => m.specialty),
        createdAt: session.createdAt,
        url: '',
      };
    }),

  /**
   * Histórico de Juntas (in-memory)
   */
  history: publicProcedure
    .input(z.object({ patientId: z.string().optional() }).optional())
    .query(async () => {
      const sessions = Array.from(boardSessions.values()).map(s => ({
        boardId: s.boardId,
        createdAt: s.createdAt,
        tumorType: s.patientProfile?.tumorType || 'N/A',
        stage: s.patientProfile?.stage || 0,
        specialistCount: s.members.length,
        consensusLevel: s.consensusResult?.consensusLevel || 0,
        primaryRecommendation: s.consensusResult?.primaryRecommendation || '',
      }));

      return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }),

  /**
   * Comparar Recomendações de Juntas
   */
  compare: publicProcedure
    .input(z.object({
      patientId: z.string().optional(),
      boardId1: z.string(),
      boardId2: z.string(),
    }))
    .query(async ({ input }) => {
      const s1 = boardSessions.get(input.boardId1);
      const s2 = boardSessions.get(input.boardId2);

      const rec1 = s1?.consensusResult?.primaryRecommendation || '';
      const rec2 = s2?.consensusResult?.primaryRecommendation || '';

      const similarities: string[] = [];
      const differences: string[] = [];

      if (rec1 && rec2) {
        if (rec1 === rec2) {
          similarities.push('Recomendação primária idêntica');
        } else {
          differences.push(`Junta 1: ${rec1}`);
          differences.push(`Junta 2: ${rec2}`);
        }
      }

      const c1 = s1?.consensusResult?.consensusLevel || 0;
      const c2 = s2?.consensusResult?.consensusLevel || 0;
      if (Math.abs(c1 - c2) < 0.1) {
        similarities.push(`Nível de consenso similar: ${(c1*100).toFixed(0)}% vs ${(c2*100).toFixed(0)}%`);
      } else {
        differences.push(`Consenso divergente: ${(c1*100).toFixed(0)}% vs ${(c2*100).toFixed(0)}%`);
      }

      return {
        board1: {
          boardId: input.boardId1,
          recommendation: rec1,
          consensusLevel: c1,
          specialistCount: s1?.members.length || 0,
        },
        board2: {
          boardId: input.boardId2,
          recommendation: rec2,
          consensusLevel: c2,
          specialistCount: s2?.members.length || 0,
        },
        differences,
        similarities,
      };
    }),

  /**
   * Opinião de Especialista Específico (chat direto)
   */
  expertOpinion: publicProcedure
    .input(z.object({
      agentId: z.string(),
      question: z.string(),
      patientProfile: PatientProfileSchema,
    }))
    .mutation(async ({ input }) => {
      const agents = loadAgents();
      const agent = agents.find(a => a.id === input.agentId);

      if (!agent) {
        return {
          agentId: input.agentId,
          opinion: 'Especialista não encontrado.',
          reasoning: '',
          confidenceScore: 0,
          references: [],
        };
      }

      const result = await generateSpecialistPerspective({
        agent: {
          name: agent.name,
          specialty: agent.specialty,
          credentials: agent.credentials,
          research_focus: agent.research_focus,
          expertise_areas: agent.expertise_areas,
          h_index: agent.h_index,
        },
        patientProfile: input.patientProfile,
        topic: input.question,
      });

      return {
        agentId: input.agentId,
        agentName: agent.name,
        specialty: agent.specialty,
        opinion: result.analysis,
        reasoning: result.rationale,
        confidenceScore: result.confidenceScore,
        references: result.references,
        recommendation: result.recommendation,
      };
    }),

  /**
   * Debate Estruturado entre Especialistas
   */
  debate: publicProcedure
    .input(z.object({
      boardId: z.string(),
      topic: z.string(),
      agents: z.array(z.string()).optional(),
      patientProfile: z.object({
        tumorType: z.string(),
        stage: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
      const allAgents = loadAgents();
      const debateAgents = input.agents
        ? allAgents.filter(a => input.agents!.includes(a.id))
        : selectRelevantAgents(input.patientProfile, 4);

      // Rodada 1: Cada especialista dá sua opinião inicial
      const round1 = await Promise.all(debateAgents.map(async (agent) => {
        const result = await generateSpecialistPerspective({
          agent: {
            name: agent.name,
            specialty: agent.specialty,
            credentials: agent.credentials,
            research_focus: agent.research_focus,
            expertise_areas: agent.expertise_areas,
            h_index: agent.h_index,
          },
          patientProfile: input.patientProfile,
          topic: `${input.topic} — Posição inicial`,
        });
        return { agent, result };
      }));

      // Extrair as recomendações divergentes para a rodada de debate
      const allRecs = round1.map(r => r.result.recommendation);
      const uniqueRecs = [...new Set(allRecs)];

      // Rodada 2: Contra-argumentos (simplificado — passa as outras opiniões)
      const round2 = await Promise.all(debateAgents.slice(0, 3).map(async (agent) => {
        const otherOpinions = round1
          .filter(r => r.agent.id !== agent.id)
          .map(r => `${r.agent.name}: ${r.result.recommendation}`)
          .join('\n');

        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{
              role: 'user',
              parts: [{ text: `Você é ${agent.name} (${agent.specialty}).
Participando de um debate clínico sobre: ${input.topic}

Outras opiniões dos colegas:
${otherOpinions}

Sua recomendação foi: ${round1.find(r => r.agent.id === agent.id)?.result.recommendation}

Considerando as opiniões dos colegas, você mantém ou muda sua posição? Responda brevemente (2-3 frases) em JSON:
{"position": "mantem" ou "muda", "argument": "...", "finalRecommendation": "..."}` }]
            }],
            config: { responseMimeType: 'application/json' },
          });
          return JSON.parse(response.text || '{}');
        } catch {
          return { position: 'mantem', argument: '', finalRecommendation: round1.find(r => r.agent.id === agent.id)?.result.recommendation || '' };
        }
      }));

      const winner = debateAgents.find(a =>
        round2.find(r => r.finalRecommendation === round1.find(r1 => r1.agent.id === a.id)?.result.recommendation)
      );

      return {
        debateId: `debate_${Date.now()}`,
        topic: input.topic,
        arguments: round1.map(r => ({
          agentId: r.agent.id,
          agentName: r.agent.name,
          specialty: r.agent.specialty,
          position: r.result.recommendation,
          confidence: r.result.confidenceScore,
          round2Position: round2.find(r2 => r2.finalRecommendation)?.argument || '',
        })),
        conclusion: uniqueRecs.length === 1
          ? `Consenso unânime: ${uniqueRecs[0]}`
          : `Consenso parcial entre ${uniqueRecs.length} posições distintas.`,
        winner: winner?.name || debateAgents[0]?.name || '',
        consensusLevel: uniqueRecs.length === 1 ? 1.0 : Math.max(0.3, 1.0 - (uniqueRecs.length - 1) * 0.2),
      };
    }),

  /**
   * Estatísticas da Junta
   */
  statistics: publicProcedure
    .query(async () => {
      const specialtyEntries = Array.from(boardStats.specialtyCount.entries())
        .sort((a, b) => b[1] - a[1]);

      return {
        totalBoardSessions: boardStats.totalSessions,
        averageConsensusLevel: boardStats.totalConsensusReached > 0
          ? 0.78 // Placeholder — seria calculado da soma real
          : 0,
        mostActiveSpecialty: specialtyEntries[0]?.[0] || 'N/A',
        specialtyDistribution: Object.fromEntries(specialtyEntries),
        topRecommendations: [], // Seria populado das sessões
        averageResponseTime: 2.4, // Placeholder
        totalSpecialistsAvailable: loadAgents().length,
      };
    }),
});