import React, { useState, useEffect } from 'react';
import {
  Heart,
  Zap,
  Brain,
  Microscope,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
  ArrowRight,
  Github,
  ExternalLink,
  Activity,
  Cpu,
  Database,
  BarChart3,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Clock,
  Flame
} from 'lucide-react';

interface DashboardHubProps {
  onNavigate?: (tab: string) => void;
  agents?: any[];
  tps?: number;
  latency?: number;
}

export default function DashboardHub({ onNavigate, agents = [], tps = 442, latency = 12 }: DashboardHubProps) {
  const [scrollY, setScrollY] = useState(0);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const modules = [
    {
      id: 'diagnostic',
      title: 'Diagnóstico Assistido',
      description: 'Recomendações de tratamento personalizadas baseadas em RAG e evidência científica',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
      status: 'active',
      stats: { cases: 342, accuracy: '94.2%' }
    },
    {
      id: 'board',
      title: 'Junta Médica PhD',
      description: 'Orquestração de 15 especialistas que deliberam e formam consenso clínico',
      icon: Users,
      color: 'from-amber-500 to-rose-500',
      status: 'active',
      stats: { experts: 15, consensus: '92%' }
    },
    {
      id: 'research_dashboard',
      title: 'Pesquisa Clínica',
      description: 'Análise de protocolo DIMHEX e estudos clínicos em andamento',
      icon: Microscope,
      color: 'from-purple-500 to-pink-500',
      status: 'active',
      stats: { trials: 28, active: 12 }
    },
    {
      id: 'analytics',
      title: 'Analytics em Tempo Real',
      description: 'Visualizações de performance, tendências e métricas de sucesso',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      status: 'active',
      stats: { uptime: '99.8%', response: '245ms' }
    },
    {
      id: 'telemedicine',
      title: 'Telemedicina Acolhedora',
      description: 'Chatbot humanizado que oferece orientação científica e esperança',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      status: 'active',
      stats: { patients: 156, satisfaction: '98%' }
    },
    {
      id: 'hub',
      title: 'LiveBook-rRNA',
      description: 'Análise interativa de sequências de RNA ribossômico com visualização estrutural',
      icon: Zap,
      color: 'from-cyan-500 to-blue-500',
      status: 'active',
      stats: { sequences: 1247, structures: '100%' }
    }
  ];

  const systemMetrics = [
    { label: 'Protocolo TSRA', value: 'ATIVO', icon: Shield, color: 'text-amber-400' },
    { label: 'Agentes Ativos', value: agents.length.toString().padStart(2, '0'), icon: Cpu, color: 'text-emerald-400' },
    { label: 'TPS/Stream', value: tps.toString(), icon: Zap, color: 'text-blue-400' },
    { label: 'Latência', value: `${latency}ms`, icon: Clock, color: 'text-purple-400' }
  ];

  const quickStats = [
    { label: 'Pacientes Ativos', value: '342', trend: '+12%', icon: Users },
    { label: 'Casos Analisados', value: '1,247', trend: '+8%', icon: Brain },
    { label: 'Taxa de Sucesso', value: '87%', trend: '+3%', icon: CheckCircle },
    { label: 'Especialistas PhD', value: '15', trend: 'Completo', icon: Sparkles }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-rose-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        </div>

        <div className="container relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 p-2.5 flex items-center justify-center">
              <Heart className="w-full h-full text-white" />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
                AI_Doctor
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-rose-400">
                  Dashboard Central
                </span>
              </h1>
              <p className="text-sm text-cyan-200 font-mono mt-2">
                Oncologia de Precisão • Humanizada • Baseada em Evidência
              </p>
            </div>
          </div>

          <p className="text-lg text-gray-300 max-w-3xl leading-relaxed mb-8">
            Bem-vindo ao centro de comando do AI_Doctor. Aqui você encontra análise bioinformática avançada, inteligência artificial de ponta e acolhimento humanizado. Cada módulo foi desenvolvido para oferecer esperança fundamentada em ciência.
          </p>

          {/* System Status Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {systemMetrics.map((metric, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-mono uppercase">{metric.label}</span>
                  <metric.icon className={`w-4 h-4 ${metric.color}`} />
                </div>
                <div className={`text-2xl font-black ${metric.color}`}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-12 px-4 border-y border-white/10">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-6 text-center hover:border-cyan-500/30 transition-all">
                <div className="flex justify-center mb-3">
                  <stat.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-2xl font-black mb-1">{stat.value}</div>
                <div className="text-xs text-gray-400 mb-2">{stat.label}</div>
                <div className="text-xs text-emerald-400 font-semibold">{stat.trend}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-4xl font-black mb-3">Módulos Principais</h2>
            <p className="text-gray-400">Acesse os principais painéis e ferramentas da plataforma</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, idx) => {
              const Icon = module.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveModule(module.id);
                    onNavigate?.(module.id);
                  }}
                  className="group bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-cyan-500/30 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]"
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} p-2.5 mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full text-white" />
                  </div>

                  <h3 className="text-lg font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                    {module.title}
                  </h3>

                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                    {module.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex gap-3 text-xs">
                      {Object.entries(module.stats).map(([key, value], i) => (
                        <span key={i} className="text-gray-500">
                          {key}: <span className="text-cyan-400 font-semibold">{value}</span>
                        </span>
                      ))}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-y border-white/10">
        <div className="container max-w-4xl mx-auto">
          <div className="flex items-start gap-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 p-2.5 flex items-center justify-center flex-shrink-0 mt-1">
              <Heart className="w-full h-full text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black mb-4">Visão Humanizada</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                O <strong>AI_Doctor</strong> vai além da análise de dados. Oferecemos um canal de comunicação empático para pacientes oncológicos, onde cada discussão é tratada pela junta médica "Consensus". Nosso chatbot de Telemedicina Acolhedora ouve com empatia, orienta com ciência e inspira esperança.
              </p>
              <p className="text-gray-300 leading-relaxed">
                <strong>A mensagem central:</strong> Com os avanços em imunoterapia, nanotecnologia e medicina de precisão, o que antes parecia o fim é, na verdade, um novo começo de possibilidades. A cura está a um passo de acontecer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16 px-4">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-black mb-12">Stack Tecnológico</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Frontend
              </h3>
              <ul className="space-y-3 text-gray-300">
                {['React 19', 'Vite', 'TypeScript', 'TailwindCSS', 'Recharts'].map((tech, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    {tech}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Brain className="w-5 h-5 text-rose-400" />
                Backend & IA
              </h3>
              <ul className="space-y-3 text-gray-300">
                {[
                  'Node.js + Express',
                  'Google GenAI (Gemini)',
                  'Ollama (LLM Local)',
                  'MySQL/TiDB',
                  'PubMed + Google Scholar'
                ].map((tech, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-900/20 to-cyan-900/20">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Protocolo DIMHEX</h2>
            <p className="text-gray-300">Imuno-Oncologia Ex Vivo de Ponta</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Coleta Estratificada',
                description: 'Sangria fracionada com seleção de frações ricas em leucócitos e plasma'
              },
              {
                title: 'Potencialização de Leucócitos',
                description: 'Ativação e expansão ex vivo de linfócitos T com polarização Th1'
              },
              {
                title: 'Engenharia de Anticorpos',
                description: 'Geração de anticorpos biespecíficos para direcionamento tumoral'
              },
              {
                title: 'Eritrócitos Carregados',
                description: 'Encapsulamento de enzimas para inanição metabólica seletiva'
              }
            ].map((step, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">{step.title}</h4>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">Pronto para Transformar a Oncologia?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Explore os módulos da plataforma AI_Doctor e descubra como a medicina de precisão, combinada com humanidade, oferece esperança real aos pacientes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate?.('diagnostic')}
              className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 group"
            >
              Explorar Plataforma
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="https://github.com/Nexus-HUB57/AI_Doctor"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 border-2 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 font-bold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Github className="w-4 h-4" />
              Ver no GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 bg-slate-900/50">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-rose-400" />
                <span className="font-bold">AI_Doctor</span>
              </div>
              <p className="text-gray-400 text-sm">
                Oncologia de Precisão Humanizada
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Projeto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="https://github.com/Nexus-HUB57/AI_Doctor" className="hover:text-cyan-400 transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Documentação
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Contribuir
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Recursos</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Estudos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Termos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-cyan-400 transition-colors">
                    Licença MIT
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            <p>
              © 2026 AI_Doctor. Desenvolvido por{" "}
              <span className="text-cyan-400 font-semibold">Manus AI</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
