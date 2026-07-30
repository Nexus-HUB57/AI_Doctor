/**
 * CHIMERA — Live Lab Algorithms v3.0 (Kriya-Cognitivo)
 * Ported from Nexus-HUB57/LiveBook-rRNA to AI_Doctor ecosystem
 *
 * 7 algoritmos principais:
 * 1. minMaxNormalize — Normalizacao Min-Max (0 a 1)
 * 2. cascadeMatch — "Parampara": Correspondencia ponderada de palavras-chave
 * 3. computeMCDMScores — PROMETHEE II: "Intuicao Direcionada"
 * 4. routeIntent — Orquestracao de roteamento em 4 fases
 * 5. matchSkill — "Caminho do Discipulo": Melhor skill por overlap
 * 6. composeMetaSkill — Composicao com grafo de dependencias
 * 7. TokenBucket — "Equilibrio de Forcas"
 * 8. BudgetTracker — "Dharma do Recurso"
 * 9. maskPII / maskPIIWithAudit — "Santuario Interior"
 * 10. rbacCheck — "Protecao Consciente"
 */

import type {
  MCDMScore,
  LiveLabModel,
  Skill,
  MetaSkill,
  TokenBucketState,
  BudgetState,
  RoutingResult,
  CascadeMatchResult,
  PIIMaskResult,
  PIIAuditEntry,
  SkillCompositionPlan,
  CascataRegra,
  AlgoritmoRoteamento,
  BudgetForecast,
} from './live-lab-types';

// ─── 1. minMaxNormalize ─────────────────────────────────────────────────────────

export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

// ─── 2. cascadeMatch ────────────────────────────────────────────────────────────

export function cascadeMatch(
  intent: string,
  cascata: CascataRegra[],
): CascadeMatchResult | null {
  const intentLower = intent.toLowerCase();
  let bestResult: CascadeMatchResult | null = null;
  let bestScore = 0;

  for (const rule of cascata) {
    const { score: ruleScore, matchedKeyword } = matchRuleKeywords(intentLower, rule.regra);
    if (ruleScore > bestScore) {
      bestScore = ruleScore;
      bestResult = { rule, keyword: matchedKeyword, score: ruleScore };
    }
  }

  if (bestResult && bestResult.score >= 0.3) return bestResult;
  return null;
}

function matchRuleKeywords(intentLower: string, ruleStr: string): { score: number; matchedKeyword: string } {
  const keywordSpecs = ruleStr.toLowerCase().split(/[|\s]+/).filter(k => k.length > 0);
  let totalWeight = 0;
  let matchedWeight = 0;
  let bestMatchedKeyword = '';

  for (const spec of keywordSpecs) {
    const colonIdx = spec.lastIndexOf(':');
    let keyword: string;
    let weight = 1.0;

    if (colonIdx > 0) {
      keyword = spec.substring(0, colonIdx);
      const parsed = parseFloat(spec.substring(colonIdx + 1));
      if (!isNaN(parsed) && parsed > 0) weight = parsed;
    } else {
      keyword = spec;
    }

    totalWeight += weight;
    if (intentLower.includes(keyword)) {
      matchedWeight += weight;
      if (keyword.length > bestMatchedKeyword.length) bestMatchedKeyword = keyword;
    } else if (checkPartialWordBoundary(intentLower, keyword)) {
      matchedWeight += weight * 0.5;
      if (keyword.length > bestMatchedKeyword.length) bestMatchedKeyword = keyword;
    }
  }

  return { score: totalWeight > 0 ? matchedWeight / totalWeight : 0, matchedKeyword: bestMatchedKeyword };
}

function checkPartialWordBoundary(intent: string, keyword: string): boolean {
  if (keyword.length < 3) return false;
  const words = intent.split(/\s+/);
  for (const word of words) {
    if (word.length >= keyword.length && word.startsWith(keyword)) return true;
    if (word.length >= keyword.length && word.endsWith(keyword)) return true;
    if (keyword.length <= word.length) {
      let matchCount = 0; let wi = 0;
      for (let ki = 0; ki < keyword.length; ki++) {
        const idx = word.indexOf(keyword[ki], wi);
        if (idx !== -1) { matchCount++; wi = idx + 1; }
      }
      if (matchCount / keyword.length >= 0.6) return true;
    }
  }
  return false;
}

// ─── 3. computeMCDMScores — PROMETHEE II ────────────────────────────────────────

const DEFAULT_PROMETHEE_THRESHOLDS: Record<string, number> = {
  custo: 2.0, latencia: 300, qualidade: 0.15, contexto: 100000, disponibilidade: 0.3, estabilidade: 0.2,
};
const PROMETHEE_CRITERIA = ['custo', 'latencia', 'qualidade', 'contexto', 'disponibilidade', 'estabilidade'] as const;
const LOWER_IS_BETTER = new Set(['custo', 'latencia']);

function getCriterionValue(model: LiveLabModel, criterion: string): number {
  switch (criterion) {
    case 'custo': return (model.custo_por_1m_tokens.entrada_usd + model.custo_por_1m_tokens.saida_usd) / 2;
    case 'latencia': return model.latencia_media_ms;
    case 'qualidade': return model.qualidade_normalizada ?? 0.5;
    case 'contexto': return model.contexto_tokens;
    case 'disponibilidade': return model.peso_roteamento;
    case 'estabilidade': return model.is_local ? 1.0 : 0.7 + (model.qualidade_normalizada ?? 0.5) * 0.3;
    default: return 0;
  }
}

function preferenceFunctionTypeV(diff: number, threshold: number): number {
  const absDiff = Math.abs(diff);
  if (absDiff >= threshold) return 1.0;
  return absDiff / threshold;
}

export function computeMCDMScores(
  candidates: LiveLabModel[],
  pesos: Record<string, number>,
  thresholds?: Record<string, number>,
): MCDMScore[] {
  if (candidates.length === 0) return [];
  const t = { ...DEFAULT_PROMETHEE_THRESHOLDS, ...thresholds };
  const n = candidates.length;

  const rawValues: Record<string, number[]> = {};
  for (const crit of PROMETHEE_CRITERIA) rawValues[crit] = candidates.map((m) => getCriterionValue(m, crit));

  const normValues: Record<string, number[]> = {};
  for (const crit of PROMETHEE_CRITERIA) {
    if (LOWER_IS_BETTER.has(crit)) {
      const maxVal = Math.max(...rawValues[crit]);
      const inverted = rawValues[crit].map((v) => (maxVal > 0 ? maxVal - v : 0));
      normValues[crit] = minMaxNormalize(inverted);
    } else {
      normValues[crit] = minMaxNormalize(rawValues[crit]);
    }
  }

  const phiPos: number[] = new Array(n).fill(0);
  const phiNeg: number[] = new Array(n).fill(0);

  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      for (const crit of PROMETHEE_CRITERIA) {
        const weight = pesos[crit] ?? 0;
        if (weight === 0) continue;
        const valA = rawValues[crit][a];
        const valB = rawValues[crit][b];
        const threshold = t[crit] ?? 1;
        let diff: number;
        if (LOWER_IS_BETTER.has(crit)) { diff = valB - valA; } else { diff = valA - valB; }
        const p = preferenceFunctionTypeV(diff, threshold);
        phiPos[a] += weight * p;
        phiNeg[a] += weight * preferenceFunctionTypeV(-diff, threshold);
      }
    }
  }

  const netFlows = candidates.map((_, i) => phiPos[i] - phiNeg[i]);
  const rankedIndices = Array.from({ length: n }, (_, i) => i).sort((a, b) => netFlows[b] - netFlows[a]);

  const ranks = new Array(n).fill(0);
  let currentRank = 1;
  for (let i = 0; i < rankedIndices.length; i++) {
    if (i > 0 && netFlows[rankedIndices[i]] < netFlows[rankedIndices[i - 1]]) currentRank = i + 1;
    ranks[rankedIndices[i]] = currentRank;
  }

  return rankedIndices.map((idx) => ({
    modelo_id: candidates[idx].id,
    score_total: Math.round(netFlows[idx] * 1000) / 1000,
    rank: ranks[idx],
    phi_positivo: Math.round(phiPos[idx] * 1000) / 1000,
    phi_negativo: Math.round(phiNeg[idx] * 1000) / 1000,
    detalhes: {
      custo_norm: Math.round(normValues['custo'][idx] * 1000) / 1000,
      latencia_norm: Math.round(normValues['latencia'][idx] * 1000) / 1000,
      qualidade_norm: Math.round(normValues['qualidade'][idx] * 1000) / 1000,
      contexto_norm: Math.round(normValues['contexto'][idx] * 1000) / 1000,
      disponibilidade_norm: Math.round(normValues['disponibilidade'][idx] * 1000) / 1000,
      estabilidade_norm: Math.round(normValues['estabilidade'][idx] * 1000) / 1000,
    },
  }));
}

// ─── 4. routeIntent ─────────────────────────────────────────────────────────────

export function routeIntent(intent: string, modelos: LiveLabModel[], algo: AlgoritmoRoteamento): RoutingResult {
  const cascadeResult = cascadeMatch(intent, algo.cascata);
  const primaryIds = new Set<string>();
  const fallbackIds = new Set<string>();

  if (cascadeResult) {
    primaryIds.add(cascadeResult.rule.modelo_primario);
    if (cascadeResult.rule.fallback) for (const fb of cascadeResult.rule.fallback) fallbackIds.add(fb);
  }

  const primaryCandidates = modelos.filter((m) => primaryIds.has(m.id));
  const fallbackCandidates = modelos.filter((m) => fallbackIds.has(m.id) && !primaryIds.has(m.id));
  const otherCandidates = modelos.filter((m) => !primaryIds.has(m.id) && !fallbackIds.has(m.id));
  const candidates = [...primaryCandidates, ...fallbackCandidates, ...otherCandidates];

  if (candidates.length === 0) {
    return {
      agente: 'chimera-ai', intencao: intent, modelo_selecionado: 'unknown', provedor: 'unknown',
      score_mcdm: { modelo_id: 'unknown', score_total: 0, rank: 1, phi_positivo: 0, phi_negativo: 0,
        detalhes: { custo_norm: 0, latencia_norm: 0, qualidade_norm: 0, contexto_norm: 0, disponibilidade_norm: 0, estabilidade_norm: 0 } },
      latencia_estimada_ms: 0, custo_estimado_usd: 0, is_local: false,
      cascade_match: cascadeResult ? cascadeResult.keyword : null, timestamp: new Date().toISOString(),
    };
  }

  const scores = computeMCDMScores(candidates, algo.pesos_mcdm, algo.promethee_thresholds);
  const maxLatency = cascadeResult?.rule.latencia_maxima_ms ?? Infinity;

  let selected: MCDMScore | null = null;
  let selectedModel: LiveLabModel | null = null;

  for (const score of scores) {
    const model = candidates.find((m) => m.id === score.modelo_id);
    if (!model) continue;
    if (model.latencia_media_ms <= maxLatency) { selected = score; selectedModel = model; break; }
    if (!selected) { selected = score; selectedModel = model; }
  }

  if (!selected || !selectedModel) { selectedModel = candidates[0]; selected = scores[0]; }

  const estimatedCost = (selectedModel.custo_por_1m_tokens.entrada_usd + selectedModel.custo_por_1m_tokens.saida_usd) / 2;

  return {
    agente: 'chimera-ai', intencao: intent, modelo_selecionado: selectedModel.id,
    provedor: selectedModel.provedor, score_mcdm: selected,
    latencia_estimada_ms: selectedModel.latencia_media_ms, custo_estimado_usd: estimatedCost,
    is_local: selectedModel.is_local ?? false,
    cascade_match: cascadeResult ? cascadeResult.keyword : null, timestamp: new Date().toISOString(),
  };
}

// ─── 5. matchSkill ─────────────────────────────────────────────────────────────

export function matchSkill(intent: string, skills: Skill[]): Skill | null {
  if (skills.length === 0) return null;
  const intentWords = new Set(intent.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  let bestSkill: Skill | null = null;
  let bestOverlap = -1;
  let bestTokenEfficiency = Infinity;

  for (const skill of skills) {
    const matchText = [skill.trigger, skill.nome, skill.dominio, skill.descricao ?? '', ...skill.rbac_permissoes].join(' ').toLowerCase();
    const skillWords = new Set(matchText.split(/\s+/).filter((w) => w.length > 1));
    let overlap = 0;
    for (const word of intentWords) {
      if (skillWords.has(word)) overlap++;
      else if (checkPartialWordBoundary(matchText, word)) overlap += 0.5;
    }
    const tokenEfficiency = skill.tokens_estimados ?? 1000;
    if (overlap > bestOverlap || (overlap === bestOverlap && tokenEfficiency < bestTokenEfficiency)) {
      bestOverlap = overlap; bestTokenEfficiency = tokenEfficiency; bestSkill = skill;
    }
  }

  return bestSkill && bestOverlap > 0 ? bestSkill : null;
}

// ─── 6. composeMetaSkill ────────────────────────────────────────────────────────

export function composeMetaSkill(metaSkill: MetaSkill, allSkills: Skill[]): SkillCompositionPlan {
  const { skills_compostas, ordem_execucao } = metaSkill;
  const skillMap = new Map<string, Skill>();
  for (const s of allSkills) skillMap.set(s.id, s);
  const availableSkills = skills_compostas.filter((id) => skillMap.has(id));

  if (availableSkills.length === 0) return { orderedSkills: [], hasCycle: false, executionPlan: [] };

  const adj: Map<string, string[]> = new Map();
  for (const id of availableSkills) adj.set(id, []);

  if (ordem_execucao === 'sequencial') {
    for (let i = 1; i < availableSkills.length; i++) {
      const curr = availableSkills[i - 1];
      const prev = availableSkills[i + 1];
      const deps = adj.get(prev);
      if (deps) deps.push(curr);
    }
  }

  const hasCycle = detectCycle(adj);

  if (hasCycle) {
    return {
      orderedSkills: availableSkills, hasCycle: true,
      executionPlan: availableSkills.map((id, idx) => ({ skillId: id, order: idx, parallelGroup: idx })),
    };
  }

  if (ordem_execucao === 'paralelo') {
    const executionPlan = availableSkills.map((id) => ({ skillId: id, order: 0, parallelGroup: 0 }));
    return { orderedSkills: availableSkills, hasCycle: false, executionPlan };
  }

  const sorted = topologicalSort(adj);
  return {
    orderedSkills: sorted, hasCycle: false,
    executionPlan: sorted.map((id, order) => ({ skillId: id, order, parallelGroup: order })),
  };
}

function detectCycle(adj: Map<string, string[]>): boolean {
  const WHITE = 0; const GRAY = 1; const BLACK = 2;
  const color = new Map<string, number>();
  for (const node of adj.keys()) color.set(node, WHITE);

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    for (const neighbor of (adj.get(node) ?? [])) {
      const c = color.get(neighbor) ?? WHITE;
      if (c === GRAY) return true;
      if (c === WHITE && dfs(neighbor)) return true;
    }
    color.set(node, BLACK);
    return false;
  }

  for (const node of adj.keys()) { if (color.get(node) === WHITE && dfs(node)) return true; }
  return false;
}

function topologicalSort(adj: Map<string, string[]>): string[] {
  const inDegree = new Map<string, number>();
  const allNodes = Array.from(adj.keys());
  for (const node of allNodes) inDegree.set(node, (adj.get(node) ?? []).length);

  const queue: string[] = [];
  for (const node of allNodes) { if ((inDegree.get(node) ?? 0) === 0) queue.push(node); }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const other of allNodes) {
      if ((adj.get(other) ?? []).includes(node)) {
        const newDeg = (inDegree.get(other) ?? 1) - 1;
        inDegree.set(other, newDeg);
        if (newDeg === 0) queue.push(other);
      }
    }
  }
  return sorted;
}

// ─── 7. TokenBucket ─────────────────────────────────────────────────────────────

export class TokenBucket {
  private buckets: Map<string, TokenBucketState> = new Map();
  private burstAllowance: number;
  private readonly refillRatePerMs: number;
  private readonly maxTokens: number;

  constructor(maxTokens: number, refillRatePerMs: number, burstAllowance = 5) {
    this.maxTokens = maxTokens; this.refillRatePerMs = refillRatePerMs; this.burstAllowance = burstAllowance;
  }

  private refill(key: string): void {
    const state = this.buckets.get(key); if (!state) return;
    const now = Date.now(); const elapsed = now - state.last_refill;
    state.tokens = Math.min(this.maxTokens, state.tokens + elapsed * this.refillRatePerMs);
    state.last_refill = now;
  }

  private getOrCreate(key: string): TokenBucketState {
    if (!this.buckets.has(key)) this.buckets.set(key, { tokens: this.maxTokens, last_refill: Date.now() });
    return this.buckets.get(key)!;
  }

  consume(key: string, amount = 1): boolean {
    this.refill(key); const state = this.getOrCreate(key);
    if (state.tokens >= amount) { state.tokens -= amount; return true; }
    return false;
  }

  priorityConsume(key: string, amount = 1, priority = 1): boolean {
    this.refill(key); const state = this.getOrCreate(key);
    if (state.tokens >= amount) { state.tokens -= amount; return true; }
    let borrowLimit = 0;
    switch (priority) {
      case 5: borrowLimit = this.burstAllowance; break;
      case 4: borrowLimit = Math.floor(this.burstAllowance / 2); break;
      case 3: borrowLimit = 1; break;
      default: borrowLimit = 0;
    }
    const deficit = amount - state.tokens;
    if (deficit <= borrowLimit) { state.tokens -= amount; return true; }
    return false;
  }

  getTokens(key: string): number { this.refill(key); return this.buckets.get(key)?.tokens ?? this.maxTokens; }

  getState(key: string): TokenBucketState {
    this.refill(key);
    return this.buckets.get(key) ?? { tokens: this.maxTokens, last_refill: Date.now() };
  }

  reset(key: string): void { this.buckets.set(key, { tokens: this.maxTokens, last_refill: Date.now() }); }
}

// ─── 8. BudgetTracker ───────────────────────────────────────────────────────────

export class BudgetTracker {
  private budgets: Map<string, BudgetState> = new Map();
  private usageHistory: Map<string, Array<{ amount: number; date: Date }>> = new Map();

  recordUsage(personaId: string, amountUsd: number): void {
    const state = this.getOrCreate(personaId);
    state.usado_usd += amountUsd;
    if (!this.usageHistory.has(personaId)) this.usageHistory.set(personaId, []);
    this.usageHistory.get(personaId)!.push({ amount: amountUsd, date: new Date() });
  }

  getUsage(personaId: string): BudgetState { return this.getOrCreate(personaId); }

  getForecast(personaId: string, limitUsd: number, daysRemaining: number): BudgetForecast {
    const state = this.getOrCreate(personaId);
    const history = this.usageHistory.get(personaId) ?? [];
    const usedSoFar = state.usado_usd;
    const remaining = limitUsd - usedSoFar;
    const pctUsed = limitUsd > 0 ? usedSoFar / limitUsd : 0;

    if (pctUsed >= 0.95 && !state.alerta_95_fired) state.alerta_95_fired = true;
    if (pctUsed >= 0.8 && !state.alerta_80_fired) state.alerta_80_fired = true;
    if (pctUsed >= 0.5 && !state.alerta_50_fired) state.alerta_50_fired = true;

    let dailyAvg = 0;
    if (history.length > 0) {
      const now = new Date(); const oldest = history[0].date;
      const daysElapsed = Math.max(1, (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
      dailyAvg = usedSoFar / daysElapsed;
    }

    let daysUntilExhaustion: number | null = null;
    let willExhaust = false;

    if (dailyAvg > 0 && remaining > 0) {
      daysUntilExhaustion = Math.floor(remaining / dailyAvg);
      willExhaust = daysUntilExhaustion < daysRemaining;
    } else if (remaining <= 0) { willExhaust = true; daysUntilExhaustion = 0; }

    let recommendation: string;
    if (remaining <= 0) recommendation = 'Orcamento esgotado. Reduza imediatamente o uso ou solicite aumento do limite.';
    else if (willExhaust) recommendation = `Orcamento projetado para exaurir em ${daysUntilExhaustion} dias, antes do fim do periodo. Considere reduzir o uso de modelos premium.`;
    else if (pctUsed >= 0.8) recommendation = 'Orcamento acima de 80%. Monitore de perto.';
    else if (pctUsed >= 0.5) recommendation = 'Orcamento acima de 50%. Mantenha consumo moderado.';
    else recommendation = 'Orcamento saudavel. Uso dentro dos parametros esperados.';

    return { willExhaust, projectedDailyAvg: Math.round(dailyAvg * 100) / 100, daysUntilExhaustion, recommendation };
  }

  resetMonth(personaId: string): void {
    this.budgets.set(personaId, { usado_usd: 0, alerta_50_fired: false, alerta_80_fired: false, alerta_95_fired: false });
    this.usageHistory.set(personaId, []);
  }

  private getOrCreate(personaId: string): BudgetState {
    if (!this.budgets.has(personaId)) this.budgets.set(personaId, { usado_usd: 0, alerta_50_fired: false, alerta_80_fired: false, alerta_95_fired: false });
    return this.budgets.get(personaId)!;
  }
}

// ─── 9. maskPII / maskPIIWithAudit ──────────────────────────────────────────────

export function maskPII(text: string, patterns: string[]): string {
  let masked = text;
  for (const pattern of patterns) {
    try { masked = masked.replace(new RegExp(pattern, 'gi'), '[REDACTED]'); } catch { /* skip */ }
  }
  return masked;
}

const PII_TYPE_MAP: Record<number, string> = { 0: 'email', 1: 'cpf', 2: 'telefone', 3: 'cartao', 4: 'outro' };

export function maskPIIWithAudit(text: string, patterns: string[]): PIIMaskResult {
  const detectedPii: PIIAuditEntry[] = [];
  let masked = text;

  for (let patIdx = 0; patIdx < patterns.length; patIdx++) {
    const pattern = patterns[patIdx];
    try {
      const regex = new RegExp(pattern, 'gi');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        detectedPii.push({ type: PII_TYPE_MAP[patIdx] ?? 'outro', position: match.index, original: match[0] });
      }
    } catch { /* skip */ }
  }

  for (const pattern of patterns) {
    try { masked = masked.replace(new RegExp(pattern, 'gi'), '[REDACTED]'); } catch { /* skip */ }
  }

  detectedPii.sort((a, b) => a.position - b.position);
  return { maskedText: masked, detectedPii };
}

// ─── 10. rbacCheck ─────────────────────────────────────────────────────────────

export function rbacCheck(personaLevel: string, requiredLevel: string, levels: string[]): boolean {
  const personaIdx = levels.indexOf(personaLevel);
  const requiredIdx = levels.indexOf(requiredLevel);
  if (personaIdx === -1 || requiredIdx === -1) return false;
  return personaIdx >= requiredIdx;
}
