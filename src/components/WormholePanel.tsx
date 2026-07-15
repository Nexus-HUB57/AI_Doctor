import React, { useState } from 'react';
import { 
  ArrowRightLeft, 
  Send, 
  RefreshCw, 
  Compass, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Dna,
  Share2
} from 'lucide-react';
import { WormholeNode } from '../types';

interface WormholePanelProps {
  sequence: string;
  setSequence: (seq: string) => void;
  addLog: (text: string, type: 'info' | 'success' | 'warning' | 'query' | 'agent' | 'cosmic') => void;
}

export default function WormholePanel({ sequence, setSequence, addLog }: WormholePanelProps) {
  // Nodes in our cosmic-molecular network
  const [nodes, setNodes] = useState<WormholeNode[]>([
    { id: 'node_1', name: 'NEXUS Core-57 (Central)', distance: '0.0 LY', status: 'STABLE', coordinates: '57:01:A9' },
    { id: 'node_2', name: 'HUB-12 Proxima Centauri', distance: '4.2 LY', status: 'FLUCTUATING', coordinates: '12:88:B3' },
    { id: 'node_3', name: 'HUB-88 Polaris Research', distance: '433.8 LY', status: 'STABLE', coordinates: '88:44:E2' }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState('node_1');
  const [isTunneling, setIsTunneling] = useState(false);
  const [tunnelProgress, setTunnelProgress] = useState(0);
  const [transitedSequence, setTransitedSequence] = useState<string | null>(null);

  // Conversion Tool outputs
  const [translationResult, setTranslationResult] = useState<string | null>(null);

  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  // Run the sequence tunneling animation and logging
  const handleTransitSequence = () => {
    if (!sequence.trim()) return;
    if (isTunneling) return;

    setIsTunneling(true);
    setTunnelProgress(0);
    setTransitedSequence(null);
    addLog(`🌀 Abrindo garganta de Wormhole direcionada para ${activeNode.name}...`, 'info');

    // Simulate progress
    const interval = setInterval(() => {
      setTunnelProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTunneling(false);
          setTransitedSequence(sequence);
          addLog(`🎉 TRANSMISSÃO QUANTICA CONCLUÍDA! Sequência de rRNA materializada no nó ${activeNode.name}.`, 'success');
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  // Bio tools: Reverse Complement
  const handleReverseComplement = () => {
    if (!sequence) return;
    addLog('Processando complemento reverso da sequência de rRNA...', 'info');
    
    // Reverse
    const reversed = sequence.split('').reverse().join('');
    // Complement: A-U, U-A, G-C, C-G
    const complementMap: { [key: string]: string } = {
      'A': 'U', 'U': 'A', 'G': 'C', 'C': 'G'
    };
    const finalComplement = reversed.split('').map(b => complementMap[b] || b).join('');
    
    setSequence(finalComplement);
    addLog(`Sequência invertida e complementada: ${finalComplement}`, 'success');
  };

  // Bio tools: DNA <-> RNA transcription
  const handleTranscriptionSwap = () => {
    if (!sequence) return;
    const isRna = sequence.includes('U');
    let swapped = '';
    
    if (isRna) {
      swapped = sequence.replace(/U/g, 'T');
      addLog('Transcrevendo de RNA para DNA (Uracila → Timina)...', 'info');
    } else {
      swapped = sequence.replace(/T/g, 'U');
      addLog('Transcrevendo de DNA para RNA (Timina → Uracila)...', 'info');
    }
    
    setSequence(swapped);
    addLog(`Sequência transcrita: ${swapped}`, 'success');
  };

  // Bio tools: Codon Translation (Translate codons to amino acids)
  const handleCodonTranslation = () => {
    if (!sequence) return;
    addLog('Traduzindo sequência nucleotídica para cadeia de aminoácidos...', 'info');

    // Standard translation codon map
    const codonTable: { [key: string]: string } = {
      'AUG': 'Met (Start)', 'UUU': 'Phe', 'UUC': 'Phe', 'UUA': 'Leu', 'UUG': 'Leu',
      'UCU': 'Ser', 'UCC': 'Ser', 'UCA': 'Ser', 'UCG': 'Ser', 'UAU': 'Tyr',
      'UAC': 'Tyr', 'UGU': 'Cys', 'UGC': 'Cys', 'UGG': 'Trp', 'CUU': 'Leu',
      'CUC': 'Leu', 'CUA': 'Leu', 'CUG': 'Leu', 'CCU': 'Pro', 'CCC': 'Pro',
      'CCA': 'Pro', 'CCG': 'Pro', 'CAU': 'His', 'CAC': 'His', 'CAA': 'Gln',
      'CAG': 'Gln', 'CGU': 'Arg', 'CGC': 'Arg', 'CGA': 'Arg', 'CGG': 'Arg',
      'AUU': 'Ile', 'AUC': 'Ile', 'AUA': 'Ile', 'ACU': 'Thr', 'ACC': 'Thr',
      'ACA': 'Thr', 'ACG': 'Thr', 'AAU': 'Asn', 'AAC': 'Asn', 'AAA': 'Lys',
      'AAG': 'Lys', 'AGU': 'Ser', 'AGC': 'Ser', 'AGA': 'Arg', 'AGG': 'Arg',
      'GUU': 'Val', 'GUC': 'Val', 'GUA': 'Val', 'GUG': 'Val', 'GCU': 'Ala',
      'GCC': 'Ala', 'GCA': 'Ala', 'GCG': 'Ala', 'GAU': 'Asp', 'GAC': 'Asp',
      'GAA': 'Glu', 'GAG': 'Glu', 'GGU': 'Gly', 'GGC': 'Gly', 'GGA': 'Gly',
      'GGG': 'Gly', 'UAA': 'Stop', 'UAG': 'Stop', 'UGA': 'Stop'
    };

    // Split in triplets (codons)
    const codons = [];
    const cleanSeq = sequence.toUpperCase().replace(/T/g, 'U');
    for (let i = 0; i < cleanSeq.length - 2; i += 3) {
      codons.push(cleanSeq.substring(i, i + 3));
    }

    if (codons.length === 0) {
      setTranslationResult('Sequência muito curta para formar um códon.');
      return;
    }

    const peptides = codons.map(c => codonTable[c] || '???');
    const peptideChain = peptides.join(' ➔ ');
    setTranslationResult(peptideChain);
    addLog(`Cadeia peptídica gerada: ${peptideChain}`, 'success');
  };

  return (
    <div id="wormhole-panel" className="bg-zinc-950/20 border border-zinc-900 rounded-xl p-5 flex flex-col gap-5 h-full">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Compass className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono">Quantum Transport Bridge</span>
            <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              Wormhole Portal
              <span className="text-[10px] font-normal tracking-normal text-blue-400 bg-blue-950/30 border border-blue-900/50 px-1.5 py-0.5 rounded ml-2">
                Hyperlink Active
              </span>
            </h2>
          </div>
        </div>
        <p className="text-xs text-zinc-500 font-mono text-left sm:text-right">
          Canal de transposição de nucleotídeos entre coordenadas remotas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column - Portal coordinates selection & transit */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-xl space-y-4 flex-1 justify-between flex flex-col">
            <div>
              <h3 className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                Coordenadas de Destino do Wormhole
              </h3>

              <div className="space-y-2 mt-3">
                {nodes.map(n => {
                  const isSelected = selectedNodeId === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => !isTunneling && setSelectedNodeId(n.id)}
                      className={`p-3 bg-zinc-950/50 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                        isSelected 
                          ? 'border-blue-500 bg-zinc-900/40 shadow-[0_0_12px_rgba(59,130,246,0.1)]' 
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-white block">{n.name}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">Coord: {n.coordinates} | Dist: {n.distance}</span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        n.status === 'STABLE' 
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/40' 
                          : 'bg-yellow-950/50 text-yellow-500 border border-yellow-900/40'
                      }`}>
                        {n.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleTransitSequence}
              disabled={isTunneling || !sequence.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              <ArrowRightLeft className={`w-4 h-4 ${isTunneling ? 'animate-spin' : ''}`} />
              {isTunneling ? `Transportando... ${tunnelProgress}%` : `Disparar Salto Quântico`}
            </button>
          </div>
        </div>

        {/* Right Column - Tunnel Visualizer & Genetic tools */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Tunneling Animation Area */}
          <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 flex flex-col lg:flex-row items-center justify-around gap-4 min-h-[180px]">
            {/* Visual Wormhole Tunneling Vortex */}
            <div className="relative w-32 h-32 flex items-center justify-center bg-black rounded-full border border-blue-900/30 overflow-hidden shadow-[inset_0_0_30px_rgba(59,130,246,0.2)]">
              {/* Spinning particle lines inside portal */}
              <div className={`absolute w-28 h-28 border border-dashed border-blue-500/30 rounded-full animate-spin`} style={{ animationDuration: isTunneling ? '1.5s' : '8s' }} />
              <div className={`absolute w-20 h-20 border border-dashed border-cyan-500/40 rounded-full animate-spin`} style={{ animationDuration: isTunneling ? '0.8s' : '4s', animationDirection: 'reverse' }} />
              <div className="absolute w-8 h-8 bg-blue-500 rounded-full blur-md opacity-35 animate-ping" />
              <div className="absolute w-4 h-4 bg-white rounded-full shadow-[0_0_15px_#fff]" />

              {/* Falling Nucleobases being sucked in */}
              {isTunneling && (
                <div className="absolute text-[8px] font-mono text-cyan-400 select-none pointer-events-none animate-pulse">
                  {sequence.substring(0, 10)}...
                </div>
              )}
            </div>

            {/* Bridge Status Logs */}
            <div className="flex-1 space-y-2 text-xs font-mono">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Bridge Telemetry</span>
              
              <div className="bg-black/60 border border-zinc-900 p-3 rounded text-[10.5px] leading-relaxed text-zinc-300">
                <div>NODE: <span className="text-white font-bold">{activeNode.coordinates}</span></div>
                <div>GRAVITY COEFF: <span className="text-zinc-500">1.042 (Standard)</span></div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span>STATUS:</span>
                  {isTunneling ? (
                    <span className="text-yellow-400 font-bold animate-pulse">TÚNEL QUÂNTICO ATIVO...</span>
                  ) : transitedSequence ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> ENVIADO</span>
                  ) : (
                    <span className="text-zinc-500">Aguardando Sequência</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Molecular Conversion Tools */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl space-y-3.5">
            <h3 className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              Ferramentas de Conversão Molecular
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleReverseComplement}
                disabled={!sequence}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 text-[10px] font-bold uppercase py-2 rounded text-zinc-300 transition-all cursor-pointer"
              >
                Complemento Reverso
              </button>
              <button
                onClick={handleTranscriptionSwap}
                disabled={!sequence}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 text-[10px] font-bold uppercase py-2 rounded text-zinc-300 transition-all cursor-pointer"
              >
                Transcrever DNA / RNA
              </button>
            </div>

            <button
              onClick={handleCodonTranslation}
              disabled={!sequence}
              className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-500/50 text-[10px] font-bold uppercase py-2.5 rounded text-zinc-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Dna className="w-3.5 h-3.5 text-purple-400" />
              Traduzir Cadeia de Códons (Aminoácidos)
            </button>

            {/* Translation Output results */}
            {translationResult && (
              <div className="bg-black/50 border border-zinc-900 rounded p-3 text-[10.5px] font-mono">
                <div className="text-purple-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Peptídeos Gerados:</div>
                <div className="text-zinc-200 select-all leading-normal break-words">{translationResult}</div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
