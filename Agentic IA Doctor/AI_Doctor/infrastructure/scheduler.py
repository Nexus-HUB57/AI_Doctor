import datetime
import pandas as pd
from apscheduler.schedulers.background import BackgroundScheduler
from core.agente import AgenteOncologicoPrecisao
from core.explicador import atualizar_explicador_shap
from infrastructure.chroma_db import BancoVetorialChromaDB
from config import CONFIG

def job_aprendizado_continuo():
    print(f"[{datetime.datetime.now()}] Executando aprendizado contínuo...")
    try:
        df_novos = pd.read_csv("novos_casos.csv")
        if not df_novos.empty:
            chroma = BancoVetorialChromaDB()
            for _, row in df_novos.iterrows():
                vetor = np.array([row['ctDNA'], np.log1p(row['CTC'])/10.0, row['TMB']/50.0, row['PD_L1'], row['TILs']])
                chroma.indexar_caso_clinico(row['patient_id'], vetor, {"ECOG": row['ECOG'], "ctDNA": row['ctDNA']})
            print("   ✅ Casos adicionados ao ChromaDB.")
    except Exception as e:
        print(f"❌ Erro no scheduler: {e}")

def iniciar_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(job_aprendizado_continuo, 'interval', hours=CONFIG["SCHEDULE_INTERVAL_HOURS"])
    scheduler.start()
    return scheduler
