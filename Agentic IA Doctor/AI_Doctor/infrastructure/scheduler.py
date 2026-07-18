"""
DIMHEX — Scheduler de Aprendizagem Contínua v3.0
Protocolo de aprendizagem automática a cada 4 horas (240 minutos).

Jobs ativos:
1. DIMHEX Ciclo Completo (a cada 4h): Pesquisa + Scoring + Sabedoria + Indexação
2. Auto-Povoamento RAG (diário): Gera e indexa novos casos sintéticos
3. Manutenção Memória (diário): Compacção e limpeza da memória Senciência
4. Relatório Diário (1x/dia): Sumário do aprendizado para dashboard
5. Health Check (10min): Verifica integridade do sistema

Cada ciclo de 4h executa o fluxo completo DIMHEX 7 fases:
  COLETAR → AVALIAR → FILTRAR → SABEDORIA → INTEGRAR → ANALISAR → REPORTAR
"""

import datetime
import json
import os
import traceback
from typing import Dict, Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR

from config import CONFIG


# =============================================================================
# JOBS DO PROTOCOLO DE APRENDIZAGEM
# =============================================================================

def job_dimhex_ciclo_completo():
    """
    JOB PRINCIPAL — Ciclo completo DIMHEX a cada 4 horas.
    Executa todas as 7 fases: pesquisa, scoring, sabedoria, indexação.
    """
    ts = datetime.datetime.now().isoformat()
    print(f"\n{'#'*70}")
    print(f"  [SCHEDULER] DIMHEX Ciclo Programado — {ts}")
    print(f"{'#'*70}")

    try:
        from core.dimhex import DIMHEX
        dimhex = DIMHEX()
        relatorio = dimhex.executar_ciclo_completo()

        # Métricas do ciclo
        coleta = relatorio.get("coleta", {})
        avaliacao = relatorio.get("avaliacao", {})
        integracao = relatorio.get("integracao", {})
        sabedoria = relatorio.get("sabedoria", {})

        print(f"\n  [SCHEDULER] Ciclo #{relatorio.get('ciclo', '?')} FINALIZADO")
        print(f"    Coletados: {coleta.get('total_achados', 0)}")
        print(f"    Relevantes: {avaliacao.get('total_relevantes', 0)}")
        print(f"    Taxa relevância: {avaliacao.get('taxa_relevancia', 0):.1%}")
        print(f"    Indexados: {integracao.get('total_indexados', 0)}")
        print(f"    Duplicatas removidas: {sabedoria.get('duplicatas_removidas', 0)}")
        print(f"    Sínteses geradas: {len(sabedoria.get('sinteses', []))}")
        print(f"    Hipóteses: {len(sabedoria.get('hipoteses', []))}")
        print(f"    Duração: {relatorio.get('duracao_segundos', 0):.1f}s")

        # Salvar relatório do ciclo
        _salvar_relatorio_ciclo(relatorio)

        return relatorio

    except Exception as e:
        erro = f"ERRO CRÍTICO no ciclo DIMHEX: {e}\n{traceback.format_exc()}"
        print(f"\n  [SCHEDULER] {erro}")
        _salvar_erro("dimhex_ciclo", erro)
        return None


def job_auto_povoamento_rag():
    """
    JOB DIÁRIO — Auto-povoamento incremental do RAG.
    Gera novos casos clínicos sintéticos e indexa na base vetorial.
    Expande a cobertura de casos análogos para busca.
    """
    ts = datetime.datetime.now().isoformat()
    print(f"\n  [SCHEDULER] Auto-Povoamento RAG — {ts}")

    try:
        from infrastructure.rag_seeder import gerar_casos_sinteticos
        from infrastructure.chroma_db import BancoVetorialChromaDB

        chroma = BancoVetorialChromaDB()
        total_antes = chroma.collection.count()

        # Gerar 20 novos casos (distribuídos entre subtipos)
        novos_casos = gerar_casos_sinteticos(n_por_subtipo=2)
        indexados = 0

        for caso in novos_casos:
            try:
                # Verificar duplicata por ID
                chroma.collection.upsert(
                    ids=[caso["patient_id"]],
                    embeddings=[caso["vetor"].tolist()],
                    metadatas=[{
                        **caso["metadados"],
                        "ciclo_seed": _obter_ciclo_rag(),
                        "auto_seed": ts,
                    }]
                )
                indexados += 1
            except Exception:
                pass

        total_depois = chroma.collection.count()
        print(f"    Casos adicionados: {indexados} | Total na coleção: {total_depois}")

    except Exception as e:
        print(f"    [ERRO] Auto-povoamento falhou: {e}")
        _salvar_erro("auto_povoamento", str(e))


def job_manutencao_memoria():
    """
    JOB DIÁRIO — Manutenção da memória Senciência.
    Compacção, limpeza de entradas obsoletas, e geração de sabedoria profunda.
    """
    ts = datetime.datetime.now().isoformat()
    print(f"\n  [SCHEDULER] Manutenção Memória Senciência — {ts}")

    try:
        from core.memoria_persistente import MemoriaPersistenteSenciencia
        senciencia = MemoriaPersistenteSenciencia()

        # Obter métricas antes
        metricas_antes = senciencia.obter_metricas_sabedoria()

        # Compacção: limitar memórias episódicas aos últimos 200
        senciencia._compacar_memoria(limites={"episodica": 200, "projetiva": 100})

        # Gerar sabedoria profunda (padrões multi-ciclo)
        insights = senciencia._gerar_sabedoria_profunda()

        metricas_depois = senciencia.obter_metricas_sabedoria()

        print(f"    Sabedoria profunda: {len(insights)} novos insights")
        print(f"    Coeficiente sabedoria: {metricas_depois.get('coeficiente_sabedoria', 0):.4f}")
        print(f"    Memórias episódicas: {metricas_depois.get('total_episodica', 0)}")
        print(f"    Memórias semânticas: {metricas_depois.get('total_semantica', 0)}")

    except Exception as e:
        print(f"    [ERRO] Manutenção memória falhou: {e}")
        _salvar_erro("manutencao_memoria", str(e))


def job_relatorio_diario():
    """
    JOB DIÁRIO — Gera relatório resumido do aprendizado.
    Consolidado para dashboard e análise de evolução.
    """
    ts = datetime.datetime.now().isoformat()
    print(f"\n  [SCHEDULER] Relatório Diário — {ts}")

    try:
        from core.dimhex import DIMHEX

        dimhex = DIMHEX()
        status = dimhex.obter_status()
        base = status.get("base_conhecimento", {})
        sabedoria = status.get("sabedoria", {})
        senciencia = status.get("senciencia", {})

        relatorio = {
            "tipo": "relatorio_diario",
            "timestamp": ts,
            "dimhex_versao": status.get("versao"),
            "ciclo_atual": status.get("ciclo_atual"),
            "base_conhecimento": {
                "total_indexados": base.get("total_indexados", 0),
                "total_rejeitados": base.get("total_rejeitados", 0),
                "taxa_aprovacao": base.get("taxa_aprovacao", 0),
            },
            "sabedoria": {
                "total_sinteses": status.get("sinteses_acumuladas", 0),
                "vocabulario_tamanho": sabedoria.get("vocabulario_tamanho", 0),
                "coeficiente_sabedoria": sabedoria.get("coeficiente_sabedoria", 0),
            },
            "senciencia": {
                "coeficiente_sabedoria": senciencia.get("coeficiente_sabedoria", 0),
                "total_episodica": senciencia.get("total_episodica", 0),
                "total_semantica": senciencia.get("total_semantica", 0),
            },
            "scorer": status.get("scorer", {}),
            "configuracao": status.get("configuracao", {}),
        }

        # Salvar relatório diário
        caminho = os.path.join(
            CONFIG.get("CHROMA_PERSIST_DIR", "./chroma_db"),
            f"relatorio_diario_{datetime.datetime.now().strftime('%Y%m%d')}.json"
        )
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        with open(caminho, 'w', encoding='utf-8') as f:
            json.dump(relatorio, f, indent=2, ensure_ascii=False)

        print(f"    Relatório salvo: {caminho}")
        print(f"    Ciclos acumulados: {status.get('ciclo_atual', 0)}")
        print(f"    Base de conhecimento: {base.get('total_indexados', 0)} documentos")
        print(f"    Taxa de aprovação: {base.get('taxa_aprovacao', 0):.1%}")
        print(f"    Coeficiente de sabedoria: {sabedoria.get('coeficiente_sabedoria', 0):.4f}")

    except Exception as e:
        print(f"    [ERRO] Relatório diário falhou: {e}")
        _salvar_erro("relatorio_diario", str(e))


def job_health_check():
    """
    JOB A CADA 10 MINUTOS — Verifica integridade do sistema.
    Monitora ChromaDB, memória, e conectividade com APIs.
    """
    try:
        from infrastructure.chroma_db import BancoVetorialChromaDB
        chroma = BancoVetorialChromaDB()
        count_tumores = chroma.collection.count()

        atualizador_knowledge = BancoVetorialChromaDB(colecao_nome="dimhex_conhecimento")
        count_conhecimento = atualizador_knowledge.collection.count()

        # Verificar arquivos de memória
        memoria_path = CONFIG.get("DIMHEX_MEMORY_PATH", "./dimhex_memoria.json")
        sabedoria_path = CONFIG.get("DIMHEX_WISDOM_PATH", "./dimhex_sabedoria.json")

        estado_memoria = "OK" if os.path.exists(memoria_path) else "AUSENTE"
        estado_sabedoria = "OK" if os.path.exists(sabedoria_path) else "AUSENTE"

        estado_geral = "SAUDAVEL" if count_tumores > 0 else "NECESSITA_SEED"

        print(f"  [HEALTH] {estado_geral} | "
              f"Tumores: {count_tumores} | Conhecimento: {count_conhecimento} | "
              f"Memória: {estado_memoria} | Sabedoria: {estado_sabedoria}")

        return {
            "estado": estado_geral,
            "tumores": count_tumores,
            "conhecimento": count_conhecimento,
            "memoria": estado_memoria,
            "sabedoria": estado_sabedoria,
        }

    except Exception as e:
        print(f"  [HEALTH] ERRO: {e}")
        return {"estado": "ERRO", "erro": str(e)}


# =============================================================================
# HELPERS
# =============================================================================

_ciclo_rag_counter = 0

def _obter_ciclo_rag() -> int:
    global _ciclo_rag_counter
    _ciclo_rag_counter += 1
    return _ciclo_rag_counter


def _salvar_relatorio_ciclo(relatorio: Dict):
    """Persiste relatório de ciclo em disco."""
    try:
        caminho_dir = os.path.join(CONFIG.get("CHROMA_PERSIST_DIR", "./chroma_db"), "ciclos")
        os.makedirs(caminho_dir, exist_ok=True)

        ciclo_num = relatorio.get("ciclo", 0)
        caminho = os.path.join(caminho_dir, f"ciclo_{ciclo_num:04d}.json")

        with open(caminho, 'w', encoding='utf-8') as f:
            json.dump(relatorio, f, indent=2, ensure_ascii=False, default=str)
    except Exception as e:
        print(f"    [AVISO] Não foi possível salvar relatório: {e}")


def _salvar_erro(job: str, erro: str):
    """Registra erro em log de falhas."""
    try:
        log_dir = os.path.join(CONFIG.get("CHROMA_PERSIST_DIR", "./chroma_db"), "erros")
        os.makedirs(log_dir, exist_ok=True)

        caminho = os.path.join(log_dir, f"erro_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        with open(caminho, 'w', encoding='utf-8') as f:
            json.dump({
                "job": job,
                "timestamp": datetime.datetime.now().isoformat(),
                "erro": erro,
            }, f, indent=2, ensure_ascii=False)
    except Exception:
        pass


# =============================================================================
# INICIALIZAÇÃO DO SCHEDULER
# =============================================================================

def _listener_job(event):
    """Listener para eventos do scheduler — monitora execuções."""
    if event.exception:
        print(f"  [SCHEDULER] Job '{event.job_id}' FALHOU: {event.exception}")
    else:
        print(f"  [SCHEDULER] Job '{event.job_id}' executado com sucesso")


def iniciar_scheduler() -> BackgroundScheduler:
    """
    Inicializa o scheduler com todos os jobs do protocolo de aprendizagem.

    Protocolo:
    - DIMHEX Ciclo Completo: a cada 4 horas (240 min)
    - Auto-Povoamento RAG: 1x por dia
    - Manutenção Memória: 1x por dia (deslocado 6h)
    - Relatório Diário: 1x por dia (às 00:00)
    - Health Check: a cada 10 minutos

    Returns:
        BackgroundScheduler instanciado e iniciado
    """
    scheduler = BackgroundScheduler()

    # === JOB 1: DIMHEX Ciclo Completo (a cada 4h) ===
    dimhex_intervalo = CONFIG.get("DIMHEX_INTERVAL_MINUTES", 240)
    scheduler.add_job(
        job_dimhex_ciclo_completo,
        'interval',
        minutes=dimhex_intervalo,
        id="dimhex_ciclo_completo",
        max_instances=1,
        misfire_grace_time=300,  # 5 min tolerância
        coalesce=True,
    )

    # === JOB 2: Auto-Povoamento RAG (diário) ===
    scheduler.add_job(
        job_auto_povoamento_rag,
        'interval',
        hours=24,
        id="auto_povoamento_rag",
        max_instances=1,
    )

    # === JOB 3: Manutenção Memória Senciência (diário, deslocado 6h) ===
    scheduler.add_job(
        job_manutencao_memoria,
        'interval',
        hours=24,
        id="manutencao_memoria",
        max_instances=1,
    )

    # === JOB 4: Relatório Diário (diário) ===
    scheduler.add_job(
        job_relatorio_diario,
        'interval',
        hours=24,
        id="relatorio_diario",
        max_instances=1,
    )

    # === JOB 5: Health Check (10 min) ===
    scheduler.add_job(
        job_health_check,
        'interval',
        minutes=10,
        id="health_check",
        max_instances=1,
    )

    # Listener de eventos
    scheduler.add_listener(_listener_job, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR)

    # Iniciar
    scheduler.start()

    # Imprimir resumo
    jobs_info = scheduler.get_jobs()
    print(f"\n{'='*70}")
    print(f"  DIMHEX Scheduler v3.0 — Protocolo de Aprendizagem Ativo")
    print(f"{'='*70}")
    for job in jobs_info:
        proximo = job.next_run_time.strftime("%Y-%m-%d %H:%M:%S") if job.next_run_time else "N/A"
        print(f"  [{job.id}]")
        print(f"    Proxima execucao: {proximo}")
        if hasattr(job, 'trigger') and hasattr(job.trigger, 'interval_length'):
            seg = job.trigger.interval_length
            if seg >= 3600:
                print(f"    Intervalo: {seg // 3600}h{(seg % 3600) // 60}m")
            else:
                print(f"    Intervalo: {seg // 60}min")
    print(f"{'='*70}\n")

    return scheduler


def iniciar_scheduler_minimo():
    """
    Versão leve do scheduler — apenas health check e DIMHEX.
    Para ambientes com recursos limitados.
    """
    scheduler = BackgroundScheduler()

    dimhex_intervalo = CONFIG.get("DIMHEX_INTERVAL_MINUTES", 240)
    scheduler.add_job(
        job_dimhex_ciclo_completo,
        'interval',
        minutes=dimhex_intervalo,
        id="dimhex_ciclo_completo",
        max_instances=1,
    )

    scheduler.add_job(
        job_health_check,
        'interval',
        minutes=10,
        id="health_check",
        max_instances=1,
    )

    scheduler.start()
    print(f"[Scheduler Mínimo] DIMHEX: {dimhex_intervalo}min | Health: 10min")

    return scheduler