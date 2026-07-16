import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TabType = 
  | 'dashboard' 
  | 'diagnostic' 
  | 'board' 
  | 'analytics' 
  | 'livebook' 
  | 'telemedicine' 
  | 'research' 
  | 'advanced' 
  | 'moltbook' 
  | 'cerebro' 
  | 'wormhole' 
  | 'blackhole' 
  | 'onco_research' 
  | 'eradication'
  | 'files';

interface NavigationContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  previousTab: TabType | null;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previousTab, setPreviousTab] = useState<TabType | null>(null);

  const handleSetActiveTab = (tab: TabType) => {
    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab: handleSetActiveTab,
        sidebarOpen,
        setSidebarOpen,
        previousTab,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
