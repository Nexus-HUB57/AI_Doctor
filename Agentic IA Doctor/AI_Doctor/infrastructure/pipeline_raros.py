"""
DIMHEX — Pipeline Dedicado para Canceres Raros
Termos de busca especializados para 8 canceres raros + neoplasia geral global.
Integra com o RegistroFontesPesquisa existente via injeção de queries.
"""

from typing import List, Dict


# === TERMOS DE BUSCA DEDICADOS — CANCERES RAROS ===
# Cada cancer raro tem termos PubMed + ClinicalTrials otimizados
TERMOS_CANCERES_RAROS_PUBMED = {
    "CANCER_SEIOS_FACE": [
        "sinonasal carcinoma treatment outcome",
        "paranasal sinus cancer immunotherapy",
        "nasal cavity squamous cell carcinoma prognosis",
        "esthesioneuroblastoma biomarker liquid biopsy",
        "head and neck rare cancer targeted therapy",
        "sinonasal adenocarcinoma HPV p16",
        "paranasal sinus cancer survival rate",
    ],
    "CANCER_DUCTO_BILIAR": [
        "cholangiocarcinoma FGFR2 fusion pemigatinib",
        "bile duct cancer IDH1 ivosidenib",
        "cholangiocarcinoma immunotherapy MSI-H",
        "biliary tract cancer liquid biopsy ctDNA",
        "cholangiocarcinoma HER2 trastuzumab",
        "intrahepatic cholangiocarcinoma targeted therapy",
        "klatskin tumor treatment outcome",
    ],
    "CARCINOMA_ADENOIDE_CISTICO": [
        "adenoid cystic carcinoma MYB-NFIB targeted",
        "salivary gland carcinoma lenvatinib",
        "ACC perineural invasion treatment",
        "adenoid cystic carcinoma NOTCH1 inhibitor",
        "salivary gland cancer immunotherapy",
        "ACC lung metastasis systemic therapy",
    ],
    "CANCER_AMIGDALA": [
        "oropharyngeal carcinoma HPV positive treatment",
        "tonsillar cancer p16 immunotherapy de-escalation",
        "HPV driven oropharynx checkpoint inhibitor",
        "oropharyngeal cancer cetuximab radiation",
        "tonsil carcinoma liquid biopsy HPV DNA",
        "SCCHN nivolumabe recurrent",
    ],
    "CANCER_TROMPA_FALOPIO": [
        "fallopian tube carcinoma BRCA PARP",
        "tubal cancer serous carcinoma treatment",
        "fallopian tube cancer PAX8 WT1 biomarker",
        "primary tubal carcinoma platinum sensitivity",
        "fallopian tube cancer CA-125 HE4",
        "tubal carcinoma immunotherapy PARP inhibitor",
    ],
    "CANCER_APPENDICE": [
        "appendiceal cancer HIPEC cytoreductive surgery",
        "carcinoid appendix somatostatin receptor PRRT",
        "appendiceal mucinous neoplasm pseudomyxoma",
        "neuroendocrine appendix Lu-177 DOTATATE",
        "appendix cancer systemic chemotherapy",
        "goblet cell carcinoid appendiceal treatment",
    ],
    "CANCER_PARATIREOIDE": [
        "parathyroid carcinoma CDC73 treatment",
        "malignant hyperparathyroidism cinacalcet",
        "parathyroid cancer lenvatinibe targeted",
        "parathyroid carcinoma surgery outcome",
        "parathyroid hormone PTH carcinoma biomarker",
        "calcium sensing receptor parathyroid malignancy",
    ],
    "CANCER_AMPULAR": [
        "ampullary carcinoma whipple outcome survival",
        "ampulla of vater cancer chemotherapy FOLFIRINOX",
        "ampullary adenocarcinoma KRAS biomarker",
        "periampullary cancer CA 19-9 prognostic",
        "ampullary carcinoma MSI immunotherapy",
        "ampulla vater endoscopic treatment",
    ],
}

TERMOS_CANCERES_RAROS_CLINICALTRIALS = {
    "CANCER_SEIOS_FACE": [
        "sinonasal OR paranasal OR nasal cavity",
        "head and neck rare cancer",
        "esthesioneuroblastoma",
    ],
    "CANCER_DUCTO_BILIAR": [
        "cholangiocarcinoma OR biliary tract",
        "FGFR2 fusion cholangiocarcinoma",
        "IDH1 cholangiocarcinoma",
    ],
    "CARCINOMA_ADENOIDE_CISTICO": [
        "adenoid cystic carcinoma",
        "salivary gland cancer",
        "ACC lenvatinib",
    ],
    "CANCER_AMIGDALA": [
        "oropharyngeal carcinoma HPV",
        "tonsillar cancer immunotherapy",
        "SCCHN checkpoint inhibitor",
    ],
    "CANCER_TROMPA_FALOPIO": [
        "fallopian tube cancer",
        "tubal carcinoma PARP",
        "serous tubal carcinoma",
    ],
    "CANCER_APPENDICE": [
        "appendiceal cancer HIPEC",
        "neuroendocrine appendix PRRT",
        "pseudomyxoma peritonei",
    ],
    "CANCER_PARATIREOIDE": [
        "parathyroid carcinoma",
        "hyperparathyroidism malignant",
        "CDC73 parathyroid",
    ],
    "CANCER_AMPULAR": [
        "ampullary carcinoma",
        "ampulla of vater",
        "periampullary cancer",
    ],
}

# === TERMOS GERAIS DE NEOPLASIA GLOBAL ===
# Expandem a cobertura do sistema para a oncologia como um todo
TERMOS_NEOPLASIA_GLOBAL = [
    # Biópsia líquida avançada
    "liquid biopsy rare cancer biomarker",
    "circulating tumor DNA rare tumor detection",
    "cell-free RNA cancer diagnosis",
    "exosomal DNA cancer monitoring",
    # Terapias emergentes
    "bispecific antibody solid tumor",
    "oncolytic virus cancer therapy",
    "adoptive cell transfer TIL therapy",
    "neoantigen vaccine personalized cancer",
    "CAR-T solid tumor barrier",
    # Mecanismos de resistência
    "tumor microenvironment immune evasion",
    "epithelial mesenchymal transition therapy",
    "cancer stem cell targeting",
    "tumor hypoxia therapeutic resistance",
    # Genômica avançada
    "synthetic lethality PARP cancer",
    "homologous recombination deficiency treatment",
    "tumor mutational signature clinical utility",
    "genomic instability cancer therapy",
    # Biomarcadores emergentes
    "tumor educated platelets cancer",
    "microbiome cancer immunotherapy response",
    "epigenetic biomarker cancer prognosis",
    # Oncologia de precisão em tumores raros
    "rare cancer molecular profiling",
    "NTRK fusion rare tumor",
    "tumor agnostic therapy basket trial",
    "comprehensive genomic profiling rare cancer",
]


def obter_queries_raros_pubmed() -> List[str]:
    """Retorna lista completa de termos PubMed para canceres raros."""
    queries = []
    for termos in TERMOS_CANCERES_RAROS_PUBMED.values():
        queries.extend(termos)
    return queries


def obter_queries_raros_clinicaltrials() -> List[str]:
    """Retorna lista completa de termos ClinicalTrials para canceres raros."""
    queries = []
    for termos in TERMOS_CANCERES_RAROS_CLINICALTRIALS.values():
        queries.extend(termos)
    return queries


def obter_queries_neoplasia_global() -> List[str]:
    """Retorna termos gerais de neoplasia global."""
    return TERMOS_NEOPLASIA_GLOBAL


def obter_todas_queries_expandidas() -> List[str]:
    """Retorna todas as queries expandidas (raros + global) para injeção no ciclo DIMHEX."""
    todas = (
        obter_queries_raros_pubmed() +
        obter_queries_raros_clinicaltrials() +
        obter_queries_neoplasia_global()
    )
    return todas