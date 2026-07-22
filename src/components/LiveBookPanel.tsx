import React, { useState, useCallback, useMemo } from 'react';
import {
  Upload, Dna, FlaskConical, BarChart3, GitBranch,
  FileText, Save, RotateCcw, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, Activity, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend
} from 'recharts';
import Card from './base/Card';
import Button from './base/Button';
import Badge from './base/Badge';
import Modal from './base/Modal';
import {
  parseSequences, identifyRRNAGenes, classifySequence,
  computeKmerFrequencies, computeDiversityIndices, computeComposition,
  needlemanWunsch, buildDistanceMatrix, upgmaToNewick,
} from '../lib/bio';
import type { ParsedSequence, RRNAGeneHit } from '../lib/bio';

// ── Color Palette ──
const COLORS = {
  A: '#10b981', U: '#f59e0b', G: '#ef4444', C: '#3b82f6',
  GC: '#8b5cf6', AU: '#f97316',
};
const PIE_COLORS = [COLORS.A, COLORS.U, COLORS.G, COLORS.C];
const SCATTER_COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#4ade80', '#fbbf24', '#f87171', '#60a5fa'];

type AnalysisTab = 'upload' | 'composition' | 'kmer' | 'diversity' | 'alignment' | 'phylogeny';

// ── Example Sequences for quick demo ──
const EXAMPLES = [
  { label: 'E. coli 16S fragment', seq: 'GGCCUUCGGGCUAGGUUACAACGGAGGGGGCUACCGGGCGCAGCUAACGCATTAAGCACTCCGCCTGGGGAGTACGGCCGCAAGGCTGAAACTCAAAGGAATTGACGGGGGCCCGCACAAGCGGTGGAGCATGTGGTTTAATTCGA' },
  { label: 'S. cerevisiae 18S fragment', seq: 'CCTACGGGAGGCAGCAGTGCTAATTACGCGAATTCCAGCTCCAAAGGGTAAACTCCTTTCGGAGGAGCAGTGGCGAACGGCTCAGTAACGCGTTGAACCGACGGATCACTCGGCCGCTAAACGATC' },
  { label: 'Human 5S rRNA', seq: 'GCCUACGGCCAUACCACCCUGAACGCGCCCGAUCUCGUCUGAUCUCGGAAGCUAAGCAGGGUUCGAAUCCCUGUAGGUUCGAAUCCCUGUAGACCGGUGGUACCGGGUGUGAUUCGGUGGCGGG' },
];

export default function LiveBookPanel() {
  const [rawInput, setRawInput] = useState('');
  const [sequences, setSequences] = useState<ParsedSequence[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('upload');
  const [alignModalOpen, setAlignModalOpen] = useState(false);
  const [kValue, setKValue] = useState(3);
  const [fileName, setFileName] = useState('');

  const currentSeq = sequences[selectedIdx] || null;

  // ── File Upload Handler ──
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        const parsed = parseSequences(text);
        if (parsed.length > 0) {
          setSequences(parsed);
          setSelectedIdx(0);
          setActiveTab('composition');
        }
      }
    };
    reader.readAsText(file);
  }, []);

  // ── Analyze Text Input ──
  const handleAnalyzeText = useCallback(() => {
    if (!rawInput.trim()) return;
    const parsed = parseSequences(rawInput.trim());
    if (parsed.length > 0) {
      setSequences(parsed);
      setSelectedIdx(0);
      setActiveTab('composition');
    }
  }, [rawInput]);

  // ── Load Example ──
  const loadExample = useCallback((idx: number) => {
    setRawInput(EXAMPLES[idx].seq);
    const parsed = parseSequences(EXAMPLES[idx].seq);
    setSequences(parsed);
    setSelectedIdx(0);
    setActiveTab('composition');
  }, []);

  // ── Computed Analyses ──
  const rnaHits = useMemo(() =>
    currentSeq ? identifyRRNAGenes(currentSeq.sequence) : [],
    [currentSeq]
  );

  const classification = useMemo(() =>
    currentSeq ? classifySequence(currentSeq.sequence) : '—',
    [currentSeq]
  );

  const composition = useMemo(() =>
    currentSeq ? computeComposition(currentSeq.sequence) : null,
    [currentSeq]
  );

  const kmerData = useMemo(() =>
    currentSeq ? computeKmerFrequencies(currentSeq.sequence, kValue).slice(0, 20) : [],
    [currentSeq, kValue]
  );

  const diversity = useMemo(() =>
    currentSeq ? computeDiversityIndices(currentSeq.sequence, kValue) : null,
    [currentSeq, kValue]
  );

  const alignResult = useMemo(() => {
    if (sequences.length < 2 || !currentSeq) return null;
    const otherIdx = selectedIdx === 0 ? 1 : 0;
    return needlemanWunsch(currentSeq.sequence, sequences[otherIdx].sequence);
  }, [sequences, selectedIdx, currentSeq]);

  const distMatrix = useMemo(() => {
    if (sequences.length < 2) return null;
    return buildDistanceMatrix(sequences.map(s => ({ id: s.id, sequence: s.sequence })));
  }, [sequences]);

  const newickTree = useMemo(() => {
    if (!distMatrix) return '';
    return upgmaToNewick(distMatrix);
  }, [distMatrix]);

  const radarData = useMemo(() => {
    if (!composition) return [];
    return [
      { base: 'A', value: composition.A },
      { base: 'U', value: composition.U },
      { base: 'G', value: composition.G },
      { base: 'C', value: composition.C },
    ];
  }, [composition]);

  const scatterData = useMemo(() => {
    if (sequences.length < 2) return [];
    return sequences.map((s, i) => ({
      name: s.id,
      gc: s.gcContent,
      length: s.length,
    }));
  }, [sequences]);

  // ── Alignment display helper ──
  const renderAlignment = (result: NonNullable<typeof alignResult>) => {
    const chunks = 60;
    const rows: { pos: string; a: string; b: string; match: string }[] = [];
    for (let i = 0; i < result.alignedA.length; i += chunks) {
      const aChunk = result.alignedA.substring(i, i + chunks);
      const bChunk = result.alignedB.substring(i, i + chunks);
      let matchLine = '';
      for (let j = 0; j < aChunk.length; j++) {
        if (aChunk[j] === '-' || bChunk[j] === '-') matchLine += ' ';
        else if (aChunk[j] === bChunk[j]) matchLine += '|';
        else matchLine += '.';
      }
      rows.push({ pos: `${i + 1}`, a: aChunk, b: bChunk, match: matchLine });
    }
    return rows;
  };

  // ── Export Results ──
  const exportCSV = useCallback(() => {
    if (!currentSeq) return;
    const comp = composition || computeComposition(currentSeq.sequence);
    const div = diversity || computeDiversityIndices(currentSeq.sequence, kValue);
    const csv = [
      'Metric,Value',
      `Sequence_ID,${currentSeq.id}`,
      `Length,${currentSeq.length}`,
      `GC_Content,${currentSeq.gcContent}%`,
      `Classification,${classification}`,
      `A%,${comp.A}`,
      `U%,${comp.U}`,
      `G%,${comp.G}`,
      `C%,${comp.C}`,
      `Shannon_Entropy,${div.shannon}`,
      `Simpson_Index,${div.simpson}`,
      `Pielou_Evenness,${div.evenness}`,
      `K-mer_Richness,${div.richness}`,
      ...rnaHits.map(h => `rRNA_${h.gene}_Confidence,${h.confidence}%`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${currentSeq.id}_analysis.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [currentSeq, composition, diversity, classification, rnaHits, kValue]);

  const exportNewick = useCallback(() => {
    if (!newickTree) return;
    const blob = new Blob([newickTree], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'phylogeny.nwk'; a.click();
    URL.revokeObjectURL(url);
  }, [newickTree]);

  // ── Tab definitions ──
  const tabs: { id: AnalysisTab; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
    { id: 'composition', label: 'Composicao', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'kmer', label: 'K-mer', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'diversity', label: 'Diversidade', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'alignment', label: 'Alinhamento', icon: <GitBranch className="w-3.5 h-3.5" /> },
    { id: 'phylogeny', label: 'Filogenia', icon: <Dna className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Dna className="w-5 h-5 text-cyan-400" />
            </div>
            LiveBook-rRNA
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Analise bioinformatica de rRNA — parse, identifique, alinhe e construa filogenias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={FileText} onClick={exportCSV} disabled={!currentSeq}>
            CSV
          </Button>
          <Button variant="ghost" size="sm" icon={Save} onClick={exportNewick} disabled={!newickTree}>
            Newick
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-cyan-400'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════ UPLOAD TAB ═══════════════ */}
      {activeTab === 'upload' && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* File Upload */}
          <Card>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Upload FASTA / FASTQ / Sequencia
            </h3>
            <label className="block w-full border-2 border-dashed border-zinc-700 hover:border-cyan-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors group">
              <input
                type="file"
                accept=".fasta,.fa,.fna,.fastq,.fq,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-zinc-600 group-hover:text-cyan-400 mx-auto mb-2 transition-colors" />
              <p className="text-sm text-zinc-400 group-hover:text-cyan-300">
                {fileName || 'Clique ou arraste um arquivo FASTA / FASTQ'}
              </p>
              <p className="text-[10px] text-zinc-600 mt-1">.fasta .fna .fastq .fq .txt</p>
            </label>

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">Ou cole uma sequencia:</p>
              <textarea
                rows={4}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="GGCCUUCGGGCGCAGCUAACGCATTAAGCACTCCGCCTGGGGAG..."
                className="w-full bg-black/40 border border-zinc-800 focus:border-cyan-500/80 rounded-lg p-3 font-mono text-xs text-cyan-400 placeholder:text-zinc-600 focus:outline-none resize-none transition-colors"
              />
              <Button
                variant="primary"
                size="sm"
                className="mt-2 w-full"
                onClick={handleAnalyzeText}
                disabled={!rawInput.trim()}
                icon={Zap}
              >
                Analisar
              </Button>
            </div>
          </Card>

          {/* Examples */}
          <Card>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              Sequencias de Referencia
            </h3>
            <div className="space-y-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => loadExample(i)}
                  className="w-full text-left p-3 bg-zinc-900/40 border border-zinc-800 hover:border-emerald-500/40 rounded-lg transition-all group cursor-pointer"
                >
                  <p className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400">{ex.label}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1 truncate">{ex.seq}</p>
                </button>
              ))}
            </div>

            {sequences.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">
                  {sequences.length} sequencia(s) carregada(s)
                </p>
                <div className="space-y-1">
                  {sequences.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedIdx(i); setActiveTab('composition'); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                        selectedIdx === i
                          ? 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-400'
                          : 'bg-zinc-900/30 border border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-mono font-bold truncate">{s.id}</span>
                      <span className="text-[10px] text-zinc-500">{s.length} nt | GC {s.gcContent}%</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══════════════ COMPOSITION TAB ═══════════════ */}
      {activeTab === 'composition' && currentSeq && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Stats Cards */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                Composicao Nucleotidica — {currentSeq.id}
              </h3>
              <Badge variant="primary" size="sm">{currentSeq.length} nt</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {composition && (
                <>
                  {([['A', composition.A, COLORS.A], ['U', composition.U, COLORS.U], ['G', composition.G, COLORS.G], ['C', composition.C, COLORS.C]] as const).map(([base, pct, color]) => (
                    <div key={base} className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Base {base}</div>
                      <div className="text-xl font-black" style={{ color }}>{pct}%</div>
                    </div>
                  ))}
                </>
              )}
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Conteudo GC</div>
                <div className="text-xl font-black text-purple-400">{currentSeq.gcContent}%</div>
              </div>
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Classificacao</div>
                <div className="text-[11px] font-bold text-emerald-400 leading-tight mt-0.5">{classification}</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">Distribuicao Nucleotidica</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={radarData}
                      dataKey="value"
                      nameKey="base"
                      cx="50%" cy="50%" outerRadius={70} innerRadius={35}
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {radarData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">Perfil de Composicao</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#3f3f46" />
                    <PolarAngleAxis dataKey="base" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 50]} tick={{ fill: '#52525b', fontSize: 8 }} />
                    <Radar name="%" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '11px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          {/* rRNA Gene Hits */}
          <Card>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Dna className="w-4 h-4 text-rose-400" />
              Identificacao rRNA
            </h3>
            {rnaHits.length > 0 ? (
              <div className="space-y-2.5">
                {rnaHits.map((hit: RRNAGeneHit) => (
                  <div key={hit.gene} className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-black text-white">{hit.gene} rRNA</span>
                      <Badge variant={hit.confidence >= 70 ? 'success' : 'warning'} size="sm">
                        {hit.confidence}%
                      </Badge>
                    </div>
                    <p className="text-[10px] text-zinc-500 mb-1">{hit.region}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Pos: {hit.start}–{hit.end} | Consenso: {hit.consensusMatch}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="w-8 h-8 text-zinc-600 mb-2" />
                <p className="text-xs text-zinc-500">Nenhuma regiao conservada de rRNA identificada com confianca significativa.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ═══════════════ K-MER TAB ═══════════════ */}
      {activeTab === 'kmer' && currentSeq && (
        <Card>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Frequencia de K-mer ({kValue}-mer) — {currentSeq.id}
            </h3>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500">k =</label>
              <select
                value={kValue}
                onChange={(e) => setKValue(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {[2, 3, 4, 5].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={kmerData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <XAxis dataKey="kmer" tick={{ fill: '#71717a', fontSize: 9 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#52525b', fontSize: 9 }} label={{ value: 'Frequencia', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '11px' }} />
              <Bar dataKey="frequency" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ═══════════════ DIVERSITY TAB ═══════════════ */}
      {activeTab === 'diversity' && currentSeq && diversity && (
        <Card>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Indices de Diversidade — {currentSeq.id} ({kValue}-mer)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Shannon H</div>
              <div className="text-2xl font-black text-cyan-400">{diversity.shannon}</div>
              <p className="text-[9px] text-zinc-600 mt-1">bits de informacao</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Simpson 1-D</div>
              <div className="text-2xl font-black text-emerald-400">{diversity.simpson}</div>
              <p className="text-[9px] text-zinc-600 mt-1">diversidade inversa</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Pielou J</div>
              <div className="text-2xl font-black text-purple-400">{diversity.evenness}</div>
              <p className="text-[9px] text-zinc-600 mt-1">equitabilidade (0-1)</p>
            </div>
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
              <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Riqueza</div>
              <div className="text-2xl font-black text-amber-400">{diversity.richness}</div>
              <p className="text-[9px] text-zinc-600 mt-1">k-mers unicos</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={[
              { metric: 'Shannon', value: diversity.shannon * 5 },
              { metric: 'Simpson', value: diversity.simpson * 5 },
              { metric: 'Evenness', value: diversity.evenness * 5 },
              { metric: 'Richness/10', value: Math.min(diversity.richness / 10, 5) },
            ]}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} />
              <Radar name="Indices" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ═══════════════ ALIGNMENT TAB ═══════════════ */}
      {activeTab === 'alignment' && currentSeq && (
        <Card>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-blue-400" />
              Alinhamento Needleman-Wunsch
            </h3>
            {sequences.length >= 2 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedIdx}
                  onChange={(e) => setSelectedIdx(Number(e.target.value))}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                >
                  {sequences.map((s, i) => <option key={s.id} value={i}>{s.id}</option>)}
                </select>
                <span className="text-[10px] text-zinc-500">vs</span>
                <span className="text-xs text-cyan-400 font-mono font-bold">
                  {sequences.find((_, i) => i !== selectedIdx)?.id || '—'}
                </span>
              </div>
            )}
          </div>

          {alignResult ? (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Score</div>
                  <div className="text-lg font-black text-cyan-400">{alignResult.score}</div>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Identidade</div>
                  <div className="text-lg font-black text-emerald-400">{alignResult.identity}%</div>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Similaridade</div>
                  <div className="text-lg font-black text-purple-400">{alignResult.similarity}%</div>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Gaps</div>
                  <div className="text-lg font-black text-amber-400">{alignResult.gaps}</div>
                </div>
              </div>

              <div className="bg-black/40 rounded-xl p-3 overflow-x-auto max-h-[300px] overflow-y-auto">
                {renderAlignment(alignResult).map((row, i) => (
                  <div key={i} className="font-mono text-[9px] leading-tight">
                    <span className="text-zinc-600 inline-block w-10 text-right mr-2">{row.pos}</span>
                    <span className="text-cyan-400">{row.a}</span>
                    <br />
                    <span className="text-zinc-600 inline-block w-10 mr-2" />
                    <span className="text-emerald-500">{row.match}</span>
                    <br />
                    <span className="text-zinc-600 inline-block w-10 mr-2" />
                    <span className="text-purple-400">{row.b}</span>
                    <br className="mb-1" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="w-10 h-10 text-zinc-700 mb-3" />
              <p className="text-sm text-zinc-500">Carregue pelo menos 2 sequencias para visualizar o alinhamento.</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => setActiveTab('upload')}>
                Carregar Sequencias
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* ═══════════════ PHYLOGENY TAB ═══════════════ */}
      {activeTab === 'phylogeny' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Dna className="w-4 h-4 text-rose-400" />
              Arvore Filogenetica (UPGMA)
            </h3>
            {newickTree ? (
              <div>
                <div className="bg-black/40 rounded-xl p-3 mb-3 overflow-x-auto">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Newick Format</p>
                  <p className="text-[10px] text-cyan-400 font-mono break-all">{newickTree}</p>
                </div>
                <Button variant="ghost" size="sm" icon={Save} onClick={exportNewick}>
                  Exportar Newick
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Dna className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">Necessario pelo menos 2 sequencias para gerar a arvore.</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Matriz de Distancias
            </h3>
            {distMatrix && distMatrix.labels.length >= 2 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-zinc-600 bg-zinc-900/50"></th>
                      {distMatrix.labels.map(l => (
                        <th key={l} className="p-1.5 text-zinc-400 bg-zinc-900/50 text-left max-w-[80px] truncate">{l}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {distMatrix.matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-1.5 text-cyan-400 font-bold max-w-[80px] truncate bg-zinc-900/30">{distMatrix.labels[i]}</td>
                        {row.map((val, j) => {
                          const intensity = val === 0 ? 'text-emerald-500' : val < 0.3 ? 'text-emerald-400' : val < 0.6 ? 'text-amber-400' : 'text-rose-400';
                          return (
                            <td key={j} className={`p-1.5 text-center border border-zinc-900/30 ${intensity}`}>
                              {val === 0 ? '—' : val.toFixed(4)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-zinc-500">Sem dados suficientes.</p>
              </div>
            )}
          </Card>

          {/* GC vs Length Scatter */}
          {scatterData.length >= 2 && (
            <Card className="lg:col-span-2">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Espaco GC x Comprimento
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="gc" name="GC %" tick={{ fill: '#71717a', fontSize: 9 }} label={{ value: 'GC %', position: 'insideBottom', offset: -2, fill: '#52525b', fontSize: 10 }} />
                  <YAxis dataKey="length" name="Comprimento (nt)" tick={{ fill: '#52525b', fontSize: 9 }} label={{ value: 'nt', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 10 }} />
                  <ZAxis range={[50, 200]} />
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '11px' }} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={scatterData} name="Sequencias">
                    {scatterData.map((_, i) => <Cell key={i} fill={SCATTER_COLORS[i % SCATTER_COLORS.length]} />)}
                  </Scatter>
                  <Legend />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* No sequence loaded fallback */}
      {!currentSeq && activeTab !== 'upload' && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Upload className="w-12 h-12 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-400">Nenhuma sequencia carregada.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setActiveTab('upload')}>
              Carregar Sequencia
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}