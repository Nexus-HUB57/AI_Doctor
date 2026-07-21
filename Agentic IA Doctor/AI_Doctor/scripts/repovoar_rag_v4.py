"""
DIMHEX — Repovoamento Forcado do RAG v4.0
Limpa colecoes existentes e repovoa com 38 subtipos tumorais (1.900 casos).
Em seguida, inicia o scheduler de aprendizagem continua.

Modo de uso:
  python scripts/repovoar_rag_v4.py            # Povoa + valida + scheduler
  python scripts/repovoar_rag_v4.py --povoa   # Apenas povoamento + validacao (sem loop)
"""

import sys
import os
import json
import time
import datetime

# Garantir que estamos no diretório correto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)


def limpar_colecoes():
    """Remove e recria as colecoes do ChromaDB."""
    print("\n[1/4] Limpando colecoes existentes do ChromaDB...")
    from config import CONFIG
    import shutil

    persist_dir = CONFIG.get("CHROMA_PERSIST_DIR", "./chroma_db")
    abs_persist = os.path.abspath(persist_dir)

    # Verificar estado antes
    colecoes_antes = {}
    try:
        import chromadb
        client = chromadb.PersistentClient(path=abs_persist)
        for nome in ["ai_doctor_tumores", "dimhex_conhecimento"]:
            try:
                col = client.get_collection(nome)
                colecoes_antes[nome] = col.count()
            except Exception:
                colecoes_antes[nome] = 0
    except Exception:
        pass

    print(f"   Antes: {colecoes_antes}")

    # Deletar todo o diretorio ChromaDB para evitar conflitos de settings
    if os.path.exists(abs_persist):
        shutil.rmtree(abs_persist)
        print(f"   Diretorio ChromaDB removido: {abs_persist}")

    os.makedirs(abs_persist, exist_ok=True)
    print("   Diretorio recriado. Pronto para povoamento limpo.\n")


def executar_povoamento():
    """Executa povoamento completo do RAG."""
    print("[2/4] Executando povoamento RAG v4.0 (38 subtipos, 50 casos/subtipo)...")
    t0 = time.time()

    from infrastructure.rag_seeder import RAGSeeder

    seeder = RAGSeeder()
    resultado = seeder.povoar_rag_completo(n_casos_por_subtipo=50)

    duracao = time.time() - t0
    resumo = resultado["resumo_colecoes"]

    print(f"\n  [RESULTADO] Povoamento em {duracao:.1f}s")
    print(f"  Casos clinicos (ai_doctor_tumores): {resumo['ai_doctor_tumores']}")
    print(f"  Conhecimento (dimhex_conhecimento): {resumo['dimhex_conhecimento']}")
    print(f"  Total de registros: {resumo['ai_doctor_tumores'] + resumo['dimhex_conhecimento']}")

    return resultado, duracao


def validar_cobertura():
    """Valida cobertura dos 38 subtipos na base."""
    print("\n[3/4] Validando cobertura dos 38 subtipos...")

    from infrastructure.chroma_db import BancoVetorialChromaDB

    chroma = BancoVetorialChromaDB(colecao_nome="ai_doctor_tumores")
    col = chroma.collection
    total = col.count()

    if total == 0:
        print("   ERRO: Nenhum caso indexado!")
        return {"total_casos": 0, "subtipos_cobertos": 0, "subtipos_faltantes": []}

    # Pegar todos os metadados
    batch = col.get(include=["metadatas"])
    todos_metadados = batch.get("metadatas", [])

    # Contar por subtipo
    subtipos_count = {}
    for meta in todos_metadados:
        st = meta.get("subtipo", "DESCONHECIDO")
        subtipos_count[st] = subtipos_count.get(st, 0) + 1

    subtipos_sorted = sorted(subtipos_count.items(), key=lambda x: -x[1])

    print(f"   Total de casos: {total}")
    print(f"   Subtipos cobertos: {len(subtipos_count)}/38")
    print(f"\n   Distribuicao por subtipo:")

    for st, count in subtipos_sorted:
        status = "OK" if count >= 50 else f"!! ({count}/50)"
        print(f"   {status:6s} {st:45s}: {count:4d} casos")

    subtipos_esperados = [
        "CANCER_SEIOS_FACE", "CANCER_DUCTO_BILIAR", "CARCINOMA_ADENOIDE_CISTICO",
        "CANCER_AMIGDALA", "CANCER_TROMPA_FALOPIO", "CANCER_APPENDICE",
        "CANCER_PARATIREOIDE", "CANCER_AMPULAR",
        "NSCLC_KRAS_G12C", "NSCLC_EGFR_MUTADO", "TRIPLO_NEGATIVO_MAMARIO",
        "MAMA_HER2_POSITIVO", "MAMA_HR_POSITIVO_LUMINAL",
        "PROSTATA_HORMOSSENSIVEL", "PROSTATA_CASTRACAO_RESISTENTE",
        "PANCREAS_ADENOCARCINOMA", "PANCREAS_NEUROENDOCRINO",
        "CEREBRO_GBM", "CEREBRO_ASTROCITOMA_IDH", "CEREBRO_MEDULOBLASTOMA",
        "FIGADO_HCC", "FIGADO_COLANGIOCARCINOMA",
        "SANGUE_LINFOMA_DLBCL", "SANGUE_LINFOMA_FOLICULAR",
        "SANGUE_LEUCEMIA_LINFOCITICA_CRONICA", "SANGUE_LEUCEMIA_MIELOIDE_AGLA",
        "OSSO_OSTEOSSARCOMA", "OSSO_CONDROSSARCOMA",
        "MEDULAR_MIELOMA_MULTIPL0", "MEDULAR_MDS",
        "GI_COLORRETAL_MSI_H", "GI_GASTRICO_HER2", "GI_ESOFAGO",
        "PELE_MELANOMA_BRAF", "PELE_MELANOMA_CUTANEO",
        "GU_RENAL_CELULAR", "GU_BEXIGA_UROTELIAL", "SANGUE_LEUCEMIA_AGLA_PROMIELOCITICA",
    ]

    faltantes = [s for s in subtipos_esperados if s not in subtipos_count]
    if faltantes:
        print(f"\n   ATENCAO Subtipos faltantes: {faltantes}")
    else:
        print(f"\n   >>> Todos os 38 subtipos cobertos! <<<")

    return {
        "total_casos": total,
        "subtipos_cobertos": len(subtipos_count),
        "subtipos_faltantes": faltantes,
    }


def iniciar_agendador():
    """Inicia o scheduler de aprendizagem continua."""
    print("\n[4/4] Iniciando Scheduler de Aprendizagem Continua...")
    from infrastructure.scheduler import iniciar_scheduler

    scheduler = iniciar_scheduler()

    intervalo = 240
    print(f"\n{'='*70}")
    print(f"  DIMHEX v4.0 EXECUTANDO COM COBERTURA EXPANDIDA")
    print(f"  38 subtipos tumorais | Protocolo: ciclo a cada {intervalo}min ({intervalo//60}h)")
    print(f"  Pressione Ctrl+C para encerrar")
    print(f"{'='*70}\n")

    return scheduler


if __name__ == "__main__":
    modo_povoa = "--povoa" in sys.argv

    print("=" * 70)
    print("  DIMHEX Repovoamento RAG v4.0 + Scheduler")
    print(f"  Timestamp: {datetime.datetime.now().isoformat()}")
    print("=" * 70)

    # Fase 1: Limpar
    limpar_colecoes()

    # Fase 2: Povoar
    resultado, duracao = executar_povoamento()

    # Fase 3: Validar
    validacao = validar_cobertura()

    # Salvar relatorio
    relatorio = {
        "timestamp": datetime.datetime.now().isoformat(),
        "versao": "4.0",
        "duracao_povoamento_segundos": round(duracao, 1),
        "resumo_colecoes": resultado["resumo_colecoes"],
        "validacao": validacao,
        "conhecimento_cientifico": resultado["conhecimento_cientifico"],
        "casos_clinicos": resultado["casos_clinicos"],
        "protocolos_terapeuticos": resultado["protocolos_terapeuticos"],
    }

    relatorio_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        f"relatorio_repovoamento_v4_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    )
    with open(relatorio_path, 'w', encoding='utf-8') as f:
        json.dump(relatorio, f, indent=2, ensure_ascii=False, default=str)

    print(f"\n  Relatorio salvo: {relatorio_path}")

    if modo_povoa:
        # Apenas povoar e validar, sem loop infinito
        print(f"\n{'='*70}")
        print(f"  POVOAMENTO CONCLUIDO (modo --povoa)")
        print(f"  Use 'python main.py' para iniciar com scheduler")
        print(f"{'='*70}")
    else:
        # Fase 4: Scheduler
        scheduler = iniciar_agendador()

        try:
            while True:
                time.sleep(60)
        except KeyboardInterrupt:
            print("\n  Encerrando DIMHEX...")
            scheduler.shutdown()
            print("  Sistema encerrado com sucesso.")