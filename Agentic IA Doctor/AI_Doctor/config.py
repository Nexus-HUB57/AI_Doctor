import os

CONFIG = {
    # Banco de dados — usar variavel de ambiente em producao
    "DB_URL": os.getenv("DB_URL", "sqlite:///ai_doctor_audit.db"),
    # Modelos
    "MODEL_PATH": os.getenv("MODEL_PATH", "./models/decision_model.pkl"),
    "SHAP_EXPLAINER_PATH": os.getenv("SHAP_EXPLAINER_PATH", "./models/shap_explainer.pkl"),
    # ChromaDB
    "CHROMA_PERSIST_DIR": os.getenv("CHROMA_DB_PATH", "./chroma_db"),
    # Scheduler
    "SCHEDULE_INTERVAL_HOURS": int(os.getenv("SCHEDULE_INTERVAL_HOURS", "24")),
    "NOVOS_CASOS_PATH": os.getenv("NOVOS_CASOS_PATH", "novos_casos.csv"),
    "HISTORICO_PATH": os.getenv("HISTORICO_PATH", "historico_treino.csv"),
    # RAG
    "RAG_JANELA_MAX": 2000,
    # Limites clinicos
    "ECOGRESERVA_LIMIAR": 0.5,
    "DOSE_MINIMA": 0.0,
    "DOSE_MAXIMA": 1.0,
    "LIMIAR_CTDNA_ALTO": 0.6,
    "LIMIAR_CTDNA_BAIXO": 0.3,
    "FATOR_INTENSIFICAR": 0.15,
    "FATOR_REDUZIR": 0.10,
    "FATOR_MODERADO": 0.05,

    # === DIMHEX — Digital Medical Health Explorer ===
    # Intervalo do ciclo de pesquisa em minutos (padrao: 240 = 4 horas)
    "DIMHEX_INTERVAL_MINUTES": int(os.getenv("DIMHEX_INTERVAL_MINUTES", "240")),
    # Janela de lookback para buscas em dias
    "DIMHEX_LOOKBACK_DAYS": int(os.getenv("DIMHEX_LOOKBACK_DAYS", "30")),
    # Max resultados por fonte por ciclo
    "DIMHEX_MAX_RESULTS_PER_SOURCE": int(os.getenv("DIMHEX_MAX_RESULTS_PER_SOURCE", "50")),
    # Score minimo para indexacao na base de conhecimento
    "DIMHEX_MIN_SCORE": float(os.getenv("DIMHEX_MIN_SCORE", "0.25")),
    # Timeout de requisicoes HTTP em segundos
    "DIMHEX_REQUEST_TIMEOUT": int(os.getenv("DIMHEX_REQUEST_TIMEOUT", "30")),
    # Ativar/desativar pesquisa DIMHEX
    "DIMHEX_PESQUISA_ATIVA": os.getenv("DIMHEX_PESQUISA_ATIVA", "true").lower() == "true",
    # Fontes ativas (JSON array: pubmed, clinical_trials, who, google_scholar)
    "DIMHEX_ACTIVE_SOURCES": os.getenv("DIMHEX_ACTIVE_SOURCES", '["pubmed", "clinical_trials", "google_scholar"]'),
    # Caminho para persistencia de estado do DIMHEX
    "DIMHEX_STATE_PATH": os.getenv("DIMHEX_STATE_PATH", "./dimhex_estado.json"),
    # Caminhos para memória persistente (Senciência)
    "DIMHEX_MEMORY_PATH": os.getenv("DIMHEX_MEMORY_PATH", "./dimhex_memoria.json"),
    "DIMHEX_WISDOM_PATH": os.getenv("DIMHEX_WISDOM_PATH", "./dimhex_sabedoria.json"),
}