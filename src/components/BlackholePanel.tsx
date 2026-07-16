import React, { useState } from 'react';
import { 
  Zap, 
  Trash2, 
  Trash, 
  RefreshCw, 
  Activity, 
  AlertTriangle,
  Flame,
  HelpCircle
} from 'lucide-react';
import { Agent } from '../types';

interface BlackholePanelProps {
  sequence: string;
  setSequence: (seq: string) => void;
  agents: Agent[];
  setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
  addLog: (text: string, type: 'info' | 'success' | 'warning' | 'query' | 'agent' | 'cosmic', agentName?: string) => void;
  clearLogs: () => void;
}

export default function BlackholePanel({ 
  sequence, 
  setSequence, 
  agents, 
  setAgents, 
  addLog, 
  clearLogs 
}: BlackholePanelProps) {
  const [gravityPull, setGravityPull] = useState(100); // 100g to 1000g
  const [isCollapsing, setIsCollapsing] = useState(false);

  // Spaghettify sequence: high-gravity stretching mutations
  const handleSpaghettify = () => {
    if (!sequence) return;
    addLog('🕳️ Aplicando alongamento gravitacional infinito (Spaghetti-fication)...', 'cosmic');
    
    // Scramble, insert dashes representing high entropy stretching, or delete random bases
    const seqArr = sequence.split('');
    const spaghettified: string[] = [];
    
    // Stretch with high gravity entropy
    seqArr.forEach(char => {
      spaghettified.push(char);
      if (Math.random() > 0.6) {
        spaghettified.push('-'); // stretched spacetime bond
      }
    });

    const result = spaghettified.join('').substring(0, 50); // limit length
    setSequence(result.replace(/-/g, '')); // save back a scrambled/shortened version
    addLog(`Fios nucleotídicos rompidos pela gravidade. Sequência resultante: ${result}`, 'warning');
  };

  // Compress sequence to super-dense core
  const handleCollapseSequence = () => {
    if (!sequence) return;
    setIsCollapsing(true);
    addLog('🕳️ Colapsando a sequência de rRNA para densidade molecular de Planck...', 'cosmic');

    setTimeout(() => {
      // Find the pure high energy GC-core
      const gcOnly = sequence.split('').filter(b => b === 'G' || b === 'C').join('');
      const core = gcOnly.substring(0, 8) || 'GCGC';
      setSequence(core);
      addLog(`Ruptura quântica de ligação: Sequência colapsada em núcleo superdenso de energia: ${core}`, 'success');
      setIsCollapsing(false);
    }, 1500);
  };

  // Eject an agent into the blackhole singularity
  const handleEjectAgent = (agentId: string) => {
    const agentToEject = agents.find(a => a.id === agentId);
    if (!agentToEject) return;

    addLog(`🚨 ALERTA: Iniciando ejeção de emergência do Agente ${agentToEject.name} (PID: ${agentToEject.pid}) na singularidade!`, 'warning');
    addLog(`[${agentToEject.name}]: "NÃOOO! Minhas matrizes de dobramento... Estou sofrendo espaguetificação nucleaaa- *static*"`, 'agent', agentToEject.name);

    setTimeout(() => {
      setAgents(prev => prev.filter(a => a.id !== agentId));
      addLog(`💥 Matéria do agente ${agentToEject.name} integrada à massa da Singularidade central. Gravidade aumentada.`, 'cosmic');
      setGravityPull(prev => prev + 150);
    }, 1200);
  };

  return (
    <div id="blackhole-panel" className="bg-zinc-950/20 border border-zinc-900 rounded-xl p-5 flex flex-col gap-5 h-full">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <Flame className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider font-mono">Cosmic Decimation Center</span>
            <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              Blackhole Singularity
              <span className="text-[10px] font-normal tracking-normal text-rose-400 bg-rose-950/30 border border-rose-900/50 px-1.5 py-0.5 rounded ml-2">
                100% Critical
              </span>
            </h2>
          </div>
        </div>
        <p className="text-xs text-zinc-500 font-mono text-left sm:text-right">
          Destruição de logs, decimação de sequências e ejeção de sub-agentes redundantes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column - Singularity gravity pull & Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-xl flex-1 justify-between flex flex-col">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Vórtice de Eventos da Singularidade
              </h3>

              {/* Gravity strength slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Puxão Gravitacional</span>
                  <span className="text-rose-500 font-bold">{gravityPull} G-Force</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="1500" 
                  step="50"
                  value={gravityPull}
                  onChange={(e) => setGravityPull(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[9px] text-zinc-500 italic">Uma gravidade de Planck maior aumenta as chances de esmagar o nucleotídeo.</p>
              </div>

              {/* Chaos actions list */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSpaghettify}
                  disabled={!sequence}
                  className="w-full bg-zinc-950 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-900/50 text-[10.5px] font-bold uppercase py-2.5 rounded text-zinc-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-500 animate-spin" style={{ animationDuration: '4s' }} />
                  Esticar Sequência (Espaguetificar)
                </button>
                <button
                  onClick={handleCollapseSequence}
                  disabled={isCollapsing || !sequence}
                  className="w-full bg-zinc-950 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-900/50 text-[10.5px] font-bold uppercase py-2.5 rounded text-zinc-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Esmagar para Densidade Planck
                </button>
                <button
                  onClick={() => {
                    clearLogs();
                    addLog('🕳️ Todos os registros de eventos foram evaporados pela radiação Hawking.', 'cosmic');
                  }}
                  className="w-full bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-[10.5px] font-black uppercase py-2.5 rounded text-rose-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash className="w-3.5 h-3.5" />
                  Evaporar Registros (Limpar Logs)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Gravity Vortex Visualization & Eject agents list */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Gravitational blackhole animated portal */}
          <div className="bg-black/60 border border-zinc-900 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-around gap-4 min-h-[190px]">
            {/* Spinning gravitational singularity */}
            <div className="relative w-36 h-36 flex items-center justify-center bg-black rounded-full overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.15)]">
              {/* Radial backdrop */}
              <div className="absolute inset-0 bg-radial from-transparent via-zinc-950/90 to-rose-950/15" />
              
              {/* Event horizon dust lines */}
              <div 
                className={`absolute w-32 h-32 border border-rose-500/25 rounded-full animate-spin`} 
                style={{ animationDuration: `${300 / gravityPull}s` }} 
              />
              <div 
                className={`absolute w-24 h-24 border border-dashed border-rose-700/40 rounded-full animate-spin`} 
                style={{ animationDuration: `${150 / gravityPull}s`, animationDirection: 'reverse' }} 
              />
              <div 
                className={`absolute w-16 h-16 border border-zinc-800/60 rounded-full animate-spin`} 
                style={{ animationDuration: `${50 / gravityPull}s` }} 
              />
              
              {/* Singular core */}
              <div className="absolute w-8 h-8 bg-black border border-rose-600 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
              <div className="absolute w-2 h-2 bg-rose-500 rounded-full blur-xs" />
            </div>

            {/* Singularity Telemetry metrics */}
            <div className="flex-1 space-y-2 text-xs font-mono">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Hawking Radiation Telemetry</span>
              
              <div className="bg-black/60 border border-zinc-900 p-3 rounded text-[10.5px] leading-relaxed text-zinc-300">
                <div>MASS: <span className="text-white font-bold">{gravityPull * 4.2} Solar Mass</span></div>
                <div>RADIUS: <span className="text-zinc-500">{parseFloat((2.95 * (gravityPull / 100)).toFixed(2))} km</span></div>
                <div>TEMPERATURE: <span className="text-rose-400">9.42e-8 K</span></div>
              </div>
            </div>
          </div>

          {/* Eject Active Agents list panel */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl space-y-3 flex-1">
            <h3 className="text-xs font-bold uppercase text-zinc-300 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Ejeção Molecular de Sub-Agentes
            </h3>

            {agents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {agents.map(a => (
                  <div key={a.id} className="p-2 bg-zinc-950/60 border border-zinc-900 rounded flex justify-between items-center text-[10.5px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className="font-bold text-zinc-200">{a.name}</span>
                    </div>
                    <button
                      onClick={() => handleEjectAgent(a.id)}
                      className="text-[8px] bg-rose-950/50 hover:bg-rose-950 text-rose-400 border border-rose-900/40 hover:border-rose-500/50 px-1.5 py-0.5 rounded font-mono uppercase transition-colors cursor-pointer"
                    >
                      Ejetar 🕳️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-zinc-600 font-mono text-[10.5px]">
                Nenhum agente ativo registrado na orquestração central para ejeção.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
