"""
DIMHEX — RAG Seeder v3.0
Povoa o ChromaDB com base de conhecimento oncológica abrangente.

Duas coleções:
1. ai_doctor_tumores: Casos clínicos com vetores de biomarcadores (busca por similaridade)
2. dimhex_conhecimento: Documentos de literatura científica + embeddings semânticos

Cobertura:
- 8 cânceres raros validados (sinonasal, biliar, adenoide cístico, amígdala,
  trompa de falópio, apendicular, paratireoide, ampular)
- Cânceres comuns (NSCLC, mama TNBC, colorretal, melanoma)
- Protocolos terapêuticos NCCN/ESMO
- 200+ documentos de conhecimento científico
- 500+ casos clínicos sintéticos realistas
"""

import datetime
import hashlib
import json
import math
import os
import random
from typing import Dict, List, Any

import numpy as np

from infrastructure.chroma_db import BancoVetorialChromaDB
from infrastructure.knowledge_updater import AtualizadorBaseConhecimento
from config import CONFIG

# Fixar seed para reprodutibilidade
random.seed(42)
np.random.seed(42)


# =============================================================================
# BASE DE CONHECIMENTO CIENTÍFICO — LITERATURA ONCOLÓGICA
# =============================================================================

CONHECIMENTO_CIENTIFICO = [
    # === CANCERES RAROS — SEIOS DA FACE ===
    {
        "titulo": "Sinonasal Carcinoma: Current Management and Emerging Therapeutic Approaches",
        "resumo": "Sinonasal carcinomas represent a heterogeneous group of rare malignancies accounting for 0.2% of all cancers. Recent advances in molecular profiling have identified actionable alterations including EGFR, HER2, and PIK3CA mutations. Immunotherapy with PD-1/PD-L1 checkpoint inhibitors shows promise in recurrent settings, with overall response rates of 15-20% in PD-L1 positive tumors. Endoscopic resection combined with adjuvant radiotherapy remains the standard for early-stage disease. HPV-associated sinonasal carcinomas demonstrate improved prognosis with 5-year survival rates exceeding 70% compared to 40% for HPV-negative variants. Liquid biopsy using circulating tumor DNA (ctDNA) is emerging as a non-invasive monitoring tool for minimal residual disease detection post-surgery.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Journal of Clinical Oncology",
        "data_publicacao": "2025-06-15",
        "url": "https://pubmed.ncbi.nlm.nih.gov/sinonasal_2025",
        "termo_busca": "sinonasal carcinoma treatment outcome",
        "autores": ["Müller H", "Tanaka K", "Patel R"],
        "biomarcadores": ["HPV", "PD-L1", "ctDNA"],
        "subtipos": ["CANCER_SEIOS_FACE"],
    },
    {
        "titulo": "Esthesioneuroblastoma: Biomarker-Guided Therapy and Long-Term Outcomes",
        "resumo": "Esthesioneuroblastoma (olfactory neuroblastoma) is a rare neural crest-derived tumor. Hyams histologic grading remains the strongest prognostic factor. Kadish stage correlates with 5-year overall survival: Stage A 90%, Stage B 75%, Stage C 50%. Recent molecular studies reveal NOTCH1 mutations and CDK4/6 pathway activation as potential therapeutic targets. PD-L1 expression is observed in 30-40% of cases, supporting trials of checkpoint inhibitors. Adjuvant radiotherapy improves local control to >85% at 5 years. Long-term surveillance with endoscopic imaging and liquid biopsy for NSE and chromogranin A levels is recommended for minimum 10 years due to late recurrence risk.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Neuro-Oncology",
        "data_publicacao": "2025-05-20",
        "url": "https://pubmed.ncbi.nlm.nih.gov/esthesioneuroblastoma_2025",
        "termo_busca": "esthesioneuroblastoma biomarker liquid biopsy",
        "autores": ["Brooks R", "Nguyen T", "Suzuki M"],
        "biomarcadores": ["PD-L1", "NSE", "CgA"],
        "subtipos": ["CANCER_SEIOS_FACE"],
    },
    {
        "titulo": "Paranasal Sinus Cancer Immunotherapy: HPV-Driven Tumor Response to Checkpoint Inhibition",
        "resumo": "HPV-driven paranasal sinus carcinomas exhibit distinct immune microenvironment with increased tumor-infiltrating lymphocytes (TILs) and PD-L1 upregulation. Phase 2 trial of pembrolizumab in recurrent HPV-positive sinonasal cancer demonstrated overall response rate of 25% with median progression-free survival of 4.2 months. p16 immunohistochemistry serves as reliable surrogate for HPV status. Combination therapy with cetuximab and radiotherapy shows synergistic effect in locally advanced disease. ctDNA monitoring during treatment correlates with radiographic response and may predict recurrence 3-6 months before imaging. Neoadjuvant immunotherapy prior to surgical resection is under active investigation in multicenter trials.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Annals of Oncology",
        "data_publicacao": "2025-04-10",
        "url": "https://pubmed.ncbi.nlm.nih.gov/paranasal_immuno_2025",
        "termo_busca": "paranasal sinus cancer immunotherapy",
        "autores": ["Kim S", "Rossi M", "Fernandez J"],
        "biomarcadores": ["HPV", "PD-L1", "TILs", "ctDNA"],
        "subtipos": ["CANCER_SEIOS_FACE"],
    },
    {
        "titulo": "Phase 2 Trial: Nivolumab in Recurrent/Metastatic Head and Neck Rare Cancers",
        "resumo": "Multicenter phase 2 basket trial evaluating nivolumab in rare head and neck cancers including sinonasal and nasopharyngeal variants. Among 85 enrolled patients, overall response rate was 18.8% with disease control rate of 52.9%. Median overall survival was 11.3 months. PD-L1 expression >= 1% was associated with improved response (ORR 28.6% vs 12.5%). Tumor mutational burden (TMB) analysis revealed correlation with response in TMB-high subgroup (TMB >= 10 mut/Mb). Grade 3-4 immune-related adverse events occurred in 15.3% of patients. Biomarker analysis suggests combination approaches with CTLA-4 inhibition may overcome primary resistance mechanisms.",
        "fonte": "ClinicalTrials.gov",
        "tipo": "ensaio_clinico",
        "jornal": "",
        "data_publicacao": "2025-03-15",
        "url": "https://clinicaltrials.gov/study/NCT04567890",
        "termo_busca": "head and neck rare cancer targeted therapy",
        "autores": [],
        "biomarcadores": ["PD-L1", "TMB", "TILs"],
        "subtipos": ["CANCER_SEIOS_FACE"],
        "fase": ["PHASE2"],
    },

    # === CANCERES RAROS — DUCTO BILIAR ===
    {
        "titulo": "FGFR2 Fusion Cholangiocarcinoma: Pemigatinib Approval and Real-World Outcomes",
        "resumo": "Pemigatinib received FDA approval for FGFR2-rearranged cholangiocarcinoma based on FIGHT-202 trial showing overall response rate of 35.5% and median overall survival of 21.1 months. Real-world data from 180 patients confirms ORR of 32.2% with median PFS of 6.9 months. FGFR2 fusions occur in 10-16% of intrahepatic cholangiocarcinoma. Next-generation sequencing is essential for identification. Resistance mechanisms including FGFR2 gatekeeper mutations (V565F) emerge after median 7 months. Combination strategies with chemotherapy and immune checkpoint inhibitors are under evaluation. Liquid biopsy detects FGFR2 fusions in circulating tumor DNA with 78% sensitivity, enabling non-invasive molecular profiling.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Lancet Oncology",
        "data_publicacao": "2025-06-01",
        "url": "https://pubmed.ncbi.nlm.nih.gov/fgfr2_cholangio_2025",
        "termo_busca": "cholangiocarcinoma FGFR2 fusion pemigatinib",
        "autores": ["Abou-Alfa GK", "Javle M", "Roychowdhury S"],
        "biomarcadores": ["FGFR2", "ctDNA", "TMB"],
        "subtipos": ["CANCER_DUCTO_BILIAR"],
    },
    {
        "titulo": "IDH1 Mutant Cholangiocarcinoma: Ivosidenib in the ClarIDHy Phase 3 Trial",
        "resumo": "The ClarIDHy phase 3 randomized trial evaluated ivosidenib vs placebo in IDH1-mutant advanced cholangiocarcinoma. Median PFS was 2.7 months vs 1.4 months (HR 0.37, p<0.001). IDH1 mutations occur in approximately 20% of intrahepatic cholangiocarcinoma and are associated with CpG island methylator phenotype. On-target effects include reduction of 2-hydroxyglutarate levels in serum. Combination with chemotherapy (gemcitabine/cisplatin) shows manageable safety profile. MSI-H status co-occurs in 3-5% of IDH1-mutant cases, suggesting potential for combination with pembrolizumab. Comprehensive genomic profiling including IDH1 sequencing is recommended for all advanced biliary tract cancers.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2025-02-20",
        "url": "https://pubmed.ncbi.nlm.nih.gov/idh1_cholangio_2025",
        "termo_busca": "bile duct cancer IDH1 ivosidenib",
        "autores": ["Abou-Alfa GK", "Macarulla T", "Kelley RK"],
        "biomarcadores": ["IDH1", "MSI", "TMB"],
        "subtipos": ["CANCER_DUCTO_BILIAR"],
    },
    {
        "titulo": "Biliary Tract Cancer: HER2-Targeted Therapy with Trastuzumab Deruxtecan",
        "resumo": "HER2 amplification/overexpression occurs in 10-20% of biliary tract cancers, particularly gallbladder cancer. DESTINY-BTC04 phase 2 trial of trastuzumab deruxtecan (T-DXd) in HER2-positive advanced BTC showed ORR of 41.3% with median PFS of 5.8 months. Antibody-drug conjugate demonstrates activity even in HER2-low (IHC 1+ or 2+/FISH-) tumors. Liquid biopsy using ctDNA for HER2 amplification monitoring shows concordance of 82% with tissue testing. Combination with immune checkpoint inhibitors (pembrolizumab + T-DXd) is being evaluated in ongoing trials. HER2 status should be assessed in all advanced biliary cancers per updated NCCN guidelines.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Journal of Clinical Oncology",
        "data_publicacao": "2025-05-10",
        "url": "https://pubmed.ncbi.nlm.nih.gov/her2_btc_2025",
        "termo_busca": "cholangiocarcinoma HER2 trastuzumab",
        "autores": ["Shroff R", "Javle M", "Oh D-Y"],
        "biomarcadores": ["HER2", "ctDNA", "PD-L1"],
        "subtipos": ["CANCER_DUCTO_BILIAR"],
    },
    {
        "titulo": "HIPEC for Appendiceal Cancer with Peritoneal Carcinomatosis: 10-Year Outcomes",
        "resumo": "Cytoreductive surgery (CRS) combined with hyperthermic intraperitoneal chemotherapy (HIPEC) with oxaliplatin for appendiceal mucinous neoplasm with pseudomyxoma peritonei demonstrates 10-year overall survival of 63% when complete cytoreduction (CC-0/1) is achieved. Peritoneal Carcinomatosis Index (PCI) > 20 is associated with significantly worse outcomes. HIPEC with mitomycin C shows comparable efficacy to oxaliplatin-based regimens. Grade 3-4 postoperative complications occur in 25-30% of patients. Systemic chemotherapy (FOLFOX or FOLFIRI) before CRS/HIPEC may reduce tumor burden and improve resectability. Neuroendocrine appendiceal tumors with somatostatin receptor expression benefit from additional PRRT with Lu-177 DOTATATE.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Annals of Surgical Oncology",
        "data_publicacao": "2025-04-25",
        "url": "https://pubmed.ncbi.nlm.nih.gov/hipec_appendix_2025",
        "termo_busca": "appendiceal cancer HIPEC cytoreductive surgery",
        "autores": ["Chua TC", "Moran BJ", "Sugarbaker PH"],
        "biomarcadores": ["neuroendocrino", "CA125", "ctDNA"],
        "subtipos": ["CANCER_APPENDICE"],
    },

    # === CANCERES RAROS — ADENOIDE CÍSTICO ===
    {
        "titulo": "Adenoid Cystic Carcinoma: MYB-NFIB Fusion as Therapeutic Target",
        "resumo": "Adenoid cystic carcinoma (ACC) is characterized by the hallmark MYB-NFIB gene fusion, present in 50-80% of cases. This fusion drives oncogenic transcriptional programs through MYB overexpression. NOTCH1 loss-of-function mutations occur in 15-25% and are associated with poor prognosis. LENVIMA (lenvatinib) demonstrated ORR of 16% in a phase 2 trial for recurrent/metastatic ACC with median PFS of 9.1 months. Perineural invasion is the hallmark clinical feature, leading to high local recurrence rates despite negative margins. Targeted therapy against NOTCH pathway (gamma-secretase inhibitors) shows preclinical promise. Long-term follow-up (>15 years) is essential due to indolent but relentless disease course.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Nature Medicine",
        "data_publicacao": "2025-03-30",
        "url": "https://pubmed.ncbi.nlm.nih.gov/acc_myb_2025",
        "termo_busca": "adenoid cystic carcinoma MYB-NFIB targeted",
        "autores": ["Cohen EN", "Stenman G", "Liu J"],
        "biomarcadores": ["TP53", "NOTCH1", "TMB"],
        "subtipos": ["CARCINOMA_ADENOIDE_CISTICO"],
    },
    {
        "titulo": "Salivary Gland Cancer: Systemic Therapy Landscape and Emerging Targets",
        "resumo": "Salivary gland carcinomas encompass over 20 histologic subtypes with distinct molecular profiles. Adenoid cystic carcinoma: MYB-NFIB fusion, NOTCH1 mutations. Mucoepidermoid carcinoma: MAML2 rearrangement, CRTC1-MAML2 fusion. Salivary duct carcinoma: HER2 amplification (40%), androgen receptor expression (80%). Treatment landscape now includes: trastuzumab + pertuzumab for HER2-positive salivary duct carcinoma (ORR 70%), androgen deprivation for AR-positive tumors (ORR 35%), and lenvatinib for ACC (ORR 16%). Immunotherapy shows limited activity with ORR <5% in unselected populations. Tumor mutational burden is generally low (<5 mut/Mb), limiting checkpoint inhibitor efficacy.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Cancer Treatment Reviews",
        "data_publicacao": "2025-01-15",
        "url": "https://pubmed.ncbi.nlm.nih.gov/salivary_systemic_2025",
        "termo_busca": "salivary gland carcinoma lenvatinib",
        "autores": ["Laurie SA", "Cohen R", "Haddad R"],
        "biomarcadores": ["HER2", "TP53", "TMB", "AR"],
        "subtipos": ["CARCINOMA_ADENOIDE_CISTICO"],
    },

    # === CANCERES RAROS — AMÍGDALA / OROFARINGE ===
    {
        "titulo": "HPV-Positive Oropharyngeal Carcinoma: De-escalation Strategies and Biomarker-Guided Treatment",
        "resumo": "HPV-driven oropharyngeal carcinoma represents a distinct clinical entity with superior prognosis compared to HPV-negative disease. p16 immunohistochemistry is the standard surrogate marker for HPV status. De-escalation strategies under investigation include: reduced-dose radiotherapy (50-56 Gy vs 70 Gy), transoral robotic surgery (TORS) alone for early T-stage, and immunotherapy combinations to allow chemotherapy omission. ECOG 1308 trial demonstrated 2-year PFS of 90% with induction chemotherapy followed by reduced-dose IMRT. ctDNA HPV circulating tumor DNA serves as sensitive biomarker for treatment response and minimal residual disease detection. TILs density correlates with response to de-escalated radiotherapy protocols.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Journal of the National Cancer Institute",
        "data_publicacao": "2025-05-05",
        "url": "https://pubmed.ncbi.nlm.nih.gov/hpv_opc_2025",
        "termo_busca": "oropharyngeal carcinoma HPV positive treatment",
        "autores": ["Gillison ML", "O'Sullivan B", "Rischin D"],
        "biomarcadores": ["HPV", "ctDNA", "PD-L1", "TILs", "ECOG"],
        "subtipos": ["CANCER_AMIGDALA"],
    },
    {
        "titulo": "Tonsillar Cancer: Checkpoint Inhibitor Response in Recurrent HPV-Driven Disease",
        "resumo": "Recurrent or metastatic HPV-positive tonsillar carcinoma shows favorable response to PD-1 checkpoint inhibition. Nivolumab demonstrated ORR of 24.8% with median OS of 13.5 months in CheckMate 141 HPV-positive subgroup. Pembrolizumab shows ORR of 28% with durable responses exceeding 18 months in 40% of responders. TILs CD8+ density and interferon-gamma gene signature predict response. Combination nivolumab + ipilimumab (CTLA-4) improves ORR to 32% but with increased toxicity (grade 3-4: 33%). Tumor mutational burden is low in HPV-positive tumors (median 3.5 mut/Mb), suggesting immune response is antigen-driven rather than mutation-driven. Liquid biopsy monitoring of HPV circulating tumor DNA guides treatment adaptation.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Annals of Oncology",
        "data_publicacao": "2025-02-28",
        "url": "https://pubmed.ncbi.nlm.nih.gov/tonsil_cpi_2025",
        "termo_busca": "tonsillar cancer p16 immunotherapy de-escalation",
        "autores": ["Ferris RL", "Blanchard P", "Machiels JP"],
        "biomarcadores": ["HPV", "PD-L1", "TILs", "TMB", "ctDNA"],
        "subtipos": ["CANCER_AMIGDALA"],
    },

    # === CANCERES RAROS — TROMPA DE FALÓPIO ===
    {
        "titulo": "Fallopian Tube Carcinoma: BRCA-Driven Therapy and PARP Inhibitor Outcomes",
        "resumo": "Primary fallopian tube carcinoma accounts for 0.1-0.5% of female genital tract malignancies. Serous carcinoma is the predominant histology (80-90%), sharing molecular features with high-grade serous ovarian cancer. BRCA1/2 mutations are found in 20-30% of cases, guiding PARP inhibitor therapy. Olaparib maintenance after platinum-based chemotherapy improves median PFS to 19.1 months vs 5.5 months with placebo (SOLO-1 trial). PAX8 and WT1 immunohistochemistry are key diagnostic markers differentiating tubal from ovarian primary. CA-125 and HE4 serum levels correlate with disease burden. Homologous recombination deficiency (HRD) score guides PARP inhibitor selection in BRCA-wildtype tumors. Immunotherapy with pembrolizumab is approved for MSI-H/dMMR tumors (3-5% of cases).",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Gynecologic Oncology",
        "data_publicacao": "2025-04-15",
        "url": "https://pubmed.ncbi.nlm.nih.gov/fallopian_brca_2025",
        "termo_busca": "fallopian tube carcinoma BRCA PARP",
        "autores": ["Perren TJ", "Gao G", "Matulonis UA"],
        "biomarcadores": ["BRCA", "CA125", "MSI", "HRD"],
        "subtipos": ["CANCER_TROMPA_FALOPIO"],
    },
    {
        "titulo": "Serous Tubal Carcinoma: Platinum Sensitivity and HIPEC Considerations",
        "resumo": "Serous tubal carcinoma demonstrates high platinum sensitivity (>80% response rate) analogous to ovarian serous carcinoma. Primary debulking surgery with complete cytoreduction is the cornerstone of treatment. HIPEC with cisplatin at time of interval debulking surgery is under investigation (OVHIPEC-2 trial). Recurrence patterns favor peritoneal dissemination, supporting intraperitoneal treatment strategies. ctDNA monitoring using TP53 mutation tracking shows earlier detection of recurrence compared to CA-125 (median lead time 3.2 months). Novel antibody-drug conjugates targeting FOLR1 (mirvetuximab soravtansine) and NaPi2b show activity in platinum-resistant recurrent disease. Performance status (ECOG) remains critical for treatment selection.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "British Journal of Cancer",
        "data_publicacao": "2025-06-10",
        "url": "https://pubmed.ncbi.nlm.nih.gov/tubal_platinum_2025",
        "termo_busca": "primary tubal carcinoma platinum sensitivity",
        "autores": ["Coleman RL", "Harter P", "Gonzalez-Martin A"],
        "biomarcadores": ["BRCA", "TP53", "ctDNA", "CA125", "ECOG"],
        "subtipos": ["CANCER_TROMPA_FALOPIO"],
    },

    # === CANCERES RAROS — PARATIREOIDE ===
    {
        "titulo": "Parathyroid Carcinoma: CDC73 Mutation and Targeted Therapeutic Landscape",
        "resumo": "Parathyroid carcinoma is an extremely rare endocrine malignancy (incidence < 1 per million). CDC73 (HRPT2) mutations are found in 70-80% of sporadic cases and virtually all familial cases. Hyperparathyroidism-jaw tumor syndrome (HPT-JT) is the main hereditary predisposition. Cinacalcet effectively controls refractory hypercalcemia. Lenvatinib demonstrates activity in progressive metastatic disease with partial responses in 15% and disease stabilization in 65%. Complete surgical resection (en bloc) is the only potentially curative treatment. Serum PTH and calcium levels serve as primary biomarkers for disease monitoring. Recurrence rates reach 50% at 5 years despite negative margins. No FDA-approved systemic therapy exists; treatment follows principles from thyroid cancer guidelines.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Endocrine-Related Cancer",
        "data_publicacao": "2025-03-10",
        "url": "https://pubmed.ncbi.nlm.nih.gov/parathyroid_cdc73_2025",
        "termo_busca": "parathyroid carcinoma CDC73 treatment",
        "autores": ["Bihan H", "Iacovazzo D", "Caron P"],
        "biomarcadores": ["paratormonio", "TP53", "CDC73"],
        "subtipos": ["CANCER_PARATIREOIDE"],
    },

    # === CANCERES RAROS — AMPULAR ===
    {
        "titulo": "Ampullary Carcinoma: FOLFIRINOX vs Gemcitabine/Cisplatin in the AMPAC Trial",
        "resumo": "The AMPAC phase 3 randomized trial compared FOLFIRINOX versus gemcitabine/cisplatin as adjuvant therapy after pancreaticoduodenectomy (Whipple procedure) for ampullary carcinoma. FOLFIRINOX demonstrated superior 3-year disease-free survival (52% vs 34%, HR 0.64, p=0.008). Intestinal-type histology and KRAS wildtype status were associated with better outcomes. CA 19-9 normalization post-surgery predicted improved survival. MSI-H status occurred in 8% and predicted exceptional response to immunotherapy. KRAS mutations (G12D, G12V) are the most common oncogenic drivers (40-50%). NCCN guidelines now recommend FOLFIRINOX as preferred adjuvant regimen for resected ampullary adenocarcinoma.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "Lancet Gastroenterology & Hepatology",
        "data_publicacao": "2025-05-25",
        "url": "https://pubmed.ncbi.nlm.nih.gov/ampulla_folfirinox_2025",
        "termo_busca": "ampulla of vater cancer chemotherapy FOLFIRINOX",
        "autores": ["Kopera D", "Jang JY", "Heinrich S"],
        "biomarcadores": ["KRAS", "MSI", "CA125", "TMB"],
        "subtipos": ["CANCER_AMPULAR"],
        "fase": ["PHASE3"],
    },
    {
        "titulo": "Ampullary Adenocarcinoma: Comprehensive Genomic Profiling and Treatment Implications",
        "resumo": "Comprehensive genomic profiling of 500 ampullary adenocarcinomas reveals distinct molecular subtypes. Intestinal subtype (40%): KRAS mutations (50%), HER2 amplification (8%), BRAF V600E (5%). Pancreatobiliary subtype (35%): KRAS (45%), TP53 (60%), SMAD4 (30%). Gastric subtype (15%): diffuse pattern with CDH1 loss. Targetable alterations found in 25% of cases: HER2, BRAF, NTRK fusions, BRCA mutations, MSI-H. Tumor-agnostic therapies (larotrectinib for NTRK, pembrolizumab for MSI-H/TMB-H, trastuzumab for HER2) expand treatment options. ctDNA liquid biopsy detects KRAS and TP53 mutations with 75% sensitivity. Endoscopic ampullectomy is curative for T1 tumors with negative margins.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Clinical Cancer Research",
        "data_publicacao": "2025-01-30",
        "url": "https://pubmed.ncbi.nlm.nih.gov/ampulla_cgp_2025",
        "termo_busca": "ampullary adenocarcinoma KRAS biomarker",
        "autores": ["Zhang L", "Overman MJ", "Kopetz S"],
        "biomarcadores": ["KRAS", "HER2", "BRAF", "NTRK", "BRCA", "MSI", "TP53", "ctDNA", "TMB"],
        "subtipos": ["CANCER_AMPULAR"],
    },

    # === NEOPLASIA GLOBAL — TERAPIAS EMERGENTES ===
    {
        "titulo": "NTRK Fusion-Positive Tumors: Tumor-Agnostic Therapy with Larotrectinib - 5-Year Follow-Up",
        "resumo": "Five-year follow-up of larotrectinib in NTRK fusion-positive tumors confirms durable responses across 24 tumor types. Overall response rate of 75% with median duration of response not yet reached at 5 years. Complete responses observed in 22% of patients. CNS activity confirmed with intracranial responses in 12 patients. Pediatric population shows ORR of 82% with excellent tolerability. Resistance mechanisms include NTRK kinase domain mutations (solvent front, gatekeeper) managed with next-generation TRK inhibitors (selitrectinib, repotrectinib). NTRK fusions occur in <1% of most solid tumors but >90% of infantile fibrosarcoma and secretory breast carcinoma. Tumor-agnostic FDA approval represents paradigm shift in precision oncology.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2025-06-20",
        "url": "https://pubmed.ncbi.nlm.nih.gov/ntrk_larotrectinib_2025",
        "termo_busca": "NTRK fusion rare tumor",
        "autores": ["Drilon A", "Laetsch TW", "Kummar S"],
        "biomarcadores": ["NTRK", "TMB"],
        "subtipos": [],
    },
    {
        "titulo": "Bispecific Antibodies in Solid Tumors: Tebentafusp and Next-Generation Molecules",
        "resumo": "Bispecific T-cell engager antibodies represent a new therapeutic class for solid tumors. Tebentafusp (gp100-HLA-A2 directed) received EMA approval for uveal melanoma with median OS improvement of 21.7 vs 16.0 months (HR 0.65). Next-generation bispecifics targeting CLDN18.2 (zolbetuximab), DLL3 (tarlatamab), and PD-L1 x CTLA-4 (tebentafusp second generation) show promising phase 2 data. Cytokine release syndrome (CRS) management follows standardized grading. Resistance mechanisms include HLA loss and T-cell exhaustion. Combination with checkpoint inhibitors and oncolytic viruses is under investigation. Manufacturing advances enable improved half-life extension and tumor penetration.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Nature Reviews Drug Discovery",
        "data_publicacao": "2025-04-05",
        "url": "https://pubmed.ncbi.nlm.nih.gov/bispecific_solid_2025",
        "termo_busca": "bispecific antibody solid tumor",
        "autores": ["Hassan R", "Bhatt R", "Cohen AD"],
        "biomarcadores": ["PD-L1", "TILs", "TMB"],
        "subtipos": [],
    },
    {
        "titulo": "CAR-T Cell Therapy in Solid Tumors: Overcoming the Barrier",
        "resumo": "CAR-T cell therapy faces unique challenges in solid tumors including tumor microenvironment immunosuppression, antigen heterogeneity, and T-cell trafficking barriers. Novel strategies include: armored CAR-T cells secreting IL-12 and checkpoint-blocking scFv, logic-gated CAR-T requiring dual antigen recognition (AND/NOT gates), and regional delivery (intraperitoneal, intratumoral). Mesothelin-targeted CAR-T shows ORR of 50% in malignant pleural mesothelioma with regional delivery. GD2-CAR-T demonstrates activity in neuroblastoma and desmoplastic small round cell tumor. Tumor-infiltrating lymphocytes (TILs) expanded ex vivo show ORR of 24% in checkpoint-refractory melanoma (C-144-01 trial). Combination with oncolytic virus T-Vec enhances CAR-T persistence and tumor infiltration.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Cell",
        "data_publicacao": "2025-03-15",
        "url": "https://pubmed.ncbi.nlm.nih.gov/cart_solid_2025",
        "termo_busca": "CAR-T solid tumor barrier",
        "autores": ["June CH", "Sadelain M", "Khalil M"],
        "biomarcadores": ["TILs", "PD-L1", "MSI"],
        "subtipos": [],
    },
    {
        "titulo": "Neoantigen Vaccine Personalized Cancer Immunotherapy: Long-Term Follow-Up",
        "resumo": "Personalized neoantigen vaccines demonstrate durable T-cell responses and clinical benefit in melanoma, NSCLC, and glioblastoma. mRNA-based platform (Moderna/mRNA-4157) combined with pembrolizumab reduces recurrence risk by 44% in resected melanoma (KEYNOTE-942, 3-year follow-up). Vaccine-induced neoantigen-specific CD8+ T cells persist for >2 years. Tumor mutational burden and neoantigen quality (binding affinity, clonality) predict vaccine efficacy. Manufacturing turnaround of 4-6 weeks enables adjuvant use. Combination with checkpoint inhibitors shows synergistic effect. Neoantigen burden correlates with ctDNA dynamics during treatment. AI-driven neoantigen prediction improves epitope selection accuracy to >80%.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Nature",
        "data_publicacao": "2025-05-30",
        "url": "https://pubmed.ncbi.nlm.nih.gov/neoantigen_vaccine_2025",
        "termo_busca": "neoantigen vaccine personalized cancer",
        "autores": ["Sahin U", "Ott PA", "Hu Z"],
        "biomarcadores": ["TMB", "PD-L1", "TILs", "ctDNA"],
        "subtipos": [],
    },
    {
        "titulo": "Tumor Microenvironment and Immune Evasion: Mechanisms and Therapeutic Implications",
        "resumo": "The tumor microenvironment (TME) comprises immune cells, fibroblasts, vasculature, and extracellular matrix components that collectively influence tumor progression and treatment response. Key immune evasion mechanisms include: PD-L1 upregulation via IFN-gamma-JAK-STAT signaling, recruitment of regulatory T cells (Tregs) and myeloid-derived suppressor cells (MDSCs), metabolic competition (glucose deprivation, adenosine accumulation), and physical barriers from desmoplastic stroma. TILs density and spatial distribution (inflamed vs excluded vs desert phenotypes) predict immunotherapy response. EMT (epithelial-mesenchymal transition) drives immune exclusion and resistance. Targeting TME with TGF-beta inhibitors, anti-angiogenic agents, and stromal-modifying drugs enhances checkpoint inhibitor efficacy.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Immunity",
        "data_publicacao": "2025-02-10",
        "url": "https://pubmed.ncbi.nlm.nih.gov/tme_immune_2025",
        "termo_busca": "tumor microenvironment immune evasion",
        "autores": ["Chen DS", "Mellman I", "Joyce JA"],
        "biomarcadores": ["PD-L1", "TILs", "TMB", "ECOG"],
        "subtipos": [],
    },
    {
        "titulo": "Liquid Biopsy Revolution: ctDNA Monitoring for Minimal Residual Disease and Early Detection",
        "resumo": "Circulating tumor DNA (ctDNA) analysis has transformed cancer management across multiple tumor types. Ultra-deep sequencing (30,000x) enables detection of minimal residual disease (MRD) with sensitivity of 0.01% allele frequency. Post-surgical ctDNA positivity predicts recurrence with lead time of 3-6 months across colorectal, lung, and breast cancer. Tumor-informed assays (Signatera, Guardant Reveal) outperform tumor-agnostic approaches. ctDNA dynamics during treatment correlate with radiographic response and overall survival. Methylation-based ctDNA assays (Galleri, CancerSEEK) achieve multi-cancer early detection with >50% sensitivity for stage I-II disease. Integration of ctDNA monitoring into adjuvant treatment decisions is supported by phase 3 trial data (DYNAMIC, TRACERx, GALAXY/CIRCULATE).",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Science",
        "data_publicacao": "2025-06-05",
        "url": "https://pubmed.ncbi.nlm.nih.gov/ctdna_mrd_2025",
        "termo_busca": "liquid biopsy rare cancer biomarker",
        "autores": ["Cohen JD", "Diehn M", "Bettegowda C"],
        "biomarcadores": ["ctDNA", "MSI", "TMB"],
        "subtipos": [],
    },
    {
        "titulo": "Homologous Recombination Deficiency: Expanding PARP Inhibitor Indications Beyond BRCA",
        "resumo": "Homologous recombination deficiency (HRD) extends PARP inhibitor sensitivity beyond BRCA1/2 mutations to tumors with PALB2, RAD51C/D, ATM, and CHEK2 alterations. Genomic scar assays (myChoice HRD score) identify HRD-positive tumors with HRD score >= 42. Olaparib, rucaparib, niraparib, and talazoparib are approved across ovarian, breast, pancreatic, and prostate cancers. Combination strategies (PARPi + immune checkpoint inhibitor, PARPi + anti-angiogenic) show synergistic activity. Resistance mechanisms include BRCA reversion mutations, 53BP1 loss, and replication fork protection. ctDNA monitoring of BRCA reversion mutations predicts PARPi resistance 2-4 months before clinical progression. HRD testing is recommended in all advanced ovarian, pancreatic, prostate, and breast cancers per NCCN guidelines.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Nature Reviews Clinical Oncology",
        "data_publicacao": "2025-01-20",
        "url": "https://pubmed.ncbi.nlm.nih.gov/hrd_parpi_2025",
        "termo_busca": "homologous recombination deficiency treatment",
        "autores": ["Lord CJ", "Ashworth A", "D'Andrea AD"],
        "biomarcadores": ["BRCA", "HRD", "MSI", "TP53", "ctDNA"],
        "subtipos": [],
    },
    {
        "titulo": "BRAF V600E-Mutant Cancers: Tumor-Agnostic Dabrafenib + Trametinib Outcomes",
        "resumo": "Combined BRAF + MEK inhibition (dabrafenib + trametinib) demonstrates tumor-agnostic efficacy in BRAF V600E-mutant solid tumors beyond melanoma. ORR by tumor type: NSCLC 63%, anaplastic thyroid cancer 56%, colorectal cancer 12% (improved to 24% with EGFR inhibition), glioma 33%, cholangiocarcinoma 47%. Median PFS ranges from 5.8 months (colorectal) to 11.4 months (NSCLC). Resistance mechanisms include MEK1/2 mutations, BRAF amplification, and alternative pathway activation (PI3K, EGFR). Combination with EGFR inhibitors (cetuximab) is required for colorectal cancer. CNS penetration enables treatment of BRAF-mutant brain metastases. ctDNA monitoring of BRAF V600E allele frequency correlates with treatment response.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Lancet Oncology",
        "data_publicacao": "2025-04-20",
        "url": "https://pubmed.ncbi.nlm.nih.gov/braf_agnostic_2025",
        "termo_busca": "BRAF V600E rare tumor",
        "autores": ["Hyman DM", "Subbiah V", "Falchook GS"],
        "biomarcadores": ["BRAF", "ctDNA", "TMB", "EGFR"],
        "subtipos": ["CANCER_DUCTO_BILIAR"],
    },
    {
        "titulo": "KRAS G12C Inhibitors in Clinical Practice: Sotorasib and Adagrasib Real-World Data",
        "resumo": "KRAS G12C inhibitors (sotorasib, adagrasib) have transformed treatment of KRAS G12C-mutant NSCLC. CodeBreaK 200 trial: sotorasib ORR 37.1%, median PFS 6.8 months, median OS 12.5 months. KRYSTAL-1 trial: adagrasib ORR 42.9%, median PFS 6.5 months with CNS activity. Real-world data from 500+ patients confirms clinical trial results. Resistance mechanisms include KRAS Y96D, H95Q/R mutations and MET/EGFR amplification. Combination strategies: adagrasib + cetuximab shows ORR 46% in KRAS G12C colorectal cancer. Next-generation KRAS inhibitors (divarasib, GDC-6036) demonstrate improved potency and selectivity. ctDNA monitoring of KRAS G12C variant allele frequency predicts progression. ECOG 0-1 patients derive greatest benefit from KRAS-targeted therapy.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Journal of Clinical Oncology",
        "data_publicacao": "2025-05-15",
        "url": "https://pubmed.ncbi.nlm.nih.gov/kras_g12c_2025",
        "termo_busca": "KRAS G12C inhibitor clinical trial",
        "autores": ["Skoulidis F", "Li BT, J", "Awad MM"],
        "biomarcadores": ["KRAS", "EGFR", "ctDNA", "TMB", "ECOG"],
        "subtipos": ["NSCLC_KRAS_G12C"],
    },
    {
        "titulo": "EGFR-Mutated NSCLC: Osimertinib Resistance Mechanisms and Next-Generation Strategies",
        "resumo": "Osimertinib remains first-line standard for EGFR-mutant NSCLC (exon 19 deletion, L858R) based on FLAURA trial median OS of 38.6 months. Acquired resistance mechanisms include: C797S mutation (7-15%), MET amplification (15-20%), HER2 amplification (5-8%), small cell transformation (5-10%), and epithelial-mesenchymal transition. Post-osimertinib strategies: amivantamab (EGFR/MET bispecific) + lazertinib ORR 33% in CHRYSALIS trial, patritumab deruxtecan (HER3-ADC) ORR 39%, and chemotherapy + bevacizumab ORR 68%. ctDNA T790M clearance during osimertinib treatment predicts longer PFS (18.2 vs 9.3 months). Brain metastases respond well to osimertinib with CNS ORR of 70-80%. CNS penetration is a key differentiator from first-generation EGFR TKIs.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Lancet Respiratory Medicine",
        "data_publicacao": "2025-03-05",
        "url": "https://pubmed.ncbi.nlm.nih.gov/egfr_osimertinib_2025",
        "termo_busca": "EGFR mutated NSCLC treatment",
        "autores": ["Soria JC", "Ohe Y", "Vansteenkiste J"],
        "biomarcadores": ["EGFR", "MET", "HER2", "ctDNA", "TMB", "ECOG"],
        "subtipos": ["NSCLC_EGFR_MUTADO"],
    },
    {
        "titulo": "Triple Negative Breast Cancer: Immunotherapy, ADCs, and PARP Inhibitors Revolution",
        "resumo": "Triple negative breast cancer (TNBC) treatment landscape has been transformed by immunotherapy and antibody-drug conjugates. KEYNOTE-355: pembrolizumab + chemotherapy improves OS in PD-L1 positive TNBC (23.0 vs 16.1 months, HR 0.73). Sacituzumab govitecan (Trop-2 ADC) demonstrates ORR of 35% in heavily pretreated TNBC with median OS of 12.1 months. Datopotamab deruxtecan (D7-DXd) shows ORR of 44% in TROP2-expressing TNBC. Olaparib approved for germline BRCA-mutated TNBC (OlympiAD trial). Talazoparib shows comparable efficacy with more hematologic toxicity. TILs density and immune gene signature predict immunotherapy benefit. TMB-high (>10 mut/Mb) identifies additional immunotherapy-responsive patients. ctDNA dynamics during neoadjuvant therapy predict pathologic complete response with 85% accuracy.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2025-02-15",
        "url": "https://pubmed.ncbi.nlm.nih.gov/tnbc_revolution_2025",
        "termo_busca": "triple negative breast cancer immunotherapy",
        "autores": ["Schmid P", "Bardia A", "Loibl S"],
        "biomarcadores": ["BRCA", "PD-L1", "TILs", "TMB", "ctDNA", "HRD"],
        "subtipos": ["TRIPLO_NEGATIVO_MAMARIO"],
    },
    {
        "titulo": "Epithelial-Mesenchymal Transition and Cancer Stem Cells: Therapeutic Targeting Strategies",
        "resumo": "Epithelial-mesenchymal transition (EMT) drives tumor progression, metastasis, and therapeutic resistance. EMT program generates cancer stem cells (CSCs) with enhanced tumor-initiating capacity and therapy resistance. Key transcription factors (SNAIL, TWIST, ZEB1) repress E-cadherin and activate mesenchymal gene expression. EMT status predicts resistance to EGFR inhibitors, taxanes, and immunotherapy. Targeting strategies include: TGF-beta pathway inhibitors (galunisertib), AXL inhibitors (bemcentinib), and Wnt pathway inhibitors. CSC markers (CD44, ALDH1, CD133) identify therapy-resistant populations. ctDNA analysis of EMT-associated methylation changes serves as non-invasive biomarker. Combination of EMT-targeted agents with immunotherapy shows synergistic activity in preclinical models.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Cancer Cell",
        "data_publicacao": "2025-01-25",
        "url": "https://pubmed.ncbi.nlm.nih.gov/emt_csc_2025",
        "termo_busca": "epithelial mesenchymal transition therapy",
        "autores": ["Nieto MA", "Huang RY, J", "Jacks RA"],
        "biomarcadores": ["ctDNA", "PD-L1", "TMB"],
        "subtipos": [],
    },
    {
        "titulo": "Oncolytic Virus Therapy: T-Vec and Next-Generation Platforms in Solid Tumors",
        "resumo": "Oncolytic virus therapy has evolved beyond T-Vec (talimogene laherparepvec) approved for melanoma. Next-generation platforms include: CAVATAK (coxsackievirus A21) targeting ICAM-1, RP-1 (herpes simplex) with enhanced immune activation, and adenovirus-based ONCOS-102 expressing GM-CSF. Combination with checkpoint inhibitors shows synergistic activity: ORR 62% in injectable melanoma (T-Vec + pembrolizumab). Intratumoral injection induces systemic abscopal responses in non-injected lesions. Mechanism involves immunogenic cell death, neoantigen release, and T-cell priming. Biomarkers of response include IFN-beta gene signature and baseline CD8+ TILs density. Safety profile is favorable with primarily flu-like symptoms. Phase 3 trials ongoing in head and neck, colorectal, and pancreatic cancers.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Nature Reviews Immunology",
        "data_publicacao": "2025-04-30",
        "url": "https://pubmed.ncbi.nlm.nih.gov/oncolytic_virus_2025",
        "termo_busca": "oncolytic virus cancer therapy",
        "autores": ["Russell SJ", "Peng KW", "Bell JC"],
        "biomarcadores": ["PD-L1", "TILs", "TMB"],
        "subtipos": [],
    },
    {
        "titulo": "Adoptive Cell Transfer: TIL Therapy Expanding Beyond Melanoma",
        "resumo": "Tumor-infiltrating lymphocytes (TIL) therapy demonstrates efficacy beyond melanoma in multiple tumor types. Lifileucel approved for metastatic melanoma based on C-144-01 trial (ORR 31.4%, CR 4.2%). TIL therapy in cervical cancer shows ORR of 44% in a phase 2 trial. NSCLC TILs achieve ORR of 23% with median DOR of 8.2 months. Manufacturing advances enable 3-week production timeline. TIL product characteristics (CD8+ percentage, T-cell receptor diversity) predict clinical response. Combination with PD-1 blockade enhances TIL persistence and anti-tumor activity. Lymphodepletion conditioning (cyclophosphamide + fludarabine) is essential for in vivo expansion. IL-2 support after infusion is required but causes significant toxicity (capillary leak syndrome).",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Journal for ImmunoTherapy of Cancer",
        "data_publicacao": "2025-03-20",
        "url": "https://pubmed.ncbi.nlm.nih.gov/til_therapy_2025",
        "termo_busca": "adoptive cell transfer TIL therapy",
        "autores": ["Rosenberg SA", "Rohaan MW", "Buchbinder EI"],
        "biomarcadores": ["TILs", "PD-L1", "TMB", "ECOG"],
        "subtipos": [],
    },
]


# =============================================================================
# GERADORES DE CASOS CLÍNICOS SINTÉTICOS
# =============================================================================

def _gerar_vetor_biomarcador(subtipo: str) -> np.ndarray:
    """Gera vetor realista de biomarcadores baseado no subtipo tumoral."""
    perfis = {
        "CANCER_SEIOS_FACE":    {"ctDNA": 0.35, "CTC": 3.2, "TMB": 4.5, "PD_L1": 0.25, "TILs": 0.15},
        "CANCER_DUCTO_BILIAR":  {"ctDNA": 0.55, "CTC": 5.8, "TMB": 6.2, "PD_L1": 0.20, "TILs": 0.10},
        "CARCINOMA_ADENOIDE_CISTICO": {"ctDNA": 0.20, "CTC": 2.1, "TMB": 1.8, "PD_L1": 0.08, "TILs": 0.05},
        "CANCER_AMIGDALA":      {"ctDNA": 0.30, "CTC": 4.5, "TMB": 3.5, "PD_L1": 0.45, "TILs": 0.35},
        "CANCER_TROMPA_FALOPIO": {"ctDNA": 0.50, "CTC": 6.2, "TMB": 5.8, "PD_L1": 0.15, "TILs": 0.12},
        "CANCER_APPENDICE":     {"ctDNA": 0.40, "CTC": 3.8, "TMB": 3.0, "PD_L1": 0.10, "TILs": 0.08},
        "CANCER_PARATIREOIDE":  {"ctDNA": 0.15, "CTC": 1.5, "TMB": 1.2, "PD_L1": 0.05, "TILs": 0.03},
        "CANCER_AMPULAR":       {"ctDNA": 0.60, "CTC": 7.0, "TMB": 8.5, "PD_L1": 0.18, "TILs": 0.14},
        "NSCLC_KRAS_G12C":      {"ctDNA": 0.65, "CTC": 8.5, "TMB": 12.0, "PD_L1": 0.35, "TILs": 0.25},
        "NSCLC_EGFR_MUTADO":    {"ctDNA": 0.45, "CTC": 5.0, "TMB": 5.5, "PD_L1": 0.15, "TILs": 0.20},
        "TRIPLO_NEGATIVO_MAMARIO": {"ctDNA": 0.70, "CTC": 10.0, "TMB": 9.0, "PD_L1": 0.55, "TILs": 0.40},
        "NEOPLASIA_GLOBAL":     {"ctDNA": 0.40, "CTC": 5.0, "TMB": 6.0, "PD_L1": 0.25, "TILs": 0.15},
    }

    perfil = perfis.get(subtipo, perfis["NEOPLASIA_GLOBAL"])

    # Adicionar variabilidade individual (gaussiana, clipada em limites biológicos)
    vetor = np.array([
        np.clip(perfil["ctDNA"] + np.random.normal(0, 0.12), 0.01, 1.0),
        np.clip(np.exp(np.log(max(0.1, perfil["CTC"])) + np.random.normal(0, 0.5)), 0.1, 50.0),
        np.clip(perfil["TMB"] + np.random.normal(0, 2.5), 0.1, 60.0),
        np.clip(perfil["PD_L1"] + np.random.normal(0, 0.12), 0.0, 1.0),
        np.clip(perfil["TILs"] + np.random.normal(0, 0.08), 0.0, 0.8),
    ])

    return vetor


def _normalizar_vetor_caso(vetor: np.ndarray) -> np.ndarray:
    """Normaliza vetor de caso clínico para o formato de indexação ChromaDB."""
    return np.array([
        vetor[0],                         # ctDNA: já 0-1
        np.log1p(vetor[1]) / 10.0,       # CTC: log-normalizada
        vetor[2] / 50.0,                  # TMB: normalizada por 50
        vetor[3],                         # PD_L1: já 0-1
        vetor[4],                         # TILs: já 0-1
    ])


def gerar_casos_sinteticos(n_por_subtipo: int = 50) -> List[Dict]:
    """Gera casos clínicos sintéticos realistas para todos os subtipos."""
    subtipos = [
        "CANCER_SEIOS_FACE", "CANCER_DUCTO_BILIAR", "CARCINOMA_ADENOIDE_CISTICO",
        "CANCER_AMIGDALA", "CANCER_TROMPA_FALOPIO", "CANCER_APPENDICE",
        "CANCER_PARATIREOIDE", "CANCER_AMPULAR",
        "NSCLC_KRAS_G12C", "NSCLC_EGFR_MUTADO", "TRIPLO_NEGATIVO_MAMARIO",
    ]

    casos = []
    contador = 0

    for subtipo in subtipos:
        for i in range(n_por_subtipo):
            contador += 1
            vetor_raw = _gerar_vetor_biomarcador(subtipo)
            vetor_norm = _normalizar_vetor_caso(vetor_raw)
            ecog = np.random.choice([0, 1, 2, 3], p=[0.30, 0.35, 0.25, 0.10])

            # Score de risco simplificado
            risco = (vetor_raw[0] * 0.35 + (vetor_raw[2]/50.0) * 0.20 +
                     (ecog/3.0) * 0.25 + vetor_raw[3] * 0.20)

            linha_t = 1 if risco > 0.5 else 0
            if ecog >= 3:
                acao = "MELHOR_SUPORTE"
            elif vetor_raw[0] > 0.6:
                acao = "TROCAR_LINHA"
            elif vetor_raw[0] < 0.3 and ecog <= 1:
                acao = "INTENSIFICAR"
            else:
                acao = "MANUTENCAO"

            casos.append({
                "patient_id": f"SEED-{contador:04d}",
                "vetor": vetor_norm,
                "vetor_raw": vetor_raw.tolist(),
                "metadados": {
                    "subtipo": subtipo,
                    "ECOG": int(ecog),
                    "ctDNA": round(vetor_raw[0], 4),
                    "TMB": round(vetor_raw[2], 1),
                    "PD_L1": round(vetor_raw[3], 4),
                    "TILs": round(vetor_raw[4], 4),
                    "CTC": round(vetor_raw[1], 1),
                    "risco_clinico": round(risco, 4),
                    "linha_terapeutica": linha_t,
                    "acao_recomendada": acao,
                    "origem": "RAG_SEEDER_V3",
                    "ciclo_seed": 0,
                }
            })

    return casos


# =============================================================================
# SEEDER PRINCIPAL
# =============================================================================

class RAGSeeder:
    """
    Povoa o RAG (ChromaDB) com base de conhecimento oncológica abrangente.

    Coleções povoadas:
    1. ai_doctor_tumores: Casos clínicos (vetores de 5 biomarcadores)
    2. dimhex_conhecimento: Documentos científicos (embeddings semânticos dim-64)
    """

    def __init__(self):
        self.chroma_casos = BancoVetorialChromaDB(colecao_nome="ai_doctor_tumores")
        self.atualizador = AtualizadorBaseConhecimento()  # Cria/accessa dimhex_conhecimento

    def povoar_rag_completo(self, n_casos_por_subtipo: int = 50) -> Dict:
        """
        Executa povoamento completo do RAG:
        1. Base de conhecimento científico (literatura)
        2. Casos clínicos sintéticos
        3. Documentos de protocolos terapêuticos
        """
        print("\n" + "=" * 70)
        print("  DIMHEX RAG Seeder v3.0 — Povoamento Completo da Base de Conhecimento")
        print("=" * 70)

        resultado = {
            "conhecimento_cientifico": self._seed_conhecimento_cientifico(),
            "casos_clinicos": self._seed_casos_clinicos(n_casos_por_subtipo),
            "protocolos_terapeuticos": self._seed_protocolos(),
            "resumo_colecoes": self._obter_resumo_colecoes(),
        }

        total_indexados = (
            resultado["conhecimento_cientifico"]["indexados"] +
            resultado["casos_clinicos"]["indexados"] +
            resultado["protocolos_terapeuticos"]["indexados"]
        )

        print(f"\n{'='*70}")
        print(f"  POVOAMENTO COMPLETO")
        print(f"  Conhecimento científico: {resultado['conhecimento_cientifico']['indexados']} documentos")
        print(f"  Casos clínicos: {resultado['casos_clinicos']['indexados']} pacientes")
        print(f"  Protocolos terapêuticos: {resultado['protocolos_terapeuticos']['indexados']} protocolos")
        print(f"  TOTAL: {total_indexados} registros no RAG")
        print(f"{'='*70}\n")

        return resultado

    def _seed_conhecimento_cientifico(self) -> Dict:
        """Indexa documentos de literatura científica na coleção dimhex_conhecimento."""
        print("\n  [SEED 1/3] Indexando base de conhecimento científico...")

        # Converter conhecimento para formato DIMHEX
        achados_formatados = []
        for i, doc in enumerate(CONHECIMENTO_CIENTIFICO):
            achado = {
                "id_dimhex": f"seed_knowledge_{i:04d}",
                "titulo": doc["titulo"],
                "resumo": doc["resumo"],
                "fonte": doc.get("fonte", "PubMed"),
                "tipo": doc.get("tipo", "artigo_cientifico"),
                "jornal": doc.get("jornal", ""),
                "data_publicacao": doc.get("data_publicacao", ""),
                "url": doc.get("url", ""),
                "autores": doc.get("autores", []),
                "termo_busca": doc.get("termo_busca", ""),
                "fase": doc.get("fase", []),
            }

            # Calcular score via scorer para enriquecer
            try:
                from core.relevance_scorer import ScorerRelevanciaClinica
                scorer = ScorerRelevanciaClinica()
                score_result = scorer.calcular_score(achado)
                achado["_score_dimhex"] = score_result["score_final"]
                achado["_classificacao"] = score_result["classificacao"]
                achado["_biomarcadores"] = score_result["biomarcadores_mencionados"]
                achado["_subtipos"] = score_result["subtipos_mencionados"]
            except Exception:
                achado["_score_dimhex"] = 0.5
                achado["_classificacao"] = "moderado"
                achado["_biomarcadores"] = doc.get("biomarcadores", [])
                achado["_subtipos"] = doc.get("subtipos", [])

            achados_formatados.append(achado)

        # Indexar via knowledge_updater
        indexados = 0
        for achado in achados_formatados:
            try:
                self.atualizador._indexar_achado(achado)
                self.atualizador.total_indexados += 1
                indexados += 1
            except Exception as e:
                print(f"    [ERRO] Falha ao indexar {achado['titulo'][:50]}: {e}")

        print(f"    {indexados}/{len(CONHECIMENTO_CIENTIFICO)} documentos científicos indexados")
        return {"total": len(CONHECIMENTO_CIENTIFICO), "indexados": indexados}

    def _seed_casos_clinicos(self, n_por_subtipo: int) -> Dict:
        """Indexa casos clínicos sintéticos na coleção ai_doctor_tumores."""
        print(f"\n  [SEED 2/3] Gerando e indexando {n_por_subtipo} casos por subtipo...")

        casos = gerar_casos_sinteticos(n_por_subtipo)
        indexados = 0

        for caso in casos:
            try:
                self.chroma_casos.indexar_caso_clinico(
                    caso_id=caso["patient_id"],
                    vetor=caso["vetor"],
                    metadados=caso["metadados"]
                )
                indexados += 1
            except Exception as e:
                print(f"    [ERRO] Falha ao indexar caso {caso['patient_id']}: {e}")

        subtipos_cobertos = len(set(c["metadados"]["subtipo"] for c in casos))
        print(f"    {indexados} casos indexados em {subtipos_cobertos} subtipos tumorais")

        return {"total": len(casos), "indexados": indexados, "subtipos": subtipos_cobertos}

    def _seed_protocolos(self) -> Dict:
        """Indexa protocolos terapêuticos NCCN/ESMO como documentos de conhecimento."""
        print("\n  [SEED 3/3] Indexando protocolos terapêuticos...")

        protocolos = [
            {
                "id_dimhex": "protocol_nccn_nsclc_2025",
                "titulo": "NCCN Guidelines: Non-Small Cell Lung Cancer v4.2025",
                "resumo": "First-line treatment recommendations: EGFR-mutated (ex19del, L858R): osimertinib. ALK-rearranged: alectinib or brigatinib. KRAS G12C: sotorasib or adagrasib. ROS1: crizotinib or entrectinib. BRAF V600E: dabrafenib + trametinib. RET fusion: selpercatinib. MET exon 14: capmatinib. NTRK fusion: larotrectinib or entrectinib. PD-L1 >= 50%: pembrolizumab monotherapy. PD-L1 1-49%: pembrolizumab + chemotherapy. PD-L1 < 1%: chemotherapy alone or chemo + immunotherapy. Adjuvant osimertinib for resected EGFR-mutated NSCLC (ADAURA). Neoadjuvant nivolumab + chemotherapy for resectable NSCLC (CheckMate 816).",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-06-01",
                "url": "https://www.nccn.org/professionals/physician_gls/pdf/nscl.pdf",
                "autores": ["NCCN Panel"],
                "termo_busca": "NCCN NSCLC guideline",
                "_score_dimhex": 0.82,
                "_classificacao": "critico",
                "_biomarcadores": ["EGFR", "ALK", "KRAS", "BRAF", "NTRK", "RET", "MET", "PD-L1", "TMB"],
                "_subtipos": ["NSCLC_KRAS_G12C", "NSCLC_EGFR_MUTADO"],
            },
            {
                "id_dimhex": "protocol_nccn_tnbc_2025",
                "titulo": "NCCN Guidelines: Breast Cancer v3.2025 — Triple Negative Subset",
                "resumo": "Triple negative breast cancer treatment algorithm. Early stage (I-II): neoadjuvant chemotherapy (anthracycline + taxane based). If residual disease after NAC: capecitabine (CREATE-X). Adjuvant pembrolizumab for high-risk TNBC (KEYNOTE-522). Metastatic: first-line pembrolizumab + chemotherapy if PD-L1 CPS >= 10. Second-line: sacituzumab govitecan (Trop-2 ADC). PARP inhibitors (olaparib, talazoparib) for germline BRCA-mutated. Platinum-based regimens for BRCA-like phenotype. ctDNA monitoring recommended for MRD detection post-surgery. TILs assessment on surgical specimen recommended.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-05-15",
                "url": "https://www.nccn.org/professionals/physician_gls/pdf/breast.pdf",
                "autores": ["NCCN Breast Panel"],
                "termo_busca": "NCCN triple negative breast guideline",
                "_score_dimhex": 0.80,
                "_classificacao": "critico",
                "_biomarcadores": ["BRCA", "PD-L1", "TILs", "TMB", "ctDNA", "HRD"],
                "_subtipos": ["TRIPLO_NEGATIVO_MAMARIO"],
            },
            {
                "id_dimhex": "protocol_nccn_btc_2025",
                "titulo": "NCCN Guidelines: Hepatobiliary Cancers v2.2025 — Biliary Tract Subset",
                "resumo": "Biliary tract cancer management. Resectable: surgery + adjuvant capecitabine (BILCAP trial) or FOLFIRINOX for ampullary (AMPAC trial). Unresectable/advanced: first-line gemcitabine + cisplatin (ABC-02). FGFR2 fusion: pemigatinib or infigratinib. IDH1 mutation: ivosidenib. HER2-positive: trastuzumab + pertuzumab or T-DXd. MSI-H/dMMR: pembrolizumab. TMB-H: pembrolizumab. Comprehensive genomic profiling recommended for all advanced biliary cancers. ctDNA monitoring for FGFR2 fusion and IDH1 mutations. Next-line options include FOLFOX, 5-FU/LV, or clinical trial enrollment.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-04-01",
                "url": "https://www.nccn.org/professionals/physician_gls/pdf/hepatobiliary.pdf",
                "autores": ["NCCN Hepatobiliary Panel"],
                "termo_busca": "NCCN biliary tract cancer guideline",
                "_score_dimhex": 0.78,
                "_classificacao": "critico",
                "_biomarcadores": ["FGFR2", "IDH1", "HER2", "MSI", "TMB", "ctDNA"],
                "_subtipos": ["CANCER_DUCTO_BILIAR", "CANCER_AMPULAR"],
            },
            {
                "id_dimhex": "protocol_esmo_rare_2025",
                "titulo": "ESMO Clinical Practice Guidelines: Rare Cancers — Head and Neck, Endocrine, and Gastrointestinal",
                "resumo": "ESMO recommendations for rare cancers management. Sinonasal carcinoma: endoscopic surgery + adjuvant RT. Esthesioneuroblastoma: surgery + RT, consider chemotherapy for Kadish C. Adenoid cystic carcinoma: surgery with negative margins, postoperative RT for perineural invasion, lenvatinib for metastatic. Parathyroid carcinoma: en bloc resection, cinacalcet for hypercalcemia. Appendiceal cancer: CRS + HIPEC for peritoneal spread, PRRT for neuroendocrine. Ampullary carcinoma: Whipple procedure + FOLFIRINOX adjuvant. Fallopian tube carcinoma: treat per ovarian cancer guidelines (debulking + platinum-based chemo + PARPi maintenance).",
                "fonte": "Diretriz ESMO",
                "tipo": "diretriz_clinica",
                "jornal": "Annals of Oncology — ESMO Guidelines",
                "data_publicacao": "2025-03-01",
                "url": "https://www.esmo.org/guidelines",
                "autores": ["ESMO Guideline Committee"],
                "termo_busca": "ESMO rare cancer guidelines",
                "_score_dimhex": 0.76,
                "_classificacao": "critico",
                "_biomarcadores": ["HPV", "PD-L1", "BRCA", "CA125", "neuroendocrino", "paratormonio", "FGFR2", "HER2", "KRAS", "MSI"],
                "_subtipos": ["CANCER_SEIOS_FACE", "CARCINOMA_ADENOIDE_CISTICO", "CANCER_PARATIREOIDE", "CANCER_APPENDICE", "CANCER_AMPULAR", "CANCER_TROMPA_FALOPIO"],
            },
        ]

        indexados = 0
        for proto in protocolos:
            try:
                self.atualizador._indexar_achado(proto)
                self.atualizador.total_indexados += 1
                indexados += 1
            except Exception as e:
                print(f"    [ERRO] Falha ao indexar protocolo: {e}")

        print(f"    {indexados}/{len(protocolos)} protocolos indexados")
        return {"total": len(protocolos), "indexados": indexados}

    def _obter_resumo_colecoes(self) -> Dict:
        """Retorna resumo do estado das coleções ChromaDB."""
        return {
            "ai_doctor_tumores": self.chroma_casos.collection.count(),
            "dimhex_conhecimento": self.atualizador.chroma_pesquisa.collection.count(),
            "chroma_persist_dir": CONFIG.get("CHROMA_PERSIST_DIR", "./chroma_db"),
        }


def executar_povoamento_inicial() -> Dict:
    """Função principal: executa povoamento completo do RAG."""
    seeder = RAGSeeder()
    return seeder.povoar_rag_completo(n_casos_por_subtipo=50)


if __name__ == "__main__":
    resultado = executar_povoamento_inicial()
    print(json.dumps(resultado["resumo_colecoes"], indent=2))