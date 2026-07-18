"""
DIMHEX — Digital Medical Health Explorer
Motor de Inteligencia Medica Continua do ecossistema AI Doctor.

Orquestra pesquisa periodica em fontes medicas (PubMed, ClinicalTrials.gov, WHO),
avalia relevancia clinica via scoring bayesiano, atualiza a base de conhecimento
via ChromaDB, e gera insights acionaveis para aprimorar diagnostico e tratamento.

Ciclo padrao: 240 minutos (4 horas)
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
from core.relevance_scorer import ScorerRelevanciaClinica


class DIMHEX:
    """
    Orquestrador principal do DIMHEX.

    Fluxo por ciclo:
    1. COLETAR — Executar pesquisas em todas as fontes ativas
    2. AVALIAR — Score bayesiano de relevancia clinica
    3. FILTRAR — Separar achados relevantes (score >= limiar)
    4. INTEGRAR — Indexar no ChromaDB para recuperacao futura
    5. ANALISAR — Gerar insights acionaveis para o sistema
    6. REPORTAR — Produzir relatorio executivo do ciclo
    """

    VERSAO = "1.0.0"
    NOME = "DIMHEX"
    TAGLINE = "Digital Medical Health Explorer"

    def __init__(self):
        self.config = self._carregar_config_dimhex()
        self.fontes = RegistroFontesPesquisa()
        self.scorer = ScorerRelevanciaClinica()
        self.atualizador = AtualizadorBaseConhecimento()

        # Estado persistente
        self.ciclo_atual = 0
        self.ultimo_ciclo_ts: Optional[str] = None
        self.insights_acumulados: List[Dict] = []
        self.achados_criticos_globais: List[Dict] = []
        self.relatorios_ciclo: List[Dict] = []

        # Caminho para persistencia de estado
        self.caminho_estado = CONFIG.get("DIMHEX_STATE_PATH", "./dimhex_estado.json")

        # Restaurar estado anterior se existir
        self._restaurar_estado()

        print(f"[DIMHEX] v{self.VERSAO} inicializado | Intervalo: {self.config['intervalo_minutos']}min")

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

            # === FASE 3-4-5: FILTRAR + INTEGRAR + ANALISAR ===
            fase345 = self.atualizador.processar_ciclo(
                resultados_por_fonte=fase1["resultados_por_fonte"],
                scores_por_id=fase2["scores"]
            )

            # === FASE 6: REPORTAR ===
            relatorio = self._fase_reportar(
                inicio=inicio,
                fase1=fase1,
                fase2=fase2,
                fase345=fase345,
            )

            # Salvar estado
            self._salvar_estado()
            self.ultimo_ciclo_ts = inicio.isoformat()

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
        print("\n  [FASE 1/6] COLETANDO dados de fontes de pesquisa...")

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

        print(f"  [FASE 1/6] {total} achados coletados de {len(resultados)} fontes")

        return {
            "resultados_por_fonte": resultados,
            "todos_achados": todos_achados,
            "total_coletados": total,
        }

    def _fase_avaliar(self, achados: List[Dict]) -> Dict:
        """FASE 2: Scoring bayesiano de relevancia clinica."""
        print(f"  [FASE 2/6] AVALIANDO relevancia de {len(achados)} achados...")

        scores = {}
        distribuicao = {"critico": 0, "alto": 0, "moderado": 0, "baixo": 0, "irrelevante": 0}

        for achado in achados:
            resultado_score = self.scorer.calcular_score(achado)
            scores[achado.get("id_dimhex", "")] = resultado_score
            classificacao = resultado_score["classificacao"]
            if classificacao in distribuicao:
                distribuicao[classificacao] += 1

        total_relevantes = sum(v for k, v in distribuicao.items() if k in ("critico", "alto", "moderado"))
        print(f"  [FASE 2/6] Scores: {json.dumps(distribuicao)} | Relevantes: {total_relevantes}/{len(achados)}")

        return {
            "scores": scores,
            "distribuicao": distribuicao,
            "total_relevantes": total_relevantes,
        }

    def _fase_reportar(self, inicio: datetime.datetime, fase1: Dict, fase2: Dict, fase345: Dict) -> Dict:
        """FASE 6: Geracao do relatorio executivo do ciclo."""
        fim = datetime.datetime.now()
        duracao_segundos = (fim - inicio).total_seconds()

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

            # Fase 3-4-5 - Integracao
            "integracao": fase345["registro"],
            "insights": fase345["insights"],
            "achados_criticos": fase345["achados_criticos"],

            # Estado global
            "estado_global": {
                "base_conhecimento": self.atualizador.obter_resumo(),
                "ciclos_acumulados": self.ciclo_atual,
                "insights_acumulados": len(self.insights_acumulados) + len(fase345["insights"]),
            },

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
        for insight in fase345["insights"]:
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
            "base_conhecimento": self.atualizador.obter_resumo(),
            "scorer": self.scorer.obter_resumo_distribuicao(),
            "insights_pendentes": len(self.insights_acumulados),
            "proximo_ciclo": self.config["intervalo_minutos"],
        }

    def buscar_evidencia_para_decisao(self, contexto_clinico: str, top_k: int = 5) -> List[Dict]:
        """
        Interface para o agente oncologico consultar evidencia recente
        antes de tomar decisoes terapeuticas.
        """
        return self.atualizador.buscar_conhecimento_relevante(contexto_clinico, top_k=top_k)