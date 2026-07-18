/**
 * server/bridge/agentic_bridge.test.ts
 * =====================================================================
 * Testes de integração do bridge com o organismo agêntico Python.
 * Usa fetch nativo com mock — não exige o serviço Python rodando.
 * =====================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getAgenticHealth,
  decide,
  getShap,
  learn,
  decideAndExplain,
  bridgeStatus,
  type DecideRequest,
} from "./agentic_bridge";

// Mock fetch global
const originalFetch = global.fetch;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  global.fetch = fetchMock as any;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

const baseBiomarkers = {
  ctDNA: 0.65,
  CTC: 12,
  TMB: 8,
  PD_L1: 0.4,
  TILs: 0.15,
  ECOG: 1,
  tumor_tipo: "mama",
  estagio: "III",
};

const decideReq: DecideRequest = {
  patient_id: "P-TEST-01",
  biomarkers: baseBiomarkers,
};

describe("agentic_bridge", () => {
  describe("bridgeStatus", () => {
    it("retorna configuração do bridge", () => {
      const s = bridgeStatus();
      expect(s.url).toBeTruthy();
      expect(s.timeout_ms).toBeGreaterThan(0);
      expect(typeof s.circuit_open).toBe("boolean");
    });
  });

  describe("getAgenticHealth", () => {
    it("retorna status quando Python disponível", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "healthy",
          version: "1.0.0",
          uptime_seconds: 100,
          dependencies: { agente_disponivel: true, mapeador_disponivel: true },
          timestamp: "2026-01-01T00:00:00Z",
        }),
      });
      const h = await getAgenticHealth();
      expect(h?.status).toBe("healthy");
      expect(h?.dependencies.agente_disponivel).toBe(true);
    });

    it("retorna null quando Python offline", async () => {
      fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
      const h = await getAgenticHealth();
      expect(h).toBeNull();
    });
  });

  describe("decide", () => {
    it("encaminha biomarkers e retorna decisão", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          patient_id: "P-TEST-01",
          acao: "TROCAR_LINHA",
          esquema_nccn: "Pembrolizumabe + Paclitaxel Nab",
          classe_terapeutica: "Imunoterapia + Quimio",
          confianca: 0.85,
          paradigma: "ParadigmaTerapeuticoAvancado",
          ciclo: 0,
          reserva_organica: 100.0,
          estado_emocional: "EstadoEmocionalPaciente",
          timestamp: "2026-01-01T00:00:00Z",
          fallback_used: false,
          notes: null,
        }),
      });
      const d = await decide(decideReq);
      expect(d?.acao).toBe("TROCAR_LINHA");
      expect(d?.confianca).toBeCloseTo(0.85);
      // Verifica payload enviado
      const call = fetchMock.mock.calls[0];
      expect(call[0]).toContain("/decide");
      expect(call[1].method).toBe("POST");
      const body = JSON.parse(call[1].body);
      expect(body.patient_id).toBe("P-TEST-01");
      expect(body.biomarkers.tumor_tipo).toBe("mama");
    });

    it("retorna null em HTTP 500", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "internal error",
      });
      const d = await decide(decideReq);
      expect(d).toBeNull();
    });
  });

  describe("getShap", () => {
    it("solicita SHAP com fracao_resistentes e acao", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          shap_values: { ctDNA: 0.2, PD_L1: 0.1 },
          top_driver: "ctDNA",
          relatorio: "mock relatorio",
          ecog: 1,
        }),
      });
      const s = await getShap(baseBiomarkers, 0.3, "MANTER", "BRAF V600E");
      expect(s?.top_driver).toBe("ctDNA");
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.fracao_resistentes).toBe(0.3);
      expect(body.acao).toBe("MANTER");
      expect(body.mutacao_chave).toBe("BRAF V600E");
    });
  });

  describe("learn", () => {
    it("encaminha outcome para auto-cura", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          patient_id: "P-TEST-01",
          paradigma_mutated: true,
          novo_paradigma: "ParadigmaTerapeuticoAvancado",
          erros_consecutivos: 1,
          nota: "outcome=PROGRESSAO",
        }),
      });
      const l = await learn("P-TEST-01", "PROGRESSAO");
      expect(l?.paradigma_mutated).toBe(true);
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.outcome).toBe("PROGRESSAO");
    });
  });

  describe("decideAndExplain", () => {
    it("combina decisão + SHAP em summary", async () => {
      // 1ª chamada: /decide
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          patient_id: "P-X",
          acao: "INTENSIFICAR_MODERADO",
          esquema_nccn: "Fase I-II",
          classe_terapeutica: "Combinação 1L",
          confianca: 0.78,
          paradigma: "P",
          ciclo: 0,
          reserva_organica: 95,
          estado_emocional: "E",
          timestamp: "2026",
          fallback_used: false,
          notes: null,
        }),
      });
      // 2ª chamada: /shap
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          shap_values: {},
          top_driver: "ctDNA_CargaTumoral",
          relatorio: "r",
          ecog: 1,
        }),
      });
      const r = await decideAndExplain(decideReq);
      expect(r.decisao?.acao).toBe("INTENSIFICAR_MODERADO");
      expect(r.shap?.top_driver).toBe("ctDNA_CargaTumoral");
      expect(r.combined_summary).toContain("INTENSIFICAR_MODERADO");
      expect(r.combined_summary).toContain("ctDNA_CargaTumoral");
      expect(r.combined_summary).toContain("78%");
    });

    it("retorna summary offline quando Python cai", async () => {
      fetchMock.mockRejectedValue(new Error("ECONNREFUSED"));
      const r = await decideAndExplain(decideReq);
      expect(r.decisao).toBeNull();
      expect(r.shap).toBeNull();
      expect(r.combined_summary).toContain("OFFLINE");
    });
  });

  describe("circuit breaker", () => {
    it("abre após 3 falhas consecutivas", async () => {
      fetchMock.mockRejectedValue(new Error("down"));
      // 3 falhas
      await getAgenticHealth();
      await getAgenticHealth();
      await getAgenticHealth();
      // 4ª chamada deve ser cortada pelo circuit (não bate no fetch)
      const callsBefore = fetchMock.mock.calls.length;
      const h = await getAgenticHealth();
      expect(h).toBeNull();
      expect(fetchMock.mock.calls.length).toBe(callsBefore);
      expect(bridgeStatus().circuit_open).toBe(true);
    });
  });
});
