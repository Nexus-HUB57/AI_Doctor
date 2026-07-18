from typing import Dict, Any

class MapeadorNCCNASCO:
    """
    Mapeador de protocolos terapeuticos NCCN/ASCO expandido.
    
    Inclui:
    - 3 subtipos originais (NSCLC KRAS-G12C, NSCLC EGFR, TNBC)
    - 8 canceres raros com protocolos especializados
    - Classes terapeuticas adicionais para tumores raros
    
    Fontes: NCCN 2024, ESMO Guidelines, NCI PDQ, meta-analises especializadas
    """

    GUIAS = {
        # === SUBTIPOS ORIGINAIS ===
        "NSCLC_KRAS_G12C": {
            1: {"esquema": "Pembrolizumabe + Carboplatina + Pemetrexede", "classe": "Imunoterapia + Platina"},
            2: {"esquema": "Sotorasibe (960mg VO/dia)", "classe": "Inibidor Alvo KRAS G12C"},
            3: {"esquema": "Docetaxel + Ramucirumabe", "classe": "Antiangiogenica"}
        },
        "NSCLC_EGFR_MUTADO": {
            1: {"esquema": "Osimertinibe 80mg VO/dia", "classe": "Inibidor TKI EGFR 3a Geracao"},
            2: {"esquema": "Pembrolizumabe + Carboplatina + Pemetrexede", "classe": "Imunoterapia + Platina"},
            3: {"esquema": "Docetaxel + Ramucirumabe", "classe": "Antiangiogenica"}
        },
        "TRIPLO_NEGATIVO_MAMARIO": {
            1: {"esquema": "Pembrolizumabe + Paclitaxel Nab", "classe": "Imunoterapia + Quimio"},
            2: {"esquema": "Sacituzumabe Govitecan", "classe": "Conjugado Anticorpo-Farmaco (ADC)"},
            3: {"esquema": "Eribulina", "classe": "Quimioterapia Citotoxica"}
        },
        # === CANCERES RAROS — PROTOCOLOS ESPECIALIZADOS ===
        "CANCER_SEIOS_FACE": {
            1: {"esquema": "Cirurgia + Radioterapia Adjuvante (60-66 Gy)", "classe": "Cirurgia + Radioterapia Adjuvante"},
            2: {"esquema": "Cisplatina + Docetaxel (quimiorradiacao)", "classe": "Quimiorradiacao Concurrente"},
            3: {"esquema": "Nivolumabe (monoterapia)", "classe": "Imunoterapia Isolada"},
            "biomarcadores_relevantes": ["EGFR", "HPV", "PD-L1", "p53"],
            "desafio_diagnostico": "Variedade histologica extensa; confusao com linfoma/sarcoma",
        },
        "CANCER_DUCTO_BILIAR": {
            1: {"esquema": "Gemcitabina + Cisplatina (ABC-02)", "classe": "Quimioterapia Baseada em Platina"},
            2: {"esquema": "FOLFIRINOX", "classe": "Quimioterapia Citotoxica"},
            3: {"esquema": "Lenvatinibe + Pembrolizumabe", "classe": "Anti-angiogenico + Quimioterapia"},
            "biomarcadores_relevantes": ["FGFR2", "IDH1", "BRAF", "HER2", "MSI-H"],
            "desafio_diagnostico": "Bilirrubina elevada mascara sintomas; sobreposicao com colangite",
        },
        "CARCINOMA_ADENOIDE_CISTICO": {
            1: {"esquema": "Cirurgia com margem ampla + Radioterapia", "classe": "Cirurgia + Radioterapia Adjuvante"},
            2: {"esquema": "Lenvatinibe 24mg VO/dia", "classe": "Terapia Alvo Multi-quinase"},
            3: {"esquema": "Quimioterapia palliativa (Cisplatina + Doxorrubicina)", "classe": "Quimioterapia Baseada em Platina"},
            "biomarcadores_relevantes": ["MYB-NFIB", "MYBL1", "EGFR", "KIT", "NOTCH1"],
            "desafio_diagnostico": "Crescimento lento com metastases tardias (pulmao > 10 anos); perineural invasao silenciosa",
        },
        "CANCER_AMIGDALA": {
            1: {"esquema": "Cisplatina + Radioterapia (70 Gy)", "classe": "Quimiorradiacao Concurrente"},
            2: {"esquema": "Nivolumabe/Pembrolizumabe", "classe": "Imunoterapia Isolada"},
            3: {"esquema": "Docetaxel + Cetuximabe", "classe": "Quimioterapia Baseada em Platina"},
            "biomarcadores_relevantes": ["HPV p16", "PD-L1", "EGFR", "TP53", "CDKN2A"],
            "desafio_diagnostico": "Distinguisher carcinoma HPV+ vs HPV-; sobreposicao com linfoma",
        },
        "CANCER_TROMPA_FALOPIO": {
            1: {"esquema": "Carboplatina + Paclitaxel (protocolo ovariano)", "classe": "Quimioterapia Baseada em Platina"},
            2: {"esquema": "Pembrolizumabe + Niraparibe", "classe": "Imunoterapia Isolada"},
            3: {"esquema": "Liposomal Doxorrubicina + Topotecano", "classe": "Quimioterapia Citotoxica"},
            "biomarcadores_relevantes": ["CA-125", "HE4", "BRCA1/2", "TP53", "WT1", "PAX8"],
            "desafio_diagnostico": "Indistinguivel de carcinoma ovariano avancado; diagnostico frequentemente pos-operatorio",
        },
        "CANCER_APPENDICE": {
            1: {"esquema": "Cirurgia citoredutora + HIPEC (Mitomicina C)", "classe": "Cirurgia + Radioterapia Adjuvante"},
            2: {"esquema": "Fluorouracil + Oxaliplatina + Bevacizumabe", "classe": "Anti-angiogenico + Quimioterapia"},
            3: {"esquema": "Lu-177 DOTATATE (PRRT)", "classe": "PRRT (Lu-177)"},
            "biomarcadores_relevantes": ["Cromogranina A", "Serotonina", "CK20", "GDGF", "MSI-H"],
            "desafio_diagnostico": "Muitas vezes achado incidental em apendicectomia; confusao carcinóide vs adenocarcinoma",
        },
        "CANCER_PARATIREOIDE": {
            1: {"esquema": "Paratiroidectomia total + Linfadenectomia", "classe": "Cirurgia + Radioterapia Adjuvante"},
            2: {"esquema": "Cinacalcet + Lenvatinibe", "classe": "Inibidor mTOR + Quimioterapia"},
            3: {"esquema": "Denosumabe (anti-reabsorcao)", "classe": "Terapia Alvo Multi-quinase"},
            "biomarcadores_relevantes": ["PTH", "Calcio ionico", "PTHrP", "CDC73", "CASR"],
            "desafio_diagnostico": "Distinguisher adenoma vs carcinoma; PTH elevada nao diferencia benigno/maligno",
        },
        "CANCER_AMPULAR": {
            1: {"esquema": "Whipple + Gemcitabina adjuvante", "classe": "Cirurgia + Radioterapia Adjuvante"},
            2: {"esquema": "FOLFIRINOX ou Gemcitabina + Cisplatina", "classe": "Quimioterapia Baseada em Platina"},
            3: {"esquema": "Pembrolizumabe (se MSI-H/dMMR)", "classe": "Imunoterapia Isolada"},
            "biomarcadores_relevantes": ["CA 19-9", "CEA", "KRAS", "TP53", "SMAD4", "CDX2"],
            "desafio_diagnostico": "Distinguisher ampular vs pancreas head vs ducto biliar distal; icteria obstrutiva como primeiro sinal",
        },
    }

    @classmethod
    def selecionar_esquema(cls, subtipo: str, linha: int) -> Dict[str, Any]:
        """Seleciona esquema terapeutico baseado em subtipo tumoral e linha."""
        target_subtipo = subtipo if subtipo in cls.GUIAS else "NSCLC_KRAS_G12C"
        target_linha = min(3, max(1, linha))
        guia = cls.GUIAS[target_subtipo]
        resultado = guia[target_linha]
        return resultado

    @classmethod
    def obter_biomarcadores_relevantes(cls, subtipo: str) -> list:
        """Retorna lista de biomarcadores relevantes para o subtipo."""
        guia = cls.GUIAS.get(subtipo, {})
        return guia.get("biomarcadores_relevantes", ["ctDNA", "PD-L1", "TMB"])

    @classmethod
    def obter_desafio_diagnostico(cls, subtipo: str) -> str:
        """Retorna o desafio diagnostico principal do subtipo."""
        guia = cls.GUIAS.get(subtipo, {})
        return guia.get("desafio_diagnostico", "Desafio diagnostico nao especificado")

    @classmethod
    def listar_subtipos_disponiveis(cls) -> Dict[str, list]:
        """Retorna todos os subtipos tumorais disponiveis com suas linhas."""
        return {
            subtipo: list(guia.keys())
            for subtipo, guia in cls.GUIAS.items()
        }