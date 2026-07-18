import os
import pickle
import shap
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from config import CONFIG

class ExplicadorSHAPReal:
    """Explainer SHAP real usando RandomForest como modelo substituto."""
    def __init__(self):
        self.features = ['ctDNA', 'CTC', 'TMB', 'PD_L1', 'TILs', 'ECOG']
        self.model = RandomForestClassifier(n_estimators=30, max_depth=5, random_state=42)
        self.explainer = None

    def recalibrar_surrogate(self, df_treino: pd.DataFrame):
        if len(df_treino) < 10:
            return
        X = df_treino[self.features].fillna(0)
        y = df_treino['ctDNA'].apply(lambda x: 2 if x > 0.6 else (0 if x < 0.3 else 1))
        self.model.fit(X, y)
        self.explainer = shap.TreeExplainer(self.model)
        path = CONFIG.get("SHAP_EXPLAINER_PATH", "./models/shap_real_explainer.pkl")
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    def explicar_instancia(self, arr_instancia: np.ndarray) -> dict:
        if self.explainer is None:
            return {f: 0.0 for f in self.features}
        shap_vals = self.explainer.shap_values(arr_instancia.reshape(1, -1))
        if isinstance(shap_vals, list):
            res = shap_vals[2][0] if len(shap_vals) > 2 else shap_vals[0][0]
        elif len(shap_vals.shape) == 3:
            idx_classe = min(2, shap_vals.shape[2] - 1)
            res = shap_vals[0, :, idx_classe]
        else:
            res = shap_vals[0]
        return {self.features[i]: float(res[i]) for i in range(min(len(self.features), len(res)))}