"""
DIMHEX — Iniciar Scheduler de Aprendizagem com Cobertura Expandida v4.0
Inicia apenas o scheduler sem repovoar o RAG (que ja esta populado).

Jobs ativos:
1. DIMHEX Ciclo Completo (a cada 4h): Pesquisa + Scoring + Sabedoria + Indexacao
2. Auto-Povoamento RAG (diario): +76 casos/dia (2 por subtipo x 38 subtipos)
3. Manutencao Memoria (diario): Compactacao e limpeza Senciencia
4. Relatorio Diario (1x/dia): Sumario para dashboard
5. Health Check (10min): Verifica integridade do sistema
"""

import sys
import os
import time
import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)


def main():
    print("=" * 70)
    print("  DIMHEX v4.0 — Scheduler de Aprendizagem Continua")
    print("  38 subtipos tumorais | 1.900 casos + 71 documentos")
    print(f"  Inicio: {datetime.datetime.now().isoformat()}")
    print("=" * 70)

    # Verificar estado do RAG
    from infrastructure.chroma_db import BancoVetorialChromaDB
    chroma_tumores = BancoVetorialChromaDB(colecao_nome="ai_doctor_tumores")
    chroma_conhecimento = BancoVetorialChromaDB(colecao_nome="dimhex_conhecimento")

    n_tumores = chroma_tumores.collection.count()
    n_conhecimento = chroma_conhecimento.collection.count()

    print(f"\n  Estado do RAG:")
    print(f"    ai_doctor_tumores: {n_tumores} casos clinicos")
    print(f"    dimhex_conhecimento: {n_conhecimento} documentos")
    print(f"    Total: {n_tumores + n_conhecimento} registros")

    if n_tumores < 100:
        print("\n  ATENCAO: RAG com poucos casos. Execute povoamento primeiro:")
        print("    python scripts/repovoar_rag_v4.py --povoa")
        return

    # Iniciar scheduler
    from infrastructure.scheduler import iniciar_scheduler
    scheduler = iniciar_scheduler()

    print(f"\n{'='*70}")
    print(f"  DIMHEX v4.0 — EXECUTANDO COM COBERTURA EXPANDIDA")
    print(f"  38 subtipos tumorais | Protocolo: ciclo a cada 4h")
    print(f"  Auto-povoamento: +76 casos/dia (2 x 38 subtipos)")
    print(f"  Pressione Ctrl+C para encerrar")
    print(f"{'='*70}\n")

    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n  Encerrando DIMHEX...")
        scheduler.shutdown()
        print("  Sistema encerrado com sucesso.")


if __name__ == "__main__":
    main()