/**
 * server/bridge/agentic_bridge.ts
 * =====================================================================
 * Bridge HTTP para o organismo agêntico Python (AI_Doctor/Agentic Engine).
 *
 * Conecta o stack TypeScript (plataforma web) ao motor Python
 * (decisão bayesiana, ChromaDB, SHAP, mapeadores NCCN).
 *
 * Design:
 * - Cliente HTTP nativo (Node 22 fetch) — sem deps extras
 * - Circuit breaker: se o Python cair, fallback graceful
 * - Timeout configurável (RAG/junta podem ser lentos)
 * - Tipos espelham os schemas Pydantic do agentic_api
 * =====================================================================
 */

const AGENTIC_BASE_URL =
  process.env.AGENTIC_API_URL || "http://127.0.0.1:8000";

const AGENTIC_TIMEOUT_MS = Number(process.env.AGENTIC_TIMEOUT_MS || "8000");

// =====================================================================
// Types — espelham Pydantic models
// =====================================================================

export interface Biomarkers {
  ctDNA: number;
  CTC: number;
  TMB: number;
  PD_L1: number;
  TILs: number;
  ECOG: number;
  idade?: number;
  sexo?: string;
  tumor_tipo?: string;
  estagio?: string;
  mutacoes?: string[];
}

export interface DecideRequest {
  patient_id: string;
  biomarkers: Biomarkers;
  contexto?: Record<string, unknown>;
  force_paradigm?: string;
}

export interface DecideResponse {
  patient_id: string;
  acao: string;
  esquema_nccn: string;
  classe_terapeutica: string;
  confianca: number;
  paradigma: string;
  ciclo: number;
  reserva_organica: number;
  estado_emocional: string;
  timestamp: string;
  fallback_used: boolean;
  notes?: string | null;
}

export interface ShapResponse {
  shap_values: Record<string, number>;
  top_driver: string;
  relatorio: string;
  ecog: number;
}

export interface LearnResponse {
  patient_id: string;
  paradigma_mutated: boolean;
  novo_paradigma: string | null;
  erros_consecutivos: number;
  nota: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  uptime_seconds: number;
  dependencies: Record<string, boolean>;
  timestamp: string;
}

export type Outcome =
  | "RESPOSTA_COMPLETA"
  | "RESPOSTA_PARCIAL"
  | "PROGRESSAO"
  | "TOXICIDADE";

// =====================================================================
// Cliente HTTP com circuit breaker
// =====================================================================

interface CircuitState {
  failures: number;
  openUntil: number; // timestamp ms — quando reabre
}

const circuit: CircuitState = { failures: 0, openUntil: 0 };
const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 30_000;

async function callAgentic<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown
): Promise<T | null> {
  // Circuit breaker: se aberto, retorna null sem tentar
  if (circuit.openUntil > Date.now()) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AGENTIC_TIMEOUT_MS);

  try {
    const res = await fetch(`${AGENTIC_BASE_URL}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as T;
    // Reset failure counter em sucesso
    circuit.failures = 0;
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    circuit.failures += 1;
    if (circuit.failures >= CIRCUIT_THRESHOLD) {
      circuit.openUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
      console.warn(
        `[agentic-bridge] circuit aberto por ${CIRCUIT_COOLDOWN_MS}ms após ${circuit.failures} falhas: ${(err as Error).message}`
      );
    } else {
      console.warn(
        `[agentic-bridge] falha em ${path} (${circuit.failures}/${CIRCUIT_THRESHOLD}): ${(err as Error).message}`
      );
    }
    return null;
  }
}

// =====================================================================
// API pública do bridge
// =====================================================================

/** Health check do organismo Python. */
export async function getAgenticHealth(): Promise<HealthResponse | null> {
  return callAgentic<HealthResponse>("GET", "/health");
}

/** Solicita uma decisão terapêutica ao agente bayesiano. */
export async function decide(req: DecideRequest): Promise<DecideResponse | null> {
  return callAgentic<DecideResponse>("POST", "/decide", req);
}

/** Solicita explicação SHAP/XAI de uma decisão. */
export async function getShap(
  biomarkers: Biomarkers,
  fracao_resistentes: number,
  acao: string,
  mutacao_chave?: string
): Promise<ShapResponse | null> {
  return callAgentic<ShapResponse>("POST", "/shap", {
    biomarkers,
    fracao_resistentes,
    acao,
    mutacao_chave: mutacao_chave || "BRAF V600E",
  });
}

/** Indexa um caso clínico no ChromaDB do organismo. */
export async function indexCase(
  patient_id: string,
  biomarkers: Biomarkers,
  metadata?: Record<string, unknown>
): Promise<{ indexed: boolean; collection_size: number } | null> {
  return callAgentic("POST", "/index", { patient_id, biomarkers, metadata });
}

/** Envia feedback de desfecho para o loop de auto-cura. */
export async function learn(
  patient_id: string,
  outcome: Outcome,
  feedback?: Record<string, unknown>
): Promise<LearnResponse | null> {
  return callAgentic<LearnResponse>("POST", "/learn", {
    patient_id,
    outcome,
    feedback,
  });
}

/** Lista os agentes lógicos do organismo. */
export async function listAgents(): Promise<
  { agents: { id: string; role: string }[] } | null
> {
  return callAgentic("GET", "/agents");
}

// =====================================================================
// Helpers de alto nível — para uso no stack TS
// =====================================================================

/**
 * Junta a decisão do agente com a consulta de junta médica.
 * Retorna string formatada para inclusão no debate dos 15 PhD.
 */
export async function decideAndExplain(req: DecideRequest): Promise<{
  decisao: DecideResponse | null;
  shap: ShapResponse | null;
  combined_summary: string;
}> {
  const decisao = await decide(req);
  if (!decisao) {
    return {
      decisao: null,
      shap: null,
      combined_summary:
        "[Organismo Agêntico OFFLINE] Decisão baseada apenas em consenso da junta médica de 15 PhD.",
    };
  }

  // SHAP complementar
  const shap = await getShap(req.biomarkers, 0.3, decisao.acao);

  const summary = [
    `🧬 **Organismo Agêntico (Python engine)**`,
    `- Ação recomendada: **${decisao.acao}** (confiança ${(decisao.confianca * 100).toFixed(0)}%)`,
    `- Protocolo NCCN/ASCO: ${decisao.esquema_nccn} (${decisao.classe_terapeutica})`,
    `- Paradigma: ${decisao.paradigma}`,
    `- Reserva orgânica do paciente: ${decisao.reserva_organica}`,
    shap ? `- Driver SHAP principal: **${shap.top_driver}**` : "",
    ``,
    `Esta deliberação será apresentada à junta médica como input complementar.`,
  ]
    .filter(Boolean)
    .join("\n");

  return { decisao, shap, combined_summary: summary };
}

/** Status do bridge para health check do servidor TS. */
export function bridgeStatus(): {
  url: string;
  timeout_ms: number;
  circuit_open: boolean;
  circuit_open_until: number | null;
} {
  return {
    url: AGENTIC_BASE_URL,
    timeout_ms: AGENTIC_TIMEOUT_MS,
    circuit_open: circuit.openUntil > Date.now(),
    circuit_open_until: circuit.openUntil || null,
  };
}
