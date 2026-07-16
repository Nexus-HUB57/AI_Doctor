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
  User,
  Settings,
} from 'lucide-react';
import { useNavigation, type TabType } from '../contexts/NavigationContext';

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
    id: 'advanced',
    label: 'Painéis Avançados',
    icon: BrainCircuit,
    description: 'Cérebro, Wormhole, etc',
    category: 'advanced',
  },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen } = useNavigation();

  const mainModules = modules.filter((m) => m.category === 'main');
  const advancedModules = modules.filter((m) => m.category === 'advanced');

  const handleNavigation = (tab: TabType) => {
    setActiveTab(tab);
  };

  return (
    <aside
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
          {mainModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeTab === module.id;
            return (
              <button
                key={module.id}
                onClick={() => handleNavigation(module.id)}
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
        {sidebarOpen && (
          <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-cyan-400" />
              <p className="text-xs font-semibold text-white truncate">Usuário Autenticado</p>
            </div>
            <p className="text-xs text-slate-400 truncate">doctor@ai-doctor.app</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800/50 hover:text-slate-100 transition-all"
            title={sidebarOpen ? '' : 'Configurações'}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold">Configurações</span>}
          </button>
        </div>

        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-red-900/30 hover:text-red-400 transition-all"
          title={sidebarOpen ? '' : 'Logout'}
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
