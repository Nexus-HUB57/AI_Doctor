"""
CAMADA 2 — Evidence-Driven Therapy (Feedback Loop)

Conecta os achados do DIMHEX (pesquisa continua) ao motor de probabilidade
terapeutica (Camada 1), criando um loop de feedback onde cada novo estudo
clinico ou trial encontrado atualiza as probabilidades de tratamento.

Fluxo:
  DIMHEX encontra achado relevante
    -> Camada 2 classifica o tipo de evidencia
    -> Extrai parametros quantitativos (ORR, HR, p-valor)
    -> Converte em fator de ajuste bayesiano
    -> Alimenta o Motor de Probabilidade (Camada 1)
    -> Agente oncologico toma decisoes com probabilidades atualizadas

Base cientifica:
- Atualizacao bayesiana incremental (Jeffreys prior)
- Meta-analise de resultados combinados (DerSimonian-Laird simplificado)
- Classificacao de forca de evidencia (Oxford CEBM adaptada)
"""

import re
import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class EvidenceDrivenTherapy:
    """
    Ponte entre a pesquisa DIMHEX e as decisoes terapeuticas probabilisticas.
    """

    # Mapeamento de termos nos achados para subtipos tumorais
    MAPEAMENTO_SUBTIPOS = {
        "NSCLC_KRAS_G12C": [
            "kras g12c", "sotorasib", "adagrasib", "codebreak", "kristal",
            "nsclc", "non-small cell lung", "pulmao"
        ],
        "NSCLC_EGFR_MUTADO": [
            "egfr", "osimertinibe", "gefitinibe", "erlotinibe", "alectinib",
            "tki", "flare", "nsclc", "pulmao", "mutacao egfr"
        ],
        "TRIPLO_NEGATIVO_MAMARIO": [
            "triplo negativo", "tnbc", "sacituzumabe", "eribulina",
            " KEYNOTE-355", "ascend", "mamario", "mama", "breast"
        ],
    }

    # Classificacao de forca de evidencia (adaptado Oxford CEBM)
    NIVEIS_EVIDENCIA = {
        "meta_analise": {"nivel": 1, "forca": 0.95, "peso": 1.0},
        "ensaio_fase3": {"nivel": 2, "forca": 0.85, "peso": 0.9},
        "ensaio_fase2": {"nivel": 3, "forca": 0.65, "peso": 0.7},
        "ensaio_fase1": {"nivel": 4, "forca": 0.40, "peso": 0.5},
        "coorte": {"nivel": 3, "forca": 0.55, "peso": 0.6},
        "caso_controle": {"nivel": 4, "forca": 0.40, "peso": 0.5},
        "revisao_sistematica": {"nivel": 2, "forca": 0.80, "peso": 0.85},
        "pre_clinico": {"nivel": 5, "forca": 0.25, "peso": 0.3},
        "guideline": {"nivel": 2, "forca": 0.85, "peso": 0.9},
        "desconhecido": {"nivel": 5, "forca": 0.20, "peso": 0.25},
    }

    # Regex para extrair metricas quantitativas dos textos de achados
    PATTERNS_METRICAS = {
        "orr": re.compile(
            r"(?:orrr?|objective response rate|taxa de resposta global|taxa de resposta objetiva)"
            r"\s*[=:]\s*([\d.]+)\s*%?",
            re.IGNORECASE
        ),
        "dcr": re.compile(
            r"(?:dcr|disease control rate|taxa de controle)"
            r"\s*[=:]\s*([\d.]+)\s*%?",
            re.IGNORECASE
        ),
        "pfs_mediana_meses": re.compile(
            r"(?:pfs|progressao|progressao livre)\s*(?:mediana|median)?\s*[=:]\s*([\d.]+)\s*(?:meses|months|mo)",
            re.IGNORECASE
        ),
        "os_mediana_meses": re.compile(
            r"(?:os|sobrevida global|overall survival)\s*(?:mediana|median)?\s*[=:]\s*([\d.]+)\s*(?:meses|months|mo)",
            re.IGNORECASE
        ),
        "hr": re.compile(
            r"(?:hr|hazard ratio|razao de risco)\s*[=:]\s*([\d.]+)",
            re.IGNORECASE
        ),
        "pvalor": re.compile(
            r"p\s*[<>=]\s*([\d.e-]+)",
            re.IGNORECASE
        ),
    }

    # Regex para identificar tipo de estudo
    PATTERNS_TIPO_ESTUDO = {
        "meta_analise": re.compile(r"meta.analys(?:is|is)", re.IGNORECASE),
        "ensaio_fase3": re.compile(
            r"(?:phase\s*3|fase\s*3|fase\s*iii|phase\s*iii|randomi[sz]ed.*double.?blind)",
            re.IGNORECASE
        ),
        "ensaio_fase2": re.compile(r"(?:phase\s*2|fase\s*2|fase\s*ii|phase\s*ii)", re.IGNORECASE),
        "ensaio_fase1": re.compile(r"(?:phase\s*1|fase\s*1|fase\s*i|phase\s*i)", re.IGNORECASE),
        "coorte": re.compile(r"(?:cohort|coorte|prospectiv)", re.IGNORECASE),
        "caso_controle": re.compile(r"(?:case.control|caso.controle)", re.IGNORECASE),
        "revisao_sistematica": re.compile(
            r"(?:systematic review|revisao sistemica|revisao sistematica)",
            re.IGNORECASE
        ),
        "pre_clinico": re.compile(
            r"(?:pre.?clinical|in vitro|in vivo|murine|mouse|animal model|xenograft)",
            re.IGNORECASE
        ),
        "guideline": re.compile(
            r"(?:guideline|diretriz|nccn|asco|esmo|protocolo)", re.IGNORECASE
        ),
    }

    def __init__(self, motor_probabilidade):
        """
        Args:
            motor_probabilidade: Instancia de ProbabilidadeTerapeutica (Camada 1)
        """
        self.motor = motor_probabilidade
        self.historico_conversoes: List[Dict] = []
        self.total_achados_processados = 0
        self.total_atualizacoes_geradas = 0

    def processar_achados_dimhex(
        self,
        achados: List[Dict],
        scores_por_id: Dict[str, Dict],
    ) -> Dict:
        """
        Processa os achados de um ciclo DIMHEX completo,
        extrai evidencias quantitativas e atualiza o motor de probabilidade.

        Returns:
            Relatorio da conversao: quantos achados geraram atualizacoes,
            quais subtipos foram afetados, magnitude dos ajustes.
        """
        self.total_achados_processados += len(achados)
        atualizacoes = []
        detalhes_por_subtipo = {}

        for achado in achados:
            achado_id = achado.get("id_dimhex", "")
            score_info = scores_por_id.get(achado_id, {})
            score_total = score_info.get("score_total", 0.0)

            # Filtrar apenas achados com relevancia clinica significativa
            if score_total < 0.35:
                continue

            # 1. Classificar tipo de evidencia
            tipo_evidencia = self._classificar_tipo_evidencia(achado)
            config_evidencia = self.NIVEIS_EVIDENCIA.get(
                tipo_evidencia, self.NIVEIS_EVIDENCIA["desconhecido"]
            )

            # 2. Mapear para subtipo(s) tumoral(is)
            subtipos = self._mapear_subtipo(achado)

            # 3. Extrair metricas quantitativas
            metricas = self._extrair_metricas(achado)

            # 4. Converter em fator de ajuste bayesiano
            fator_ajuste = self._calcular_fator_ajuste(
                metricas, config_evidencia["forca"], score_total
            )

            if fator_ajuste == 1.0:
                continue  # Sem impacto significativo

            # 5. Determinar linha terapeutica
            linhas = self._inferir_linha(achado, metricas)

            # 6. Atualizar o motor de probabilidade para cada subtipo+linha
            for subtipo in subtipos:
                for linha in linhas:
                    self.motor.adicionar_evidencia(
                        subtipo=subtipo,
                        linha=linha,
                        score_dimhex=score_total,
                        forca_evidencia=config_evidencia["peso"],
                        fator_ajuste=fator_ajuste,
                        fonte=achado.get("_fonte_original", "desconhecida"),
                        resumo=achado.get("titulo", "")[:200],
                    )

                    self.total_atualizacoes_geradas += 1

                    chave_subtipo = f"{subtipo}_L{linha}"
                    if chave_subtipo not in detalhes_por_subtipo:
                        detalhes_por_subtipo[chave_subtipo] = []

                    detalhes_por_subtipo[chave_subtipo].append({
                        "titulo": achado.get("titulo", "")[:100],
                        "fator_ajuste": round(fator_ajuste, 4),
                        "tipo_evidencia": tipo_evidencia,
                        "forca": config_evidencia["forca"],
                        "metricas": metricas,
                        "score_dimhex": round(score_total, 3),
                    })

                    atualizacoes.append({
                        "subtipo": subtipo,
                        "linha": linha,
                        "fator_ajuste": fator_ajuste,
                        "titulo": achado.get("titulo", "")[:100],
                    })

                    self.historico_conversoes.append({
                        "timestamp": datetime.now().isoformat(),
                        "achado_id": achado_id,
                        "subtipo": subtipo,
                        "linha": linha,
                        "fator_ajuste": fator_ajuste,
                        "tipo_evidencia": tipo_evidencia,
                        "metricas": metricas,
                        "score_dimhex": score_total,
                    })

        # Manter historico limitado
        if len(self.historico_conversoes) > 500:
            self.historico_conversoes = self.historico_conversoes[-500:]

        return {
            "achados_relevantes_processados": len([a for a in achados
                if scores_por_id.get(a.get("id_dimhex", ""), {}).get("score_total", 0) >= 0.35]),
            "atualizacoes_geradas": len(atualizacoes),
            "subtipos_afetados": list(detalhes_por_subtipo.keys()),
            "detalhes_por_subtipo": detalhes_por_subtipo,
            "total_acumulado": {
                "achados": self.total_achados_processados,
                "atualizacoes": self.total_atualizacoes_geradas,
            },
            "timestamp": datetime.now().isoformat(),
        }

    def obter_impacto_evidencia(self, subtipo: str, linha: int) -> Dict:
        """
        Retorna o impacto acumulado da evidencia DIMHEX nas probabilidades
        de um subtipo+linha especifico.

        Inclui: prior original vs posterior atualizado.
        """
        posterior = self.motor.obter_posterior(subtipo, linha)
        prior_key = f"{subtipo}_L{linha}"

        # Obter prior original dos dados do motor
        prior_info = self.motor._obter_prior(subtipo, linha)
        prior_original = prior_info["prior"]

        historico_subtipo = [
            h for h in self.historico_conversoes
            if h["subtipo"] == subtipo and h["linha"] == linha
        ]

        # Calcular tendencia de ajuste (positivo = evidencia favoravel)
        if historico_subtipo:
            fatores_recentes = [h["fator_ajuste"] for h in historico_subtipo[-10:]]
            tendencia = np.mean(fatores_recentes)
        else:
            tendencia = 1.0

        return {
            "subtipo": subtipo,
            "linha": linha,
            "prior_original": prior_original,
            "posterior_atualizada": posterior,
            "variacao_absoluta": round((posterior or prior_original) - prior_original, 4) if posterior else 0.0,
            "variacao_percentual": round(
                ((posterior or prior_original) - prior_original) / max(0.01, prior_original) * 100, 2
            ) if posterior else 0.0,
            "tendencia_evidencia": "FAVORAVEL" if tendencia > 1.05 else "DESFAVORAVEL" if tendencia < 0.95 else "NEUTRA",
            "n_evidencias_acumuladas": len(historico_subtipo),
            "ultimas_evidencias": historico_subtipo[-5:],
        }

    # --- Metodos internos ---

    def _classificar_tipo_evidencia(self, achado: Dict) -> str:
        """Classifica o tipo de evidencia com base no texto do achado."""
        texto = " ".join([
            achado.get("titulo", ""),
            achado.get("resumo", ""),
            achado.get("texto", ""),
            achado.get("publication_type", ""),
        ])

        for tipo, pattern in self.PATTERNS_TIPO_ESTUDO.items():
            if pattern.search(texto):
                return tipo

        return "desconhecido"

    def _mapear_subtipo(self, achado: Dict) -> List[str]:
        """Mapeia o achado para subtipos tumorais relevantes."""
        texto = (
            achado.get("titulo", "") + " " +
            achado.get("resumo", "") + " " +
            achado.get("texto", "")
        ).lower()

        subtipos = []
        for subtipo, termos in self.MAPEAMENTO_SUBTIPOS.items():
            for termo in termos:
                if termo in texto:
                    subtipos.append(subtipo)
                    break

        # Se nao encontrou nenhum, atribuir generico
        if not subtipos:
            subtipos = ["NSCLC_KRAS_G12C"]  # fallback

        return subtipos

    def _extrair_metricas(self, achado: Dict) -> Dict:
        """Extrai metricas quantitativas do texto do achado."""
        texto = (
            achado.get("titulo", "") + " " +
            achado.get("resumo", "") + " " +
            achado.get("texto", "") + " " +
            achado.get("abstract", "")
        )

        metricas = {}
        for nome, pattern in self.PATTERNS_METRICAS.items():
            match = pattern.search(texto)
            if match:
                try:
                    valor = float(match.group(1))
                    metricas[nome] = valor
                except (ValueError, IndexError):
                    pass

        return metricas

    def _calcular_fator_ajuste(
        self,
        metricas: Dict,
        forca_evidencia: float,
        score_dimhex: float,
    ) -> float:
        """
        Converte metricas extraidas em fator de ajuste bayesiano.

        Logica:
        - ORR alto -> fator > 1 (aumenta P(resposta))
        - HR favoravel (< 0.8) -> fator > 1
        - P-valor significativo (< 0.05) -> amplifica o ajuste
        - PFS/OS longos -> fator > 1

        O fator final e ponderado pela forca da evidencia e score DIMHEX.
        """
        if not metricas:
            return 1.0  # Sem metricas quantitativas, sem ajuste

        fatores = []

        # ORR: comparar com a media historica (~30% para tumores solidos avancados)
        if "orr" in metricas:
            orr = metricas["orr"] / 100.0  # converter de % para proporcao
            # Fator de Bayes: ratio de verossimilhanca
            # P(dados|eficaz) / P(dados|ineficaz) ~ ORR / ORR_baseline
            fator_orr = orr / 0.30
            fatores.append(fator_orr)

        # HR: < 0.8 = favoravel, < 0.5 = muito favoravel
        if "hr" in metricas:
            hr = metricas["hr"]
            if hr < 1.0:
                # HR favoravel: conversao inversa
                fator_hr = 1.0 + (1.0 - hr) * 2.0
                fatores.append(fator_hr)
            else:
                fator_hr = max(0.5, 2.0 - hr)
                fatores.append(fator_hr)

        # PFS mediana: > 6 meses = bom, > 12 = excelente
        if "pfs_mediana_meses" in metricas:
            pfs = metricas["pfs_mediana_meses"]
            fator_pfs = 0.7 + 0.3 * min(1.0, pfs / 12.0)
            fatores.append(fator_pfs)

        # OS mediana: > 12 meses = bom, > 24 = excelente
        if "os_mediana_meses" in metricas:
            os_meses = metricas["os_mediana_meses"]
            fator_os = 0.7 + 0.3 * min(1.0, os_meses / 24.0)
            fatores.append(fator_os)

        if not fatores:
            return 1.0

        # Media geometrica dos fatores (evita que um unico outlier domine)
        fator_bruto = float(np.exp(np.mean([np.log(max(0.1, f)) for f in fatores])))

        # Modulacao pela forca da evidencia
        fator_ponderado = 1.0 + (fator_bruto - 1.0) * forca_evidencia

        # Modulacao pelo score DIMHEX
        fator_final = 1.0 + (fator_ponderado - 1.0) * score_dimhex

        # Limitar amplitude do ajuste (maximo +/- 50% por achado individual)
        return float(np.clip(fator_final, 0.5, 1.5))

    def _inferir_linha(self, achado: Dict, metricas: Dict) -> List[int]:
        """Infere a(s) linha(s) terapeutica a que o achado se refere."""
        texto = (
            achado.get("titulo", "") + " " +
            achado.get("resumo", "") + " " +
            achado.get("texto", "")
        ).lower()

        # Padroes para linha
        if any(p in texto for p in ["first.line", "primeira linha", "1l ", "linha 1", "naive"]):
            return [1]
        if any(p in texto for p in ["second.line", "segunda linha", "2l ", "linha 2", "pre-treated"]):
            return [2]
        if any(p in texto for p in ["third.line", "terceira linha", "3l ", "linha 3", "refractory", "refratario"]):
            return [3]

        # Se o ORR e muito alto, provavelmente primeira linha
        if metricas.get("orr", 0) > 50:
            return [1, 2]

        # Se mencao de "pre-treated" ou "previously treated"
        if any(p in texto for p in ["previously treated", "tratados previamente", "relapsed"]):
            return [2, 3]

        # Default: aplicavel a todas as linhas
        return [1, 2, 3]

    def obter_resumo(self) -> Dict:
        """Retorna resumo do estado da Camada 2."""
        return {
            "total_achados_processados": self.total_achados_processados,
            "total_atualizacoes_geradas": self.total_atualizacoes_geradas,
            "taxa_conversao": round(
                self.total_atualizacoes_geradas / max(1, self.total_achados_processados), 4
            ),
            "historico_tamanho": len(self.historico_conversoes),
            "versao": "2.0.0",
        }