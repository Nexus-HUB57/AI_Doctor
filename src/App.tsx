import React, { useState, useCallback } from 'react';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { AuthProvider, useAuth, roleLabels } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import LoginPage from './components/LoginPage';
import DashboardHub from './components/DashboardHub';
import DiagnosticPanel from './components/DiagnosticPanel';
import MedicalBoardPanel from './components/MedicalBoardPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ResearchDashboard from './components/ResearchDashboard';
import TelemedicineChatbot from './components/TelemedicineChatbot';
import MoltbookFeed from './components/MoltbookFeed';
import CerebroPanel from './components/CerebroPanel';
import LiveBookPanel from './components/LiveBookPanel';
import WormholePanel from './components/WormholePanel';
import BlackholePanel from './components/BlackholePanel';
import OncoResearchPanel from './components/OncoResearchPanel';
import EradicationPanel from './components/EradicationPanel';
import FileManager from './components/FileManager';
import type { Agent, LogMessage } from './types';

// Estado compartilhado para componentes que dependem de props
const SharedStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sequence, setSequence] = useState('AUGCGAUUCGAUCCGAAUUCGGC');
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'a1', name: 'Seq-Parser', role: 'Análise de Motifs', pid: 1001, status: 'ACTIVE', color: '#10b981', description: 'Parser de sequências biológicas', prompt: 'Analise a sequência fornecida' },
    { id: 'a2', name: 'Fold-Engine', role: 'Predição Estrutural', pid: 1002, status: 'SYNCED', color: '#3b82f6', description: 'Predição de estrutura secundária de rRNA', prompt: 'Prediga a estrutura da sequência' },
    { id: 'a3', name: 'Mut-Detector', role: 'Detecção de Mutações', pid: 1003, status: 'IDLE', color: '#f59e0b', description: 'Detecção de mutações compensatórias', prompt: 'Detecte mutações na sequência' },
  ]);
  const [logs, setLogs] = useState<LogMessage[]>([]);

  const addLog = useCallback((
    text: string,
    type: LogMessage['type'] = 'info',
    agentName?: string
  ) => {
    setLogs(prev => [...prev, {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      time: new Date().toLocaleTimeString('pt-BR'),
      text,
      type,
      agentName,
    }]);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <SharedStateContext.Provider value={{ sequence, setSequence, agents, setAgents, addLog, clearLogs, logs }}>
      {children}
    </SharedStateContext.Provider>
  );
};

interface SharedStateContextType {
  sequence: string;
  setSequence: (seq: string) => void;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  addLog: (text: string, type?: LogMessage['type'], agentName?: string) => void;
  clearLogs: () => void;
  logs: LogMessage[];
}

export const SharedStateContext = React.createContext<SharedStateContextType>({
  sequence: '',
  setSequence: () => {},
  agents: [],
  setAgents: () => {},
  addLog: () => {},
  clearLogs: () => {},
  logs: [],
});

// Componente para renderizar a aba ativa
const ActiveTabContent = () => {
  const { activeTab, setActiveTab } = useNavigation();
  const { sequence, setSequence, agents, setAgents, addLog, clearLogs } = React.useContext(SharedStateContext);

  switch (activeTab) {
    case 'dashboard':
      return <DashboardHub onNavigate={setActiveTab} />;
    case 'diagnostic':
      return <DiagnosticPanel />;
    case 'board':
      return <MedicalBoardPanel />;
    case 'analytics':
      return <AnalyticsDashboard />;
    case 'research':
      return <ResearchDashboard />;
    case 'telemedicine':
      return <TelemedicineChatbot />;
    case 'moltbook':
      return <MoltbookFeed agents={agents} addLog={addLog} />;
    case 'cerebro':
      return <CerebroPanel sequence={sequence} agents={agents} addLog={addLog} />;
    case 'wormhole':
      return <WormholePanel sequence={sequence} setSequence={setSequence} addLog={addLog} />;
    case 'blackhole':
      return <BlackholePanel sequence={sequence} setSequence={setSequence} agents={agents} setAgents={setAgents} addLog={addLog} clearLogs={clearLogs} />;
    case 'onco_research':
      return <OncoResearchPanel sequence={sequence} agents={agents} addLog={addLog} />;
    case 'eradication':
      return <EradicationPanel />;
    case 'livebook':
      return <LiveBookPanel />;
    case 'files':
      return <FileManager />;
    case 'advanced':
    default:
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
          <h3 className="text-2xl font-bold mb-2">Módulo em Desenvolvimento</h3>
          <p>O módulo "{activeTab}" está sendo preparado pela nossa junta médica.</p>
        </div>
      );
  }
};

// Guard de autenticação
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <SharedStateProvider>
          <AuthGuard>
            <MainLayout>
              <ActiveTabContent />
            </MainLayout>
          </AuthGuard>
        </SharedStateProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}