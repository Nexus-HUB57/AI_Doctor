import React, { useState } from 'react';
import { 
  Stethoscope, 
  User, 
  Calendar, 
  Activity, 
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  stage: string;
  tumorMarkers: Record<string, number>;
  immuneProfile: Record<string, number>;
}

interface DiagnosticResult {
  riskScore: number;
  recommendedInterventions: string[];
  prognosis: string;
  notes: string;
}

export default function DiagnosticPanel() {
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [diagnosis, setDiagnosis] = useState('melanoma');
  const [stage, setStage] = useState('IV');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  const handleDiagnose = async () => {
    if (!patientName.trim() || !patientAge.trim()) {
      alert('Por favor, preencha nome e idade do paciente');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Simular análise diagnóstica com dados do paciente
      const result: DiagnosticResult = {
        riskScore: Math.floor(Math.random() * 40 + 60),
        recommendedInterventions: [
          'anti_ccr8_treg_depletion',
          'th1_tbet_boost',
          'mrna_vaccine_neo'
        ],
        prognosis: 'Moderadamente favorável com protocolo DIMHEX',
        notes: `Paciente ${patientName}, ${patientAge} anos, com diagnóstico de ${diagnosis} estágio ${stage}. Candidato para protocolo de imunoterapia ex vivo com depleção de Tregs e expansão Th1.`
      };
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDiagnosticResult(result);
    } catch (error) {
      console.error('Erro ao processar diagnóstico:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5 flex flex-col gap-5 text-white">
      <div className="border-b border-zinc-900 pb-4">
        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-1">
          <Stethoscope className="w-3 h-3" />
          Sistema de Diagnóstico Inteligente
        </span>
        <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2 mt-0.5">
          Avaliação Clínica Personalizada
        </h3>
        <p className="text-xs text-zinc-400 font-mono mt-1">
          Análise de perfil de paciente para recomendação de protocolos de imunoterapia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário de Entrada */}
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2 tracking-wider">
              Nome do Paciente
            </label>
            <input 
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2 tracking-wider">
                Idade
              </label>
              <input 
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Ex: 55"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2 tracking-wider">
                Gênero
              </label>
              <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono">
                <option>Masculino</option>
                <option>Feminino</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2 tracking-wider">
              Diagnóstico Oncológico
            </label>
            <select 
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="melanoma">Melanoma Metastático</option>
              <option value="breast">Câncer de Mama Triplo-Negativo</option>
              <option value="nsclc">Adenocarcinoma Pulmonar (NSCLC)</option>
              <option value="glioblastoma">Glioblastoma Multiforme</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-2 tracking-wider">
              Estágio TNM
            </label>
            <select 
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="I">Estágio I</option>
              <option value="II">Estágio II</option>
              <option value="III">Estágio III</option>
              <option value="IV">Estágio IV</option>
            </select>
          </div>

          <button
            onClick={handleDiagnose}
            disabled={isAnalyzing}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 text-white font-black py-3 rounded-lg text-xs font-mono uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/20"
          >
            {isAnalyzing ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            Analisar Perfil
          </button>
        </div>

        {/* Resultado do Diagnóstico */}
        <div className="bg-[#050505] border border-zinc-800 rounded-xl p-5 min-h-[300px] flex flex-col justify-center">
          {!diagnosticResult && !isAnalyzing && (
            <div className="text-center space-y-3 opacity-40">
              <User className="w-12 h-12 mx-auto text-zinc-600" />
              <p className="text-[10px] font-mono uppercase tracking-widest">Aguardando Dados do Paciente...</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-500">Processando Análise Clínica...</p>
            </div>
          )}

          {diagnosticResult && !isAnalyzing && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-black uppercase text-white leading-tight">
                    {patientName}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">{diagnosis.toUpperCase()} - Estágio {stage}</p>
                </div>
                <div className={`text-3xl font-black font-mono ${
                  diagnosticResult.riskScore >= 80 ? 'text-red-400' : 
                  diagnosticResult.riskScore >= 60 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {diagnosticResult.riskScore}
                </div>
              </div>

              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                <span className="text-[9px] uppercase text-zinc-500 font-bold block mb-2">Prognóstico</span>
                <p className="text-[11px] text-zinc-300 font-mono leading-relaxed">
                  {diagnosticResult.prognosis}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] uppercase text-zinc-500 font-bold block">Intervenções Recomendadas</span>
                <div className="space-y-1.5">
                  {diagnosticResult.recommendedInterventions.map((intervention, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-cyan-950/20 border border-cyan-900/30 p-2 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[10px] text-zinc-300 font-mono">{intervention}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-950/20 border border-amber-900/30 p-3 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Notas Clínicas</span>
                </div>
                <p className="text-[10px] text-zinc-300 font-mono italic leading-relaxed">
                  {diagnosticResult.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
