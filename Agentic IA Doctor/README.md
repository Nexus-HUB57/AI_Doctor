# AI Doctor Engine — Agente Orquestrador de Oncologia de Precisao

Motor de inteligencia artificial agentic para simulacao de decisao oncologica. O agente percebe o estado clinico do paciente via biomarcadores (ctDNA, CTC, TMB, PD-L1, TILs, ECOG), gera cenarios prognosticos com RAG + Monte Carlo (150 simulacoes), decide por fusao bayesiana modulada por estado emocional artificial, e realiza auto-cura evolutiva (mutacao de paradigma terapeutico) quando a performance degrada.

## Arquitetura

```
AI_Doctor/
  config.py                    # Configuracao (env vars, limites clinicos, DIMHEX)
  main.py                      # Orquestrador principal
  mapeadores.py                # Protocolos NCCN/ASCO por subtipo
  data_connectors.py           # TCGA GDC API + fallback sintetico
  core/
    agente.py                  # Cerebro: percepcao, decisao bayesiana, auto-cura
    clonal.py                  # Dinamica clonal de resistencia tumoral
    dimhex.py                  # DIMHEX: Motor de Inteligencia Medica Continua
    emocao.py                  # Sistema limbico artificial
    fisiologia.py              # Reserva organica (renal, hepatica, hematologica)
    genoma.py                  # Paradigma terapeutico mutavel (evolutivo)
    memoria.py                 # RAG in-memory (casos analogos)
    relevance_scorer.py        # Scoring bayesiano de relevancia clinica
    explicador.py              # XAI (SHAP simulado + relatorio clinico)
    shap_xai.py                # XAI (SHAP real com RandomForest)
  infrastructure/
    chroma_db.py               # ChromaDB persistente para vetores
    audit.py                   # Auditoria PostgreSQL (SQLAlchemy 2.0)
    knowledge_updater.py       # DIMHEX: Processamento e indexacao de achados
    research_sources.py        # DIMHEX: Conectores PubMed, ClinicalTrials, WHO
    scheduler.py               # Aprendizado continuo + DIMHEX (APScheduler)
    validacao.py               # Validacao prospectiva
  dashboard/
    app.py                     # Painel Streamlit (Tumor Board + DIMHEX)
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Motor de decisao | Python 3.10, NumPy, SciPy |
| RAG/Vetores | ChromaDB (persistente) |
| XAI | SHAP (real) + simulado |
| Dados clinicos | TCGA GDC API |
| Pesquisa medica | PubMed E-utilities, ClinicalTrials.gov v2, WHO GHO |
| Auditoria | PostgreSQL + SQLAlchemy 2.0 |
| Dashboard | Streamlit + Plotly |
| ML | scikit-learn, PyTorch (CPU) |

## Execucao

### Local (sem banco)

```bash
cd "Agentic IA Doctor/AI_Doctor"
pip install -r requirements.txt
python main.py
```

### Dashboard Streamlit

```bash
streamlit run dashboard/app.py
```

### Docker Compose (com PostgreSQL)

```bash
cd "Agentic IA Doctor"
# Criar .env com: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
docker compose up -d --build
```

## Variaveis de Ambiente

| Variavel | Default | Descricao |
|----------|---------|-----------|
| `DB_URL` | `sqlite:///ai_doctor_audit.db` | URL do banco (PostgreSQL ou SQLite) |
| `CHROMA_DB_PATH` | `./chroma_db` | Diretorio do ChromaDB |
| `SCHEDULE_INTERVAL_HOURS` | `24` | Intervalo do scheduler |
| `MODEL_PATH` | `./models/decision_model.pkl` | Caminho do modelo |
| `SHAP_EXPLAINER_PATH` | `./models/shap_explainer.pkl` | Caminho do explainer SHAP |
| `DIMHEX_INTERVAL_MINUTES` | `240` | Intervalo do ciclo de pesquisa DIMHEX |
| `DIMHEX_LOOKBACK_DAYS` | `30` | Janela de busca por publicacoes recentes |
| `DIMHEX_MAX_RESULTS_PER_SOURCE` | `50` | Max resultados por fonte por ciclo |
| `DIMHEX_MIN_SCORE` | `0.25` | Score minimo para indexacao no ChromaDB |
| `DIMHEX_PESQUISA_ATIVA` | `true` | Ativar/desativar pesquisa DIMHEX |
| `DIMHEX_ACTIVE_SOURCES` | `["pubmed", "clinical_trials"]` | Fontes ativas (pubmed, clinical_trials, who) |

## DIMHEX — Digital Medical Health Explorer

**Core Business** do ecossistema. Motor de inteligencia medica continua que opera a cada 240 minutos (4h), buscando em fontes cientificas externas achados capazes de aprimorar o sistema de diagnostico e tratamento.

### Fluxo por Ciclo

```
COLETAR          AVALIAR           FILTRAR          INTEGRAR         ANALISAR         REPORTAR
PubMed ─┐                                                                                    
         ├─ 20 termos  ─> Scoring       ─> Score >= 0.25 ─> Embedding    ─> Insights    ─> Relatorio
ClinTri ─┤   de busca     Bayesiano 5D   Filtra          semantico       acionaveis     executivo
         │   por fonte    (dominio,      irrelevantes    no ChromaDB     para o         com metricas
WHO    ──┘                evidencia,                       (colecao       sistema        completas
                       novidade,                          dimhex_        (novos         
                       aplicabilidade,                     conhecimento)  protocolos,   
                       impacto)                                            limiares)     
```

### Fontes de Pesquisa

| Fonte | API | Conteudo | Termos de Busca |
|-------|-----|----------|-----------------|
| **PubMed** | NCBI E-utilities (esearch + efetch) | Artigos cientificos com resumo | 20 termos focados em ctDNA, CTC, TMB, PD-L1, TILs, resistencia, SHAP, precision oncology |
| **ClinicalTrials.gov** | API v2 | Ensaios clinicos ativos/recrutando | 10 termos: liquid biopsy, KRAS G12C, PD-L1, adaptive therapy, ADC, CAR-T, etc. |
| **WHO** | Global Health Observatory API | Indicadores globais de saude | Mortalidade e incidencia de cancer |

### Scoring Bayesiano de Relevancia

Cada achado e avaliado em 5 dimensoes com pesos adaptativos:

| Dimensao | Peso | Descricao |
|----------|------|-----------|
| **Pertinencia ao Dominio** | 35% | Sobreposicao com 7 biomarcadores do sistema + 3 subtipos tumorais |
| **Evidencia Clinica** | 25% | Robustez: tipo de estudo, fase, p-valores, HR, randomizacao |
| **Novidade** | 15% | Recencia (decaimento exponencial, meia-vida 30 dias) + termos de inovacao |
| **Aplicabilidade** | 15% | Viabilidade de integracao: mencao a AI, guidelines, dados quantitativos |
| **Impacto Potencial** | 10% | Magnitude: overall survival, complete response, taxas de resposta, HR favoravel |

Classificacao resultante: `critico (>=0.75)` | `alto (>=0.55)` | `moderado (>=0.35)` | `baixo (>=0.15)` | `irrelevante`

### Insights Acionaveis

O DIMHEX gera automaticamente 3 tipos de insights:

| Tipo | Gatilho | Acao Sugerida |
|------|---------|---------------|
| **Concentracao de Evidencia** | 2+ achados relevantes para o mesmo biomarcador | Revisar limiares e pesos do agente |
| **Novo Protocolo** | Ensaio clinico classificado como critico/alto | Considerar adicao ao mapeador NCCN/ASCO |
| **Atualizacao de Limiar** | Artigo discute cut-offs otimos | Verificar se CONFIG precisa de ajuste |

### Base de Conhecimento

Achados relevantes sao indexados em uma segunda colecao ChromaDB (`dimhex_conhecimento`) com embeddings semanticos de dimensao 64. O agente oncologico pode consultar essa base antes de decisoes terapeuticas via `dimhex.buscar_evidencia_para_decisao(contexto_clinico)`.

### Persistencia

O estado do DIMHEX (ciclo atual, totais, distribuicao de scores) e salvo em `dimhex_estado.json` entre reinicios, garantindo continuidade operacional.