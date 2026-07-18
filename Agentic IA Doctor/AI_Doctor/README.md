# AI Doctor — Agente Oncologico de Precisao v3.0

## Plataforma DIMHEX + Fenix — Inteligencia Medica Exponencial

**DIMHEX** (Digital Medical Health Explorer) e um motor de inteligencia medica continua que pesquisa, avalia, integra e aplica evidencia cientifica em tempo real para apoiar decisoes oncológicas de precisao. Alimentado por 4 fontes de pesquisa (PubMed, ClinicalTrials.gov, WHO, Google Scholar), scoring bayesiano 5D, e auto-sabedoria exponencial.

**Sistema Fenix** representa a evolucao estrategica do DIMHEX em 4 pilares: Forja CRISPR, Vacina RNAm, Gêmeo Digital, e Matriz Microambiental.

---

## Arquitetura

```
AI_Doctor/
├── Agentic IA Doctor/AI_Doctor/
│   ├── core/                          # Logica clinica do agente
│   │   ├── agente.py                  # Agente Oncologico de Precisao (Monte Carlo 150 sim)
│   │   ├── dimhex.py                  # Orquestrador DIMHEX v2.1 (7 fases)
│   │   ├── relevance_scorer.py        # Scoring Bayesiano 5D (15+ biomarcadores)
│   │   ├── motor_probabilidade.py     # Camada 1: P(resposta), P(cura), P(tox)
│   │   ├── evidence_driven.py         # Camada 2: Feedback Loop Evidencia->Decisao
│   │   ├── otimizador_multiobjetivo.py # Camada 3: Pareto multi-objetivo
│   │   ├── clinical_validation.py     # Camada 4: CVM - Fundamentacao Cientifica
│   │   ├── genoma.py                  # Paradigma Terapeutico Mutavel (12 hiperparametros)
│   │   ├── clonal.py                  # Dinamica de Resistencia Clonal
│   │   ├── fisiologia.py              # Reserva Organica (renal, hepatica, hematologica)
│   │   ├── emocao.py                  # Sistema Limbico Artificial
│   │   ├── memoria.py                 # RAG com ChromaDB (memoria de casos)
│   │   ├── memoria_persistente.py     # Senciencia: Memoria Persistente (auto-sabedoria)
│   │   ├── explicador.py              # SHAP XAI Explicabilidade
│   │   └── base_neoplasia.py          # Base de Conhecimento Global de Neoplasia
│   ├── infrastructure/                # Infraestrutura de pesquisa e dados
│   │   ├── research_sources.py        # 4 conectores (PubMed, CT.gov, WHO, Google Scholar)
│   │   ├── pipeline_raros.py          # Pipeline dedicado: 8 canceres raros + neoplasia global
│   │   ├── knowledge_updater.py       # Atualizador ChromaDB (embedding semantico dim-64)
│   │   ├── sabedoria_orquestrador.py  # Auto Sabedoria Exponencial (TF-IDF, sintese cruzada)
│   │   ├── chroma_db.py               # Banco Vetorial ChromaDB
│   │   ├── scheduler.py               # APScheduler (DIMHEX 240min, aprendizado 24h)
│   │   ├── audit.py                   # Auditoria Clinica com PostgreSQL/SQLite
│   │   ├── validacao.py               # Suite de Validacao Prospectiva (TCGA-simulado)
│   │   └── google_scholar.py          # Conector Google Scholar
│   ├── dashboard/                     # Interface Streamlit
│   │   └── app.py                     # 2 paginas: Tumor Board + DIMHEX
│   ├── reports/                       # Relatorios de validacao
│   │   ├── Relatorio_Validacao_DIMHEX_v2.1_Canceres_Raros.pdf
│   │   ├── validacao_canceres_raros_dados.json
│   │   └── validacao_dimhex_v22_expandido.json
│   ├── tests/                         # Testes automatizados
│   │   └── test_camadas_v2.py
│   ├── mapeadores.py                  # NCCN/ASCO: 11 subtipos (3 originais + 8 raros)
│   ├── config.py                      # Configuracao centralizada
│   ├── main.py                        # Ponto de entrada (500 pacientes, DecisionTree+SHAP)
│   └── requirements.txt               # Dependencias
```

---

## Componentes Principais

### 1. DIMHEX — Motor de Inteligencia Medica Continua

Orquestra pesquisa periodica em 4 fontes medicas com ciclo de 240 minutos (4 horas).

**7 Fases do Ciclo:**
1. **COLETAR** — Executa pesquisas em PubMed, ClinicalTrials.gov, WHO, Google Scholar
2. **AVALIAR** — Scoring bayesiano 5D de relevancia clinica
3. **FILTRAR** — Separa achados relevantes (score >= 0.25)
4. **SABEDORIA** — Deduplicacao semantica, sintese cruzada, hipoteses auto-geradas
5. **INTEGRAR** — Indexa no ChromaDB para recuperacao futura
6. **ANALISAR** — Gera insights acionaveis para o sistema
7. **REPORTAR** — Produz relatorio executivo do ciclo

### 2. Scoring Bayesiano 5D

Cada achado cientifico recebe um score composto (0-1) com 5 dimensoes:

| Dimensao | Peso | Descricao |
|----------|-------|-----------|
| Pertinencia ao Dominio | 35% | Sobreposicao com 15+ biomarcadores e 11 subtipos tumorais |
| Evidencia Clinica | 25% | Tipo de publicacao, fase do estudo, robustez estatistica |
| Novidade | 15% | Recencia (decaimento exponencial, meia-vida 30 dias) + ineditismo |
| Aplicabilidade | 15% | Viabilidade de integracao (AI, guidelines, tamanho amostral) |
| Impacto Potencial | 10% | OS, ORR, HR, taxas de resposta completa |

**Classificacao:** critico (>=0.75), alto (>=0.55), moderado (>=0.35), baixo (>=0.15), irrelevante

### 3. Agente Oncologico de Precisao

Agente autonomo com 7 biomarcadores (ctDNA, CTC, TMB, PD-L1, TILs, ECOG, resistencia), Monte Carlo 150 simulacoes, decisao bayesiana com sistema limbico artificial, e dinâmica clonal evolutiva.

**4 Camadas Probabilisticas:**
- **Camada 1** — Motor de Probabilidade Terapeutica: P(resposta), P(cura), P(tox) com priores bayesianos
- **Camada 2** — Evidence-Driven Therapy: Feedback loop DIMHEX -> Probabilidades
- **Camada 3** — Otimizador Multi-Objetivo: Pareto (maximizar cura, minimizar toxicidade)
- **Camada 4** — Clinical Validation Module: Indice de Evidencia 0-100 (Oxford CEBM)

### 4. Senciencia — Memoria Persistente

Banco de memoria de longo prazo com 4 tipos:
- **Memoria Episodica**: Dados brutos de cada ciclo DIMHEX
- **Memoria Semantica**: Padroes extraidos e generalizados
- **Memoria Procedural**: Acoes que funcionaram/nao funcionaram
- **Memoria de Projecao**: Hipoteses geradas e seu status

Coeficiente de sabedoria cresce exponencialmente com os ciclos.

### 5. Mapeador NCCN/ASCO Expandido

**11 subtipos tumorais cobertos:**

| Subtipo | Linha 1 | Linha 2 | Linha 3 |
|---------|---------|---------|---------|
| NSCLC KRAS-G12C | Pembro + Carbo + Pemetrexede | Sotorasibe | Docetaxel + Ramucirumabe |
| NSCLC EGFR | Osimertinibe | Pembro + Carbo + Pemetrexede | Docetaxel + Ramucirumabe |
| TNBC Mamario | Pembro + Paclitaxel Nab | Sacituzumabe Govitecan | Eribulina |
| Seios Paranasais | Cirurgia + RT | Cisplatina + Docetaxel | Nivolumabe |
| Ducto Biliar | Gemcitabina + Cisplatina | FOLFIRINOX | Lenvatinibe + Pembro |
| Adenoide Cistico | Cirurgia + RT | Lenvatinibe | Cisplatina + Doxorrubicina |
| Amigdala HPV+ | Cisplatina + RT | Nivolumabe/Pembro | Docetaxel + Cetuximabe |
| Trompa de Falopio | Carbo + Paclitaxel | Pembro + Niraparibe | Liposomal Doxo + Topo |
| Appendice | Cirurgia + HIPEC | 5-FU + Oxali + Beva | Lu-177 DOTATATE |
| Paratireoide | Paratiroidectomia | Cinacalcet + Lenvatinibe | Denosumabe |
| Ampular | Whipple + Gem adjuvante | FOLFIRINOX | Pembro (MSI-H) |

---

## 15+ Biomarcadores Monitorados

| Biomarcador | Peso | Variantes de Busca |
|------------|------|--------------------|
| ctDNA | 0.14 | circulating tumor DNA, liquid biopsy, MRD, cfDNA, exosomal DNA |
| CTC | 0.10 | circulating tumor cell |
| TMB | 0.09 | tumor mutational burden, mutational load |
| PD-L1 | 0.09 | PD-1, checkpoint inhibitor, CTLA-4 |
| TILs | 0.09 | tumor infiltrating lymphocyte, immune infiltrate |
| ECOG | 0.06 | performance status, functional status, frailty |
| Resistencia | 0.07 | clonal evolution, acquired resistance |
| HPV/p16 | 0.07 | human papillomavirus, p16 INK4A, HPV-driven |
| FGFR2 | 0.06 | fibroblast growth factor receptor 2, pemigatinib |
| IDH1 | 0.05 | isocitrate dehydrogenase 1, ivosidenib |
| HER2 | 0.06 | ERBB2, trastuzumab |
| BRCA | 0.07 | homologous recombination deficiency, PARP inhibitor, olaparib |
| MSI | 0.06 | microsatellite instability, dMMR, pembrolizumab MSI |
| CA-125 | 0.05 | MUC16, HE4, fallopian tube |
| Neuroendocrino | 0.06 | chromogranin A, somatostatin receptor, PRRT, Lu-177 |
| Paratormonio | 0.05 | PTH, hyperparathyroidism, CDC73 |
| Ampular | 0.05 | CA 19-9, ampulla of vater, periampullary |

---

## Instalacao e Uso

```bash
# Instalar dependencias
pip install -r requirements.txt

# Executar pipeline completo (treino + agente + DIMHEX)
python main.py

# Abrir dashboard interativo
streamlit run dashboard/app.py

# Executar testes
python -m pytest tests/ -v
```

## Configuracao

Edite `config.py` ou use variaveis de ambiente:

| Variavel | Padrao | Descricao |
|----------|--------|-----------|
| `DIMHEX_INTERVAL_MINUTES` | 240 | Intervalo do ciclo de pesquisa (minutos) |
| `DIMHEX_LOOKBACK_DAYS` | 30 | Janela de lookback para buscas (dias) |
| `DIMHEX_MIN_SCORE` | 0.25 | Score minimo para indexacao |
| `DIMHEX_PESQUISA_ATIVA` | true | Ativar/desativar pesquisa |
| `DIMHEX_ACTIVE_SOURCES` | pubmed, clinical_trials, google_scholar | Fontes ativas |
| `DIMHEX_MEMORY_PATH` | ./dimhex_memoria.json | Memoria persistente Senciencia |
| `DIMHEX_WISDOM_PATH` | ./dimhex_sabedoria.json | Sabedoria acumulada |
| `SCHEDULE_INTERVAL_HOURS` | 24 | Intervalo de aprendizado continuo |
| `RAG_JANELA_MAX` | 2000 | Janela maxima do RAG |

---

## Pipeline Dedicado para Canceres Raros

O `infrastructure/pipeline_raros.py` contem:
- **56 termos de busca PubMed** especializados para 8 canceres raros
- **24 termos ClinicalTrials** para ensaios clinicos especificos
- **20 termos de neoplasia global** (biopsia liquida avancada, terapias emergentes, mecanismos de resistencia, genomica avancada, biomarcadores emergentes, oncologia de precisao)

---

## Relatorios de Validacao

O diretorio `reports/` contem:
- **Relatorio_Validacao_DIMHEX_v2.1_Canceres_Raros.pdf** — Validacao completa contra 8 canceres raros com 18 referencias
- **validacao_canceres_raros_dados.json** — Dados epidemiologicos detalhados
- **validacao_dimhex_v22_expandido.json** — Dados expandidos da validacao v2.2

---

## Principios Cientificos

- **Teorema de Bayes** com priores conjugados Beta(alpha, beta) para cada subtipo+linha
- **Monte Carlo** com 150 simulacoes por ciclo de decisao
- **ChromaDB** com embedding semantico dim-64 para recuperacao de casos analogos
- **SHAP** (SHapley Additive exPlanations) para explicabilidade das decisoes
- **Oxford CEBM** adaptado para classificacao de forca de evidencia
- **Programacao por Metas** (Goal Programming) para otimizacao multi-objetivo
- **Dinamica Evolutiva** com mutacao de paradigma terapeutico (12 hiperparametros)

---

## Sistema Fenix — 4 Pilares Estrategicos

| Pilar | Descricao | Status |
|-------|-----------|--------|
| Forja CRISPR | Edicao genica in vivo via LNP para knock-out de PD-1 em CTHs | Base cientifica (CVM) |
| Vacina RNAm | Neoantigenos personalizados (BNT122/autogene cevumeran) | Base cientifica (CVM) |
| Gemeo Digital | Simulacao paciente-especifica com modelos de resistencia clonal | Dinamica clonal ativa |
| Matriz Microambiental | Modulacao do TME (deplecao Treg, expansao Th1, inibicao IDO1) | Base cientifica (CVM) |

---

## Monitoramento

- **Scheduler**: DIMHEX a cada 240min, aprendizado a cada 24h
- **Auditoria**: Todas as decisoes registradas com SHAP + trilha de evidencia
- **Dashboard Streamlit**: Tumor Board + DIMHEX Inteligencia Medica
- **Memoria Senciencia**: Coeficiente de sabedoria com niveis (Emergente -> Expert)

---

## Citacoes e Referencias

- CodeBreak 100 (sotorasibe), FLAURA (osimertinibe), KEYNOTE-355 (pembrolizumabe+chemo), ASCENT (sacituzumabe), ABC-02 (gemcitabina+cisplatina)
- CheckMate 141 (nivolumabe SCCHN), NCI SEER 2023, Cleveland Clinic 2024
- Oxford CEBM Levels of Evidence, GRADE system
- Sackett DL. Evidence-based medicine. 1996

---

## Licenca

Projeto de pesquisa em inteligencia artificial aplicada a oncologia de precisao.
Todos os dados clinicos utilizados sao sinteticos ou publicamente disponiveis.