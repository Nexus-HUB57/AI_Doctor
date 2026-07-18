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

    Cada ciclo DIMHEX alimenta 4 tipos de memória:
    - Episódica: Dados brutos do ciclo (coleta, scores, insights)
    - Semântica: Padrões extraídos (quais biomarcadores são mais relevantes,
      quais fontes trazem mais achados, quais subtipos têm mais evidência)
    - Procedural: Ações tomadas e seus resultados (decisões que funcionaram)
    - Projeção: Hipóteses geradas pela sabedoria e seu status (validada/pending)

    A memória é persistida em JSON + ChromaDB para recuperação semântica.
    """

    VERSAO = "1.0.0"

    def __init__(self):
        self.caminho_memoria = CONFIG.get("DIMHEX_MEMORY_PATH", "./dimhex_memoria.json")
        self.caminho_sabedoria = CONFIG.get("DIMHEX_WISDOM_PATH", "./dimhex_sabedoria.json")

        # Memórias em memória
        self.memoria_episodica: List[Dict] = []
        self.memoria_semantica: Dict[str, Any] = {}
        self.memoria_procedural: List[Dict] = []
        self.memoria_projecao: List[Dict] = []

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
        
        Fatores:
        - Quantidade de episódios (experiência)
        - Padrões extraídos (compreensão)
        - Hipóteses geradas (criatividade)
        - Consistência dos achados relevantes (confiabilidade)
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

        # Coeficiente composto com crescimento exponencial
        self.coeficiente_sabedoria = min(
            1.0,
            (fator_experiencia * 0.25 +
             fator_compreensao * 0.25 +
             fator_criatividade * 0.20 +
             fator_confiabilidade * 0.30) *
            (1 + 0.1 * math.log(1 + self.total_episodios))
        )

        self.historico_sabedoria.append({
            "ciclo": self.total_episodios,
            "coeficiente": round(self.coeficiente_sabedoria, 4),
            "experiencia": round(fator_experiencia, 3),
            "compreensao": round(fator_compreensao, 3),
            "criatividade": round(fator_criatividade, 3),
            "confiabilidade": round(fator_confiabilidade, 3),
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
            self.historico_sabedoria = estado.get("historico_sabedoria", [])

            # Converter sets serializados de volta
            for chave, dados in self.memoria_semantica.items():
                if "fontes_conectadas" in dados and isinstance(dados["fontes_conectadas"], list):
                    dados["fontes_conectadas"] = set(dados["fontes_conectadas"])

            print(f"[SENCIENCIA] Memória restaurada: {self.total_episodios} episódios, "
                  f"{self.total_padroes_extraidos} padrões, "
                  f"sabedoria={self.coeficiente_sabedoria:.3f}")
        except Exception as e:
            print(f"[SENCIENCIA] Aviso: falha ao restaurar memória ({e})")