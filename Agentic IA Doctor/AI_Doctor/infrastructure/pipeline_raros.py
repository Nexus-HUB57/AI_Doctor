"""
DIMHEX — Pipeline Dedicado para Canceres Raros e Comuns
Termos de busca especializados para 8 canceres raros + 27 subtipos comuns + neoplasia geral global.
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


# === TERMOS DE BUSCA DEDICADOS — CANCERES COMUNS ===
# 27 subtipos de canceres comuns com termos PubMed + ClinicalTrials otimizados
TERMOS_CANCERES_COMUNS_PUBMED = {
    "MAMA_HER2_POSITIVO": [
        "HER2 positive breast cancer trastuzumab pertuzumab",
        "trastuzumab deruxtecan DESTINY-Breast03",
        "HER2 breast cancer T-DM1 KATHERINE",
        "HER2 low breast cancer trastuzumab",
        "tucatinib HER2 breast cancer",
    ],
    "MAMA_HR_POSITIVO_LUMINAL": [
        "CDK4/6 inhibitor hormone receptor breast cancer",
        "palbociclib ribociclib abemaciclib luminal",
        "alpelisib PIK3CA breast cancer SOLAR-1",
        "endocrine therapy resistance ESR1 mutation",
        "selective estrogen receptor degrader breast",
    ],
    "PROSTATA_HORMOSSENSIVEL": [
        "hormone sensitive prostate cancer ADT docetaxel",
        "abiraterone LATITUDE prostate cancer",
        "PSA screening prostate cancer guideline",
        "radical prostatectomy outcomes",
        "prostate cancer germline BRCA testing",
    ],
    "PROSTATA_CASTRACAO_RESISTENTE": [
        "castration resistant prostate cancer CRPC treatment",
        "177Lu-PSMA-617 Pluvicto VISION trial",
        "olaparib prostate cancer PROfound HRR",
        "enzalutamide apalutamide darolutamide CRPC",
        "PSMA PET imaging prostate cancer staging",
    ],
    "PANCREAS_PDAC": [
        "pancreatic ductal adenocarcinoma FOLFIRINOX",
        "gemcitabine nab-paclitaxel pancreatic cancer",
        "KRAS G12D pancreatic cancer targeted therapy",
        "BRCA pancreatic cancer olaparib POLO",
        "neoadjuvant pancreatic cancer PRODIGE 24",
    ],
    "PANCREAS_NEUROENDOCRINO": [
        "pancreatic neuroendocrine tumor PanNET",
        "everolimus somatostatin analog pancreatic NET",
        "Lu-177 DOTATATE NETTER-1 pancreatic",
        "sunitinib pancreatic neuroendocrine",
        "chromogranin A pancreatic NET biomarker",
    ],
    "CEREBRO_GBM": [
        "glioblastoma temozolomide Stupp protocol",
        "tumor treating fields glioblastoma EF-14",
        "bevacizumab glioblastoma recurrent",
        "MGMT methylation glioblastoma prognosis",
        "CAR-T EGFRvIII glioblastoma",
    ],
    "CEREBRO_ASTROCITOMA_IDH": [
        "vorasidenib IDH mutant glioma INDIGO",
        "IDH1 glioma 2-hydroxyglutarate biomarker",
        "low grade glioma 1p19q oligodendroglioma",
        "ivosidenib AG-120 IDH1 glioma",
        "WHO 2021 glioma classification molecular",
    ],
    "CEREBRO_MEDULOBLASTOMA": [
        "medulloblastoma molecular subgroups WNT SHH",
        "craniospinal irradiation medulloblastoma",
        "vismodegib SHH medulloblastoma",
        "medulloblastoma CSF ctDNA liquid biopsy",
        "SIOP PNET 5 medulloblastoma risk stratified",
    ],
    "FIGADO_HCC": [
        "atezolizumab bevacizumab HCC IMbrave150",
        "durvalumab tremelimumab HIMALAYA HCC",
        "lenvatinib HCC REFLECT sorafenib",
        "TACE hepatocellular carcinoma BCLC",
        "AFP biomarker HCC prognosis",
    ],
    "SANGUE_LINFOMA_DLBCL": [
        "diffuse large B-cell lymphoma R-CHOP POLARIX",
        "CAR-T DLBCL axicabtagene ZUMA-1",
        "double hit lymphoma MYC BCL2 treatment",
        "DLBCL ctDNA MRD monitoring",
        "bispecific CD20 CD3 lymphoma",
    ],
    "SANGUE_LINFOMA_FOLICULAR": [
        "follicular lymphoma CAR-T ZUMA-5",
        "mosunetuzumab bispecific follicular lymphoma",
        "obinutuzumab GALLIUM follicular lymphoma",
        "tazemetostat EZH2 follicular lymphoma",
        "POD24 follicular lymphoma prognosis",
    ],
    "SANGUE_MIELOMA_MULTIPL0": [
        "multiple myeloma quadlet D-VRd PERSEUS",
        "BCMA CAR-T idecabtagene myeloma KarMMa",
        "teclistamab bispecific BCMA myeloma",
        "MRD multiple myeloma deep remission",
        "daratumumab bortezomib lenalidomide myeloma",
    ],
    "SANGUE_LEUCEMIA_MIELOIDE_AGLA": [
        "venetoclax azacitidine AML VIALE-A",
        "FLT3 inhibitor gilteritinib AML",
        "IDH inhibitor AML ivosidenib enasidenib",
        "TP53 mutated AML prognosis treatment",
        "acute myeloid leukemia 7+3 cytarabine",
    ],
    "MEDULAR_MDS": [
        "myelodysplastic syndrome azacitidine treatment",
        "luspatercept MEDALIST ring sideroblast",
        "TP53 mutated MDS eprenetapopt COMMANDS",
        "IPSS-R MDS risk stratification",
        "SF3B1 splicing factor myelodysplasia",
    ],
    "GI_COLORRETAL_MSI_H": [
        "MSI-H colorectal cancer pembrolizumab KEYNOTE-177",
        "microsatellite instability colorectal immunotherapy",
        "BRAF V600E colorectal encorafenib",
        "TAS-102 bevacizumab SUNLIGHT colorectal",
        "Lynch syndrome colorectal screening",
    ],
    "GI_GASTRICO_HER2": [
        "HER2 gastric cancer trastuzumab KEYNOTE-811",
        "trastuzumab deruxtecan gastric DESTINY-Gastric01",
        "CLDN18.2 zolbetuximab GLOW gastric",
        "FLOT perioperative gastric cancer",
        "gastric cancer ctDNA monitoring",
    ],
    "GI_ESOFAGO": [
        "esophageal cancer CROSS neoadjuvant",
        "nivolumab esophageal CheckMate 577 adjuvant",
        "pembrolizumab esophageal KEYNOTE-590",
        "trastuzumab deruxtecan esophageal DESTINY-Esophageal",
        "esophageal cancer ctDNA minimal residual disease",
    ],
    "PELE_MELANOMA_BRAF": [
        "BRAF melanoma dabrafenib trametinib COMBI",
        "nivolumab ipilimumab melanoma CheckMate 067",
        "DREAMseq melanoma BRAF sequencing",
        "relatlimabe LAG-3 melanoma RELATIVITY",
        "melanoma ctDNA MRD monitoring",
    ],
    "PELE_MELANOMA_CUTANEO": [
        "cutaneous melanoma immunotherapy first-line",
        "TIL therapy lifileucel melanoma",
        "T-VEC oncolytic virus melanoma",
        "melanoma NRAS targeted therapy",
        "adjuvant pembrolizumab melanoma KEYNOTE-054",
    ],
    "GU_RENAL_CELULAR": [
        "nivolumab cabozantinib renal cell CheckMate 9ER",
        "pembrolizumab axitinib renal cell KEYNOTE-426",
        "belzutifano HIF-2 alpha renal cell LITESPARK",
        "VHL mutation clear cell renal carcinoma",
        "IMDC risk renal cell carcinoma stratification",
    ],
    "GU_BEXIGA_UROTELIAL": [
        "enfortumab vedotin pembrolizumab EV-302 urothelial",
        "erdafitinib FGFR3 bladder cancer",
        "BCG bladder cancer non-muscle invasive",
        "JAVELIN Bladder 100 avelumab urothelial",
        "sacituzumab govitecan urothelial TROPION",
    ],
    "GINECOLOGICO_CERVICAL_HPV": [
        "HPV cervical cancer pembrolizumab KEYNOTE-826",
        "tisotumab vedotin cervical cancer InnovaTV",
        "chemoradiation cervical cancer standard",
        "HPV vaccination cervical cancer prevention",
        "fertility sparing cervical cancer conization",
    ],
    "ENDOCRINO_TIREOIDE": [
        "lenvatinib thyroid cancer SELECT trial",
        "selpercatinib RET thyroid LIBRETTO-001",
        "BRAF V600E anaplastic thyroid cancer",
        "NTRK fusion thyroid larotrectinib",
        "I-131 radioactive iodine thyroid refractory",
    ],
    "PLEURAL_MESOTELIOMA": [
        "nivolumab ipilimumab mesothelioma CheckMate 743",
        "pemetrexed cisplatin mesothelioma",
        "asbestos mesothelioma latency risk",
        "BAP1 mesothelioma prognosis biomarker",
        "mesothelin fibulin-3 mesothelioma biomarker",
    ],
    "OSSEO_OSTEOSARCOMA": [
        "osteosarcoma MAP protocol methotrexate doxorubicin",
        "EURAMOS-1 osteosarcoma interferon",
        "mifamurtide osteosarcoma L-MTP-PE",
        "GD2 CAR-T osteosarcoma immunotherapy",
        "osteosarcoma ctDNA recurrence monitoring",
    ],
    "OSSEO_SARCOMA_EWING": [
        "Ewing sarcoma VDC IE chemotherapy protocol",
        "EWS-FLI1 translocation Ewing sarcoma",
        "high dose chemotherapy stem cell Ewing",
        "larotrectinib NTRK Ewing sarcoma",
        "trabectedin Ewing sarcoma refractory",
    ],
}

TERMOS_CANCERES_COMUNS_CLINICALTRIALS = {
    "MAMA_HER2_POSITIVO": ["HER2 breast", "trastuzumab breast", "T-DXd breast"],
    "MAMA_HR_POSITIVO_LUMINAL": ["CDK4/6 breast", "hormone receptor breast", "PIK3CA breast"],
    "PROSTATA_HORMOSSENSIVEL": ["prostate cancer", "ADT prostate", "docetaxel prostate"],
    "PROSTATA_CASTRACAO_RESISTENTE": ["CRPC", "PSMA-617", "PARP prostate"],
    "PANCREAS_PDAC": ["pancreatic cancer", "FOLFIRINOX", "nab-paclitaxel"],
    "PANCREAS_NEUROENDOCRINO": ["pancreatic neuroendocrine", "PanNET", "somatostatin"],
    "CEREBRO_GBM": ["glioblastoma", "GBM", "temozolomide"],
    "CEREBRO_ASTROCITOMA_IDH": ["IDH glioma", "low grade glioma", "vorasidenib"],
    "CEREBRO_MEDULOBLASTOMA": ["medulloblastoma", "SHH medulloblastoma", "craniospinal"],
    "FIGADO_HCC": ["hepatocellular carcinoma", "HCC", "atezolizumab bevacizumab liver"],
    "SANGUE_LINFOMA_DLBCL": ["DLBCL", "CAR-T lymphoma", "R-CHOP"],
    "SANGUE_LINFOMA_FOLICULAR": ["follicular lymphoma", "CAR-T FL", "bispecific lymphoma"],
    "SANGUE_MIELOMA_MULTIPL0": ["multiple myeloma", "BCMA myeloma", "daratumumab"],
    "SANGUE_LEUCEMIA_MIELOIDE_AGLA": ["acute myeloid leukemia", "venetoclax AML", "FLT3 AML"],
    "MEDULAR_MDS": ["myelodysplastic syndrome", "azacitidine MDS", "luspatercept"],
    "GI_COLORRETAL_MSI_H": ["MSI colorectal", "immunotherapy colorectal", "KEYNOTE-177"],
    "GI_GASTRICO_HER2": ["HER2 gastric", "trastuzumab gastric", "zolbetuximab"],
    "GI_ESOFAGO": ["esophageal cancer", "nivolumab esophageal", "CROSS trial"],
    "PELE_MELANOMA_BRAF": ["BRAF melanoma", "nivolumab ipilimumab melanoma"],
    "PELE_MELANOMA_CUTANEO": ["melanoma immunotherapy", "TIL melanoma", "relatlimabe"],
    "GU_RENAL_CELULAR": ["renal cell carcinoma", "nivolumab cabozantinib kidney"],
    "GU_BEXIGA_UROTELIAL": ["urothelial cancer", "enfortumab vedotin", "EV-302"],
    "GINECOLOGICO_CERVICAL_HPV": ["cervical cancer", "HPV cervical", "pembrolizumab cervical"],
    "ENDOCRINO_TIREOIDE": ["thyroid cancer", "lenvatinib thyroid", "selpercatinib RET"],
    "PLEURAL_MESOTELIOMA": ["mesothelioma", "nivolumab ipilimumab mesothelioma"],
    "OSSEO_OSTEOSARCOMA": ["osteosarcoma", "bone sarcoma", "MAP protocol"],
    "OSSEO_SARCOMA_EWING": ["Ewing sarcoma", "EWS-FLI1", "bone tumor"],
}


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


def obter_queries_comuns_pubmed() -> List[str]:
    """Retorna lista completa de termos PubMed para canceres comuns."""
    queries = []
    for termos in TERMOS_CANCERES_COMUNS_PUBMED.values():
        queries.extend(termos)
    return queries


def obter_queries_comuns_clinicaltrials() -> List[str]:
    """Retorna lista completa de termos ClinicalTrials para canceres comuns."""
    queries = []
    for termos in TERMOS_CANCERES_COMUNS_CLINICALTRIALS.values():
        queries.extend(termos)
    return queries


def obter_queries_neoplasia_global() -> List[str]:
    """Retorna termos gerais de neoplasia global."""
    return TERMOS_NEOPLASIA_GLOBAL


def obter_todas_queries_expandidas() -> List[str]:
    """Retorna todas as queries expandidas (raros + comuns + global) para injeção no ciclo DIMHEX."""
    todas = (
        obter_queries_raros_pubmed() +
        obter_queries_raros_clinicaltrials() +
        obter_queries_comuns_pubmed() +
        obter_queries_comuns_clinicaltrials() +
        obter_queries_neoplasia_global()
    )
    return todas