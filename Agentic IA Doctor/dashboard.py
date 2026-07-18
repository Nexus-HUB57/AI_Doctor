import streamlit as st
import pandas as pd
import numpy as np
from model_engine import AgenteOncologicoPrecisao
from data_connectors import TCGAConnectorReal
from shap_xai import ExplicadorSHAPReal
from audit import AuditorClinico
from mapeadores import MapeadorNCCNASCO

st.set_page_config(layout="wide", page_title="AI Doctor Clinical Hub")
st.title("🧬 AI Doctor - Tumor Board Dashboard")

if 'agente' not in st.session_state:
    df_init = TCGAConnectorReal().baixar_dados_clinicos(limit=50)
    st.session_state.agente = AgenteOncologicoPrecisao(df_init)
    st.session_state.xai = ExplicadorSHAPReal()
    st.session_state.xai.recalibrar_surrogate(df_init)
    st.session_state.auditor = AuditorClinico()
    st.session_state.historico_ctdna = [0.4, 0.45, 0.52]

uploaded = st.file_uploader("Upload de Nova Biópsia Líquida (CSV)", type="csv")
if uploaded:
    df_row = pd.read_csv(uploaded)
    paciente = df_row.iloc[0].to_dict()
    
    conduta = st.session_state.agente.executar_ciclo(paciente)
    st.session_state.historico_ctdna.append(paciente.get('ctDNA', 0.5))
    
    # Orquestração do Pipeline XAI Real
    vetor_instancia = np.array([paciente['ctDNA'], paciente['CTC'], paciente['TMB'], paciente['PD_L1'], paciente['TILs'], paciente['ECOG']])
    pesos_shap = st.session_state.xai.explicar_instancia(vetor_instancia)
    esquema = MapeadorNCCNASCO.selecionar_esquema("NSCLC_KRAS_G12C", st.session_state.agente.linha_terapeutica)
    
    st.session_state.auditor.registrar_evento(
        paciente.get('patient_id', 'EHR-UNK'), conduta, st.session_state.agente.dose_atual,
        st.session_state.agente.fisiologia.ecog, st.session_state.agente.estado_atual, pesos_shap
    )
    
    col_g, col_m = st.columns([2, 1])
    with col_g:
        st.line_chart(st.session_state.historico_ctdna)
    with col_m:
        st.metric("Conduta Proposta", conduta)
        st.metric("Dosagem Calculada", f"{st.session_state.agente.dose_atual:.2f} mg")
        st.write(f"**Esquema NCCN:** {esquema['esquema']}")
        
    st.subheader("Atribuição de Causalidade (SHAP)")
    st.write(pesos_shap)
