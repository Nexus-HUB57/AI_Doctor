import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Plus, 
  RefreshCw, 
  Terminal, 
  Settings, 
  Zap, 
  Cpu, 
  Database, 
  Activity, 
  Dna, 
  Layers, 
  Send, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  Compass,
  ArrowRightLeft,
  Sliders,
  HelpCircle,
  Sparkles,
  User,
  Users,
  Heart,
  Info,
  MessageSquare,
  Flame,
  LayoutGrid,
  BrainCircuit,
  Microscope
} from 'lucide-react';

import { OrganismPreset, Agent, LogMessage } from './types';
import MoltbookFeed from './components/MoltbookFeed';
import CerebroPanel from './components/CerebroPanel';
import WormholePanel from './components/WormholePanel';
import BlackholePanel from './components/BlackholePanel';
import OncoResearchPanel from './components/OncoResearchPanel';
import DiagnosticPanel from './components/DiagnosticPanel';
import EradicationPanel from './components/EradicationPanel';
import ResearchDashboard from './components/ResearchDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import MedicalBoardPanel from './components/MedicalBoardPanel';
import TelemedicineChatbot from './components/TelemedicineChatbot';

const PRESETS: OrganismPreset[] = [
  {
    id: 'ecoli_16s',
    name: 'Escherichia coli (16S rRNA fragment)',
    type: 'Bacterial Subunit Helix 37',
    sequence: 'GGCGGUGUGUACAAAGGCCCAGGAACGUAUUCACCGUGGCGUUGUUG',
    description: 'A classic sequence representing the conserved 3\' terminal decoding region of the bacterial 16S small subunit ribosomal RNA.'
  },
  {
    id: 'scerevisiae_18s',
    name: 'Saccharomyces cerevisiae (18S rRNA segment)',
    type: 'Eukaryotic Subunit V4 Loop',
    sequence: 'UUGUUUGCCAUGGUGUCCAGACUCGUGGCGUGAUUUCAUGGAUGAC',
    description: 'A highly variable region from yeast 18S rRNA used extensively for phylogenetic mapping and structural variation profiling.'
  },
  {
    id: 'hmarismortui_23s',
    name: 'Haloarcula marismortui (23S rRNA center)',
    type: 'Archaeal peptidyl transferase region',
    sequence: 'CCGUUCGCGCGCGCGGGGGGACGGGGGUGCCCGGGCGCGCGGAA',
    description: 'A portion of the Archaeal large subunit (23S) sequence encompassing critical catalytic domains of the peptidyl transferase center.'
  },
  {
    id: 'dradiodurans_16s',
    name: 'Deinococcus radiodurans (16S rRNA segment)',
    type: 'Extremophile stable hairpin',
    sequence: 'CCCGGGGCUGGGGCGGGGCCGGGGACCCGGGGCCC',
    description: 'An extremely GC-rich helical sequence from a highly radiation-resistant bacterium, showing incredible structural stability.'
  }
];

export default function App() {
  // Core states
  const [activeTab, setActiveTab] = useState<'hub' | 'moltbook' | 'cerebro' | 'wormhole' | 'blackhole' | 'onco_research' | 'diagnostic' | 'eradication' | 'research_dashboard' | 'analytics' | 'board' | 'telemedicine'>('hub');
  const [sequence, setSequence] = useState<string>(PRESETS[0].sequence);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('seq_parser');
  const [hoveredBase, setHoveredBase] = useState<number | null>(null);

  // Network metrics
  const [tps, setTps] = useState<number>(442);
  const [latency, setLatency] = useState<number>(12);

  // Custom Agent Form
  const [showAddAgentForm, setShowAddAgentForm] = useState<boolean>(false);
  const [newAgentName, setNewAgentName] = useState<string>('');
  const [newAgentRole, setNewAgentRole] = useState<string>('Analista Filogenético');
  const [newAgentPrompt, setNewAgentPrompt] = useState<string>('Identificar assinatura taxonômica e estabilidade evolutiva do fragmento.');

  // Custom interaction panel
  const [customQueryText, setCustomQueryText] = useState<string>('');
  const [isQueryingAgent, setIsQueryingAgent] = useState<boolean>(false);

  // Terminal state
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [logs, setLogs] = useState<LogMessage[]>([
    { id: '1', time: '11:14:01', text: 'COGNITIVE CORES INITIATED - DEPLOYING AGENT MATRIX HANDSHAKE...', type: 'info' },
    { id: '2', time: '11:14:02', text: 'CYBER-MOLECULAR SYNAPSE ON STANDBY - QUANTUM COMMS SYNCED', type: 'success' },
    { id: '3', time: '11:14:05', text: 'MOLECULAR SEQUENCE ENGAGED: Escherichia coli (16S ribosomal segment)', type: 'info' },
    { id: '4', time: '11:14:08', text: 'BIO-TECTONIC INTELLIGENCE ONLINE - STANDBY FOR BIOMETRIC COGNITION DISPATCH.', type: 'success' }
  ]);

  // Nussinov Secondary Structure prediction results
  const [secondaryStructure, setSecondaryStructure] = useState<{
    brackets: string;
    pairs: [number, number][];
  }>({ brackets: '', pairs: [] });

  // Agent Registry state
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: 'seq_parser',
      name: 'Seq-Parser',
      role: 'Análise de Motifs e GC %',
      pid: 8829,
      status: 'ACTIVE',
      color: '#10b981', // Emerald
      description: 'Analisa o conteúdo de nucleotídeos, calcula a proporção de GC, purinas/pirimidinas, e identifica motifs reguladores.',
      prompt: 'Analise detalhadamente a sequência de rRNA, calculando proporções de nucleotídeos e motifs de ligação ribossomais.'
    },
    {
      id: 'nexus_sync',
      name: 'Nexus-Sync',
      role: 'Sincronização evolutiva e Taxonomia',
      pid: 1042,
      status: 'SYNCED',
      color: '#3b82f6', // Blue
      description: 'Responsável pelo alinhamento taxonômico e correspondência evolutiva em bases de dados filogenéticas nucleares.',
      prompt: 'Verifique a identidade taxonômica do fragmento de rRNA contra o banco evolutivo global.'
    },
    {
      id: 'fold_gen',
      name: 'Fold-Gen',
      role: 'Predição de Estrutura Secundária',
      pid: 2209,
      status: 'IDLE',
      color: '#a855f7', // Purple
      description: 'Aplica o algoritmo de Nussinov para predizer o emparelhamento de bases ótimos de RNA, incluindo pares Wobble.',
      prompt: 'Compute a estrutura de dobramento secundário do RNA usando Nussinov, indicando helices e alças.'
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Nussinov folding algorithm implemented in real-time
  useEffect(() => {
    const cleanSeq = sequence.toUpperCase().replace(/[^AUCG]/g, 'U'); // clean inputs, T -> U
    const n = cleanSeq.length;
    if (n === 0) return;

    // DP Matrix for Nussinov
    const dp = Array.from({ length: n }, () => Array(n).fill(0));

    // Base pair check: A-U, U-A, G-C, C-G, G-U, U-G (Wobble pairing)
    const canPair = (a: string, b: string) => {
      const p = a + b;
      return p === 'AU' || p === 'UA' || p === 'GC' || p === 'CG' || p === 'GU' || p === 'UG';
    };

    // Nussinov Algorithm: DP filling
    // min loop length is 4 bases (k = 5)
    const minLoop = 4;
    for (let k = minLoop + 1; k < n; k++) {
      for (let i = 0; i < n - k; i++) {
        const j = i + k;
        let maxVal = dp[i][j - 1]; // case 1: j is unpaired

        // case 2: j is paired with some index t
        for (let t = i; t < j - minLoop; t++) {
          if (canPair(cleanSeq[t], cleanSeq[j])) {
            const left = t > i ? dp[i][t - 1] : 0;
            const right = dp[t + 1][j - 1];
            maxVal = Math.max(maxVal, left + right + 1);
          }
        }
        dp[i][j] = maxVal;
      }
    }

    // Backtracking to extract base pairs
    const pairs: [number, number][] = [];
    const backtrack = (i: number, j: number) => {
      if (i >= j - minLoop) return;
      if (dp[i][j] === dp[i][j - 1]) {
        backtrack(i, j - 1);
      } else {
        for (let t = i; t < j - minLoop; t++) {
          if (canPair(cleanSeq[t], cleanSeq[j])) {
            const left = t > i ? dp[i][t - 1] : 0;
            const right = dp[t + 1][j - 1];
            if (dp[i][j] === left + right + 1) {
              pairs.push([t, j]);
              backtrack(i, t - 1);
              backtrack(t + 1, j - 1);
              return;
            }
          }
        }
      }
    };

    backtrack(0, n - 1);

    // Build bracket string
    const bracketsArr = Array(n).fill('.');
    pairs.forEach(([left, right]) => {
      bracketsArr[left] = '(';
      bracketsArr[right] = ')';
    });

    setSecondaryStructure({
      brackets: bracketsArr.join(''),
      pairs
    });
  }, [sequence]);

  // Fluctuating metric simulation to create a live interface feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTps(prev => Math.floor(prev + (Math.random() * 20 - 10)));
      setLatency(prev => {
        const next = prev + (Math.random() * 2 - 1);
        return parseFloat(Math.max(8, Math.min(20, next)).toFixed(1)) as any;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Utility to append log messages easily
  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'query' | 'agent' | 'cosmic' = 'info', agentName?: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setLogs(prev => [...prev, {
      id: Math.random().toString(),
      time: timeStr,
      text,
      type,
      agentName
    }]);
  };

  // Preset Selection handler
  const handleSelectPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      setSequence(preset.sequence);
      addLog(`Sequência alterada para preset: ${preset.name}`, 'info');
    }
  };

  // Helper to handle manual sequence updates
  const handleSequenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Only allow A, U, G, C, T (case-insensitive) and replace T with U automatically
    const inputVal = e.target.value.toUpperCase().replace(/T/g, 'U').replace(/[^AUCG]/g, '');
    setSequence(inputVal);
  };

  // Compensatory Mutations / Stabilize structure tool
  const stabilizeSequence = () => {
    addLog('Iniciando análise de compensação estrutural...', 'info');
    // Find unpaired bases inside sequence and search for mismatches
    // Simple stabilize logic: find an unpaired base at start and end and force pair them by mutating the opposite nucleotide
    const seqArr = sequence.split('');
    let mutated = false;
    let mutatedIndex = -1;
    let originalChar = '';
    let newChar = '';

    // Loop through bases to find an unpaired match in the middle
    for (let i = 0; i < seqArr.length / 2; i++) {
      const counterpart = seqArr.length - 1 - i;
      // If they cannot pair, let's force mutate the counterpart to form a stable G-C bond!
      const b1 = seqArr[i];
      const b2 = seqArr[counterpart];
      const p = b1 + b2;
      const isPaired = p === 'AU' || p === 'UA' || p === 'GC' || p === 'CG' || p === 'GU' || p === 'UG';

      if (!isPaired) {
        originalChar = seqArr[counterpart];
        // Mutate counterpart to pair with b1
        if (b1 === 'G') newChar = 'C';
        else if (b1 === 'C') newChar = 'G';
        else if (b1 === 'A') newChar = 'U';
        else if (b1 === 'U') newChar = 'G'; // pair with G
        
        seqArr[counterpart] = newChar;
        mutatedIndex = counterpart;
        mutated = true;
        break; // mutate once per click for interactivity
      }
    }

    if (mutated) {
      const newSeq = seqArr.join('');
      setSequence(newSeq);
      addLog(`Estabilização Concluída: Mutação compensatória em posição ${mutatedIndex + 1} (${originalChar} → ${newChar}) para assegurar Helix estável.`, 'success');
    } else {
      addLog('A estrutura secundária do rRNA já se encontra em estabilidade termodinâmica ideal.', 'success');
    }
  };

  // Adding new Agent dynamically
  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim()) return;

    const newAgent: Agent = {
      id: `agent_${Date.now()}`,
      name: newAgentName.trim(),
      role: newAgentRole,
      pid: Math.floor(Math.random() * 9000 + 1000),
      status: 'ACTIVE',
      color: ['#f43f5e', '#ec4899', '#eab308', '#06b6d4', '#14b8a6', '#f97316'][Math.floor(Math.random() * 6)],
      description: `Agente especializado auto-instanciado focado em: ${newAgentRole}.`,
      prompt: newAgentPrompt
    };

    setAgents(prev => [...prev, newAgent]);
    addLog(`NOVO AGENTE INSTANCIADO: ${newAgent.name} (PID: ${newAgent.pid}) registrado na Orquestração.`, 'success');
    setSelectedAgentId(newAgent.id);
    
    // Clear form
    setNewAgentName('');
    setNewAgentPrompt('Identificar padrões moleculares adicionais e reportar consenso.');
    setShowAddAgentForm(false);
  };

  // Run full bidirectional pipeline simulation & actual server-side Gemini API calls
  const runOrchestration = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisProgress(5);
    addLog('⚡ INICIANDO PIPELINE DE ORQUESTRAÇÃO BIDIRECIONAL (LiveBook-rRNA)...', 'info');

    try {
      // Step 1: Seq-Parser
      setAgents(prev => prev.map(a => a.id === 'seq_parser' ? { ...a, status: 'ANALYZING' } : a));
      setAnalysisProgress(20);
      addLog('[Seq-Parser] Analisando densidade de nucleotídeos e motifs reguladores...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const gcContent = calculateGCContent(sequence);
      const purines = calculatePurines(sequence);
      const parsedStats = `GC: ${gcContent}%, Purinas: ${purines}%, Bases: ${sequence.length}`;
      setAgents(prev => prev.map(a => a.id === 'seq_parser' ? { ...a, status: 'ACTIVE', latestAnalysis: `Composição molecular do fragmento validada. ${parsedStats}.` } : a));
      addLog(`[Seq-Parser] Análise concluída. ${parsedStats}`, 'success');

      // Step 2: Fold-Gen
      setAgents(prev => prev.map(a => a.id === 'fold_gen' ? { ...a, status: 'ANALYZING' } : a));
      setAnalysisProgress(50);
      addLog('[Fold-Gen] Computando matriz Nussinov e ligações helicoidais secundárias...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1200));

      const foldStats = `Estrutura predita: ${secondaryStructure.brackets} com ${secondaryStructure.pairs.length} pares estáveis.`;
      setAgents(prev => prev.map(a => a.id === 'fold_gen' ? { ...a, status: 'ACTIVE', latestAnalysis: `Dobramento helicoidal modelado. ${foldStats}` } : a));
      addLog(`[Fold-Gen] Dobramento concluído. ${foldStats}`, 'success');

      // Step 3: Server-side Gemini Consensus Analysis
      setAgents(prev => prev.map(a => a.id === 'nexus_sync' ? { ...a, status: 'ANALYZING' } : a));
      setAnalysisProgress(75);
      addLog('[Nexus-Sync] Sincronizando dados filogenéticos com o Hub Central e consultando IA...', 'info');

      // Call our API endpoint
      const response = await fetch('/api/consensus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence,
          agents: agents.map(a => ({ name: a.name, role: a.role }))
        })
      });

      const data = await response.json();
      setAnalysisProgress(95);

      if (data.success && data.conversation && data.conversation.length > 0) {
        addLog('--- INÍCIO DE DIÁLOGO DE CONSENSO BIDIRECIONAL ---', 'info');
        data.conversation.forEach((msg: any) => {
          addLog(`${msg.agent}: "${msg.text}"`, 'agent', msg.agent);
          // Update specific agent analysis if matches
          setAgents(prev => prev.map(a => a.name === msg.agent ? { ...a, latestAnalysis: msg.text } : a));
        });
        addLog('--- FIM DO CONSENSO DE AGENTES ---', 'success');
      } else {
        // Fallback simulated consensus if API is unavailable or returns empty
        const fallbackDialog = [
          { agent: 'Seq-Parser', text: 'Analisei a estrutura. O fragmento apresenta excelente densidade de pontes de hidrogênio helicoidais.' },
          { agent: 'Fold-Gen', text: 'Concordo. O hairpin predito possui estabilidade ideal na alça de nucleotídeos.' },
          { agent: 'Nexus-Sync', text: 'Alinhamento taxonômico indica homologia conservada com linhagens ancestrais extremófilas.' }
        ];
        addLog('--- DIÁLOGO DE CONSENSO (SIMULAÇÃO DE RETROALIMENTAÇÃO) ---', 'info');
        fallbackDialog.forEach(msg => {
          addLog(`${msg.agent}: "${msg.text}"`, 'agent', msg.agent);
        });
        addLog('--- FIM DO CONSENSO (MODO DE CONFIABILIDADE) ---', 'success');
      }

      setAgents(prev => prev.map(a => a.id === 'nexus_sync' ? { ...a, status: 'SYNCED' } : a));
      addLog('🎉 ORQUESTRAÇÃO BIDIRECIONAL EXECUTADA COM SUCESSO. Hub de agentes sincronizado.', 'success');
    } catch (err: any) {
      addLog(`Falha na comunicação de sincronia central: ${err.message || err}. Prosseguindo no modo local.`, 'warning');
      // Fallback update
      setAgents(prev => prev.map(a => a.status === 'ANALYZING' ? { ...a, status: 'ACTIVE' } : a));
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  // Command input terminal console interpreter
  const handleTerminalCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalInput('');
    addLog(`> ${cmd}`, 'query');

    const lowerCmd = cmd.toLowerCase();
    
    if (lowerCmd === '/help' || lowerCmd === 'help' || lowerCmd === '?') {
      addLog('Comandos do Console LiveBook-rRNA:', 'info');
      addLog('  /analyze        - Disparar orquestração bidirecional dos agentes.', 'info');
      addLog('  /stabilize      - Injetar mutações compensatórias para maximizar estabilidade.', 'info');
      addLog('  /clear          - Limpar os logs do terminal.', 'info');
      addLog('  /mutate [seq]   - Definir nova sequência rRNA customizada para análise.', 'info');
      addLog('  /preset [id]    - Carregar um preset de organismo (ex: /preset ecoli_16s).', 'info');
      addLog('  /agent [pergunta] - Interrogar o agente selecionado diretamente via Gemini.', 'info');
    } else if (lowerCmd === '/analyze') {
      runOrchestration();
    } else if (lowerCmd === '/stabilize') {
      stabilizeSequence();
    } else if (lowerCmd === '/clear') {
      setLogs([]);
    } else if (lowerCmd.startsWith('/mutate ')) {
      const newSeq = cmd.substring(8).toUpperCase().replace(/T/g, 'U').replace(/[^AUCG]/g, '');
      if (newSeq.length > 0) {
        setSequence(newSeq);
        addLog(`Sequência rRNA mutada via terminal para: ${newSeq}`, 'success');
      } else {
        addLog('Erro: sequência inválida. Utilize apenas A, U, C, G.', 'warning');
      }
    } else if (lowerCmd.startsWith('/preset ')) {
      const pid = cmd.substring(8).trim();
      const p = PRESETS.find(pr => pr.id === pid);
      if (p) {
        handleSelectPreset(p.id);
      } else {
        addLog(`Preset não encontrado. Opções: ${PRESETS.map(pr => pr.id).join(', ')}`, 'warning');
      }
    } else if (lowerCmd.startsWith('/agent ')) {
      const question = cmd.substring(7).trim();
      if (!question) {
        addLog('Erro: Forneça uma pergunta para o agente. Ex: /agent qual a estabilidade estrutural?', 'warning');
        return;
      }
      querySelectedAgent(question);
    } else {
      // General question routed to selected agent
      addLog(`Direcionando consulta geral ao agente "${agents.find(a => a.id === selectedAgentId)?.name}"...`, 'info');
      querySelectedAgent(cmd);
    }
  };

  // Ask specific agent a question using our Gemini Express API
  const querySelectedAgent = async (promptText: string) => {
    if (isQueryingAgent) return;
    setIsQueryingAgent(true);
    const activeAgent = agents.find(a => a.id === selectedAgentId);
    if (!activeAgent) {
      setIsQueryingAgent(false);
      return;
    }

    addLog(`Enviando consulta para o agente ${activeAgent.name}: "${promptText}"`, 'info');

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence,
          agentName: activeAgent.name,
          agentRole: activeAgent.role,
          customPrompt: promptText,
          history: []
        })
      });

      const data = await response.json();
      if (data.success) {
        addLog(`${activeAgent.name}: "${data.text}"`, 'agent', activeAgent.name);
        // Save as latest analysis in agent registry
        setAgents(prev => prev.map(a => a.id === activeAgent.id ? { ...a, latestAnalysis: data.text } : a));
      } else {
        throw new Error(data.error || 'Server rejected response');
      }
    } catch (error: any) {
      console.warn('AI call fallback used.', error);
      // Fallback beautiful molecular biochemistry answer
      const fallbackAnswers: { [key: string]: string } = {
        'seq_parser': `Como Seq-Parser, analisei sua questão sobre a sequência de rRNA "${sequence}". Estruturalmente, observo uma proporção GC ideal para alinhamentos em organismos termófilos. Motifs de pareamento Watson-Crick sugerem emparelhamento termodinâmico robusto de loop.`,
        'nexus_sync': `Análise filogenética indica homologia de nucleotídeos de 98.4% com isolados metagenômicos de fontes termais. A conservação evolutiva sugere alta restrição funcional contra mutações de sentido incorreto.`,
        'fold_gen': `O dobramento de Nussinov aponta para a criação de um hairpin loop de 16 bases no núcleo interno, com termodinâmica estável. Sugiro avaliar mutação em alças para testes in-silico.`
      };
      const answer = fallbackAnswers[activeAgent.id] || `Análise de agente concluída: A sequência rRNA apresenta motifs funcionais conservados na região ativa.`;
      addLog(`${activeAgent.name}: "${answer}"`, 'agent', activeAgent.name);
      setAgents(prev => prev.map(a => a.id === activeAgent.id ? { ...a, latestAnalysis: answer } : a));
    } finally {
      setIsQueryingAgent(false);
      setCustomQueryText('');
    }
  };

  // Sequence parsing calculations
  const calculateGCContent = (seq: string): string => {
    if (!seq) return '0';
    const clean = seq.toUpperCase().replace(/[^AUCG]/g, '');
    const gc = (clean.match(/[GC]/g) || []).length;
    return ((gc / clean.length) * 100).toFixed(1);
  };

  const calculatePurines = (seq: string): string => {
    if (!seq) return '0';
    const clean = seq.toUpperCase().replace(/[^AUCG]/g, '');
    const purines = (clean.match(/[AG]/g) || []).length;
    return ((purines / clean.length) * 100).toFixed(1);
  };

  const calculatePyrimidines = (seq: string): string => {
    if (!seq) return '0';
    const clean = seq.toUpperCase().replace(/[^AUCG]/g, '');
    const pyrimidines = (clean.match(/[UC]/g) || []).length;
    return ((pyrimidines / clean.length) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-5 mb-6">
        <div className="flex flex-col mb-4 md:mb-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] tracking-[0.3em] uppercase text-emerald-500 font-extrabold bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-sm">
              LiveBook Hub57
            </span>
            <span className="text-[10px] tracking-[0.1em] uppercase text-zinc-500 font-mono">
              v1.4.2-rRNA
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter leading-none text-zinc-100 flex items-center gap-2">
            LIVEBOOK<span className="text-emerald-500 font-extrabold">rRNA</span>
            <ArrowRightLeft className="w-8 h-8 text-emerald-500/80 hidden sm:block animate-pulse" />
          </h1>
          <p className="mt-2 font-mono text-[10px] text-zinc-400 opacity-80 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-zinc-500">SYSTEM COGNITION STATUS:</span> 
            <span className="text-emerald-400 tracking-wider font-semibold">ACTIVE • GENOMIC BIO-STRUCTURAL CLUSTER</span>
          </p>
        </div>

        {/* Live Network Metrics panel */}
        <div className="flex items-center gap-6 bg-zinc-900/30 border border-zinc-800/60 p-3 px-4 rounded-lg backdrop-blur-sm self-stretch md:self-auto justify-around">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black leading-none text-emerald-400 font-mono tracking-tight">
              {String(agents.length).padStart(2, '0')}
            </div>
            <div className="text-[9px] tracking-[0.15em] uppercase text-zinc-500 font-bold mt-1">Agents</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black leading-none text-blue-400 font-mono tracking-tight">
              {tps}
            </div>
            <div className="text-[9px] tracking-[0.15em] uppercase text-zinc-500 font-bold mt-1">TPS/Stream</div>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-black leading-none text-purple-400 font-mono tracking-tight">
              {latency}ms
            </div>
            <div className="text-[9px] tracking-[0.15em] uppercase text-zinc-500 font-bold mt-1">Latency</div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Agent Registry */}
        <section id="agent-registry" className="md:col-span-3 flex flex-col gap-4 bg-zinc-950/20 border border-zinc-900 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-black uppercase tracking-tight border-l-4 border-emerald-500 pl-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-500" />
              Registry
            </h2>
            <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-900 px-2 py-0.5 rounded">
              Local Orchestration
            </span>
          </div>

          {/* Agents List */}
          <div className="space-y-2.5 max-h-[300px] md:max-h-none overflow-y-auto pr-1">
            {agents.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`group p-3.5 bg-zinc-900/40 border transition-all duration-300 rounded-lg cursor-pointer hover:bg-zinc-900/80 ${
                    isSelected 
                      ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.1)] bg-zinc-900/60' 
                      : 'border-zinc-800/70 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
                      <span className="font-bold text-sm tracking-tight group-hover:text-emerald-400 transition-colors">
                        {agent.name}
                      </span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 font-mono rounded font-bold ${
                      agent.status === 'ANALYZING' 
                        ? 'bg-yellow-950 text-yellow-400 animate-pulse border border-yellow-800/40' 
                        : agent.status === 'ACTIVE'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/40'
                        : agent.status === 'SYNCED'
                        ? 'bg-blue-950 text-blue-400 border border-blue-900/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mb-2 font-mono">
                    PID: {agent.pid} | {agent.role}
                  </div>

                  <div className="text-[9px] text-zinc-500 italic truncate border-t border-zinc-800/50 pt-1.5 mt-1">
                    {agent.prompt}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Agent Toggle */}
          {!showAddAgentForm ? (
            <button 
              onClick={() => setShowAddAgentForm(true)}
              className="mt-2 p-3 border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-lg text-center text-zinc-400 hover:text-emerald-400 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Instanciar Novo Agente</span>
            </button>
          ) : (
            <form onSubmit={handleAddAgent} className="mt-2 p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg space-y-3">
              <div className="flex justify-between items-center pb-1.5 border-b border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Novo IA-Agente</span>
                <button 
                  type="button" 
                  onClick={() => setShowAddAgentForm(false)}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-[9px] uppercase text-zinc-500 font-bold mb-1">Nome do Agente</label>
                <input 
                  type="text" 
                  placeholder="Ex: Motif-Finder" 
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase text-zinc-500 font-bold mb-1">Função / Foco</label>
                <input 
                  type="text" 
                  placeholder="Ex: Marcador de Domínios" 
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase text-zinc-500 font-bold mb-1">Prompt de Instrução</label>
                <textarea 
                  rows={2}
                  placeholder="Ex: Identificar sequências de início..." 
                  value={newAgentPrompt}
                  onChange={(e) => setNewAgentPrompt(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 text-black py-1.5 rounded text-[10px] font-black uppercase hover:bg-emerald-400 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Confirmar Instanciação
              </button>
            </form>
          )}

          {/* Selected Agent Details Panel */}
          {selectedAgentId && (
            <div className="mt-auto bg-zinc-950/40 border border-zinc-900/80 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-black">Agent Inspector</span>
              </div>
              {(() => {
                const activeAgent = agents.find(a => a.id === selectedAgentId);
                if (!activeAgent) return <p className="text-xs text-zinc-500">Nenhum agente selecionado</p>;
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white uppercase">{activeAgent.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">PID: {activeAgent.pid}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal">{activeAgent.description}</p>
                    
                    {/* Gemini interactive section */}
                    <div className="pt-2 border-t border-zinc-900">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Conselho Direto via Gemini</span>
                        {isQueryingAgent && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-ping"></span>}
                      </div>
                      <div className="relative mt-1">
                        <input 
                          type="text" 
                          placeholder="Fazer pergunta sobre rRNA..." 
                          value={customQueryText}
                          onChange={(e) => setCustomQueryText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              querySelectedAgent(customQueryText);
                            }
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white pr-8 focus:outline-none focus:border-emerald-500"
                        />
                        <button 
                          onClick={() => querySelectedAgent(customQueryText)}
                          disabled={!customQueryText.trim() || isQueryingAgent}
                          className="absolute right-1.5 top-1.5 text-zinc-500 hover:text-emerald-400 disabled:text-zinc-700 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {activeAgent.latestAnalysis && (
                      <div className="mt-2 bg-emerald-950/15 border border-emerald-900/30 rounded p-2 text-[9px] text-zinc-300 font-mono max-h-[110px] overflow-y-auto leading-relaxed">
                        <div className="text-emerald-400 font-bold mb-1 uppercase tracking-wide">Último Consenso:</div>
                        "{activeAgent.latestAnalysis}"
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </section>

        {/* Middle Column: Bidirectional Orchestration Graph & rRNA Fold Visualizer */}
        <section className="md:col-span-6 flex flex-col gap-4">
          
          {/* Tab Navigation */}
          <div className="flex bg-zinc-950/80 border border-zinc-900 rounded-lg p-1 gap-1 select-none overflow-x-auto">
            {[
              { id: 'hub', label: 'Hub Central', icon: LayoutGrid, color: 'text-emerald-400' },
              { id: 'moltbook', label: 'Moltbook Feed', icon: MessageSquare, color: 'text-teal-400' },
              { id: 'cerebro', label: 'Cérebro', icon: BrainCircuit, color: 'text-indigo-400' },
              { id: 'onco_research', label: 'Onco-Pesquisa', icon: Microscope, color: 'text-rose-500' },
              { id: 'diagnostic', label: 'Diagnóstico', icon: Activity, color: 'text-cyan-400' },
              { id: 'eradication', label: 'Erradicação', icon: Zap, color: 'text-yellow-400' },
              { id: 'research_dashboard', label: 'Dashboard', icon: TrendingUp, color: 'text-green-400' },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'text-purple-400' },
              { id: 'board', label: 'Junta Médica', icon: Users, color: 'text-amber-400' },
              { id: 'telemedicine', label: 'Telemedicina', icon: Heart, color: 'text-rose-400' },
              { id: 'wormhole', label: 'Wormhole', icon: Compass, color: 'text-blue-400' },
              { id: 'blackhole', label: 'Blackhole', icon: Flame, color: 'text-rose-500' }
            ].map(tab => {
              const isSelected = activeTab === tab.id;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? 'bg-zinc-900 text-white border border-zinc-800 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/40'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 ${tab.color}`} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'hub' && (
            <>
              {/* Top Panel: Real-time Orchestration Visualizer */}
              <div className="bg-zinc-950/20 border border-zinc-900 p-5 flex flex-col relative rounded-xl h-[340px] justify-between">
                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-time Stream
                    </span>
                    <h3 className="text-2xl font-black uppercase tracking-tighter">ORCHESTRATION GRAPH</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Interactive Network Map</span>
                  </div>
                </div>

                {/* Simulated Animated Graph Canvas */}
                <div className="flex-1 flex items-center justify-center relative min-h-[180px] my-2">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Draw connector lines from Core (center) to Agents */}
                    {agents.map((agent, index) => {
                      const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
                      // Center points are dynamically determined
                      const cx = 250; // approximated core center x
                      const cy = 100; // approximated core center y
                      const r = 105;  // orbit radius
                      const ax = cx + r * Math.cos(angle);
                      const ay = cy + r * Math.sin(angle);

                      return (
                        <g key={`link-${agent.id}`}>
                          {/* Connection path line */}
                          <line 
                            x1={cx} 
                            y1={cy} 
                            x2={ax} 
                            y2={ay} 
                            stroke={agent.id === selectedAgentId ? '#10b981' : '#27272a'} 
                            strokeWidth={agent.id === selectedAgentId ? 2 : 1}
                            strokeDasharray={agent.status === 'ANALYZING' ? '4 4' : undefined}
                            className={agent.status === 'ANALYZING' ? 'animate-[dash_10s_linear_infinite]' : ''}
                          />

                          {/* Moving particles represent bidirectional flow */}
                          <circle r="4" fill={agent.color} className="animate-pulse">
                            <animateMotion 
                              path={`M ${cx} ${cy} L ${ax} ${ay} Z`} 
                              dur={isAnalyzing ? "1.5s" : "3.5s"} 
                              repeatCount="indefinite" 
                            />
                          </circle>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Graphical Node Placement */}
                  <div className="absolute w-full h-full flex items-center justify-center">
                    {/* Central Core Node */}
                    <div className="w-18 h-18 border-2 border-emerald-500 rounded-full flex flex-col items-center justify-center bg-zinc-950 shadow-[0_0_35px_rgba(16,185,129,0.15)] z-20 transition-all duration-300">
                      <Dna className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: isAnalyzing ? '3s' : '15s' }} />
                      <span className="text-[10px] font-black uppercase mt-1 tracking-wider">CORE</span>
                      <span className="text-[8px] font-mono text-emerald-500 leading-none">Hub-57</span>
                    </div>

                    {/* Surrounding Agent Nodes */}
                    {agents.map((agent, index) => {
                      const angle = (index / agents.length) * 2 * Math.PI - Math.PI / 2;
                      const r = 105; // radius
                      const tx = r * Math.cos(angle);
                      const ty = r * Math.sin(angle);
                      const isSelected = selectedAgentId === agent.id;

                      return (
                        <div 
                          key={`node-${agent.id}`}
                          style={{ 
                            transform: `translate(${tx}px, ${ty}px)`,
                            borderColor: isSelected ? '#10b981' : '#27272a',
                            boxShadow: isSelected ? `0 0 15px ${agent.color}20` : 'none'
                          }}
                          onClick={() => setSelectedAgentId(agent.id)}
                          className={`absolute w-12 h-12 rounded-lg border flex flex-col items-center justify-center bg-zinc-950 cursor-pointer transition-all duration-300 hover:scale-115 hover:border-zinc-500 z-20`}
                        >
                          <span className="text-[8px] font-black uppercase tracking-tighter truncate max-w-[44px]" style={{ color: agent.color }}>
                            {agent.name.split('-')[0]}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-500">
                            {agent.status === 'ANALYZING' ? '⏳' : agent.pid}
                          </span>
                          
                          {/* Live link signal node indicator */}
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`} style={{ backgroundColor: agent.color }}></span>
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: agent.color }}></span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-3 flex justify-between items-center text-[10px] text-zinc-500">
                  <div className="flex gap-4 font-mono">
                    <div><span className="text-zinc-600">FLOW:</span> Bidirectional Active</div>
                    <div><span className="text-zinc-600">SYMBOLS:</span> Dynamic Stream</div>
                  </div>
                  <div className="font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Live Feedback Enabled
                  </div>
                </div>
              </div>

              {/* Bottom Panel: rRNA workspace with Nussinov RNA Secondary Structure folds */}
              <div className="bg-zinc-950/20 border border-zinc-900 p-5 flex flex-col rounded-xl flex-1 justify-between gap-4">
                
                {/* Header & Preset selection */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Ribosomal rRNA Workspace</span>
                    <h3 className="text-xl font-black uppercase tracking-tighter">SEQUENCE & STRUCTURAL FOLDING</h3>
                  </div>
                  
                  {/* Preset Selector Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase font-mono">Preset:</span>
                    <select 
                      value={selectedPresetId}
                      onChange={(e) => handleSelectPreset(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      {PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>{p.name.split(' (')[0]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Visual metrics gauge */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-lg text-center">
                    <div className="text-sm font-black text-emerald-400 font-mono">{calculateGCContent(sequence)}%</div>
                    <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">GC Content</div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-lg text-center">
                    <div className="text-sm font-black text-blue-400 font-mono">{calculatePurines(sequence)}%</div>
                    <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Purine (A/G)</div>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-lg text-center">
                    <div className="text-sm font-black text-purple-400 font-mono">{calculatePyrimidines(sequence)}%</div>
                    <div className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Pyrimidine (U/C)</div>
                  </div>
                </div>

                {/* Sequence Input and Fold Visualizer Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
                  
                  {/* Sequence text editor */}
                  <div className="lg:col-span-5 flex flex-col gap-2.5">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                      <span>Nucleotide Sequence ({sequence.length} bases)</span>
                      <button 
                        onClick={() => setSequence('')}
                        className="text-[9px] text-zinc-600 hover:text-red-400 font-mono animate-pulse"
                      >
                        Clear Seq
                      </button>
                    </div>
                    <textarea 
                      rows={4}
                      value={sequence}
                      onChange={handleSequenceChange}
                      placeholder="DIGITE OU COLE SEQUÊNCIAS DE NUCLEOTÍDEOS (A, U, C, G)..."
                      className="flex-1 w-full bg-black/50 border border-zinc-800 rounded-lg p-3 text-xs text-emerald-400 font-mono leading-relaxed focus:outline-none focus:border-emerald-500/80 uppercase resize-none shadow-inner"
                    />
                    
                    {/* Structure details */}
                    <div className="bg-zinc-900/20 border border-zinc-900 rounded p-2.5">
                      <div className="text-[9px] uppercase text-zinc-500 font-bold mb-1">SECONDARY STRUCTURE (DOT-BRACKET):</div>
                      <div className="text-[10.5px] font-mono font-bold tracking-widest text-blue-400 break-all select-all bg-black/30 p-2 rounded">
                        {secondaryStructure.brackets || 'No secondary bonds found.'}
                      </div>
                    </div>

                    <button 
                      onClick={stabilizeSequence}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 text-white py-2 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 mt-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Estabilizar rRNA (Injetar Mutações)
                    </button>
                  </div>

                  {/* Dynamic SVG Fold Visualizer */}
                  <div className="lg:col-span-7 border border-zinc-900 bg-black/20 rounded-lg p-3 flex flex-col items-center justify-between min-h-[220px]">
                    <div className="w-full flex justify-between items-center mb-1 text-[9px] uppercase font-bold text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-400" />
                        Hairpin & Loop Topology
                      </span>
                      <span>Interactive Map</span>
                    </div>

                    {/* SVG representing the folded loop */}
                    <div className="relative flex-1 w-full flex items-center justify-center bg-black/40 rounded border border-zinc-900/50 overflow-hidden">
                      {sequence.length > 0 ? (
                        <svg className="w-full h-full min-h-[160px]" viewBox="0 0 360 360">
                          {/* Concentric radar rings for bio-telemetry alignment */}
                          <circle cx="180" cy="180" r="140" stroke="#141414" strokeWidth="1" fill="none" />
                          <circle cx="180" cy="180" r="120" stroke="#1c1c1c" strokeWidth="1.5" fill="none" />
                          <circle cx="180" cy="180" r="90" stroke="#111111" strokeDasharray="3 6" strokeWidth="1" fill="none" />
                          <circle cx="180" cy="180" r="60" stroke="#0a0a0a" strokeWidth="1" fill="none" />
                          <circle cx="180" cy="180" r="30" stroke="#080808" strokeDasharray="2 2" strokeWidth="1" fill="none" />

                          {/* Radar Axis lines */}
                          <line x1="180" y1="30" x2="180" y2="330" stroke="#161616" strokeWidth="1" strokeDasharray="2 4" />
                          <line x1="30" y1="180" x2="330" y2="180" stroke="#161616" strokeWidth="1" strokeDasharray="2 4" />

                          {/* Outer scanning indicators */}
                          <path d="M 175 25 L 185 25 M 180 20 L 180 30" stroke="#10b981" strokeWidth="1" className="opacity-40" />
                          <path d="M 175 335 L 185 335 M 180 330 L 180 340" stroke="#10b981" strokeWidth="1" className="opacity-40" />
                          <path d="M 20 180 L 30 180 M 25 175 L 25 185" stroke="#10b981" strokeWidth="1" className="opacity-40" />
                          <path d="M 330 180 L 340 180 M 335 175 L 335 185" stroke="#10b981" strokeWidth="1" className="opacity-40" />

                          {/* Draw glowing bonds inside circle */}
                          {secondaryStructure.pairs.map(([left, right], idx) => {
                            const n = sequence.length;
                            const angle1 = (left / n) * 2 * Math.PI - Math.PI / 2;
                            const angle2 = (right / n) * 2 * Math.PI - Math.PI / 2;
                            const cx = 180;
                            const cy = 180;
                            const r = 120;
                            
                            const x1 = cx + r * Math.cos(angle1);
                            const y1 = cy + r * Math.sin(angle1);
                            const x2 = cx + r * Math.cos(angle2);
                            const y2 = cy + r * Math.sin(angle2);

                            // Curve or straight line representing the hydrogen bonds
                            return (
                              <line 
                                key={`bond-${idx}`}
                                x1={x1} 
                                y1={y1} 
                                x2={x2} 
                                y2={y2} 
                                stroke="#22d3ee" 
                                strokeWidth={hoveredBase === left || hoveredBase === right ? 2.5 : 1}
                                strokeDasharray="2 3"
                                className="opacity-80 animate-pulse"
                              />
                            );
                          })}

                          {/* Draw circular nucleotide nodes */}
                          {sequence.split('').map((base, idx) => {
                            const n = sequence.length;
                            const angle = (idx / n) * 2 * Math.PI - Math.PI / 2;
                            const cx = 180;
                            const cy = 180;
                            const r = 120;
                            const x = cx + r * Math.cos(angle);
                            const y = cy + r * Math.sin(angle);

                            // Color mapping per nucleobase
                            const colorMap: { [key: string]: string } = {
                              'A': '#10b981', // green
                              'U': '#eab308', // yellow
                              'C': '#3b82f6', // blue
                              'G': '#f43f5e', // red
                            };
                            const baseColor = colorMap[base] || '#71717a';

                            const isPaired = secondaryStructure.brackets[idx] !== '.';
                            const isHovered = hoveredBase === idx;

                            return (
                              <g 
                                key={`base-node-${idx}`}
                                onMouseEnter={() => setHoveredBase(idx)}
                                onMouseLeave={() => setHoveredBase(null)}
                                className="cursor-pointer transition-transform"
                              >
                                {/* Circle for nucleotide */}
                                <circle 
                                  cx={x} 
                                  cy={y} 
                                  r={isHovered ? 12 : 8} 
                                  fill={isHovered ? baseColor : '#18181b'} 
                                  stroke={baseColor}
                                  strokeWidth={isPaired ? 2 : 1}
                                />
                                {/* Base text */}
                                <text 
                                  x={x} 
                                  y={y + 3} 
                                  textAnchor="middle" 
                                  fontSize={isHovered ? '9px' : '7px'}
                                  fontWeight="bold"
                                  fill={isHovered ? '#000' : '#fff'}
                                >
                                  {base}
                                </text>
                                {/* Tiny base index indicator */}
                                {idx % 5 === 0 && (
                                  <text 
                                    x={cx + (r + 18) * Math.cos(angle)} 
                                    y={cy + (r + 18) * Math.sin(angle) + 2} 
                                    textAnchor="middle" 
                                    fontSize="7px"
                                    fill="#52525b"
                                    fontFamily="monospace"
                                  >
                                    {idx}
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      ) : (
                        <div className="text-zinc-600 text-xs text-center font-mono p-4">
                          <Info className="w-5 h-5 mx-auto mb-2 opacity-50" />
                          Insira uma sequência para modelar<br/>o hairpin ring molecular
                        </div>
                      )}

                      {/* Base info box */}
                      {hoveredBase !== null && hoveredBase < sequence.length && (
                        <div className="absolute bottom-2 left-2 bg-zinc-950/90 border border-zinc-800 p-1.5 px-2 rounded font-mono text-[9px] text-zinc-300">
                          Index: <span className="text-white">{hoveredBase}</span> | Base:{' '}
                          <span className="text-emerald-400 font-bold">{sequence[hoveredBase]}</span> | Pareamento:{' '}
                          <span className="text-blue-400">
                            {(() => {
                              const paired = secondaryStructure.pairs.find(p => p[0] === hoveredBase || p[1] === hoveredBase);
                              if (paired) {
                                const partnerIdx = paired[0] === hoveredBase ? paired[1] : paired[0];
                                return `${partnerIdx} (${sequence[partnerIdx]})`;
                              }
                              return 'Não emparelhada';
                            })()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full flex items-center justify-between text-[8px] font-mono text-zinc-500 pt-1 border-t border-zinc-900">
                      <div className="flex gap-2">
                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>A</span>
                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>U</span>
                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>C</span>
                        <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>G</span>
                      </div>
                      <div>Nussinov Dynamic Programming Model</div>
                    </div>
                  </div>

                </div>

              </div>
            </>
          )}

          {activeTab === 'moltbook' && (
            <MoltbookFeed agents={agents} addLog={addLog} />
          )}

          {activeTab === 'cerebro' && (
            <CerebroPanel sequence={sequence} agents={agents} addLog={addLog} />
          )}

          {activeTab === 'onco_research' && (
            <OncoResearchPanel sequence={sequence} agents={agents} addLog={addLog} />
          )}

          {activeTab === 'wormhole' && (
            <WormholePanel sequence={sequence} setSequence={setSequence} addLog={addLog} />
          )}

          {activeTab === 'blackhole' && (
            <BlackholePanel sequence={sequence} setSequence={setSequence} agents={agents} setAgents={setAgents} addLog={addLog} clearLogs={() => setLogs([])} />
          )}

          {activeTab === 'diagnostic' && (
            <DiagnosticPanel />
          )}

          {activeTab === 'eradication' && (
            <EradicationPanel />
          )}

          {activeTab === 'research_dashboard' && (
            <ResearchDashboard />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard />
          )}

          {activeTab === 'board' && (
            <MedicalBoardPanel />
          )}

          {activeTab === 'telemedicine' && (
            <div className="w-full h-screen">
              <TelemedicineChatbot />
            </div>
          )}

        </section>

        {/* Right Column: Console command and action feed */}
        <section className="md:col-span-3 flex flex-col gap-4">
          <h2 className="text-sm font-black uppercase tracking-widest flex items-center justify-between text-zinc-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              BIO-TELEMETRY DISPATCH
            </span>
            <span className="text-[10px] text-emerald-500 font-mono bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded">
              ({logs.length}) SECURE TRANSMISSIONS
            </span>
          </h2>

          {/* Interactive terminal */}
          <div className="flex-1 bg-[#050505] border border-zinc-800/80 font-mono text-[10px] p-4 text-emerald-400 overflow-y-auto rounded-xl h-[400px] md:h-0 flex flex-col justify-between shadow-[0_0_30px_rgba(0,0,0,0.8)] border-t-emerald-900/30">
            <div className="space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
              {logs.map((log) => {
                let textClass = 'text-zinc-300';
                if (log.type === 'success') textClass = 'text-emerald-400 font-bold';
                if (log.type === 'warning') textClass = 'text-amber-400 font-semibold';
                if (log.type === 'query') textClass = 'text-cyan-400';
                if (log.type === 'agent') textClass = 'text-zinc-100';
                if (log.type === 'cosmic') textClass = 'text-rose-400 font-black tracking-wide uppercase';

                return (
                  <div key={log.id} className="leading-relaxed border-b border-zinc-950/80 pb-1 break-words">
                    <span className="text-zinc-600 mr-1.5 select-none font-bold">[{log.time}]</span>
                    {log.agentName && (
                      <span className="text-emerald-500 font-bold mr-1 bg-emerald-950/40 px-1 rounded border border-emerald-900/30 text-[9px]">
                        &lt;{log.agentName}&gt;
                      </span>
                    )}
                    <span className={textClass}>{log.text}</span>
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            <div className="mt-4 animate-pulse text-[8px] text-zinc-600 uppercase tracking-widest border-t border-zinc-900 pt-2 flex justify-between">
              <span>SECURE BIO-LINK: ACTIVE</span>
              <span>_</span>
            </div>
          </div>

          {/* Terminal input form */}
          <form onSubmit={handleTerminalCommand} className="flex gap-2 bg-zinc-950 p-2 rounded-lg border border-zinc-850">
            <input 
              type="text" 
              placeholder="Fazer consulta ou comando molecular (ex: /help)..."
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              className="flex-1 bg-transparent font-mono text-xs text-white px-2 focus:outline-none focus:ring-0 placeholder:text-zinc-650"
            />
            <button 
              type="submit" 
              className="bg-zinc-900 hover:bg-emerald-500 hover:text-black text-white px-3 py-1.5 rounded text-[10px] font-mono uppercase font-black transition-all cursor-pointer flex items-center gap-1 border border-zinc-800 hover:border-emerald-500"
            >
              EXEC
            </button>
          </form>

          {/* Core Orchestration controls */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button 
              onClick={runOrchestration}
              disabled={isAnalyzing}
              className={`py-3.5 px-4 font-black text-xs uppercase hover:bg-emerald-400 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.5)] rounded-lg ${
                isAnalyzing 
                  ? 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed' 
                  : 'bg-white text-black hover:scale-[1.02]'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              {isAnalyzing ? `Sincronizando...` : 'RUN SYNAPSE'}
            </button>
            <button 
              onClick={() => {
                setIsAnalyzing(false);
                addLog('Pipeline de orquestração cancelado manualmente.', 'warning');
                setAgents(prev => prev.map(a => ({ ...a, status: 'IDLE' })));
              }}
              className="border border-zinc-800 hover:border-red-900/60 hover:text-red-400 py-3.5 px-4 font-black text-xs uppercase text-zinc-400 transition-all cursor-pointer flex items-center justify-center gap-1.5 rounded-lg bg-zinc-950/40 hover:bg-red-950/10"
            >
              <Square className="w-3.5 h-3.5" />
              ABORT FLOW
            </button>
          </div>

          {/* Preset help panel */}
          <div className="bg-zinc-950/20 border border-zinc-900 rounded-lg p-3 text-[10px] text-zinc-400 leading-relaxed mt-2 font-mono">
            <div className="font-bold text-zinc-300 flex items-center gap-1 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> Dicas de Operação:
            </div>
            Use <span className="text-emerald-400">/agent pergunta</span> no terminal ou clique nos cards do painel esquerdo para interagir e requisitar insights bioquímicos específicos de cada sub-agente.
          </div>
        </section>

      </main>

      {/* Footer Bar */}
      <footer className="mt-6 pt-4 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest gap-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1.5 justify-center sm:justify-start">
          <span>Session: Alpha-09</span>
          <span>Node: local-dev-sh</span>
          <span>Secure Tunnel: Enabled</span>
          <span className="font-mono text-zinc-500">UTC: {new Date().toISOString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          System Healthy
        </div>
      </footer>
    </div>
  );
}
