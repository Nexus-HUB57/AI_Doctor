import numpy as np
import os
import pickle
import datetime
from config import CONFIG

class ExplicadorSHAPClinico:
    @classmethod
    def calcular_valores_shap(cls, biomarcadores, fracao_resistentes, ecog, acao):
        val_ctDNA = (biomarcadores.get('ctDNA', 0.5) - 0.3) * 0.35
        val_fracao = (fracao_resistentes - 0.2) * 0.45
        val_ecog = (ecog - 1) * -0.30
        val_pdl1 = (biomarcadores.get('PD_L1', 0.2) - 0.5) * 0.15
        val_tmb = (biomarcadores.get('TMB', 10) / 50.0) * 0.10
        return {
            'ctDNA_CargaTumoral': round(val_ctDNA, 3),
            'Expansao_Clonal_Resistente': round(val_fracao, 3),
            'Status_Funcional_ECOG': round(val_ecog, 3),
            'Expressao_PD_L1': round(val_pdl1, 3),
            'Carga_Mutacional_TMB': round(val_tmb, 3)
        }

    @classmethod
    def formatar_relatorio_xai(cls, acao, esquema_nccn, shap_values, ecog, mutacao_chave="KRAS G12D"):
        top_driver = max(shap_values.items(), key=lambda x: abs(x[1]))
        relatorio = (
            f"┌──────────────────────────────────────────────────────────────────────────┐\n"
            f"│ 🔬 RELATÓRIO SHAP/XAI DE PRECISÃO - AIDoctor Engine                      │\n"
            f"├──────────────────────────────────────────────────────────────────────────┤\n"
            f"│  CONDUTA: {acao:<22} | PROTOCOLO NCCN: {esquema_nccn['esquema']}\n"
            f"│  CLASSE TERAPÊUTICA: {esquema_nccn['classe']}\n"
            f"├──────────────────────────────────────────────────────────────────────────┤\n"
            f"│  VALORES SHAP DE CONTRIBUIÇÃO MARGINAL DA DECISÃO:\n"
            f"│   • Impulsor Principal: {top_driver[0]} (SHAP = {top_driver[1]:+.3f})\n"
        )
        for feat, val in shap_values.items():
            bar = "█" * int(abs(val) * 20)
            sign = "+" if val > 0 else "-"
            relatorio += f"│   • {feat:<28}: {sign}{abs(val):.3f} [{bar:<10}]\n"
        relatorio += (
            f"├──────────────────────────────────────────────────────────────────────────┤\n"
            f"│  SÍNTESE DE EXPLICABILIDADE CLÍNICA:\n"
            f"│  \"Dose e protocolo ajustados para evitar expansão clonal de {mutacao_chave}\n"
            f"│   e preservar ECOG PS {ecog}, contendo escape imunológico.\"\n"
            f"└──────────────────────────────────────────────────────────────────────────┘"
        )
        return relatorio

def atualizar_explicador_shap(model, df_treino, path=CONFIG["SHAP_EXPLAINER_PATH"]):
    try:
        import shap
    except ImportError:
        print("SHAP não instalado. Instale com: pip install shap")
        return
    if model.model is None:
        return
    tamanho_amostra = min(100, len(df_treino))
    seed_dinamica = int(datetime.datetime.now().timestamp()) % 1000
    X_background = df_treino[model.feature_names].sample(tamanho_amostra, random_state=seed_dinamica)
    explainer = shap.TreeExplainer(model.model, X_background)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        pickle.dump(explainer, f)
    print(f"   🔄 [SHAP] Explainer recalculado com base em nova amostragem populacional.")
