import React from 'react';
import {
  Heart,
  Brain,
  Users,
  TrendingUp,
  Microscope,
  MessageSquare,
  Zap,
  Dna,
  LayoutGrid,
  BrainCircuit,
  Bell,
  Search,
} from 'lucide-react';
import { useNavigation, type TabType } from '../contexts/NavigationContext';

interface ModuleInfo {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

const moduleInfo: Record<TabType, ModuleInfo> = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard Hub',
    icon: LayoutGrid,
    description: 'Central de controle e monitoramento do sistema',
    color: 'from-blue-500 to-cyan-500',
  },
  diagnostic: {
    id: 'diagnostic',
    label: 'Diagnóstico Assistido',
    icon: Brain,
    description: 'Análise inteligente com RAG e recomendações clínicas',
    color: 'from-blue-500 to-cyan-500',
  },
  board: {
    id: 'board',
    label: 'Junta Médica PhD',
    icon: Users,
    description: 'Consenso de 15 especialistas virtuais',
    color: 'from-amber-500 to-rose-500',
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics em Tempo Real',
    icon: TrendingUp,
    description: 'Métricas, tendências e performance do sistema',
    color: 'from-green-500 to-emerald-500',
  },
  livebook: {
    id: 'livebook',
    label: 'LiveBook-rRNA',
    icon: Dna,
    description: 'Análise interativa de sequências de RNA ribossômico',
    color: 'from-cyan-500 to-blue-500',
  },
  telemedicine: {
    id: 'telemedicine',
    label: 'Telemedicina Acolhedora',
    icon: MessageSquare,
    description: 'Chat humanizado com suporte empático',
    color: 'from-rose-500 to-pink-500',
  },
  research: {
    id: 'research',
    label: 'Research Dashboard',
    icon: Microscope,
    description: 'Protocolo DIMHEX e estudos clínicos',
    color: 'from-purple-500 to-pink-500',
  },
  advanced: {
    id: 'advanced',
    label: 'Painéis Avançados',
    icon: BrainCircuit,
    description: 'Análises avançadas: Cérebro, Wormhole, Blackhole',
    color: 'from-purple-600 to-pink-600',
  },
  moltbook: {
    id: 'moltbook',
    label: 'MoltBook Feed',
    icon: Zap,
    description: 'Feed social de agentes e análises',
    color: 'from-yellow-500 to-orange-500',
  },
  cerebro: {
    id: 'cerebro',
    label: 'CerebroPanel',
    icon: BrainCircuit,
    description: 'Análise cerebral avançada',
    color: 'from-purple-500 to-blue-500',
  },
  wormhole: {
    id: 'wormhole',
    label: 'WormholePanel',
    icon: Zap,
    description: 'Análise dimensional de dados',
    color: 'from-cyan-500 to-purple-500',
  },
  blackhole: {
    id: 'blackhole',
    label: 'BlackholePanel',
    icon: Zap,
    description: 'Análise extrema de padrões',
    color: 'from-gray-600 to-gray-900',
  },
  onco_research: {
    id: 'onco_research',
    label: 'OncoResearchPanel',
    icon: Microscope,
    description: 'Pesquisa oncológica avançada',
    color: 'from-red-500 to-pink-500',
  },
  eradication: {
    id: 'eradication',
    label: 'EradicationPanel',
    icon: Zap,
    description: 'Estratégias de erradicação tumoral',
    color: 'from-orange-500 to-red-500',
  },
};

export default function TopBar() {
  const { activeTab } = useNavigation();
  const module = moduleInfo[activeTab];
  const Icon = module.icon;

  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
      {/* Left: Module Info */}
      <div className="flex items-center gap-4 flex-1">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} p-2.5 flex items-center justify-center shadow-lg`}>
          <Icon className="w-full h-full text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">{module.label}</h2>
          <p className="text-sm text-slate-400">{module.description}</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 hover:border-slate-600/50 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-32"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </button>

        {/* User Status */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-700/50">
          <div className="text-right">
            <p className="text-xs text-slate-400">Status</p>
            <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Online
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
