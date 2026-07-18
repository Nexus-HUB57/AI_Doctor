"""
DIMHEX — Base de Conhecimento Global de Neoplasia

Conhecimento de dominio profundo referenciado pelos campos de estudo
global da neoplasia. Alimenta o scoring, o agente oncológico e o motor
de probabilidade com contexto cientifico estruturado.

8 dominios de conhecimento:
1. Biologia Molecular (vias de sinalizacao)
2. Imunologia Tumoral (microambiente imune)
3. Genomica (tecnologias e alteracoes)
4. Biopsia Liquida (ctDNA, CTC, exossomos)
5. Terapias Emergentes (CAR-T, ADCs, vacinas)
6. Resistencia Terapeutica (mecanismos e estrategias)
7. Epidemiologia Global (estatisticas e disparidades)
8. Ensaios Clinicos (desenho e endpoints)
"""

from typing import Dict, List, Optional


class BaseConhecimentoNeoplasia:
    """
    Base de conhecimento estruturada para oncologia de precisao.

    Cada dominio contem conceitos com dados clinicos reais extraidos
    de literature oncológica (NCCN, ESMO, ASCO, NCI, WHO).
    """

    VERSAO = "1.0.0"

    # =========================================================================
    # 1. BIOLOGIA MOLECULAR — Vias de Sinalizacao Oncogenica
    # =========================================================================
    BIOLOGIA_MOLECULAR = {
        "via_mapk_ras": {
            "nome": "Via MAPK/RAS",
            "descricao": "Cascata RAS-RAF-MEK-ERK. Principal via de proliferacao celular.",
            "genes": ["KRAS", "NRAS", "HRAS", "BRAF", "RAF1", "MAP2K1", "MAP2K2", "MAPK1", "MAPK3"],
            "frequencia_alteracao": "30% de todos os canceres solidos",
            "implicacao_clinica": "Mutacoes ativadoras conferem crescimento independente de sinal",
            "terapias_alvo": [
                {"agente": "Sotorasibe", "alvo": "KRAS G12C", "indicacao": "NSCLC 2a linha", "resposta": "ORR 37%"},
                {"agente": "Adagrasib", "alvo": "KRAS G12C", "indicacao": "NSCLC/CCR", "resposta": "ORR 43%"},
                {"agente": "Vemurafenib + Dabrafenib", "alvo": "BRAF V600E", "indicacao": "Melanoma", "resposta": "ORR 70%"},
                {"agente": "Trametinib + Dabrafenib", "alvo": "MEK + BRAF", "indicacao": "Melanoma/NSCLC", "resposta": "PFS 11.4 meses"},
            ],
        },
        "via_pi3k_akt_mtor": {
            "nome": "Via PI3K/AKT/mTOR",
            "descricao": "Regulacao metabolica, sobrevivencia e crescimento celular.",
            "genes": ["PIK3CA", "PTEN", "AKT1", "AKT2", "MTOR", "TSC1", "TSC2", "STK11"],
            "frequencia_alteracao": "40% em canceres de mama, 15% em endometrio",
            "implicacao_clinica": "Ativacao constitutiva promove resistencia a terapias endocrinas e HER2",
            "terapias_alvo": [
                {"agente": "Alpelisibe", "alvo": "PIK3CA", "indicacao": "Mama HR+/HER2- mutado", "resposta": "PFS 11.0 vs 5.7 meses"},
                {"agente": "Everolimo", "alvo": "mTOR", "indicacao": "RCC/breast/NET", "resposta": "PFS 7.8 meses RCC"},
                {"agente": "Temsirolimo", "alvo": "mTOR", "indicacao": "RCC de risco alto", "resposta": "OS 10.9 meses"},
            ],
        },
        "via_wnt_beta_catenina": {
            "nome": "Via Wnt/beta-catenina",
            "descricao": "Morfogenese, proliferação de stem cells e auto-renovação.",
            "genes": ["CTNNB1", "APC", "AXIN1", "AXIN2", "RNF43", "ZNRF3", "TCF7L2"],
            "frequencia_alteracao": "90% em cancer colorretal (APC), 5% em hepatocarcinoma (CTNNB1)",
            "implicacao_clinica": "Beta-catenina nuclear ativa genes de proliferação e stemness",
            "terapias_alvo": [
                {"agente": "LGK974 (WNT974)", "alvo": "PORCN", "indicacao": "Experimental - tumores WNT-ativados", "resposta": "Fase I/II"},
                {"agente": "ETC-159", "alvo": "PORCN", "indicacao": "RCC e tumores WNT", "resposta": "Fase I"},
            ],
        },
        "via_p53": {
            "nome": "Via p53 (Guardião do Genoma)",
            "descricao": "Controle do ciclo celular, reparo de DNA e apoptose.",
            "genes": ["TP53", "MDM2", "MDM4", "CDKN2A", "CDKN1A", "BAX", "BCL2"],
            "frequencia_alteracao": "TP53 mutado em ~50% de todos os canceres humanos",
            "implicacao_clinica": "Perda de função permite acúmulo de mutações e evasão apoptótica",
            "terapias_alvo": [
                {"agente": "Idasanutlin", "alvo": "MDM2-p53", "indicacao": "Sarcoma/AML com TP53 wild-type", "resposta": "Fase I/II"},
                {"agente": "APG-115", "alvo": "MDM2", "indicacao": "Lipossarcoma/NSCLC", "resposta": "Fase I"},
            ],
        },
        "via_notch": {
            "nome": "Via Notch",
            "descricao": "Determinação celular, diferenciação e comunicação intercelular.",
            "genes": ["NOTCH1", "NOTCH2", "NOTCH3", "JAG1", "JAG2", "DLL3", "DLL4"],
            "frequencia_alteracao": "10% T-ALL, 15% carcinoma adenoide cistico (NOTCH1)",
            "implicacao_clinica": "Pode atuar como oncogene ou supressor dependendo do contexto",
            "terapias_alvo": [
                {"agente": "Rova-Tiruzumab (tarlatamab)", "alvo": "DLL3", "indicacao": "SCLC/NEPC", "resposta": "ORR 35% SCLC"},
                {"agente": "Gamma-secretase inhibitors", "alvo": "Notch cleavage", "indicacao": "T-ALL/ACC", "resposta": "Fase I/II"},
            ],
        },
        "via_nf_kb": {
            "nome": "Via NF-kB",
            "descricao": "Resposta inflamatória, imunidade inata e sobrevivência celular.",
            "genes": ["RELA", "RELB", "NFKB1", "IKBKA", "IKBKB", "NFKBIA", "TNF", "IL6"],
            "frequencia_alteracao": "Ativada em 15-20% de linfomas, vários canceres sólidos via inflamação",
            "implicacao_clinica": "Promove inflamação crônica, resistência a quimioterapia e imunoterapia",
            "terapias_alvo": [
                {"agente": "Bortezomibe", "alvo": "Proteassoma/NF-kB", "indicacao": "Mieloma multiplo", "resposta": "ORR 38%"},
                {"agente": "Carfilzomibe", "alvo": "Proteassoma", "indicacao": "Mieloma multiplo", "resposta": "ORR 24%"},
            ],
        },
        "via_jak_stat": {
            "nome": "Via JAK/STAT",
            "descricao": "Transdução de sinal de citocinas e fatores de crescimento.",
            "genes": ["JAK1", "JAK2", "JAK3", "STAT3", "STAT5A", "STAT5B", "IL6R", "SOCS1"],
            "frequencia_alteracao": "JAK2 V617F em 95% PV, 50% ET; STAT3 em 40% LNH de células T grandes",
            "implicacao_clinica": "Conferem vantagem proliferativa e resistência imune",
            "terapias_alvo": [
                {"agente": "Ruxolitinibe", "alvo": "JAK1/JAK2", "indicacao": "Policitemia vera/Mielofibrose", "resposta": "Reducao >50% volume baço"},
                {"agente": "Tofacitinibe", "alvo": "JAK3/JAK1", "indicacao": "Artrite reumatoide (off-label oncologico)", "resposta": "Imunomodulador"},
            ],
        },
        "via_hedgehog": {
            "nome": "Via Hedgehog",
            "descricao": "Desenvolvimento embrionário, manutenção de stem cells.",
            "genes": ["PTCH1", "SMO", "GLI1", "GLI2", "SUFU", "HHIP"],
            "frequencia_alteracao": "30% em carcinoma basocelular, ativação parácrina em 40% PDAC",
            "implicacao_clinica": "Ativação parácrina no TME promove desmoplasia e progressão",
            "terapias_alvo": [
                {"agente": "Vismodegibe", "alvo": "SMO", "indicacao": "Carcinoma basocelular", "resposta": "ORR 30% metastático"},
                {"agente": "Sonidegibe", "alvo": "SMO", "indicacao": "Carcinoma basocelular", "resposta": "ORR 36%"},
            ],
        },
    }

    # =========================================================================
    # 2. IMUNOLOGIA TUMORAL
    # =========================================================================
    IMUNOLOGIA_TUMORAL = {
        "checkpoint_inibidores": {
            "nome": "Checkpoint Inibidores",
            "alvos": [
                {"alvo": "PD-1/PD-L1", "agentes": ["Pembrolizumabe", "Nivolumabe", "Cemiplimabe", "Dostarlimabe"],
                 "mecanismo": "Bloqueia sinal inibitório entre PD-1 (linfócito T) e PD-L1 (célula tumoral), restaurando atividade citotóxica",
                 "resposta_media": "ORR 15-45% em tumores PD-L1 positivo"},
                {"alvo": "CTLA-4", "agentes": ["Ipilimumabe", "Tremelimumabe"],
                 "mecanismo": "Bloqueia sinal inibitório na ativação primária dos linfócitos T nos linfonodos",
                 "resposta_media": "Monoterapia ORR 10-15%, sinérgico com anti-PD-1"},
                {"alvo": "LAG-3", "agentes": ["Relatlimabe", "Fianlimabe"],
                 "mecanismo": "Receptor inibitório expresso em T cells exauridos, bloqueia ativação",
                 "resposta_media": "Relatlimabe+Nivo: PFS 10.1 vs 4.6 meses melanoma"},
                {"alvo": "TIGIT", "agentes": ["Tiragolumab", "Ociperlimabe"],
                 "mecanismo": "Compete com CD155 por ligação, inibindo sinal co-estimulatório",
                 "resposta_media": "Tiragolumab+Atezolizumabe: PFS 5.4 vs 3.6 meses NSCLC PD-L1+"},
                {"alvo": "TIM-3", "agentes": ["Sabatolimabe", "Cobolimabe"],
                 "mecanismo": "Marcaador de exaustão T, interage com galectina-9 e CEACAM1",
                 "resposta_media": "Fase II/III em andamento em AML/MDS"},
            ],
        },
        "microambiente_imune": {
            "nome": "Microambiente Imune Tumoral",
            "componentes": [
                {"tipo": "TILs (Tumor Infiltrating Lymphocytes)", "papel": "Preditor de resposta a imunoterapia; alta densidade = melhor prognóstico",
                 "biomarcador": "CD8+/FoxP3- ratio", "cutoff_clinico": ">100 celulas/mm2 = hotspot"},
                {"tipo": "Tregs (T Regulatory)", "papel": "Suprimem resposta imune antitumoral; alta proporção = pior prognóstico",
                 "biomarcador": "FoxP3+/CD8+ ratio", "cutoff_clinico": ">1.0 = imunossupressão"},
                {"tipo": "TAMs (Tumor Associated Macrophages)", "papel": "Fenótipo M2 promove angiogênese e progressão; M1 antitumoral",
                 "biomarcador": "CD68+/CD163+ ratio", "cutoff_clinico": "Predomínio M2 = pior sobrevida"},
                {"tipo": "MDSCs (Myeloid-Derived Suppressor Cells)", "papel": "Suprimem T cells e NK cells via ARG1, iNOS, ROS",
                 "biomarcador": "CD11b+/CD33+/HLA-DRlow", "cutoff_clinico": ">5% no sangue periférico = imunossupressão"},
                {"tipo": "CAFs (Cancer Associated Fibroblasts)", "papel": "Deposita colágeno denso (desmoplasia), secreta TGF-beta, exclui T cells",
                 "biomarcador": "FAP+/alpha-SMA+", "cutoff_clinico": "Alta densidade = barreira física e química"},
            ],
        },
        "classificacao_imune": {
            "nome": "Classificação de Fenótipo Imune (Tumor Immune Phenotype)",
            "tipos": [
                {"tipo": "Inflamado (Hot)", "descricao": "Alta infiltração CD8+, PD-L1 alto, IFN-gamma presente. Melhor resposta a imunoterapia.",
                 "exemplos": "Melanoma, NSCLC com TMB alto, carcinoma de células renais"},
                {"tipo": "Excluído (Cold-Excluded)", "descricao": "Linfócitos presentes no estroma mas ausentes no parênquima tumoral.",
                 "exemplos": "Pancreatic ductal adenocarcinoma, carcinoma de próstata"},
                {"tipo": "Deserto (Cold-Desert)", "descricao": "Ausência total de infiltrado imune. Pior resposta a checkpoint.",
                 "exemplos": "Glioblastoma, carcinoma ovariano avançado, sarcoma"},
                {"tipo": "Imunossupressivo", "descricao": "Presença de T cells mas dominados por Tregs/MDSCs/TAMs M2.",
                 "exemplos": "HCC, carcinoma biliar, neuroblastoma"},
            ],
        },
    }

    # =========================================================================
    # 3. GENOMICA
    # =========================================================================
    GENOMICA = {
        "tecnologias_ngs": {
            "nome": "Tecnologias de Sequenciamento de Nova Geracao",
            "metodos": [
                {"metodo": "WES (Whole Exome Sequencing)", "descricao": "Sequencia todas as regiões codificantes (~1-2% do genoma)", "custo": "$500-1500", "aplicacao": "Identificar mutações somáticas em genes codificantes"},
                {"metodo": "WGS (Whole Genome Sequencing)", "descricao": "Sequencia o genoma completo incluindo regiões não-codificantes", "custo": "$1000-3000", "aplicacao": "SVs, rearranjos, alterações regulatorias"},
                {"metodo": "RNA-seq", "descricao": "Sequenciamento do transcriptoma", "custo": "$300-800", "aplicacao": "Fusões gênicas, expressão diferencial, splicing aberrante"},
                {"metodo": "Single-cell RNA-seq", "descricao": "Transcriptoma em nível de célula individual", "custo": "$2000-5000/amostra", "aplicacao": "Heterogeneidade tumoral, identificação de subpopulações"},
                {"metodo": "CfDNA NGS (Guardant360, FoundationOne Liquid CDx)", "descricao": "Sequenciamento de ctDNA no sangue periférico", "custo": "$500-5000", "aplicacao": "Biopsia líquida, MRD, resistência"},
            ],
        },
        "assinaturas_mutacionais": {
            "nome": "Assinaturas Mutacionais (COSMIC)",
            "descricao": "Padrões de mutação que revelam processos etiológicos",
            "assinaturas_chave": [
                {"id": "SBS1", "processo": "Desaminacao espontânea de 5-metilcitosina", "idade": "Relacionada à idade"},
                {"id": "SBS2/SBS13", "processo": "Atividade da APOBEC", "associacao": "HPV, respondedores a imunoterapia"},
                {"id": "SBS3", "processo": "Deficiência de reparo por HR (HRD)", "associacao": "BRCA1/2 mutado, sensível a PARPi"},
                {"id": "SBS4", "processo": "Danos por tabaco", "associacao": "NSCLC, cabeça/pescoço"},
                {"id": "SBS7a/b/c", "processo": "Radiação UV", "associacao": "Melanoma, câncer de pele"},
                {"id": "SBS10b", "processo": "Deficiência de reparo MMR (POLE)", "associacao": "MSI-H, alta mutacional, resposta a ICI"},
                {"id": "SBS17a/b", "processo": "Oxidação e danos por ROS", "associacao": "Câncer gástrico, esofágico"},
            ],
        },
    }

    # =========================================================================
    # 4. BIOPSIA LIQUIDA
    # =========================================================================
    BIOPSIA_LIQUIDA = {
        "ctdna": {
            "nome": "DNA Tumoral Circulante (ctDNA)",
            "metodos": [
                {"metodo": "ddPCR (Droplet Digital PCR)", "sensibilidade": "0.01% VAF", "vantagem": "Alta sensibilidade para mutações conhecidas", "limitacao": "Painel limitado"},
                {"metodo": "BEAMing", "sensibilidade": "0.01% VAF", "vantagem": "Quantificação absoluta", "limitacao": "Baixo throughput"},
                {"metodo": "NGS-based (Guardant360, FoundationOne Liquid)", "sensibilidade": "0.1-0.5% VAF", "vantagem": "Painel amplo (70-300+ genes)", "limitacao": "Custo elevado"},
                {"metodo": "Methylation-based (Galleri, EpiPro)", "sensibilidade": "Detecta origem tecidual", "vantagem": "Rastreamento multi-câncer", "limitacao": "Falsos positivos"},
            ],
            "aplicacoes_clinicas": [
                "Detecção precoce (screening multi-câncer)",
                "MRD (Doença Residual Mínima) pós-cirurgia",
                "Monitoramento de resposta terapêutica",
                "Detecção precoce de resistência (emergência de mutações)",
                "Perfil genômico quando biópsia tecidual não é viável",
            ],
        },
        "ctc": {
            "nome": "Células Tumorais Circulantes (CTCs)",
            "metodos_enriquecimento": ["CellSearch (EpCAM-based)", "CTC-chip (microfluídica)", "Filtração por tamanho (ISET)", "Inerto-microfluídica (Parsortix)", "Imunomagnético negativo (CD45 depleção)"],
            "aplicacao": "Prognóstico (CTC >= 5/7.5mL = pior sobrevida), biópsia líquida funcional, cultivo ex vivo para teste de sensibilidade",
        },
    }

    # =========================================================================
    # 5. TERAPIAS EMERGENTES
    # =========================================================================
    TERAPIAS_EMERGENTES = {
        "car_t_cell": {
            "nome": "Terapia CAR-T Cell",
            "produtos": [
                {"nome": "Tisagenlecleucel (Kymriah)", "alvo": "CD19", "indicacao": "LLA/LLB pediátrico, DLBCL", "resposta": "CR 81% LLA pediátrico"},
                {"nome": "Axicabtagene ciloleucel (Yescarta)", "alvo": "CD19", "indicacao": "DLBCL, FL transformado", "resposta": "ORR 83%, CR 58%"},
                {"nome": "Lisocabtagene maraleucel (Breyanzi)", "alvo": "CD19", "indicacao": "LBCL 2a+ linha", "resposta": "ORR 73%, CR 53%"},
                {"nome": "Idecabtagene vicleucel (Abecma)", "alvo": "BCMA", "indicacao": "Mieloma múltiplo", "resposta": "ORR 73%, CR 33%"},
                {"nome": "Ciltacabtagene autoleucel (Carvykti)", "alvo": "BCMA", "indicacao": "Mieloma múltiplo", "resposta": "ORR 98%, CR 83%"},
            ],
            "desafios_solidos": "Penetração no TME, antigen loss, exaustão T cell, toxicidade (CRS, ICANS)",
        },
        "adc": {
            "nome": "Conjugados Anticorpo-Fármaco (ADCs)",
            "produtos": [
                {"nome": "Trastuzumab deruxtecan (Enhertu)", "alvo": "HER2", "indicacao": "Mama HER2-low, gástrico, NSCLC HER2-mut", "resposta": "ORR 52% HER2-low mama"},
                {"nome": "Sacituzumab govitecan (Trodelvy)", "alvo": "TROP2", "indicacao": "TNBC, urotelial", "resposta": "ORR 31% TNBC 2a linha"},
                {"nome": "Enfortumab vedotin (Padcev)", "alvo": "NECTIN4", "indicacao": "Urotelial", "resposta": "ORR 44% com Pembro"},
                {"nome": "Datopotamab deruxtecan", "alvo": "TROP2", "indicacao": "TNBC, NSCLC", "resposta": "ORR 26% TNBC"},
                {"nome": "Patritumab deruxtecan", "alvo": "HER3", "indicacao": "NSCLC 3a linha", "resposta": "ORR 39%"},
            ],
        },
        "anticorpo_biespecifico": {
            "nome": "Anticorpos Biespecificos",
            "produtos": [
                {"nome": "Tebentafusp (Kimmtrak)", "alvo": "gp100/CD3", "indicacao": "Melanoma uveal", "resposta": "OS 21.7 vs 16.0 meses (HR 0.51)"},
                {"nome": "Teclistamab (Tecvayli)", "alvo": "BCMA/CD3", "indicacao": "Mieloma múltiplo", "resposta": "ORR 63%"},
                {"nome": "Mosunetuzumab (Lunsumio)", "alvo": "CD20/CD3", "indicacao": "LNH folicular", "resposta": "ORR 80%"},
                {"nome": "Amivantamab (Rybrevant)", "alvo": "EGFR/MET", "indicacao": "NSCLC EGFR exon20ins", "resposta": "ORR 40%"},
                {"nome": "Tarlatamab (Tarlavity)", "alvo": "DLL3/CD3", "indicacao": "SCLC", "resposta": "ORR 35%"},
            ],
        },
        "radioligandoterapia": {
            "nome": "Terapia com Radioligandos",
            "produtos": [
                {"nome": "Lu-177 DOTATATE (Lutathera)", "alvo": "Receptor de somatostatina", "indicacao": "NET G1/G2", "resposta": "PFS 28.4 vs 8.5 meses vs placebo"},
                {"nome": "Pluvicto (Lu-177 vipivotide)", "alvo": "PSMA", "indicacao": "Câncer de próstata metastático", "resposta": "OS 15.3 vs 11.3 meses"},
            ],
        },
    }

    # =========================================================================
    # 6. RESISTENCIA TERAPEUTICA
    # =========================================================================
    RESISTENCIA_TERAPEUTICA = {
        "mecanismos": [
            {"mecanismo": "Mutação de alvo", "descricao": "Mutação no domínio de ligação do fármaco que reduz afinidade", "exemplo": "EGFR T790M (resistência a 1a/2a geração TKI), ALK G1202R"},
            {"mecanismo": "Ativação de via alternativa", "descricao": "Tumor ativa outra via de sinalização para contornar o bloqueio", "exemplo": "MET amplificação em resistência a EGFR TKI, KRAS mutação em resistência a anti-EGFR"},
            {"mecanismo": "Fenótipo EMT", "descricao": "Transição epitélio-mesênquima confere propriedades de stem cell e resistência", "exemplo": "Perda de E-caderina, ganho de vimentina em resistência a EGFR em NSCLC"},
            {"mecanismo": "Cancer Stem Cells (CSCs)", "descricao": "Subpopulação com quiescência, resistência intrínseca a quimio e radiação", "exemplo": "CD44+/CD24- em mama, CD133+ em vários tumores"},
            {"mecanismo": "Imunossupressão do TME", "descricao": "Recrutamento de Tregs, MDSCs, TAMs M2 que inibem resposta imune", "exemplo": "TGF-beta alto exclui CD8+ do parênquima, IDO1 degrada triptofano"},
            {"mecanismo": "Bomba de efluxo", "descricao": "Superexpressão de transportadores ABC que expulsam o fármaco", "exemplo": "P-glicoproteína (ABCB1/MDR1), ABCG2 (BCRP)"},
            {"mecanismo": "Reparo de DNA aumentado", "descricao": "Upregulação de vias de reparo que neutralizam danos do quimioterápico", "exemplo": "ERCC1 alto = resistência a platina, PARP1 upregulação = resistência a DNA crosslinking"},
        ],
        "estrategias_superacao": [
            {"estrategia": "Terapia combinada", "descricao": "Bloqueio simultâneo de vias primárias e de escape", "exemplo": "EGFR+MET (osimertinibe+savolitinibe), BRAF+MEK (dabrafenibe+trametinib)"},
            {"estrategia": "Terapia adaptativa", "descricao": "Modulação da pressão seletiva para prevenir/retardar resistência", "exemplo": "Alternância de dose ou esquema baseado em biomarcadores dinâmicos"},
            {"estrategia": "Tratamento sequencial", "descricao": "Planejamento antecipado de linhas terapêuticas com base em genômica", "exemplo": "1L osimertinibe -> 2L sotorasibe (se KRAS emerge) -> 3L docetaxel+ramucirumabe"},
            {"estrategia": "Modulação do TME", "descricao": "Converter tumor 'cold' em 'hot' para sensibilizar à imunoterapia", "exemplo": "Anti-TGF-beta + anti-PD-1, STING agonista + anti-CTLA-4, radiotherapy abscopal"},
        ],
    }

    # =========================================================================
    # 7. EPIDEMIOLOGIA GLOBAL
    # =========================================================================
    EPIDEMIOLOGIA_GLOBAL = {
        "estatisticas_2024": {
            "incidencia_global": "19.3 milhões de novos casos/ano (GLOBOCAN 2024)",
            "mortalidade_global": "10 milhões de mortes/ano",
            "sobrevida_geral_5a": "~50% (todos os cânceres combinados)",
            "tendencia": "Aumento de 20% previsto até 2040 (envelhecimento populacional)",
        },
        "mais_incidentes_global": [
            {"posicao": 1, "tipo": "Mama", "novos_casos_anuais": "2.3M", "sobrevida_5a": "90% (localizado)"},
            {"posicao": 2, "tipo": "Pulmão", "novos_casos_anuais": "2.2M", "sobrevida_5a": "25% (todos os estágios)"},
            {"posicao": 3, "tipo": "Colorretal", "novos_casos_anuais": "1.9M", "sobrevida_5a": "65% (localizado)"},
            {"posicao": 4, "tipo": "Próstata", "novos_casos_anuais": "1.4M", "sobrevida_5a": "97% (localizado)"},
            {"posicao": 5, "tipo": "Estômago", "novos_casos_anuais": "1.0M", "sobrevida_5a": "32% (localizado)"},
        ],
        "canceres_raros": {
            "definicao": "Incidência < 6/100.000 pessoas/ano",
            "proporcao": "Representam ~20% de todos os diagnósticos de câncer",
            "desafios": ["Diagnóstico tardio", "Poucos ensaios clínicos", "Ausência de guidelines específicas", "Falta de expertise patológica", "Isolamento do paciente"],
            "iniciativas": ["NCI Rare Tumor Initiative", "EORTC Rare Cancer Working Group", "Rare Cancers Europe (RCE)", "NCCN Guidelines para subtipos específicos"],
        },
    }

    # =========================================================================
    # 8. ENSAIOS CLINICOS
    # =========================================================================
    ENSAIOS_CLINICOS = {
        "desenhos": [
            {"tipo": "Ensaio de cesta (Basket)", "descricao": "Mesmo tratamento para diferentes tumores com mesma alteração molecular", "exemplo": "NTRK inhibitors (larotrectinib, entrectinib) em 17 histologias com fusão NTRK"},
            {"tipo": "Ensaio guarda-chuva (Umbrella)", "descricao": "Diferentes tratamentos para um tipo tumoral baseado em alterações moleculares", "exemplo": "Lung-MAP em NSCLC com múltiplos braços biomarcador-dirigidos"},
            {"tipo": "Ensaio de plataforma (Platform)", "descricao": "Protocolo mestre que permite adição/remoção de braços ao longo do tempo", "exemplo": "NCI-MATCH, I-SPY2 em mama"},
            {"tipo": "Ensaio adaptativo", "descricao": "Modifica desenho baseado em dados acumulados durante o estudo", "exemplo": "Bayesian adaptive randomization, seamless phase II/III"},
        ],
        "endpoints": [
            {"endpoint": "OS (Overall Survival)", "descricao": "Padrão-ouro em oncologia. Tempo até morte por qualquer causa", "vantagem": "Medida definitiva de benefício"},
            {"endpoint": "PFS (Progression-Free Survival)", "descricao": "Tempo até progressão ou morte. Surrogate de OS aceito", "vantagem": "Requer menor seguimento que OS"},
            {"endpoint": "ORR (Objective Response Rate)", "descricao": "Proporção com RC+RP (RECIST/iRECIST)", "vantagem": "Medido precocemente"},
            {"endpoint": "DCR (Disease Control Rate)", "descricao": "RC+RP+Doença Estável >= 6 semanas", "vantagem": "Captura benefício clínico além de resposta"},
            {"endpoint": "DOR (Duration of Response)", "descricao": "Tempo desde resposta até progressão", "vantagem": "Mede durabilidade da resposta"},
            {"endpoint": "MRD (Minimal Residual Disease)", "descricao": "ctDNA indetectável pós-tratamento. Endpoint emergente", "vantagem": "Detecção precoce de recidiva, surrogate de cura"},
        ],
    }

    # =========================================================================
    # MAPEAMENTO SUBTIPO -> VIAS RELEVANTES
    # =========================================================================
    MAPEAMENTO_SUBTIPO_VIAS = {
        "NSCLC_KRAS_G12C": {
            "vias_principais": ["via_mapk_ras", "via_pi3k_akt_mtor", "via_p53"],
            "terapias_chave": ["Inibidor KRAS G12C", "Imunoterapia checkpoint", "Quimioterapia + platina"],
            "resistencia_comum": "KRAS G12D emergente, MET amplificação, EMT",
            "imunofenotipo": "Inflamado (se TMB alto) ou Excluído",
        },
        "NSCLC_EGFR_MUTADO": {
            "vias_principais": ["via_mapk_ras", "via_pi3k_akt_mtor", "via_nf_kb"],
            "terapias_chave": ["TKI EGFR 3a geração", "Quimio + Imunoterapia (após TKI)", "Amivantamab"],
            "resistencia_comum": "EGFR T790M, C797S, MET amplificação, HER2 amplificação, SCLC transformação",
            "imunofenotipo": "Excluído (tipicamente 'cold')",
        },
        "TRIPLO_NEGATIVO_MAMARIO": {
            "vias_principais": ["via_pi3k_akt_mtor", "via_p53", "via_nf_kb", "via_wnt_beta_catenina"],
            "terapias_chave": ["Imunoterapia + quimio", "ADC (Sacituzumab, Enhertu HER2-low)", "PARPi (BRCA mutado)"],
            "resistencia_comum": "Perda de PD-L1, upregulação TIM-3/LAG-3, EMT, CSCs",
            "imunofenotipo": "Inflamado (50% TILs alto) ou Imunossupressor",
        },
        "CANCER_SEIOS_FACE": {
            "vias_principais": ["via_p53", "via_nf_kb", "via_notch"],
            "terapias_chave": ["Cirurgia + RT", "Quimiorradiação", "Imunoterapia"],
            "resistencia_comum": "Resistência à radiação, invasão perineural",
            "imunofenotipo": "Variável (HPV+ tende Inflamado)",
        },
        "CANCER_DUCTO_BILIAR": {
            "vias_principais": ["via_mapk_ras", "via_pi3k_akt_mtor", "via_wnt_beta_catenina", "via_hedgehog"],
            "terapias_chave": ["Gemcitabina + Cisplatina", "FGFR2i (Pemigatinib)", "IDH1i (Ivosidenib)", "Imunoterapia (MSI-H)"],
            "resistencia_comum": "KRAS G12D emergente, ativação de via alternativa",
            "imunofenotipo": "Deserto/Excluído",
        },
        "CARCINOMA_ADENOIDE_CISTICO": {
            "vias_principais": ["via_notch", "via_pi3k_akt_mtor", "via_wnt_beta_catenina"],
            "terapias_chave": ["Cirurgia + RT", "Lenvatinibe", "Terapia alvo MYB-NFIB (experimental)"],
            "resistencia_comum": "Crescimento lento mas invasão perineural extensa",
            "imunofenotipo": "Deserto",
        },
        "CANCER_AMIGDALA": {
            "vias_principais": ["via_p53", "via_nf_kb", "via_mapk_ras"],
            "terapias_chave": ["CRT (Cisplatina + RT)", "Desescalada (HPV+)", "Nivolumabe recorrente"],
            "resistencia_comum": "Recidiva local, metástase à distância",
            "imunofenotipo": "Inflamado (HPV+ = TILs alto, PD-L1 alto)",
        },
        "CANCER_TROMPA_FALOPIO": {
            "vias_principais": ["via_pi3k_akt_mtor", "via_p53", "via_nf_kb", "via_jak_stat"],
            "terapias_chave": ["Carbo + Paclitaxel", "PARPi (BRCA)", "Bevacizumabe", "Imunoterapia"],
            "resistencia_comum": "Resistência à platina, recaída tardia",
            "imunofenotipo": "Imunossupressor",
        },
        "CANCER_APPENDICE": {
            "vias_principais": ["via_wnt_beta_catenina", "via_pi3k_akt_mtor", "via_mapk_ras"],
            "terapias_chave": ["Cirurgia + HIPEC", "5-FU + Oxaliplatina", "PRRT (Lu-177)"],
            "resistencia_comum": "Disseminação peritoneal extensa",
            "imunofenotipo": "Deserto",
        },
        "CANCER_PARATIREOIDE": {
            "vias_principais": ["via_p53", "via_mapk_ras", "via_pi3k_akt_mtor"],
            "terapias_chave": ["Cirurgia (paratiroidectomia)", "Cinacalcet", "Lenvatinibe", "Denosumabe"],
            "resistencia_comum": "Hipercalemia refratária, metástase pulmonar/óssea",
            "imunofenotipo": "Deserto",
        },
        "CANCER_AMPULAR": {
            "vias_principais": ["via_mapk_ras", "via_p53", "via_pi3k_akt_mtor", "via_wnt_beta_catenina"],
            "terapias_chave": ["Whipple + adjuvância", "FOLFIRINOX", "Imunoterapia (MSI-H)"],
            "resistencia_comum": "Obstrução biliar, caquexia",
            "imunofenotipo": "Variável",
        },
    }

    # =========================================================================
    # METODOS PUBLICOS
    # =========================================================================

    def buscar_dominio(self, dominio: str) -> Dict:
        """Retorna o conhecimento completo de um dominio."""
        mapa = {
            "biologia_molecular": self.BIOLOGIA_MOLECULAR,
            "imunologia_tumoral": self.IMUNOLOGIA_TUMORAL,
            "genomica": self.GENOMICA,
            "biopsia_liquida": self.BIOPSIA_LIQUIDA,
            "terapias_emergentes": self.TERAPIAS_EMERGENTES,
            "resistencia_terapeutica": self.RESISTENCIA_TERAPEUTICA,
            "epidemiologia_global": self.EPIDEMIOLOGIA_GLOBAL,
            "ensaios_clinicos": self.ENSAIOS_CLINICOS,
        }
        return mapa.get(dominio, {})

    def buscar_conceito(self, dominio: str, conceito: str) -> Optional[Dict]:
        """Retorna detalhes de um conceito especifico dentro de um dominio."""
        dados_dominio = self.buscar_dominio(dominio)
        if not dados_dominio:
            return None
        # Busca case-insensitive
        conceito_lower = conceito.lower()
        for chave, valor in dados_dominio.items():
            if conceito_lower in chave.lower():
                return valor
            if isinstance(valor, dict):
                nome = valor.get("nome", "")
                if conceito_lower in nome.lower():
                    return valor
        return None

    def obter_vias_relevantes(self, subtipo_tumoral: str) -> List[Dict]:
        """Retorna vias moleculares relevantes para um subtipo tumoral."""
        mapeamento = self.MAPEAMENTO_SUBTIPO_VIAS.get(subtipo_tumoral)
        if not mapeamento:
            # Fallback: vias gerais
            return [
                {"via": "via_mapk_ras", "relevancia": "Universal", "score": 0.7},
                {"via": "via_pi3k_akt_mtor", "relevancia": "Universal", "score": 0.6},
                {"via": "via_p53", "relevancia": "Universal", "score": 0.8},
            ]

        vias = []
        for via_key in mapeamento.get("vias_principais", []):
            dados_via = self.BIOLOGIA_MOLECULAR.get(via_key, {})
            if dados_via:
                vias.append({
                    "via": via_key,
                    "nome": dados_via.get("nome", via_key),
                    "frequencia_alteracao": dados_via.get("frequencia_alteracao", "N/A"),
                    "terapias_alvo": [t["agente"] for t in dados_via.get("terapias_alvo", [])],
                    "genes_principais": dados_via.get("genes", [])[:5],
                })

        return vias

    def obter_resumo_estatistico(self) -> Dict:
        """Retorna resumo estatistico da base de conhecimento."""
        return {
            "versao": self.VERSAO,
            "total_dominios": 8,
            "total_vias_moleculares": len(self.BIOLOGIA_MOLECULAR),
            "total_checkpoint_alvos": len(self.IMUNOLOGIA_TUMORAL.get("checkpoint_inibidores", {}).get("alvos", [])),
            "total_metodos_ngs": len(self.GENOMICA.get("tecnologias_ngs", {}).get("metodos", [])),
            "total_adcs": len(self.TERAPIAS_EMERGENTES.get("adc", {}).get("produtos", [])),
            "total_car_t": len(self.TERAPIAS_EMERGENTES.get("car_t_cell", {}).get("produtos", [])),
            "total_biespecificos": len(self.TERAPIAS_EMERGENTES.get("anticorpo_biespecifico", {}).get("produtos", [])),
            "total_mecanismos_resistencia": len(self.RESISTENCIA_TERAPEUTICA.get("mecanismos", [])),
            "subtipos_mapeados": len(self.MAPEAMENTO_SUBTIPO_VIAS),
        }

    def gerar_contexto_clinico(self, subtipo: str, biomarcadores: Dict) -> str:
        """Gera contexto clinico rico combinando vias com biomarcadores do paciente."""
        vias = self.obter_vias_relevantes(subtipo)
        mapeamento = self.MAPEAMENTO_SUBTIPO_VIAS.get(subtipo, {})

        partes = [f"Subtipo tumoral: {subtipo}"]

        if mapeamento:
            partes.append(f"Vias ativadas: {', '.join(mapeamento.get('vias_principais', []))}")
            partes.append(f"Terapias-chave: {', '.join(mapeamento.get('terapias_chave', []))}")
            partes.append(f"Resistencia comum: {', '.join(mapeamento.get('resistencia_comum', []))}")
            partes.append(f"Fenotipo imune: {mapeamento.get('imunofenotipo', 'N/A')}")

        if vias:
            genes_relevantes = set()
            for v in vias[:3]:
                genes_relevantes.update(v.get("genes_principais", []))
            partes.append(f"Genes monitorar: {', '.join(list(genes_relevantes)[:10])}")

        # Adicionar contexto dos biomarcadores
        if biomarcadores:
            bm_parts = []
            for nome, valor in biomarcadores.items():
                bm_parts.append(f"{nome}={valor:.2f}")
            partes.append(f"Biomarcadores atuais: {', '.join(bm_parts)}")

        return " | ".join(partes)