import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  color?: 'cyan' | 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  description?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'cyan',
  description,
}: StatCardProps) {
  const colorStyles: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  };

  const trendColor = trend && trend > 0 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-white">{value}</p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
                {trend > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${colorStyles[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
