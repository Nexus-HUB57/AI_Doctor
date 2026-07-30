/** CHIMERA Routing Evaluator — Ported to AI_Doctor
 * Evaluates routing quality: Accuracy@1, Accuracy@3, MRR, cost efficiency, cascade hit rate, A/B testing. */

export interface GroundTruthEntry { intent: string; expectedModel: string; expectedProvider?: string; intentType?: string; }

export interface RoutingEvalResult {
  accuracyAt1: number; accuracyAt3: number; mrr: number; totalSamples: number;
  perModelAccuracy: Record<string, { correct: number; total: number; accuracy: number }>;
  perIntentTypeAccuracy: Record<string, { correct: number; total: number; accuracy: number }>;
  costEfficiency: { totalEstimatedCost: number; avgCostPerQuery: number };
  cascadeHitRate: number;
}

export interface RouteResult {
  modelo_selecionado: string; provedor: string; cascade_match: string | null;
  custo_estimado_usd: number; score_mcdm: { rank: number; score_total: number };
  allRanked?: Array<{ modelo_id: string; rank: number }>;
}

export class RoutingEvaluator {
  private groundTruth: GroundTruthEntry[];
  private abTestVariants: Map<string, { weights: Record<string, number>; samples: number }>;

  constructor() { this.groundTruth = []; this.abTestVariants = new Map(); }

  addGroundTruth(entries: GroundTruthEntry[]): void { this.groundTruth.push(...entries); }

  evaluate(routeFn: (intent: string) => RouteResult): RoutingEvalResult {
    if (this.groundTruth.length === 0) return this.emptyResult();
    let correctAt1 = 0; let correctAt3 = 0; let reciprocalRankSum = 0;
    let totalCost = 0; let cascadeHits = 0;
    const perModelCounts: Record<string, { correct: number; total: number }> = {};
    const perIntentTypeCounts: Record<string, { correct: number; total: number }> = {};

    for (const entry of this.groundTruth) {
      const result = routeFn(entry.intent); const expected = entry.expectedModel;
      const selected = result.modelo_selecionado; const intentType = entry.intentType ?? 'general';
      if (!perModelCounts[expected]) perModelCounts[expected] = { correct: 0, total: 0 };
      perModelCounts[expected].total++;
      if (!perIntentTypeCounts[intentType]) perIntentTypeCounts[intentType] = { correct: 0, total: 0 };
      perIntentTypeCounts[intentType].total++;
      const isTop1 = selected === expected;
      if (isTop1) { correctAt1++; perModelCounts[expected].correct++; perIntentTypeCounts[intentType].correct++; }
      const isTop3 = result.allRanked && result.allRanked.length > 0
        ? result.allRanked.slice(0, 3).some(r => r.modelo_id === expected) : isTop1;
      if (isTop3) correctAt3++;
      if (result.allRanked && result.allRanked.length > 0) {
        const found = result.allRanked.find(r => r.modelo_id === expected);
        reciprocalRankSum += found ? 1 / found.rank : 0;
      } else { reciprocalRankSum += isTop1 ? 1 : 0; }
      if (result.cascade_match !== null) cascadeHits++;
      totalCost += result.custo_estimado_usd;
    }

    const n = this.groundTruth.length;
    const perModelAccuracy: Record<string, { correct: number; total: number; accuracy: number }> = {};
    for (const [model, counts] of Object.entries(perModelCounts)) {
      perModelAccuracy[model] = { correct: counts.correct, total: counts.total, accuracy: counts.total > 0 ? counts.correct / counts.total : 0 };
    }
    const perIntentTypeAccuracy: Record<string, { correct: number; total: number; accuracy: number }> = {};
    for (const [type, counts] of Object.entries(perIntentTypeCounts)) {
      perIntentTypeAccuracy[type] = { correct: counts.correct, total: counts.total, accuracy: counts.total > 0 ? counts.correct / counts.total : 0 };
    }
    return { accuracyAt1: n > 0 ? correctAt1 / n : 0, accuracyAt3: n > 0 ? correctAt3 / n : 0,
      mrr: n > 0 ? reciprocalRankSum / n : 0, totalSamples: n, perModelAccuracy, perIntentTypeAccuracy,
      costEfficiency: { totalEstimatedCost: totalCost, avgCostPerQuery: n > 0 ? totalCost / n : 0 },
      cascadeHitRate: n > 0 ? cascadeHits / n : 0 };
  }

  registerVariant(variantId: string, weights: Record<string, number>): void {
    this.abTestVariants.set(variantId, { weights, samples: 0 });
  }

  recordVariantServing(variantId: string): void {
    const variant = this.abTestVariants.get(variantId); if (variant) variant.samples++;
  }

  getVariantStats(): Record<string, { samples: number; pctShare: number }> {
    const totalSamples = Array.from(this.abTestVariants.values()).reduce((sum, v) => sum + v.samples, 0);
    const stats: Record<string, { samples: number; pctShare: number }> = {};
    for (const [id, variant] of this.abTestVariants) { stats[id] = { samples: variant.samples, pctShare: totalSamples > 0 ? variant.samples / totalSamples : 0 }; }
    return stats;
  }

  private emptyResult(): RoutingEvalResult {
    return { accuracyAt1: 0, accuracyAt3: 0, mrr: 0, totalSamples: 0, perModelAccuracy: {}, perIntentTypeAccuracy: {},
      costEfficiency: { totalEstimatedCost: 0, avgCostPerQuery: 0 }, cascadeHitRate: 0 };
  }
}

export const routingEvaluator = new RoutingEvaluator();
