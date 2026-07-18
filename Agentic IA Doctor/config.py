import os

CONFIG = {
    "TCGA": {"enabled": True, "cancer_type": "LUAD", "limit": 200},
    "CHROMA_DB_PATH": os.getenv("CHROMA_DB_PATH", "./chroma_db"),
    "MODEL_PATH": "./models/decision_model.pkl",
    "SHAP_EXPLAINER_PATH": "./models/shap_explainer.pkl",
    "DB_URL": os.getenv("DATABASE_URL", "sqlite:///audit.db"),
    "SCHEDULE_INTERVAL_HOURS": 24
}
