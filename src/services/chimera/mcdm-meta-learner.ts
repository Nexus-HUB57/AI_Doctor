/** CHIMERA MCDM Meta-Learner — Ported to AI_Doctor
 * Learns optimal MCDM weights per intent type from routing feedback.
 * Pure TypeScript — no external dependencies. */

export interface WeightSample {
  intentType: string; pesos: Record<string, number>;
  modeloSelecionado: string; feedbackScore: number; timestamp: number;
}

const INTENT_RULES: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /code|debug|codigo|programar|typescript|javascript|python|refactor|codigo_fonte/i, type: 'code' },
  { pattern: /math|calculo|equacao|formula|estatistica|probabilidade|algebra/i, type: 'math' },
  { pattern: /reasoning|raciocinio|logica|arquitetura|estrategia|planejamento|analise/i, type: 'reasoning' },
  { pattern: /image|imagem|video|audio|multimodal|visionamento|foto/i, type: 'multimodal' },
  { pattern: /seguranca|security|vulnerabilidade|audit|pentest/i, type: 'security' },
  { pattern: /deploy|devops|cloud|infra|kubernetes|docker|ci\/cd/i, type: 'devops' },
];

const DEFAULT_WEIGHTS: Record<string, number> = { qualidade: 0.35, velocidade: 0.20, custo: 0.15, disponibilidade: 0.10, especializacao: 0.10, contexto: 0.10 };

export class McdmMetaLearner {
  private samples: WeightSample[];
  private defaultWeights: Record<string, number>;
  private learningRate: number;
  private maxSamples: number;

  constructor(opts?: { learningRate?: number; maxSamples?: number }) {
    this.samples = []; this.defaultWeights = { ...DEFAULT_WEIGHTS };
    this.learningRate = opts?.learningRate ?? 0.15; this.maxSamples = opts?.maxSamples ?? 5000;
  }

  classifyIntent(intent: string): string {
    for (const rule of INTENT_RULES) { if (rule.pattern.test(intent)) return rule.type; }
    return 'general';
  }

  recordFeedback(intent: string, pesos: Record<string, number>, modelo: string, score: number): void {
    const intentType = this.classifyIntent(intent);
    const sample: WeightSample = { intentType, pesos: { ...pesos }, modeloSelecionado: modelo,
      feedbackScore: Math.max(0, Math.min(1, score)), timestamp: Date.now() };
    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) this.samples = this.samples.slice(this.samples.length - this.maxSamples);
  }

  getWeights(intentType: string): Record<string, number> {
    const relevant = this.samples.filter(s => s.intentType === intentType && s.feedbackScore >= 0.5);
    if (relevant.length === 0) return { ...this.defaultWeights };
    const decay = 0.95; const weights = { ...this.defaultWeights };
    const keys = Object.keys(weights);
    const weightSums: Record<string, number> = {}; const weightCounts: Record<string, number> = {};
    for (const key of keys) { weightSums[key] = 0; weightCounts[key] = 0; }
    for (let i = 0; i < relevant.length; i++) {
      const age = relevant.length - 1 - i; const factor = Math.pow(decay, age);
      for (const key of keys) {
        if (key in relevant[i].pesos) { weightSums[key] += relevant[i].pesos[key] * factor; weightCounts[key] += factor; }
      }
    }
    const avgWeights: Record<string, number> = {};
    for (const key of keys) { avgWeights[key] = weightCounts[key] > 0 ? weightSums[key] / weightCounts[key] : this.defaultWeights[key]; }
    const blended: Record<string, number> = {};
    for (const key of keys) {
      blended[key] = Math.max(0, Math.min(1, this.defaultWeights[key] + this.learningRate * (avgWeights[key] - this.defaultWeights[key])));
    }
    const sum = Object.values(blended).reduce((a, b) => a + b, 0);
    if (sum > 0) { for (const key of keys) blended[key] = blended[key] / sum; }
    return blended;
  }

  getStats(): { totalSamples: number; intentTypes: string[]; weightDeltas: Record<string, Record<string, number>> } {
    const intentTypes = Array.from(new Set(this.samples.map(s => s.intentType)));
    const weightDeltas: Record<string, Record<string, number>> = {};
    for (const type of intentTypes) {
      const learned = this.getWeights(type); weightDeltas[type] = {};
      for (const key of Object.keys(this.defaultWeights)) { weightDeltas[type][key] = learned[key] - this.defaultWeights[key]; }
    }
    return { totalSamples: this.samples.length, intentTypes, weightDeltas };
  }
}

export const mcdmLearner = new McdmMetaLearner();
