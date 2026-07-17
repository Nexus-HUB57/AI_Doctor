# main_producao.py
from data_connectors import ClinicalDataLoader
from agente import AgenteOncologicoPrecisao
from vetor_store import VetorStore
from audit import Auditor
from dashboard import run_dashboard  # se quiser iniciar via script

# 1. Carregar dados reais
df = ClinicalDataLoader.carregar_dados('tcga', cancer_type='LUAD', limit=2000)
df_hist = df.sample(1500)

# 2. Criar agente com embeddings BioBERT
agente = AgenteOncologicoPrecisao(df_hist, usar_chroma=True)

# 3. Povoar o RAG com esses dados
# (já feito na inicialização do VetorStore)

# 4. Iniciar dashboard
run_dashboard()  # streamlit run dashboard.py
