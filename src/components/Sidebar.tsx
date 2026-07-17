import React from 'react';
import {
  Heart,
  Brain,
  Users,
  TrendingUp,
  Microscope,
  MessageSquare,
  Menu,
  X,
  Zap,
  Dna,
  LayoutGrid,
  BrainCircuit,
  LogOut,
  HardDrive,
  Shield,
} from 'lucide-react';
import { useNavigation, type TabType } from '../contexts/NavigationContext';
import { useAuth, roleLabels } from '../contexts/AuthContext';

interface Module {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  category: 'main' | 'advanced';
}

const modules: Module[] = [
  {
    id: 'dashboard',
    label: 'Dashboard Hub',
    icon: LayoutGrid,
    description: 'Central de controle',
    category: 'main',
  },
  {
    id: 'diagnostic',
    label: 'Diagnóstico Assistido',
    icon: Brain,
    description: 'Análise com RAG',
    category: 'main',
  },
  {
    id: 'board',
    label: 'Junta Médica PhD',
    icon: Users,
    description: '15 especialistas',
    category: 'main',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    description: 'Métricas em tempo real',
    category: 'main',
  },
  {
    id: 'livebook',
    label: 'LiveBook-rRNA',
    icon: Dna,
    description: 'Análise molecular',
    category: 'main',
  },
  {
    id: 'telemedicine',
    label: 'Telemedicina',
    icon: MessageSquare,
    description: 'Chat humanizado',
    category: 'main',
  },
  {
    id: 'research',
    label: 'Research Dashboard',
    icon: Microscope,
    description: 'DIMHEX & Estudos',
    category: 'main',
  },
  {
    id: 'files',
    label: 'Arquivos S3',
    icon: HardDrive,
    description: 'Upload & Download',
    category: 'main',
  },
  {
    id: 'moltbook',
    label: 'MoltBook Feed',
    icon: Zap,
    description: 'Feed social',
    category: 'advanced',
  },
  {
    id: 'cerebro',
    label: 'CerebroPanel',
    icon: BrainCircuit,
    description: 'Análise cerebral',
    category: 'advanced',
  },
  {
    id: 'wormhole',
    label: 'WormholePanel',
    icon: Zap,
    description: 'Análise dimensional',
    category: 'advanced',
  },
  {
    id: 'blackhole',
    label: 'BlackholePanel',
    icon: Zap,
    description: 'Análise extrema',
    category: 'advanced',
  },
  {
    id: 'onco_research',
    label: 'OncoResearch',
    icon: Microscope,
    description: 'Pesquisa oncológica',
    category: 'advanced',
  },
  {
    id: 'eradication',
    label: 'EradicationPanel',
    icon: Zap,
    description: 'Erradicação tumoral',
    category: 'advanced',
  },
];

const roleBadgeColors: Record<string, string> = {
  patient: 'bg-green-500/20 text-green-400 border-green-500/30',
  doctor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  researcher: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen } = useNavigation();
  const { user, logout, hasPermission } = useAuth();

  const mainModules = modules.filter((m) => m.category === 'main');
  const advancedModules = modules.filter((m) => m.category === 'advanced');

  // Filtrar módulos baseados em permissões
  const filteredMainModules = mainModules.filter((m) => {
    if (m.id === 'files') {
      return hasPermission('read:files') || hasPermission('admin:all');
    }
    return true;
  });

  const handleNavigation = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair?')) {
      logout();
    }
  };

  return (
    <aside
      aria-label="Navegação principal"
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden shadow-2xl`}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/50">
          <Heart className="w-6 h-6 text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <h1 className="text-lg font-black text-white">AI_Doctor</h1>
            <p className="text-xs text-cyan-400 font-mono">v3.0</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Main Modules */}
        {sidebarOpen && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase px-3 py-2 tracking-wider">
              Módulos Principais
            </p>
          </div>
        )}

        <div className="space-y-1">
          {filteredMainModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeTab === module.id;
            return (
              <button
                key={module.id}
                onClick={() => handleNavigation(module.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/50'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-cyan-400'
                }`}
                title={sidebarOpen ? '' : module.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{module.label}</div>
                    <div className="text-xs text-slate-400 group-hover:text-slate-300 truncate">
                      {module.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Advanced Modules */}
        {sidebarOpen && (
          <div className="mt-6 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase px-3 py-2 tracking-wider">
              Avançado
            </p>
          </div>
        )}

        <div className="space-y-1">
          {advancedModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeTab === module.id;
            return (
              <button
                key={module.id}
                onClick={() => handleNavigation(module.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/50'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-purple-400'
                }`}
                title={sidebarOpen ? '' : module.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{module.label}</div>
                    <div className="text-xs text-slate-400 group-hover:text-slate-300 truncate">
                      {module.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile & Actions */}
      <div className="border-t border-slate-800 p-4 space-y-2 flex-shrink-0">
        {sidebarOpen && user && (
          <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            </div>
            <p className="text-xs text-slate-400 truncate mb-1.5">{user.email}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${roleBadgeColors[user.role] || 'bg-slate-700 text-slate-300'}`}>
              {roleLabels[user.role] || user.role}
            </span>
          </div>
        )}

        {!sidebarOpen && user && (
          <div className="flex justify-center py-2" title={`${user.name} (${roleLabels[user.role]})`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-red-900/30 hover:text-red-400 transition-all"
          title={sidebarOpen ? 'Sair da conta' : 'Logout'}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-semibold">Sair</span>}
        </button>
      </div>

      {/* Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="w-full border-t border-slate-800 p-4 flex items-center justify-center hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-slate-200"
        title={sidebarOpen ? 'Fechar sidebar' : 'Abrir sidebar'}
      >
        {sidebarOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}