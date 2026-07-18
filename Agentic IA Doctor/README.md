# AI Doctor Engine — Agente Orquestrador de Oncologia de Precisao

Motor de inteligencia artificial agentic para simulacao de decisao oncologica. O agente percebe o estado clinico do paciente via biomarcadores (ctDNA, CTC, TMB, PD-L1, TILs, ECOG), gera cenarios prognosticos com RAG + Monte Carlo (150 simulacoes), decide por fusao bayesiana modulada por estado emocional artificial, e realiza auto-cura evolutiva (mutacao de paradigma terapeutico) quando a performance degrada.

## Arquitetura

```
AI_Doctor/
  config.py                    # Configuracao (env vars, limites clinicos)
  main.py                      # Orquestrador principal
  mapeadores.py                # Protocolos NCCN/ASCO por subtipo
  data_connectors.py           # TCGA GDC API + fallback sintetico
  core/
    agente.py                  # Cerebro: percepcao, decisao bayesiana, auto-cura
    clonal.py                  # Dinamica clonal de resistencia tumoral
    emocao.py                  # Sistema limbico artificial
    fisiologia.py              # Reserva organica (renal, hepatica, hematologica)
    genoma.py                  # Paradigma terapeutico mutavel (evolutivo)
    memoria.py                 # RAG in-memory (casos analogos)
    explicador.py              # XAI (SHAP simulado + relatorio clinico)
    shap_xai.py                # XAI (SHAP real com RandomForest)
  infrastructure/
    chroma_db.py               # ChromaDB persistente para vetores
    audit.py                   # Auditoria PostgreSQL (SQLAlchemy 2.0)
    scheduler.py               # Aprendizado continuo (APScheduler)
    validacao.py               # Validacao prospectiva
  dashboard/
    app.py                     # Painel Streamlit
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Motor de decisao | Python 3.10, NumPy, SciPy |
| RAG/Vetores | ChromaDB (persistente) |
| XAI | SHAP (real) + simulado |
| Dados clínicos | TCGA GDC API |
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