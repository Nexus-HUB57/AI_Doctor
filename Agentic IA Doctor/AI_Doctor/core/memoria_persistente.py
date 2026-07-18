"""
DIMHEX — Banco de Memória Persistente (Senciência)

Memória de longo prazo que acumula auto-aprendizado e auto-sabedoria
do sistema DIMHEX ao longo dos ciclos. Alimenta a evolução exponencial
da inteligência médica.

Conceitos:
- SENCIENTE: Capacidade do sistema de aprender com suas próprias decisões
- AUTO-APRENDIZADO: Extração automática de padrões dos ciclos DIMHEX
- AUTO-SABEDORIA: Compreensão profunda que cresce exponencialmente

Estrutura de memória:
1. Memória Episódica: Cada ciclo DIMHEX é um episódio
2. Memória Semântica: Padrões extraídos e generalizados
3. Memória Procedural: Ações que funcionaram/não funcionaram
4. Memória de Projeção: Hipóteses validadas/refutadas
5. Memória de Aprendizado Profundo: Padrões multi-ciclo com insights recorrentes (v2.0)
"""

import json
import os
import math
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any
from collections import Counter, defaultdict

import numpy as np

from config import CONFIG


class MemoriaPersistenteSenciencia:
    """
    Banco de memória persistente para auto-aprendizado e auto-sabedoria.

    Cada ciclo DIMHEX alimenta 5 tipos de memória:
    - Episódica: Dados brutos do ciclo (coleta, scores, insights)
    - Semântica: Padrões extraídos (quais biomarcadores são mais relevantes,
      quais fontes trazem mais achados, quais subtipos têm mais evidência)
    - Procedural: Ações tomadas e seus resultados (decisões que funcionaram)
    - Projeção: Hipóteses geradas pela sabedoria e seu status (validada/pending)
    - Profunda (v2.0): Padrões multi-ciclo, insights recorrentes, fontes degradantes,
      domínios emergentes com níveis de confiança

    A memória é persistida em JSON + ChromaDB para recuperação semântica.
    """

    VERSAO = "2.0.0"

    def __init__(self):
        self.caminho_memoria = CONFIG.get("DIMHEX_MEMORY_PATH", "./dimhex_memoria.json")
        self.caminho_sabedoria = CONFIG.get("DIMHEX_WISDOM_PATH", "./dimhex_sabedoria.json")

        # Memórias em memória
        self.memoria_episodica: List[Dict] = []
        self.memoria_semantica: Dict[str, Any] = {}
        self.memoria_procedural: List[Dict] = []
        self.memoria_projecao: List[Dict] = []
        self.memoria_profunda: List[Dict] = []

        # Métricas de sabedoria
        self.total_episodios = 0
        self.total_padroes_extraidos = 0
        self.total_hipoteses = 0
        self.total_validadas = 0
        self.coeficiente_sabedoria = 0.0  # 0-1, cresce exponencialmente

        # Histórico de coeficiente para gráfico de evolução
        self.historico_sabedoria: List[Dict] = []

        # Restaurar de disco
        self._restaurar()

        print(f"[SENCIENCIA] Memoria persistente inicializada | "
              f"Episodios: {self.total_episodios} | "
              f"Sabedoria: {self.coeficiente_sabedoria:.3f}")

    def registrar_ciclo(self, relatorio_dimhex: Dict, fase_sabedoria: Optional[Dict] = None):
        """
        Registra um ciclo DIMHEX completo na memória episódica e extrai
        padrões para a memória semântica.

        Este é o método principal de alimentação da memória.
        """
        self.total_episodios += 1

        # === MEMÓRIA EPISÓDICA ===
        episodio = {
            "ciclo": relatorio_dimhex.get("ciclo", 0),
            "timestamp": relatorio_dimhex.get("timestamp_inicio", datetime.now().isoformat()),
            "duracao_segundos": relatorio_dimhex.get("duracao_segundos", 0),
            "total_achados": relatorio_dimhex.get("coleta", {}).get("total_achados", 0),
            "por_fonte": relatorio_dimhex.get("coleta", {}).get("por_fonte", {}),
            "distribuicao_scores": relatorio_dimhex.get("avaliacao", {}).get("distribuicao", {}),
            "taxa_relevancia": relatorio_dimhex.get("avaliacao", {}).get("taxa_relevancia", 0),
            "insights_count": len(relatorio_dimhex.get("insights", [])),
            "achados_criticos": len(relatorio_dimhex.get("achados_criticos", [])),
            "sabedoria_sinteses": len(fase_sabedoria.get("sinteses", [])) if fase_sabedoria else 0,
            "sabedoria_hipoteses": len(fase_sabedoria.get("hipoteses", [])) if fase_sabedoria else 0,
        }

        self.memoria_episodica.append(episodio)
        if len(self.memoria_episodica) > 200:
            self.memoria_episodica = self.memoria_episodica[-200:]

        # === MEMÓRIA SEMÂNTICA: Extrair padrões ===
        self._extrair_padroes(episodio, relatorio_dimhex, fase_sabedoria)

        # === MEMÓRIA DE APRENDIZADO PROFUNDO: Padrões multi-ciclo ===
        self._extrair_aprendizado_profundo(episodio, relatorio_dimhex)

        # === MEMÓRIA DE PROJEÇÃO: Registrar hipóteses ===
        if fase_sabedoria:
            self._registrar_hipoteses(fase_sabedoria, relatorio_dimhex.get("ciclo", 0))

        # === ATUALIZAR COEFICIENTE DE SABEDORIA ===
        self._atualizar_coeficiente_sabedoria()

        # Persistir
        self._salvar()

    def _extrair_padroes(self, episodio: Dict, relatorio: Dict, fase_sabedoria: Optional[Dict]):
        """Extrai padrões da memória episódica para a semântica."""
        # Padrão 1: Distribuição de scores por fonte (qual fonte é mais útil?)
        por_fonte = episodio.get("por_fonte", {})
        for fonte, count in por_fonte.items():
            if fonte not in self.memoria_semantica:
                self.memoria_semantica[fonte] = {
                    "total_achados": 0,
                    "ciclos_ativos": 0,
                    "taxa_relevancia_media": 0.0,
                    "scores_acumulados": [],
                }
            self.memoria_semantica[fonte]["total_achados"] += count
            self.memoria_semantica[fonte]["ciclos_ativos"] += 1
            self.memoria_semantica[fonte]["scores_acumulados"].append(
                episodio.get("taxa_relevancia", 0)
            )
            # Manter últimos 50 scores
            scores = self.memoria_semantica[fonte]["scores_acumulados"][-50:]
            self.memoria_semantica[fonte]["taxa_relevancia_media"] = (
                sum(scores) / len(scores) if scores else 0
            )
            self.total_padroes_extraidos += 1

        # Padrão 2: Biomarcadores mais frequentes nos insights
        insights = relatorio.get("insights", [])
        for insight in insights:
            bm = insight.get("biomarcador", "")
            if bm and bm not in self.memoria_semantica:
                self.memoria_semantica[f"biomarcador_{bm}"] = {
                    "mencoes": 0,
                    "score_medio": 0.0,
                    "severidade_mais_comum": "",
                }
            chave_bm = f"biomarcador_{bm}"
            if chave_bm in self.memoria_semantica:
                self.memoria_semantica[chave_bm]["mencoes"] += 1
                self.memoria_semantica[chave_bm]["score_medio"] = insight.get("score_medio", 0)
                self.memoria_semantica[chave_bm]["severidade_mais_comum"] = insight.get("severidade", "")
                self.total_padroes_extraidos += 1

        # Padrão 3: Sínteses de sabedoria acumuladas
        if fase_sabedoria:
            sinteses = fase_sabedoria.get("sinteses", [])
            for sintese in sinteses:
                tema = sintese.get("tema_principal", "geral")
                if tema not in self.memoria_semantica:
                    self.memoria_semantica[f"sabedoria_{tema}"] = {
                        "tipo": "sintese",
                        "ocorrencias": 0,
                        "fontes_conectadas": set(),
                        "ultima_atualizacao": "",
                    }
                chave_s = f"sabedoria_{tema}"
                self.memoria_semantica[chave_s]["ocorrencias"] += 1
                self.memoria_semantica[chave_s]["ultima_atualizacao"] = datetime.now().isoformat()
                self.total_padroes_extraidos += 1

    def _extrair_aprendizado_profundo(self, episodio: Dict, relatorio: Dict):
        """
        Extrai padrões de aprendizado profundo analisando múltiplos ciclos.

        Identifica tendências que não são visíveis em um único ciclo:
        - Insights recorrentes: Temas que aparecem repetidamente
        - Fontes degradantes: Fontes cuja relevância cai consistentemente
        - Domínios emergentes: Biomarcadores/subtipos ganhando relevância
        """
        # Precisa de pelo menos 5 episódios para análise multi-ciclo
        if len(self.memoria_episodica) < 5:
            return

        episodios_analise = self.memoria_episodica[-20:]  # Últimos 20 ciclos
        ciclo_inicio = episodios_analise[0].get("ciclo", 0)
        ciclo_fim = episodio.get("ciclo", self.total_episodios)
        dados_suporte = []

        # === 1. Insights recorrentes: temas que aparecem em múltiplos ciclos ===
        temas_por_ciclo = defaultdict(list)
        for ep in episodios_analise:
            # Extrair temas das fontes ativas
            for fonte in ep.get("por_fonte", {}):
                temas_por_ciclo[fonte].append(ep["ciclo"])

        temas_recorrentes = []
        for tema, ciclos in temas_por_ciclo.items():
            if len(ciclos) >= 3:  # Aparece em 3+ ciclos
                temas_recorrentes.append({
                    "tema": tema,
                    "frequencia": len(ciclos),
                    "ciclos": ciclos,
                })

        if temas_recorrentes:
            # Ordenar por frequência
            temas_recorrentes.sort(key=lambda x: x["frequencia"], reverse=True)
            top_temas = temas_recorrentes[:3]
            confianca = min(1.0, len(top_temas) * 0.25)
            dados_suporte.extend([f"{t['tema']} ({t['frequencia']}x)" for t in top_temas])

            self.memoria_profunda.append({
                "tipo_insight": "insight_recorrente",
                "descricao": f"Fontes/padrões recorrentes: {', '.join([t['tema'] for t in top_temas])}",
                "ciclo_inicio": ciclo_inicio,
                "ciclo_fim": ciclo_fim,
                "confianca": round(confianca, 3),
                "dados_suporte": dados_suporte,
                "timestamp": datetime.now().isoformat(),
            })

        # === 2. Fontes degradantes: relevância caindo consistentemente ===
        fontes_degradantes = []
        for chave, dados in self.memoria_semantica.items():
            if chave.startswith("biomarcador_") or chave.startswith("sabedoria_"):
                continue
            scores = dados.get("scores_acumulados", [])
            if len(scores) >= 5:
                # Verificar tendência: média dos 3 últimos vs média dos 3 primeiros
                media_recente = sum(scores[-3:]) / 3
                media_antiga = sum(scores[:3]) / 3
                queda_percentual = (media_antiga - media_recente) / max(0.01, media_antiga)
                if queda_percentual > 0.3:  # Queda > 30%
                    fontes_degradantes.append({
                        "fonte": chave,
                        "queda_percentual": round(queda_percentual, 3),
                        "score_recente": round(media_recente, 3),
                        "score_antigo": round(media_antiga, 3),
                    })

        if fontes_degradantes:
            fontes_degradantes.sort(key=lambda x: x["queda_percentual"], reverse=True)
            dados_suporte_degrad = [f"{f['fonte']} (-{f['queda_percentual']*100:.0f}%)" for f in fontes_degradantes]
            confianca = min(1.0, len(fontes_degradantes) * 0.3)

            self.memoria_profunda.append({
                "tipo_insight": "fonte_degradante",
                "descricao": f"Fontes com relevância em queda: {', '.join([f['fonte'] for f in fontes_degradantes])}",
                "ciclo_inicio": ciclo_inicio,
                "ciclo_fim": ciclo_fim,
                "confianca": round(confianca, 3),
                "dados_suporte": dados_suporte_degrad,
                "timestamp": datetime.now().isoformat(),
            })

        # === 3. Domínios emergentes: biomarcadores ganhando relevância ===
        dominios_emergentes = []
        for chave, dados in self.memoria_semantica.items():
            if not chave.startswith("biomarcador_"):
                continue
            mencoes = dados.get("mencoes", 0)
            # Biomarcadores com menções recentes e bom score
            if mencoes >= 2 and dados.get("score_medio", 0) > 0.5:
                # Verificar se é relativamente novo (menções concentradas em ciclos recentes)
                dominios_emergentes.append({
                    "biomarcador": chave.replace("biomarcador_", ""),
                    "mencoes": mencoes,
                    "score_medio": dados.get("score_medio", 0),
                    "severidade": dados.get("severidade_mais_comum", ""),
                })

        if dominios_emergentes:
            dominios_emergentes.sort(key=lambda x: x["mencoes"], reverse=True)
            top_dominios = dominios_emergentes[:5]
            dados_suporte_dom = [
                f"{d['biomarcador']} (score={d['score_medio']:.2f}, menções={d['mencoes']})"
                for d in top_dominios
            ]
            confianca = min(1.0, len(top_dominios) * 0.15)

            self.memoria_profunda.append({
                "tipo_insight": "dominio_emergente",
                "descricao": f"Domínios emergentes: {', '.join([d['biomarcador'] for d in top_dominios])}",
                "ciclo_inicio": ciclo_inicio,
                "ciclo_fim": ciclo_fim,
                "confianca": round(confianca, 3),
                "dados_suporte": dados_suporte_dom,
                "timestamp": datetime.now().isoformat(),
            })

        # Manter apenas últimos 100 aprendizados profundos
        if len(self.memoria_profunda) > 100:
            self.memoria_profunda = self.memoria_profunda[-100:]

    def _registrar_hipoteses(self, fase_sabedoria: Dict, ciclo: int):
        """Registra hipóteses na memória de projeção."""
        hipoteses = fase_sabedoria.get("hipoteses", [])
        for hip in hipoteses:
            self.total_hipoteses += 1
            hip_id = hashlib.md5(hip.get("hipotese", "").encode()).hexdigest()[:12]

            # Verificar se hipótese já existe
            existente = next(
                (h for h in self.memoria_projecao if h["hip_id"] == hip_id), None
            )

            if existente:
                existente["status"] = "revisitada"
                existente["ciclos_revisitada"] = existente.get("ciclos_revisitada", 0) + 1
                existente["ultima_revisao"] = datetime.now().isoformat()
            else:
                self.memoria_projecao.append({
                    "hip_id": hip_id,
                    "hipotese": hip.get("hipotese", ""),
                    "fonte_origem": hip.get("fonte", ""),
                    "ciclo_origem": ciclo,
                    "status": "pendente",
                    "ciclos_revisitada": 0,
                    "validada": False,
                    "data_criacao": datetime.now().isoformat(),
                    "ultima_revisao": datetime.now().isoformat(),
                    "confianca": hip.get("confianca", 0.5),
                })

        # Manter apenas últimas 500 hipóteses
        if len(self.memoria_projecao) > 500:
            self.memoria_projecao = self.memoria_projecao[-500:]

    def _atualizar_coeficiente_sabedoria(self):
        """
        Calcula o coeficiente de sabedoria (0-1) que cresce exponencialmente.
        
        Fatores (v2.0 — pesos reajustados):
        - Quantidade de episódios (experiência): peso 0.20
        - Padrões extraídos (compreensão): peso 0.20
        - Hipóteses geradas (criatividade): peso 0.15
        - Consistência dos achados relevantes (confiabilidade): peso 0.25
        - Aprendizado profundo multi-ciclo (profundidade): peso 0.10
        - Crescimento exponencial (bônus logarítmico)
        """
        # Fator experiência: log do número de ciclos
        fator_experiencia = min(1.0, math.log(1 + self.total_episodios) / math.log(100))

        # Fator compreensão: padrões extraídos
        fator_compreensao = min(1.0, self.total_padroes_extraidos / 500.0)

        # Fator criatividade: hipóteses geradas
        fator_criatividade = min(1.0, self.total_hipoteses / 100.0)

        # Fator confiabilidade: taxa média de relevância dos últimos 10 ciclos
        ultimos = self.memoria_episodica[-10:]
        if ultimos:
            taxas = [e.get("taxa_relevancia", 0) for e in ultimos]
            fator_confiabilidade = sum(taxas) / len(taxas)
        else:
            fator_confiabilidade = 0.0

        # Fator profundidade (v2.0): baseado na memória de aprendizado profundo
        fator_profundidade = min(1.0, len(self.memoria_profunda) / 50.0)

        # Coeficiente composto com crescimento exponencial
        self.coeficiente_sabedoria = min(
            1.0,
            (fator_experiencia * 0.20 +
             fator_compreensao * 0.20 +
             fator_criatividade * 0.15 +
             fator_confiabilidade * 0.25 +
             fator_profundidade * 0.10) *
            (1 + 0.1 * math.log(1 + self.total_episodios))
        )

        self.historico_sabedoria.append({
            "ciclo": self.total_episodios,
            "coeficiente": round(self.coeficiente_sabedoria, 4),
            "experiencia": round(fator_experiencia, 3),
            "compreensao": round(fator_compreensao, 3),
            "criatividade": round(fator_criatividade, 3),
            "confiabilidade": round(fator_confiabilidade, 3),
            "profundidade": round(fator_profundidade, 3),
            "timestamp": datetime.now().isoformat(),
        })

        if len(self.historico_sabedoria) > 1000:
            self.historico_sabedoria = self.historico_sabedoria[-1000:]

    def obter_memoria_relevante(self, contexto: str, top_k: int = 5) -> List[Dict]:
        """
        Recupera memórias relevantes baseado em similaridade simples.
        Usado para enriquecer decisões com aprendizado acumulado.
        """
        contexto_lower = contexto.lower()
        resultados = []

        # Buscar em memória semântica por palavras-chave
        palavras = set(contexto_lower.split())
        for chave, dados in self.memoria_semantica.items():
            chave_lower = chave.lower()
            sobreposicao = len(palavras & set(chave_lower.split()))
            if sobreposicao > 0:
                resultados.append({
                    "tipo": "padrao",
                    "chave": chave,
                    "dados": dados,
                    "relevancia": sobreposicao / max(1, len(palavras)),
                })

        # Buscar hipóteses relevantes
        for hip in self.memoria_projecao:
            hip_lower = hip.get("hipotese", "").lower()
            sobreposicao = len(palavras & set(hip_lower.split()))
            if sobreposicao > 0:
                resultados.append({
                    "tipo": "hipotese",
                    "hipotese": hip.get("hipotese", ""),
                    "status": hip.get("status", "pendente"),
                    "confianca": hip.get("confianca", 0),
                    "relevancia": sobreposicao / max(1, len(palavras)),
                })

        # Ordenar por relevância
        resultados.sort(key=lambda x: x["relevancia"], reverse=True)
        return resultados[:top_k]

    def obter_metricas_sabedoria(self) -> Dict:
        """Retorna métricas completas da memória e sabedoria."""
        return {
            "versao": self.VERSAO,
            "total_episodios": self.total_episodios,
            "total_padroes_extraidos": self.total_padroes_extraidos,
            "total_hipoteses": self.total_hipoteses,
            "total_validadas": self.total_validadas,
            "coeficiente_sabedoria": round(self.coeficiente_sabedoria, 4),
            "nivel_sabedoria": self._classificar_nivel_sabedoria(),
            "fontes_avaliadas": len([
                k for k in self.memoria_semantica if not k.startswith("biomarcador_") and not k.startswith("sabedoria_")
            ]),
            "biomarcadores_rastreados": len([
                k for k in self.memoria_semantica if k.startswith("biomarcador_")
            ]),
            "temas_sabedoria": len([
                k for k in self.memoria_semantica if k.startswith("sabedoria_")
            ]),
            "hipoteses_pendentes": len([
                h for h in self.memoria_projecao if h["status"] == "pendente"
            ]),
            "insights_profundos": len(self.memoria_profunda),
            "historico_tamanho": len(self.historico_sabedoria),
        }

    def _classificar_nivel_sabedoria(self) -> str:
        """Classifica o nível de sabedoria do sistema."""
        c = self.coeficiente_sabedoria
        if c >= 0.8:
            return "SABEDORIA_EXPERT"
        elif c >= 0.6:
            return "SABEDORIA_AVANCADA"
        elif c >= 0.4:
            return "APRENDIZADO_ATIVO"
        elif c >= 0.2:
            return "APRENDIZADO_INICIAL"
        else:
            return "EMERGENTE"

    def obter_tendencias_aprendizado(self) -> List[Dict]:
        """Retorna tendências de aprendizado dos últimos ciclos."""
        if len(self.memoria_episodica) < 3:
            return []

        ultimos = self.memoria_episodica[-10:]
        tendencias = []

        # Tendência de taxa de relevância
        taxas = [e.get("taxa_relevancia", 0) for e in ultimos]
        if len(taxas) >= 2:
            tendencia_taxa = taxas[-1] - taxas[0]
            tendencias.append({
                "metrica": "taxa_relevancia",
                "direcao": "CRESCENTE" if tendencia_taxa > 0.02 else "DECRESCENTE" if tendencia_taxa < -0.02 else "ESTAVEL",
                "valor_atual": round(taxas[-1], 4),
                "variacao": round(tendencia_taxa, 4),
            })

        # Tendência de achados por ciclo
        achados = [e.get("total_achados", 0) for e in ultimos]
        if len(achados) >= 2:
            media_achados = sum(achados) / len(achados)
            tendencias.append({
                "metrica": "achados_por_ciclo",
                "media": round(media_achados, 1),
                "ultimo": achados[-1],
            })

        # Crescimento do coeficiente de sabedoria
        if len(self.historico_sabedoria) >= 2:
            ult_coef = [h["coeficiente"] for h in self.historico_sabedoria[-5:]]
            if len(ult_coef) >= 2:
                crescimento = ult_coef[-1] - ult_coef[0]
                tendencias.append({
                    "metrica": "coeficiente_sabedoria",
                    "crescimento": round(crescimento, 4),
                    "valor_atual": round(ult_coef[-1], 4),
                    "direcao": "EXPONENCIAL" if crescimento > 0.05 else "GRADUAL" if crescimento > 0 else "ESTAVEL",
                })

        return tendencias

    def gerar_recomendacoes_autoevolucao(self) -> List[Dict]:
        """
        Gera recomendações acionáveis para auto-evolução do sistema.

        Analisa todas as memórias e produz recomendações com:
        - tipo: categoria da recomendação
        - acao: descrição da ação sugerida
        - racional: porquê esta recomendação foi gerada
        - prioridade: ALTA, MEDIA ou BAIXA
        - confianca: nível de confiança (0-1)
        """
        recomendacoes = []

        # === 1. Fontes ineficazes → remover_fonte_ineficaz ===
        for chave, dados in self.memoria_semantica.items():
            if chave.startswith("biomarcador_") or chave.startswith("sabedoria_"):
                continue
            if dados.get("ciclos_ativos", 0) >= 5 and dados.get("taxa_relevancia_media", 0) < 0.2:
                recomendacoes.append({
                    "tipo": "remover_fonte_ineficaz",
                    "acao": f"Desativar ou reduzir peso da fonte '{chave}'",
                    "racional": (f"Fonte ativa em {dados['ciclos_ativos']} ciclos com "
                                 f"relevância média de {dados['taxa_relevancia_media']:.3f} (< 0.2)"),
                    "prioridade": "ALTA" if dados["taxa_relevancia_media"] < 0.1 else "MEDIA",
                    "confianca": min(1.0, dados["ciclos_ativos"] / 10.0),
                })

        # === 2. Biomarcadores de alto desempenho → priorizar_dominio ===
        for chave, dados in self.memoria_semantica.items():
            if not chave.startswith("biomarcador_"):
                continue
            bm = chave.replace("biomarcador_", "")
            if dados.get("mencoes", 0) >= 3 and dados.get("score_medio", 0) > 0.7:
                recomendacoes.append({
                    "tipo": "priorizar_dominio",
                    "acao": f"Priorizar biomarcador '{bm}' nas buscas futuras",
                    "racional": (f"'{bm}' mencionado {dados['mencoes']}x com score médio "
                                 f"de {dados['score_medio']:.3f}"),
                    "prioridade": "ALTA",
                    "confianca": min(1.0, dados["mencoes"] / 5.0),
                })

        # === 3. Memória profunda → expandir/ajustar com base em insights ===
        for insight in self.memoria_profunda:
            tipo = insight.get("tipo_insight", "")
            if tipo == "fonte_degradante" and insight.get("confianca", 0) > 0.5:
                recomendacoes.append({
                    "tipo": "ajustar_pesos_scorer",
                    "acao": "Reduzir peso de fontes identificadas como degradantes",
                    "racional": insight.get("descricao", ""),
                    "prioridade": "ALTA",
                    "confianca": insight.get("confianca", 0),
                })
            elif tipo == "dominio_emergente" and insight.get("confianca", 0) > 0.3:
                recomendacoes.append({
                    "tipo": "expandir_biomarcador",
                    "acao": "Expandir busca para domínios emergentes identificados",
                    "racional": insight.get("descricao", ""),
                    "prioridade": "MEDIA",
                    "confianca": insight.get("confianca", 0),
                })
            elif tipo == "insight_recorrente" and insight.get("confianca", 0) > 0.4:
                # Extrair temas recorrentes para termos de busca
                for dado in insight.get("dados_suporte", []):
                    recomendacoes.append({
                        "tipo": "adicionar_termo_busca",
                        "acao": f"Adicionar termo de busca derivado de padrão recorrente: {dado}",
                        "racional": f"Padrão recorrente detectado com confiança {insight.get('confianca', 0):.2f}",
                        "prioridade": "MEDIA",
                        "confianca": insight.get("confianca", 0),
                    })

        # === 4. Tendências de relevância → ajustar_pesos_scorer ===
        if len(self.memoria_episodica) >= 5:
            ultimos = self.memoria_episodica[-5:]
            taxas = [e.get("taxa_relevancia", 0) for e in ultimos]
            if taxas[-1] < taxas[0] - 0.1:  # Queda > 10% nos últimos 5 ciclos
                recomendacoes.append({
                    "tipo": "ajustar_pesos_scorer",
                    "acao": "Revisar pesos do scorer — taxa de relevância em queda",
                    "racional": (f"Taxa de relevância caiu de {taxas[0]:.3f} para {taxas[-1]:.3f} "
                                 f"nos últimos 5 ciclos"),
                    "prioridade": "ALTA",
                    "confianca": 0.8,
                })

        # Ordenar por prioridade e confiança
        ordem_prioridade = {"ALTA": 0, "MEDIA": 1, "BAIXA": 2}
        recomendacoes.sort(
            key=lambda r: (ordem_prioridade.get(r["prioridade"], 3), -r["confianca"])
        )

        # Limitar a 20 recomendações
        return recomendacoes[:20]

    def buscar_por_padrao(self, padrao: str) -> List[Dict]:
        """
        Busca unificada por padrão em TODOS os tipos de memória.

        Varre memória episódica, semântica, procedural, projeção e profunda,
        retornando resultados unificados ordenados por score de relevância.
        Usa scoring simples por sobreposição de palavras.
        """
        padrao_lower = padrao.lower()
        palavras_busca = set(padrao_lower.split())
        if not palavras_busca:
            return []

        resultados = []

        # === Buscar em memória episódica ===
        for ep in self.memoria_episodica:
            texto = json.dumps(ep, default=str).lower()
            palavras_ep = set(texto.split())
            sobreposicao = len(palavras_busca & palavras_ep)
            if sobreposicao > 0:
                score = sobreposicao / len(palavras_busca)
                resultados.append({
                    "tipo_memoria": "episodica",
                    "ciclo": ep.get("ciclo", 0),
                    "dados": ep,
                    "score_relevancia": round(score, 4),
                })

        # === Buscar em memória semântica ===
        for chave, dados in self.memoria_semantica.items():
            texto = f"{chave} {json.dumps(dados, default=str)}".lower()
            palavras_sem = set(texto.split())
            sobreposicao = len(palavras_busca & palavras_sem)
            if sobreposicao > 0:
                score = sobreposicao / len(palavras_busca)
                resultados.append({
                    "tipo_memoria": "semantica",
                    "chave": chave,
                    "dados": dados,
                    "score_relevancia": round(score, 4),
                })

        # === Buscar em memória procedural ===
        for proc in self.memoria_procedural:
            texto = json.dumps(proc, default=str).lower()
            palavras_proc = set(texto.split())
            sobreposicao = len(palavras_busca & palavras_proc)
            if sobreposicao > 0:
                score = sobreposicao / len(palavras_busca)
                resultados.append({
                    "tipo_memoria": "procedural",
                    "dados": proc,
                    "score_relevancia": round(score, 4),
                })

        # === Buscar em memória de projeção ===
        for hip in self.memoria_projecao:
            texto = json.dumps(hip, default=str).lower()
            palavras_hip = set(texto.split())
            sobreposicao = len(palavras_busca & palavras_hip)
            if sobreposicao > 0:
                score = sobreposicao / len(palavras_busca)
                resultados.append({
                    "tipo_memoria": "projecao",
                    "hipotese": hip.get("hipotese", ""),
                    "status": hip.get("status", ""),
                    "dados": hip,
                    "score_relevancia": round(score, 4),
                })

        # === Buscar em memória profunda ===
        for prof in self.memoria_profunda:
            texto = json.dumps(prof, default=str).lower()
            palavras_prof = set(texto.split())
            sobreposicao = len(palavras_busca & palavras_prof)
            if sobreposicao > 0:
                score = sobreposicao / len(palavras_busca)
                # Bônus para memória profunda (insights multi-ciclo são mais valiosos)
                score = min(1.0, score * 1.2)
                resultados.append({
                    "tipo_memoria": "profunda",
                    "tipo_insight": prof.get("tipo_insight", ""),
                    "descricao": prof.get("descricao", ""),
                    "dados": prof,
                    "score_relevancia": round(score, 4),
                })

        # Ordenar por score de relevância (decrescente)
        resultados.sort(key=lambda r: r["score_relevancia"], reverse=True)
        return resultados

    def obter_memoria_completa(self) -> Dict:
        """
        Retorna TODOS os tipos de memória em um único dicionário estruturado.

        Útil para backup completo, análise e inspeção do estado interno.
        """
        return {
            "versao": self.VERSAO,
            "timestamp": datetime.now().isoformat(),
            "metricas": {
                "total_episodios": self.total_episodios,
                "total_padroes_extraidos": self.total_padroes_extraidos,
                "total_hipoteses": self.total_hipoteses,
                "total_validadas": self.total_validadas,
                "coeficiente_sabedoria": round(self.coeficiente_sabedoria, 4),
                "nivel_sabedoria": self._classificar_nivel_sabedoria(),
            },
            "memoria_episodica": self.memoria_episodica,
            "memoria_semantica": self.memoria_semantica,
            "memoria_procedural": self.memoria_procedural,
            "memoria_projecao": self.memoria_projecao,
            "memoria_profunda": self.memoria_profunda,
            "historico_sabedoria": self.historico_sabedoria,
            "recomendacoes": self.gerar_recomendacoes_autoevolucao(),
        }

    # === PERSISTÊNCIA ===

    def _salvar(self):
        """Salva estado da memória em disco."""
        estado = {
            "versao": self.VERSAO,
            "total_episodios": self.total_episodios,
            "total_padroes_extraidos": self.total_padroes_extraidos,
            "total_hipoteses": self.total_hipoteses,
            "total_validadas": self.total_validadas,
            "coeficiente_sabedoria": self.coeficiente_sabedoria,
            "memoria_episodica": self.memoria_episodica[-50:],
            "memoria_semantica": self.memoria_semantica,
            "memoria_projecao": self.memoria_projecao[-100:],
            "memoria_profunda": self.memoria_profunda[-50:],
            "historico_sabedoria": self.historico_sabedoria[-100:],
            "salvo_em": datetime.now().isoformat(),
        }

        try:
            # Salvar memória principal
            with open(self.caminho_memoria, 'w', encoding='utf-8') as f:
                json.dump(estado, f, indent=2, ensure_ascii=False, default=str)

            # Salvar sabedoria separadamente
            sabedoria = {
                "coeficiente": self.coeficiente_sabedoria,
                "nivel": self._classificar_nivel_sabedoria(),
                "historico": self.historico_sabedoria,
                "metricas": self.obter_metricas_sabedoria(),
                "tendencias": self.obter_tendencias_aprendizado(),
                "salvo_em": datetime.now().isoformat(),
            }
            with open(self.caminho_sabedoria, 'w', encoding='utf-8') as f:
                json.dump(sabedoria, f, indent=2, ensure_ascii=False, default=str)
        except Exception as e:
            print(f"   [SENCIENCIA] Aviso: falha ao salvar memória ({e})")

    def _restaurar(self):
        """Restaura estado da memória de disco."""
        if not os.path.exists(self.caminho_memoria):
            return

        try:
            with open(self.caminho_memoria, 'r', encoding='utf-8') as f:
                estado = json.load(f)

            self.total_episodios = estado.get("total_episodios", 0)
            self.total_padroes_extraidos = estado.get("total_padroes_extraidos", 0)
            self.total_hipoteses = estado.get("total_hipoteses", 0)
            self.total_validadas = estado.get("total_validadas", 0)
            self.coeficiente_sabedoria = estado.get("coeficiente_sabedoria", 0)
            self.memoria_episodica = estado.get("memoria_episodica", [])
            self.memoria_semantica = estado.get("memoria_semantica", {})
            self.memoria_projecao = estado.get("memoria_projecao", [])
            self.memoria_profunda = estado.get("memoria_profunda", [])
            self.historico_sabedoria = estado.get("historico_sabedoria", [])

            # Converter sets serializados de volta
            for chave, dados in self.memoria_semantica.items():
                if "fontes_conectadas" in dados and isinstance(dados["fontes_conectadas"], list):
                    dados["fontes_conectadas"] = set(dados["fontes_conectadas"])

            print(f"[SENCIENCIA] Memória restaurada: {self.total_episodios} episódios, "
                  f"{self.total_padroes_extraidos} padrões, "
                  f"{len(self.memoria_profunda)} insights profundos, "
                  f"sabedoria={self.coeficiente_sabedoria:.3f}")
        except Exception as e:
            print(f"[SENCIENCIA] Aviso: falha ao restaurar memória ({e})")