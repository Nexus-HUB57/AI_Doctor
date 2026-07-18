import datetime
import numpy as np
import pandas as pd
from apscheduler.schedulers.background import BackgroundScheduler
from core.agente import AgenteOncologicoPrecisao
from core.explicador import atualizar_explicador_shap
from infrastructure.chroma_db import BancoVetorialChromaDB
from config import CONFIG

def job_aprendizado_continuo():
    print(f"[{datetime.datetime.now().isoformat()}] Executando aprendizado continuo...")
    caminho_novos_casos = CONFIG.get("NOVOS_CASOS_PATH", "novos_casos.csv")
    try:
        df_novos = pd.read_csv(caminho_novos_casos)
        if not df_novos.empty:
            chroma = BancoVetorialChromaDB()
            for _, row in df_novos.iterrows():
                vetor = np.array([row['ctDNA'], np.log1p(row['CTC'])/10.0, row['TMB']/50.0, row['PD_L1'], row['TILs']])
                chroma.indexar_caso_clinico(row['patient_id'], vetor, {"ECOG": row['ECOG'], "ctDNA": row['ctDNA']})
            print("   Casos adicionados ao ChromaDB.")
    except FileNotFoundError:
        print(f"   Nenhum arquivo de novos casos encontrado ({caminho_novos_casos}). Aguardando...")
    except Exception as e:
        print(f"   Erro no scheduler: {e}")


def job_dimhex():
    """Ciclo completo do DIMHEX — Pesquisa, Avaliacao, Integracao de conhecimento medico."""
    try:
        from core.dimhex import DIMHEX
        dimhex = DIMHEX()
        relatorio = dimhex.executar_ciclo_completo()

        # Log resumido
        coleta = relatorio.get("coleta", {})
        avaliacao = relatorio.get("avaliacao", {})
        integracao = relatorio.get("integracao", {})

        print(f"[{datetime.datetime.now().isoformat()}] DIMHEX Ciclo #{relatorio.get('ciclo', '?')} concluido")
        print(f"   Coletados: {coleta.get('total_achados', 0)} | "
              f"Relevantes: {avaliacao.get('total_relevantes', 0)} | "
              f"Indexados: {integracao.get('total_indexados', 0)} | "
              f"Duracao: {relatorio.get('duracao_segundos', 0):.1f}s")
    except Exception as e:
        print(f"[{datetime.datetime.now().isoformat()}] ERRO DIMHEX: {e}")


def iniciar_scheduler():
    scheduler = BackgroundScheduler()

    # Job original: aprendizado continuo com casos clinicos (intervalo configuravel)
    scheduler.add_job(
        job_aprendizado_continuo,
        'interval',
        hours=CONFIG["SCHEDULE_INTERVAL_HOURS"],
        id="aprendizado_continuo"
    )

    # Job DIMHEX: pesquisa medica continua a cada 240 minutos (4 horas)
    dimhex_intervalo = CONFIG.get("DIMHEX_INTERVAL_MINUTES", 240)
    scheduler.add_job(
        job_dimhex,
        'interval',
        minutes=dimhex_intervalo,
        id="dimhex_pesquisa",
        max_instances=1  # Evita sobreposicao de ciclos
    )

    scheduler.start()

    intervalos = [
        f"  Aprendizado Continuo: a cada {CONFIG['SCHEDULE_INTERVAL_HOURS']}h",
        f"  DIMHEX Pesquisa: a cada {dimhex_intervalo}min ({dimhex_intervalo // 60}h{dimhex_intervalo % 60}m)",
    ]
    print(f"[Scheduler] Jobs ativos:\n" + "\n".join(intervalos))

    return scheduler