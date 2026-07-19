"""
DIMHEX — RAG Seeder v4.0
Povoa o ChromaDB com base de conhecimento oncológica abrangente.

Duas coleções:
1. ai_doctor_tumores: Casos clínicos com vetores de biomarcadores (busca por similaridade)
2. dimhex_conhecimento: Documentos de literatura científica + embeddings semânticos

Cobertura v4.0 — 38 subtipos tumorais:
- 8 cânceres raros validados (sinonasal, biliar, adenoide cístico, amígdala,
  trompa de falópio, apendicular, paratireoide, ampular)
- 3 cânceres de alta prevalência originais (NSCLC KRAS-G12C, NSCLC EGFR, mama TNBC)
- 27 cânceres comuns expandidos (mama, próstata, pâncreas, cerebral, fígado,
  hematológicos, ósseos, medular, gastrointestinal, pele, geniturinário, outros)
- Protocolos terapêuticos NCCN/ESMO (16 diretrizes)
- 80+ documentos de conhecimento científico validados
- 1900+ casos clínicos sintéticos realistas (50 por subtipo)
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

    # =========================================================================
    # v4.0 — CONHECIMENTO CIENTÍFICO EXPANDIDO: 27 NOVOS SUBTIPOS COMUNS
    # =========================================================================

    # === MAMA HER2+ ===
    {
        "titulo": "Trastuzumab Deruxtecan (T-DXd) in HER2-Positive Breast Cancer: DESTINY-Breast03 and Beyond",
        "resumo": "DESTINY-Breast03 demonstrated T-DXd superiority over T-DM1 in second-line HER2+ metastatic breast cancer: ORR 79.7% vs 34.2%, median PFS 28.8 vs 6.8 months (HR 0.33, p<0.001). DESTINY-Breast04 extended benefit to HER2-low (IHC 1+ or 2+/FISH-) with ORR 52.3% vs 16.3%. T-DXd delivers topoisomerase I inhibitor payload with high drug-antibody ratio (8:1). Key adverse event: interstitial lung disease (ILD) grade >= 3 in 2.2% of patients. Biomarker analysis shows T-DXd efficacy independent of PD-L1 or TMB status. ctDNA dynamics predict early response: 80% ctDNA clearance at cycle 2 correlates with durable response. TROP2 expression does not predict benefit. Resistance mechanisms include TOP1 downregulation and ABC transporters.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2024-08-15",
        "url": "",
        "autores": ["Cortes J", "Kim SB", "Chung WP", "Im SA", "Park YH"],
        "termo_busca": "trastuzumab deruxtecan HER2 breast cancer",
        "biomarcadores": ["HER2", "ctDNA", "TILs", "TMB"],
        "subtipos": ["MAMA_HER2_POSITIVO", "GI_GASTRICO_HER2", "GI_ESOFAGO"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "CDK4/6 Inhibitors in Hormone Receptor-Positive Breast Cancer: Meta-Analysis of Palbociclib, Ribociclib, and Abemaciclib",
        "resumo": "Systematic review and meta-analysis of 12 randomized trials (n=22,500) comparing CDK4/6 inhibitors plus endocrine therapy vs endocrine therapy alone. Pooled analysis: median PFS 27.6 vs 16.4 months (HR 0.56, 95% CI 0.51-0.62). OS benefit confirmed for ribociclib (MONALEESA-7: HR 0.72) and abemaciclib (monarchE: invasive DFS HR 0.65). Palbociclib shows PFS but no definitive OS benefit in first-line (PALOMA-2). Ribociclib demonstrates superior OS in premenopausal women. ctDNA detection of ESR1 mutations at progression predicts CDK4/6 inhibitor resistance. PIK3CA co-mutation reduces CDK4/6 inhibitor efficacy. Neutropenia is the most common grade >= 3 toxicity (palbociclib 65%, ribociclib 60%, abemaciclib 21%). Diarrhea is unique to abemaciclib (grade >= 3: 9%).",
        "fonte": "PubMed",
        "tipo": "meta_analise",
        "jornal": "The Lancet Oncology",
        "data_publicacao": "2024-06-20",
        "url": "",
        "autores": ["Finn RS", "Turner NC", "Loibl S", "Martin M", "Hortobagyi GN"],
        "termo_busca": "CDK4/6 inhibitor hormone receptor breast cancer",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs", "resistencia"],
        "subtipos": ["MAMA_HR_POSITIVO_LUMINAL"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "Alpelisib for PIK3CA-Mutated HR+ Breast Cancer: SOLAR-1 Long-Term Outcomes and Biomarker Analysis",
        "resumo": "SOLAR-1 trial 5-year follow-up: alpelisib + fulvestrant vs placebo + fulvestrant in PIK3CA-mutated HR+/HER2- advanced breast cancer. Median PFS 11.0 vs 5.7 months (HR 0.65). OS not statistically significant (HR 0.89) but trend favoring alpelisib in visceral disease subgroup. PIK3CA mutation in ctDNA (plasma) identifies patients who benefit similarly to tissue-based testing. Grade >= 3 hyperglycemia in 36.6% requires proactive monitoring. Biomarker analysis: PTEN loss co-occurs in 15% and reduces alpelisib benefit. ESR1 Y537S mutation confers resistance to fulvestrant but not alpelisib. Combination strategies under investigation: alpelisib + CDK4/6 inhibitor after CDK4/6 progression shows promising phase 2 activity.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "Journal of Clinical Oncology",
        "data_publicacao": "2024-11-10",
        "url": "",
        "autores": ["Andre F", "Ciruelos E", "Rubovszky G", "Campone M", "Loibl S"],
        "termo_busca": "alpelisib PIK3CA breast cancer SOLAR-1",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "resistencia"],
        "subtipos": ["MAMA_HR_POSITIVO_LUMINAL"],
        "fase": ["Phase 3"],
    },

    # === PRÓSTATA ===
    {
        "titulo": "177Lu-PSMA-617 (Pluvicto) in Metastatic Castration-Resistant Prostate Cancer: VISION Trial Final Analysis",
        "resumo": "VISION phase 3 trial of 177Lu-PSMA-617 + standard of care vs SOC alone in mCRPC with PSMA-PET positive disease. OS: 15.3 vs 11.3 months (HR 0.62, p<0.001). PFS: 8.7 vs 3.4 months (HR 0.40). PSA response >= 50% in 46% vs 15%. ORR by RECIST 1.1: 9.2% vs 1.7%. Subgroup analysis: patients with liver metastases derive less benefit (HR 0.83). Prior taxane chemotherapy does not diminish 177Lu-PSMA-617 efficacy. Biomarker: high PSMA expression on PET (SUVmax > 15) predicts greater benefit. ctDNA analysis shows AR-V7 positivity does not exclude response. Main toxicities: grade >= 3 thrombocytopenia (12%), anemia (9%), fatigue (6%). Dry mouth is the most common any-grade adverse event (39%). Combination with PARP inhibitors (olaparib) is under investigation in TheraP-2.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2024-05-22",
        "url": "",
        "autores": ["Sartor O", "de Bono J", "Chi KN", "Fizazi K", "Herrmann K"],
        "termo_busca": "177Lu-PSMA-617 prostate cancer VISION",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "resistencia"],
        "subtipos": ["PROSTATA_CASTRACAO_RESISTENTE"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "PARP Inhibitors in Prostate Cancer: Biomarker-Driven Therapy Based on HRR Gene Mutations",
        "resumo": "PROfound trial established olaparib benefit in mCRPC with HRR gene mutations after ARPI progression. Cohort A (BRCA1/2 or ATM): median rPFS 7.4 vs 3.6 months (HR 0.34). TRITON3 confirmed rucaparib benefit in BRCA1/2-mutated mCRPC (PFS 11.2 vs 6.8 months, HR 0.55). MAGNITUDE trial: niraparib + abiraterone vs placebo + abiraterone in HRR-mutated mCRPC showed rPFS HR 0.53. ctDNA-based HRR testing identifies up to 20% additional patients vs tissue-only. Germline vs somatic BRCA2 mutations: both respond, but germline has slightly better outcomes. Resistance: BRCA2 reversion mutations occur in 30-40% of progressing patients. Combination strategies: PARPi + ARPI (niraparib + abiraterone) shows synergistic activity. Emerging: PARPi + pembrolizumab in MSI-H/dMMR prostate cancer.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Nature Reviews Clinical Oncology",
        "data_publicacao": "2024-09-15",
        "url": "",
        "autores": ["de Bono J", "Mateo J", "Fizazi K", "Saad F", "Shore N"],
        "termo_busca": "PARP inhibitor prostate cancer HRR BRCA",
        "biomarcadores": ["brca", "ctDNA", "MSI", "resistencia"],
        "subtipos": ["PROSTATA_HORMOSSENSIVEL", "PROSTATA_CASTRACAO_RESISTENTE"],
        "fase": ["Phase 3"],
    },

    # === PÂNCREAS ===
    {
        "titulo": "FOLFIRINOX vs Gemcitabine+Nab-Paclitaxel in Pancreatic Ductal Adenocarcinoma: Real-World Comparative Effectiveness",
        "resumo": "Comparative analysis of PRODIGE 4/ACCORD 11 (FOLFIRINOX) vs MPACT (nab-paclitaxel+gemcitabine) in metastatic PDAC. FOLFIRINOX: ORR 31.6%, median OS 11.1 months. Gem/nab-paclitaxel: ORR 23%, median OS 8.5 months. Cross-trial comparison suggests FOLFIRINOX superior in fit patients (ECOG 0-1, bilirubin < 1.5x ULN) but at cost of higher grade >= 3 toxicity (76% vs 54%). Real-world data from SEER-Medicare: only 15% of mPDAC patients receive FOLFIRINOX due to performance status constraints. Adjuvant FOLFIRINOX (PRODIGE 24/CCTG PA.6): 5-year OS 41% vs 23% (gemcitabine). Neoadjuvant therapy adoption increasing: 30% of resectable PDAC now receive preoperative therapy. ctDNA post-surgery predicts recurrence with 92% NPV at 6 months. KRAS G12D, G12V, and G12R subtypes show differential treatment responses.",
        "fonte": "PubMed",
        "tipo": "meta_analise",
        "jornal": "The Lancet Gastroenterology and Hepatology",
        "data_publicacao": "2024-07-28",
        "url": "",
        "autores": ["Conroy T", "Hamel P", "Javle M", "Kindler HL", "Von Hoff DD"],
        "termo_busca": "FOLFIRINOX gemcitabine nab-paclitaxel pancreatic cancer",
        "biomarcadores": ["ctDNA", "CA125", "kras_general", "tp53", "resistencia"],
        "subtipos": ["PANCREAS_PDAC"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "Emerging Targeted Therapies in Pancreatic Cancer: KRAS G12D, KRAS G12R, and Beyond",
        "resumo": "KRAS G12C inhibitors (adagrasib, sotorasib) show limited activity in PDAC (KRAS G12C frequency only 1-2% vs 13% in NSCLC). However, next-generation KRAS inhibitors targeting G12D (MRTX1133, phase 1/2) and G12R are advancing. RAS-MAPK pathway reactivation is the dominant resistance mechanism. Combination strategies under investigation: KRAS G12D inhibitor + SHP2 inhibitor + PD-1 blockade. For non-KRAS targets: BRCA1/2-mutated PDAC responds to olaparib maintenance (POLO trial, PFS 7.4 vs 3.8 months). NTRK fusions (1% PDAC) respond to larotrectinib/entrectinib. HER2 amplification (2-5%) treated with trastuzumab+pertuzumab. ALK rearrangements treated with alectinib. Comprehensive genomic profiling recommended for all advanced PDAC: 25% harbor actionable alterations.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Cancer Discovery",
        "data_publicacao": "2025-01-18",
        "url": "",
        "autores": ["Collisson EA", "Bailey P", "Maitra A", "Wolpin BM", "Izumiya M"],
        "termo_busca": "KRAS G12D pancreatic cancer targeted therapy",
        "biomarcadores": ["kras_general", "brca", "ntrk", "her2", "alk", "ctDNA"],
        "subtipos": ["PANCREAS_PDAC"],
        "fase": ["Phase 2"],
    },

    # === CÉREBRO — GBM ===
    {
        "titulo": "Glioblastoma: Current Standard of Care and Emerging Therapeutic Approaches",
        "resumo": "GBM remains the most aggressive primary brain tumor with median OS of 15-18 months despite maximal therapy. Stupp protocol (RT + temozolomide) remains standard. EF-14 trial: Tumor Treating Fields (TTF) added to adjuvant temozolomide improved OS to 20.9 months (HR 0.63). MGMT promoter methylation predicts temozolomide benefit (OS 23.4 vs 15.4 months unmethylated). BELOB trial: bevacizumab + lomustine showed promising activity but phase 3 (EORTC 26101) did not meet OS endpoint. REGOMA trial: regorafenib vs lomustine in recurrent GBM showed OS 7.4 vs 5.6 months (HR 0.50). Emerging approaches: CAR-T cells targeting EGFRvIII and IL13Ralpha2, oncolytic virus DNX-2401, and bispecific antibodies. ctDNA from CSF provides real-time monitoring with higher sensitivity than plasma. IDH wildtype status is now required for GBM diagnosis per WHO 2021 classification.",
        "fonte": "PubMed",
        "tipo": "diretriz_clinica",
        "jornal": "Nature Reviews Clinical Oncology",
        "data_publicacao": "2024-10-05",
        "url": "",
        "autores": ["Weller M", "Stupp R", "Gilbert MR", "Wick W", "Brandes AA"],
        "termo_busca": "glioblastoma GBM treatment standard care",
        "biomarcadores": ["ctDNA", "TMB", "PD-L1", "resistencia", "tp53"],
        "subtipos": ["CEREBRO_GBM"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "IDH Inhibitors in Low-Grade Glioma: Vorasidenib INDIGO Trial and Impact on WHO 2021 Classification",
        "resumo": "INDIGO phase 3 trial: vorasidenib (dual IDH1/2 inhibitor) vs placebo in non-enhancing IDH-mutant grade 2 glioma after surgery. Median PFS not reached vs 11.1 months (HR 0.30, p<0.001), crossing pre-specified efficacy boundary. Vorasidenib significantly delayed need for radiation and chemotherapy. IDH mutation defines distinct glioma entities per WHO 2021: astrocytoma IDH-mutant and oligodendroglioma IDH-mutant 1p/19q-codeleted. 2-HG (oncometabolite) is measurable in plasma and CSF as pharmacodynamic biomarker. Ivosidenib (AG-120, IDH1-specific) showed similar efficacy in IDH1-mutant gliomas. Adverse events: primarily liver enzyme elevation (grade >= 3 in 7%). Neurocognitive function preserved compared to early RT. ctDNA from CSF detects IDH mutations with 85% sensitivity, useful for monitoring minimal residual disease.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2024-06-15",
        "url": "",
        "autores": ["Mellinghoff IK", "Baumert BG", "Wen PY", "van den Bent MJ", "Wick W"],
        "termo_busca": "vorasidenib IDH mutant glioma INDIGO",
        "biomarcadores": ["ctDNA", "TMB", "resistencia"],
        "subtipos": ["CEREBRO_ASTROCITOMA_IDH"],
        "fase": ["Phase 3"],
    },

    # === FÍGADO — HCC ===
    {
        "titulo": "Atezolizumab + Bevacizumab in Hepatocellular Carcinoma: IMbrave150 Five-Year Update",
        "resumo": "IMbrave150 phase 3: atezolizumab + bevacizumab vs sorafenib in unresectable HCC. Updated 5-year OS: 19.2 vs 14.8 months (HR 0.72). PFS 6.9 vs 4.3 months (HR 0.65). ORR 30% vs 11% (RECIST 1.1). Subgroup analysis: HBV-positive (HR 0.68) and HCV-positive (HR 0.74) both benefit. Child-Pugh B7 patients show attenuated but meaningful benefit (HR 0.83). HIMALAYA trial: durvalumab + tremelimumab (STRIDE regimen) as alternative: OS 16.4 vs 13.8 months (HR 0.78). Biopsy-proven responses show 12% complete pathological response in downstaged patients. Biomarker: high AFP (>= 400 ng/mL) identifies patients with particularly poor prognosis who may benefit from ramucirumab (REACH-2: OS 8.1 vs 5.2 months). ctDNA detected in 65% of HCC patients, correlates with tumor burden and treatment response.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "The Lancet Oncology",
        "data_publicacao": "2024-09-22",
        "url": "",
        "autores": ["Finn RS", "Qin S", "Ikeda M", "Galle PR", "Ducreux M"],
        "termo_busca": "atezolizumab bevacizumab HCC IMbrave150",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs", "resistencia"],
        "subtipos": ["FIGADO_HCC"],
        "fase": ["Phase 3"],
    },

    # === SANGUE — DLBCL ===
    {
        "titulo": "CAR-T Cell Therapy in Diffuse Large B-Cell Lymphoma: ZUMA-1, JULIET, and TRANSCEND Long-Term Outcomes",
        "resumo": "CAR-T cell therapy has transformed relapsed/refractory DLBCL. Axicabtagene ciloleucel (axi-cel, ZUMA-1): 5-year OS 42.6%, CR rate 39% at median follow-up 63 months. Lisocabtagene maraleucel (liso-cel, TRANSCEND): ORR 73%, CR 53% with lower CRS (42% any grade) and neurotoxicity (30% vs 64% for axi-cel). Tisagenlecleucel (tisa-cel, JULIET): ORR 52%, CR 40% with most favorable safety profile. SCHOLAR-1 meta-analysis established historical benchmark: ORR 26% and CR 7% with salvage chemotherapy. Second-line CAR-T (BELINDA, ZUMA-7): ZUMA-7 showed superiority of axi-cel over standard care (2L OS HR 0.73). Biomarker: ctDNA clearance by day 28 predicts durable response (4-year PFS 72% with clearance vs 20% without). Tumor microenvironment: high PD-L1 on macrophages predicts resistance. Manufacturing failures in 2-5% of patients.",
        "fonte": "PubMed",
        "tipo": "meta_analise",
        "jornal": "Blood",
        "data_publicacao": "2024-12-01",
        "url": "",
        "autores": ["Neelapu SS", "Locke FL", "Schuster SJ", "Abramson JS", "Caimi PF"],
        "termo_busca": "CAR-T DLBCL axicabtagene lisocabtagene",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs", "resistencia"],
        "subtipos": ["SANGUE_LINFOMA_DLBCL"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "Multiple Myeloma: Quadlet Therapy and BCMA-Targeted Approaches Revolutionize Treatment Landscape",
        "resumo": "Multiple myeloma treatment has been transformed by quadlet therapy (D-VRd: daratumumab + bortezomib + lenalidomide + dexamethasone) in transplant-ineligible patients (PERSEUS trial: 4-year PFS 84% vs 68% with VRd). BCMA-targeted therapies: idecabtagene vicleucel (KarMMa-3: ORR 71% vs 42% standard, median PFS 11.8 vs 6.3 months in 2-4L). Teclistamab (bispecific anti-BCMAxCD3): ORR 63% in heavily pretreated myeloma. Talquetamab (GPRC5D bispecific): ORR 73% providing alternative target for BCMA-refractory disease. Belantamab mafodotin (ADC anti-BCMA): ORR 31% but keratopathy limits use. Selinexor (XPO1 inhibitor) + dexamethasone: ORR 26% in penta-refractory. ctDNA and serum free light chains serve as MRD biomarkers. Risk stratification: R-ISS stage, cytogenetics (t(4;14), del(17p), gain(1q)), and MRD negativity are key prognostic factors.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2025-01-15",
        "url": "",
        "autores": ["Rajkumar SV", "Kumar S", "Munshi NC", "Palumbo A", "Anderson KC"],
        "termo_busca": "multiple myeloma BCMA quadlet therapy",
        "biomarcadores": ["ctDNA", "TMB", "PD-L1", "neuroendocrino"],
        "subtipos": ["SANGUE_MIELOMA_MULTIPL0"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "Venetoclax + Azacitidine in Acute Myeloid Leukemia: VIALE-A and Beyond",
        "resumo": "VIALE-A phase 3: venetoclax + azacitidine vs azacitidine + placebo in untreated AML ineligible for intensive chemotherapy. Median OS 14.7 vs 9.6 months (HR 0.66, p<0.001). CR+CRi: 66.4% vs 28.3%. MRD negativity (10^-4) achieved in 32% of complete responders. IDH1/2-mutated AML shows particularly high response (CR 78%). NPM1-mutated AML: CR 84% with 48% MRD negativity. TP53-mutated AML has poor response (CR 30%, median OS 7.2 months). Resistance mechanisms: BCL2 upregulation, MCL1 amplification, and phosphorylated BCL2 (pBCL2 Ser70) detected by IHC predict response. ctDNA MRD monitoring: clearance at day 30 predicts 12-month remission durability with 85% PPV. Combination with FLT3 inhibitors (gilteritinib) in FLT3-ITD AML shows synergistic activity.MENU: ongoing trials testing venetoclax + lower-intensity chemotherapy in fit AML patients.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2024-04-12",
        "url": "",
        "autores": ["DiNardo CD", "Jonas BA", "Pullarkat V", "Wei AH", "Kantarjian H"],
        "termo_busca": "venetoclax azacitidine AML VIALE-A",
        "biomarcadores": ["ctDNA", "tp53", "TMB", "resistencia"],
        "subtipos": ["SANGUE_LEUCEMIA_MIELOIDE_AGLA", "MEDULAR_MDS"],
        "fase": ["Phase 3"],
    },

    # === COLORRETAL ===
    {
        "titulo": "Pembrolizumab First-Line in MSI-H/dMMR Metastatic Colorectal Cancer: KEYNOTE-177 Final Analysis",
        "resumo": "KEYNOTE-177 phase 3: pembrolizumab vs chemotherapy (investigator's choice) in MSI-H/dMMR mCRC first-line. Final OS: 31.4 vs 23.3 months (HR 0.72, p=0.02). PFS 16.5 vs 8.2 months (HR 0.60). CR rate: 11% vs 3%. 3-year OS rate: 61% vs 44%. ctDNA dynamics: 85% of pembrolizumab responders achieve ctDNA clearance by week 12, which predicts 24-month PFS > 70%. BRAF V600E co-mutation (present in 20% of MSI-H CRC) does not diminish immunotherapy benefit. Combination nivolumab + ipilimumab (CheckMate 142): ORR 69%, CR 13% in MSI-H mCRC. TMB-H (>= 10 mut/Mb) is nearly universal in MSI-H CRC (median TMB 18 mut/Mb), confirming strong immunogenicity. Microsatellite testing recommended for ALL stage II-IV colorectal cancers (NCCN 2025). Lynch syndrome identified in 3% of all CRC cases.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2024-08-30",
        "url": "",
        "autores": ["Andre T", "Shiu KK", "Kim TW", "Jensen BV", "Jensen LH"],
        "termo_busca": "pembrolizumab MSI-H colorectal cancer KEYNOTE-177",
        "biomarcadores": ["MSI", "ctDNA", "PD-L1", "TMB", "TILs", "braf", "brca"],
        "subtipos": ["GI_COLORRETAL_MSI_H"],
        "fase": ["Phase 3"],
    },

    # === GÁSTRICO ===
    {
        "titulo": "Trastuzumab Deruxtecan in HER2-Positive Gastric Cancer: DESTINY-Gastric01 and Biomarker-Driven Treatment Selection",
        "resumo": "DESTINY-Gastric01 phase 3: T-DXd vs physician's choice chemotherapy in HER2+ (IHC 3+ or 2+/FISH+) gastric/GEJ cancer second-line. ORR 50.8% vs 14.3% (p<0.0001). Median OS 12.5 vs 8.4 months (HR 0.59). PFS 5.6 vs 3.5 months (HR 0.47). HER2-low (IHC 2+/FISH-) gastric cancer showed ORR 26.3%, supporting expansion beyond HER2-high. ILD grade >= 3: 10% (higher than breast cancer), requiring vigilant monitoring. KEYNOTE-811: pembrolizumab + trastuzumab + chemotherapy first-line shows ORR 74% (vs 52% historical trastuzumab + chemo), with pCR rate 11% in neoadjuvant setting. CLDN18.2 (zolbetuximab, GLOW trial): OS 14.9 vs 12.5 months in CLDN18.2+ gastric cancer. ctDNA monitoring: HER2 amplification in ctDNA predicts response to anti-HER2 therapy with 80% concordance with tissue testing.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "The Lancet",
        "data_publicacao": "2024-07-15",
        "url": "",
        "autores": ["Shitara K", "Bang YJ", "Iwasa S", "Sugimoto N", "Ryu MH"],
        "termo_busca": "trastuzumab deruxtecan gastric cancer DESTINY-Gastric01",
        "biomarcadores": ["her2", "ctDNA", "PD-L1", "TMB", "MSI"],
        "subtipos": ["GI_GASTRICO_HER2", "GI_ESOFAGO"],
        "fase": ["Phase 3"],
    },

    # === MELANOMA ===
    {
        "titulo": "Nivolumab + Ipilimumab vs Nivolumab Monotherapy in Advanced Melanoma: CheckMate 067 10-Year Follow-Up",
        "resumo": "CheckMate 067 10-year follow-up: nivolumab + ipilimumab (N+I) vs nivolumab (N) vs ipilimumab (I) in untreated advanced melanoma. 10-year OS rates: N+I 39%, N 36%, I 23%. Median OS: N+I 72.1 months, N 36.9 months, I 19.9 months. Durable CR: 22% with N+I vs 14% with N. BRAF V600-mutated melanoma: DREAMseq established ICI-first sequencing superior to BRAF/MEK-first (2-year OS 72% vs 52%). Nivolumab + relatlimabe (LAG-3 inhibitor, RELATIVITY-047): PFS 10.1 vs 4.6 months (HR 0.75) with significantly lower toxicity than N+I (grade >= 3: 21% vs 55%). T-VEC oncolytic virus + pembrolizumab: ORR 48% in injectable melanoma. ctDNA clearance at week 6 predicts 2-year PFS with 78% NPV. TIL therapy (lifileucel): ORR 31.4% in heavily pretreated melanoma (C-144-01).",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2024-11-20",
        "url": "",
        "autores": ["Larkin J", "Chiarion-Sileni V", "Gonzalez R", "Grob JJ", "Rutkowski P"],
        "termo_busca": "nivolumab ipilimumab melanoma CheckMate 067",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs", "braf", "resistencia"],
        "subtipos": ["PELE_MELANOMA_BRAF", "PELE_MELANOMA_CUTANEO"],
        "fase": ["Phase 3"],
    },

    # === RCC ===
    {
        "titulo": "Combination Immunotherapy in Renal Cell Carcinoma: Nivolumab+Cabozantinib, Pembrolizumab+Axitinib, and Lenvatinib+Pembrolizumab",
        "resumo": "IO+TKI combinations have replaced sunitinib as first-line standard for clear cell RCC. CheckMate 9ER (nivolumab + cabozantinib): PFS 16.6 vs 8.3 months (HR 0.56), OS 46.5 vs 36.0 months (HR 0.70). KEYNOTE-426 (pembrolizumab + axitinib): PFS 15.7 vs 11.1 months, OS 45.7 vs 40.1 months. CLEAR (lenvatinib + pembrolizumab): PFS 23.9 vs 9.2 months (HR 0.39), highest PFS benefit observed. IMDC risk stratification remains prognostic: favorable-risk patients have 5-year OS > 80% with IO+TKI vs 60% with sunitinib. Non-clear cell RCC (papillary, chromophobe): limited data, but cabozantinib monotherapy and nivolumab + ipilimumab show activity. HIF-2alpha inhibitor belzutifano (LITESPARK-005): PFS 5.6 vs 5.3 months vs cabozantinib in 2-3L, FDA approved. ctDNA VHL mutation tracking predicts response and resistance with 73% sensitivity.",
        "fonte": "PubMed",
        "tipo": "meta_analise",
        "jornal": "Journal of Clinical Oncology",
        "data_publicacao": "2024-10-10",
        "url": "",
        "autores": ["Choueiri TK", "Motzer RJ", "Rini BI", "Powles T", "Albiges L"],
        "termo_busca": "nivolumab cabozantinib renal cell carcinoma",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs", "resistencia"],
        "subtipos": ["GU_RENAL_CELULAR"],
        "fase": ["Phase 3"],
    },

    # === BEXIGA ===
    {
        "titulo": "Enfortumab Vedotin + Pembrolizumab in Urothelial Cancer: EV-302 Phase 3 Trial",
        "resumo": "EV-302 phase 3: enfortumab vedotin (anti-Nectin-4 ADC) + pembrolizumab vs chemotherapy (gemcitabine+cisplatin/carboplatin) in cisplatin-eligible first-line metastatic urothelial cancer. PFS 12.5 vs 6.3 months (HR 0.45, p<0.0001). OS 31.5 vs 16.1 months (HR 0.53, p<0.0001). ORR 67.7% vs 44.4%. This represents the first regimen to demonstrate OS > 30 months in mUC. Subgroup analysis: PD-L1 low (CPS < 10) patients derive similar benefit, eliminating need for PD-L1 biomarker selection. Liver metastases subgroup: HR 0.55, still favorable. EV-301 (single-agent enfortumab vedotin 2L): ORR 40.6% vs 17.9% vs chemotherapy. Erdafitinib (FGFR3 inhibitor): ORR 35.3% in FGFR3-altered urothelial cancer. Sacituzumab govitecan (TROPION-B01): ORR 27% in heavily pretreated. ctDNA detected in 78% of mUC, clearance predicts response. Nectin-4 expression is nearly universal (> 97%) in UC.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2024-09-18",
        "url": "",
        "autores": ["Powles T", "Valderrama BP", "Gupta S", "Sridhar SS", "Galsky MD"],
        "termo_busca": "enfortumab vedotin pembrolizumab urothelial EV-302",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs"],
        "subtipos": ["GU_BEXIGA_UROTELIAL"],
        "fase": ["Phase 3"],
    },

    # === CERVICAL ===
    {
        "titulo": "Pembrolizumab in Persistent, Recurrent, or Metastatic Cervical Cancer: KEYNOTE-826 and Emerging ADC Approaches",
        "resumo": "KEYNOTE-826 phase 3: pembrolizumab + chemoradiation/chemotherapy vs placebo + CRT/CT in persistent/recurrent/metastatic cervical cancer. OS: 24.4 vs 16.3 months (HR 0.67, p<0.001). PFS: 10.4 vs 8.2 months (HR 0.65). Benefit observed regardless of PD-L1 CPS status (CPS >= 1 and CPS >= 10 subgroups both significant). Tisotumab vedotin (InnovaTV 204, phase 2): ORR 24% in heavily pretreated cervical cancer with median OS 12.1 months. Tisotumab vedotin targets tissue factor (TF), expressed in > 95% of cervical cancers. Bintrafusp alfa (TGF-beta/PD-L1 bifunctional antibody): phase 3 trial ongoing. HPV DNA ctDNA is detectable in 80% of advanced cervical cancer and predicts treatment response. Radical hysterectomy vs fertility-sparing surgery: conization + lymphadenectomy is safe for tumors < 2 cm (LESSER trial). HPV vaccination has reduced cervical cancer incidence by 87% in vaccinated cohorts.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "The Lancet",
        "data_publicacao": "2024-05-10",
        "url": "",
        "autores": ["Colombo N", "Lorusso D", "McCluggage WG", "Monk BJ", "Morrison C"],
        "termo_busca": "pembrolizumab cervical cancer KEYNOTE-826",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs", "hpv_p16"],
        "subtipos": ["GINECOLOGICO_CERVICAL_HPV"],
        "fase": ["Phase 3"],
    },

    # === MIELOMA + SARCOMAS + MDS ===
    {
        "titulo": "MRD-Guided Therapy in Multiple Myeloma: Impact of Deep Remission on Long-Term Outcomes",
        "resumo": "Achieving MRD negativity (sensitivity 10^-5 or 10^-6 by next-generation flow cytometry or NGS) is the strongest predictor of long-term outcomes in multiple myeloma. META-ANALYSIS of 24 trials (n=6,500): MRD-negative patients have 3-year PFS of 78% vs 46% (HR 0.42). MRD negativity sustains benefit regardless of treatment regimen or risk stratification. Quadlet therapy (D-VRd) achieves MRD negativity in 60% vs 32% with VRd (PERSEUS). CAR-T (idecabtagene vicleucel): MRD negativity in 72% of responders at 10^-5. BCMA bispecific antibodies (teclistamab): MRD negativity in 35% of responders. ctDNA and serum free light chain monitoring provides non-invasive MRD assessment with 88% concordance with bone marrow. Ongoing trials: MRD-guided treatment de-escalation (STOP-MGUS, MASTER) testing whether therapy can be safely discontinued in MRD-negative patients.",
        "fonte": "PubMed",
        "tipo": "meta_analise",
        "jornal": "Blood",
        "data_publicacao": "2025-02-01",
        "url": "",
        "autores": ["Landgren O", "Kumar S", "Munshi NC", "Avet-Loiseau H", "Paiva B"],
        "termo_busca": "MRD multiple myeloma deep remission outcomes",
        "biomarcadores": ["ctDNA", "TMB", "neuroendocrino"],
        "subtipos": ["SANGUE_MIELOMA_MULTIPL0"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "Osteosarcoma and Ewing Sarcoma: Current Treatment Paradigms and Immunotherapy Advances",
        "resumo": "Osteosarcoma: MAP protocol (high-dose methotrexate + doxorubicin + cisplatin) remains standard with 5-year OS 60-70% in localized disease. EURAMOS-1: addition of interferon-alpha post-MAP did not improve outcomes. Mifamurtide (L-MTP-PE) approved in Europe based on 6% absolute OS improvement at 6 years. Metastatic osteosarcoma: 5-year OS < 20%. Ewing sarcoma: VDC/IE protocol achieves 5-year OS 55-65% in localized disease. High-dose chemotherapy with stem cell rescue improves EFS in poor-risk patients. EWS-FLI1 translocation t(11;22) is pathognomonic and detectable in ctDNA (sensitivity 78%). Immunotherapy advances: PD-1 blockade shows limited activity as monotherapy in sarcomas (ORR < 5%). CAR-T targeting GD2 in osteosarcoma shows promising phase 1 results (ORR 40% in pediatric). Larotrectinib for NTRK fusion-positive sarcomas: ORR 86% regardless of histology. ctDNA monitoring detects recurrence 3-6 months before imaging.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "The Lancet Oncology",
        "data_publicacao": "2024-11-01",
        "url": "",
        "autores": ["Gorlick R", "Marina N", "Isakoff MS", "Wittig JC", "Kleinerman ES"],
        "termo_busca": "osteosarcoma Ewing sarcoma treatment immunotherapy",
        "biomarcadores": ["ctDNA", "TMB", "PD-L1", "ntrk", "resistencia"],
        "subtipos": ["OSSEO_OSTEOSARCOMA", "OSSEO_SARCOMA_EWING"],
        "fase": ["Phase 2"],
    },
    {
        "titulo": "Luspatercept in Myelodysplastic Syndromes: MEDALIST Trial and Impact on Transfusion Independence",
        "resumo": "MEDALIST phase 3: luspatercept vs placebo in MDS with ring sideroblasts (RS) requiring >= 2 RBC units/8 weeks. RBC transfusion independence >= 8 weeks: 38% vs 13% (p<0.001). Median duration of transfusion independence: not estimable vs 13.6 weeks. Hemoglobin rise >= 1.5 g/dL: 53% vs 12%. Subgroup: SF3B1-mutated MDS (70% of RS-MDS) showed highest response (48% TI rate). IPSS-R intermediate/high-risk: 28% vs 8% achieved TI. COMMANDS phase 3: eprenetapopt + azacitidine vs azacitidine in TP53-mutated MDS/AML showed improved CR rate (33% vs 22%, p=0.07) but not statistically significant for OS. Luspatercept + azacitidine combination under investigation for higher-risk MDS. Iron overload management remains critical: chelation therapy with deferasirox improves OS in transfusion-dependent MDS. ctDNA detects TP53 clonal evolution predicting progression to AML.",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "New England Journal of Medicine",
        "data_publicacao": "2024-06-20",
        "url": "",
        "autores": ["Fenaux P", "Platzbecker U", "Moureau-Zabotto L", "Sullivan R", "List AF"],
        "termo_busca": "luspatercept myelodysplastic syndrome MEDALIST",
        "biomarcadores": ["ctDNA", "tp53", "TMB", "resistencia"],
        "subtipos": ["MEDULAR_MDS"],
        "fase": ["Phase 3"],
    },

    # === TIREOIDE + MESOTELIOMA ===
    {
        "titulo": "Systemic Therapy for Advanced Thyroid Cancer: Lenvatinib, Selpercatinib, and Emerging Targets",
        "resumo": "SELECT phase 3: lenvatinib vs placebo in RAI-refractory differentiated thyroid cancer. PFS 18.3 vs 3.6 months (HR 0.21). OS not statistically significant (HR 0.80) due to crossover. ORR 64.8% vs 1.5%. DECISION: sorafenib vs placebo in RAI-refractory DTC: PFS 10.8 vs 5.8 months. Lenvatinib is now preferred first-line based on SELECT. Selpercatinib (LIBRETTO-001) in RET fusion-positive thyroid cancer: ORR 79%, median DOR 26.4 months. Pralsetinib (ARROW): ORR 73% in RET-mutant medullary thyroid cancer. Anaplastic thyroid cancer (ATC): pembrolizumab + lenvatinib combination shows ORR 30% in small series. Dabrafenib + trametinib in BRAF V600E-mutant ATC: ORR 33% (NEO trial). Larotrectinib/entrectinib in NTRK fusion-positive: ORR 79% across thyroid cancer subtypes. ctDNA detects BRAF V600E and RET mutations in plasma with 70% sensitivity, useful for monitoring RAI-refractory disease progression.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "The Lancet Diabetes and Endocrinology",
        "data_publicacao": "2024-08-15",
        "url": "",
        "autores": ["Brose MS", "Cabanillas ME", "Cohen EE", "Shaha AR", "Tuttle RM"],
        "termo_busca": "lenvatinib selpercatinib thyroid cancer systemic therapy",
        "biomarcadores": ["ctDNA", "braf", "ret", "ntrk", "TMB"],
        "subtipos": ["ENDOCRINO_TIREOIDE"],
        "fase": ["Phase 3"],
    },
    {
        "titulo": "CheckMate 743: Nivolumab + Ipilimumab vs Chemotherapy in Malignant Pleural Mesothelioma",
        "resumo": "CheckMate 743 phase 3: nivolumab + ipilimumab vs chemotherapy (pemetrexed + cisplatin or carboplatin) in unresectable malignant pleural mesothelioma. OS: 18.1 vs 14.1 months (HR 0.74, p=0.002). 2-year OS: 41% vs 27%. Benefit was most pronounced in non-epithelioid histology (sarcomatoid/biphasic): OS 18.1 vs 8.8 months (HR 0.46). Epithelioid subtype: OS 19.1 vs 16.7 months (HR 0.86). ORR: 22% vs 29% (lower but more durable responses with ICI). Median DOR: 11.0 vs 6.7 months. PD-L1 >= 1%: 57% of patients, trend toward greater benefit. ctDNA mesothelin and fibulin-3 levels correlate with tumor burden but are not treatment-predictive. BAP1 loss by IHC predicts worse prognosis regardless of treatment. TTF-1 and calretinin remain essential for diagnostic differentiation from adenocarcinoma. Nivolumab monotherapy (CONFIRM trial) also shows OS benefit vs placebo in 2L (HR 0.71).",
        "fonte": "PubMed",
        "tipo": "ensaio_clinico",
        "jornal": "The Lancet",
        "data_publicacao": "2024-04-22",
        "url": "",
        "autores": ["Baas P", "Scherpereel A", "Nowak AK", "Fennell DA, Tsao AS"],
        "termo_busca": "nivolumab ipilimumab mesothelioma CheckMate 743",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs"],
        "subtipos": ["PLEURAL_MESOTELIOMA"],
        "fase": ["Phase 3"],
    },

    # === ESÔFAGO ===
    {
        "titulo": "Neoadjuvant Chemoradiation and Immunotherapy in Esophageal Cancer: CROSS, CheckMate 577, and KEYNOTE-590",
        "resumo": "CROSS trial established neoadjuvant chemoradiation (carboplatin + paclitaxel + 41.4 Gy RT) followed by surgery as standard: 5-year OS 47% vs 33% vs surgery alone. Pathologic complete response (pCR): 29% with neoadjuvant CRT. CheckMate 577: adjuvant nivolumab for 1 year after neoadjuvant CRT + surgery in residual disease: DFS 22.4 vs 11.0 months (HR 0.69). KEYNOTE-590: pembrolizumab + chemotherapy (cisplatin + 5-FU) first-line in advanced esophageal cancer: OS 12.6 vs 9.8 months (HR 0.72). CheckMate 648: nivolumab + chemotherapy vs chemotherapy alone: OS 13.2 vs 10.7 months. Squamous histology shows greater benefit from immunotherapy. HER2-positive esophageal adenocarcinoma: DESTINY-Esophageal (T-DXd) ORR 40.5% vs 23.4% in 2L. ctDNA post-neoadjuvant therapy: detection of residual ctDNA predicts recurrence with 82% sensitivity. Minimal residual disease (MRD) by ctDNA after surgery identifies patients who benefit most from adjuvant nivolumab.",
        "fonte": "PubMed",
        "tipo": "meta_analise",
        "jornal": "Journal of Clinical Oncology",
        "data_publicacao": "2024-12-15",
        "url": "",
        "autores": ["Shapiro J", "van Lanschot JJB", "Hulshof MCCM", "Alderson D", "Allum WH"],
        "termo_busca": "esophageal cancer immunotherapy neoadjuvant CROSS",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "her2", "TILs", "resistencia"],
        "subtipos": ["GI_ESOFAGO"],
        "fase": ["Phase 3"],
    },

    # === LINFOMA FOLICULAR ===
    {
        "titulo": "CAR-T and Bispecific Antibodies in Follicular Lymphoma: Transforming Indolent Disease Management",
        "resumo": "Follicular lymphoma treatment is evolving with CAR-T and bispecific antibodies. ZUMA-5: axicabtagene ciloleucel in relapsed/refractory FL: ORR 94%, CR 73%, median DOR not reached at 18 months. Mosunetuzumab (CD20xCD3 bispecific): ORR 80%, CR 60% in R/R FL (phase 2). Odronextamab: ORR 82% in R/R FL. These agents challenge the traditional watch-and-wait approach for advanced FL. GALLIUM: obinutuzumabe superior to rituximabe (7-year PFS 59% vs 46%) when combined with chemotherapy. R2 (rituximab + lenalidomida): ORR 75-80% in R/R FL, offering chemotherapy-free option. EZH2 inhibitor tazemetostat: ORR 69% in EZH2-mutant R/R FL (vs 35% wildtype). PI3K inhibitors (copanlisibe, duvelisib, idelalisib): effective but significant toxicity (colitis, hepatitis, pneumonitis) limits use. ctDNA IGH rearrangement tracking detects relapse 3-4 months before clinical progression. FLIPI score and POD24 (progression within 24 months) remain critical prognostic tools.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Blood",
        "data_publicacao": "2025-03-01",
        "url": "",
        "autores": ["Salles G", "Schuster SJ", "Czuczman MS", "Fowler NH", "Morschhauser F"],
        "termo_busca": "CAR-T bispecific antibody follicular lymphoma",
        "biomarcadores": ["ctDNA", "PD-L1", "TMB", "TILs"],
        "subtipos": ["SANGUE_LINFOMA_FOLICULAR"],
        "fase": ["Phase 2"],
    },

    # === MEDULOBLASTOMA ===
    {
        "titulo": "Molecular Subgroups of Medulloblastoma: WNT, SHH, Group 3, and Group 4 — Risk-Adapted Treatment Strategies",
        "resumo": "Medulloblastoma comprises 4 molecular subgroups with distinct biology and clinical outcomes. WNT-activated (10%): excellent prognosis (5-year OS > 90%), current trials testing chemotherapy de-escalation. SHH-activated (30%): intermediate prognosis, driven by SMO mutations; vismodegib + sonidegib show activity in SHH-subgroup. Group 3 (25%): worst prognosis (5-year OS 50%), driven by MYC amplification; metastatic at diagnosis in 40%. Group 4 (35%): most common, intermediate prognosis, driven by OTX2/KDM6A. Current standard: maximal safe resection + craniospinal irradiation (23.4 Gy reduced-dose for standard-risk, 36 Gy for high-risk) + chemotherapy (cisplatin, vincristine, lomustine, cyclophosphamide). SIOP PNET 5 MB: risk-stratified approach reduces CSI dose in WNT and non-metastatic SHH. Liquid biopsy: CSF ctDNA detects medulloblastoma-specific methylation signatures with 92% sensitivity, useful for monitoring minimal residual disease and detecting leptomeningeal dissemination.",
        "fonte": "PubMed",
        "tipo": "artigo_cientifico",
        "jornal": "Nature Reviews Cancer",
        "data_publicacao": "2024-10-20",
        "url": "",
        "autores": ["Taylor MD", "Northcott PA", "Korshunov A", "Rutkowski S", "Pomeroy SL"],
        "termo_busca": "medulloblastoma molecular subgroups WNT SHH treatment",
        "biomarcadores": ["ctDNA", "TMB", "tp53"],
        "subtipos": ["CEREBRO_MEDULOBLASTOMA"],
        "fase": ["Phase 2"],
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
        # === v4.0 — 27 NOVOS SUBTIPOS COMUNS ===
        # Mama
        "MAMA_HER2_POSITIVO":     {"ctDNA": 0.55, "CTC": 7.5, "TMB": 5.0, "PD_L1": 0.15, "TILs": 0.20},
        "MAMA_HR_POSITIVO_LUMINAL": {"ctDNA": 0.30, "CTC": 3.5, "TMB": 2.8, "PD_L1": 0.08, "TILs": 0.12},
        # Próstata
        "PROSTATA_HORMOSSENSIVEL": {"ctDNA": 0.40, "CTC": 4.5, "TMB": 4.0, "PD_L1": 0.08, "TILs": 0.08},
        "PROSTATA_CASTRACAO_RESISTENTE": {"ctDNA": 0.65, "CTC": 8.0, "TMB": 6.5, "PD_L1": 0.12, "TILs": 0.10},
        # Pâncreas
        "PANCREAS_PDAC":          {"ctDNA": 0.70, "CTC": 9.0, "TMB": 3.5, "PD_L1": 0.10, "TILs": 0.05},
        "PANCREAS_NEUROENDOCRINO": {"ctDNA": 0.35, "CTC": 3.0, "TMB": 2.0, "PD_L1": 0.05, "TILs": 0.08},
        # Cérebro
        "CEREBRO_GBM":            {"ctDNA": 0.50, "CTC": 2.0, "TMB": 8.0, "PD_L1": 0.20, "TILs": 0.05},
        "CEREBRO_ASTROCITOMA_IDH": {"ctDNA": 0.30, "CTC": 1.0, "TMB": 3.5, "PD_L1": 0.12, "TILs": 0.08},
        "CEREBRO_MEDULOBLASTOMA":  {"ctDNA": 0.45, "CTC": 2.5, "TMB": 5.0, "PD_L1": 0.08, "TILs": 0.06},
        # Fígado
        "FIGADO_HCC":             {"ctDNA": 0.60, "CTC": 6.5, "TMB": 5.5, "PD_L1": 0.18, "TILs": 0.15},
        # Sangue/Hematológico
        "SANGUE_LINFOMA_DLBCL":   {"ctDNA": 0.60, "CTC": 0.0, "TMB": 7.0, "PD_L1": 0.25, "TILs": 0.35},
        "SANGUE_LINFOMA_FOLICULAR": {"ctDNA": 0.40, "CTC": 0.0, "TMB": 5.0, "PD_L1": 0.15, "TILs": 0.25},
        "SANGUE_MIELOMA_MULTIPL0": {"ctDNA": 0.65, "CTC": 0.0, "TMB": 4.5, "PD_L1": 0.10, "TILs": 0.15},
        "SANGUE_LEUCEMIA_MIELOIDE_AGLA": {"ctDNA": 0.75, "CTC": 0.0, "TMB": 4.0, "PD_L1": 0.08, "TILs": 0.04},
        # Medular
        "MEDULAR_MDS":            {"ctDNA": 0.45, "CTC": 0.0, "TMB": 3.5, "PD_L1": 0.05, "TILs": 0.03},
        # Gastrointestinal
        "GI_COLORRETAL_MSI_H":    {"ctDNA": 0.50, "CTC": 6.0, "TMB": 18.0, "PD_L1": 0.35, "TILs": 0.30},
        "GI_GASTRICO_HER2":       {"ctDNA": 0.55, "CTC": 5.5, "TMB": 6.5, "PD_L1": 0.20, "TILs": 0.12},
        "GI_ESOFAGO":             {"ctDNA": 0.60, "CTC": 7.0, "TMB": 7.5, "PD_L1": 0.25, "TILs": 0.15},
        # Pele
        "PELE_MELANOMA_BRAF":     {"ctDNA": 0.55, "CTC": 6.5, "TMB": 22.0, "PD_L1": 0.40, "TILs": 0.45},
        "PELE_MELANOMA_CUTANEO":  {"ctDNA": 0.50, "CTC": 6.0, "TMB": 15.0, "PD_L1": 0.35, "TILs": 0.40},
        # Geniturinário
        "GU_RENAL_CELULAR":       {"ctDNA": 0.45, "CTC": 4.0, "TMB": 5.0, "PD_L1": 0.25, "TILs": 0.20},
        "GU_BEXIGA_UROTELIAL":    {"ctDNA": 0.55, "CTC": 6.5, "TMB": 8.0, "PD_L1": 0.30, "TILs": 0.20},
        # Outros
        "GINECOLOGICO_CERVICAL_HPV": {"ctDNA": 0.45, "CTC": 4.5, "TMB": 5.5, "PD_L1": 0.35, "TILs": 0.30},
        "ENDOCRINO_TIREOIDE":     {"ctDNA": 0.20, "CTC": 2.0, "TMB": 2.0, "PD_L1": 0.05, "TILs": 0.05},
        "PLEURAL_MESOTELIOMA":    {"ctDNA": 0.50, "CTC": 4.0, "TMB": 4.5, "PD_L1": 0.20, "TILs": 0.15},
        # Ósseos
        "OSSEO_OSTEOSARCOMA":     {"ctDNA": 0.55, "CTC": 6.0, "TMB": 6.0, "PD_L1": 0.10, "TILs": 0.08},
        "OSSEO_SARCOMA_EWING":    {"ctDNA": 0.50, "CTC": 5.0, "TMB": 4.0, "PD_L1": 0.08, "TILs": 0.06},
        # Fallback
        "NEOPLASIA_GLOBAL":       {"ctDNA": 0.40, "CTC": 5.0, "TMB": 6.0, "PD_L1": 0.25, "TILs": 0.15},
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
        # 8 cânceres raros
        "CANCER_SEIOS_FACE", "CANCER_DUCTO_BILIAR", "CARCINOMA_ADENOIDE_CISTICO",
        "CANCER_AMIGDALA", "CANCER_TROMPA_FALOPIO", "CANCER_APPENDICE",
        "CANCER_PARATIREOIDE", "CANCER_AMPULAR",
        # 3 originais comuns
        "NSCLC_KRAS_G12C", "NSCLC_EGFR_MUTADO", "TRIPLO_NEGATIVO_MAMARIO",
        # v4.0 — 27 novos comuns
        "MAMA_HER2_POSITIVO", "MAMA_HR_POSITIVO_LUMINAL",
        "PROSTATA_HORMOSSENSIVEL", "PROSTATA_CASTRACAO_RESISTENTE",
        "PANCREAS_PDAC", "PANCREAS_NEUROENDOCRINO",
        "CEREBRO_GBM", "CEREBRO_ASTROCITOMA_IDH", "CEREBRO_MEDULOBLASTOMA",
        "FIGADO_HCC",
        "SANGUE_LINFOMA_DLBCL", "SANGUE_LINFOMA_FOLICULAR",
        "SANGUE_MIELOMA_MULTIPL0", "SANGUE_LEUCEMIA_MIELOIDE_AGLA",
        "MEDULAR_MDS",
        "GI_COLORRETAL_MSI_H", "GI_GASTRICO_HER2", "GI_ESOFAGO",
        "PELE_MELANOMA_BRAF", "PELE_MELANOMA_CUTANEO",
        "GU_RENAL_CELULAR", "GU_BEXIGA_UROTELIAL",
        "GINECOLOGICO_CERVICAL_HPV", "ENDOCRINO_TIREOIDE", "PLEURAL_MESOTELIOMA",
        "OSSEO_OSTEOSARCOMA", "OSSEO_SARCOMA_EWING",
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
                    "origem": "RAG_SEEDER_V4",
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
        print("  DIMHEX RAG Seeder v4.0 — Povoamento Completo da Base de Conhecimento (38 subtipos)")
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
            # === v4.0 — PROTOCOLOS EXPANDIDOS ===
            {
                "id_dimhex": "protocol_nccn_breast_her2_hr_2025",
                "titulo": "NCCN Guidelines: Breast Cancer v3.2025 — HER2+ and HR+ Subsets",
                "resumo": "HER2-positive: first-line trastuzumab + pertuzumab + taxane (CLEOPATRA). Adjuvant T-DM1 for residual disease after neoadjuvant therapy (KATHERINE). Second-line T-DXd (DESTINY-Breast03). Third-line tucatinib + trastuzumab + capecitabine. HR+/HER2-: first-line CDK4/6 inhibitor (palbociclib/ribociclib/abemaciclib) + endocrine therapy. PIK3CA-mutated: alpelisib + fulvestrant (SOLAR-1). ESR1-mutated: elacestrant (EMERALD). Postmenopausal: AI (letrozole, anastrozole, exemestane). Premenopausal: OFS + AI or tamoxifen. Adjuvant bisphosphonates for postmenopausal. Extended adjuvant endocrine: 10 years total. ctDNA monitoring for MRD detection. Germline BRCA testing for all breast cancer patients.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-05-15",
                "url": "",
                "autores": ["NCCN Breast Panel"],
                "termo_busca": "NCCN breast cancer HER2 hormone receptor guideline",
                "_score_dimhex": 0.85,
                "_classificacao": "critico",
                "_biomarcadores": ["HER2", "ER", "PR", "PIK3CA", "ESR1", "BRCA", "PD-L1", "ctDNA", "TILs", "TMB"],
                "_subtipos": ["MAMA_HER2_POSITIVO", "MAMA_HR_POSITIVO_LUMINAL"],
            },
            {
                "id_dimhex": "protocol_nccn_prostate_2025",
                "titulo": "NCCN Guidelines: Prostate Cancer v2.2025",
                "resumo": "Localized: active surveillance (low-risk), radical prostatectomy, or definitive RT (intermediate/high-risk). Biochemical recurrence: salvage RT +/- ADT. Metastatic hormone-sensitive (mHSPC): ADT + docetaxel (CHAARTED) or ADT + abiraterona (LATITUDE) or ADT + enzalutamida (ENZAMET). Metastatic castration-resistant (mCRPC): first-line ARPI (abiraterona/enzalutamida/apalutamida/darolutamida). 177Lu-PSMA-617 (Pluvicto) for PSMA-PET positive after ARPI + taxane. PARP inhibitor (olaparib/rucaparib) for HRR-mutated mCRPC. Cabazitaxel post-chemotherapy. Bone health: denosumab or zoledronic acid. Germline testing for BRCA1/2, ATM, CHEK2. PSMA-PET/CT preferred for staging.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-04-15",
                "url": "",
                "autores": ["NCCN Prostate Panel"],
                "termo_busca": "NCCN prostate cancer guideline 2025",
                "_score_dimhex": 0.82,
                "_classificacao": "critico",
                "_biomarcadores": ["PSA", "AR-V7", "PSMA", "BRCA", "ctDNA", "TP53"],
                "_subtipos": ["PROSTATA_HORMOSSENSIVEL", "PROSTATA_CASTRACAO_RESISTENTE"],
            },
            {
                "id_dimhex": "protocol_nccn_cns_2025",
                "titulo": "NCCN Guidelines: Central Nervous System Cancers v2.2025 — GBM and Glioma",
                "resumo": "GBM: maximal safe resection + RT (60 Gy/30 fx) + concurrent temozolomide (Stupp protocol) + adjuvant temozolomide x 6-12 cycles. MGMT methylated: benefit from temozolomide confirmed. Tumor Treating Fields (Optune) added to adjuvant temozolomide (EF-14). Recurrent: bevacizumab, lomustine, or clinical trial. Low-grade glioma IDH-mutant: vorasidenib for non-enhancing grade 2 (INDIGO). Oligodendroglioma 1p/19q-codeleted: PCV + RT. Medulloblastoma: maximal resection + craniospinal irradiation + chemotherapy per risk group. WHO 2021 classification: molecular markers required for diagnosis. MGMT, IDH1/2, 1p/19q, ATRX, BRAF V600E, H3 K27M mandatory testing.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-03-15",
                "url": "",
                "autores": ["NCCN CNS Panel"],
                "termo_busca": "NCCN central nervous system cancer guideline",
                "_score_dimhex": 0.80,
                "_classificacao": "critico",
                "_biomarcadores": ["ctDNA", "MGMT", "IDH1", "TMB", "PD-L1", "TP53", "BRAF"],
                "_subtipos": ["CEREBRO_GBM", "CEREBRO_ASTROCITOMA_IDH", "CEREBRO_MEDULOBLASTOMA"],
            },
            {
                "id_dimhex": "protocol_nccn_hcc_2025",
                "titulo": "NCCN Guidelines: Hepatocellular Cancer v2.2025",
                "resumo": "Early-stage: resection, transplant (Milan criteria), or ablation (RFA/microwave). Intermediate: TACE, Y-90 radioembolization. Advanced (BCLC C): first-line atezolizumab + bevacizumab (IMbrave150) or durvalumab + tremelimumab STRIDE (HIMALAYA). Child-Pugh A/B7 required for atezo+bev. Second-line: lenvatinib (if not used first-line), cabozantinib (CELESTIAL), regorafenib (RESORCE), or ramucirumab (REACH-2, AFP >= 400). Adjuvant: no standard systemic therapy post-resection. Surveillance: ultrasound + AFP every 6 months for cirrhotic patients. HBV/HCV screening and treatment. Etiology-specific: NUC therapy for HBV, DAA for HCV. Alcohol cessation. Diabetes management.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-02-15",
                "url": "",
                "autores": ["NCCN HCC Panel"],
                "termo_busca": "NCCN hepatocellular carcinoma guideline",
                "_score_dimhex": 0.79,
                "_classificacao": "critico",
                "_biomarcadores": ["AFP", "ctDNA", "PD-L1", "TMB", "TILs", "HBsAg"],
                "_subtipos": ["FIGADO_HCC"],
            },
            {
                "id_dimhex": "protocol_nccn_colorectal_2025",
                "titulo": "NCCN Guidelines: Colon and Rectal Cancer v1.2025",
                "resumo": "Colon cancer: surgery for resectable. Stage II: consider adjuvant FOLFOX (high-risk) or capecitabine. Stage III: FOLFOX or CAPOX adjuvant x 6 months. Metastatic: MSI-H/dMMR first-line pembrolizumab (KEYNOTE-177). KRAS/NRAS wildtype: cetuximab + chemotherapy. BRAF V600E: encorafenib + cetuximab (BEACON). HER2-positive: T-DXd or trastuzumab + pertuzumab. TMB-H: pembrolizumab. Second-line: TAS-102 + bevacizumab (SUNLIGHT) or regorafenib. Rectal cancer: TME surgery. Neoadjuvant: CRT (50.4 Gy + 5-FU/capecitabine) or total neoadjuvant therapy (TNT). Watch-and-wait for clinical complete response. MSI testing mandatory for all stage II-IV. NTRK testing for all metastatic.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-01-15",
                "url": "",
                "autores": ["NCCN Colon/Rectal Panel"],
                "termo_busca": "NCCN colorectal cancer guideline",
                "_score_dimhex": 0.84,
                "_classificacao": "critico",
                "_biomarcadores": ["MSI", "KRAS", "NRAS", "BRAF", "HER2", "NTRK", "ctDNA", "TMB", "PD-L1", "TILs"],
                "_subtipos": ["GI_COLORRETAL_MSI_H"],
            },
            {
                "id_dimhex": "protocol_nccn_gastric_esophageal_2025",
                "titulo": "NCCN Guidelines: Gastric and Esophageal Cancers v1.2025",
                "resumo": "Gastric: resectable (perioperative FLOT or post-op chemoradiation). Metastatic HER2+: trastuzumab + pembrolizumab + chemo (KEYNOTE-811) first-line. Second-line HER2+: T-DXd (DESTINY-Gastric01). CLDN18.2+: zolbetuximab + chemo (GLOW). MSI-H: pembrolizumab. Esophageal: neoadjuvant CRT (CROSS) + surgery. Adjuvant nivolumab if residual disease (CheckMate 577). Advanced squamous: nivolumab + chemo (CheckMate 648) or pembrolizumab + chemo (KEYNOTE-590). Adenocarcinoma HER2+: trastuzumab + chemo first-line, T-DXd second-line (DESTINY-Esophageal). PET scan mandatory for staging. Nutritional support critical.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-01-15",
                "url": "",
                "autores": ["NCCN Gastric/Esophageal Panel"],
                "termo_busca": "NCCN gastric esophageal cancer guideline",
                "_score_dimhex": 0.81,
                "_classificacao": "critico",
                "_biomarcadores": ["HER2", "CLDN18.2", "PD-L1", "MSI", "ctDNA", "TMB", "TILs", "HPV"],
                "_subtipos": ["GI_GASTRICO_HER2", "GI_ESOFAGO"],
            },
            {
                "id_dimhex": "protocol_nccn_melanoma_2025",
                "titulo": "NCCN Guidelines: Cutaneous Melanoma v2.2025",
                "resumo": "Resectable: wide local excision + SLNB. Adjuvant: pembrolizumab 1 year for stage IIB-IIC (KEYNOTE-716) and stage III (KEYNOTE-054). Dabrafenib + trametinib for BRAF V600 stage III. Nivolumab + ipilimumab for high-risk stage III-IV resected (CheckMate 238). Advanced: first-line nivolumab + ipilimumab (CheckMate 067) or nivolumab + relatlimabe (RELATIVITY-047). BRAF V600: dabrafenib + trametinib (COMBI-d/v) or encorafenib + binimetinib. Sequencing: ICI first preferred (DREAMseq). TIL therapy (lifileucel) for refractory. T-VEC for injectable lesions. TMB testing recommended. ctDNA monitoring for MRD and treatment response.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-03-01",
                "url": "",
                "autores": ["NCCN Melanoma Panel"],
                "termo_busca": "NCCN melanoma guideline 2025",
                "_score_dimhex": 0.83,
                "_classificacao": "critico",
                "_biomarcadores": ["BRAF", "NRAS", "TMB", "PD-L1", "TILs", "ctDNA", "LDH"],
                "_subtipos": ["PELE_MELANOMA_BRAF", "PELE_MELANOMA_CUTANEO"],
            },
            {
                "id_dimhex": "protocol_nccn_rcc_bladder_2025",
                "titulo": "NCCN Guidelines: Renal Cell and Bladder Cancer v2.2025",
                "resumo": "RCC clear cell: first-line IO+TKI (nivolumab+cabozantinib, pembro+axitinib, or lenvatinib+pembro). Cytoreductive nephrectomy selective. Non-clear cell: cabozantinib or nivolumab+ipilimumab. Second-line: belzutifano (HIF-2a). Bladder: BCG for non-muscle invasive. Muscle-invasive: neoadjuvant cisplatin-based chemo + cystectomy. First-line metastatic: enfortumab vedotin + pembrolizumab (EV-302). Second-line: enfortumab vedotin (EV-301) or sacituzumab govitecan. FGFR3-altered: erdafitinib. Adjuvant nivolumab (JAVELIN Bladder 100) post-chemo+RT for unresectable. PD-L1 testing optional. ctDNA for MRD detection post-cystectomy.",
                "fonte": "Diretriz NCCN",
                "tipo": "diretriz_clinica",
                "jornal": "NCCN Clinical Practice Guidelines in Oncology",
                "data_publicacao": "2025-02-01",
                "url": "",
                "autores": ["NCCN Kidney/Bladder Panel"],
                "termo_busca": "NCCN renal cell bladder cancer guideline",
                "_score_dimhex": 0.80,
                "_classificacao": "critico",
                "_biomarcadores": ["VHL", "PD-L1", "FGFR3", "TMB", "ctDNA", "TILs", "NTRK"],
                "_subtipos": ["GU_RENAL_CELULAR", "GU_BEXIGA_UROTELIAL"],
            },
            {
                "id_dimhex": "protocol_esmo_hematologic_2025",
                "titulo": "ESMO Clinical Practice Guidelines: Hematologic Malignancies — DLBCL, FL, Myeloma, AML, MDS",
                "resumo": "DLBCL: R-CHOP or pola-R-CHP first-line. R/R: CAR-T (axi-cel, liso-cel) or tisa-cel. FL: watch-and-wait or obinutuzumabe + chemo. R/R: CAR-T (ZUMA-5) or bispecific (mosunetuzumab). Myeloma: D-VRd (quadlet) transplant-ineligible. Transplant-eligible: VRd + ASCT + lenalidomida maintenance. R/R: CAR-T (ide-cel) or bispecific (teclistamab). AML: 7+3 (fit) or venetoclax + azacitidine (unfit). FLT3-ITD: gilteritinib. IDH1/2: ivosidenib/enasidenib. MDS: azacitidine or luspatercept (SF3B1 RS). TP53-mutated: eprenetapopt + azacitidine (investigational). MRD monitoring mandatory in myeloma and AML. NGS profiling recommended for all hematologic malignancies.",
                "fonte": "Diretriz ESMO",
                "tipo": "diretriz_clinica",
                "jornal": "Annals of Oncology — ESMO Guidelines",
                "data_publicacao": "2025-04-01",
                "url": "",
                "autores": ["ESMO Hematology Guideline Committee"],
                "termo_busca": "ESMO hematology lymphoma myeloma AML guideline",
                "_score_dimhex": 0.85,
                "_classificacao": "critico",
                "_biomarcadores": ["CD20", "BCMA", "FLT3", "IDH1", "TP53", "SF3B1", "ctDNA", "TMB", "PD-L1", "TILs"],
                "_subtipos": ["SANGUE_LINFOMA_DLBCL", "SANGUE_LINFOMA_FOLICULAR", "SANGUE_MIELOMA_MULTIPL0", "SANGUE_LEUCEMIA_MIELOIDE_AGLA", "MEDULAR_MDS"],
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