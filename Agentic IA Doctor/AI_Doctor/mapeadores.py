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
        # === MAMA HER2+ ===
        "MAMA_HER2_POSITIVO": {
            1: {"esquema": "Trastuzumabe + Pertuzumabe + Docetaxel (CLEOPATRA)", "classe": "Terapia Alvo HER2 (mAb)"},
            2: {"esquema": "Trastuzumabe Deruxtecan (T-DXd)", "classe": "ADC HER2 (T-DXd)"},
            3: {"esquema": "Tucatinibe + Trastuzumabe + Capecitabina", "classe": "Terapia Alvo HER2 (mAb)"},
            "biomarcadores_relevantes": ["HER2", "ERBB2", "PIK3CA", "PTEN", "ctDNA"],
            "desafio_diagnostico": "Heterogeneidade intratumoral HER2; reclassificação IHC 2+ vs 3+; resistência a trastuzumabe por ativação de PI3K",
        },
        "MAMA_HR_POSITIVO_LUMINAL": {
            1: {"esquema": "Palbociclib + Letrozol (PALOMA-2)", "classe": "CDK4/6 Inibidor + Endocrinoterapia"},
            2: {"esquema": "Alpelisibe + Fulvestranto (SOLAR-1) se PIK3CA mutado", "classe": "Terapia Alvo PI3K + Endocrinoterapia"},
            3: {"esquema": "Capecitabina monoterapia", "classe": "Quimioterapia Citotoxica"},
            "biomarcadores_relevantes": ["ER", "PR", "Ki-67", "PIK3CA", "ESR1", "ctDNA"],
            "desafio_diagnostico": "Progressão endócrina silenciosa; mutação ESR1 emergente após AI; distinção luminal A vs B",
        },
        # === PRÓSTATA ===
        "PROSTATA_HORMOSSENSIVEL": {
            1: {"esquema": "ADT + Docetaxel (CHAARTED) ou ADT + Abiraterona (LATITUDE)", "classe": "Terapia Alvo VEGFR/TKI"},
            2: {"esquema": "Abiraterona + Prednisona", "classe": "Terapia Alvo VEGFR/TKI"},
            3: {"esquema": "Cabazitaxel (TROPIC trial)", "classe": "Quimioterapia Citotoxica"},
            "biomarcadores_relevantes": ["PSA", "Testosterona", "AR-V7", "ctDNA", "BRCA1/2"],
            "desafio_diagnostico": "Transição HSPC→CRPC muitas vezes silenciosa; resistência primária a abiraterona por mutações de ganho de função AR",
        },
        "PROSTATA_CASTRACAO_RESISTENTE": {
            1: {"esquema": "Enzalutamida + ADT ou Abiraterona + ADT", "classe": "Terapia Alvo VEGFR/TKI"},
            2: {"esquema": "177Lu-PSMA-617 (Pluvicto)", "classe": "Lu-177 PSMA"},
            3: {"esquema": "Docetaxel + Prednisona", "classe": "Quimioterapia Citotoxica"},
            "biomarcadores_relevantes": ["PSA", "PSMA-PET", "AR-V7", "ctDNA", "BRCA2", "MMR"],
            "desafio_diagnostico": "Heterogeneidade neuroendócrina emergente; AR-V7 prediz resistência a enzalutamida/abiraterona; disjunção PSA/progressão clínica",
        },
        # === PÂNCREAS ===
        "PANCREAS_PDAC": {
            1: {"esquema": "FOLFIRINOX ou Gemcitabina + Nab-Paclitaxel", "classe": "Quimioterapia Citotoxica"},
            2: {"esquema": "Nal-IRI + 5-FU/LV (NAPOLI-3)", "classe": "Quimioterapia Citotoxica"},
            3: {"esquema": "Gemcitabina monoterapia ou melhor suporte", "classe": "Quimioterapia Citotoxica"},
            "biomarcadores_relevantes": ["CA 19-9", "KRAS G12D/G12V/R181", "SMAD4", "TP53", "ctDNA"],
            "desafio_diagnostico": "Estadiamento preciso versus pancreatite crônica; desmoplasia intensa dificulta biópsia; biomarcador terapêutico limitado",
        },
        "PANCREAS_NEUROENDOCRINO": {
            1: {"esquema": "Everolimo + Lanreotido", "classe": "Terapia Alvo VEGFR/TKI"},
            2: {"esquema": "Lu-177 DOTATATE (NETTER-1)", "classe": "PRRT (Lu-177)"},
            3: {"esquema": "Sunitinibe", "classe": "Terapia Alvo VEGFR/TKI"},
            "biomarcadores_relevantes": ["Cromogranina A", "Serotonina", "Glucagon", "DOTATATE-PET", "Ki-67"],
            "desafio_diagnostico": "Distinguir G1 vs G2 vs G3; graduação histológica influencia tratamento; síndrome hormonal paraneoplásica mascara tumor",
        },
        # === CÉREBRO ===
        "CEREBRO_GBM": {
            1: {"esquema": "Cirurgia + RT + Temozolomida + TTF (Stupp + EF-14)", "classe": "TTF (Tumor Treating Fields)"},
            2: {"esquema": "Bevacizumabe + Lomustina (BELOB)", "classe": "Anti-angiogenico + Quimioterapia"},
            3: {"esquema": "Regorafenibe (REGOMA) ou Temozolomida rechallenge", "classe": "Terapia Alvo Multi-quinase"},
            "biomarcadores_relevantes": ["MGMT metilação", "IDH1/2", "EGFRvIII", "TERT", "PTEN", "ctDNA líquor"],
            "desafio_diagnostico": "Barreira hematoencefálica limita tratamento; heterogeneidade intratumoral extensa; MGMT metilação prediz resposta mas não cura",
        },
        "CEREBRO_ASTROCITOMA_IDH": {
            1: {"esquema": "Cirurgia + RT + Temozolomida (CATNON)", "classe": "Quimioterapia Citotoxica"},
            2: {"esquema": "Vorasidenib (INDIGO) se IDH1/2 mutado", "classe": "Terapia Alvo IDH1/2"},
            3: {"esquema": "Bevacizumabe + Lomustina", "classe": "Anti-angiogenico + Quimioterapia"},
            "biomarcadores_relevantes": ["IDH1 R132H", "IDH2", "1p/19q", "ATRX", "TP53", "MGMT"],
            "desafio_diagnostico": "Distinguisher oligodendroglioma (1p/19q codeleted) vs astrocitoma; progressão lenta dificulta avaliação de resposta",
        },
        "CEREBRO_MEDULOBLASTOMA": {
            1: {"esquema": "Cirurgia + Irradiação Cranioespinhal + Quimioterapia (VDC/IE)", "classe": "Quimioterapia Citotoxica"},
            2: {"esquema": "Quimioterapia alta dose + Resgate de Células-Tronco", "classe": "Quimioterapia Citotoxica"},
            3: {"esquema": "Vismodegib (SHH) + Reirradiação", "classe": "Terapia Alvo Multi-quinase"},
            "biomarcadores_relevantes": ["SHH", "WNT", "MYC/N-MYC", "β-catenina", "CTNNB1"],
            "desafio_diagnostico": "Subtipos moleculares (WNT/SHH/Group3/Group4) com prognósticos divergentes; toxicidade tardia da irradiação cranioespinhal em crianças",
        },
        # === FÍGADO ===
        "FIGADO_HCC": {
            1: {"esquema": "Atezolizumabe + Bevacizumabe (IMbrave150)", "classe": "Combinacao ICI + Antiangiogenico"},
            2: {"esquema": "Lenvatinibe (REFLECT) ou Cabozantinibe (CELESTIAL)", "classe": "Terapia Alvo VEGFR/TKI"},
            3: {"esquema": "Regorafenibe (RESORCE) ou Ramucirumabe (REACH-2 AFP≥400)", "classe": "Terapia Alvo VEGFR/TKI"},
            "biomarcadores_relevantes": ["AFP", "DCP (PIVKA-II)", "Child-Pugh", "HBsAg", "HCV", "ctDNA"],
            "desafio_diagnostico": "Função hepática comprometida limita opções terapêuticas; sobreposição com cirrose; screening por ultrassom em população de risco",
        },
        # === SANGUE ===
        "SANGUE_LINFOMA_DLBCL": {
            1: {"esquema": "Pola-R-CHP ou R-CHOP (POLARIX)", "classe": "Combinacao ICI + Quimioterapia"},
            2: {"esquema": "Axicabtagene Ciloleucel (ZUMA-1) CAR-T", "classe": "Car-T Terapia Celular"},
            3: {"esquema": "Loncastuximab Tesirina + Rituximabe", "classe": "Bi-specifico CD20xCD3"},
            "biomarcadores_relevantes": ["CD20", "CD30", "BCL2", "BCL6", "MYC", "COO (ABC/GCB)", "ctDNA"],
            "desafio_diagnostico": "Double-hit/triple-hit (MYC+BCL2/BCL6) com prognóstico adverso; distinguir subtipos CELL-OF-ORIGIN (ABC vs GCB)",
        },
        "SANGUE_LINFOMA_FOLICULAR": {
            1: {"esquema": "Obinutuzumabe + Bendamustina + Manutenção (GALLIUM)", "classe": "Imunoterapia Isolada"},
            2: {"esquema": "Axicabtagene Ciloleucel (ZUMA-5) CAR-T", "classe": "Car-T Terapia Celular"},
            3: {"esquema": "Tazemetostat (EZH2) ou Copanlisibe (PI3K)", "classe": "PI3K Inibidor"},
            "biomarcadores_relevantes": ["CD20", "BCL2 t(14;18)", "EZH2", "CREBBP", "KMT2D", "ctDNA"],
            "desafio_diagnostico": "Histologia do lobo folicular pode simular linfoma; transformação em DLBCL (10-15%/ano); necessidade de biópsia para confirmar transformação",
        },
        "SANGUE_MIELOMA_MULTIPL0": {
            1: {"esquema": "Daratumumabe + Lenalidomida + Dexametasona (MAIA)", "classe": "Anticorpo Anti-CD38"},
            2: {"esquema": "Daratumumabe + Bortezomibe + Dexametasona (CASTOR)", "classe": "Proteassoma Inibidor (Bortezomib)"},
            3: {"esquema": "Idecabtagene Vicleucel (CAR-T BCMA) ou Selinexor", "classe": "Car-T Terapia Celular"},
            "biomarcadores_relevantes": ["BCMA", "CD38", "CD138", "Citogenética (t(4;14), del(17p))", "ctDNA", "LDH"],
            "desafio_diagnostico": "MGUS vs Mieloma Indolente vs Ativo: critérios CRAB vs SLiM; lesões líticas confundem com metástases ósseas",
        },
        "SANGUE_LEUCEMIA_MIELOIDE_AGLA": {
            1: {"esquema": "Venetoclaxe + Azacitidina (VIALE-A) ou 7+3 (Antraciclina+Citarabina)", "classe": "Inibidor BCL-2 (Venetoclaxe)"},
            2: {"esquema": "Gilteritinibe (FLT3-ITD) ou FLAG-IDA", "classe": "Terapia Alvo FLT3"},
            3: {"esquema": "Ivosidenib (IDH1) ou Enasidenib (IDH2)", "classe": "Terapia Alvo IDH1/2"},
            "biomarcadores_relevantes": ["FLT3-ITD", "NPM1", "IDH1/2", "TP53", "CEBPA", "RUNX1", "ctDNA"],
            "desafio_diagnostico": "Leucemia promielocítica (APL) é emergência médica (DIC); distinguir AML de MDS; mutação TP53 confere prognóstico extremamente adverso",
        },
        # === MEDULAR ===
        "MEDULAR_MDS": {
            1: {"esquema": "Azacitidina (Vidaza) ou Decitabina", "classe": "Quimioterapia Citotoxica"},
            2: {"esquema": "Luspatercept (MEDALIST) para Sideroblastos em Anel", "classe": "Terapia Alvo Multi-quinase"},
            3: {"esquema": "Venetoclaxe + Azacitidina (se TP53 mutado)", "classe": "Inibidor BCL-2 (Venetoclaxe)"},
            "biomarcadores_relevantes": ["IPSS-R", "Blastos medulares", "Citogenética (del(5q), monossomia 7)", "SF3B1", "TP53"],
            "desafio_diagnostico": "Fronteira diagnóstica AML vs MDS (blastos 10-19%); progressão para LMA variável; sobreposição com anemia aplástica",
        },
        # === GASTROINTESTINAL ===
        "GI_COLORRETAL_MSI_H": {
            1: {"esquema": "Pembrolizumabe (KEYNOTE-177) se MSI-H/dMMR", "classe": "Imunoterapia Isolada"},
            2: {"esquema": "FOLFOXIRI + Bevacizumabe ou Nivolumabe+Ipilimumabe", "classe": "Combinacao ICI Duplo (CTLA-4+PD-1)"},
            3: {"esquema": "TAS-102 + Bevacizumabe (SUNLIGHT) ou Fruquintinib", "classe": "Anti-angiogenico + Quimioterapia"},
            "biomarcadores_relevantes": ["MSI-H", "dMMR", "KRAS", "NRAS", "BRAF V600E", "HER2", "ctDNA"],
            "desafio_diagnostico": "Teste MSI universal recomendado para todos os CCR; distinguir esporádico (Lynch) vs hereditário; BRAF V600E em MSI-H = prognóstico intermediário",
        },
        "GI_GASTRICO_HER2": {
            1: {"esquema": "Trastuzumabe + Pembrolizumabe + Quimioterapia (KEYNOTE-811)", "classe": "Combinacao ICI + Quimioterapia"},
            2: {"esquema": "Trastuzumabe Deruxtecan (T-DXd) (DESTINY-Gastric01)", "classe": "ADC HER2 (T-DXd)"},
            3: {"esquema": "Ramucirumabe + Paclitaxel (RAINBOW)", "classe": "Anti-angiogenico + Quimioterapia"},
            "biomarcadores_relevantes": ["HER2", "CLDN18.2", "PD-L1 CPS", "EBV", "MSI-H", "ctDNA"],
            "desafio_diagnostico": "Heterogeneidade HER2 intratumoral; teste obrigatório para todos os gástricos avançados; sobreposição com IPOX (Cromogranina/Sinaptofisina)",
        },
        "GI_ESOFAGO": {
            1: {"esquema": "Nivolumabe + Quimiorradiação (CROSS/CheckMate 648)", "classe": "Imunoterapia + Quimiorradiacao"},
            2: {"esquema": "Trastuzumabe Deruxtecan se HER2+ (DESTINY-Esophageal)", "classe": "ADC HER2 (T-DXd)"},
            3: {"esquema": "Ramucirumabe + Paclitaxel ou Taxano monoterapia", "classe": "Anti-angiogenico + Quimioterapia"},
            "biomarcadores_relevantes": ["HER2", "PD-L1 CPS", "TP53", "CCND1", "SOX2", "ctDNA"],
            "desafio_diagnostico": "Distinção esôfago de Barrett → adenocarcinoma vs carcinoma escamoso; estadiamento endoscópico preciso é crítico para decisão cirúrgica",
        },
        # === PELE ===
        "PELE_MELANOMA_BRAF": {
            1: {"esquema": "Dabrafenibe + Trametinibe (COMBI-d/v)", "classe": "Terapia Alvo BRAF/MEK"},
            2: {"esquema": "Nivolumabe + Relatlimabe (RELATIVITY-047)", "classe": "Combinacao ICI Duplo (CTLA-4+PD-1)"},
            3: {"esquema": "Lifileucel (TIL therapy) ou T-VEC", "classe": "Car-T Terapia Celular"},
            "biomarcadores_relevantes": ["BRAF V600E/K", "LDH", "ctDNA", "TMB", "PD-L1", "TILs"],
            "desafio_diagnostico": "Resistência adaptativa rápida a inibidores BRAF; decisão sequência ICI vs alvo (DREAMseq); LDH como marcador prognóstico",
        },
        "PELE_MELANOMA_CUTANEO": {
            1: {"esquema": "Nivolumabe + Ipilimumabe (CheckMate 067)", "classe": "Combinacao ICI Duplo (CTLA-4+PD-1)"},
            2: {"esquema": "Nivolumabe + Relatlimabe (RELATIVITY-047)", "classe": "Combinacao ICI Duplo (CTLA-4+PD-1)"},
            3: {"esquema": "T-VEC + Pembrolizumabe ou Lifileucel (TIL)", "classe": "Imunoterapia Isolada"},
            "biomarcadores_relevantes": ["BRAF", "NRAS", "NF1", "TMB", "PD-L1", "TILs", "ctDNA", "LDH"],
            "desafio_diagnostico": "BRAF wildtype não tem terapia alvo; toxicidade imunológica grau 3-4 em 55% dos combo ICI; resposta tardia (pseudoprogressão)",
        },
        # === GENITURINÁRIO ===
        "GU_RENAL_CELULAR": {
            1: {"esquema": "Nivolumabe + Cabozantinibe (CheckMate 9ER)", "classe": "Combinacao ICI + Antiangiogenico"},
            2: {"esquema": "Belzutifano (LITESPARK-005) ou Lenvatinibe+Everolimo", "classe": "Terapia Alvo VEGFR/TKI"},
            3: {"esquema": "Cabozantinibe (METEOR) ou Everolimo", "classe": "Terapia Alvo VEGFR/TKI"},
            "biomarcadores_relevantes": ["VHL", "PBRM1", "BAP1", "CAIX", "PD-L1", "IMDC risk", "ctDNA"],
            "desafio_diagnostico": "Subtipos histológicos (células claras vs papilífero vs cromófobo) com tratamentos distintos; nefrectomia citorredutora vs inicio sistêmico upfront",
        },
        "GU_BEXIGA_UROTELIAL": {
            1: {"esquema": "Enfortumabe Vedotin + Pembrolizumabe (EV-302)", "classe": "Combinacao ICI + Quimioterapia"},
            2: {"esquema": "Enfortumabe Vedotin (EV-301) ou Sacituzumabe Govitecan", "classe": "ADC Trop-2 (Sacituzumabe)"},
            3: {"esquema": "Erdafitinib (FGFR3 mutado) ou Paclitaxel", "classe": "Terapia Alvo VEGFR/TKI"},
            "biomarcadores_relevantes": ["FGFR3", "TERT", "TP53", "PD-L1", "NTRK", "ctDNA", "UroVysion FISH"],
            "desafio_diagnostico": "BCG não-responsivo → cistectomia vs alternativas; carcinoma in situ vs invasivo; FGFR3 testing emergente como biomarcador preditivo",
        },
        # === OUTROS ===
        "GINECOLOGICO_CERVICAL_HPV": {
            1: {"esquema": "Pembrolizumabe + Quimiorradiação (KEYNOTE-826)", "classe": "Imunoterapia + Quimiorradiacao"},
            2: {"esquema": "Tisotumabe Vedotin (InnovaTV 204) ADC", "classe": "ADC Trop-2 (Sacituzumabe)"},
            3: {"esquema": "Bintrafusp Alfa (TGF-β/PD-L1 bifuncional) ou Topotecano", "classe": "Imunoterapia Isolada"},
            "biomarcadores_relevantes": ["HPV DNA", "p16 INK4A", "PD-L1 CPS", "TILs", "EGFR", "ctDNA"],
            "desafio_diagnostico": "HPV status define prognóstico e tratamento; preservação de fertilidade em estágios iniciais; acesso limitado à vacina HPV em países em desenvolvimento",
        },
        "ENDOCRINO_TIREOIDE": {
            1: {"esquema": "Lenvatinibe (SELECT) ou Sorafenibe (DECISION)", "classe": "Terapia Alvo VEGFR/TKI"},
            2: {"esquema": "Selpercatinibe (RET+) ou Lenvatinibe 2a linha", "classe": "Terapia Alvo NTRK"},
            3: {"esquema": "Dabrafenibe+Trametinibe (BRAF V600E) ou I-131 repetido", "classe": "Terapia Alvo BRAF/MEK"},
            "biomarcadores_relevantes": ["Tireoglobulina", "RET/PTC", "BRAF V600E", "RAS", "NTRK", "I-131 uptake"],
            "desafio_diagnostico": "Carcinoma anaplásico (3%) tem prognóstico devastador; distinguir adenoma folicular vs carcinoma por capsular; tireoidite de Hashimoto pode simular linfoma",
        },
        "PLEURAL_MESOTELIOMA": {
            1: {"esquema": "Nivolumabe + Ipilimumabe (CheckMate 743)", "classe": "Combinacao ICI Duplo (CTLA-4+PD-1)"},
            2: {"esquema": "Nivolumabe monoterapia ou Pembrolizumabe", "classe": "Imunoterapia Isolada"},
            3: {"esquema": "Pemetrexede + Cisplatina rechallenge ou Gemcitabina", "classe": "Quimioterapia Citotoxica"},
            "biomarcadores_relevantes": ["Mesotelina", "Fibulina-3", "Calretinina", "WT1", "BAP1 perda", "ctDNA"],
            "desafio_diagnostico": "Latência de 20-40 anos pós-exposição ao asbesto; distinção mesotelioma epitelioide vs sarcomatoide; sobreposição com adenocarcinoma metastático pleural",
        },
        "OSSEO_OSTEOSARCOMA": {
            1: {"esquema": "MAP (Metotrexato + Doxorrubicina + Cisplatina) + Cirurgia (EURAMOS-1)", "classe": "Quimioterapia Citotoxica"},
            2: {"esquema": "Ifosfamida + Etoposido + Mifamurtida adjuvante", "classe": "Quimioterapia Citotoxica"},
            3: {"esquema": "Ciclofosfamida + Topotecano ou Trabectedina", "classe": "Quimioterapia Citotoxica"},
            "biomarcadores_relevantes": ["ALP", "LDH", "TP53", "RB1", "MYC amplificação", "ctDNA"],
            "desafio_diagnostico": "Resposta patológica completa à neoadjuvância é principal fator prognóstico; metástases pulmonares frequentes; sobreposição com osteomielite e tumores ósseos benignos",
        },
        "OSSEO_SARCOMA_EWING": {
            1: {"esquema": "VDC/IE (Vincristina+Doxorrubicina+Ciclofosfamida / Ifosfamida+Etoposido)", "classe": "Quimioterapia Citotoxica"},
            2: {"esquema": "QT alta dose + Resgate Células-Tronco (EURO-E.W.I.N.G.)", "classe": "Quimioterapia Citotoxica"},
            3: {"esquema": "Irinotecano + Temozolomida ou Trabectedina", "classe": "Quimioterapia Citotoxica"},
            "biomarcadores_relevantes": ["EWS-FLI1", "NKX2.2", "CD99", "LDH", "ctDNA"],
            "desafio_diagnostico": "Small round blue cell tumors: diferenciar de linfoma, rabdomiosarcoma, neuroblastoma; translocação t(11;22) é patognomônica; faixa etária pediátrica/adolescente",
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