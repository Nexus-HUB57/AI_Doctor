import React, { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: ReactNode;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

export default function TabGroup({
  tabs,
  activeTabId,
  onTabChange,
  variant = 'default',
}: TabGroupProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const tabStyles: Record<string, string> = {
    default: 'border-b border-slate-700',
    pills: 'gap-2',
    underline: 'border-b border-slate-700',
  };

  const tabButtonStyles: Record<string, string> = {
    default: 'border-b-2 border-transparent hover:border-slate-600 hover:text-slate-200',
    pills: 'bg-slate-800/50 hover:bg-slate-700/50 rounded-lg px-4 py-2',
    underline: 'border-b-2 border-transparent hover:border-slate-600 hover:text-slate-200',
  };

  const activeTabButtonStyles: Record<string, string> = {
    default: 'border-cyan-500 text-cyan-400',
    pills: 'bg-cyan-600 text-white',
    underline: 'border-cyan-500 text-cyan-400',
  };

  return (
    <div>
      {/* Tab List */}
      <div className={`flex gap-1 ${tabStyles[variant]} overflow-x-auto`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTabId;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-all whitespace-nowrap ${
                tabButtonStyles[variant]
              } ${isActive ? activeTabButtonStyles[variant] : 'text-slate-400'}`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab && activeTab.content}
      </div>
    </div>
  );
}
