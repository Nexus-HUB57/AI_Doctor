// ============================================================================
// AI_Doctor — Motor de Auto-Cura dos Agentes (Self-Healing Engine)
// Adaptado do LiveBook-rRNA para contexto médico: monitora a saúde dos 15 agentes
// PhD virtuais e aplica correções reativas para manter o ecossistema operacional
// ============================================================================

// ── Types ────────────────────────────────────────────────────────────────────

export type AnomalyType = 'fidelity_drop' | 'coherence_loss' | 'decoherence_spike' | 'entanglement_break' | 'superposition_collapse';
export type Severity = 'critical' | 'warning' | 'info';
export type HealSkill = 'recalibrate' | 'stabilize' | 'reboot' | 'amplify' | 'shield' | 'resync';

export interface AgentState {
  coherence: number;      // 0-1: coerência diagnóstica
  entanglement: number;  // 0-1: conectividade inter-agente
  superposition: number; // 0-1: capacidade de multi-hipótese
  decoherence: number;   // 0-1: ruído/entropia (menor = melhor)
  fidelity: number;      // 0-1: fidelidade de execução
  evolution: number;     // 0-1: progresso evolutivo
}

export interface AnomalyReport {
  id: string;
  agentId: string;
  agentName: string;
  type: AnomalyType;
  severity: Severity;
  value: number;
  threshold: number;
  delta: number;
  timestamp: string;
  diagnosis: string;
  prescribedSkills: HealSkill[];
  healingAction: string;
}

export interface HealingAction {
  id: string;
  agentId: string;
  skill: HealSkill;
  params: Record<string, number>;
  appliedAt: string;
  result: 'success' | 'partial' | 'failed';
  beforeState: Record<string, number>;
  afterState: Record<string, number>;
  deltaApplied: Record<string, number>;
}

export interface HealingCycle {
  id: string;
  cycleNumber: number;
  iteration: number;
  timestamp: string;
  agentsMonitored: number;
  anomaliesDetected: number;
  anomaliesCritical: number;
  healingActionsExecuted: number;
  healingSuccessRate: number;
  durationMs: number;
  reports: AnomalyReport[];
  actions: HealingAction[];
}

// ── Thresholds (adaptados para agentes médicos) ─────────────────────────────

const THRESHOLDS = {
  fidelity:      { critical: 0.35, warning: 0.55, optimal: [0.7, 0.95] as [number, number] },
  coherence:     { critical: 0.30, warning: 0.50, optimal: [0.6, 0.95] as [number, number] },
  decoherence:   { critical: 0.60, warning: 0.40, optimal: [0.0, 0.20] as [number, number] },
  entanglement:  { critical: 0.15, warning: 0.30, optimal: [0.4, 0.85] as [number, number] },
  superposition: { critical: 0.20, warning: 0.35, optimal: [0.5, 0.90] as [number, number] },
} as const;

// ── Healing Skill Algorithms ─────────────────────────────────────────────────

const HEALING_ALGORITHMS: Record<HealSkill, (params: Record<string, number>) => Record<string, number>> = {
  // Recalibrate: Shift metric toward optimal center
  recalibrate: (params) => {
    const { current, target, strength = 0.3 } = params;
    const delta = (target - current) * strength;
    return { adjusted: Math.min(1, Math.max(0, current + delta)), delta };
  },
  // Stabilize: Reduce volatility by averaging with optimal
  stabilize: (params) => {
    const { current, optimal, blend = 0.4 } = params;
    const stabilized = current * (1 - blend) + optimal * blend;
    return { adjusted: Math.min(1, Math.max(0, stabilized)), delta: stabilized - current };
  },
  // Reboot: Reset to healthy baseline if critically low
  reboot: (params) => {
    const { current, baseline = 0.7 } = params;
    if (current > 0.5) return { adjusted: current, delta: 0 };
    return { adjusted: baseline, delta: baseline - current };
  },
  // Amplify: Boost a weak metric
  amplify: (params) => {
    const { current, boost = 0.15 } = params;
    return { adjusted: Math.min(1, current + boost), delta: boost };
  },
  // Shield: Protect against decoherence spikes
  shield: (params) => {
    const { current, shieldStrength = 0.2 } = params;
    return { adjusted: Math.max(0, current - shieldStrength), delta: -shieldStrength };
  },
  // Resync: Bring agent back in line with cross-agent average
  resync: (params) => {
    const { current, crossPanelAvg, syncRate = 0.35 } = params;
    const delta = (crossPanelAvg - current) * syncRate;
    return { adjusted: Math.min(1, Math.max(0, current + delta)), delta };
  },
};

// ── Diagnosis Engine ──────────────────────────────────────────────────────────

function diagnoseAnomaly(
  metric: string,
  value: number,
  severity: Severity,
  agentId: string,
  agentName: string,
): { diagnosis: string; prescribedSkills: HealSkill[]; healingAction: string } {
  const diagnoses: Record<string, Record<Severity, { diagnosis: string; skills: HealSkill[]; action: string }>> = {
    fidelity_drop: {
      critical: {
        diagnosis: `Fidelidade crítica do agente ${agentName} (${(value * 100).toFixed(1)}%). Pipeline de diagnóstico comprometido. Capacidade de execução clínica severamente degradada.`,
        skills: ['reboot', 'recalibrate', 'resync'],
        action: 'Reboot imediato do pipeline diagnóstico + recalibração com valores ótimos',
      },
      warning: {
        diagnosis: `Fidelidade abaixo do ideal no agente ${agentName} (${(value * 100).toFixed(1)}%). Pipeline com degradação moderada.`,
        skills: ['stabilize', 'recalibrate'],
        action: 'Estabilização progressiva + recalibração diagnóstica',
      },
    },
    coherence_loss: {
      critical: {
        diagnosis: `Coerência diagnóstica crítica do agente ${agentName} (${(value * 100).toFixed(1)}%). Risco de recomendações contraditórias.`,
        skills: ['reboot', 'amplify', 'resync'],
        action: 'Amplificação de coerência + resync com consenso da junta médica',
      },
      warning: {
        diagnosis: `Coerência em queda no agente ${agentName} (${(value * 100).toFixed(1)}%). Risco de fragmentação do raciocínio clínico.`,
        skills: ['stabilize', 'amplify'],
        action: 'Estabilização + amplificação controlada da coerência',
      },
    },
    decoherence_spike: {
      critical: {
        diagnosis: `Decoerência extrema no agente ${agentName} (${(value * 100).toFixed(1)}%). Entropia superou limite seguro, ruído dominando o processamento clínico.`,
        skills: ['shield', 'recalibrate', 'stabilize'],
        action: 'Escudo antientropia + recalibração completa do pipeline',
      },
      warning: {
        diagnosis: `Decoerência elevada no agente ${agentName} (${(value * 100).toFixed(1)}%). Nível de ruído acima do ideal.`,
        skills: ['shield', 'stabilize'],
        action: 'Ativação de escudo antientropia',
      },
    },
    entanglement_break: {
      critical: {
        diagnosis: `Entrelaçamento quebrado entre o agente ${agentName} e o consórcio. Agente isolado, sem comunicação inter-agente.`,
        skills: ['amplify', 'resync'],
        action: 'Reconstrução de entrelaçamento + resync forçado com a junta médica',
      },
      warning: {
        diagnosis: `Entrelaçamento fraco do agente ${agentName} (${(value * 100).toFixed(1)}%). Comunicação inter-agente degradada.`,
        skills: ['amplify', 'stabilize'],
        action: 'Amplificação de entrelaçamento inter-agente',
      },
    },
    superposition_collapse: {
      critical: {
        diagnosis: `Superposição colapsada no agente ${agentName} (${(value * 100).toFixed(1)}%). Agente perdeu capacidade de multi-hipótese, operando em modo unidimensional.`,
        skills: ['amplify', 'recalibrate'],
        action: 'Reexpansão de superposição + recalibração de hipóteses',
      },
      warning: {
        diagnosis: `Superposição fraca no agente ${agentName} (${(value * 100).toFixed(1)}%). Capacidade diferencial diagnóstica reduzida.`,
        skills: ['amplify', 'stabilize'],
        action: 'Amplificação de capacidade multi-hipótese',
      },
    },
  };

  const metricKey = metric === 'fidelity' ? 'fidelity_drop'
    : metric === 'coherence' ? 'coherence_loss'
    : metric === 'decoherence' ? 'decoherence_spike'
    : metric === 'entanglement' ? 'entanglement_break'
    : 'superposition_collapse';

  const entry = diagnoses[metricKey]?.[severity];
  return {
    diagnosis: entry?.diagnosis ?? `Anomalia detectada em ${metric} para o agente ${agentName}`,
    prescribedSkills: entry?.skills ?? ['stabilize'],
    healingAction: entry?.action ?? 'Estabilização padrão',
  };
}

// ── Main Engine ──────────────────────────────────────────────────────────────

let cycleCount = 0;

// In-memory healing history (persistido via persistence service quando disponível)
const healingHistory: HealingCycle[] = [];

/**
 * Executa um ciclo completo de auto-cura sobre os agentes
 * Ciclo: OBSERVAR → DETECTAR → DIAGNOSTICAR → PRESCREVER → EXECUTAR
 */
export function runHealingCycle(
  agentStates: Record<string, AgentState>,
): HealingCycle {
  const start = performance.now();
  cycleCount++;

  const reports: AnomalyReport[] = [];
  const actions: HealingAction[] = [];

  // ── PHASE 1: OBSERVE + DETECT ──
  for (const [agentId, state] of Object.entries(agentStates)) {
    const agentName = agentId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const metrics = [
      { key: 'fidelity', value: state.fidelity, threshold: THRESHOLDS.fidelity, invert: false },
      { key: 'coherence', value: state.coherence, threshold: THRESHOLDS.coherence, invert: false },
      { key: 'decoherence', value: state.decoherence, threshold: THRESHOLDS.decoherence, invert: true },
      { key: 'entanglement', value: state.entanglement, threshold: THRESHOLDS.entanglement, invert: false },
      { key: 'superposition', value: state.superposition, threshold: THRESHOLDS.superposition, invert: false },
    ];

    for (const metric of metrics) {
      let severity: Severity | null = null;
      const effectiveValue = metric.invert ? (1 - metric.value) : metric.value;

      if (effectiveValue <= metric.threshold.critical) severity = 'critical';
      else if (effectiveValue <= metric.threshold.warning) severity = 'warning';

      if (!severity) continue;

      const typeMap: Record<string, AnomalyType> = {
        fidelity: 'fidelity_drop', coherence: 'coherence_loss',
        decoherence: 'decoherence_spike', entanglement: 'entanglement_break',
        superposition: 'superposition_collapse',
      };

      const { diagnosis, prescribedSkills, healingAction } = diagnoseAnomaly(
        metric.key, metric.value, severity, agentId, agentName,
      );

      reports.push({
        id: `anom_${cycleCount}_${agentId}_${metric.key}`,
        agentId, agentName, type: typeMap[metric.key], severity,
        value: metric.value, threshold: metric.threshold[severity],
        delta: Math.abs(effectiveValue - metric.threshold[severity]),
        timestamp: new Date().toISOString(), diagnosis, prescribedSkills, healingAction,
      });
    }
  }

  // ── PHASE 2: DIAGNOSE + PRESCRIBE + EXECUTE ──
  const allAgents = Object.keys(agentStates);
  const crossAgentAvg: Record<string, number> = {
    fidelity: 0, coherence: 0, decoherence: 0, entanglement: 0, superposition: 0,
  };
  for (const state of Object.values(agentStates)) {
    crossAgentAvg.fidelity += state.fidelity;
    crossAgentAvg.coherence += state.coherence;
    crossAgentAvg.decoherence += state.decoherence;
    crossAgentAvg.entanglement += state.entanglement;
    crossAgentAvg.superposition += state.superposition;
  }
  for (const key of Object.keys(crossAgentAvg)) {
    crossAgentAvg[key] /= allAgents.length || 1;
  }

  for (const report of reports) {
    const currentState = agentStates[report.agentId];
    if (!currentState) continue;

    const beforeState = { ...currentState };

    for (const skill of report.prescribedSkills) {
      const algorithm = HEALING_ALGORITHMS[skill];
      if (!algorithm) continue;

      const metricKeyMap: Record<AnomalyType, keyof AgentState> = {
        fidelity_drop: 'fidelity', coherence_loss: 'coherence',
        decoherence_spike: 'decoherence', entanglement_break: 'entanglement',
        superposition_collapse: 'superposition',
      };
      const metricKey = metricKeyMap[report.type];
      const optimalRange = THRESHOLDS[metricKey].optimal;
      const target = (optimalRange[0] + optimalRange[1]) / 2;

      const params: Record<string, number> = {
        current: currentState[metricKey],
        target, optimal: target,
        crossPanelAvg: crossAgentAvg[metricKey] ?? 0.5,
        strength: report.severity === 'critical' ? 0.5 : 0.3,
        blend: report.severity === 'critical' ? 0.6 : 0.4,
        boost: report.severity === 'critical' ? 0.25 : 0.15,
        shieldStrength: report.severity === 'critical' ? 0.35 : 0.2,
        baseline: 0.7,
        syncRate: report.severity === 'critical' ? 0.5 : 0.35,
      };

      const result = algorithm(params);
      currentState[metricKey] = result.adjusted as number;

      // Clamp all values 0-1
      for (const key of Object.keys(currentState)) {
        if (typeof currentState[key as keyof AgentState] === 'number') {
          currentState[key as keyof AgentState] = Math.min(1, Math.max(0, currentState[key as keyof AgentState])) as number;
        }
      }

      const afterState = { ...currentState };
      const deltaApplied: Record<string, number> = {};
      for (const key of Object.keys(beforeState)) {
        deltaApplied[key] = afterState[key as keyof AgentState] - beforeState[key as keyof AgentState];
      }

      actions.push({
        id: `heal_${cycleCount}_${report.agentId}_${skill}`,
        agentId: report.agentId, skill, params,
        appliedAt: new Date().toISOString(),
        result: result.delta > 0 ? 'success' : result.delta === 0 ? 'partial' : 'failed',
        beforeState: beforeState as unknown as Record<string, number>,
        afterState: afterState as unknown as Record<string, number>,
        deltaApplied,
      });

      agentStates[report.agentId] = currentState;
    }
  }

  // ── PHASE 3: PERSIST CYCLE LOG ──
  const durationMs = Math.round(performance.now() - start);
  const successCount = actions.filter(a => a.result === 'success').length;
  const successRate = actions.length > 0 ? Math.round((successCount / actions.length) * 100) / 100 : 1;

  const cycle: HealingCycle = {
    id: `cycle_${cycleCount}`,
    cycleNumber: cycleCount, iteration: Date.now(),
    timestamp: new Date().toISOString(),
    agentsMonitored: allAgents.length,
    anomaliesDetected: reports.length,
    anomaliesCritical: reports.filter(r => r.severity === 'critical').length,
    healingActionsExecuted: actions.length,
    healingSuccessRate: successRate, durationMs, reports, actions,
  };

  healingHistory.push(cycle);
  if (healingHistory.length > 100) healingHistory.splice(0, healingHistory.length - 100);

  return cycle;
}

/**
 * Recupera histórico de ciclos de cura
 */
export function getHealingHistory(limit = 10): HealingCycle[] {
  return healingHistory.slice(-limit);
}

/**
 * Recupera o último ciclo de cura
 */
export function getLastHealingCycle(): HealingCycle | null {
  return healingHistory.length > 0 ? healingHistory[healingHistory.length - 1] : null;
}

/**
 * Gera estados iniciais saudáveis para N agentes
 */
export function generateHealthyAgentStates(agentIds: string[]): Record<string, AgentState> {
  const states: Record<string, AgentState> = {};
  for (const id of agentIds) {
    states[id] = {
      coherence: 0.7 + Math.random() * 0.2,
      entanglement: 0.6 + Math.random() * 0.2,
      superposition: 0.6 + Math.random() * 0.25,
      decoherence: 0.05 + Math.random() * 0.15,
      fidelity: 0.75 + Math.random() * 0.15,
      evolution: 0,
    };
  }
  return states;
}
