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
const PatientExperience = lazy(() => import('./components/PatientExperience').then(m => ({ default: m.default })));
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

  // ── 15 Hybrid Agents — PhD-level Oncology Specialists ──
  const [agents] = useState<Agent[]>([
    { id: 'a01', name: 'Dr. Oncologia Molecular', role: 'Biologia Molecular do Cancer', pid: 1001, status: 'ACTIVE', color: '#10b981', description: 'PhD — Mecanismos moleculares de resistencia a drogas, vias de sinalizacao tumoral (H=28)', prompt: 'Analise mecanismos moleculares e mutacoes driver' },
    { id: 'a02', name: 'Dr. Imunooncologia', role: 'Imunooncologia e CAR-T', pid: 1002, status: 'ACTIVE', color: '#3b82f6', description: 'PhD — Otimizacao de terapias baseadas em celulas T, checkpoint inhibitors (H=32)', prompt: 'Avalie resposta imune e estrategias imunoterapicas' },
    { id: 'a03', name: 'Dr. Nanotecnologia Medica', role: 'Nanomedicina Oncologica', pid: 1003, status: 'SYNCED', color: '#a855f7', description: 'PhD — Sistemas de entrega inteligente, teranostica, hipertermia plasmônica (H=24)', prompt: 'Projete nanopartículas para entrega direcionada' },
    { id: 'a04', name: 'Dr. Oncologia Clinica', role: 'Oncologia Clinica', pid: 1004, status: 'ACTIVE', color: '#ef4444', description: 'MD, PhD — Protocolos de tratamento, ensaios clínicos, prognóstico (H=38)', prompt: 'Defina protocolo terapeutico baseado em evidencias' },
    { id: 'a05', name: 'Dr. Patologia Oncologica', role: 'Patologia e Diagnostico Molecular', pid: 1005, status: 'SYNCED', color: '#f59e0b', description: 'MD, PhD — Histopatologia, marcadores prognósticos, classificação tumoral (H=29)', prompt: 'Analise histopatologia e marcadores tumorais' },
    { id: 'a06', name: 'Dr. Radiologia Oncologica', role: 'Radioterapia e Radiocirurgia', pid: 1006, status: 'IDLE', color: '#06b6d4', description: 'PhD — Radioterapia de intensidade modulada, SBRT, protonterapia (H=26)', prompt: 'Planeje fracionamento radioterapico otimo' },
    { id: 'a07', name: 'Dr. Bioinformatica Oncologica', role: 'Bioinformatica e Genomica', pid: 1007, status: 'ACTIVE', color: '#22d3ee', description: 'PhD — Analise de dados omicos, NGS, bioinformatica estrutural (H=22)', prompt: 'Processe dados genômicos e identifique variantes' },
    { id: 'a08', name: 'Dr. Oncologia Pediatrica', role: 'Oncologia Pediatrica', pid: 1008, status: 'IDLE', color: '#f472b6', description: 'MD, PhD — Tumores solidos pediatricos, leucemias, neuroblastoma (H=21)', prompt: 'Adapte protocolos para pacientes pediatricos' },
    { id: 'a09', name: 'Dr. Medicina Integrativa', role: 'Medicina Integrativa e Suporte', pid: 1009, status: 'IDLE', color: '#34d399', description: 'PhD — Cuidados paliativos, suporte nutricional, qualidade de vida (H=18)', prompt: 'Avalie qualidade de vida e suporte integrativo' },
    { id: 'a10', name: 'Dr. Genomica Oncologica', role: 'Genomica e Medicina de Precisao', pid: 1010, status: 'ACTIVE', color: '#8b5cf6', description: 'PhD — Sequenciamento de nova geracao, variantes somáticas, farmacogenômica (H=25)', prompt: 'Identifique mutações driver e guie terapia alvo' },
    { id: 'a11', name: 'Dr. Epidemiologia Oncologica', role: 'Epidemiologia e Saude Publica', pid: 1011, status: 'IDLE', color: '#fb923c', description: 'PhD — Estudos de coorte, rastreamento, incidência e mortalidade (H=27)', prompt: 'Analise dados epidemiologicos e fatores de risco' },
    { id: 'a12', name: 'Dr. Cirurgia Oncologica', role: 'Cirurgia Oncologica', pid: 1012, status: 'ACTIVE', color: '#f87171', description: 'MD, PhD — Cirurgia minimamente invasiva, margins cirurgicos, estadiamento (H=31)', prompt: 'Avalie ressecabilidade e tecnica cirurgica' },
    { id: 'a13', name: 'Dr. Psico-Oncologia', role: 'Psico-Oncologia', pid: 1013, status: 'IDLE', color: '#c084fc', description: 'PhD — Adesao ao tratamento, impacto psicologico, intervenções cognitivas (H=16)', prompt: 'Avalie adesao e impacto psicologico do diagnostico' },
    { id: 'a14', name: 'Dr. Farmacocinetica Oncologica', role: 'Farmacocinetica e Farmacodinamica', pid: 1014, status: 'SYNCED', color: '#fbbf24', description: 'PhD — Doseamento otimo, interacoes medicamentosas, toxicidade (H=20)', prompt: 'Calcule dose e monitore toxicidade de quimioterápicos' },
    { id: 'a15', name: 'Dr. Oncologia Translacional', role: 'Oncologia Translacional', pid: 1015, status: 'ACTIVE', color: '#60a5fa', description: 'PhD — Ponte laboratório-clínica, biomarcadores, medicina de precisão (H=28)', prompt: 'Traduza descobertas laboratoriais em aplicacao clinica' },
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
    <SharedStateContext.Provider value={{ sequence, setSequence, agents, setAgents: () => {}, addLog, clearLogs, logs }}>
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

// Hook para obter role do usuario logado
function useUserRole() {
  const { user } = useAuth();
  return user?.role ?? null;
}

// Componente para renderizar a aba ativa com lazy loading + error boundary
const ActiveTabContent = () => {
  const { activeTab, setActiveTab } = useNavigation();
  const { sequence, setSequence, agents, setAgents, addLog, clearLogs } = React.useContext(SharedStateContext);
  const userRole = useUserRole();

  const renderPanel = (key: string, element: React.ReactNode) => (
    <ErrorBoundary key={key}>
      <Suspense fallback={<PanelLoader />}>
        {element}
      </Suspense>
    </ErrorBoundary>
  );

  // Patient sees PatientExperience instead of technical DashboardHub
  if (activeTab === 'dashboard' && userRole === UserRole.PATIENT) {
    return renderPanel('patient-dashboard', <PatientExperience onNavigate={setActiveTab} />);
  }

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