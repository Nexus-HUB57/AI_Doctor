import os
import pickle
import datetime
import shap
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from config import CONFIG

class ExplicadorSHAPReal:
    def __init__(self):
        self.features = ['ctDNA', 'CTC', 'TMB', 'PD_L1', 'TILs', 'ECOG']
        self.model = RandomForestClassifier(n_estimators=30, max_depth=5, random_state=42)
        self.explainer = None

    def recalibrar_surrogate(self, df_treino: pd.DataFrame):
        if len(df_treino) < 10: return
        X = df_treino[self.features].fillna(0)
        # Criação de classes discretas de política regulatória para a árvore substituta
        y = df_treino['ctDNA'].apply(lambda x: 2 if x > 0.6 else (0 if x < 0.3 else 1))
        
        self.model.fit(X, y)
        self.explainer = shap.TreeExplainer(self.model)
        
        os.makedirs(os.path.dirname(CONFIG["SHAP_EXPLAINER_PATH"]), exist_ok=True)
        with open(CONFIG["SHAP_EXPLAINER_PATH"], 'wb') as f:
            pickle.dump(self, f)

    def explicar_instancia(self, arr_instancia: np.ndarray) -> dict:
        if self.explainer is None: 
            return {f: 0.0 for f in self.features}
        shap_vals = self.explainer.shap_values(arr_instancia.reshape(1, -1))
        # Captura as contribuições marginais estáveis da classe alvo (Intensificação)
        if isinstance(shap_vals, list):
            res = shap_vals[2][0]
        else:
            res = shap_vals[0, :, 2] if len(shap_vals.shape) == 3 else shap_vals[0]
        return {self.features[i]: float(res[i]) for i in range(len(self.features))}
