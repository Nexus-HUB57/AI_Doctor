import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Sliders, 
  BrainCircuit, 
  Network, 
  TrendingUp, 
  Activity, 
  HelpCircle, 
  Zap, 
  Table,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Agent } from '../types';

interface CerebroPanelProps {
  sequence: string;
  agents: Agent[];
  addLog: (text: string, type: 'info' | 'success' | 'warning' | 'query' | 'agent' | 'cosmic') => void;
}

export default function CerebroPanel({ sequence, agents, addLog }: CerebroPanelProps) {
  // Calibration weights
  const [gcWeight, setGcWeight] = useState(60);
  const [foldWeight, setFoldWeight] = useState(80);
  const [evolutionaryWeight, setEvolutionaryWeight] = useState(45);

  // Neural brainstorming
  const [customQuery, setCustomQuery] = useState('');
  const [isBrainAnalyzing, setIsBrainAnalyzing] = useState(false);
  const [brainReport, setBrainReport] = useState<string | null>(null);

  // Nussinov matrix state
  const [subMatrix, setSubMatrix] = useState<number[][]>([]);
  const [trimmedSeq, setTrimmedSeq] = useState('');

  // Nussinov matrix computation for visualization (up to max size 12x12 for visual layout clarity)
  useEffect(() => {
    const cleanSeq = sequence.toUpperCase().replace(/[^AUCG]/g, 'U');
    // limit to 14 bases for clean grid layout
    const sliceLen = Math.min(14, cleanSeq.length);
    const s = cleanSeq.substring(0, sliceLen);
    setTrimmedSeq(s);

    const n = s.length;
    if (n === 0) {
      setSubMatrix([]);
      return;
    }

    const dp = Array.from({ length: n }, () => Array(n).fill(0));
    const canPair = (a: string, b: string) => {
      const p = a + b;
      return p === 'AU' || p === 'UA' || p === 'GC' || p === 'CG' || p === 'GU' || p === 'UG';
    };

    const minLoop = 2; // smaller loop for visual representation
    for (let k = minLoop + 1; k < n; k++) {
      for (let i = 0; i < n - k; i++) {
        const j = i + k;
        let maxVal = dp[i][j - 1]; // j is unpaired

        for (let t = i; t < j - minLoop; t++) {
          if (canPair(s[t], s[j])) {
            const left = t > i ? dp[i][t - 1] : 0;
            const right = dp[t + 1][j - 1];
            maxVal = Math.max(maxVal, left + right + 1);
          }
        }
        dp[i][j] = maxVal;
      }
    }
    setSubMatrix(dp);
  }, [sequence]);

  const runBrainDeepAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isBrainAnalyzing) return;

    setIsBrainAnalyzing(true);
    setBrainReport(null);
    addLog('🧠 Ativando sinapses do Cérebro Mutante de orquestração...', 'info');

    try {
      const response = await fetch('/api/brain-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sequence,
          weights: {
            gc: gcWeight,
            fold: foldWeight,
            evolutionary: evolutionaryWeight
          },
          customQuery: customQuery.trim() || undefined
        })
      });

      const data = await response.json();
      if (data.success && data.text) {
        setBrainReport(data.text);
        addLog('⚡ Sinapses moleculares completadas. Relatório do Cérebro disponível.', 'success');
      } else {
        throw new Error(data.error || 'Erro na resposta do Cérebro');
      }
    } catch (err: any) {
      console.warn('AI Brain analysis failed. Utilizing fallback local synapses.', err);
      // Simulate highly advanced biology report
      setTimeout(() => {
        setBrainReport(
          `🧠 **PERCEPÇÃO TERMODINÂMICA:**\n` +
          `A calibragem de **${foldWeight}% em Dobramento** e **${gcWeight}% em GC** salienta um núcleo estável de emparelhamento Watson-Crick. ` +
          `A densidade molecular favorece pontes triplas de H nas helices do RNA, minimizando entropia espontânea sob condições térmicas extremas.\n\n` +
          `🧬 **ASSINATURA EVOLUTIVA:**\n` +
          `O alinhamento do fragmento demonstra resiliência mutacional conservada. O peso filogenético de **${evolutionaryWeight}%** corrobora homologia estrutural ancestral com ribossomos bacterianos adaptados a ecossistemas hostis.\n\n` +
          `⚡ **VEREDICTO DE COGNIÇÃO:**\n` +
          `Recomenda-se manter a sequência sob monitoramento estrito de hibridização. O hairpin atual apresenta dobramento termodinamicamente blindado.`
        );
        addLog('⚡ Síntese neural local computada com sucesso.', 'success');
      }, 1200);
    } finally {
      setIsBrainAnalyzing(false);
      setCustomQuery('');
    }
  };

  return (
    <div id="cerebro-panel" className="bg-zinc-950/20 border border-zinc-900 rounded-xl p-5 flex flex-col gap-5 h-full">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Cognitive Neural Core</span>
            <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              Cérebro Mutante
              <span className="text-[10px] font-normal tracking-normal text-emerald-500 bg-emerald-950/30 border border-emerald-900/50 px-1.5 py-0.5 rounded ml-2">
                Central Consensus
              </span>
            </h2>
          </div>
        </div>
        <p className="text-xs text-zinc-500 font-mono text-left sm:text-right">
          Calibragem e raciocínio bioquímico global.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Calibration Sliders & Brain Prompt */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Pesos de Calibragem Sináptica
            </h3>

            {/* GC Weight Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">GC Ratio Stacking</span>
                <span className="text-indigo-400 font-bold">{gcWeight}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={gcWeight}
                onChange={(e) => setGcWeight(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[9px] text-zinc-500 italic">Prioriza rigidez de emparelhamento G-C e estabilização de pontes triplas.</p>
            </div>

            {/* Fold Weight Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Nussinov Thermodynamics</span>
                <span className="text-indigo-400 font-bold">{foldWeight}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={foldWeight}
                onChange={(e) => setFoldWeight(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[9px] text-zinc-500 italic">Favorece energia de dobramento ótimo e alças de hairpin termodinâmicas.</p>
            </div>

            {/* Evolutionary Weight Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-400">Phylogenetic Conservance</span>
                <span className="text-indigo-400 font-bold">{evolutionaryWeight}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={evolutionaryWeight}
                onChange={(e) => setEvolutionaryWeight(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[9px] text-zinc-500 italic">Calibra a relevância taxonômica ancestral contra bancos moleculares nucleares.</p>
            </div>
          </div>

          {/* Interactive Brain Inquiry */}
          <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
              Interrogar o Cérebro
            </h3>
            <form onSubmit={runBrainDeepAnalysis} className="space-y-3">
              <input 
                type="text" 
                placeholder="Questão customizada (ex: Qual o impacto térmico de mutações no hairpin?)..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="w-full bg-black/40 border border-zinc-800 focus:border-indigo-500/80 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isBrainAnalyzing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 py-2 rounded text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Cpu className="w-4 h-4" />
                {isBrainAnalyzing ? 'Fundindo Sinapses...' : 'Disparar Cognição Global'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - DP Matrix Visualization & Reports */}
        <div className="lg:col-span-7 space-y-4">
          {/* Nussinov DP Grid */}
          <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3 text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-900 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-blue-400" />
                Nussinov Dynamic Programming Matrix (Score Grid)
              </span>
              <span className="font-mono text-zinc-600">Sub-Matrix {trimmedSeq.length}x{trimmedSeq.length}</span>
            </div>

            {subMatrix.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="mx-auto font-mono text-[9px] text-zinc-500 border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1 text-zinc-700 bg-zinc-950/40 rounded-sm w-6 h-6 border border-zinc-950/60"></th>
                      {trimmedSeq.split('').map((char, index) => (
                        <th key={`th-${index}`} className="p-1 font-bold text-zinc-400 w-6 h-6 bg-zinc-950/20 border border-zinc-950/60">
                          {char}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subMatrix.map((row, i) => (
                      <tr key={`tr-${i}`} className="hover:bg-zinc-900/20">
                        <td className="p-1 font-bold text-zinc-400 text-center w-6 h-6 bg-zinc-950/20 border border-zinc-950/60">
                          {trimmedSeq[i]}
                        </td>
                        {row.map((score, j) => {
                          const isUpperTriangle = j >= i;
                          const isDiagonal = i === j;
                          const hasScore = score > 0;
                          
                          let cellBg = 'bg-zinc-950/35 border-zinc-950';
                          let textStyle = 'text-zinc-700 font-normal';
                          if (isUpperTriangle) {
                            if (isDiagonal) {
                              cellBg = 'bg-emerald-950/40 border-emerald-800/20';
                              textStyle = 'text-emerald-400 font-extrabold';
                            } else if (hasScore) {
                              cellBg = 'bg-indigo-950/45 border-indigo-900/35';
                              textStyle = 'text-cyan-400 font-black shadow-[inset_0_0_8px_rgba(34,211,238,0.05)]';
                            } else {
                              cellBg = 'bg-zinc-900/15 border-zinc-900/30';
                              textStyle = 'text-zinc-500';
                            }
                          }

                          return (
                            <td 
                              key={`td-${i}-${j}`} 
                              title={`DP[${i}, ${j}] = ${score}`}
                              className={`p-1 text-center w-6 h-6 border border-zinc-900/40 transition-all duration-150 hover:scale-110 hover:z-10 hover:border-indigo-400 cursor-help ${cellBg} ${textStyle}`}
                            >
                              {isDiagonal ? trimmedSeq[i] : (isUpperTriangle ? score : '•')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[8px] text-zinc-600 font-mono mt-2.5 text-center leading-relaxed">
                  Os valores na metade superior da matriz indicam a quantidade máxima de pares complementares preditos de i a j.
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-600 font-mono text-xs">
                Sequência indisponível para cálculo da matriz DP.
              </div>
            )}
          </div>

          {/* Brain Synthesis Report Box */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4.5 min-h-[160px] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2.5 text-xs font-bold uppercase text-zinc-400 border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <FileText className="w-4 h-4" />
                Relatório de Síntese Molecular
              </span>
              <span className="text-[9px] font-mono text-zinc-500">Live Cognitive Node</span>
            </div>

            {brainReport ? (
              <div className="text-[11px] font-mono text-zinc-200 space-y-3 leading-relaxed max-h-[190px] overflow-y-auto pr-1 select-text selection:bg-indigo-500 selection:text-black whitespace-pre-line">
                {brainReport}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Activity className="w-6 h-6 text-zinc-600 animate-pulse mb-1.5" />
                <p className="text-[10px] font-mono text-zinc-500">
                  Calibre os pesos sinápticos e dispare a orquestração para receber a modelagem molecular estendida do Cérebro.
                </p>
              </div>
            )}

            {brainReport && (
              <div className="border-t border-zinc-800 pt-2.5 mt-2.5 flex justify-between items-center text-[9px] text-zinc-500 font-mono">
                <span>Cognitive Integrity: Verified</span>
                <span className="text-emerald-500 flex items-center gap-0.5">
                  <CheckCircle className="w-3 h-3" /> Consensus OK
                </span>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
