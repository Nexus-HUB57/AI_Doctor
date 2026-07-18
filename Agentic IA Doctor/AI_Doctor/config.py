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
    "FATOR_MODERADO": 0.05
}