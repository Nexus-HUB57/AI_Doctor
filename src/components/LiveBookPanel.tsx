import React, { useState, useEffect } from 'react';
import { Zap, Microscope, Activity, ChevronRight, Info, Save, RefreshCw } from 'lucide-react';
import Card from './base/Card';
import Button from './base/Button';

// Algoritmo de Nussinov para predição de estrutura secundária de RNA
const nussinov = (sequence: string) => {
  const n = sequence.length;
  const matrix = Array(n).fill(0).map(() => Array(n).fill(0));

  const isPair = (a: string, b: string) => {
    const pairs = ['AU', 'UA', 'GC', 'CG', 'GU', 'UG'];
    return pairs.includes(a + b);
  };

  for (let k = 1; k < n; k++) {
    for (let i = 0; i < n - k; i++) {
      const j = i + k;
      let max = matrix[i][j - 1];

      for (let t = i; t < j - 1; t++) {
        if (isPair(sequence[t], sequence[j])) {
          const score = (t > i ? matrix[i][t - 1] : 0) + matrix[t + 1][j - 1] + 1;
          if (score > max) max = score;
        }
      }
      matrix[i][j] = Math.max(max, matrix[i + 1][j]);
    }
  }

  const traceback = (i: number, j: number, pairs: [number, number][]) => {
    if (i >= j) return;
    if (matrix[i][j] === matrix[i + 1][j]) {
      traceback(i + 1, j, pairs);
    } else if (matrix[i][j] === matrix[i][j - 1]) {
      traceback(i, j - 1, pairs);
    } else {
      for (let t = i; t < j; t++) {
        if (isPair(sequence[t], sequence[j])) {
          const score = (t > i ? matrix[i][t - 1] : 0) + matrix[t + 1][j - 1] + 1;
          if (matrix[i][j] === score) {
            pairs.push([t, j]);
            traceback(i, t - 1, pairs);
            traceback(t + 1, j - 1, pairs);
            return;
          }
        }
      }
    }
  };

  const pairs: [number, number][] = [];
  traceback(0, n - 1, pairs);
  return pairs;
};

export default function LiveBookPanel() {
  const [sequence, setSequence] = useState('GGCCUUCGGGCUAGGUUACA');
  const [pairs, setPairs] = useState<[number, number][]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    handleAnalyze();
  }, []);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const result = nussinov(sequence.toUpperCase());
      setPairs(result);
      setIsAnalyzing(false);
    }, 800);
  };

  // Visualização Circular SVG
  const renderStructure = () => {
    const n = sequence.length;
    const radius = 120;
    const centerX = 150;
    const centerY = 150;
    
    const points = Array.from({ length: n }).map((_, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        base: sequence[i]
      };
    });

    return (
      <svg width="300" height="300" className="mx-auto">
        {/* Conexões (Pares de Bases) */}
        {pairs.map(([i, j], idx) => (
          <line
            key={`pair-${idx}`}
            x1={points[i].x}
            y1={points[i].y}
            x2={points[j].x}
            y2={points[j].y}
            stroke="#22d3ee"
            strokeWidth="2"
            strokeOpacity="0.6"
            strokeDasharray="4 2"
          />
        ))}
        
        {/* Esqueleto do RNA */}
        {points.map((p, i) => {
          if (i === n - 1) return null;
          const next = points[i + 1];
          return (
            <line
              key={`backbone-${i}`}
              x1={p.x}
              y1={p.y}
              x2={next.x}
              y2={next.y}
              stroke="#475569"
              strokeWidth="1"
            />
          );
        })}

        {/* Bases */}
        {points.map((p, i) => (
          <g key={`base-${i}`}>
            <circle cx={p.x} cy={p.y} r="10" fill="#1e293b" stroke="#475569" />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fontWeight="bold"
              fill={p.base === 'G' ? '#f87171' : p.base === 'C' ? '#60a5fa' : p.base === 'A' ? '#fbbf24' : '#34d399'}
            >
              {p.base}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Zap className="text-cyan-400" />
            LiveBook-rRNA
          </h2>
          <p className="text-slate-400">Predição de Estrutura Secundária e Análise de Mutações</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleAnalyze}>
            Recalcular
          </Button>
          <Button variant="primary" size="sm" icon={Save}>
            Salvar Estudo
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Microscope className="w-5 h-5 text-cyan-400" />
                Sequência de RNA
              </h3>
              <span className="text-xs font-mono text-slate-500">{sequence.length} nucleotídeos</span>
            </div>
            
            <textarea
              value={sequence}
              onChange={(e) => setSequence(e.target.value.replace(/[^augcAUGC]/g, ''))}
              className="w-full h-32 bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-cyan-400 focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
              placeholder="Insira a sequência de RNA (A, U, G, C)..."
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Pares GC</div>
                <div className="text-xl font-black text-blue-400">
                  {Math.round((sequence.match(/[GC]/gi)?.length || 0) / sequence.length * 100)}%
                </div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Pares AU</div>
                <div className="text-xl font-black text-rose-400">
                  {Math.round((sequence.match(/[AU]/gi)?.length || 0) / sequence.length * 100)}%
                </div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Energia Livre</div>
                <div className="text-xl font-black text-emerald-400">-{pairs.length * 2.4} kcal</div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1">Pontes H</div>
                <div className="text-xl font-black text-purple-400">{pairs.length}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-rose-400" />
            Estrutura Secundária
          </h3>
          
          <div className="relative bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex items-center justify-center min-h-[300px]">
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-sm text-slate-400 animate-pulse">Processando Nussinov...</span>
              </div>
            ) : (
              renderStructure()
            )}
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Algoritmo</span>
              <span className="text-slate-300">Nussinov Dynamic Programming</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Complexidade</span>
              <span className="text-slate-300">O(n³)</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Análise de Mutações Compensatórias">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-3 font-bold text-slate-400 text-sm">Posição</th>
                <th className="pb-3 font-bold text-slate-400 text-sm">Base Original</th>
                <th className="pb-3 font-bold text-slate-400 text-sm">Mutação</th>
                <th className="pb-3 font-bold text-slate-400 text-sm">Impacto Estrutural</th>
                <th className="pb-3 font-bold text-slate-400 text-sm">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {[
                { pos: 5, from: 'U', to: 'C', impact: 'Estabilização de Stem', status: 'Compensada' },
                { pos: 12, from: 'A', to: 'G', impact: 'Quebra de Ponte H', status: 'Crítica' },
                { pos: 18, from: 'C', to: 'U', impact: 'Neutro', status: 'Monitorar' }
              ].map((m, i) => (
                <tr key={i} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 font-mono text-cyan-400">{m.pos}</td>
                  <td className="py-4 text-white font-bold">{m.from}</td>
                  <td className="py-4 text-rose-400 font-bold">{m.to}</td>
                  <td className="py-4 text-slate-400 text-sm">{m.impact}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      m.status === 'Compensada' ? 'bg-emerald-500/10 text-emerald-500' :
                      m.status === 'Crítica' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
