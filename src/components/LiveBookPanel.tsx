import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Zap, Microscope, Activity, ChevronRight, Save, RefreshCw,
  Upload, FileText, Dna, BarChart3, GitBranch, Target, Search,
  Download, Beaker, AlertTriangle, CheckCircle2, Info, X,
  ChevronDown, ChevronUp, Copy, AlignLeft, TreePine, Hash,
  Brain, Shield, Cpu, Database, Atom
} from 'lucide-react';
import Card from './base/Card';
import Button from './base/Button';
import {
  parseFASTA, exportToFASTA, identifyRRNA, gcContent, gcProfile,
  sequenceStats, kmerAnalysis, diversityIndices, needlemanWunsch,
  computeDistanceMatrix, upgmaTree, nussinov, complement, reverseComplement,
  ORGANISM_PRESETS, type FASTARecord, type rRNAIdentification,
  type SequenceStats, type KMerResult, type DiversityIndices,
  type NWAlignment, type DistanceMatrix, type GCProfile,
} from '../services/rnaBioinformatics';
import { medicalRAGPipeline, MEDICAL_KNOWLEDGE_BASE } from '../services/medicalRagEngine';
import type { RAGQueryResult } from '../services/medicalRagEngine';
import { runHealingCycle, generateHealthyAgentStates, getHealingHistory, getLastHealingCycle } from '../services/selfHealingEngine';
import type { HealingCycle } from '../services/selfHealingEngine';
import { processWisdomCycle, getWisdomState, getWisdomPatterns, getWisdomInsights } from '../services/wisdomEngine';
import type { WisdomState, WisdomPattern, WisdomInsight } from '../services/wisdomEngine';

type TabId = 'sequence' | 'composition' | 'alignment' | 'phylogeny' | 'structure' | 'rag' | 'healing';

const BASE_COLORS: Record<string, string> = { G: '#f87171', C: '#60a5fa', A: '#fbbf24', U: '#34d399' };

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'sequence', label: 'Sequência & Parser', icon: <FileText className="w-4 h-4" /> },
  { id: 'composition', label: 'Composição & Diversidade', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'alignment', label: 'Alinhamento NW', icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'phylogeny', label: 'Filogenia', icon: <TreePine className="w-4 h-4" /> },
  { id: 'structure', label: 'Estrutura 2D', icon: <Dna className="w-4 h-4" /> },
  { id: 'rag', label: 'RAG Pipeline', icon: <Brain className="w-4 h-4" /> },
  { id: 'healing', label: 'Auto-Cura DIMHEX', icon: <Shield className="w-4 h-4" /> },
];

export default function LiveBookPanel() {
  const [activeTab, setActiveTab] = useState<TabId>('sequence');
  const [rawFasta, setRawFasta] = useState('');
  const [fastaRecords, setFastaRecords] = useState<FASTARecord[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [kValue, setKValue] = useState(3);
  const [alignSubject, setAlignSubject] = useState('');
  const [windowSize, setWindowSize] = useState(50);
  const [presetNotice, setPresetNotice] = useState('');
  // RAG state
  const [ragQuery, setRagQuery] = useState('');
  const [ragResult, setRagResult] = useState<RAGQueryResult | null>(null);
  const [ragLoading, setRagLoading] = useState(false);
  // Healing state
  const [agentIds] = useState<string[]>([
    'dr_atlas', 'dra_elara', 'dr_kai', 'dra_vex', 'dr_nexus',
    'dra_mika', 'dr_orion', 'dra_luna', 'dr_sig', 'dra_nova',
    'dr_flux', 'dra_aura', 'dr_echo', 'dra_pulse', 'dr_cortex',
  ]);
  const [healingCycles, setHealingCycles] = useState<HealingCycle[]>([]);
  const [wisdomState, setWisdomState] = useState<WisdomState | null>(null);
  const [wisdomPatterns, setWisdomPatterns] = useState<WisdomPattern[]>([]);
  const [wisdomInsights, setWisdomInsights] = useState<WisdomInsight[]>([]);
  const helixRef = useRef<HTMLCanvasElement>(null);

  // --- RAG Query Handler ---
  const handleRAGQuery = useCallback(async () => {
    if (!ragQuery.trim() || ragLoading) return;
    setRagLoading(true);
    setRagResult(null);
    try {
      const result = await medicalRAGPipeline(ragQuery, MEDICAL_KNOWLEDGE_BASE);
      setRagResult(result);
    } catch (err) {
      console.error('RAG query error:', err);
    } finally {
      setRagLoading(false);
    }
  }, [ragQuery, ragLoading]);

  // --- Healing Cycle Handler ---
  const handleRunHealingCycle = useCallback(() => {
    const states = generateHealthyAgentStates(agentIds);
    // Inject some realistic anomalies for demonstration
    const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
    if (states[randomAgent]) {
      states[randomAgent].fidelity = 0.3 + Math.random() * 0.2;
      states[randomAgent].coherence = 0.25 + Math.random() * 0.2;
    }
    const secondAgent = agentIds[(agentIds.indexOf(randomAgent) + 3) % agentIds.length];
    if (states[secondAgent]) {
      states[secondAgent].decoherence = 0.5 + Math.random() * 0.2;
    }

    const cycle = runHealingCycle(states);
    const wisdom = processWisdomCycle(cycle);

    setHealingCycles(prev => [...prev, cycle]);
    setWisdomState(wisdom.updatedWisdomState);
    setWisdomPatterns(getWisdomPatterns());
    setWisdomInsights(getWisdomInsights());
  }, [agentIds]);

  const currentSeq = fastaRecords[selectedIdx]?.sequence ?? '';

  // --- FASTA Parser ---
  const handleParseFASTA = useCallback(() => {
    if (!rawFasta.trim()) return;
    const records = parseFASTA(rawFasta);
    if (records.length > 0) {
      setFastaRecords(records);
      setSelectedIdx(0);
    }
  }, [rawFasta]);

  const handleLoadPreset = useCallback((idx: number) => {
    const p = ORGANISM_PRESETS[idx];
    const fasta = `>${p.id} ${p.name} ${p.rRNA} rRNA [${p.source}]
${p.sequence}`;
    setRawFasta(fasta);
    const records = parseFASTA(fasta);
    setFastaRecords(records);
    setSelectedIdx(0);
    setPresetNotice(`${p.name} (${p.rRNA}) carregado`);
    setTimeout(() => setPresetNotice(''), 3000);
  }, []);

  const handleExportFASTA = useCallback(() => {
    if (fastaRecords.length === 0) return;
    const blob = new Blob([exportToFASTA(fastaRecords)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sequences.fasta'; a.click();
    URL.revokeObjectURL(url);
  }, [fastaRecords]);

  // --- Derived analyses (memoized) ---
  const stats = useMemo(() => currentSeq ? sequenceStats(currentSeq) : null, [currentSeq]);
  const gc = useMemo(() => currentSeq ? gcContent(currentSeq) : 0, [currentSeq]);
  const gcProf = useMemo(() => currentSeq ? gcProfile(currentSeq, windowSize) : null, [currentSeq, windowSize]);
  const kmer = useMemo(() => currentSeq ? kmerAnalysis(currentSeq, kValue) : null, [currentSeq, kValue]);
  const diversity = useMemo(() => currentSeq ? diversityIndices(currentSeq) : null, [currentSeq]);
  const rRNAId = useMemo(() => currentSeq ? identifyRRNA(currentSeq) : null, [currentSeq]);
  const nussinovResult = useMemo(() => currentSeq ? nussinov(currentSeq) : null, [currentSeq]);
  const nwResult = useMemo(() => {
    if (!currentSeq || !alignSubject.trim()) return null;
    return needlemanWunsch(currentSeq, alignSubject);
  }, [currentSeq, alignSubject]);

  const distMatrix = useMemo(() => {
    if (fastaRecords.length < 2) return null;
    return computeDistanceMatrix(fastaRecords.map(r => ({ id: r.id, sequence: r.sequence })));
  }, [fastaRecords]);

  const phyloTree = useMemo(() => {
    if (!distMatrix || distMatrix.labels.length < 2) return null;
    return upgmaTree(distMatrix);
  }, [distMatrix]);

  // --- Circular SVG for Nussinov ---
  const renderCircular = useCallback(() => {
    if (!nussinovResult || currentSeq.length === 0) return null;
    const { pairs, dotBracket } = nussinovResult;
    const n = currentSeq.length;
    const radius = Math.min(130, Math.max(60, n * 0.8));
    const cx = 170, cy = 170;
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), base: currentSeq[i] };
    });
    return (
      <svg width="340" height="340" className="mx-auto">
        {pairs.map(([i, j], idx) => (
          <line key={idx} x1={pts[i].x} y1={pts[i].y} x2={pts[j].x} y2={pts[j].y}
            stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="3 2" />
        ))}
        {pts.map((p, i) => i < n - 1 ? (
          <line key={`bb-${i}`} x1={p.x} y1={p.y} x2={pts[i+1].x} y2={pts[i+1].y} stroke="#475569" strokeWidth="0.8" />
        ) : null)}
        {pts.map((p, i) => (
          <g key={`b-${i}`}>
            <circle cx={p.x} cy={p.y} r={n > 200 ? 3 : 6} fill="#1e293b" stroke="#475569" />
            {n <= 150 && <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="bold" fill={BASE_COLORS[p.base] || '#94a3b8'}>{p.base}</text>}
          </g>
        ))}
      </svg>
    );
  }, [nussinovResult, currentSeq]);

  // --- Mini GC bar chart ---
  const renderGCChart = useCallback(() => {
    if (!gcProf || gcProf.windowGC.length < 2) return null;
    const w = 500, h = 120;
    const data = gcProf.windowGC;
    const maxGC = gcProf.maxGC || 1;
    const barW = Math.max(1, (w - 40) / data.length);
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {data.map((d, i) => {
          const barH = (d.gc / maxGC) * (h - 30);
          const x = 30 + i * barW;
          const y = h - 20 - barH;
          const color = d.gc > 0.6 ? '#f87171' : d.gc > 0.4 ? '#fbbf24' : '#34d399';
          return <rect key={i} x={x} y={y} width={Math.max(barW - 0.5, 0.5)} height={barH} fill={color} opacity="0.8" />;
        })}
        <text x="15" y={h - 10} fontSize="9" fill="#64748b">0%</text>
        <text x="5" y="15" fontSize="9" fill="#64748b">100%</text>
        <line x1="30" y1="10" x2="30" y2={h - 20} stroke="#334155" strokeWidth="0.5" />
        <line x1="30" y1={h - 20} x2={w - 10} y2={h - 20} stroke="#334155" strokeWidth="0.5" />
      </svg>
    );
  }, [gcProf]);

  // --- K-mer bar chart ---
  const renderKmerChart = useCallback(() => {
    if (!kmer || kmer.topKmers.length === 0) return null;
    const top = kmer.topKmers.slice(0, 15);
    const maxCount = top[0]?.count || 1;
    const w = 500, h = 180;
    const barH = Math.min(10, (h - 30) / top.length);
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {top.map((k, i) => {
          const barW = (k.count / maxCount) * (w - 120);
          const y = 15 + i * barH;
          return (
            <g key={k.kmer}>
              <text x={w - 110} y={y + barH * 0.75} fontSize="9" fontFamily="monospace" fill="#94a3b8" textAnchor="end">{k.kmer}</text>
              <rect x={w - 105} y={y + 1} width={barW} height={barH - 2} fill="#22d3ee" opacity="0.7" rx="2" />
              <text x={w - 105 + barW + 4} y={y + barH * 0.75} fontSize="8" fill="#64748b">{k.count}</text>
            </g>
          );
        })}
      </svg>
    );
  }, [kmer]);

  // --- Distance matrix table ---
  const renderDistMatrix = useCallback(() => {
    if (!distMatrix) return null;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead><tr className="border-b border-slate-700">
            <th className="p-2 text-slate-500"> </th>
            {distMatrix.labels.map(l => <th key={l} className="p-2 text-cyan-400 whitespace-nowrap">{l.slice(0, 16)}</th>)}
          </tr></thead>
          <tbody>
            {distMatrix.matrix.map((row, i) => (
              <tr key={i} className="border-b border-slate-800/50">
                <td className="p-2 text-cyan-400 whitespace-nowrap font-bold">{distMatrix.labels[i].slice(0, 16)}</td>
                {row.map((val, j) => (
                  <td key={j} className="p-2" style={{ background: `rgba(34,211,238,${val * 2})` }}>{val.toFixed(4)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [distMatrix]);

  // --- Newick tree display ---
  const renderNewick = useCallback(() => {
    if (!phyloTree) return null;
    const newickStr = phyloTree.name;
    return (
      <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-cyan-300 break-all max-h-48 overflow-y-auto">
        {newickStr.length > 200 ? newickStr.slice(0, 200) + '...' : newickStr}
      </div>
    );
  }, [phyloTree]);

  const hasSeq = currentSeq.length > 0;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Zap className="text-cyan-400" /> LiveBook-rRNA
          </h2>
          <p className="text-slate-400 text-sm mt-1">Bioinformática de rRNA — Parser FASTA, Composição, Alinhamento NW, Filogenia UPGMA, Nussinov</p>
        </div>
        <div className="flex gap-2">
          {fastaRecords.length > 0 && (
            <Button variant="outline" size="sm" icon={Download} onClick={handleExportFASTA}>Exportar FASTA</Button>
          )}
        </div>
      </div>

      {presetNotice && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" /> {presetNotice}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl border border-slate-800 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: SEQUENCE & PARSER ═══ */}
      {activeTab === 'sequence' && (
        <div className="space-y-5">
          {/* Presets */}
          <Card>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Beaker className="w-4 h-4 text-amber-400" /> Presets de Organismos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {ORGANISM_PRESETS.map((p, i) => (
                <button key={p.id} onClick={() => handleLoadPreset(i)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left group">
                  <div className="text-xs font-bold text-white group-hover:text-cyan-400 truncate">{p.name}</div>
                  <div className="text-[10px] text-slate-500">{p.rRNA} rRNA</div>
                </button>
              ))}
            </div>
          </Card>

          {/* FASTA Input */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Upload className="w-4 h-4 text-cyan-400" /> Input FASTA</h3>
              <span className="text-xs text-slate-600">Cole ou digite sequências FASTA</span>
            </div>
            <textarea value={rawFasta} onChange={e => setRawFasta(e.target.value)}
              className="w-full h-36 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
              placeholder={">E.coli K-12 16S rRNA\nAUGCGAUUCGAUCCG...\n\n>S.aureus 16S rRNA\nGGGAGGCAGCAGTGGGG..." />
            <div className="flex gap-2 mt-3">
              <Button variant="primary" size="sm" icon={Search} onClick={handleParseFASTA}>Parse FASTA</Button>
              {fastaRecords.length > 0 && (
                <span className="flex items-center text-xs text-emerald-400 gap-1"><CheckCircle2 className="w-3 h-3" /> {fastaRecords.length} sequência(s) carregada(s)</span>
              )}
            </div>
          </Card>

          {/* Sequence selector & rRNA ID */}
          {fastaRecords.length > 0 && (
            <div className="grid lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Dna className="w-4 h-4 text-cyan-400" /> Sequências Carregadas</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {fastaRecords.map((r, i) => (
                    <button key={i} onClick={() => setSelectedIdx(i)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        selectedIdx === i
                          ? 'bg-cyan-500/10 border-cyan-500/40'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{r.id}</span>
                        <span className="text-xs text-slate-500">{r.length} nt</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 truncate">{r.description || 'Sem descrição'}</div>
                      <div className="text-[10px] font-mono text-slate-600 mt-1 truncate">{r.sequence.slice(0, 80)}...</div>
                    </button>
                  ))}
                </div>
              </Card>
              <Card>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-rose-400" /> Identificação rRNA</h3>
                {rRNAId && hasSeq ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-4xl font-black text-cyan-400">{rRNAId.type}</div>
                      <div className="text-xs text-slate-500 mt-1">Tipo Identificado</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-slate-900 rounded-lg text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Confiança</div>
                        <div className="text-lg font-black text-emerald-400">{(rRNAId.confidence * 100).toFixed(0)}%</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg text-center">
                        <div className="text-[10px] text-slate-500 uppercase">Domínio</div>
                        <div className="text-sm font-bold text-amber-400">{rRNAId.domain}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {rRNAId.rationale.map((r, i) => (
                        <div key={i} className="text-[10px] text-slate-400 flex items-start gap-1">
                          <Info className="w-3 h-3 mt-0.5 text-slate-600 shrink-0" /> {r}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-600 py-8"><Microscope className="w-8 h-8 mx-auto mb-2 opacity-30" /><p className="text-xs">Carregue uma sequência</p></div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: COMPOSITION & DIVERSITY ═══ */}
      {activeTab === 'composition' && (
        <div className="space-y-5">
          {!hasSeq ? (
            <Card><div className="text-center text-slate-600 py-12"><BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhuma sequência carregada</p></div></Card>
          ) : (<>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {stats && [
                { label: 'Comprimento', value: `${stats.length} nt`, color: 'text-cyan-400' },
                { label: 'GC Content', value: `${(gc * 100).toFixed(1)}%`, color: 'text-blue-400' },
                { label: 'AU Content', value: `${(stats.atContent * 100).toFixed(1)}%`, color: 'text-rose-400' },
                { label: 'Peso Mol.', value: `${(stats.molecularWeight / 1000).toFixed(1)} kDa`, color: 'text-purple-400' },
                { label: 'Tm Est.', value: `${stats.tmEstimate}°C`, color: 'text-amber-400' },
              ].map((s, i) => (
                <div key={i} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{s.label}</div>
                  <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Nucleotide composition */}
            {stats && (
              <Card>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Composição de Nucleotídeos</h3>
                <div className="grid grid-cols-4 gap-4">
                  {(['A', 'U', 'G', 'C'] as const).map(base => {
                    const count = stats.nucleotideComposition[base];
                    const pct = (count / stats.length * 100).toFixed(1);
                    return (
                      <div key={base} className="text-center">
                        <div className="text-3xl font-black" style={{ color: BASE_COLORS[base] }}>{base}</div>
                        <div className="text-xs text-slate-500 mt-1">{count} ({pct}%)</div>
                        <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: BASE_COLORS[base] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* GC Profile */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Perfil GC (Sliding Window)</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">Window:</label>
                  <select value={windowSize} onChange={e => setWindowSize(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white">
                    {[20, 30, 50, 100, 200].map(s => <option key={s} value={s}>{s} nt</option>)}
                  </select>
                </div>
              </div>
              {renderGCChart()}
              {gcProf && (
                <div className="flex justify-between text-[10px] text-slate-600 mt-2">
                  <span>GC médio: {(gcProf.overallGC * 100).toFixed(1)}%</span>
                  <span>Min: {(gcProf.minGC * 100).toFixed(1)}%</span>
                  <span>Max: {(gcProf.maxGC * 100).toFixed(1)}%</span>
                </div>
              )}
            </Card>

            {/* Diversity Indices */}
            {diversity && (
              <Card>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Índices de Diversidade</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Shannon H</div>
                    <div className="text-2xl font-black text-emerald-400">{diversity.shannon.toFixed(3)}</div>
                    <div className="text-[10px] text-slate-600">max: {diversity.shannonMax.toFixed(3)}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Equitabilidade</div>
                    <div className="text-2xl font-black text-cyan-400">{diversity.shannonEvenness.toFixed(3)}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Simpson D</div>
                    <div className="text-2xl font-black text-amber-400">{diversity.simpson.toFixed(3)}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">1/D (Inv Simpson)</div>
                    <div className="text-2xl font-black text-rose-400">{diversity.simpsonInverse.toFixed(2)}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* K-mer Analysis */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Hash className="w-4 h-4 text-purple-400" /> Análise k-mer</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">k =</label>
                  <select value={kValue} onChange={e => setKValue(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white">
                    {[2, 3, 4, 5, 6].map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              {kmer && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-2 bg-slate-900 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase">k-mers únicos</div>
                      <div className="text-lg font-black text-cyan-400">{kmer.uniqueCount}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Possíveis</div>
                      <div className="text-lg font-black text-slate-400">{kmer.totalPossible}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Diversidade</div>
                      <div className="text-lg font-black text-emerald-400">{(kmer.diversity * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  {renderKmerChart()}
                </>
              )}
            </Card>
          </>)}
        </div>
      )}

      {/* ═══ TAB: ALIGNMENT ═══ */}
      {activeTab === 'alignment' && (
        <div className="space-y-5">
          {!hasSeq ? (
            <Card><div className="text-center text-slate-600 py-12"><AlignLeft className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhuma sequência carregada</p></div></Card>
          ) : (<>
            <Card>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Needleman-Wunsch — Alinhamento Global</h3>
              <p className="text-xs text-slate-500 mb-3">Query: <span className="text-cyan-400 font-mono">{fastaRecords[selectedIdx]?.id}</span> ({currentSeq.length} nt)</p>
              <textarea value={alignSubject} onChange={e => setAlignSubject(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                className="w-full h-24 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-amber-400 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                placeholder="Insira a sequência sujeito para alinhamento (A, U, G, C)..." />
              <div className="flex items-center gap-4 mt-3">
                <Button variant="outline" size="sm" onClick={() => {
                  if (fastaRecords.length > 1) {
                    const otherIdx = selectedIdx === 0 ? 1 : 0;
                    setAlignSubject(fastaRecords[otherIdx].sequence);
                  }
                }} icon={Copy}>Usar outra sequência</Button>
              </div>
            </Card>

            {nwResult && (
              <Card>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="p-2 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Score</div>
                    <div className="text-lg font-black text-cyan-400">{nwResult.score}</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Identidade</div>
                    <div className="text-lg font-black text-emerald-400">{(nwResult.identity * 100).toFixed(1)}%</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Mismatches</div>
                    <div className="text-lg font-black text-rose-400">{nwResult.mismatches}</div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-500 uppercase">Gaps</div>
                    <div className="text-lg font-black text-amber-400">{nwResult.gaps}</div>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-[10px] leading-relaxed overflow-x-auto">
                  <div className="text-cyan-400 whitespace-pre">{nwResult.queryAligned}</div>
                  <div className="text-slate-500 whitespace-pre">{nwResult.midline}</div>
                  <div className="text-amber-400 whitespace-pre">{nwResult.subjectAligned}</div>
                </div>
              </Card>
            )}

            {/* Complement / Reverse Complement */}
            <Card>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Complemento & Reverse Complement</h3>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Complemento:</div>
                  <div className="p-2 bg-slate-900 rounded text-emerald-400 break-all max-h-20 overflow-y-auto">{complement(currentSeq)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Reverse Complemento:</div>
                  <div className="p-2 bg-slate-900 rounded text-purple-400 break-all max-h-20 overflow-y-auto">{reverseComplement(currentSeq)}</div>
                </div>
              </div>
            </Card>
          </>)}
        </div>
      )}

      {/* ═══ TAB: PHYLOGENY ═══ */}
      {activeTab === 'phylogeny' && (
        <div className="space-y-5">
          {fastaRecords.length < 2 ? (
            <Card><div className="text-center text-slate-600 py-12"><TreePine className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Carregue pelo menos 2 sequências FASTA para análise filogenética</p></div></Card>
          ) : (<>
            <Card>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Matriz de Distâncias (p-distance)</h3>
              <p className="text-xs text-slate-500 mb-3">Calculada via Needleman-Wunsch — {fastaRecords.length} sequências</p>
              {renderDistMatrix()}
            </Card>
            <Card>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Árvore Filogenética — UPGMA (Newick)</h3>
              <p className="text-xs text-slate-500 mb-3">Árvore gerada por clustering hierárquico UPGMA a partir da matriz de distâncias</p>
              {renderNewick()}
            </Card>
          </>)}
        </div>
      )}

      {/* ═══ TAB: STRUCTURE ═══ */}
      {activeTab === 'structure' && (
        <div className="space-y-5">
          {!hasSeq ? (
            <Card><div className="text-center text-slate-600 py-12"><Dna className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhuma sequência carregada</p></div></Card>
          ) : nussinovResult && (
            <>
              <div className="grid lg:grid-cols-2 gap-5">
                <Card>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Estrutura Secundária — Nussinov (Visualização Circular)</h3>
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex items-center justify-center">{renderCircular()}</div>
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="p-2 bg-slate-900 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Pares de Base</div>
                      <div className="text-lg font-black text-cyan-400">{nussinovResult.pairs.length}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase">MFE (est.)</div>
                      <div className="text-lg font-black text-emerald-400">{nussinovResult.mfe.toFixed(1)}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Algoritmo</div>
                      <div className="text-xs font-bold text-slate-300">O(n³)</div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Notação Dot-Bracket</h3>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-[9px] leading-relaxed max-h-80 overflow-y-auto break-all">
                    <span className="text-slate-300">5&apos; </span>
                    <span className="text-cyan-400">{nussinovResult.dotBracket}</span>
                    <span className="text-slate-300"> 3&apos;</span>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="text-cyan-400 font-bold">(</span> = base emparelhada (5&apos;)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="text-cyan-400 font-bold">)</span> = base emparelhada (3&apos;)
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="text-slate-400 font-bold">.</span> = loop não emparelhado
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-slate-900 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">Sequência Colorida</div>
                    <div className="font-mono text-[10px] leading-relaxed break-all">
                      {currentSeq.split('').map((c, i) => (
                        <span key={i} style={{ color: BASE_COLORS[c] || '#64748b' }}>{c}</span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════ TAB: RAG PIPELINE ═══════ */}
      {activeTab === 'rag' && (
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" /> Pipeline RAG Médico — 6 Estágios
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {['Extract', 'Encode', 'Retrieve', 'Rerank', 'Augment', 'Generate'].map((stage, i) => {
                const colors = ['text-blue-400', 'text-emerald-400', 'text-purple-400', 'text-amber-400', 'text-cyan-400', 'text-rose-400'];
                const bgs = ['bg-blue-500/10 border-blue-500/20', 'bg-emerald-500/10 border-emerald-500/20', 'bg-purple-500/10 border-purple-500/20', 'bg-amber-500/10 border-amber-500/20', 'bg-cyan-500/10 border-cyan-500/20', 'bg-rose-500/10 border-rose-500/20'];
                const descs = ['Chunking recursivo', 'TF-IDF + N-gram', 'BM25 scoring', 'Cross-encoder', 'Context window', 'Síntese LLM'];
                return (
                  <div key={stage} className={`p-2 rounded-lg border text-center ${bgs[i]}`}>
                    <div className={`text-[10px] font-bold ${colors[i]}`}>{stage}</div>
                    <div className="text-[9px] text-slate-500">{descs[i]}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  value={ragQuery} onChange={e => setRagQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRAGQuery()}
                  placeholder="Pergunte sobre protocolo DIMHEX, câncer de mama, biomarcadores..."
                  className="w-full h-9 pl-8 pr-3 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleRAGQuery} disabled={ragLoading}>
                {ragLoading ? 'Buscando...' : 'Consultar RAG'}
              </Button>
            </div>
          </Card>

          {ragResult && (
            <>
              <Card>
                <div className="flex gap-4 text-[10px] text-slate-500 mb-3">
                  <span>Documentos: {ragResult.pipeline.documentsScanned}</span>
                  <span>Recuperados: {ragResult.pipeline.retrieved}</span>
                  <span>Rerankeds: {ragResult.pipeline.reranked}</span>
                  <span>Contexto: {ragResult.pipeline.contextChars} chars</span>
                </div>
                {ragResult.answer && (
                  <div className="p-3 bg-slate-800/50 rounded-lg mb-3">
                    <div className="text-[10px] text-slate-500 uppercase mb-1">Resposta RAG</div>
                    <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{ragResult.answer}</div>
                  </div>
                )}
              </Card>
              {ragResult.retrieved.length > 0 && (
                <Card>
                  <div className="text-[10px] text-slate-500 uppercase mb-2">Fontes Recuperadas</div>
                  <div className="space-y-1.5">
                    {ragResult.retrieved.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30 border border-slate-700/20 hover:border-slate-600/30 transition-colors">
                        <span className="text-[9px] text-slate-600 font-mono w-4 text-right">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-300 font-medium truncate">{r.title}</div>
                          <div className="text-[9px] text-slate-600">{r.agent} · {r.source}</div>
                        </div>
                        <span className="text-[9px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">{r.score}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════ TAB: AUTO-CURA DIMHEX ═══════ */}
      {activeTab === 'healing' && (
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Motor de Auto-Cura — DIMHEX Wisdom Engine
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {wisdomState ? [
                { label: 'Ciclos', value: wisdomState.totalCyclesProcessed.toString(), color: 'text-blue-400' },
                { label: 'Wisdom Score', value: (wisdomState.wisdomScore * 100).toFixed(1) + '%', color: 'text-emerald-400' },
                { label: 'Padrões', value: wisdomState.patternsCount.toString(), color: 'text-amber-400' },
                { label: 'Insights', value: wisdomState.insightsCount.toString(), color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="p-2 bg-slate-800/50 rounded-lg text-center">
                  <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-500">{s.label}</div>
                </div>
              )) : (
                <div className="col-span-4 text-center text-xs text-slate-500 py-4">Nenhum ciclo executado. Clique em "Executar Ciclo" para iniciar.</div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={handleRunHealingCycle}>
                <Zap className="w-3.5 h-3.5 mr-1" /> Executar Ciclo de Cura
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setHealingCycles([]); setWisdomState(null); setWisdomPatterns([]); setWisdomInsights([]); }}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Resetar
              </Button>
            </div>
          </Card>

          {healingCycles.length > 0 && (
            <Card>
              <div className="text-[10px] text-slate-500 uppercase mb-2">Ultimo Ciclo de Cura</div>
              {(() => { const last = healingCycles[healingCycles.length - 1]; return (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: 'Agentes', value: last.agentsMonitored },
                    { label: 'Anomalias', value: last.anomaliesDetected },
                    { label: 'Criticas', value: last.anomaliesCritical, color: last.anomaliesCritical > 0 ? 'text-red-400' : 'text-slate-300' },
                    { label: 'Acoes', value: last.healingActionsExecuted },
                    { label: 'Sucesso', value: (last.healingSuccessRate * 100).toFixed(0) + '%', color: last.healingSuccessRate > 0.7 ? 'text-emerald-400' : 'text-amber-400' },
                    { label: 'Duracao', value: last.durationMs + 'ms' },
                  ].map(m => (
                    <div key={m.label} className="p-2 bg-slate-800/30 rounded-lg text-center">
                      <div className={`text-sm font-bold ${'color' in m && m.color ? m.color : 'text-slate-300'}`}>{m.value}</div>
                      <div className="text-[9px] text-slate-500">{m.label}</div>
                    </div>
                  ))}
                </div>
              ); })()}
              {healingCycles[healingCycles.length - 1].reports.length > 0 && (
                <div className="mt-3 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase">Anomalias Detectadas</div>
                  {healingCycles[healingCycles.length - 1].reports.slice(0, 5).map(r => (
                    <div key={r.id} className={`flex items-center gap-2 text-[10px] p-1.5 rounded ${r.severity === 'critical' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      <AlertTriangle className="w-3 h-3" />
                      <span className="font-medium">{r.agentName}</span>
                      <span className="text-slate-500">{r.type.replace('_', ' ')}</span>
                      <span className="ml-auto font-mono">{(r.value * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {wisdomPatterns.length > 0 && (
            <Card>
              <div className="text-[10px] text-slate-500 uppercase mb-2">Padroes de Sabedoria ({wisdomPatterns.length})</div>
              {wisdomPatterns.slice(0, 5).map(p => (
                <div key={p.id} className="p-2 mb-1.5 bg-slate-800/30 rounded-lg border border-slate-700/20">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-purple-400">#{p.frequency}x</span>
                    <span className="text-xs text-slate-300">{p.pattern.replace(/_/g, ' ')}</span>
                    <span className="ml-auto text-[9px] text-slate-500">conf: {(p.confidence * 100).toFixed(0)}%</span>
                  </div>
                  {p.rootCauseHypothesis && <div className="text-[10px] text-slate-400">{p.rootCauseHypothesis}</div>}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
