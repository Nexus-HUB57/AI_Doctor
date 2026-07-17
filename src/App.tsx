import React, { useState, useCallback, lazy, Suspense } from 'react';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { AuthProvider, useAuth, roleLabels, UserRole } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomeExperience from './components/WelcomeExperience';
import GoLiveLoginPage from './components/GoLiveLoginPage';
import PatientOnboarding from './components/PatientOnboarding';
import type { Agent, LogMessage } from './types';

// ── Lazy-loaded panels (code splitting) ─────────────────
const DashboardHub = lazy(() => import('./components/DashboardHub').then(m => ({ default: m.default })));
const DiagnosticPanel = lazy(() => import('./components/DiagnosticPanel').then(m => ({ default: m.default })));
const MedicalBoardPanel = lazy(() => import('./components/MedicalBoardPanel').then(m => ({ default: m.default })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(m => ({ default: m.default })));
const ResearchDashboard = lazy(() => import('./components/ResearchDashboard').then(m => ({ default: m.default })));
const TelemedicineChatbot = lazy(() => import('./components/TelemedicineChatbot').then(m => ({ default: m.default })));
const MoltbookFeed = lazy(() => import('./components/MoltbookFeed').then(m => ({ default: m.default })));
const CerebroPanel = lazy(() => import('./components/CerebroPanel').then(m => ({ default: m.default })));
const LiveBookPanel = lazy(() => import('./components/LiveBookPanel').then(m => ({ default: m.default })));
const WormholePanel = lazy(() => import('./components/WormholePanel').then(m => ({ default: m.default })));
const BlackholePanel = lazy(() => import('./components/BlackholePanel').then(m => ({ default: m.default })));
const OncoResearchPanel = lazy(() => import('./components/OncoResearchPanel').then(m => ({ default: m.default })));
const EradicationPanel = lazy(() => import('./components/EradicationPanel').then(m => ({ default: m.default })));
const FileManager = lazy(() => import('./components/FileManager').then(m => ({ default: m.default })));

// ── Suspense fallback for lazy panels ───────────────────
function PanelLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]" role="status" aria-label="Carregando painel">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Carregando módulo...</p>
      </div>
    </div>
  );
}

// Estado compartilhado para componentes que dependem de props
const SharedStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sequence, setSequence] = useState('AUGCGAUUCGAUCCGAAUUCGGC');
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'a1', name: 'Seq-Parser', role: 'Análise de Motifs', pid: 1001, status: 'ACTIVE', color: '#10b981', description: 'Parser de sequências biológicas', prompt: 'Analise a sequência fornecida' },
    { id: 'a2', name: 'Fold-Engine', role: 'Predição Estrutural', pid: 1002, status: 'SYNCED', color: '#3b82f6', description: 'Predição de estrutura secundária de rRNA', prompt: 'Prediza a estrutura da sequência' },
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

// Componente para renderizar a aba ativa com lazy loading + error boundary
const ActiveTabContent = () => {
  const { activeTab, setActiveTab } = useNavigation();
  const { sequence, setSequence, agents, setAgents, addLog, clearLogs } = React.useContext(SharedStateContext);

  const renderPanel = (key: string, element: React.ReactNode) => (
    <ErrorBoundary key={key}>
      <Suspense fallback={<PanelLoader />}>
        {element}
      </Suspense>
    </ErrorBoundary>
  );

  switch (activeTab) {
    case 'dashboard':
      return renderPanel(activeTab, <DashboardHub onNavigate={setActiveTab} />);
    case 'diagnostic':
      return renderPanel(activeTab, <DiagnosticPanel />);
    case 'board':
      return renderPanel(activeTab, <MedicalBoardPanel />);
    case 'analytics':
      return renderPanel(activeTab, <AnalyticsDashboard />);
    case 'research':
      return renderPanel(activeTab, <ResearchDashboard />);
    case 'telemedicine':
      return renderPanel(activeTab, <TelemedicineChatbot />);
    case 'moltbook':
      return renderPanel(activeTab, <MoltbookFeed agents={agents} addLog={addLog} />);
    case 'cerebro':
      return renderPanel(activeTab, <CerebroPanel sequence={sequence} agents={agents} addLog={addLog} />);
    case 'wormhole':
      return renderPanel(activeTab, <WormholePanel sequence={sequence} setSequence={setSequence} addLog={addLog} />);
    case 'blackhole':
      return renderPanel(activeTab, <BlackholePanel sequence={sequence} setSequence={setSequence} agents={agents} setAgents={setAgents} addLog={addLog} clearLogs={clearLogs} />);
    case 'onco_research':
      return renderPanel(activeTab, <OncoResearchPanel sequence={sequence} agents={agents} addLog={addLog} />);
    case 'eradication':
      return renderPanel(activeTab, <EradicationPanel />);
    case 'livebook':
      return renderPanel(activeTab, <LiveBookPanel />);
    case 'files':
      return renderPanel(activeTab, <FileManager />);
    case 'advanced':
    default:
      return (
        <ErrorBoundary key={activeTab}>
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <h3 className="text-2xl font-bold mb-2">Módulo em Desenvolvimento</h3>
            <p>O módulo "{activeTab}" está sendo preparado pela nossa junta médica.</p>
          </div>
        </ErrorBoundary>
      );
  }
};

// ── Go Live Experience Gate ──────────────────────────────
// Controls the flow: Welcome → Login → Onboarding (patients) → App
const GoLiveExperience: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showWelcome, setShowWelcome] = useState(() => {
    return !sessionStorage.getItem('ai_doctor_welcomed');
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Phase 1: Cinematic Welcome (once per session)
  if (showWelcome) {
    return <WelcomeExperience onComplete={() => setShowWelcome(false)} />;
  }

  // Phase 2: Auth loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-mono">Conectando...</p>
        </div>
      </div>
    );
  }

  // Phase 3: Login (Go Live premium page)
  if (!isAuthenticated) {
    return <GoLiveLoginPage />;
  }

  // Phase 4: Patient Onboarding (first time per session, patients only)
  if (showOnboarding && user?.role === UserRole.PATIENT) {
    return (
      <PatientOnboarding
        userName={user.name}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  // Phase 5: Main Application
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <SharedStateProvider>
          <GoLiveExperience>
            <MainLayout>
              <ActiveTabContent />
            </MainLayout>
          </GoLiveExperience>
        </SharedStateProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}