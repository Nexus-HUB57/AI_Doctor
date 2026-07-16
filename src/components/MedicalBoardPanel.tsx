import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Zap,
  TrendingUp,
  Award,
  BookOpen,
  FileText
} from 'lucide-react';
import { trpc } from '../trpc/client';

interface BoardMember {
  id: string;
  name: string;
  specialty: string;
  expertise: string[];
  credentials: string;
  hIndex: number;
  publications?: number;
}

interface DiscussionEntry {
  agentId: string;
  agentName: string;
  specialty: string;
  analysis: string;
  recommendation: string;
  confidenceScore: number;
  rationale: string;
}

interface BoardConsensus {
  case_id: string;
  board_date: string;
  participating_members: BoardMember[];
  discussions: DiscussionEntry[];
  primary_recommendation: string;
  consensus_summary: string;
  consensus_level: number;
  confidence_score: number;
  dissents: string[];
  alternativeRecommendations: string[];
}

export default function MedicalBoardPanel() {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [consensus, setConsensus] = useState<BoardConsensus | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'discussion' | 'consensus'>('members');
  const [tumorType, setTumorType] = useState('melanoma');
  const [stage, setStage] = useState(4);
  const [mutations, setMutations] = useState('BRAF V600E, PD-L1 Alto');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBoardMembers();
  }, []);

  const fetchBoardMembers = async () => {
    try {
      const members = await trpc.board.members.list.query();
      setBoardMembers(members.length > 0 ? members : generateFallbackMembers());
    } catch (err) {
      console.error('Error fetching board members:', err);
      setBoardMembers(generateFallbackMembers());
    }
  };

  const generateFallbackMembers = (): BoardMember[] => [
    { id: 'agent_001', name: 'Dr. Imunooncologia', specialty: 'Imunooncologia', expertise: ['CAR-T', 'Checkpoint Inhibidores', 'Microambiente Tumoral'], credentials: 'PhD em Imunologia, Pós-doc em Imunooncologia', hIndex: 32, publications: 156 },
    { id: 'agent_002', name: 'Dr. Oncologia Molecular', specialty: 'Oncologia Molecular', expertise: ['Mutações', 'Vias de Sinalização', 'Farmacogenômica'], credentials: 'PhD em Biologia Molecular, Pós-doc em Oncologia', hIndex: 28, publications: 127 },
    { id: 'agent_003', name: 'Dr. Cirurgia Oncológica', specialty: 'Cirurgia Oncológica', expertise: ['Ressecção Tumoral', 'Cirurgia Minimamente Invasiva'], credentials: 'MD, PhD em Cirurgia Oncológica', hIndex: 31, publications: 142 },
    { id: 'agent_004', name: 'Dr. Nanotecnologia', specialty: 'Nanotecnologia em Oncologia', expertise: ['Nanopartículas', 'Entrega de Fármacos', 'Teranóstica'], credentials: 'PhD em Engenharia Biomédica', hIndex: 24, publications: 98 },
    { id: 'agent_005', name: 'Dr. Patologia Oncológica', specialty: 'Patologia Oncológica', expertise: ['Histopatologia', 'Diagnóstico Molecular', 'Marcadores Prognósticos'], credentials: 'MD, PhD em Patologia', hIndex: 29, publications: 134 },
    { id: 'agent_006', name: 'Dr. Oncologia Clínica', specialty: 'Oncologia Clínica', expertise: ['Protocolos de Tratamento', 'Ensaios Clínicos', 'Prognóstico'], credentials: 'MD, PhD em Oncologia', hIndex: 38, publications: 189 },
  ];

  const stageMap: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

  const initiateBoardMeeting = async () => {
    setLoading(true);
    setError('');

    try {
      const mutationList = mutations.split(',').map(m => m.trim()).filter(Boolean);

      // 1. Montar a junta com especialistas relevantes
      const board = await trpc.board.assemble.mutate({
        tumorType,
        stage,
        mutations: mutationList,
      });

      // 2. Iniciar discussão — cada especialista dá sua perspectiva via Gemini
      const discussionResult = await trpc.board.discuss.mutate({
        boardId: board.boardId,
        topic: `Abordagem terapêutica para ${tumorType} estágio ${stageMap[stage] || stage}`,
        patientProfile: {
          tumorType,
          stage,
          mutations: mutationList,
        },
      });

      // 3. Gerar relatório consolidado
      const report = await trpc.board.report.query({
        boardId: board.boardId,
      });

      // 4. Montar resultado para a UI
      const discussions: DiscussionEntry[] = (discussionResult.perspectives || []).map((p: any) => ({
        agentId: p.agentId,
        agentName: p.agentName,
        specialty: p.specialty,
        analysis: p.analysis,
        recommendation: p.recommendation,
        confidenceScore: p.confidenceScore,
        rationale: p.rationale,
      }));

      const consensusLevelNum = discussionResult.consensus || 0;

      setConsensus({
        case_id: board.boardId,
        board_date: new Date().toISOString(),
        participating_members: (board.members || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          specialty: m.specialty,
          expertise: m.expertise || [],
          credentials: m.credentials || '',
          hIndex: m.hIndex || 0,
        })),
        discussions,
        primary_recommendation: discussionResult.majorityOpinion || report.recommendations?.[0] || 'Recomendação não disponível',
        consensus_summary: discussionResult.consensusSummary || report.summary || '',
        consensus_level: consensusLevelNum,
        confidence_score: consensusLevelNum,
        dissents: discussionResult.dissents || [],
        alternativeRecommendations: discussionResult.alternativeRecommendations || [],
      });

      setActiveTab('discussion');
    } catch (err: any) {
      console.error('Error initiating board meeting:', err);
      setError(err?.message || 'Erro ao iniciar reunião da junta médica');
      setConsensus(generateFallbackConsensus());
      setActiveTab('discussion');
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackConsensus = (): BoardConsensus => ({
    case_id: 'case_fallback',
    board_date: new Date().toISOString(),
    participating_members: boardMembers,
    discussions: boardMembers.slice(0, 4).map(m => ({
      agentId: m.id,
      agentName: m.name,
      specialty: m.specialty,
      analysis: `Análise de ${m.specialty} para ${tumorType} estágio ${stageMap[stage] || stage}.`,
      recommendation: 'Recomendação indisponível — serviço de IA não configurado.',
      confidenceScore: 0.3,
      rationale: 'Fallback local. Configure GEMINI_API_KEY para análises reais.',
    })),
    primary_recommendation: 'Configure a API Gemini para obter recomendações reais dos especialistas.',
    consensus_summary: 'Modo fallback ativo. As perspectivas dos especialistas são geradas localmente sem integração com IA.',
    consensus_level: 0.3,
    confidence_score: 0.3,
    dissents: [],
    alternativeRecommendations: [],
  });

  const getConsensusLabel = (level: number): { label: string; color: string } => {
    if (level >= 0.85) return { label: 'Unânime', color: 'emerald' };
    if (level >= 0.65) return { label: 'Maioria', color: 'amber' };
    if (level >= 0.45) return { label: 'Dividido', color: 'orange' };
    return { label: 'Sem Consenso', color: 'red' };
  };

  const consensusInfo = consensus ? getConsensusLabel(consensus.consensus_level) : null;

  return (
    <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 flex flex-col gap-5 text-white">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-4">
        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-1">
          <Users className="w-3 h-3" />
          Junta Médica PhD
        </span>
        <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2 mt-0.5">
          Orquestração de Consenso Clínico
        </h3>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          15 especialistas virtuais com personas reais. Discussão via Gemini API com cálculo de consenso.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-950/30 border border-red-900/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-red-400">Erro na Junta Médica</p>
            <p className="text-xs text-red-300/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-900 pb-3">
        {(['members', 'discussion', 'consensus'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer ${
              activeTab === tab
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab === 'members' && 'Membros'}
            {tab === 'discussion' && 'Discussão'}
            {tab === 'consensus' && 'Consenso'}
          </button>
        ))}
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2">Tipo de Tumor</label>
              <select
                value={tumorType}
                onChange={(e) => setTumorType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="melanoma">Melanoma Metastático</option>
                <option value="breast">Câncer de Mama Triplo-Negativo</option>
                <option value="nsclc">Adenocarcinoma Pulmonar (NSCLC)</option>
                <option value="glioblastoma">Glioblastoma</option>
                <option value="colorectal">Câncer Colorretal</option>
                <option value="lymphoma">Linfoma Difuso de Grandes Células B</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2">Estágio</label>
              <select
                value={stage}
                onChange={(e) => setStage(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value={1}>Estágio I</option>
                <option value={2}>Estágio II</option>
                <option value={3}>Estágio III</option>
                <option value={4}>Estágio IV</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2">Mutações / Biomarcadores (separados por vírgula)</label>
            <input
              type="text"
              value={mutations}
              onChange={(e) => setMutations(e.target.value)}
              placeholder="Ex: BRAF V600E, PD-L1 Alto, KRAS G12C"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-cyan-400">
              Especialistas Disponíveis ({boardMembers.length})
            </h4>
            <p className="text-[10px] text-zinc-500">
              A junta será montada automaticamente com os 6 especialistas mais relevantes para o caso.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {boardMembers.map((member) => (
                <div key={member.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-white text-sm">{member.name}</p>
                      <p className="text-xs text-cyan-400 font-mono">{member.specialty}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-950/30 px-2 py-1 rounded">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">h{member.hIndex}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2">{member.credentials}</p>
                  <div className="flex flex-wrap gap-1">
                    {(member.expertise || []).slice(0, 3).map((area, idx) => (
                      <span key={idx} className="text-[9px] bg-cyan-950/30 text-cyan-300 px-2 py-0.5 rounded">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={initiateBoardMeeting}
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 text-white font-black py-3 rounded-lg text-xs font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/20"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                Consultando Especialistas via Gemini...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Iniciar Reunião de Junta Médica
              </>
            )}
          </button>
        </div>
      )}

      {/* Discussion Tab */}
      {activeTab === 'discussion' && consensus && (
        <div className="space-y-4">
          <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-cyan-400">Discussão da Junta Médica</h4>
            </div>
            <p className="text-xs text-zinc-300">
              {consensus.discussions.length} especialistas contribuíram com suas perspectivas
            </p>
          </div>

          {consensus.discussions.map((discussion, idx) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{discussion.agentName}</p>
                  <p className="text-xs text-cyan-400 font-mono">{discussion.specialty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${discussion.confidenceScore >= 0.7 ? 'bg-emerald-500' : discussion.confidenceScore >= 0.4 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${discussion.confidenceScore * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${discussion.confidenceScore >= 0.7 ? 'text-emerald-400' : discussion.confidenceScore >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
                    {(discussion.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-white mb-3 italic">{discussion.recommendation}</p>

              {discussion.rationale && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold">Racional Científico:</p>
                  <p className="text-xs text-zinc-300 leading-relaxed">{discussion.rationale}</p>
                </div>
              )}

              {discussion.analysis && discussion.analysis !== discussion.rationale && (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] uppercase text-zinc-500 font-bold">Análise Detalhada:</p>
                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4">{discussion.analysis}</p>
                </div>
              )}
            </div>
          ))}

          {consensus.dissents.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-amber-400">Pontos de Discordância</h4>
              </div>
              {consensus.dissents.map((d, i) => (
                <p key={i} className="text-xs text-amber-200/80 mb-1">• {d}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consensus Tab */}
      {activeTab === 'consensus' && consensus && consensusInfo && (
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 bg-${consensusInfo.color}-950/20 border-${consensusInfo.color}-900/30`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              <h4 className="font-bold">Nível de Consenso</h4>
            </div>
            <p className="text-2xl font-black">{consensusInfo.label}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    consensus.consensus_level >= 0.85 ? 'bg-emerald-500' :
                    consensus.consensus_level >= 0.65 ? 'bg-amber-500' :
                    consensus.consensus_level >= 0.45 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${consensus.consensus_level * 100}%` }}
                />
              </div>
              <span className="text-lg font-black">{(consensus.consensus_level * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5" />
              <h4 className="font-bold text-cyan-400">Recomendação Primária</h4>
            </div>
            <p className="text-white font-mono text-sm">{consensus.primary_recommendation}</p>
          </div>

          {consensus.alternativeRecommendations.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-400 mt-0.5" />
                <h4 className="font-bold text-blue-400">Recomendações Alternativas</h4>
              </div>
              {consensus.alternativeRecommendations.map((alt, i) => (
                <p key={i} className="text-xs text-zinc-300 mb-1">• {alt}</p>
              ))}
            </div>
          )}

          {consensus.consensus_summary && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-amber-400 mt-0.5" />
                <h4 className="font-bold text-amber-400">Resumo Executivo</h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{consensus.consensus_summary}</p>
            </div>
          )}

          <button
            onClick={() => setActiveTab('members')}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-lg text-xs font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20"
          >
            <CheckCircle className="w-4 h-4" />
            Nova Reunião
          </button>
        </div>
      )}
    </div>
  );
}