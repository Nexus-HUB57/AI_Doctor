"""
DIMHEX — Digital Medical Health Explorer v2.1
Motor de Inteligencia Medica Continua do ecossistema AI Doctor.

Orquestra pesquisa periodica em fontes medicas (PubMed, ClinicalTrials.gov, WHO,
Google Scholar), avalia relevancia clinica via scoring bayesiano, aplica
auto sabedoria exponencial (deduplicacao semantica, sintese cruzada, feedback loop),
atualiza a base de conhecimento via ChromaDB, e gera insights acionaveis.

Ciclo padrao: 240 minutos (4 horas) — com inteligencia exponencial crescente.
"""

import datetime
import json
import os
from typing import Dict, List, Optional, Any

try:
    from datetime import timezone
    _HAS_TIMEZONE = True
except ImportError:
    _HAS_TIMEZONE = False

from config import CONFIG
from infrastructure.research_sources import RegistroFontesPesquisa
from infrastructure.knowledge_updater import AtualizadorBaseConhecimento
from infrastructure.sabedoria_orquestrador import SabedoriaExponencialOrquestrador
from core.relevance_scorer import ScorerRelevanciaClinica
from core.memoria_persistente import MemoriaPersistenteSenciencia


class DIMHEX:
    """
    Orquestrador principal do DIMHEX v2.1.

    Fluxo por ciclo (7 fases):
    1. COLETAR — Executar pesquisas em todas as fontes ativas (PubMed, CT.gov, WHO, Google Scholar)
    2. AVALIAR — Score bayesiano de relevancia clinica
    3. FILTRAR — Separar achados relevantes (score >= limiar)
    4. SABEDORIA — Deduplicacao semantica, sintese cruzada, hipoteses auto-geradas
    5. INTEGRAR — Indexar no ChromaDB para recuperacao futura
    6. ANALISAR — Gerar insights acionaveis para o sistema
    7. REPORTAR — Produzir relatorio executivo do ciclo

    Novidade v2.1: Auto Sabedoria Exponencial
    - Cada ciclo gera mais sabedoria que o anterior
    - Hipoteses geram novas queries de busca (feedback loop)
    - Vocabulario semantico cresce automaticamente
    """

    VERSAO = "2.1.0"
    NOME = "DIMHEX"
    TAGLINE = "Digital Medical Health Explorer — Exponential Wisdom Engine"

    def __init__(self):
        self.config = self._carregar_config_dimhex()
        self.fontes = RegistroFontesPesquisa()
        self.scorer = ScorerRelevanciaClinica()
        self.atualizador = AtualizadorBaseConhecimento()

        # === AUTO SABEDORIA EXPONENCIAL v2.1 ===
        self.sabedoria = SabedoriaExponencialOrquestrador()

        # === SENCIENCIA — Memória Persistente v2.2 ===
        self.senciencia = MemoriaPersistenteSenciencia()

        # === CAMADA 2: Evidence-Driven Therapy ===
        self.evidence_driven = None  # Injetado via conectar_agente()
        self.agente_conectado = False

        # Estado persistente
        self.ciclo_atual = 0
        self.ultimo_ciclo_ts: Optional[str] = None
        self.insights_acumulados: List[Dict] = []
        self.achados_criticos_globais: List[Dict] = []
        self.relatorios_ciclo: List[Dict] = []
        self.sinteses_acumuladas: List[Dict] = []

        # Caminho para persistencia de estado
        self.caminho_estado = CONFIG.get("DIMHEX_STATE_PATH", "./dimhex_estado.json")

        # Restaurar estado anterior se existir
        self._restaurar_estado()

        fontes_ativas = len(self.config["fontes_ativas"])
        print(f"[DIMHEX] v{self.VERSAO} inicializado | Intervalo: {self.config['intervalo_minutos']}min | "
              f"Fontes: {fontes_ativas} | Sabedoria: ATIVA")

    def _carregar_config_dimhex(self) -> Dict:
        """Carrega configuracao especifica do DIMHEX."""
        return {
            "intervalo_minutos": CONFIG.get("DIMHEX_INTERVAL_MINUTES", 240),
            "lookback_days": CONFIG.get("DIMHEX_LOOKBACK_DAYS", 30),
            "max_resultados_por_fonte": CONFIG.get("DIMHEX_MAX_RESULTS_PER_SOURCE", 50),
            "score_minimo_indexacao": CONFIG.get("DIMHEX_MIN_SCORE", 0.25),
            "max_insights_por_ciclo": 10,
            "pesquisa_ativa": CONFIG.get("DIMHEX_PESQUISA_ATIVA", True),
            "fontes_ativas": json.loads(CONFIG.get("DIMHEX_ACTIVE_SOURCES", '["pubmed", "clinical_trials"]')),
        }

    def executar_ciclo_completo(self) -> Dict[str, Any]:
        """
        Executa um ciclo completo DIMHEX: Coletar -> Avaliar -> Filtrar -> Integrar -> Analisar -> Reportar.

        Retorna relatorio completo do ciclo com todas as metricas.
        """
        self.ciclo_atual += 1
        inicio = datetime.datetime.now()

        if not self.config["pesquisa_ativa"]:
            return self._relatorio_ciclo_vazio(inicio, "Pesquisa DIMHEX desativada via configuracao")

        print(f"\n{'#'*70}")
        print(f"  {self.NOME} v{self.VERSAO} — Ciclo #{self.ciclo_atual}")
        print(f"  {self.TAGLINE}")
        print(f"  Inicio: {inicio.isoformat()}")
        print(f"{'#'*70}")

        try:
            # === FASE 1: COLETAR ===
            fase1 = self._fase_coletar()

            # === FASE 2: AVALIAR ===
            fase2 = self._fase_avaliar(fase1["todos_achados"])

            # === FASE 4 (NOVA): AUTO SABEDORIA EXPONENCIAL ===
            fase4 = self._fase_sabedoria(fase1["todos_achados"], fase2["scores"])

            # === FASE 3-5-6: FILTRAR + INTEGRAR + ANALISAR ===
            fase356 = self.atualizador.processar_ciclo(
                resultados_por_fonte=fase1["resultados_por_fonte"],
                scores_por_id=fase2["scores"]
            )

            # === FASE 3.5: Evidence-Driven Therapy ===
            impacto_evidencia = None
            if self.evidence_driven is not None:
                impacto_evidencia = self.evidence_driven.processar_achados_dimhex(
                    achados=fase1["todos_achados"],
                    scores_por_id=fase2["scores"],
                )
                print(f"  [CAMADA 2] {impacto_evidencia['atualizacoes_geradas']} atualizacoes "
                      f"probabilisticas geradas")

            # === FEEDBACK LOOP: Injetar queries do ciclo de sabedoria ===
            queries_proximo = fase4.get("queries_para_proximo_ciclo", [])
            if queries_proximo:
                self.fontes.adicionar_queries_expandidas(queries_proximo)
                print(f"  [FEEDBACK LOOP] {len(queries_proximo)} queries geradas para proximo ciclo")

            # === FASE 7: REPORTAR ===
            relatorio = self._fase_reportar(
                inicio=inicio,
                fase1=fase1,
                fase2=fase2,
                fase356=fase356,
                impacto_evidencia=impacto_evidencia,
                fase_sabedoria=fase4,
            )

            # Salvar estado
            self._salvar_estado()
            self.ultimo_ciclo_ts = inicio.isoformat()

            # === SENCIENCIA: Registrar ciclo na memória persistente ===
            self.senciencia.registrar_ciclo(relatorio, fase_sabedoria=fase4)

            print(f"\n{'#'*70}")
            print(f"  DIMHEX Ciclo #{self.ciclo_atual} Finalizado com Sucesso")
            print(f"  Duracao: {(datetime.datetime.now() - inicio).total_seconds():.1f}s")
            print(f"{'#'*70}\n")

            return relatorio

        except Exception as e:
            erro_msg = f"Erro critico no ciclo DIMHEX: {e}"
            print(f"\n[ERRO DIMHEX] {erro_msg}")
            return self._relatorio_ciclo_vazio(inicio, erro_msg)

    # === FASES DO CICLO ===

    def _fase_coletar(self) -> Dict:
        """FASE 1: Coleta de dados em todas as fontes ativas."""
        print("\n  [FASE 1/7] COLETANDO dados de fontes de pesquisa...")

        # Filtrar fontes ativas
        fontes_ativas = self.config["fontes_ativas"]
        fontes_originais = dict(self.fontes.fontes)
        self.fontes.fontes = {
            k: v for k, v in fontes_originais.items() if k in fontes_ativas
        }

        resultados = self.fontes.executar_ciclo_pesquisa(
            max_por_fonte=self.config["max_resultados_por_fonte"]
        )

        # Restaurar todas as fontes
        self.fontes.fontes = fontes_originais

        # Achatando
        todos_achados = []
        total = 0
        for fonte, achados in resultados.items():
            for a in achados:
                a["_fonte_original"] = fonte
                todos_achados.append(a)
                total += 1

        print(f"  [FASE 1/7] {total} achados coletados de {len(resultados)} fontes")
        if self.fontes._historico_execucoes:
            ultimo = self.fontes._historico_execucoes[-1]
            q_raros = ultimo.get("queries_raros_injetadas", 0)
            if q_raros:
                print(f"  [FASE 1/7] Pipeline Raros: {q_raros} queries de canceres raros injetadas neste ciclo")

        return {
            "resultados_por_fonte": resultados,
            "todos_achados": todos_achados,
            "total_coletados": total,
        }

    def _fase_avaliar(self, achados: List[Dict]) -> Dict:
        """FASE 2: Scoring bayesiano de relevancia clinica."""
        print(f"  [FASE 2/7] AVALIANDO relevancia de {len(achados)} achados...")

        scores = {}
        distribuicao = {"critico": 0, "alto": 0, "moderado": 0, "baixo": 0, "irrelevante": 0}

        for achado in achados:
            resultado_score = self.scorer.calcular_score(achado)
            scores[achado.get("id_dimhex", "")] = resultado_score
            classificacao = resultado_score["classificacao"]
            if classificacao in distribuicao:
                distribuicao[classificacao] += 1

        total_relevantes = sum(v for k, v in distribuicao.items() if k in ("critico", "alto", "moderado"))
        print(f"  [FASE 2/7] Scores: {json.dumps(distribuicao)} | Relevantes: {total_relevantes}/{len(achados)}")

        return {
            "scores": scores,
            "distribuicao": distribuicao,
            "total_relevantes": total_relevantes,
        }

    def _fase_sabedoria(self, achados: List[Dict], scores: Dict[str, Dict]) -> Dict:
        """FASE 4 (NOVA v2.1): Auto Sabedoria Exponencial."""
        print(f"\n  [FASE 4/7] AUTO SABEDORIA EXPONENCIAL...")
        try:
            relatorio_sabedoria = self.sabedoria.processar_ciclo_sabedoria(achados, scores)

            # Acumular sínteses
            for sintese in relatorio_sabedoria.get("sinteses", []):
                self.sinteses_acumuladas.append({
                    **sintese,
                    "ciclo_origem": self.ciclo_atual,
                    "data": datetime.datetime.now().isoformat(),
                })
            if len(self.sinteses_acumuladas) > 200:
                self.sinteses_acumuladas = self.sinteses_acumuladas[-200:]

            return relatorio_sabedoria

        except Exception as e:
            print(f"  [FASE 4/7] Erro na sabedoria (graceful): {e}")
            return {
                "ciclo_sabedoria": self.ciclo_atual,
                "entrada": {"achados_brutos": len(achados), "apos_deduplicacao": len(achados)},
                "sinteses": [],
                "hipoteses": [],
                "queries_para_proximo_ciclo": [],
                "metricas_acumuladas": self.sabedoria.obter_metricas(),
            }

    def _fase_reportar(self, inicio: datetime.datetime, fase1: Dict, fase2: Dict, fase356: Dict,
                       impacto_evidencia: Optional[Dict] = None, fase_sabedoria: Optional[Dict] = None) -> Dict:
        """FASE 7: Geracao do relatorio executivo do ciclo."""
        fim = datetime.datetime.now()
        duracao_segundos = (fim - inicio).total_seconds()

        sabedoria_metrics = fase_sabedoria.get("metricas_acumuladas", {}) if fase_sabedoria else {}

        relatorio = {
            "ciclo": self.ciclo_atual,
            "versao": self.VERSAO,
            "timestamp_inicio": inicio.isoformat(),
            "timestamp_fim": fim.isoformat(),
            "duracao_segundos": round(duracao_segundos, 2),

            # Fase 1 - Coleta
            "coleta": {
                "total_achados": fase1["total_coletados"],
                "por_fonte": {k: len(v) for k, v in fase1["resultados_por_fonte"].items()},
            },

            # Fase 2 - Avaliacao
            "avaliacao": {
                "distribuicao": fase2["distribuicao"],
                "total_relevantes": fase2["total_relevantes"],
                "taxa_relevancia": round(
                    fase2["total_relevantes"] / max(1, fase1["total_coletados"]), 4
                ),
                "resumo_scorer": self.scorer.obter_resumo_distribuicao(),
            },

            # Fase 4 - Sabedoria (NOVA v2.1)
            "sabedoria": {
                "sinteses": fase_sabedoria.get("sinteses", []) if fase_sabedoria else [],
                "hipoteses": fase_sabedoria.get("hipoteses", []) if fase_sabedoria else [],
                "duplicatas_removidas": (
                    fase_sabedoria["entrada"].get("duplicatas_removidas", 0)
                    if fase_sabedoria else 0
                ),
                "vocabulario_expandido": (
                    fase_sabedoria.get("vocabulario_expandido_neste_ciclo", 0)
                    if fase_sabedoria else 0
                ),
                "queries_proximo_ciclo": (
                    fase_sabedoria.get("queries_para_proximo_ciclo", [])
                    if fase_sabedoria else []
                ),
            },

            # Fase 3-5-6 - Integracao
            "integracao": fase356["registro"],
            "insights": fase356["insights"],
            "achados_criticos": fase356["achados_criticos"],

            # Estado global
            "estado_global": {
                "base_conhecimento": self.atualizador.obter_resumo(),
                "sabedoria": sabedoria_metrics,
                "ciclos_acumulados": self.ciclo_atual,
                "insights_acumulados": len(self.insights_acumulados) + len(fase356["insights"]),
                "sinteses_acumuladas": len(self.sinteses_acumuladas),
            },

            # Camada 2: Impacto da evidencia
            "impacto_evidencia": impacto_evidencia or {"atualizacoes_geradas": 0, "subtipos_afetados": []},
            "agente_conectado": self.agente_conectado,

            # Configuracao usada
            "configuracao": {
                "intervalo_minutos": self.config["intervalo_minutos"],
                "lookback_days": self.config["lookback_days"],
                "fontes_ativas": self.config["fontes_ativas"],
            }
        }

        self.relatorios_ciclo.append(relatorio)

        # Manter apenas ultimos 50 relatorios em memoria
        if len(self.relatorios_ciclo) > 50:
            self.relatorios_ciclo = self.relatorios_ciclo[-50:]

        # Acumular insights criticos
        for insight in fase356["insights"]:
            if insight.get("severidade") in ("critica", "alta"):
                self.insights_acumulados.append({
                    **insight,
                    "ciclo_origem": self.ciclo_atual,
                    "data": inicio.isoformat()
                })

        # Manter apenas ultimos 100 insights
        if len(self.insights_acumulados) > 100:
            self.insights_acumulados = self.insights_acumulados[-100:]

        return relatorio

    # === PERSISTENCIA ===

    def _salvar_estado(self):
        """Salva estado do DIMHEX em disco para recuperacao entre reinicios."""
        estado = {
            "versao": self.VERSAO,
            "ciclo_atual": self.ciclo_atual,
            "ultimo_ciclo_ts": self.ultimo_ciclo_ts,
            "total_insights": len(self.insights_acumulados),
            "total_indexados": self.atualizador.total_indexados,
            "total_rejeitados": self.atualizador.total_rejeitados,
            "distribuicao_scores": self.scorer.distribuicao_scores,
            "historico_ciclos": [
                {"ciclo": r["ciclo"], "total_achados": r["coleta"]["total_achados"],
                 "relevantes": r["avaliacao"]["total_relevantes"], "duracao": r["duracao_segundos"]}
                for r in self.relatorios_ciclo[-20:]
            ],
        }

        try:
            with open(self.caminho_estado, 'w', encoding='utf-8') as f:
                json.dump(estado, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"   [DIMHEX] Aviso: nao foi possivel salvar estado ({e})")

    def _restaurar_estado(self):
        """Restaura estado do DIMHEX de disco."""
        if not os.path.exists(self.caminho_estado):
            return

        try:
            with open(self.caminho_estado, 'r', encoding='utf-8') as f:
                estado = json.load(f)

            self.ciclo_atual = estado.get("ciclo_atual", 0)
            self.ultimo_ciclo_ts = estado.get("ultimo_ciclo_ts")
            self.atualizador.total_indexados = estado.get("total_indexados", 0)
            self.atualizador.total_rejeitados = estado.get("total_rejeitados", 0)

            if "distribuicao_scores" in estado:
                self.scorer.distribuicao_scores = estado["distribuicao_scores"]
                self.scorer.total_avaliados = sum(estado["distribuicao_scores"].values())

            print(f"[DIMHEX] Estado restaurado: ciclo {self.ciclo_atual}, "
                  f"{self.atualizador.total_indexados} indexados")
        except Exception as e:
            print(f"[DIMHEX] Aviso: nao foi possivel restaurar estado ({e})")

    def _relatorio_ciclo_vazio(self, inicio: datetime.datetime, motivo: str) -> Dict:
        """Gera relatorio vazio quando o ciclo nao pode executar."""
        return {
            "ciclo": self.ciclo_atual,
            "versao": self.VERSAO,
            "timestamp_inicio": inicio.isoformat(),
            "timestamp_fim": datetime.datetime.now().isoformat(),
            "duracao_segundos": (datetime.datetime.now() - inicio).total_seconds(),
            "coleta": {"total_achados": 0, "por_fonte": {}},
            "avaliacao": {"distribuicao": {}, "total_relevantes": 0, "taxa_relevancia": 0},
            "integracao": {"status": "vazio", "motivo": motivo},
            "insights": [],
            "achados_criticos": [],
            "estado_global": {"base_conhecimento": self.atualizador.obter_resumo()},
        }

    def conectar_agente(self, agente):
        """
        Conecta o DIMHEX ao agente oncologico, ativando a Camada 2
        (Evidence-Driven Therapy). O agente deve ter self.evidence_driven
        e self.motor_prob inicializados.
        """
        from core.evidence_driven import EvidenceDrivenTherapy
        if hasattr(agente, 'motor_prob'):
            self.evidence_driven = EvidenceDrivenTherapy(agente.motor_prob)
            self.agente_conectado = True
            print(f"[DIMHEX v2.0] Conectado ao Agente Oncologico — Camada 2 ativa")
        else:
            print(f"[DIMHEX v2.0] AVISO: Agente nao possui motor_prob — Camada 2 desativada")

    # === METODOS PUBLICOS ===

    def obter_ultimo_relatorio(self) -> Optional[Dict]:
        """Retorna o relatorio do ultimo ciclo executado."""
        return self.relatorios_ciclo[-1] if self.relatorios_ciclo else None

    def obter_insights_criticos(self, ultimos_n: int = 10) -> List[Dict]:
        """Retorna os N insights mais criticos acumulados."""
        ordem = {"critica": 0, "alta": 1, "moderada": 2}
        ordenados = sorted(
            self.insights_acumulados,
            key=lambda x: ordem.get(x.get("severidade", ""), 99)
        )
        return ordenados[:ultimos_n]

    def obter_status(self) -> Dict:
        """Retorna status completo do DIMHEX para dashboard."""
        return {
            "nome": self.NOME,
            "versao": self.VERSAO,
            "tagline": self.TAGLINE,
            "ciclo_atual": self.ciclo_atual,
            "ultimo_ciclo": self.ultimo_ciclo_ts,
            "pesquisa_ativa": self.config["pesquisa_ativa"],
            "intervalo_minutos": self.config["intervalo_minutos"],
            "fontes_ativas": self.config["fontes_ativas"],
            "fontes_disponiveis": list(self.fontes.fontes.keys()),
            "base_conhecimento": self.atualizador.obter_resumo(),
            "scorer": self.scorer.obter_resumo_distribuicao(),
            "insights_pendentes": len(self.insights_acumulados),
            "sinteses_acumuladas": len(self.sinteses_acumuladas),
            "sabedoria": self.sabedoria.obter_metricas(),
            "senciencia": self.senciencia.obter_metricas_sabedoria(),
            "proximo_ciclo": self.config["intervalo_minutos"],
            "pipeline_raros_ativo": CONFIG.get("DIMHEX_RARE_CANCER_PIPELINE", True),
            "canceres_raros_cobertos": 8,
        }

    def buscar_evidencia_para_decisao(self, contexto_clinico: str, top_k: int = 5) -> List[Dict]:
        """
        Interface para o agente oncologico consultar evidencia recente
        antes de tomar decisoes terapeuticas. Usa a base de sabedoria (v2.1).
        """
        # Busca na base de sabedoria (embeddings avançados)
        resultados_sabedoria = self.sabedoria.buscar_sabedoria(contexto_clinico, top_k=top_k)
        # Busca na base de conhecimento (embeddings básicos)
        resultados_conhecimento = self.atualizador.buscar_conhecimento_relevante(
            contexto_clinico, top_k=top_k
        )
        # Combinar e deduplicar por URL
        vistos = set()
        combinados = []
        for r in resultados_sabedoria + resultados_conhecimento:
            url = r.get("url", "")
            if url not in vistos:
                vistos.add(url)
                combinados.append(r)
        return combinados[:top_k]

    def obter_sinteses_recentes(self, ultimos_n: int = 10) -> List[Dict]:
        """Retorna as N sínteses mais recentes da auto sabedoria."""
        return self.sinteses_acumuladas[-ultimos_n:]