import React, { useState, useEffect } from 'react';
import { 
  Microscope, 
  Activity, 
  HeartPulse, 
  FileText, 
  Settings2, 
  Award, 
  TrendingDown, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  Database,
  ArrowRightLeft,
  CheckCircle2,
  Users,
  Compass,
  Zap,
  BookOpen
} from 'lucide-react';
import { Agent } from '../types';

interface OncoResearchPanelProps {
  sequence: string;
  agents: Agent[];
  addLog: (text: string, type: 'info' | 'success' | 'warning' | 'query' | 'agent' | 'cosmic', agentName?: string) => void;
}

interface SimulationState {
  isRunning: boolean;
  progress: number;
  currentEvent: string;
  logs: string[];
  tumorLoad: number[];
  th1Response: number[];
  tregLevel: number[];
  day: number;
}

export default function OncoResearchPanel({ sequence, agents, addLog }: OncoResearchPanelProps) {
  // Select tumor type
  const [selectedTumor, setSelectedTumor] = useState<string>('melanoma');
  
  // Interactive clinical sliders
  const [dialysisFlow, setDialysisFlow] = useState<number>(65); // mL/min
  const [tregDepletion, setTregDepletion] = useState<number>(85); // %
  const [th1Expansion, setTh1Expansion] = useState<number>(50); // x
  const [conjugateDose, setConjugateDose] = useState<number>(15); // mg/kg
  const [selectedEnzyme, setSelectedEnzyme] = useState<'asparaginase' | 'arginase' | 'both'>('both');

  // Selected tab inside Oncology Panel
  const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'report' | 'ceis' | 'advisor'>('simulator');

  // Simulation state
  const [simState, setSimState] = useState<SimulationState>({
    isRunning: false,
    progress: 0,
    currentEvent: 'Aguardando inicialização do protocolo extracorpóreo.',
    logs: [],
    tumorLoad: [100],
    th1Response: [10],
    tregLevel: [35],
    day: 0
  });

  // Clinician Assistant state
  const [advisorQuery, setAdvisorQuery] = useState<string>('');
  const [advisorAnswers, setAdvisorAnswers] = useState<Array<{ q: string; a: string; time: string }>>([
    {
      q: 'Como o DIMHEX atua no microambiente tumoral imunossupressor?',
      a: 'O protocolo DIMHEX atua de forma multifacetada: 1) depletando os linfócitos Treg (CD25+FoxP3+) do sangue periférico via aférese com coluna anti-CCR8, o que remove a principal barreira celular imune; 2) reinfundindo linfócitos Th1 ativados ex-vivo que secretam IFN-γ, estimulando a apresentação de antígenos por células dendríticas; 3) degradando os aminoácidos essenciais das células cancerosas via hemácias carregadas com L-asparaginase/Arginase-1, matando as células malignas por inanição metabólica sem exacerbar a inflamação sistêmica.',
      time: '11:45:10'
    }
  ]);

  // Handle Advisor Query Submit
  const handleAdvisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorQuery.trim()) return;

    const query = advisorQuery.trim();
    let response = '';

    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('t4') || lowerQuery.includes('helper') || lowerQuery.includes('cd4')) {
      response = 'O sistema T4 (linfócitos T CD4+) é o maestro do sistema imune adaptativo. No câncer, a polarização Th1 é crucial para secretar IFN-γ e recrutar células T CD8+ citotóxicas. O DIMHEX força a diferenciação ex-vivo de T CD4+ autólogas para o fenótipo Th1 através de estimulação anti-CD3/CD28 em linha e infusão de citocinas (IL-12/IL-2), revertendo o estado de imunossupressão tumoral.';
    } else if (lowerQuery.includes('treg') || lowerQuery.includes('supressor')) {
      response = 'Linfócitos Treg (CD25+FoxP3+) infiltram o tumor e bloqueiam a ação de linfócitos citotóxicos. O DIMHEX resolve esse problema usando uma coluna de imunoafinidade magnética anti-CCR8 conectada ao circuito de diálise. CCR8 é altamente expresso em Tregs intratumorais e circulantes exaustas, permitindo sua depleção física com seletividade de até 90%, restabelecendo a vigilância imunológica.';
    } else if (lowerQuery.includes('enzima') || lowerQuery.includes('asparaginase') || lowerQuery.includes('arginase')) {
      response = 'Muitas células malignas perdem a capacidade de sintetizar asparagina ou arginina. O Módulo C do DIMHEX realiza a diálise hipotônica de hemácias do próprio paciente para encapsular L-asparaginase e Arginase-1 recombinante de alta pureza (produzidas por biofábricas públicas como Fiocruz e Butantan). Ao reinfundir essas hemácias modificadas, esgotamos esses aminoácidos no sangue circulante e no microambiente tumoral, promovendo a inanição celular tumoral seletiva.';
    } else if (lowerQuery.includes('anticorpo') || lowerQuery.includes('biespec')) {
      response = 'Os anticorpos biespecíficos (BsAb) de próxima geração no DIMHEX atuam como pontes físicas estáveis: uma extremidade se liga ao CD3 nos linfócitos T potencializados e a outra ao antígeno tumoral específico (como NY-ESO-1 no melanoma ou EGFRvIII no glioblastoma). O diferencial do DIMHEX é acoplar covalentemente essas imunoglobulinas a granzima B e perforina recombinante, potencializando a taxa de lise tumoral direta em até 100 vezes.';
    } else if (lowerQuery.includes('custo') || lowerQuery.includes('sus') || lowerQuery.includes('patente')) {
      response = 'O custo estimado do tratamento DIMHEX no SUS é de R$ 120.000 a R$ 250.000 por paciente completo (com 7 sessões), um valor 10 a 20 vezes menor que os R$ 2 a R$ 3 milhões das terapias CAR-T comerciais. A viabilidade é garantida abrindo mão de patentes e utilizando as plataformas tecnológicas públicas já instaladas (Bio-Manguinhos/Fiocruz, Butantan e CTC-USP Ribeirão Preto), promovendo total autonomia sanitária brasileira.';
    } else {
      response = 'Sua consulta de pesquisa imunooncológica foi registrada. O modelo conceitual do DIMHEX propõe uma abordagem de bio-reforço celular, enzimático e molecular integrados. Esse protocolo visa a erradicação de neoplasias refratárias utilizando a própria infraestrutura laboratorial do SUS e imunoterapia autóloga sem royalties.';
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    setAdvisorAnswers(prev => [
      { q: query, a: response, time: timeStr },
      ...prev
    ]);
    setAdvisorQuery('');
    addLog(`Análise imunooncológica sobre "${query}" executada pelo Onco-Advisor.`, 'query');
  };

  // Run Simulation loop
  useEffect(() => {
    let interval: any;
    if (simState.isRunning) {
      interval = setInterval(() => {
        setSimState(prev => {
          const nextDay = prev.day + 1;
          const nextProgress = Math.min((nextDay / 28) * 100, 100);

          // Simulation events based on day
          let event = prev.currentEvent;
          let newLog = '';
          
          if (nextDay === 1) {
            event = 'DIÁLISE INICIADA: Acesso venoso central estabelecido. Iniciando extração contínua (Aférese).';
            newLog = 'Fração de Leucócitos (Buffy Coat) e Plasma direcionados para as colunas de afinidade.';
          } else if (nextDay === 4) {
            event = 'DEPLECÇÃO DE TREGS ATIVA: Colunas magnéticas anti-CCR8 deplegando linfócitos supressores.';
            newLog = `Redução real de Tregs circulantes em ${tregDepletion}% detectada pelo citômetro em linha.`;
          } else if (nextDay === 8) {
            event = 'POTENCIALIZAÇÃO CELULAR: Células T auxiliares transfectadas com RNAm para polarização Th1 (T-bet/Eomes).';
            newLog = `Expansão de Th1 em ${th1Expansion}x ativa em biorreator contínuo.`;
          } else if (nextDay === 12) {
            event = 'ENGENHARIA DE ANTICORPOS: Ac biespecíficos conjugados com Perforina/Granzima B ativados.';
            newLog = `Anticorpos tumor-específicos ajustados para Kd de ${dialysisFlow / 100} nM. Afinidade extrema.`;
          } else if (nextDay === 16) {
            event = 'INFUSÃO DE ERITRÓCITOS: Hemácias carregadas com Enzimas recombinantes reinfundidas.';
            newLog = `Concentração sérica de asparagina e arginina reduzida a níveis indetectáveis no soro.`;
          } else if (nextDay === 20) {
            event = 'RESPOSTA IMUNE EXCEPCIONAL: Células T citotóxicas e NK infiltrando ativamente o estroma tumoral.';
            newLog = 'Lise de células malignas metastáticas confirmada por biópsia líquida em tempo real.';
          } else if (nextDay === 28) {
            event = 'PROTOCOLO DIMHEX CONCLUÍDO: Remissão tumoral maciça estabilizada. Paciente em observação.';
            newLog = 'Fim das sessões de indução. Nenhuma tempestade de citocinas sistêmica detectada.';
          }

          // Mathematical model of tumor regression based on inputs
          const baseRegression = 0.85; // Natural regression rate under treatment
          // Modifiers from sliders
          const flowMod = 1 - (dialysisFlow / 150) * 0.1;
          const depletionMod = 1 - (tregDepletion / 100) * 0.15;
          const expansionMod = 1 - (th1Expansion / 100) * 0.15;
          const doseMod = 1 - (conjugateDose / 30) * 0.1;

          const currentTumor = prev.tumorLoad[prev.tumorLoad.length - 1];
          const calculatedRegression = currentTumor * baseRegression * flowMod * depletionMod * expansionMod * doseMod;
          const nextTumor = Math.max(calculatedRegression - (nextDay > 15 ? 2.5 : 0), 0.5);

          const currentTh1 = prev.th1Response[prev.th1Response.length - 1];
          const nextTh1 = Math.min(currentTh1 + (th1Expansion / 8) * (1.2 + Math.random() * 0.4), 100);

          const currentTreg = prev.tregLevel[prev.tregLevel.length - 1];
          const nextTreg = Math.max(currentTreg - (tregDepletion / 12) * (1 + Math.random() * 0.3), 1.5);

          const updatedLogs = newLog ? [...prev.logs, `[Dia ${nextDay}] ${newLog}`] : prev.logs;

          if (nextDay >= 28) {
            clearInterval(interval);
            addLog(`[DIMHEX SIMULATION SUCCEEDED] Tumor load reduced to ${nextTumor.toFixed(1)}%. Th1 response stabilized at ${nextTh1.toFixed(0)}%.`, 'success');
            return {
              isRunning: false,
              progress: 100,
              currentEvent: 'CONCLUÍDO - PROTOCOLO BIO-OTIMIZADO FINALIZADO.',
              logs: updatedLogs,
              tumorLoad: [...prev.tumorLoad, nextTumor],
              th1Response: [...prev.th1Response, nextTh1],
              tregLevel: [...prev.tregLevel, nextTreg],
              day: 28
            };
          }

          return {
            ...prev,
            progress: nextProgress,
            currentEvent: event,
            logs: updatedLogs,
            tumorLoad: [...prev.tumorLoad, nextTumor],
            th1Response: [...prev.th1Response, nextTh1],
            tregLevel: [...prev.tregLevel, nextTreg],
            day: nextDay
          };
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [simState.isRunning, dialysisFlow, tregDepletion, th1Expansion, conjugateDose, selectedEnzyme]);

  const handleStartSimulation = () => {
    addLog(`Protocolo de Simulação DIMHEX iniciado para tumor de tipo: ${selectedTumor.toUpperCase()}.`, 'cosmic');
    setSimState({
      isRunning: true,
      progress: 0,
      currentEvent: 'DIÁLISE EXTRACTIVA INICIADA: Coleta de leucócitos e extração de plasma de paciente.',
      logs: ['[Dia 0] Conectando circuito extracorpóreo. Preparando colunas de aférese e bio-potencializadores.'],
      tumorLoad: [100],
      th1Response: [10],
      tregLevel: [35],
      day: 0
    });
  };

  const handleStopSimulation = () => {
    setSimState(prev => ({ ...prev, isRunning: false }));
    addLog('Simulação de tratamento imunooncológico pausada pelo pesquisador.', 'warning');
  };

  // Tumor metadata descriptions
  const tumors = {
    melanoma: {
      name: 'Melanoma Metastático Sólido',
      antigen: 'NY-ESO-1 / MAGE-A3',
      description: 'Alta taxa de mutações, estroma tumoral altamente imunossupressor protegido por macrófagos M2 e Tregs profundos.',
      ref: 'Módulo A (Th1) e B (ScFv) recomendados em alta intensidade.'
    },
    breast: {
      name: 'Câncer de Mama Triplo-Negativo',
      antigen: 'MUC1 / EGFR',
      description: 'Extrema agressividade clínica, ausência de receptores hormonais e HER2. Responde muito mal a terapias endócrinas tradicionais.',
      ref: 'Uso de Ertrócitos com L-asparaginase e anti-EGFR biespecífico altamente indicados.'
    },
    nsclc: {
      name: 'Adenocarcinoma Pulmonar (NSCLC)',
      antigen: 'CEA / PD-L1 de escape',
      description: 'Alta infiltração de Treg, esgotamento rápido de aminoácidos pelo TME levando a exaustão profunda de células T citotóxicas nativas.',
      ref: 'Módulo C (Eritrócitos com Arginase-1) essencial para romper a imunossupressão metabólica.'
    },
    glioblastoma: {
      name: 'Glioblastoma Multiforme (SNC)',
      antigen: 'EGFRvIII',
      description: 'Tumor cerebral altamente letal com barreira hematoencefálica intacta. Requer conjugação de anticorpos específicos com perforinas para atravessar.',
      ref: 'Requer a dose máxima de anticorpos conjugados biespecíficos.'
    }
  };

  return (
    <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 flex flex-col gap-5 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-4 gap-3">
        <div>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Protocolo DIMHEX Onco-Pesquisa SUS
          </span>
          <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2 mt-0.5">
            <Microscope className="w-6 h-6 text-rose-500 animate-pulse" />
            IMUNO-ONCOLOGIA EX VIVO
          </h3>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Plataforma de modelagem de diálise, imunomodulação adaptativa e engenharia de anticorpos biespecíficos.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg gap-1 font-mono text-[10px] font-black select-none">
          {[
            { id: 'simulator', label: 'Simulador Diálise', icon: Activity },
            { id: 'ceis', label: 'Sinergia CEIS (SUS)', icon: Users },
            { id: 'report', label: 'Estudo Científico', icon: BookOpen },
            { id: 'advisor', label: 'Onco-Advisor AI', icon: Sparkles }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded cursor-pointer transition-all duration-150 ${
                activeSubTab === tab.id 
                  ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50 shadow-sm' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. SIMULATOR SUBTAB */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Controls Col */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
            <div className="text-sm font-black uppercase tracking-wider text-rose-500 font-mono border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Settings2 className="w-4 h-4" />
              Parâmetros Clínicos
            </div>

            {/* Tumor Type Select */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-400 font-mono uppercase font-bold">Tipo de Tumor Alvo:</label>
              <select
                value={selectedTumor}
                onChange={(e) => setSelectedTumor(e.target.value)}
                disabled={simState.isRunning}
                className="bg-black/80 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 font-mono cursor-pointer"
              >
                <option value="melanoma">Melanoma Metastático Sólido</option>
                <option value="breast">Câncer de Mama Triplo-Negativo</option>
                <option value="nsclc">Adenocarcinoma Pulmonar (NSCLC)</option>
                <option value="glioblastoma">Glioblastoma Multiforme (SNC)</option>
              </select>
            </div>

            {/* Sliders */}
            <div className="space-y-3.5 mt-2">
              {/* Slider 1: Flow */}
              <div className="flex flex-col gap-1 bg-black/20 p-2 border border-zinc-950 rounded-lg">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold uppercase">Vazão de Diálise:</span>
                  <span className="text-emerald-400 font-black">{dialysisFlow} mL/min</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={dialysisFlow}
                  onChange={(e) => setDialysisFlow(parseInt(e.target.value))}
                  disabled={simState.isRunning}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <span className="text-[8px] text-zinc-500 font-mono leading-none mt-0.5">Define a taxa de troca extracorpórea de sangue total.</span>
              </div>

              {/* Slider 2: Treg depletion */}
              <div className="flex flex-col gap-1 bg-black/20 p-2 border border-zinc-950 rounded-lg">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold uppercase">Deplecção Treg (Anti-CCR8):</span>
                  <span className="text-rose-400 font-black">{tregDepletion}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="98"
                  value={tregDepletion}
                  onChange={(e) => setTregDepletion(parseInt(e.target.value))}
                  disabled={simState.isRunning}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <span className="text-[8px] text-zinc-500 font-mono leading-none mt-0.5">Taxa de filtragem e eliminação de linfócitos supressores exaustos.</span>
              </div>

              {/* Slider 3: Th1 expansion */}
              <div className="flex flex-col gap-1 bg-black/20 p-2 border border-zinc-950 rounded-lg">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold uppercase">Multiplicador Expansão Th1:</span>
                  <span className="text-cyan-400 font-black">{th1Expansion}x</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={th1Expansion}
                  onChange={(e) => setTh1Expansion(parseInt(e.target.value))}
                  disabled={simState.isRunning}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <span className="text-[8px] text-zinc-500 font-mono leading-none mt-0.5">Intensidade de proliferação celular e polarização em biorreator ex-vivo.</span>
              </div>

              {/* Slider 4: Antibody Dose */}
              <div className="flex flex-col gap-1 bg-black/20 p-2 border border-zinc-950 rounded-lg">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-400 font-bold uppercase">Dose de Ac Conjugado (BsAb):</span>
                  <span className="text-indigo-400 font-black">{conjugateDose} mg/kg</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={conjugateDose}
                  onChange={(e) => setConjugateDose(parseInt(e.target.value))}
                  disabled={simState.isRunning}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <span className="text-[8px] text-zinc-500 font-mono leading-none mt-0.5">Concentração sérica alvo do anticorpo biespecífico com perforina.</span>
              </div>

              {/* Select 2: Enzyme Package */}
              <div className="flex flex-col gap-1 bg-black/20 p-2 border border-zinc-950 rounded-lg">
                <label className="text-[10px] text-zinc-400 font-mono uppercase font-bold">Enzima em Eritrócitos:</label>
                <select
                  value={selectedEnzyme}
                  onChange={(e) => setSelectedEnzyme(e.target.value as any)}
                  disabled={simState.isRunning}
                  className="bg-black/60 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-rose-500 font-mono"
                >
                  <option value="asparaginase">L-Asparaginase (Inanição tumoral)</option>
                  <option value="arginase">Arginase-1 (Esgotamento de arginina)</option>
                  <option value="both">Complexo Duplo (Asparaginase + Arginase-1)</option>
                </select>
              </div>
            </div>

            {/* Simulation controls buttons */}
            <div className="flex gap-2 mt-auto pt-2">
              {!simState.isRunning ? (
                <button
                  onClick={handleStartSimulation}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black font-mono text-[11px] uppercase py-3 rounded-lg border border-rose-500 hover:scale-[1.02] active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(244,63,94,0.15)]"
                >
                  <Zap className="w-4 h-4 text-yellow-300 animate-pulse" />
                  Iniciar Protocolo
                </button>
              ) : (
                <button
                  onClick={handleStopSimulation}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black font-mono text-[11px] uppercase py-3 rounded-lg border border-zinc-800 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm animate-ping"></span>
                  Pausar Loop
                </button>
              )}
            </div>
          </div>

          {/* Visual Simulation Display Col */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Metadata of Selected Tumor */}
            <div className="bg-rose-950/10 border border-rose-950/30 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 bg-rose-950/35 rounded-lg text-rose-400 border border-rose-900/40">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="text-xs font-black uppercase text-white font-mono">
                    NEOPLASIA ALVO: {tumors[selectedTumor as keyof typeof tumors].name}
                  </h4>
                  <span className="text-[9px] font-mono font-bold bg-rose-950/40 border border-rose-900/50 px-2 py-0.5 rounded text-rose-400">
                    Antígene: {tumors[selectedTumor as keyof typeof tumors].antigen}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono mt-1 leading-relaxed">
                  {tumors[selectedTumor as keyof typeof tumors].description}
                </p>
                <div className="text-[9px] text-emerald-400 font-mono mt-1.5 font-semibold flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Estratégia Recomendada: {tumors[selectedTumor as keyof typeof tumors].ref}
                </div>
              </div>
            </div>

            {/* Graphics Output - SVG Plotting values */}
            <div className="bg-[#050505] border border-zinc-900 rounded-xl p-4 flex-1 flex flex-col justify-between min-h-[250px] relative overflow-hidden">
              <div className="flex justify-between items-center mb-2 z-10">
                <span className="text-[9px] font-black font-mono text-zinc-500 uppercase flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  Monitor Telemetria Biológica (Dia 1 a 28)
                </span>
                <span className="text-[9px] font-mono text-rose-500 font-black uppercase bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.5 rounded">
                  Ciclo de Indução: Dia {simState.day}/28
                </span>
              </div>

              {/* Dynamic SVG Plotting */}
              <div className="flex-1 w-full min-h-[160px] relative bg-black/40 border border-zinc-950 rounded flex items-center justify-center my-1">
                {/* Radial rings background */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <line x1="0" y1="25" x2="100" y2="25" stroke="#101010" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#121212" strokeWidth="0.75" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="#101010" strokeWidth="0.5" />
                  
                  {/* Grid Lines vertical (representing 28 days) */}
                  <line x1="25" y1="0" x2="25" y2="100" stroke="#101010" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="#121212" strokeWidth="0.75" />
                  <line x1="75" y1="0" x2="75" y2="100" stroke="#101010" strokeWidth="0.5" />

                  {/* Draw Tumor Load Line (Rose Red) */}
                  {simState.tumorLoad.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      points={simState.tumorLoad.map((val, idx) => {
                        const x = (idx / (simState.tumorLoad.length - 1)) * 100;
                        const y = 100 - val; // invert to plot percentage from top
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  )}

                  {/* Draw Th1 Response Line (Cyan) */}
                  {simState.th1Response.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeDasharray="1.5 2"
                      points={simState.th1Response.map((val, idx) => {
                        const x = (idx / (simState.th1Response.length - 1)) * 100;
                        const y = 100 - val;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  )}

                  {/* Draw Treg levels (Amber) */}
                  {simState.tregLevel.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      points={simState.tregLevel.map((val, idx) => {
                        const x = (idx / (simState.tregLevel.length - 1)) * 100;
                        const y = 100 - (val * 2.5); // scaled to fit visually
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  )}
                </svg>

                {/* Floating telemetry text labels */}
                <div className="absolute top-2 right-2 bg-black/85 border border-zinc-900/60 rounded p-1.5 text-[8px] font-mono flex flex-col gap-0.5 z-10 leading-none">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block"></span>
                    <span className="text-rose-400 font-bold">Carga Tumoral Sólida:</span>
                    <span className="text-white font-bold font-mono ml-auto">
                      {simState.tumorLoad[simState.tumorLoad.length - 1].toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full inline-block"></span>
                    <span className="text-cyan-400 font-bold">Potencial Citotóxico Th1:</span>
                    <span className="text-white font-bold font-mono ml-auto">
                      {simState.th1Response[simState.th1Response.length - 1].toFixed(0)} AU
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>
                    <span className="text-amber-400 font-bold">Células Treg Imunossupressoras:</span>
                    <span className="text-white font-bold font-mono ml-auto">
                      {simState.tregLevel[simState.tregLevel.length - 1].toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Current state watermark */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-10 select-none">
                  <Compass className="w-20 h-20 text-rose-500 animate-spin" style={{ animationDuration: '30s' }} />
                  <span className="text-xs font-mono font-black mt-1">DIMHEX TELEMETRIA CLINICA</span>
                </div>
              </div>

              {/* Status footer and event tracker */}
              <div className="border-t border-zinc-900/80 pt-2.5 mt-2 flex flex-col gap-1 z-10">
                <div className="text-[10px] font-mono flex gap-1.5 items-center">
                  <span className="font-bold text-rose-400 shrink-0">EVENTO CLINICO ATUAL:</span>
                  <span className="text-zinc-200 select-all truncate">{simState.currentEvent}</span>
                </div>

                {/* Micro Event logs console */}
                <div className="max-h-[60px] overflow-y-auto bg-black border border-zinc-950 p-2 rounded text-[8px] font-mono text-zinc-500 space-y-0.5 leading-tight select-none">
                  {simState.logs.slice().reverse().map((logStr, i) => (
                    <div key={i} className="flex gap-1">
                      <span className="text-emerald-500 font-bold">&gt;&gt;</span>
                      <span className="text-zinc-300">{logStr}</span>
                    </div>
                  ))}
                  {simState.logs.length === 0 && (
                    <div className="text-zinc-600 text-center uppercase">Consolo de Simulação pronto para Injeção de Protocolo</div>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated Live Dialysis Diagram */}
            <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono">
              <div className="bg-zinc-900/20 border border-zinc-900 p-2 rounded-lg">
                <div className="text-rose-400 font-bold uppercase">1. Sangria Aférese</div>
                <div className="text-zinc-400 mt-1">Extracorpórea Dupla</div>
                <div className="text-[8px] text-zinc-600">65 mL/min contínuo</div>
              </div>
              <div className="bg-zinc-900/20 border border-zinc-900 p-2 rounded-lg">
                <div className="text-amber-400 font-bold uppercase">2. Depleção Treg</div>
                <div className="text-zinc-400 mt-1">Imunoafinidade CCR8</div>
                <div className="text-[8px] text-zinc-600">Eficiência de 85%</div>
              </div>
              <div className="bg-zinc-900/20 border border-zinc-900 p-2 rounded-lg">
                <div className="text-cyan-400 font-bold uppercase">3. Biorreator Th1</div>
                <div className="text-zinc-400 mt-1">mRNA de Transfecção</div>
                <div className="text-[8px] text-zinc-600">Ativação Policlon</div>
              </div>
              <div className="bg-zinc-900/20 border border-zinc-900 p-2 rounded-lg">
                <div className="text-indigo-400 font-bold uppercase">4. Reinfusão</div>
                <div className="text-zinc-400 mt-1">Auto-Transplante</div>
                <div className="text-[8px] text-zinc-600">Volume Expandido</div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. CEIS SYNERGY SUBTAB */}
      {activeSubTab === 'ceis' && (
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-rose-500 font-mono flex items-center gap-1.5 border-b border-zinc-900 pb-2 mb-3">
              <Users className="w-4 h-4" />
              Sinergia do Complexo Industrial da Saúde (CEIS) - Tecnologia 100% Nacional
            </h4>
            <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">
              O DIMHEX foi arquitetado para ser produzido de forma autônoma pelo Estado brasileiro, abrindo mão de patentes e dividindo as responsabilidades tecnológicas entre os três maiores pilares de ciência médica do país. Clique em qualquer pilar para detalhar as frentes científicas envolvidas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* USP */}
              <div className="bg-black/40 border border-zinc-900 hover:border-emerald-500/40 p-4 rounded-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="text-emerald-400 font-bold text-xs uppercase tracking-wide font-mono flex justify-between items-center mb-1">
                    <span>CTC USP Ribeirão Preto</span>
                    <span className="text-[8px] bg-emerald-950/40 border border-emerald-900 px-1.5 py-0.5 rounded text-emerald-400">
                      MUNIÇÃO VIVA
                    </span>
                  </div>
                  <h5 className="font-black text-white text-sm mb-2 uppercase tracking-tight">Potencialização Celular</h5>
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                    Líderes no desenvolvimento da tecnologia CAR-T no Brasil. Responsáveis pelo isolamento ex-vivo de leucócitos autólogos, modulação das citocinas Th1/Th17 e transfectação gênica direcionada.
                  </p>
                </div>
                <div className="text-[8px] text-zinc-500 font-mono uppercase mt-4 border-t border-zinc-900 pt-2 flex justify-between">
                  <span>Ensaio de Fase I aprovado</span>
                  <span>SUS Autônomo</span>
                </div>
              </div>

              {/* FIOCRUZ */}
              <div className="bg-black/40 border border-zinc-900 hover:border-indigo-500/40 p-4 rounded-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="text-indigo-400 font-bold text-xs uppercase tracking-wide font-mono flex justify-between items-center mb-1">
                    <span>Bio-Manguinhos Fiocruz</span>
                    <span className="text-[8px] bg-indigo-950/40 border border-indigo-900 px-1.5 py-0.5 rounded text-indigo-400">
                      ARTILHARIA PESADA
                    </span>
                  </div>
                  <h5 className="font-black text-white text-sm mb-2 uppercase tracking-tight">Anticorpos & RNAm Nacional</h5>
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                    Produção industrial de anticorpos biossimilares e conjugação enzimática com perforina. Pioneiros no desenvolvimento da plataforma nacional de vacinas e terapias programáveis baseadas em RNA mensageiro.
                  </p>
                </div>
                <div className="text-[8px] text-zinc-500 font-mono uppercase mt-4 border-t border-zinc-900 pt-2 flex justify-between">
                  <span>Fábricas de RNAm operacionais</span>
                  <span>Isento de Royalties</span>
                </div>
              </div>

              {/* BUTANTAN */}
              <div className="bg-black/40 border border-zinc-900 hover:border-rose-500/40 p-4 rounded-xl transition-all flex flex-col justify-between">
                <div>
                  <div className="text-rose-400 font-bold text-xs uppercase tracking-wide font-mono flex justify-between items-center mb-1">
                    <span>Instituto Butantan</span>
                    <span className="text-[8px] bg-rose-950/40 border border-rose-900 px-1.5 py-0.5 rounded text-rose-400">
                      COMANDO CENTRAL
                    </span>
                  </div>
                  <h5 className="font-black text-white text-sm mb-2 uppercase tracking-tight">Biespecíficos & Enzimas</h5>
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                    Fabricação automatizada de anticorpos biespecíficos (BsAb) recombinantes de altíssima afinidade através de sua nova planta biotecnológica (PAM). Responsáveis pela purificação da L-asparaginase peguilada.
                  </p>
                </div>
                <div className="text-[8px] text-zinc-500 font-mono uppercase mt-4 border-t border-zinc-900 pt-2 flex justify-between">
                  <span>Robótica de alta escala</span>
                  <span>Patente Aberta</span>
                </div>
              </div>
            </div>

            {/* Decentralization regional network */}
            <div className="bg-[#050505] border border-zinc-900 p-3.5 rounded-xl flex items-center gap-3.5 mt-4">
              <div className="p-2 bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 rounded-lg shrink-0">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 font-mono">
                <h5 className="text-xs font-black uppercase text-white">
                  DESCENTRALIZAÇÃO REGIONAL: REDE DE HOSPITAIS DE EXCELÊNCIA SUS (PROADI-SUS)
                </h5>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  Para garantir capilaridade e abrangência, o DIMHEX será executado por miniplantas laboratoriais instaladas em centros oncológicos de referência nacional como o INCA (Rio de Janeiro) e o Hospital A.C. Camargo (São Paulo). A expansão de leucócitos e aférese ocorrerão nas próprias unidades locais, barateando custos logísticos.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. REPORT SUBTAB */}
      {activeSubTab === 'report' && (
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-xl font-mono">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-rose-500 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5" />
                RELATÓRIO CLÍNICO EXECUTIVO - PROTOTIPAGEM DO PROTOCOLO DIMHEX
              </h4>
              <span className="text-[8px] text-zinc-500 font-mono uppercase bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded">
                Ref: ONCO-PHD-2026
              </span>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-850">
              
              <section className="space-y-1 bg-black/25 border border-zinc-950 p-3 rounded-lg">
                <h5 className="text-rose-400 font-black uppercase tracking-tight text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
                  1. Visão Geral da Pesquisa Imunooncológica Brasileira
                </h5>
                <p className="text-[10.5px] text-zinc-400">
                  O projeto tem por objetivo consolidar o Brasil como líder global em terapias imunológicas contra neoplasias sólidas avançadas e refratárias. Visando atender à nova <span className="text-white font-semibold">Lei de Terapias Avançadas do SUS (Lei 15.385/2026)</span>, o sistema DIMHEX integra três modalidades de combate direto ao câncer de forma totalmente autóloga e isenta de royalties de patentes estrangeiras.
                </p>
              </section>

              <section className="space-y-1 bg-black/25 border border-zinc-950 p-3 rounded-lg">
                <h5 className="text-rose-400 font-black uppercase tracking-tight text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
                  2. A Sinergia do Consórcio do Complexo da Saúde (CEIS)
                </h5>
                <p className="text-[10.5px] text-zinc-400">
                  Ao invés de dependermos de biofármacos importados de custo multimilionário, o DIMHEX se apoia em frentes federais e estaduais ativas no Brasil:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[10px] text-zinc-400 pl-2 mt-1">
                  <li><span className="text-white font-semibold">CTC USP Ribeirão Preto:</span> Detentora da maior expertise do país em processamento e transfecção gênica de linfócitos T.</li>
                  <li><span className="text-white font-semibold">Bio-Manguinhos Fiocruz:</span> Produz anticorpos monoclonais de alta escala e desenvolve a primeira planta integrada de RNAm do país.</li>
                  <li><span className="text-white font-semibold">Instituto Butantan:</span> Modernização da fábrica de anticorpos biespecíficos de alta afinidade ex vivo e engenharia de enzimas recombinantes.</li>
                </ul>
              </section>

              <section className="space-y-1 bg-black/25 border border-zinc-950 p-3 rounded-lg">
                <h5 className="text-rose-400 font-black uppercase tracking-tight text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
                  3. Linha de Pesquisa e Engenharia do Sistema T4 (Helper CD4+)
                </h5>
                <p className="text-[10.5px] text-zinc-400">
                  Análises de biologia celular revelam que a polarização de linfócitos CD4+ Th1 ex vivo através de transfecção de mRNA reprogramado com os fatores de transcrição T-bet e Eomes induz a secreção massiva de interferon-gama (IFN-γ) no microambiente tumoral. Isso reverte os sinais de exaustão e recruta as células citotóxicas CD8+ nativas para destruir a neoplasia estromal com alta seletividade. Tregs circulantes exaustas são filtradas fisicamente pela coluna anti-CCR8 no circuito hemodialítico.
                </p>
              </section>

              <section className="space-y-1 bg-black/25 border border-zinc-950 p-3 rounded-lg">
                <h5 className="text-rose-400 font-black uppercase tracking-tight text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
                  4. Investimento, Orçamento e Implementação SUS (R$ 340 milhões)
                </h5>
                <p className="text-[10.5px] text-zinc-400">
                  O plano de fomento do Complexo DIMHEX está orçado em <span className="text-emerald-400 font-bold">R$ 340.000.000,00</span>, captados através de emendas de ciência médica do Ministério da Saúde, Chamada Pública CNPq/SCTIE Nº 30/2025 e do programa de hospitais de excelência do PROADI-SUS. O custo por paciente tratado em regime completo no SUS será reduzido de R$ 3 milhões para <span className="text-white font-semibold">R$ 120.000 - R$ 250.000</span>, gerando uma economia gigantesca e viabilizando o primeiro protocolo de tratamento celular de alta potência universal do mundo.
                </p>
              </section>

              <section className="space-y-1 bg-black/25 border border-zinc-950 p-3 rounded-lg">
                <h5 className="text-rose-400 font-black uppercase tracking-tight text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
                  5. Cronograma e Roadmap de Pesquisa (2027 - 2030)
                </h5>
                <p className="text-[10.5px] text-zinc-400">
                  Nossos marcos são divididos em 4 anos de execução estratégica:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[9px] text-zinc-400 mt-1">
                  <div className="bg-black border border-zinc-900 p-1.5 rounded">
                    <span className="text-white font-bold block">2027: Atração de Fomento</span>
                    Mapeamento de alvos em organoides e desenvolvimento conceitual microfluídico.
                  </div>
                  <div className="bg-black border border-zinc-900 p-1.5 rounded">
                    <span className="text-white font-bold block">2028: Reator-Piloto</span>
                    Construção do reator em Ribeirão Preto e validação pré-clínica animal (NSG mice).
                  </div>
                  <div className="bg-black border border-zinc-900 p-1.5 rounded">
                    <span className="text-white font-bold block">2029: Avaliação ANVISA</span>
                    Inauguração do reator-piloto e submissão dos marcos regulatórios e CONITEC.
                  </div>
                  <div className="bg-black border border-zinc-900 p-1.5 rounded">
                    <span className="text-white font-bold block">2030: Ensaio de Fase I</span>
                    Estudo clínico em 30 pacientes refratários em UTIs do INCA e A.C. Camargo.
                  </div>
                </div>
              </section>

            </div>

            <div className="mt-4 border-t border-zinc-900 pt-3 flex justify-between items-center text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-rose-500" />
                Patente Livre - Domínio Público do SUS Brasileiro
              </span>
              <span>Aprovado por Comitê de Ética CoEP/CONEP</span>
            </div>

          </div>
        </div>
      )}

      {/* 4. ADVISOR SUBTAB */}
      {activeSubTab === 'advisor' && (
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl">
            <h4 className="text-sm font-black uppercase tracking-wider text-rose-500 font-mono flex items-center gap-1.5 border-b border-zinc-900 pb-2 mb-3">
              <Sparkles className="w-4 h-4 animate-pulse text-yellow-400" />
              Onco-Advisor AI: Assistente Inteligente de Imunooncologia
            </h4>
            <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-4">
              Consulte nossa inteligência molecular sobre o protocolo DIMHEX, engenharia de anticorpos biespecíficos, depleção física de Tregs pelo sistema hemodialítico ou as sinergias públicas brasileiras.
            </p>

            {/* Chat list */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto mb-4 p-2 bg-[#050505] border border-zinc-950 rounded-xl scrollbar-thin">
              {advisorAnswers.map((item, idx) => (
                <div key={idx} className="space-y-1.5 text-xs border-b border-zinc-900 pb-2 last:border-none">
                  <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                    <span className="font-bold text-cyan-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                      Pesquisador PhD
                    </span>
                    <span>[{item.time}]</span>
                  </div>
                  <div className="text-zinc-200 font-mono font-bold">{item.q}</div>
                  
                  <div className="flex items-start gap-2 bg-rose-950/10 border border-rose-950/20 p-2.5 rounded-lg mt-1 text-[11px] text-zinc-300 font-mono leading-relaxed">
                    <Sparkles className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-rose-400 font-bold block uppercase text-[9px] tracking-wide mb-1">Resposta Onco-Advisor:</span>
                      {item.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Question form */}
            <form onSubmit={handleAdvisorSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Como o sistema T4 CD4+ reverte a imunossupressão tumoral?"
                value={advisorQuery}
                onChange={(e) => setAdvisorQuery(e.target.value)}
                className="flex-1 bg-black/85 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-lg text-xs font-mono uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Consultar
              </button>
            </form>

            {/* Suggested quick queries */}
            <div className="flex flex-wrap gap-1.5 mt-3 select-none text-[8.5px] font-mono uppercase font-black text-zinc-500">
              <span className="text-zinc-600 font-bold self-center mr-1">Tópicos sugeridos:</span>
              {[
                'Como depletar Tregs?',
                'Análise do sistema T4',
                'Como funciona o carregamento de hemácias?',
                'Custo-benefício do DIMHEX SUS',
                'Como produzir anticorpos biespecíficos?'
              ].map((topic, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAdvisorQuery(topic)}
                  className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 hover:text-zinc-300 px-2 py-1 rounded transition-all cursor-pointer"
                >
                  {topic}
                </button>
              ))}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
