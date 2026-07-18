import os
import streamlit as st
import pandas as pd
import plotly.express as px
from core.agente import AgenteOncologicoPrecisao
from core.explicador import ExplicadorSHAPClinico
from infrastructure.audit import AuditorClinico
from mapeadores import MapeadorNCCNASCO
from config import CONFIG

st.set_page_config(page_title="AI Doctor - Tumor Board", layout="wide")
st.title("AI Doctor - Painel Oncologico de Precisao")

if 'agente' not in st.session_state:
    with st.spinner("Inicializando motor clinico..."):
        caminho_hist = CONFIG.get("HISTORICO_PATH", "historico_treino.csv")
        df_hist = pd.read_csv(caminho_hist) if os.path.exists(caminho_hist) else pd.DataFrame()
        st.session_state.agente = AgenteOncologicoPrecisao(df_hist)
        st.session_state.historico_ctdna = []

if 'auditor' not in st.session_state:
    st.session_state.auditor = AuditorClinico()

st.sidebar.header("Controle do Protocolo")
modo = st.sidebar.selectbox("Modo Terapeutico", ["ERADICAR", "CONTER"])
st.session_state.agente.paradigma.modo_terapia = modo

uploaded = st.file_uploader("Carregar nova medicao (CSV)", type="csv")
if uploaded:
    df = pd.read_csv(uploaded)
    nova = df.iloc[0].to_dict()
    acao_executada = st.session_state.agente.executar_ciclo(nova, ciclo_id=len(st.session_state.historico_ctdna))
    st.session_state.historico_ctdna.append(nova.get('ctDNA', 0.5))

    st.plotly_chart(px.line(pd.DataFrame({
        "Ciclo": range(len(st.session_state.historico_ctdna)),
        "ctDNA": st.session_state.historico_ctdna
    }), x="Ciclo", y="ctDNA", title="Evolucao do ctDNA"), use_container_width=True)

    col1, col2, col3 = st.columns(3)
    col1.metric("Dose", f"{st.session_state.agente.dose_atual:.2f}")
    col2.metric("ECOG", st.session_state.agente.fisiologia.ecog)
    col3.metric("Eficacia", f"{st.session_state.agente.clonal.eficacia_relativa():.2%}")

    if st.button("Gerar Relatorio XAI"):
        acao = st.session_state.agente.estado_atual or 'OBSERVAR'
        shap_vals = ExplicadorSHAPClinico.calcular_valores_shap(
            biomarcadores={"ctDNA": nova.get('ctDNA', 0.5), "TMB": nova.get('TMB', 8), "PD_L1": nova.get('PD_L1', 0.2)},
            fracao_resistentes=st.session_state.agente.clonal.fracao_resistentes,
            ecog=st.session_state.agente.fisiologia.ecog,
            acao=acao
        )
        esquema_nccn = MapeadorNCCNASCO.selecionar_esquema("NSCLC_KRAS_G12C", st.session_state.agente.linha_terapeutica + 1)
        relatorio = ExplicadorSHAPClinico.formatar_relatorio_xai(
            acao=acao,
            esquema_nccn=esquema_nccn,
            shap_values=shap_vals,
            ecog=st.session_state.agente.fisiologia.ecog
        )
        st.code(relatorio, language="text")

        st.session_state.auditor.registrar_evento(
            patient_id="DASHBOARD",
            acao=acao,
            dose=st.session_state.agente.dose_atual,
            linha=st.session_state.agente.linha_terapeutica,
            ecog=st.session_state.agente.fisiologia.ecog,
            eficacia=st.session_state.agente.clonal.eficacia_relativa(),
            estado=st.session_state.agente.estado_atual,
            relatorio_xai=relatorio,
            shap_contrib=shap_vals
        )
        st.success("Auditado no PostgreSQL com sucesso!")