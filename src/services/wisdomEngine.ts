// ============================================================================
// AI_Doctor — Motor de Auto-Sabedoria DIMHEX (Wisdom Engine)
// Adaptado do LiveBook-rRNA para contexto médico: acumula padrões, insights e
// aprendizados de cada ciclo de auto-cura. Implementa o Pilar 3 do DIMHEX.
// ============================================================================

import { type HealingCycle, type AnomalyReport, type AgentState } from './selfHealingEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export interface WisdomPattern {
  id: string;
  pattern: string;
  frequency: number;
  lastObserved: string;
  avgSeverity: number;
  associatedAgents: string[];
  rootCauseHypothesis: string;
  recommendedPrevention: string;
  confidence: number;
}

export interface WisdomInsight {
  id: string;
  category: 'prevention' | 'optimization' | 'pattern' | 'correlation' | 'prediction';
  title: string;
  description: string;
  relatedAgents: string[];
  relatedSkills: string[];
  impact: number;
  confidence: number;
  discoveredAt: string;
  lastValidated: string;
  validationCount: number;
}

export interface DecisionMemory {
  id: string;
  context: string;
  action: string;
  skill: string;
  agentId: string;
  outcome: 'positive' | 'neutral' | 'negative';
  outcomeScore: number;
  timestamp: string;
}

export interface WisdomState {
  totalCyclesProcessed: number;
  totalAnomaliesObserved: number;
  totalHealingActions: number;
  wisdomScore: number;
  patternsCount: number;
  insightsCount: number;
  decisionsCount: number;
  avgHealingSuccessRate: number;
  bestHealingSuccessRate: number;
  evolutionGeneration: number;
  lastUpdated: string;
}

// ── In-memory stores ─────────────────────────────────────────────────────────

let wisdomState: WisdomState = {
  totalCyclesProcessed: 0,
  totalAnomaliesObserved: 0,
  totalHealingActions: 0,
  wisdomScore: 0.1,
  patternsCount: 0,
  insightsCount: 0,
  decisionsCount: 0,
  avgHealingSuccessRate: 0,
  bestHealingSuccessRate: 0,
  evolutionGeneration: 0,
  lastUpdated: new Date().toISOString(),
};

let patterns: WisdomPattern[] = [];
let insights: WisdomInsight[] = [];
let decisions: DecisionMemory[] = [];

// ── Pattern Recognition ──────────────────────────────────────────────────────

function extractPatternKey(report: AnomalyReport): string {
  return `${report.type}_${report.agentId}_${report.severity}`;
}

function generateRootCauseHypothesis(pattern: WisdomPattern): string {
  const agentName = pattern.associatedAgents[0]?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'agente';
  const hypotheses: Record<string, string> = {
    fidelity_drop: `A fidelidade de ${agentName} degrada ciclicamente, possivelmente por acumulação de decoerência não tratada. O pipeline diagnóstico apresenta fadiga iterativa.`,
    coherence_loss: `A coerência de ${agentName} oscila em padrão recorrente, indicando instabilidade estrutural no algoritmo de raciocínio clínico.`,
    decoherence_spike: `Picos de decoerência em ${agentName} sugerem que o mecanismo de contenção de entropia é insuficiente para a carga de processamento atual.`,
    entanglement_break: `O entrelaçamento de ${agentName} se degrada ciclicamente, indicando desalinhamento com a média cross-agente. Possível isolamento do consórcio.`,
    superposition_collapse: `A superposição de ${agentName} colapsa recorrentemente, indicando que o algoritmo de expansão multi-hipótese perde eficácia.`,
  };
  const typeKey = pattern.pattern.split('_')[0] + '_' + pattern.pattern.split('_')[1];
  return hypotheses[typeKey] ?? `Anomalia recorrente detectada em ${agentName}.`;
}

function generatePrevention(pattern: WisdomPattern): string {
  const preventions: Record<string, string> = {
    fidelity_drop: 'Pré-ativar recalibração preventiva quando fidelidade cair abaixo de 0.65 (antes do threshold de warning).',
    coherence_loss: 'Implementar estabilização proativa a cada 5 iterações para manter coerência acima de 0.6.',
    decoherence_spike: 'Ativar escudo antientropia preventivo quando decoerência ultrapassar 0.3.',
    entanglement_break: 'Forçar resync cross-agente a cada 3 iterações para manter entrelaçamento saudável.',
    superposition_collapse: 'Amplificar superposição preventivamente quando valor cair abaixo de 0.45.',
  };
  const typeKey = pattern.pattern.split('_')[0] + '_' + pattern.pattern.split('_')[1];
  return preventions[typeKey] ?? 'Monitorar e aplicar estabilização preventiva.';
}

// ── Main Wisdom Engine ──────────────────────────────────────────────────────

/**
 * Processa um ciclo de cura e extrai sabedoria: padrões, insights, memória de decisões
 */
export function processWisdomCycle(healingCycle: HealingCycle): {
  newPatterns: WisdomPattern[];
  newInsights: WisdomInsight[];
  updatedWisdomState: WisdomState;
} {
  const newPatterns: WisdomPattern[] = [];
  const newInsights: WisdomInsight[] = [];

  // ── STEP 1: Update patterns from this cycle's reports ──
  for (const report of healingCycle.reports) {
    const patternKey = extractPatternKey(report);
    const existing = patterns.find(p => p.pattern === patternKey);

    if (existing) {
      existing.frequency++;
      existing.lastObserved = report.timestamp;
      existing.avgSeverity = (existing.avgSeverity * (existing.frequency - 1) + (report.severity === 'critical' ? 1 : 0.5)) / existing.frequency;
      existing.confidence = Math.min(0.99, existing.confidence + 0.05);
      if (!existing.associatedAgents.includes(report.agentId)) {
        existing.associatedAgents.push(report.agentId);
      }
    } else {
      const newPattern: WisdomPattern = {
        id: `pat_${Date.now()}_${report.agentId}_${Math.random().toString(36).slice(2, 6)}`,
        pattern: patternKey, frequency: 1,
        lastObserved: report.timestamp,
        avgSeverity: report.severity === 'critical' ? 1 : 0.5,
        associatedAgents: [report.agentId],
        rootCauseHypothesis: '', recommendedPrevention: '', confidence: 0.3,
      };
      patterns.push(newPattern);
      newPatterns.push(newPattern);
    }
  }

  // Update hypotheses for patterns with frequency >= 2
  for (const pattern of patterns) {
    if (pattern.frequency >= 2 && !pattern.rootCauseHypothesis) {
      pattern.rootCauseHypothesis = generateRootCauseHypothesis(pattern);
      pattern.recommendedPrevention = generatePrevention(pattern);
      pattern.confidence = Math.min(0.95, pattern.confidence + 0.2);
    }
  }

  // ── STEP 2: Generate insights from healing actions ──
  for (const action of healingCycle.actions) {
    const decision: DecisionMemory = {
      id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      context: `Ação de cura para ${action.agentId} via skill ${action.skill}`,
      action: action.action,
      skill: action.skill,
      agentId: action.agentId,
      outcome: action.result === 'success' ? 'positive' : action.result === 'partial' ? 'neutral' : 'negative',
      outcomeScore: action.result === 'success' ? 0.8 : action.result === 'partial' ? 0.3 : -0.5,
      timestamp: action.appliedAt,
    };
    decisions.push(decision);

    // Generate insights from successful healing
    if (action.result === 'success' && action.deltaApplied) {
      const improvedMetric = Object.entries(action.deltaApplied)
        .find(([key, val]) => key !== 'evolution' && Math.abs(val) > 0.01);

      if (improvedMetric && !insights.find(i =>
        i.category === 'optimization' &&
        i.relatedSkills.includes(action.skill) &&
        i.relatedAgents.includes(action.agentId)
      )) {
        const metricName = improvedMetric[0].charAt(0).toUpperCase() + improvedMetric[0].slice(1);
        const insight: WisdomInsight = {
          id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          category: 'optimization',
          title: `Skill ${action.skill} eficaz para ${metricName} em ${action.agentId}`,
          description: `A aplicação do algoritmo ${action.skill} produziu melhoria de ${Math.abs(improvedMetric[1] * 100).toFixed(1)}% em ${metricName} para o agente ${action.agentId}. Esta correlação positiva pode ser usada para cura preventiva.`,
          relatedAgents: [action.agentId],
          relatedSkills: [action.skill],
          impact: Math.min(1, Math.abs(improvedMetric[1]) * 5),
          confidence: 0.6,
          discoveredAt: new Date().toISOString(),
          lastValidated: new Date().toISOString(),
          validationCount: 1,
        };
        insights.push(insight);
        newInsights.push(insight);
      }
    }
  }

  // ── STEP 3: Generate correlation insights ──
  if (healingCycle.reports.length >= 2) {
    const agentAnomalies = healingCycle.reports.reduce((acc, r) => {
      acc[r.agentId] = (acc[r.agentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const multiAnomalyAgents = Object.entries(agentAnomalies).filter(([, count]) => count >= 2);
    if (multiAnomalyAgents.length > 0 && !insights.find(i => i.category === 'correlation' && i.title.includes('Multi-anomalia'))) {
      const agentNames = multiAnomalyAgents.map(([id]) => id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      const insight: WisdomInsight = {
        id: `ins_corr_${Date.now()}`,
        category: 'correlation',
        title: 'Correlação multi-anomalia detectada',
        description: `Agentes ${agentNames.join(', ')} apresentaram múltiplas anomalias simultâneas. Sugere causa sistêmica compartilhada — possivelmente falha no mecanismo de consenso da junta médica. Recomenda-se investigar o loop de orquestração DIMHEX.`,
        relatedAgents: multiAnomalyAgents.map(([id]) => id),
        relatedSkills: ['resync', 'stabilize'],
        impact: 0.8, confidence: 0.5,
        discoveredAt: new Date().toISOString(),
        lastValidated: new Date().toISOString(),
        validationCount: 1,
      };
      insights.push(insight);
      newInsights.push(insight);
    }
  }

  // ── STEP 4: Update wisdom state (exponential growth) ──
  wisdomState.totalCyclesProcessed++;
  wisdomState.totalAnomaliesObserved += healingCycle.anomaliesDetected;
  wisdomState.totalHealingActions += healingCycle.healingActionsExecuted;
  wisdomState.evolutionGeneration = Math.max(wisdomState.evolutionGeneration, healingCycle.cycleNumber);

  const learningFactor = 1 + (newPatterns.length * 0.02 + newInsights.length * 0.03 + healingCycle.healingSuccessRate * 0.01);
  wisdomState.wisdomScore = Math.min(1, wisdomState.wisdomScore * Math.pow(learningFactor, 0.1) + 0.005);

  wisdomState.patternsCount = patterns.length;
  wisdomState.insightsCount = insights.length;
  wisdomState.decisionsCount = decisions.length;
  wisdomState.avgHealingSuccessRate = healingCycle.healingSuccessRate;
  wisdomState.bestHealingSuccessRate = Math.max(wisdomState.bestHealingSuccessRate, healingCycle.healingSuccessRate);
  wisdomState.lastUpdated = new Date().toISOString();

  // ── STEP 5: Trim to prevent unbounded growth ──
  if (patterns.length > 100) {
    patterns.sort((a, b) => b.frequency - a.frequency);
    patterns.splice(100);
  }
  if (insights.length > 100) {
    insights.sort((a, b) => b.confidence - a.confidence);
    insights.splice(100);
  }
  if (decisions.length > 500) {
    decisions = decisions.slice(-500);
  }

  return { newPatterns, newInsights, updatedWisdomState: wisdomState };
}

// ── Getters ──────────────────────────────────────────────────────────────────

export function getWisdomState(): WisdomState { return wisdomState; }
export function getWisdomPatterns(): WisdomPattern[] { return patterns; }
export function getWisdomInsights(): WisdomInsight[] { return insights; }
export function getDecisionMemory(limit = 20): DecisionMemory[] { return decisions.slice(-limit); }

// ── Wisdom-Guided Healing Suggestions ─────────────────────────────────────────

/**
 * Usa a sabedoria acumulada para sugerir ações preventivas
 */
export function getWisdomGuidedSuggestions(
  agentStates: Record<string, AgentState>,
): Array<{ agentId: string; suggestion: string; skill: string; priority: number }> {
  const suggestions: Array<{ agentId: string; suggestion: string; skill: string; priority: number }> = [];

  // Check known patterns against current state
  for (const pattern of patterns) {
    if (pattern.frequency < 2 || pattern.confidence < 0.4) continue;

    for (const agentId of pattern.associatedAgents) {
      const state = agentStates[agentId];
      if (!state) continue;

      const metricKey = pattern.pattern.split('_')[0];
      const warningThresholds: Record<string, number> = {
        fidelity: 0.55, coherence: 0.50, decoherence: 0.40, entanglement: 0.30, superposition: 0.35,
      };

      const threshold = warningThresholds[metricKey];
      if (threshold === undefined) continue;

      const value = (state as Record<string, number>)[metricKey];
      if (value === undefined) continue;

      const isApproachingWarning = metricKey === 'decoherence'
        ? value > threshold * 0.85
        : value < threshold * 1.15;

      if (isApproachingWarning && pattern.recommendedPrevention) {
        const skillMap: Record<string, string> = {
          fidelity_drop: 'recalibrate', coherence_loss: 'stabilize',
          decoherence_spike: 'shield', entanglement_break: 'amplify',
          superposition_collapse: 'amplify',
        };
        const skill = skillMap[metricKey + '_' + (metricKey === 'decoherence' ? 'spike' : metricKey === 'fidelity' ? 'drop' : metricKey === 'coherence' ? 'loss' : metricKey === 'entanglement' ? 'break' : 'collapse')] ?? 'stabilize';

        suggestions.push({
          agentId,
          suggestion: `[Sabedoria #${pattern.frequency}] ${pattern.recommendedPrevention}`,
          skill,
          priority: pattern.confidence * pattern.frequency * (metricKey === 'decoherence' ? value : (1 - value)),
        });
      }
    }
  }

  // Also add insight-based suggestions
  for (const insight of insights) {
    if (insight.category !== 'optimization' || insight.confidence < 0.5) continue;
    for (const agentId of insight.relatedAgents) {
      suggestions.push({
        agentId,
        suggestion: `[Insight] ${insight.description}`,
        skill: insight.relatedSkills[0] ?? 'stabilize',
        priority: insight.impact * insight.confidence,
      });
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}

/**
 * Reseta o estado do Wisdom Engine (para testes)
 */
export function resetWisdomEngine(): void {
  wisdomState = {
    totalCyclesProcessed: 0, totalAnomaliesObserved: 0, totalHealingActions: 0,
    wisdomScore: 0.1, patternsCount: 0, insightsCount: 0, decisionsCount: 0,
    avgHealingSuccessRate: 0, bestHealingSuccessRate: 0,
    evolutionGeneration: 0, lastUpdated: new Date().toISOString(),
  };
  patterns = [];
  insights = [];
  decisions = [];
}
