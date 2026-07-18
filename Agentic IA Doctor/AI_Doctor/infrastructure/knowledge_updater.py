"""
DIMHEX — Atualizador de Base de Conhecimento
Processa achados de pesquisa, gera embeddings, e atualiza o ChromaDB
com documentos de conhecimento cientifico relevantes.
Integra com o agente oncologico para enriquecer decisoes.
"""

import datetime
import hashlib
import json
import os
import time
from typing import Dict, List, Optional, Any
import numpy as np
from infrastructure.chroma_db import BancoVetorialChromaDB
from config import CONFIG


class AtualizadorBaseConhecimento:
    """
    Processa achados do DIMHEX e os integra na base de conhecimento do sistema.

    Duas colecoes ChromaDB:
    - ai_doctor_tumores (existente): vetores de biomarcadores numericos
    - dimhex_conhecimento (nova): documentos de pesquisa textuais + embeddings semanticos
    """

    COLECAO_PESQUISA = "dimhex_conhecimento"
    LIMITE_RELEVANCIA_MINIMO = 0.25  # Abaixo disso nao indexa

    def __init__(self):
        self.chroma_casos = BancoVetorialChromaDB(colecao_nome="ai_doctor_tumores")
        self.chroma_pesquisa = BancoVetorialChromaDB(colecao_nome=self.COLECAO_PESQUISA)
        self.total_indexados = 0
        self.total_rejeitados = 0
        self.achados_criticos: List[Dict] = []
        self.log_atualizacao: List[Dict] = []

    def processar_ciclo(self, resultados_por_fonte: Dict[str, List[Dict]],
                        scores_por_id: Dict[str, Dict]) -> Dict[str, Any]:
        """
        Processa todos os achados de um ciclo completo de pesquisa.
        Filtra por relevancia, gera embeddings, indexa no ChromaDB,
        e identifica achados criticos para acao imediata.
        """
        ciclo_id = datetime.datetime.utcnow().isoformat()
        total_recebidos = 0
        total_filtrados = 0
        total_indexados_ciclo = 0

        print(f"\n[DIMHEX] Processando ciclo {ciclo_id}...")

        # Achatando resultados de todas as fontes
        todos_achados = []
        for fonte, achados in resultados_por_fonte.items():
            for achado in achados:
                achado["_fonte_original"] = fonte
                todos_achados.append(achado)
                total_recebidos += 1

        # Filtrar por score de relevancia
        achados_relevantes = []
        for achado in todos_achados:
            id_dimhex = achado.get("id_dimhex", "")
            score_info = scores_por_id.get(id_dimhex, {})

            if not score_info:
                continue

            score_final = score_info.get("score_final", 0)
            classificacao = score_info.get("classificacao", "irrelevante")

            if score_final < self.LIMITE_RELEVANCIA_MINIMO:
                self.total_rejeitados += 1
                total_filtrados += 1
                continue

            # Enriquecer achado com dados do score
            achado["_score_dimhex"] = score_final
            achado["_classificacao"] = classificacao
            achado["_biomarcadores"] = score_info.get("biomarcadores_mencionados", [])
            achado["_subtipos"] = score_info.get("subtipos_mencionados", [])
            achado["_justificativas"] = score_info.get("justificativas", [])

            achados_relevantes.append(achado)

            if classificacao == "critico":
                self.achados_criticos.append(achado)

        print(f"   Recebidos: {total_recebidos} | Filtrados (baixa relevancia): {total_filtrados} | Relevantes: {len(achados_relevantes)}")

        # Gerar embeddings e indexar
        for achado in achados_relevantes:
            try:
                self._indexar_achado(achado)
                total_indexados_ciclo += 1
                self.total_indexados += 1
            except Exception as e:
                print(f"   [ERRO] Falha ao indexar {achado.get('id_dimhex')}: {e}")

        # Gerar insights de acao
        insights = self._gerar_insights_acao(achados_relevantes)

        # Salvar log
        registro = {
            "ciclo_id": ciclo_id,
            "timestamp": ciclo_id,
            "total_recebidos": total_recebidos,
            "total_filtrados": total_filtrados,
            "total_indexados": total_indexados_ciclo,
            "achados_criticos": len([a for a in achados_relevantes if a.get("_classificacao") == "critico"]),
            "insights_gerados": len(insights),
            "acumulado_indexados": self.total_indexados,
            "acumulado_rejeitados": self.total_rejeitados,
        }
        self.log_atualizacao.append(registro)

        print(f"   Indexados neste ciclo: {total_indexados_ciclo} | Acumulado total: {self.total_indexados}")
        print(f"   Achados criticos: {registro['achados_criticos']} | Insights: {len(insights)}")

        return {
            "registro": registro,
            "insights": insights,
            "achados_criticos": [a for a in achados_relevantes if a.get("_classificacao") == "critico"],
        }

    def _indexar_achado(self, achado: Dict):
        """Gera embedding semantico e indexa no ChromaDB de pesquisa."""
        # Construir texto unificado para embedding
        campos_texto = [
            achado.get("titulo", ""),
            achado.get("resumo", "")[:500],  # Limitar resumo para embedding estavel
            achado.get("termo_busca", ""),
        ]
        texto_unificado = " | ".join([t for t in campos_texto if t])

        # Embedding semantico simples (bag-of-words com ponderacao de termos-chave)
        embedding = self._gerar_embedding_semantico(texto_unificado, achado)

        # Metadados para recuperacao futura
        metadados = {
            "titulo": achado.get("titulo", "")[:200],
            "fonte": achado.get("fonte", ""),
            "tipo": achado.get("tipo", ""),
            "data_publicacao": achado.get("data_publicacao", ""),
            "url": achado.get("url", ""),
            "score_dimhex": str(achado.get("_score_dimhex", 0)),
            "classificacao": achado.get("_classificacao", ""),
            "biomarcadores": json.dumps(achado.get("_biomarcadores", [])),
            "subtipos": json.dumps(achado.get("_subtipos", [])),
            "autores": json.dumps(achado.get("autores", [])[:3]),
            "jornal": achado.get("jornal", "")[:100],
            "termo_busca": achado.get("termo_busca", ""),
        }

        self.chroma_pesquisa.indexar_caso_clinico(
            caso_id=achado.get("id_dimhex", f"achado_{hashlib.md5(texto_unificado.encode()).hexdigest()[:12]}"),
            vetor=embedding,
            metadados=metadados
        )

    def _gerar_embedding_semantico(self, texto: str, achado: Dict) -> np.ndarray:
        """
        Gera embedding semantico de dimensao fixa para o documento.

        Usa abordagem hibrida: hash-based com ponderacao por relevancia
        dos termos. Dimensao: 64 (compativel com busca por similaridade).
        """
        dim = 64
        embedding = np.zeros(dim, dtype=np.float32)

        # Termos-chave ponderados do dominio oncologico
        termos_ponderados = {
            # Biomarcadores
            "ctdna": 3.0, "circulating tumor dna": 3.0, "liquid biopsy": 2.5,
            "ctc": 2.5, "circulating tumor cell": 2.5,
            "tmb": 2.5, "tumor mutational burden": 2.5,
            "pdl1": 3.0, "pd-l1": 3.0, "pd-1": 2.0, "checkpoint": 1.5,
            "til": 2.0, "tumor infiltrating": 2.0,
            "ecog": 2.0, "performance status": 2.0,
            # Subtipos
            "nsclc": 2.0, "lung cancer": 1.5, "kras": 2.0, "g12c": 2.0,
            "egfr": 2.0, "osimertinib": 2.5,
            "triple negative": 2.0, "tnbc": 2.0, "breast cancer": 1.5,
            # Tratamentos
            "immunotherapy": 2.0, "chemotherapy": 1.0, "targeted therapy": 2.0,
            "pembrolizumab": 2.5, "carboplatin": 1.5, "pemetrexed": 1.5,
            "sotorasib": 2.0, "docetaxel": 1.5, "ramucirumab": 1.5,
            "sacituzumab": 2.0, "eribulin": 1.0,
            # Evidencia
            "clinical trial": 1.5, "phase 3": 2.0, "randomized": 1.5,
            "overall survival": 2.5, "progression free": 2.0,
            "response rate": 2.0, "complete response": 2.5,
            "hazard ratio": 2.0,
        }

        texto_lower = texto.lower()

        for termo, peso in termos_ponderados.items():
            if termo in texto_lower:
                # Hash do termo para posicao no vetor
                hash_val = int(hashlib.md5(termo.encode()).hexdigest(), 16)
                posicao = hash_val % dim
                embedding[posicao] += peso

        # Incorporar score DIMHEX como componente adicional
        score = achado.get("_score_dimhex", 0.5)
        embedding[0] += score * 2.0  # Posicao 0 = sinal de relevancia geral

        # Normalizar para magnitude unitaria
        norma = np.linalg.norm(embedding)
        if norma > 0:
            embedding = embedding / norma

        return embedding

    def _gerar_insights_acao(self, achados_relevantes: List[Dict]) -> List[Dict]:
        """
        Analisa achados relevantes e gera insights acionaveis para o sistema.
        Cada insight representa uma acao potencial para melhorar o AI Doctor.
        """
        insights = []

        # Agrupar por biomarcadores mencionados
        contagem_biomarcadores = {}
        for achado in achados_relevantes:
            for bm in achado.get("_biomarcadores", []):
                if bm not in contagem_biomarcadores:
                    contagem_biomarcadores[bm] = []
                contagem_biomarcadores[bm].append(achado)

        # Insight: Concentracao de evidencia por biomarcador
        for bm, achados in sorted(contagem_biomarcadores.items(), key=lambda x: -len(x[1])):
            if len(achados) >= 2:
                scores = [a.get("_score_dimhex", 0) for a in achados]
                media_score = sum(scores) / len(scores)
                insight = {
                    "tipo": "concentracao_evidencia",
                    "biomarcador": bm,
                    "qtd_achados": len(achados),
                    "score_medio": round(media_score, 3),
                    "recomendacao": f"{len(achados)} achados recentes sobre {bm} com score medio {media_score:.3f}. "
                                    f"Revisar limiares e pesos do agente para este biomarcador.",
                    "severidade": "alta" if media_score > 0.5 else "moderada",
                }
                insights.append(insight)

        # Insight: Novos protocolos terapeuticos
        for achado in achados_relevantes:
            if achado.get("_classificacao") in ("critico", "alto"):
                tipo = achado.get("tipo", "")
                if tipo == "ensaio_clinico":
                    intervencoes = achado.get("intervencoes", [])
                    if intervencoes:
                        insight = {
                            "tipo": "novo_protocolo",
                            "titulo": achado.get("titulo", "")[:150],
                            "intervencoes": intervencoes[:3],
                            "fase": achado.get("fase", []),
                            "score": achado.get("_score_dimhex", 0),
                            "recomendacao": f"Ensaio clinico relevante: {achado.get('titulo', '')[:100]}. "
                                            f"Considerar adicionar ao mapeador NCCN/ASCO.",
                            "severidade": "critica" if achado.get("_classificacao") == "critico" else "alta",
                            "url": achado.get("url", ""),
                        }
                        insights.append(insight)

        # Insight: Atualizacao de limiares de biomarcadores
        for achado in achados_relevantes:
            if achado.get("_score_dimhex", 0) >= 0.6:
                titulo = achado.get("titulo", "").lower()
                for termo_limiar in ["threshold", "cut-off", "cutoff", "limiar", "optimal value"]:
                    if termo_limiar in titulo:
                        insight = {
                            "tipo": "atualizacao_limiar",
                            "titulo": achado.get("titulo", "")[:150],
                            "biomarcadores": achado.get("_biomarcadores", []),
                            "score": achado.get("_score_dimhex", 0),
                            "recomendacao": f"Artigo discute limiares otimos para {', '.join(achado.get('_biomarcadores', []))}. "
                                            f"Verificar se CONFIG precisa de ajuste.",
                            "severidade": "alta",
                            "url": achado.get("url", ""),
                        }
                        insights.append(insight)
                        break

        # Ordenar por severidade
        ordem_severidade = {"critica": 0, "alta": 1, "moderada": 2}
        insights.sort(key=lambda x: ordem_severidade.get(x.get("severidade", ""), 99))

        return insights[:10]  # Top 10 insights

    def buscar_conhecimento_relevante(self, query_texto: str, top_k: int = 5) -> List[Dict]:
        """
        Busca na base de conhecimento DIMHEX por relevancia semantica.
        Usado pelo agente para enriquecer decisoes com evidencia recente.
        """
        query_embedding = self._gerar_embedding_semantico(query_texto, {"_score_dimhex": 0.5})
        resultados = self.chroma_pesquisa.buscar_casos_analogos(query_embedding, top_k=top_k)
        return resultados

    def obter_resumo(self) -> Dict:
        """Retorna resumo completo do estado da base de conhecimento."""
        return {
            "total_indexados": self.total_indexados,
            "total_rejeitados": self.total_rejeitados,
            "achados_criticos_pendentes": len(self.achados_criticos),
            "ciclos_executados": len(self.log_atualizacao),
            "ultimo_ciclo": self.log_atualizacao[-1] if self.log_atualizacao else None,
            "taxa_aprovacao": (
                self.total_indexados / max(1, self.total_indexados + self.total_rejeitados)
            )
        }