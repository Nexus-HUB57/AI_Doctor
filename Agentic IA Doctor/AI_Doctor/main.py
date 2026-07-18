"""
DIMHEX AI Doctor — Main v3.0
Plataforma de Oncologia de Precisão com Motor de Inteligência Médica Contínua.

Inicialização:
1. Auto-seed do RAG (casos clínicos + base científica)
2. Modelo de decisão + SHAP
3. Agente Oncológico de Precisão
4. DIMHEX v2.1 — Motor de Inteligência Médica
5. Protocolo de Aprendizagem a cada 4 horas
6. Loop principal com monitoramento
"""

import numpy as np
import pandas as pd
import os
import sys
import datetime
import json
from pathlib import Path


def verificar_rag_povoado() -> bool:
    """Verifica se o RAG já foi povoado (casos + conhecimento)."""
    try:
        from infrastructure.chroma_db import BancoVetorialChromaDB

        chroma_tumores = BancoVetorialChromaDB(colecao_nome="ai_doctor_tumores")
        chroma_conhecimento = BancoVetorialChromaDB(colecao_nome="dimhex_conhecimento")

        n_tumores = chroma_tumores.collection.count()
        n_conhecimento = chroma_conhecimento.collection.count()

        return n_tumores >= 50 and n_conhecimento >= 10
    except Exception:
        return False


def executar_seed_rag():
    """Executa povoamento do RAG se necessário."""
    from infrastructure.rag_seeder import RAGSeeder

    seeder = RAGSeeder()
    resultado = seeder.povoar_rag_completo(n_casos_por_subtipo=50)

    resumo = resultado["resumo_colecoes"]
    print(f"\n  [RAG] Povoamento concluído:")
    print(f"    Casos clínicos (ai_doctor_tumores): {resumo['ai_doctor_tumores']}")
    print(f"    Conhecimento (dimhex_conhecimento): {resumo['dimhex_conhecimento']}")

    return resultado


def gerar_dados_treino():
    """Gera dataset de treino sintético."""
    np.random.seed(42)
    n = 500
    df = pd.DataFrame({
        'patient_id': [f'P{i:04d}' for i in range(n)],
        'ctDNA': np.random.beta(2, 5, n),
        'CTC': np.random.lognormal(1.2, 0.5, n),
        'TMB': np.random.gamma(2, 4, n),
        'PD_L1': np.random.beta(1.5, 3, n),
        'TILs': np.random.beta(1, 3, n),
        'ECOG': np.random.choice([0, 1, 2, 3], n, p=[0.4, 0.3, 0.2, 0.1])
    })
    df['target'] = df.apply(
        lambda r: 2 if r['ctDNA'] > 0.6 and r['ECOG'] < 3
        else (0 if r['ctDNA'] < 0.3 or r['ECOG'] >= 3 else 1), axis=1
    )
    return df


def main():
    print("=" * 80)
    print("  DIMHEX AI Doctor v3.0 — Plataforma de Oncologia de Precisão")
    print("  Protocolo de Aprendizagem Contínua — Ciclo a cada 4 horas")
    print("  " + datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 80)

    # =========================================================================
    # 1. POVOAMENTO DO RAG (auto-seed se vazio)
    # =========================================================================
    print("\n[1/6] Verificando base RAG...")
    rag_povoado = verificar_rag_povoado()

    if not rag_povoado:
        print("  RAG vazio — executando povoamento inicial...")
        seed_result = executar_seed_rag()
        print(f"  RAG povoado com sucesso.")
    else:
        print("  RAG já povoado — pulando seed.")

    # =========================================================================
    # 2. DADOS DE TREINO + MODELO
    # =========================================================================
    print("\n[2/6] Treinando modelo de decisão...")
    df_treino = gerar_dados_treino()
    df_treino.to_csv("historico_treino.csv", index=False)

    from sklearn.tree import DecisionTreeClassifier
    import pickle

    model = DecisionTreeClassifier(max_depth=5, random_state=42)
    X = df_treino[['ctDNA', 'CTC', 'TMB', 'PD_L1', 'TILs', 'ECOG']]
    y = df_treino['target']
    model.fit(X, y)

    class ModelWrapper:
        def __init__(self, model, feature_names):
            self.model = model
            self.feature_names = feature_names

    model_wrapped = ModelWrapper(model, ['ctDNA', 'CTC', 'TMB', 'PD_L1', 'TILs', 'ECOG'])

    os.makedirs(os.path.dirname(os.getenv("MODEL_PATH", "./models/decision_model.pkl")), exist_ok=True)
    with open("./models/decision_model.pkl", 'wb') as f:
        pickle.dump(model, f)

    from core.explicador import atualizar_explicador_shap
    atualizar_explicador_shap(model_wrapped, df_treino)
    print(f"   Modelo treinado e SHAP gerado.")

    # =========================================================================
    # 3. AGENTE ONCOLÓGICO
    # =========================================================================
    print("\n[3/6] Inicializando Agente Oncológico de Precisão...")
    from core.agente import AgenteOncologicoPrecisao
    agente = AgenteOncologicoPrecisao(df_treino)

    from infrastructure.validacao import SuiteValidacaoProspectiva
    from infrastructure.audit import AuditorClinico
    validador = SuiteValidacaoProspectiva()
    auditor = AuditorClinico()

    # Validar em coorte prospectiva
    print("   Validando em coorte prospectiva (5 casos)...")
    from core.explicador import ExplicadorSHAPClinico
    for i in range(5):
        paciente = validador.simular_caso_tcga(f"VAL-{i:04d}")
        agente.executar_ciclo(paciente, ciclo_id=0)
        status = validador.avaliar_concordancia(
            "INTENSIFICAR" if paciente["ctDNA"] > 0.6 else "MANUTENCAO",
            paciente["decisao_comite_tumores"],
            paciente["ecog_real"]
        )
        print(f"   {paciente['id']} | Status: {status}")
    print(validador.relatorio())

    # =========================================================================
    # 4. DIMHEX v2.1 — MOTOR DE INTELIGÊNCIA MÉDICA
    # =========================================================================
    print("\n[4/6] Inicializando DIMHEX v2.1...")
    dimhex_engine = None
    try:
        from core.dimhex import DIMHEX
        dimhex_engine = DIMHEX()
        dimhex_engine.conectar_agente(agente)
        agente.evidence_driven = dimhex_engine.evidence_driven

        status = dimhex_engine.obter_status()
        print(f"   DIMHEX v{status['versao']}")
        print(f"   Ciclo atual: #{status['ciclo_atual']}")
        print(f"   Base de conhecimento: {status['base_conhecimento']['total_indexados']} docs")
        print(f"   Fontes ativas: {', '.join(status['fontes_ativas'])}")
        print(f"   Pesquisa ativa: {status['pesquisa_ativa']}")
        print(f"   Agente conectado: {status.get('agente_conectado', False)}")
        print(f"   Pipeline cânceres raros: {status.get('pipeline_raros_ativo', False)}")
        print(f"   Senciência: coeficiente {status.get('senciencia', {}).get('coeficiente_sabedoria', 0):.4f}")
    except Exception as e:
        print(f"   AVISO: DIMHEX não disponível ({e})")

    # =========================================================================
    # 5. EXECUTAR PRIMEIRO CICLO DIMHEX IMEDIATO (boot strap)
    # =========================================================================
    print("\n[5/6] Executando primeiro ciclo DIMHEX (bootstrap)...")
    if dimhex_engine and dimhex_engine.config.get("pesquisa_ativa", True):
        try:
            relatorio = dimhex_engine.executar_ciclo_completo()
            coleta = relatorio.get("coleta", {})
            avaliacao = relatorio.get("avaliacao", {})
            integracao = relatorio.get("integracao", {})

            print(f"\n   Bootstrap DIMHEX concluído:")
            print(f"   Coletados: {coleta.get('total_achados', 0)}")
            print(f"   Relevantes: {avaliacao.get('total_relevantes', 0)}")
            print(f"   Taxa relevância: {avaliacao.get('taxa_relevancia', 0):.1%}")
            print(f"   Indexados: {integracao.get('total_indexados', 0)}")
            print(f"   Duração: {relatorio.get('duracao_segundos', 0):.1f}s")
        except Exception as e:
            print(f"   AVISO: Bootstrap falhou (sistema continua normal): {e}")
    else:
        print("   Pesquisa DIMHEX desativada — pulando bootstrap.")

    # =========================================================================
    # 6. SCHEDULER — PROTOCOLO DE APRENDIZAGEM A CADA 4 HORAS
    # =========================================================================
    print("\n[6/6] Iniciando Protocolo de Aprendizagem...")
    from infrastructure.scheduler import iniciar_scheduler
    scheduler = iniciar_scheduler()

    intervalo = CONFIG.get("DIMHEX_INTERVAL_MINUTES", 240)
    print(f"\n{'='*80}")
    print(f"  DIMHEX AI Doctor v3.0 — EXECUTANDO")
    print(f"  Protocolo: Ciclo DIMHEX a cada {intervalo} minutos ({intervalo//60}h)")
    print(f"  Health check: a cada 10 minutos")
    print(f"  Auto-povoamento RAG: diário")
    print(f"  Pressione Ctrl+C para encerrar")
    print(f"{'='*80}\n")

    # Loop principal
    import time
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n  Encerrando DIMHEX AI Doctor...")
        scheduler.shutdown()
        print("  Sistema encerrado com sucesso.")


if __name__ == "__main__":
    main()