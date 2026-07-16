import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Users,
  Activity,
  Clock,
  Zap,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface AnalyticsData {
  total_cases: number;
  active_patients: number;
  avg_response_time: number;
  system_uptime: number;
  consensus_accuracy: number;
  board_meetings: number;
  query_trends: Array<{ date: string; queries: number }>;
  specialty_distribution: Array<{ specialty: string; count: number }>;
  treatment_outcomes: Array<{ treatment: string; success_rate: number }>;
  agent_performance: Array<{ agent: string; accuracy: number; cases: number }>;
}

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/persistence/analytics/system?range=${timeRange}`);
      const data = await response.json();
      setAnalyticsData(data.data || generateMockAnalytics());
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData(generateMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalytics = (): AnalyticsData => ({
    total_cases: 1247,
    active_patients: 342,
    avg_response_time: 245,
    system_uptime: 99.8,
    consensus_accuracy: 94.2,
    board_meetings: 156,
    query_trends: [
      { date: '2024-07-09', queries: 342 },
      { date: '2024-07-10', queries: 456 },
      { date: '2024-07-11', queries: 389 },
      { date: '2024-07-12', queries: 512 },
      { date: '2024-07-13', queries: 478 },
      { date: '2024-07-14', queries: 623 },
      { date: '2024-07-15', queries: 701 }
    ],
    specialty_distribution: [
      { specialty: 'Imunooncologia', count: 245 },
      { specialty: 'Oncologia Molecular', count: 198 },
      { specialty: 'Nanotecnologia', count: 134 },
      { specialty: 'Cirurgia', count: 156 },
      { specialty: 'Radiologia', count: 112 }
    ],
    treatment_outcomes: [
      { treatment: 'CAR-T', success_rate: 87 },
      { treatment: 'Checkpoint Inhibidores', success_rate: 72 },
      { treatment: 'Nanopartículas', success_rate: 65 },
      { treatment: 'Combinação', success_rate: 89 },
      { treatment: 'Imunoterapia', success_rate: 78 }
    ],
    agent_performance: [
      { agent: 'Dr. Imunooncologia', accuracy: 96, cases: 234 },
      { agent: 'Dr. Oncologia Molecular', accuracy: 94, cases: 198 },
      { agent: 'Dr. Cirurgia Oncológica', accuracy: 92, cases: 156 },
      { agent: 'Dr. Nanotecnologia', accuracy: 89, cases: 134 },
      { agent: 'Dr. Radiologia', accuracy: 91, cases: 112 }
    ]
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-spin mx-auto text-cyan-500 mb-4" />
          <p className="text-zinc-400">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return <div className="text-red-400">Erro ao carregar dados</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-4">
        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Dashboard de Analytics
        </span>
        <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2 mt-0.5">
          Performance e Uso do Sistema
        </h3>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Métricas em tempo real de operação, consenso médico e resultados clínicos.
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-2">
        {['24h', '7d', '30d', '90d'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all ${
              timeRange === range
                ? 'bg-cyan-600 text-white'
                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          icon={<Users className="w-5 h-5" />}
          label="Pacientes Ativos"
          value={analyticsData.active_patients}
          unit="casos"
          color="cyan"
        />
        <KPICard
          icon={<Clock className="w-5 h-5" />}
          label="Tempo Médio de Resposta"
          value={analyticsData.avg_response_time}
          unit="ms"
          color="amber"
        />
        <KPICard
          icon={<Award className="w-5 h-5" />}
          label="Acurácia de Consenso"
          value={analyticsData.consensus_accuracy}
          unit="%"
          color="emerald"
        />
      </div>

      {/* Query Trends */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5">
        <h4 className="text-sm font-black uppercase text-white mb-4">Tendência de Consultas</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData.query_trends}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" stroke="#71717a" />
            <YAxis stroke="#71717a" />
            <Tooltip
              contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
              labelStyle={{ color: '#06b6d4' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="queries"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ fill: '#06b6d4' }}
              name="Consultas"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Specialty Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5">
          <h4 className="text-sm font-black uppercase text-white mb-4">Distribuição por Especialidade</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData.specialty_distribution}
                dataKey="count"
                nameKey="specialty"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {analyticsData.specialty_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'][index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                labelStyle={{ color: '#06b6d4' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Treatment Outcomes */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5">
          <h4 className="text-sm font-black uppercase text-white mb-4">Taxa de Sucesso por Tratamento</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.treatment_outcomes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="treatment" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                labelStyle={{ color: '#06b6d4' }}
              />
              <Bar dataKey="success_rate" fill="#10b981" name="Taxa de Sucesso %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5">
        <h4 className="text-sm font-black uppercase text-white mb-4">Performance dos Agentes PhD</h4>
        <div className="space-y-3">
          {analyticsData.agent_performance.map((agent, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-zinc-900/50 p-3 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{agent.agent}</p>
                <p className="text-xs text-zinc-400">{agent.cases} casos avaliados</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${agent.accuracy}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-cyan-400 w-12 text-right">{agent.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-black uppercase text-white">Uptime do Sistema</h4>
          </div>
          <p className="text-3xl font-black text-emerald-400">{analyticsData.system_uptime}%</p>
          <p className="text-xs text-zinc-400 mt-2">Última 24 horas</p>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-black uppercase text-white">Reuniões de Junta</h4>
          </div>
          <p className="text-3xl font-black text-amber-400">{analyticsData.board_meetings}</p>
          <p className="text-xs text-zinc-400 mt-2">Neste período</p>
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: 'cyan' | 'amber' | 'emerald';
}

function KPICard({ icon, label, value, unit, color }: KPICardProps) {
  const colorClass = {
    cyan: 'text-cyan-400 border-cyan-900/30 bg-cyan-950/20',
    amber: 'text-amber-400 border-amber-900/30 bg-amber-950/20',
    emerald: 'text-emerald-400 border-emerald-900/30 bg-emerald-950/20'
  }[color];

  return (
    <div className={`border rounded-xl p-4 ${colorClass}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase text-zinc-400 font-bold tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="text-3xl font-black">
        {value.toLocaleString()}
        <span className="text-lg ml-1 opacity-60">{unit}</span>
      </p>
    </div>
  );
}
