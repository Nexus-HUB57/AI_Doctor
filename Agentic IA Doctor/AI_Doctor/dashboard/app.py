import os
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
from core.agente import AgenteOncologicoPrecisao
from core.explicador import ExplicadorSHAPClinico
from infrastructure.audit import AuditorClinico
from mapeadores import MapeadorNCCNASCO
from config import CONFIG

st.set_page_config(page_title="AI Doctor - Tumor Board", layout="wide")

# ============================================================
#  SELECAO DE PAGINA
# ============================================================
pagina = st.sidebar.radio(
    "Modulo",
    ["Tumor Board", "DIMHEX - Inteligencia Medica"],
    index=0,
    format_func=lambda x: x if "DIMHEX" not in x else "DIMHEX - Inteligencia Medica"
)

# ============================================================
#  INICIALIZACAO DO AGENTE (compartilhado)
# ============================================================
if 'agente' not in st.session_state:
    with st.spinner("Inicializando motor clinico..."):
        caminho_hist = CONFIG.get("HISTORICO_PATH", "historico_treino.csv")
        df_hist = pd.read_csv(caminho_hist) if os.path.exists(caminho_hist) else pd.DataFrame()
        st.session_state.agente = AgenteOncologicoPrecisao(df_hist)
        st.session_state.historico_ctdna = []

if 'auditor' not in st.session_state:
    st.session_state.auditor = AuditorClinico()


# ============================================================
#  PAGINA 1: TUMOR BOARD (original)
# ============================================================
if pagina == "Tumor Board":
    st.title("AI Doctor - Painel Oncologico de Precisao")

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


# ============================================================
#  PAGINA 2: DIMHEX — DIGITAL MEDICAL HEALTH EXPLORER
# ============================================================
elif pagina == "DIMHEX - Inteligencia Medica":
    st.title("DIMHEX — Digital Medical Health Explorer")
    st.caption("Motor de Inteligencia Medica Continua | Ciclo automatico a cada 240 minutos")

    try:
        from core.dimhex import DIMHEX

        # Inicializar DIMHEX no session state
        if 'dimhex' not in st.session_state:
            with st.spinner("Inicializando DIMHEX..."):
                st.session_state.dimhex = DIMHEX()
                st.session_state.dimhex_ultimo_relatorio = None

        dimhex = st.session_state.dimhex

        # === BARRA DE STATUS ===
        status = dimhex.obter_status()

        col_status1, col_status2, col_status3, col_status4 = st.columns(4)
        col_status1.metric("Ciclo Atual", f"#{status['ciclo_atual']}")
        col_status2.metric("Base de Conhecimento", f"{status['base_conhecimento']['total_indexados']} docs")
        col_status3.metric("Insights Pendentes", status['insights_pendentes'])
        col_status4.metric("Taxa Aprovacao", f"{status['base_conhecimento']['taxa_aprovacao']:.1%}")

        st.divider()

        # === CONTROLES ===
        ctrl1, ctrl2 = st.columns([3, 1])

        with ctrl1:
            st.subheader("Controles DIMHEX")

            c1, c2, c3 = st.columns(3)
            with c1:
                if st.button("Executar Ciclo Agora", type="primary", use_container_width=True):
                    with st.spinner("Executando ciclo DIMHEX completo..."):
                        relatorio = dimhex.executar_ciclo_completo()
                        st.session_state.dimhex_ultimo_relatorio = relatorio
                        st.success(f"Ciclo #{relatorio['ciclo']} concluido em {relatorio['duracao_segundos']:.1f}s")
                        st.rerun()

            with c2:
                lookback = st.number_input("Lookback (dias)", min_value=1, max_value=365, value=30, key="dimhex_lookback")
                CONFIG["DIMHEX_LOOKBACK_DAYS"] = int(lookback)

            with c3:
                st.markdown(f"**Proximo ciclo:** {status['proximo_ciclo']} min")
                st.markdown(f"**Ultimo ciclo:** {status['ultimo_ciclo'] or 'Ainda nao executado'}")
                st.markdown(f"**Fontes ativas:** {', '.join(status['fontes_ativas'])}")

        with ctrl2:
            st.subheader("Acoes")
            if st.button("Buscar Evidencia", use_container_width=True):
                st.session_state.show_evidencia = True
            if st.button("Ver Insights", use_container_width=True):
                st.session_state.show_insights = True

        st.divider()

        # === PAINEL DE RESULTADOS DO ULTIMO CICLO ===
        relatorio = st.session_state.dimhex_ultimo_relatorio or dimhex.obter_ultimo_relatorio()

        if relatorio:
            st.subheader(f"Relatorio do Ciclo #{relatorio.get('ciclo', '?')}")

            # Coleta
            coleta = relatorio.get("coleta", {})
            avaliacao = relatorio.get("avaliacao", {})
            integracao = relatorio.get("integracao", {})

            rc1, rc2, rc3 = st.columns(3)
            rc1.metric("Achados Coletados", coleta.get("total_achados", 0))
            rc2.metric("Relevantes", f"{avaliacao.get('total_relevantes', 0)} ({avaliacao.get('taxa_relevancia', 0):.1%})")
            rc3.metric("Indexados", integracao.get("total_indexados", 0))

            # Grafico de distribuicao por fonte
            por_fonte = coleta.get("por_fonte", {})
            if por_fonte:
                fig_fonte = px.bar(
                    x=list(por_fonte.keys()),
                    y=list(por_fonte.values()),
                    title="Achados por Fonte de Pesquisa",
                    color=list(por_fonte.values()),
                    color_continuous_scale="Blues",
                    labels={"x": "Fonte", "y": "Quantidade"}
                )
                st.plotly_chart(fig_fonte, use_container_width=True)

            # Grafico de distribuicao de relevancia
            dist = avaliacao.get("distribuicao", {})
            if dist:
                ordem = ["critico", "alto", "moderado", "baixo", "irrelevante"]
                cores_mapa = {"critico": "#DC2626", "alto": "#EA580C", "moderado": "#CA8A04", "baixo": "#65A30D", "irrelevante": "#6B7280"}
                labels = [k.capitalize() for k in ordem if k in dist]
                valores = [dist[k] for k in ordem if k in dist]
                cores = [cores_mapa[k] for k in ordem if k in dist]

                fig_dist = go.Figure(data=[
                    go.Pie(labels=labels, values=valores, marker_colors=cores, hole=0.4,
                           textinfo="label+percent+value")
                ])
                fig_dist.update_layout(title="Distribuicao de Relevancia Clinica")
                st.plotly_chart(fig_dist, use_container_width=True)

            # Achados criticos
            achados_criticos = relatorio.get("achados_criticos", [])
            if achados_criticos:
                st.subheader(f"Achados Criticos ({len(achados_criticos)})")
                for ac in achados_criticos[:5]:
                    with st.expander(f"[{ac.get('_classificacao', '').upper()}] {ac.get('titulo', 'Sem titulo')[:120]}"):
                        st.markdown(f"**Fonte:** {ac.get('fonte', '')} | **Tipo:** {ac.get('tipo', '')}")
                        st.markdown(f"**Data:** {ac.get('data_publicacao', 'N/A')}")
                        st.markdown(f"**Score:** {ac.get('_score_dimhex', 0):.4f}")
                        if ac.get('url'):
                            st.markdown(f"[Acesso Original]({ac.get('url')})")
                        st.markdown(f"**Resumo:** {ac.get('resumo', 'N/A')[:500]}")
                        if ac.get('_justificativas'):
                            for j in ac['_justificativas']:
                                st.markdown(f"- {j}")
                        if ac.get('_biomarcadores'):
                            st.markdown(f"**Biomarcadores:** {', '.join(ac['_biomarcadores'])}")

            # Insights de acao
            insights = relatorio.get("insights", [])
            if insights:
                st.subheader(f"Insights para Acao ({len(insights)})")
                for insight in insights[:8]:
                    sev = insight.get("severidade", "moderada")
                    icon = {"critica": "[CRITICO]", "alta": "[ALTO]", "moderada": "[MODERADO]"}.get(sev, "[INFO]")
                    with st.expander(f"{icon} {insight.get('recomendacao', '')[:150]}"):
                        st.json(insight)
        else:
            st.info("Nenhum ciclo executado ainda. Clique em 'Executar Ciclo Agora' para iniciar.")

        st.divider()

        # === MODAL: BUSCAR EVIDENCIA ===
        if st.session_state.get("show_evidencia"):
            st.subheader("Buscar Evidencia para Contexto Clinico")
            query = st.text_area(
                "Descreva o contexto clinico (ex: paciente com ctDNA alto e resistencia a imunoterapia)",
                height=100
            )
            if st.button("Buscar", key="btn_buscar_evidencia"):
                if query.strip():
                    resultados = dimhex.buscar_evidencia_para_decisao(query, top_k=5)
                    if resultados:
                        for i, r in enumerate(resultados, 1):
                            st.markdown(f"**{i}.** {r.get('titulo', 'N/A')}")
                            st.markdown(f"   Score: {r.get('score_dimhex', 'N/A')} | Fonte: {r.get('fonte', 'N/A')}")
                            if r.get('url'):
                                st.markdown(f"   [Link]({r.get('url')})")
                    else:
                        st.warning("Nenhum resultado encontrado. A base de conhecimento pode estar vazia.")
                else:
                    st.warning("Insira um contexto clinico para buscar evidencia.")
            if st.button("Fechar", key="btn_fechar_evidencia"):
                st.session_state.pop("show_evidencia", None)
                st.rerun()

        # === MODAL: INSIGHTS ACUMULADOS ===
        if st.session_state.get("show_insights"):
            st.subheader("Insights Acumulados DIMHEX")
            insights_criticos = dimhex.obter_insights_criticos(ultimos_n=20)
            if insights_criticos:
                for insight in insights_criticos:
                    sev = insight.get("severidade", "moderada")
                    icon = {"critica": "[CRITICO]", "alta": "[ALTO]", "moderada": "[MODERADO]"}.get(sev, "[INFO]")
                    st.markdown(f"**{icon}** (Ciclo {insight.get('ciclo_origem', '?')}) — {insight.get('recomendacao', '')}")
            else:
                st.info("Nenhum insight acumulado ainda.")
            if st.button("Fechar", key="btn_fechar_insights"):
                st.session_state.pop("show_insights", None)
                st.rerun()

    except ImportError as e:
        st.error(f"Modulo DIMHEX nao disponivel: {e}")
        st.info("Verifique se todos os modulos DIMHEX estao instalados corretamente.")