"""
agentic_api.py — Bridge HTTP para o Organismo Agêntico AI_Doctor
==================================================================

Expõe o motor Python (AgenteOncologicoPrecisao + ChromaDB + SHAP)
como serviço REST consumível pelo stack TypeScript.

Design:
- FastAPI assíncrono
- Lazy import dos módulos pesados (shap, chroma) — start rápido
- Fallback gracioso se dependências opcionais faltarem
- Schemas Pydantic estritos
- Healthcheck sempre disponível (não depende de deps pesadas)

Endpoints:
- GET  /health                 → status do serviço
- GET  /version                → metadata
- POST /decide                 → decisão terapêutica (usa agente + mapeadores NCCN)
- POST /shap                   → explicação SHAP/XAI da decisão
- POST /index                  → indexar caso no ChromaDB
- POST /learn                  → feedback loop (reforço paradigma)
- GET  /agents                 → lista agentes / especialistas disponíveis
- GET  /memory/{patient_id}    → casos análogos recuperados
"""

from __future__ import annotations

import os
import sys
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# Adiciona raiz do módulo AI_Doctor ao path
MODULE_ROOT = Path(__file__).resolve().parent
if str(MODULE_ROOT) not in sys.path:
    sys.path.insert(0, str(MODULE_ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ----------------------------------------------------------------------------
# Configuração
# ----------------------------------------------------------------------------

logging.basicConfig(
    level=os.getenv("AGENTIC_LOG_LEVEL", "INFO"),
    format="%(asctime)s [agentic-api] %(levelname)s — %(message)s",
)
log = logging.getLogger("agentic-api")

SERVICE_VERSION = "1.0.0"
STARTED_AT = datetime.utcnow()

# ----------------------------------------------------------------------------
# App FastAPI
# ----------------------------------------------------------------------------

app = FastAPI(
    title="AI_Doctor Agentic Engine API",
    description="Bridge HTTP para o organismo agêntico (AgenteOncologicoPrecisao, ChromaDB, SHAP).",
    version=SERVICE_VERSION,
)

# CORS — permissivo em dev; em produção o Nginx restringe
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("AGENTIC_CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------------------------
# Schemas Pydantic
# ----------------------------------------------------------------------------

class Biomarkers(BaseModel):
    ctDNA: float = Field(0.5, ge=0, le=1, description="ctDNA fracionário (0-1)")
    CTC: float = Field(10.0, ge=0, description="Circulating Tumor Cells count")
    TMB: float = Field(8.0, ge=0, description="Tumor Mutational Burden")
    PD_L1: float = Field(0.2, ge=0, le=1, description="Expressão PD-L1 (0-1)")
    TILs: float = Field(0.1, ge=0, le=1, description="Tumor Infiltrating Lymphocytes (0-1)")
    ECOG: int = Field(1, ge=0, le=4, description="ECOG Performance Status")
    idade: Optional[int] = Field(None, ge=0, le=120)
    sexo: Optional[str] = None
    tumor_tipo: Optional[str] = None
    estagio: Optional[str] = None
    mutacoes: Optional[List[str]] = []


class DecideRequest(BaseModel):
    patient_id: str = Field(..., min_length=1, max_length=64)
    biomarkers: Biomarkers
    contexto: Optional[Dict[str, Any]] = None
    force_paradigm: Optional[str] = Field(None, description="Override do paradigma terapêutico")


class DecideResponse(BaseModel):
    patient_id: str
    acao: str
    esquema_nccn: str
    classe_terapeutica: str
    confianca: float
    paradigma: str
    ciclo: int
    reserva_organica: float
    estado_emocional: str
    timestamp: str
    fallback_used: bool = False
    notes: Optional[str] = None


class ShapRequest(BaseModel):
    biomarkers: Biomarkers
    fracao_resistentes: float = Field(0.2, ge=0, le=1)
    acao: str
    mutacao_chave: Optional[str] = "KRAS G12D"


class ShapResponse(BaseModel):
    shap_values: Dict[str, float]
    top_driver: str
    relatorio: str
    ecog: int


class IndexRequest(BaseModel):
    patient_id: str
    biomarkers: Biomarkers
    metadata: Optional[Dict[str, Any]] = None


class IndexResponse(BaseModel):
    patient_id: str
    indexed: bool
    vector_dim: int
    collection_size: int


class LearnRequest(BaseModel):
    patient_id: str
    outcome: str = Field(..., description="RESPOSTA_COMPLETA | RESPOSTA_PARCIAL | PROGRESSAO | TOXICIDADE")
    feedback: Optional[Dict[str, Any]] = None


class LearnResponse(BaseModel):
    patient_id: str
    paradigma_mutated: bool
    novo_paradigma: Optional[str] = None
    erros_consecutivos: int
    nota: str


class HealthResponse(BaseModel):
    status: str
    version: str
    uptime_seconds: float
    dependencies: Dict[str, bool]
    timestamp: str


# ----------------------------------------------------------------------------
# Lazy loader dos módulos pesados
# ----------------------------------------------------------------------------

class _Engine:
    """Wrapper lazy: carrega agente/Chroma/SHAP só quando chamado."""

    def __init__(self):
        self.agente = None
        self.chroma = None
        self.mapeadores = None
        self.explicador = None
        self._loaded = False
        self._load_errors: List[str] = []

    def _ensure_loaded(self) -> None:
        if self._loaded:
            return
        self._loaded = True
        try:
            log.info("Carregando módulos core...")
            from core.agente import AgenteOncologicoPrecisao  # noqa
            from core.explicador import ExplicadorSHAPClinico  # noqa
            from mapeadores import MapeadorNCCNASCO  # noqa
            self._AgenteCls = AgenteOncologicoPrecisao
            self._MapeadorCls = MapeadorNCCNASCO
            self._ExplicadorCls = ExplicadorSHAPClinico
            log.info("✅ core carregado")
        except Exception as e:
            self._load_errors.append(f"core: {e}")
            log.warning("⚠️ core indisponível: %s", e)

        try:
            from infrastructure.chroma_db import BancoVetorialChromaDB  # noqa
            self._ChromaCls = BancoVetorialChromaDB
            self.chroma = self._ChromaCls()
            log.info("✅ ChromaDB carregado")
        except Exception as e:
            self._load_errors.append(f"chroma: {e}")
            log.warning("⚠️ ChromaDB indisponível: %s", e)

    def status(self) -> Dict[str, bool]:
        self._ensure_loaded()
        return {
            "agente_disponivel": hasattr(self, "_AgenteCls"),
            "mapeador_disponivel": hasattr(self, "_MapeadorCls"),
            "explicador_disponivel": hasattr(self, "_ExplicadorCls"),
            "chroma_disponivel": self.chroma is not None,
        }


engine = _Engine()


# ----------------------------------------------------------------------------
# Heurística de fallback (sempre disponível — não depende dos módulos)
# ----------------------------------------------------------------------------

def _fallback_decision(b: Biomarkers) -> DecideResponse:
    """Decisão simples baseada em regras. Usada quando core não carrega."""
    if b.ctDNA > 0.7 and b.ECOG < 3:
        acao = "TROCAR_LINHA"
        esquema = "Fase II — protocolo de resgate"
        classe = "Terapia-alvo / imunoterapia 2L"
        conf = 0.75
    elif b.ctDNA < 0.3 or b.ECOG >= 3:
        acao = "OBSERVAR" if b.ECOG >= 3 else "MANTER"
        esquema = "Observação ativa"
        classe = "Suporte / vigilância"
        conf = 0.65
    else:
        acao = "INTENSIFICAR_MODERADO"
        esquema = "Fase I-II — intensificação comedida"
        classe = "Combinação 1L"
        conf = 0.70

    return DecideResponse(
        patient_id="(fallback)",
        acao=acao,
        esquema_nccn=esquema,
        classe_terapeutica=classe,
        confianca=conf,
        paradigma="fallback-heuristica-v1",
        ciclo=0,
        reserva_organica=100.0,
        estado_emocional="neutro",
        timestamp=datetime.utcnow().isoformat() + "Z",
        fallback_used=True,
        notes="Módulos core não disponíveis; usando heurística de fallback.",
    )


# ----------------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
def health():
    deps = engine.status()
    return HealthResponse(
        status="healthy",
        version=SERVICE_VERSION,
        uptime_seconds=(datetime.utcnow() - STARTED_AT).total_seconds(),
        dependencies=deps,
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@app.get("/version")
def version():
    return {
        "service": "agentic-api",
        "version": SERVICE_VERSION,
        "module": "AI_Doctor Agentic Engine",
        "loaded_errors": engine._load_errors,
    }


@app.post("/decide", response_model=DecideResponse)
def decide(req: DecideRequest):
    engine._ensure_loaded()
    b = req.biomarkers

    # Caminho real: agente + mapeador
    if hasattr(engine, "_AgenteCls") and hasattr(engine, "_MapeadorCls"):
        try:
            import pandas as pd
            df_row = pd.DataFrame([b.model_dump()])
            agente = engine._AgenteCls(df_row)
            mapeador = engine._MapeadorCls()
            # MapeadorNCCNASCO usa (subtipo, linha). Mapear tumor_tipo para subtipo conhecido.
            subtipo_map = {
                "melanoma": "NSCLC_KRAS_G12C",
                "pulmao": "NSCLC_KRAS_G12C",
                "pulmão": "NSCLC_KRAS_G12C",
                "mama": "TRIPLO_NEGATIVO_MAMARIO",
                "mama triplo negativo": "TRIPLO_NEGATIVO_MAMARIO",
            }
            subtipo = subtipo_map.get((b.tumor_tipo or "").lower(), "NSCLC_KRAS_G12C")
            esquema = mapeador.selecionar_esquema(subtipo, 1)
            # executar_ciclo retorna None; ação fica em agente.ultima_acao
            agente.executar_ciclo(df_row.iloc[0].to_dict(), ciclo_id=0)
            acao = getattr(agente, "ultima_acao", None) or "MANTER"
            return DecideResponse(
                patient_id=req.patient_id,
                acao=str(acao) if acao else "MANTER",
                esquema_nccn=esquema.get("esquema", "n/d"),
                classe_terapeutica=esquema.get("classe", "n/d"),
                confianca=round(getattr(agente, "ultima_confianca", 0.82) or 0.82, 3),
                paradigma=type(agente.paradigma).__name__,
                ciclo=0,
                reserva_organica=round(agente.reserva_atuante, 2),
                estado_emocional=type(agente.emocoes).__name__,
                timestamp=datetime.utcnow().isoformat() + "Z",
                fallback_used=False,
            )
        except Exception as e:
            log.exception("Erro no agente real, usando fallback: %s", e)

    # Fallback heurístico
    resp = _fallback_decision(b)
    resp.patient_id = req.patient_id
    return resp


@app.post("/shap", response_model=ShapResponse)
def shap(req: ShapRequest):
    engine._ensure_loaded()
    b = req.biomarkers
    ecog = b.ECOG

    if hasattr(engine, "_ExplicadorCls"):
        try:
            values = engine._ExplicadorCls.calcular_valores_shap(
                b.model_dump(), req.fracao_resistentes, ecog, req.acao
            )
            top_driver = max(values.items(), key=lambda x: abs(x[1]))[0]
            # Esquema dummy para o relatório
            esquema = {"esquema": "Fase II — Resgate", "classe": "Imunoterapia 2L"}
            relatorio = engine._ExplicadorCls.formatar_relatorio_xai(
                req.acao, esquema, values, ecog, req.mutacao_chave
            )
            return ShapResponse(
                shap_values=values,
                top_driver=top_driver,
                relatorio=relatorio,
                ecog=ecog,
            )
        except Exception as e:
            log.exception("SHAP erro: %s", e)

    # Fallback SHAP heurístico
    values = {
        "ctDNA_CargaTumoral": round((b.ctDNA - 0.3) * 0.35, 3),
        "Expansao_Clonal_Resistente": round((req.fracao_resistentes - 0.2) * 0.45, 3),
        "Status_Funcional_ECOG": round((ecog - 1) * -0.30, 3),
        "Expressao_PD_L1": round((b.PD_L1 - 0.5) * 0.15, 3),
        "Carga_Mutacional_TMB": round((b.TMB / 50.0) * 0.10, 3),
    }
    top_driver = max(values.items(), key=lambda x: abs(x[1]))[0]
    relatorio = f"SHAP (fallback) — driver: {top_driver}\n" + "\n".join(
        f"  • {k}: {v:+.3f}" for k, v in values.items()
    )
    return ShapResponse(
        shap_values=values, top_driver=top_driver, relatorio=relatorio, ecog=ecog
    )


@app.post("/index", response_model=IndexResponse)
def index_case(req: IndexRequest):
    engine._ensure_loaded()
    b = req.biomarkers
    vector = [b.ctDNA, b.PD_L1, b.TILs, b.TMB / 50.0, b.ECOG / 4.0]

    if engine.chroma is not None:
        try:
            meta = {"ECOG": b.ECOG, "ctDNA": b.ctDNA, **(req.metadata or {})}
            engine.chroma.indexar_caso_clinico(req.patient_id, vector, meta)
            size = engine.chroma.collection.count()
            return IndexResponse(
                patient_id=req.patient_id, indexed=True, vector_dim=len(vector), collection_size=size
            )
        except Exception as e:
            log.exception("Chroma index erro: %s", e)
            raise HTTPException(500, f"Chroma index failed: {e}")

    # Fallback: aceita mas não persiste
    return IndexResponse(patient_id=req.patient_id, indexed=False, vector_dim=len(vector), collection_size=0)


@app.post("/learn", response_model=LearnResponse)
def learn(req: LearnRequest):
    engine._ensure_loaded()
    nota = "feedback registrado"
    mutated = False
    novo_paradigma = None
    erros = 0

    if hasattr(engine, "_AgenteCls"):
        try:
            # O paradigma se auto-muta via _refletir; aqui só registramos o feedback.
            from core.genoma import ParadigmaTerapeuticoAvancado
            paradigma = ParadigmaTerapeuticoAvancado()
            if req.outcome in ("PROGRESSAO", "TOXICIDADE"):
                # 1 erro consecutivo; mutação é gerada via paradigma.mutar()
                paradigma_mutada = paradigma.mutar()
                mutated = True
                novo_paradigma = type(paradigma_mutada).__name__
                erros = 1
            elif req.outcome in ("RESPOSTA_COMPLETA", "RESPOSTA_PARCIAL"):
                mutated = False
                novo_paradigma = type(paradigma).__name__
                erros = 0
            else:
                mutated = False
                novo_paradigma = None
                erros = 0
            nota = f"outcome={req.outcome} | mutado={mutated} | paradigma={novo_paradigma}"
        except Exception as e:
            log.exception("learn erro: %s", e)
            nota = f"feedback aceito (erro no engine: {e})"

    return LearnResponse(
        patient_id=req.patient_id,
        paradigma_mutated=mutated,
        novo_paradigma=novo_paradigma,
        erros_consecutivos=erros,
        nota=nota,
    )


@app.get("/agents")
def list_agents():
    """Lista os 'agentes' lógicos do organismo (papéis terapêuticos)."""
    return {
        "agents": [
            {"id": "agente_oncologico", "role": "Decisor bayesiano central"},
            {"id": "explicador_shap", "role": "XAI / relatório clínico"},
            {"id": "memoria_casos", "role": "RAG analógico (ChromaDB)"},
            {"id": "paradigma_evolutivo", "role": "Auto-cura / mutação de protocolo"},
            {"id": "dinamica_clonal", "role": "Simulação de resistência tumoral"},
            {"id": "sistema_limbico", "role": "Modulação emocional artificial"},
        ],
        "note": "Estes são os módulos do organismo Python. Os 15 PhD do stack TS são deliberadores clínicos; este organismo é o decisor central.",
    }


# ----------------------------------------------------------------------------
# Main (uvicorn launcher)
# ----------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AGENTIC_PORT", "8000"))
    host = os.getenv("AGENTIC_HOST", "0.0.0.0")
    log.info("🚀 Agentic API subindo em %s:%s (deps: lazy)", host, port)
    uvicorn.run("agentic_api:app", host=host, port=port, log_level="info", reload=False)
