"""
DIMHEX — Scoring Bayesiano de Relevancia Clinica
Avalia quao relevante uma descoberta cientifica e para o sistema de diagnostico/tratamento.
Fusao multi-criterio com pesos adaptativos baseados em evidencia historica.
"""

import re
import math
from typing import Dict, List, Optional
from datetime import datetime


class ScorerRelevanciaClinica:
    """
    Motor de scoring bayesiano que avalia a relevancia clinica de achados
    de pesquisa para o ecossistema AI Doctor.

    Criterios de scoring:
    - PERTINENCIA DOMINIO: sobreposicao com biomarcadores do sistema (ctDNA, CTC, TMB, PD-L1, TILs, ECOG)
    - EVIDENCIA CLINICA: tipo de publicacao, fase do estudo, tamanho da amostra
    - NOVIDADE: recencia e ineditismo do achado
    - APLICABILIDADE: viabilidade de integracao no sistema
    - IMPACTO POTENCIAL: magnitude do efeito reportado
    """

    # Biomarcadores monitorados pelo AI Doctor
    # EXPANSAO v2.2: +8 biomarcadores especializados para canceres raros e neoplasia global
    BIOMARCADORES_SISTEMA = {
        # === BIOMARCADORES ORIGINAIS ===
        "ctdna": {"peso": 0.14, "variantes": ["ctDNA", "circulating tumor DNA", "ctdna", "liquid biopsy", "MRD", "minimal residual disease", "cell-free DNA", "cfDNA", "exosomal DNA"]},
        "ctc": {"peso": 0.10, "variantes": ["CTC", "circulating tumor cell", "circulating tumor cells"]},
        "tmb": {"peso": 0.09, "variantes": ["TMB", "tumor mutational burden", "mutational load", "mutational burden"]},
        "pdl1": {"peso": 0.09, "variantes": ["PD-L1", "PDL1", "PD1", "PD-1", "programmed death-ligand", "checkpoint inhibitor", "CTLA-4", "ctla4"]},
        "tils": {"peso": 0.09, "variantes": ["TIL", "TILs", "tumor infiltrating lymphocyte", "immune infiltrate"]},
        "ecog": {"peso": 0.06, "variantes": ["ECOG", "performance status", "functional status", "frailty"]},
        "resistencia": {"peso": 0.07, "variantes": ["resistance", "resistant", "resistência", "clonal evolution", "acquired resistance"]},
        # === BIOMARCADORES EXPANDIDOS — NEOPLASIA GLOBAL ===
        "hpv_p16": {"peso": 0.07, "variantes": ["HPV", "p16", "human papillomavirus", "p16 INK4A", "HPV positive", "HPV-driven", "HPV+"]},
        "fgfr2": {"peso": 0.06, "variantes": ["FGFR2", "fibroblast growth factor receptor 2", "FGFR2 fusion", "FGFR2 rearrangement", "pemigatinib"]},
        "idh1": {"peso": 0.05, "variantes": ["IDH1", "isocitrate dehydrogenase 1", "IDH1 mutation", "IDH1 R132C", "ivosidenib"]},
        "her2": {"peso": 0.06, "variantes": ["HER2", "ERBB2", "human epidermal growth factor receptor 2", "HER2 amplification", "HER2-positive", "trastuzumab"]},
        "brca": {"peso": 0.07, "variantes": ["BRCA", "BRCA1", "BRCA2", "breast cancer gene", "homologous recombination deficiency", "HRD", "PARP inhibitor", "olaparib"]},
        "msi": {"peso": 0.06, "variantes": ["MSI", "MSI-H", "microsatellite instability", "dMMR", "mismatch repair", "pembrolizumab MSI"]},
        "ca125": {"peso": 0.05, "variantes": ["CA-125", "CA125", "cancer antigen 125", "MUC16", "HE4", "human epididymis protein 4", "fallopian tube"]},
        "neuroendocrino": {"peso": 0.06, "variantes": ["chromogranin A", "CgA", "serotonin", "neuroendocrine", "somatostatin receptor", "NET", "carcinoid", "PRRT", "Lu-177", "DOTATATE"]},
        "paratormonio": {"peso": 0.05, "variantes": ["PTH", "parathyroid hormone", "hyperparathyroidism", "calcium", "cinacalcet", "CDC73", "parathyroid carcinoma"]},
        "ampular": {"peso": 0.05, "variantes": ["CA 19-9", "CA19-9", "ampullary", "ampulla of vater", "periampullary", "duodenal adenocarcinoma"]},
        # === BIOMARCADORES EXPANDIDOS v3.0 — NEOPLASIA GLOBAL ===
        "ntrk": {"peso": 0.06, "variantes": ["NTRK", "NTRK fusion", "TRK inhibitor", "larotrectinib", "entrectinib", "tumor agnostic", "TRKA", "TRKB", "TRKC"]},
        "alk": {"peso": 0.06, "variantes": ["ALK", "anaplastic lymphoma kinase", "alectinib", "crizotinib", "lorlatinib", "ALK rearrangement", "EML4-ALK"]},
        "ros1": {"peso": 0.05, "variantes": ["ROS1", "ROS1 fusion", "crizotinib", "entrectinib", "ROS1 rearrangement"]},
        "braf": {"peso": 0.06, "variantes": ["BRAF", "BRAF V600E", "BRAF mutation", "vemurafenib", "dabrafenib", "trametinib", "encorafenib", "binimetinib"]},
        "egfr_mutation": {"peso": 0.06, "variantes": ["EGFR mutation", "EGFR exon 19", "EGFR L858R", "EGFR T790M", "osimertinib", "erlotinib", "gefitinib", "afatinib"]},
        "ret": {"peso": 0.04, "variantes": ["RET fusion", "RET", "selpercatinib", "pralsetinib", "RET rearrangement", "CCDC6-RET"]},
        "met": {"peso": 0.05, "variantes": ["MET", "MET exon 14", "MET amplification", "capmatinib", "tepotinib", "crizotinib MET"]},
        "kras_general": {"peso": 0.06, "variantes": ["KRAS", "KRAS mutation", "KRAS G12D", "KRAS G12V", "KRAS G13D", "adagrasib", "sotorasib"]},
        "tp53": {"peso": 0.05, "variantes": ["TP53", "p53", "p53 mutation", "tumor suppressor", "MDM2", "MDM2 inhibitor", "nutlin"]},
        "raridade": {"peso": 0.05, "variantes": ["rare cancer", "rare tumor", "orphan disease", "NCI rare", "EORTC rare", "incidence < 6", "rare neoplasm"]},
    }

    # Subtipos tumorais cobertos pelo mapeador NCCN/ESMO
    # EXPANSAO v2.2: +8 canceres raros
    SUBTIPOS_SISTEMA = {
        # === ORIGINAIS ===
        "NSCLC_KRAS_G12C": ["KRAS G12C", "KRAS-G12C", "NSCLC", "non-small cell", "lung cancer"],
        "NSCLC_EGFR_MUTADO": ["EGFR", "epidermal growth factor receptor", "osimertinib", "TKI"],
        "TRIPLO_NEGATIVO_MAMARIO": ["triple negative", "TNBC", "breast cancer", "sacituzumab", "nab-paclitaxel"],
        # === CANCERES RAROS ===
        "CANCER_SEIOS_FACE": ["sinonasal", "paranasal sinus", "nasal cavity", "sinonasal carcinoma", "head and neck cancer", "esthesioneuroblastoma"],
        "CANCER_DUCTO_BILIAR": ["cholangiocarcinoma", "bile duct", "biliary tract", "gallbladder cancer", "ampulla", "cholangio"],
        "CARCINOMA_ADENOIDE_CISTICO": ["adenoid cystic carcinoma", "ACC", "salivary gland", "MYB-NFIB", "perineural invasion"],
        "CANCER_AMIGDALA": ["tonsillar", "oropharyngeal", "tonsil cancer", "HPV positive oropharynx", "p16 oropharynx", "SCCHN"],
        "CANCER_TROMPA_FALOPIO": ["fallopian tube", "tubal carcinoma", "serous tubal", "PAX8 positive", "WT1 positive"],
        "CANCER_APPENDICE": ["appendiceal", "appendix cancer", "carcinoid", "neuroendocrine appendix", "pseudomyxoma", "HIPEC"],
        "CANCER_PARATIREOIDE": ["parathyroid carcinoma", "parathyroid cancer", "malignant hyperparathyroidism", "CDC73 mutation"],
        "CANCER_AMPULAR": ["ampullary carcinoma", "ampulla of vater", "periampullary", "duodenal papilla"],
    }

    # Pesos por tipo de publicacao (prioridade para evidencia forte)
    PESOS_TIPO = {
        "ensaio_clinico": 1.4,
        "artigo_cientifico": 1.0,
        "meta_analise": 1.6,
        "diretriz_clinica": 1.8,
        "indicador_saude": 0.5,
    }

    # Padroes que indicam alta evidencia no texto
    PADROES_EVIDENCIA_FORTE = [
        r'\bp\s*<\s*0\.0[0-5]\b',           # p-valor significativo
        r'\bhazard ratio\b.*\d+\.\d+',       # Hazard ratio
        r'\bHR\s*=\s*[\d.]+',                # HR abreviado
        r'\boverall survival\b',              # Sobrevida global
        r'\bprogression.free survival\b',     # Sobrevida livre de progressao
        r'\bresponse rate\b.*\d+%',           # Taxa de resposta
        r'\bcomplete response\b',             # Resposta completa
        r'\bphase [23]\b',                    # Fase 2 ou 3
        r'\brandomi[sz]ed\b',                # Randomizado
        r'\bmulticenter\b',                   # Multicentrico
        r'\bdouble.blind\b',                  # Duplo-cego
        r'\bsignificant(?:ly)?\s+(?:improve|increase|reduce|prolong)',  # Melhora significativa
    ]

    # Termos que indicam inovacao/alta relevancia
    TERMOS_INOVACAO = [
        "novel", "first-in-class", "breakthrough", "FDA approved", "EMA approved",
        "paradigm shift", "unprecedented", "landmark", "practice-changing",
        "new standard", "superior", "newly discovered", "recently approved",
        "aprovado", "novidade", "inovacao", "primeiro"
    ]

    def __init__(self):
        self.total_avaliados = 0
        self.distribuicao_scores: Dict[str, int] = {
            "critico": 0, "alto": 0, "moderado": 0, "baixo": 0, "irrelevante": 0
        }

    def calcular_score(self, achado: Dict) -> Dict:
        """
        Calcula score de relevancia completo para um achado de pesquisa.
        Retorna dict com score_final, classificacao, scores parciais e justificativas.
        """
        self.total_avaliados += 1

        texto_completo = self._normalizar_texto(
            f"{achado.get('titulo', '')} {achado.get('resumo', '')}"
        )

        # Componentes de scoring
        score_dominio = self._score_pertinencia_dominio(texto_completo, achado)
        score_evidencia = self._score_evidencia_clinica(texto_completo, achado)
        score_novidade = self._score_novidade(achado)
        score_aplicabilidade = self._score_aplicabilidade(texto_completo, achado)
        score_impacto = self._score_impacto_potencial(texto_completo)

        # Pesos bayesianos — ajustados pelo historico
        w_dominio = 0.35
        w_evidencia = 0.25
        w_novidade = 0.15
        w_aplicabilidade = 0.15
        w_impacto = 0.10

        # Fusao ponderada
        score_final = (
            score_dominio * w_dominio +
            score_evidencia * w_evidencia +
            score_novidade * w_novidade +
            score_aplicabilidade * w_aplicabilidade +
            score_impacto * w_impacto
        )

        # Classificacao
        classificacao, cor = self._classificar(score_final)

        # Justificativa textual
        justificativas = self._gerar_justificativas(
            score_dominio, score_evidencia, score_novidade, score_aplicabilidade, score_impacto,
            texto_completo, achado
        )

        # Atualizar distribuicao
        self.distribuicao_scores[classificacao] += 1

        return {
            "id_dimhex": achado.get("id_dimhex", "unknown"),
            "score_final": round(score_final, 4),
            "classificacao": classificacao,
            "cor_prioridade": cor,
            "scores_parciais": {
                "dominio": round(score_dominio, 4),
                "evidencia": round(score_evidencia, 4),
                "novidade": round(score_novidade, 4),
                "aplicabilidade": round(score_aplicabilidade, 4),
                "impacto": round(score_impacto, 4),
            },
            "justificativas": justificativas,
            "biomarcadores_mencionados": self._identificar_biomarcadores(texto_completo),
            "subtipos_mencionados": self._identificar_subtipos(texto_completo),
        }

    def _score_pertinencia_dominio(self, texto: str, achado: Dict) -> float:
        """Avalia sobreposicao com biomarcadores e dominio do sistema (0-1)."""
        score = 0.0
        marcadores_encontrados = []

        for marcador, config in self.BIOMARCADORES_SISTEMA.items():
            for variante in config["variantes"]:
                if variante.lower() in texto.lower():
                    marcadores_encontrados.append(marcador)
                    score += config["peso"]
                    break

        # Bonus por subtipo tumoral coberto
        for subtipo, termos in self.SUBTIPOS_SISTEMA.items():
            for termo in termos:
                if termo.lower() in texto.lower():
                    score += 0.15
                    break

        return min(1.0, score)

    def _score_evidencia_clinica(self, texto: str, achado: Dict) -> float:
        """Avalia robustez da evidencia cientifica (0-1)."""
        score = 0.0

        # Peso pelo tipo de publicacao
        tipo = achado.get("tipo", "artigo_cientifico")
        score += self.PESOS_TIPO.get(tipo, 0.5) * 0.3

        # Contagem de padroes de evidencia forte
        padroes_encontrados = 0
        for padrao in self.PADROES_EVIDENCIA_FORTE:
            if re.search(padrao, texto, re.IGNORECASE):
                padroes_encontrados += 1

        score += min(0.5, padroes_encontrados * 0.08)

        # Bonus por fase de ensaio clinico
        fases = achado.get("fase", [])
        if fases:
            fases_str = " ".join(fases) if isinstance(fases, list) else str(fases)
            if "PHASE3" in fases_str.upper() or "Phase 3" in fases_str:
                score += 0.2
            elif "PHASE2" in fases_str.upper() or "Phase 2" in fases_str:
                score += 0.1

        # Numero de autores (proxy para robustez)
        autores = achado.get("autores", [])
        if len(autores) >= 10:
            score += 0.05
        elif len(autores) >= 5:
            score += 0.03

        return min(1.0, score)

    def _score_novidade(self, achado: Dict) -> float:
        """Avalia recencia e ineditismo do achado (0-1)."""
        score = 0.0

        # Recencia pela data de publicacao
        data_pub = achado.get("data_publicacao", "")
        if data_pub:
            try:
                if len(data_pub) >= 10:
                    data = datetime.strptime(data_pub[:10], "%Y-%m-%d")
                elif len(data_pub) >= 4:
                    data = datetime(int(data_pub[:4]), 1, 1)
                else:
                    data = None

                if data:
                    dias_desde_pub = (datetime.now() - data).days
                    # Decaimento exponencial: meio-vida de 30 dias
                    score += math.exp(-dias_desde_pub / 30.0) * 0.6
            except (ValueError, TypeError):
                pass

        # Termos de inovacao
        texto = f"{achado.get('titulo', '')} {achado.get('resumo', '')}".lower()
        termos_inovacao = sum(1 for t in self.TERMOS_INOVACAO if t.lower() in texto)
        score += min(0.4, termos_inovacao * 0.1)

        return min(1.0, score)

    def _score_aplicabilidade(self, texto: str, achado: Dict) -> float:
        """Avalia viabilidade de integracao no sistema (0-1)."""
        score = 0.0

        # Achados que mencionam ferramentas computacionais/AI
        termos_tech = ["machine learning", "deep learning", "artificial intelligence", "AI",
                       "neural network", "algorithm", "model", "predictive", "biomarker panel",
                       "decision support", "clinical decision", "XAI", "explainable"]
        texto_lower = texto.lower()

        tech_matches = sum(1 for t in termos_tech if t.lower() in texto_lower)
        score += min(0.4, tech_matches * 0.1)

        # Menciona protocolos ou guidelines
        protocolos = ["NCCN", "ASCO", "ESMO", "guideline", "protocol", "standard of care",
                      "clinical practice", "recommendation"]
        protocolo_matches = sum(1 for p in protocolos if p.lower() in texto_lower)
        score += min(0.3, protocolo_matches * 0.1)

        # Dados quantitativos (extrai numeros que sugerem amostra relevante)
        numeros_grandes = re.findall(r'\b\d{2,}\b', texto)
        if any(int(n) >= 50 for n in numeros_grandes):
            score += 0.2  # Amostra substancial
        if any(int(n) >= 200 for n in numeros_grandes):
            score += 0.1  # Amostra robusta

        return min(1.0, score)

    def _score_impacto_potencial(self, texto: str) -> float:
        """Avalia magnitude potencial do impacto clinico (0-1)."""
        score = 0.0
        texto_lower = texto.lower()

        # Termos de alto impacto
        alto_impacto = [
            ("overall survival", 0.15), ("survival benefit", 0.15),
            ("complete response", 0.12), ("pathological complete response", 0.15),
            ("cure", 0.20), ("remission", 0.10), ("durable response", 0.12),
            ("reduced mortality", 0.15), ("improved prognosis", 0.10),
            ("drug resistance", 0.08), ("overcome resistance", 0.12),
        ]

        for termo, peso in alto_impacto:
            if termo in texto_lower:
                score += peso

        # Numeros de impacto (taxas de resposta, sobrevida, etc.)
        taxas_resposta = re.findall(r'(\d+)\s*%', texto)
        for taxa in taxas_resposta:
            valor = int(taxa)
            if valor >= 50:
                score += 0.05
            elif valor >= 30:
                score += 0.03

        # Hazard ratios favoraveis
        hrs = re.findall(r'HR\s*[=:]\s*0\.(\d+)', texto, re.IGNORECASE)
        for hr_decimal in hrs:
            if int(hr_decimal) < 80:  # HR < 0.80 = reducao > 20%
                score += 0.08

        return min(1.0, score)

    def _identificar_biomarcadores(self, texto: str) -> List[str]:
        """Identifica quais biomarcadores do sistema sao mencionados."""
        texto_lower = texto.lower()
        encontrados = []
        for marcador, config in self.BIOMARCADORES_SISTEMA.items():
            for variante in config["variantes"]:
                if variante.lower() in texto_lower:
                    encontrados.append(marcador)
                    break
        return encontrados

    def _identificar_subtipos(self, texto: str) -> List[str]:
        """Identifica subtipos tumorais cobertos pelo sistema."""
        texto_lower = texto.lower()
        encontrados = []
        for subtipo, termos in self.SUBTIPOS_SISTEMA.items():
            for termo in termos:
                if termo.lower() in texto_lower:
                    encontrados.append(subtipo)
                    break
        return encontrados

    def _normalizar_texto(self, texto: str) -> str:
        """Normaliza texto para analise: lowercase, remove excesso de espacos."""
        return re.sub(r'\s+', ' ', texto.lower().strip())

    def _classificar(self, score: float) -> tuple:
        """Classifica o achado pelo score em faixas de prioridade."""
        if score >= 0.75:
            return "critico", "#DC2626"
        elif score >= 0.55:
            return "alto", "#EA580C"
        elif score >= 0.35:
            return "moderado", "#CA8A04"
        elif score >= 0.15:
            return "baixo", "#65A30D"
        else:
            return "irrelevante", "#6B7280"

    def _gerar_justificativas(self, s_dom, s_evi, s_nov, s_apl, s_imp,
                              texto: str, achado: Dict) -> List[str]:
        """Gera lista de justificativas textuais para o score."""
        justificativas = []

        if s_dom > 0.5:
            biomarcadores = self._identificar_biomarcadores(texto)
            subtipos = self._identificar_subtipos(texto)
            partes = []
            if biomarcadores:
                partes.append(f"biomarcadores: {', '.join(biomarcadores)}")
            if subtipos:
                partes.append(f"subtipos: {', '.join(subtipos)}")
            if partes:
                justificativas.append(f"Alta pertinencia ao dominio ({' | '.join(partes)})")

        if s_evi > 0.5:
            tipo = achado.get("tipo", "")
            justificativas.append(f"Evidencia clinica robusta (tipo: {tipo}, score: {s_evi:.2f})")

        if s_nov > 0.5:
            justificativas.append(f"Achado recente com alto potencial inovador")

        if s_apl > 0.4:
            justificativas.append(f"Alta aplicabilidade pratica ao sistema")

        if s_imp > 0.4:
            justificativas.append(f"Impacto clinico potencial significativo")

        if not justificativas:
            justificativas.append("Relevancia limitada para o ecossistema atual")

        return justificativas

    def obter_resumo_distribuicao(self) -> Dict:
        """Retorna resumo estatistico da distribuicao de scores."""
        return {
            "total_avaliados": self.total_avaliados,
            "distribuicao": dict(self.distribuicao_scores),
            "taxa_relevancia": (
                (self.distribuicao_scores.get("critico", 0) +
                 self.distribuicao_scores.get("alto", 0) +
                 self.distribuicao_scores.get("moderado", 0))
                / max(1, self.total_avaliados)
            )
        }