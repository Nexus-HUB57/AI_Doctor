import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  FileSearch,
  BookOpen,
  Award
} from 'lucide-react';

interface ValidationResult {
  validated: boolean;
  evidence_score: number;
  phase: string;
  citation: string;
  description: string;
  recommendation: string;
}

const INTERVENTIONS = [
  { id: 'anti_ccr8_treg_depletion', name: 'Depleção de Treg (anti-CCR8)' },
  { id: 'th1_tbet_boost', name: 'Expansão Th1 (T-bet)' },
  { id: 'car_cth_pd1_ko', name: 'CRISPR KO PD-1 em CTH' },
  { id: 'mrna_vaccine_neo', name: 'Vacina RNAm personalizada' },
  { id: 'granzyme_b_conjugation', name: 'Conjugação Granzima B' },
  { id: 'dialysis_cytokine_removal', name: 'Aférese de Citocinas' },
  { id: 'massive_reinfusion', name: 'Reinfusão Massiva (>50x)' }
];

export default function EradicationPanel() {
  const [selectedIntervention, setSelectedIntervention] = useState(INTERVENTIONS[0].id);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleValidate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/validate_intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervention: selectedIntervention })
      });
      const data = await response.json();
      setValidationResult(data);
    } catch (error) {
      console.error('Erro ao validar intervenção:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 flex flex-col gap-5 text-white">
      <div className="border-b border-zinc-900 pb-4">
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Módulo de Validação Clínica (CVM)
        </span>
        <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2 mt-0.5">
          Painel de Erradicação Fênix
        </h3>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Validação científica de intervenções oncológicas baseada em evidências clínicas e literatura revisada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2 tracking-wider">
              Selecionar Intervenção
            </label>
            <select 
              value={selectedIntervention}
              onChange={(e) => setSelectedIntervention(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            >
              {INTERVENTIONS.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleValidate}
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-black py-3 rounded-lg text-xs font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/20"
          >
            {isLoading ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Validar Decisão Clínica
          </button>

          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl">
            <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Critérios de Pontuação
            </h4>
            <div className="space-y-2 text-[10px] font-mono">
              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-bold">{'>'}80</span>
                <span className="text-zinc-400">Fase III / Meta-análise</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-bold">60 – 80</span>
                <span className="text-zinc-400">Pré-clínico / Fase I-II</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold">{"<"}60</span>
                <span className="text-zinc-400">Experimental / Teórico</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#050505] border border-zinc-800 rounded-xl p-5 min-h-[200px] flex flex-col justify-center relative overflow-hidden">
          {!validationResult && !isLoading && (
            <div className="text-center space-y-3 opacity-40">
              <FileSearch className="w-12 h-12 mx-auto text-zinc-600" />
              <p className="text-[10px] font-mono uppercase tracking-widest">Aguardando Validação...</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">Consultando PubMed/EvidenceDB...</p>
            </div>
          )}

          {validationResult && !isLoading && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-black uppercase text-white leading-tight">
                    {INTERVENTIONS.find(i => i.id === selectedIntervention)?.name}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">{validationResult.description}</p>
                </div>
                <div className={`text-2xl font-black font-mono ${
                  validationResult.evidence_score >= 80 ? 'text-emerald-400' : 
                  validationResult.evidence_score >= 60 ? 'text-blue-400' : 'text-amber-400'
                }`}>
                  {validationResult.evidence_score}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[9px] uppercase text-zinc-500 font-bold block mb-1">Status</span>
                  <div className="flex items-center gap-1.5">
                    {validationResult.validated ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    )}
                    <span className="text-[10px] font-bold text-zinc-200">{validationResult.recommendation}</span>
                  </div>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[9px] uppercase text-zinc-500 font-bold block mb-1">Fase Clínica</span>
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-bold text-zinc-200">{validationResult.phase}</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/30 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Referência Científica</span>
                </div>
                <p className="text-[11px] text-zinc-300 font-mono italic leading-relaxed">
                  "{validationResult.citation}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
