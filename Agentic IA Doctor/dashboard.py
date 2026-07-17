# dashboard.py
import streamlit as st
import pandas as pd
import plotly.express as px
from agente import AgenteOncologicoPrecisao  # importe seu agente

st.set_page_config(page_title="AI Doctor", layout="wide")
st.title("🧬 AI Doctor – Oncology Precision Agent")

# Inicializar o agente (usar session_state para persistência)
if 'agente' not in st.session_state:
    # Carregar dados históricos e instanciar
    df_hist = ClinicalDataLoader.carregar_dados('tcga', cancer_type='LUAD', limit=500)
    st.session_state.agente = AgenteOncologicoPrecisao(df_hist, usar_chroma=True)

# Sidebar para parâmetros
st.sidebar.header("Configurações")
modo = st.sidebar.selectbox("Modo Terapêutico", ["ERADICAR", "CONTER"])
st.session_state.agente.paradigma.modo_terapia = modo

# Upload de novo exame
uploaded_file = st.file_uploader("Carregar novo exame (CSV)", type="csv")
if uploaded_file:
    nova_medicao = pd.read_csv(uploaded_file).iloc[0].to_dict()
    st.session_state.agente.executar_ciclo(nova_medicao, ciclo_id=len(st.session_state.agente.historico_reserva))

    # Exibir evolução
    df_evolucao = pd.DataFrame({
        'Tempo': range(len(st.session_state.agente.historico_reserva)),
        'ctDNA': st.session_state.agente.df_historico['ctDNA'].tail(len(st.session_state.agente.historico_reserva))
    })
    fig = px.line(df_evolucao, x='Tempo', y='ctDNA', title='Evolução do ctDNA')
    st.plotly_chart(fig, use_container_width=True)

# Exibir decisão atual
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Dose Atual", f"{st.session_state.agente.dose_atual:.2f}")
with col2:
    st.metric("ECOG", st.session_state.agente.fisiologia.ecog)
with col3:
    st.metric("Eficácia", f"{st.session_state.agente.clonal.eficacia_relativa():.2f}")

# Explicação
if st.button("Gerar Relatório XAI"):
    relatorio = st.session_state.agente.explicador.gerar_relatorio(
        {}, st.session_state.agente.estado_atual, 0.8, {}, {}
    )
    st.code(relatorio, language='text')
