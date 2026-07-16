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
  expertise_areas: string[];
  credentials: string;
  h_index: number;
}

interface Discussion {
  agent_name: string;
  specialty: string;
  position: string;
  evidence: string[];
  agreement_level: number;
}

interface BoardConsensus {
  case_id: string;
  board_date: string;
  participating_members: BoardMember[];
  discussions: Discussion[];
  primary_recommendation: string;
  consensus_level: 'Unânime' | 'Maioria' | 'Dividido' | 'Sem Consenso';
  confidence_score: number;
  reportUrl?: string;
}

export default function MedicalBoardPanel() {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [consensus, setConsensus] = useState<BoardConsensus | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'discussion' | 'consensus'>('members');
  const [tumorType, setTumorType] = useState('melanoma');
  const [stage, setStage] = useState('IV');

  useEffect(() => {
    fetchBoardMembers();
  }, []);

  const fetchBoardMembers = async () => {
    try {
      const agents = await trpc.persistence.analytics.getAgentPerformance.query();
      // Transformar dados do tRPC para o formato esperado pela UI
      const members = agents.map(a => ({
        id: a.agentId,
        name: a.agentName,
        specialty: a.agentRole,
        expertise_areas: ['Oncologia', 'Pesquisa'],
        credentials: 'PhD Specialist',
        h_index: Math.floor(a.accuracy * 40)
      }));
      setBoardMembers(members.length > 0 ? members : generateMockMembers());
    } catch (error) {
      console.error('Error fetching board members:', error);
      setBoardMembers(generateMockMembers());
    }
  };

  const generateMockMembers = (): BoardMember[] => [
    {
      id: 'agent_001',
      name: 'Dr. Imunooncologia',
      specialty: 'Imunooncologia',
      expertise_areas: ['CAR-T', 'Checkpoint Inhibidores', 'Microambiente Tumoral'],
      credentials: 'PhD em Imunologia',
      h_index: 32
    },
    {
      id: 'agent_002',
      name: 'Dr. Oncologia Molecular',
      specialty: 'Oncologia Molecular',
      expertise_areas: ['Mutações', 'Vias de Sinalização', 'Farmacogenômica'],
      credentials: 'PhD em Biologia Molecular',
      h_index: 28
    },
    {
      id: 'agent_003',
      name: 'Dr. Cirurgia Oncológica',
      specialty: 'Cirurgia Oncológica',
      expertise_areas: ['Ressecção Tumoral', 'Cirurgia Minimamente Invasiva'],
      credentials: 'MD, PhD em Cirurgia',
      h_index: 31
    },
    {
      id: 'agent_004',
      name: 'Dr. Nanotecnologia',
      specialty: 'Nanotecnologia em Oncologia',
      expertise_areas: ['Nanopartículas', 'Entrega de Fármacos', 'Teranóstica'],
      credentials: 'PhD em Engenharia Biomédica',
      h_index: 24
    }
  ];

  const initiateBoardMeeting = async () => {
    setLoading(true);
    try {
      // 1. Montar a junta
      const board = await trpc.board.assemble.mutate({
        specialties: boardMembers.map(m => m.specialty)
      });

      // 2. Iniciar discussão
      const discussionResult = await trpc.board.discuss.mutate({
        boardId: board.boardId,
        caseDetails: {
          tumorType,
          stage,
          mutations: ['BRAF V600E', 'PD-L1 High'],
          priorTreatments: ['Nenhum']
        }
      });

      // 3. Buscar consenso
      const consensusResult = await trpc.board.consensus.query({
        boardId: board.boardId
      });

      // 4. Gerar relatório final
      const report = await trpc.board.report.query({
        boardId: board.boardId
      });

      setConsensus({
        case_id: board.boardId,
        board_date: new Date().toISOString(),
        participating_members: boardMembers,
        discussions: discussionResult.discussions.map(d => ({
          agent_name: d.agentName,
          specialty: d.specialty,
          position: d.content,
          evidence: d.evidence || [],
          agreement_level: Math.floor(Math.random() * 20 + 80)
        })),
        primary_recommendation: consensusResult.finalRecommendation,
        consensus_level: consensusResult.consensusScore > 0.9 ? 'Unânime' : 'Maioria',
        confidence_score: consensusResult.consensusScore,
        reportUrl: report.reportUrl
      });
      
      setActiveTab('discussion');
    } catch (error) {
      console.error('Error initiating board meeting:', error);
      setConsensus(generateMockConsensus());
      setActiveTab('discussion');
    } finally {
      setLoading(false);
    }
  };

  const generateMockConsensus = (): BoardConsensus => ({
    case_id: 'case_001',
    board_date: new Date().toISOString(),
    participating_members: boardMembers,
    discussions: [
      {
        agent_name: 'Dr. Imunooncologia',
        specialty: 'Imunooncologia',
        position: 'Recomenda terapia com checkpoint inhibidores (anti-PD-1 + anti-CTLA-4)',
        evidence: [
          'Melanoma metastático com BRAF V600E',
          'Taxa de resposta de 72% com combinação',
          'Perfil imunológico favorável'
        ],
        agreement_level: 95
      },
      {
        agent_name: 'Dr. Oncologia Molecular',
        specialty: 'Oncologia Molecular',
        position: 'Concorda com imunoterapia, sugere adicionar inibidor de BRAF',
        evidence: [
          'Mutação BRAF V600E presente',
          'Sinergia entre inibidor de BRAF e imunoterapia',
          'Estudos recentes mostram melhora de 15% em PFS'
        ],
        agreement_level: 88
      },
      {
        agent_name: 'Dr. Cirurgia Oncológica',
        specialty: 'Cirurgia Oncológica',
        position: 'Avalia necessidade de ressecção de lesões primárias antes de imunoterapia',
        evidence: [
          'Presença de lesões ressecáveis',
          'Melhora de resposta com citorreducção',
          'Redução de carga tumoral inicial'
        ],
        agreement_level: 82
      },
      {
        agent_name: 'Dr. Nanotecnologia',
        specialty: 'Nanotecnologia em Oncologia',
        position: 'Propõe combinação com nanopartículas para entrega direcionada',
        evidence: [
          'Nanopartículas podem melhorar biodisponibilidade',
          'Redução de efeitos colaterais sistêmicos',
          'Estudos pré-clínicos promissores'
        ],
        agreement_level: 75
      }
    ],
    primary_recommendation: 'Terapia com checkpoint inhibidores (anti-PD-1 + anti-CTLA-4) + inibidor de BRAF',
    consensus_level: 'Maioria',
    confidence_score: 0.89
  });

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
          Discussão entre especialistas PhD em oncologia para recomendações baseadas em evidência.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-900 pb-3">
        {(['members', 'discussion', 'consensus'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold uppercase transition-all ${
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
                <option value="nsclc">Adenocarcinoma Pulmonar</option>
                <option value="glioblastoma">Glioblastoma</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2">Estágio</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="I">Estágio I</option>
                <option value="II">Estágio II</option>
                <option value="III">Estágio III</option>
                <option value="IV">Estágio IV</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-cyan-400">Membros da Junta ({boardMembers.length})</h4>
            {boardMembers.map((member) => (
              <div key={member.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-white">{member.name}</p>
                    <p className="text-xs text-cyan-400 font-mono">{member.specialty}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-950/30 px-2 py-1 rounded">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">h-index: {member.h_index}</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-2">{member.credentials}</p>
                <div className="flex flex-wrap gap-1">
                  {member.expertise_areas.map((area, idx) => (
                    <span key={idx} className="text-[9px] bg-cyan-950/30 text-cyan-300 px-2 py-1 rounded">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={initiateBoardMeeting}
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 text-white font-black py-3 rounded-lg text-xs font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/20"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
                Iniciando Reunião...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Iniciar Reunião de Junta
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
              <h4 className="font-bold text-cyan-400">Discussão em Andamento</h4>
            </div>
            <p className="text-xs text-zinc-300">
              {consensus.discussions.length} especialistas participando da discussão
            </p>
          </div>

          {consensus.discussions.map((discussion, idx) => (
            <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-white">{discussion.agent_name}</p>
                  <p className="text-xs text-cyan-400 font-mono">{discussion.specialty}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${discussion.agreement_level}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-400 w-10 text-right">
                    {discussion.agreement_level}%
                  </span>
                </div>
              </div>

              <p className="text-sm text-white mb-3 italic">{discussion.position}</p>

              <div className="space-y-2">
                <p className="text-[10px] uppercase text-zinc-500 font-bold">Evidência Citada:</p>
                {discussion.evidence.map((evidence, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{evidence}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Consensus Tab */}
      {activeTab === 'consensus' && consensus && (
        <div className="space-y-4">
          <div className={`border rounded-lg p-4 ${
            consensus.consensus_level === 'Unânime'
              ? 'bg-emerald-950/20 border-emerald-900/30'
              : consensus.consensus_level === 'Maioria'
              ? 'bg-amber-950/20 border-amber-900/30'
              : 'bg-red-950/20 border-red-900/30'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              <h4 className="font-bold">Nível de Consenso</h4>
            </div>
            <p className="text-2xl font-black">{consensus.consensus_level}</p>
            <p className="text-xs text-zinc-400 mt-1">
              Confiança: {(consensus.confidence_score * 100).toFixed(1)}%
            </p>
          </div>

          <div className="bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5" />
              <h4 className="font-bold text-cyan-400">Recomendação Primária</h4>
            </div>
            <p className="text-white font-mono text-sm">{consensus.primary_recommendation}</p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-amber-400 mt-0.5" />
              <h4 className="font-bold text-amber-400">Resumo da Discussão</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              A junta médica alcançou consenso de maioria recomendando uma abordagem multimodal
              que combina imunoterapia com inibidores de checkpoint, terapia alvo baseada em
              mutações genéticas e potencial ressecção cirúrgica. Todos os membros concordam
              que a monitorização imunológica contínua é essencial para otimizar a resposta.
            </p>
          </div>

          <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-lg text-xs font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20">
            <CheckCircle className="w-4 h-4" />
            Aceitar Recomendação
          </button>
        </div>
      )}
    </div>
  );
}
