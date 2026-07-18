import os

CONFIG = {
    "DB_URL": os.getenv("DB_URL", "postgresql://user:pass@localhost:5432/ai_doctor"),
    "MODEL_PATH": "./models/decision_model.pkl",
    "SHAP_EXPLAINER_PATH": "./models/shap_explainer.pkl",
    "CHROMA_PERSIST_DIR": "./chroma_db",
    "SCHEDULE_INTERVAL_HOURS": 24,
    "RAG_JANELA_MAX": 2000,
    "ECOGRESERVA_LIMIAR": 0.5,
    "DOSE_MINIMA": 0.0,
    "DOSE_MAXIMA": 1.0,
    "LIMIAR_CTDNA_ALTO": 0.6,
    "LIMIAR_CTDNA_BAIXO": 0.3,
    "FATOR_INTENSIFICAR": 0.15,
    "FATOR_REDUZIR": 0.10,
    "FATOR_MODERADO": 0.05
}
