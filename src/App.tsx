import React from 'react';
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

// Componente para renderizar a aba ativa
const ActiveTabContent = () => {
  const { activeTab, setActiveTab } = useNavigation();

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
      return <MoltbookFeed />;
    case 'cerebro':
      return <CerebroPanel />;
    case 'wormhole':
      return <WormholePanel />;
    case 'blackhole':
      return <BlackholePanel />;
    case 'onco_research':
      return <OncoResearchPanel />;
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
        <AuthGuard>
          <MainLayout>
            <ActiveTabContent />
          </MainLayout>
        </AuthGuard>
      </NavigationProvider>
    </AuthProvider>
  );
}