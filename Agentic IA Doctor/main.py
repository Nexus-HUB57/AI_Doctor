import sys
import time
from data_connectors import TCGAConnectorReal
from embedding_model import VetorStoreRAG
from shap_xai import ExplicadorSHAPReal

def boot_sistema():
    print("[1/3] Baixando dados moleculares do GDC API...")
    df = TCGAConnectorReal().baixar_dados_clinicos(limit=100)
    
    print("[2/3] Indexando instâncias e populando RAG local...")
    rag = VetorStoreRAG()
    rag.adicionar_casos(df)
    
    print("[3/3] Treinando árvore substituta global (SHAP)...")
    xai = ExplicadorSHAPReal()
    xai.recalibrar_surrogate(df)
    print("✅ Motor Inicializado com Sucesso.")

if __name__ == "__main__":
    boot_sistema()
    if "--dashboard" in sys.argv:
        print("Subindo interface via Streamlit...")
