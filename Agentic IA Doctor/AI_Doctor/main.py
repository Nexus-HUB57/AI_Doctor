import numpy as np
import pandas as pd
import os
import datetime
from core.agente import AgenteOncologicoPrecisao
from core.explicador import ExplicadorSHAPClinico, atualizar_explicador_shap
from core.genoma import ParadigmaTerapeuticoAvancado
from infrastructure.audit import AuditorClinico
from infrastructure.validacao import SuiteValidacaoProspectiva
from infrastructure.scheduler import iniciar_scheduler
from infrastructure.chroma_db import BancoVetorialChromaDB
from config import CONFIG

def gerar_dados_treino():
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
    df['target'] = df.apply(lambda r: 2 if r['ctDNA'] > 0.6 and r['ECOG'] < 3 else (0 if r['ctDNA'] < 0.3 or r['ECOG'] >= 3 else 1), axis=1)
    return df

def main():
    print("=" * 80)
    print("🧬 AI Doctor – Plataforma de Oncologia de Precisão (Produção)")
    print("=" * 80)

    # 1. Dados de treino
    df_treino = gerar_dados_treino()
    df_treino.to_csv("historico_treino.csv", index=False)

    # 2. Indexar ChromaDB
    print("[1] Indexando ChromaDB...")
    chroma = BancoVetorialChromaDB()
    for _, row in df_treino.head(100).iterrows():
        vetor = np.array([row['ctDNA'], np.log1p(row['CTC'])/10.0, row['TMB']/50.0, row['PD_L1'], row['TILs']])
        chroma.indexar_caso_clinico(row['patient_id'], vetor, {"ECOG": row['ECOG'], "ctDNA": row['ctDNA']})
    print(f"   ✅ {chroma.collection.count()} vetores indexados.")

    # 3. Modelo de decisão (simples)
    print("[2] Treinando modelo de decisão...")
    from sklearn.tree import DecisionTreeClassifier
    model = DecisionTreeClassifier(max_depth=5, random_state=42)
    X = df_treino[['ctDNA', 'CTC', 'TMB', 'PD_L1', 'TILs', 'ECOG']]
    y = df_treino['target']
    model.fit(X, y)
    class ModelWrapper:
        def __init__(self, model, feature_names):
            self.model = model
            self.feature_names = feature_names
    model_wrapped = ModelWrapper(model, ['ctDNA', 'CTC', 'TMB', 'PD_L1', 'TILs', 'ECOG'])
    os.makedirs(os.path.dirname(CONFIG["MODEL_PATH"]), exist_ok=True)
    import pickle
    with open(CONFIG["MODEL_PATH"], 'wb') as f:
        pickle.dump(model, f)
    atualizar_explicador_shap(model_wrapped, df_treino)
    print("   ✅ Modelo e SHAP gerados.")

    # 4. Agente
    agente = AgenteOncologicoPrecisao(df_treino)

    # 5. Validador e Auditor
    validador = SuiteValidacaoProspectiva()
    auditor = AuditorClinico()

    # 6. Simular coorte de validação
    print("[3] Validando em coorte prospectiva...")
    coorte = [validador.simular_caso_tcga(f"VAL-{i:04d}") for i in range(5)]
    for paciente in coorte:
        agente.executar_ciclo(paciente, ciclo_id=0)
        if paciente["ctDNA"] > 0.6:
            acao = "TROCAR_LINHA" if paciente["ecog_real"] < 3 else "REDUZIR"
        else:
            acao = "INTENSIFICAR_MODERADO" if paciente["ecog_real"] <= 2 else "OBSERVAR"
        status = validador.avaliar_concordancia(acao, paciente["decisao_comite_tumores"], paciente["ecog_real"])
        shap_vals = ExplicadorSHAPClinico.calcular_valores_shap(
            {"ctDNA": paciente["ctDNA"], "TMB": paciente["TMB"], "PD_L1": paciente["PD_L1"]},
            0.25, paciente["ecog_real"], acao
        )
        relatorio = ExplicadorSHAPClinico.formatar_relatorio_xai(
            acao, {"esquema": "Docetaxel + Ramucirumabe", "classe": "Antiangiogênico"},
            shap_vals, paciente["ecog_real"]
        )
        auditor.registrar_evento(
            patient_id=paciente["id"],
            acao=acao,
            dose=agente.dose_atual,
            linha=agente.linha_terapeutica,
            ecog=paciente["ecog_real"],
            eficacia=agente.clonal.eficacia_relativa(),
            estado=agente.estado_atual,
            relatorio_xai=relatorio,
            shap_contrib=shap_vals
        )
        print(f"👤 {paciente['id']} | Ação: {acao} | Status: {status}")

    print(validador.relatorio())

    # 7. DIMHEX — Primeiro ciclo de pesquisa medica
    print("[4] Inicializando DIMHEX — Digital Medical Health Explorer...")
    try:
        from core.dimhex import DIMHEX
        dimhex_engine = DIMHEX()
        dimhex_status = dimhex_engine.obter_status()
        print(f"   DIMHEX v{dimhex_status['versao']} | Ciclo: #{dimhex_status['ciclo_atual']}")
        print(f"   Base de conhecimento: {dimhex_status['base_conhecimento']['total_indexados']} documentos")
        print(f"   Pesquisa ativa: {dimhex_status['pesquisa_ativa']}")
        print(f"   Fontes: {', '.join(dimhex_status['fontes_ativas'])}")
    except Exception as e:
        print(f"   Aviso: DIMHEX nao disponivel ({e})")
        dimhex_engine = None

    # 8. Scheduler (inclui DIMHEX a cada 240 min)
    print("[5] Iniciando scheduler (Aprendizado + DIMHEX)...")
    scheduler = iniciar_scheduler()
    print(f"   Aprendizado continuo: {CONFIG['SCHEDULE_INTERVAL_HOURS']}h")
    print(f"   DIMHEX pesquisa: {CONFIG['DIMHEX_INTERVAL_MINUTES']}min")

    print("=" * 80)
    print("  AI Doctor + DIMHEX em execucao. Pressione Ctrl+C para encerrar.")
    print("=" * 80)

    # Mantém o script vivo
    try:
        while True:
            import time
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n⏹️ Encerrando...")
        scheduler.shutdown()

if __name__ == "__main__":
    main()
