import React from 'react';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import MainLayout from './components/MainLayout';
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

export default function App() {
  return (
    <NavigationProvider>
      <MainLayout>
        <ActiveTabContent />
      </MainLayout>
    </NavigationProvider>
  );
}
