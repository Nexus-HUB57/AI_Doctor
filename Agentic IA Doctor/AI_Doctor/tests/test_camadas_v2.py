"""
Testes automatizados para as 4 Camadas Probabilisticas DIMHEX v2.0
"""
import sys, os, numpy as np
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PASSOS = 0
FALHAS = 0

def teste(nome, condicao, detalhe=""):
    global PASSOS, FALHAS
    if condicao:
        PASSOS += 1
        print(f"  PASS {nome}")
    else:
        FALHAS += 1
        print(f"  FAIL {nome} -- {detalhe}")

def testar_camada_1():
    print("\n=== CAMADA 1: Motor de Probabilidade ===")
    from core.motor_probabilidade import ProbabilidadeTerapeutica
    motor = ProbabilidadeTerapeutica()

    resp = motor.calcular_prob_resposta(
        subtipo="NSCLC_KRAS_G12C", linha=1,
        biomarcadores={"ctDNA": 0.3, "CTC": 5, "TMB": 12, "PD_L1": 0.6, "TILs": 0.3},
        reserva_fisiologica=0.85, ecog=1,
    )
    teste("P(resposta) em [0.01, 0.95]", 0.01 <= resp["probabilidade_resposta"] <= 0.95, f"val={resp['probabilidade_resposta']}")
    teste("IC95_inf < P(resp)", resp["ic95_inferior"] <= resp["probabilidade_resposta"])
    teste("IC95_sup > P(resp)", resp["ic95_superior"] >= resp["probabilidade_resposta"])
    teste("Referencia preenchida", len(resp["referencia_principal"]) > 10)

    cura_h = motor.calcular_prob_cura(0.50, {"ctDNA": 0.1, "TILs": 0.8, "TMB": 18.0}, 0.9, 20)
    cura_l = motor.calcular_prob_cura(0.15, {"ctDNA": 0.9, "TILs": 0.05, "TMB": 2.0}, 0.2, 3)
    teste("P(cura) alto > baixo", cura_h["probabilidade_cura"] > cura_l["probabilidade_cura"])
    teste("Decomposicao cura", "profundidade_resposta" in cura_h["decomposicao"])

    tox = motor.calcular_prob_toxicidade("Imunoterapia + Platina", 0.5, 0.7, 1)
    teste("P(tox) em [0.05, 0.90]", 0.05 <= tox["probabilidade_toxicidade_grave"] <= 0.90)

    comp = motor.calcular_completo(
        subtipo="TRIPLO_NEGATIVO_MAMARIO", linha=2,
        biomarcadores={"ctDNA": 0.4, "CTC": 8, "TMB": 10, "PD_L1": 0.3, "TILs": 0.15},
        dose_atual=0.4, reserva_fisiologica=0.6, ecog=1,
        eficacia_clonal=0.7, ciclo=10,
    )
    teste("Quadro completo P(resp)", "probabilidade_resposta" in comp["resposta"])
    teste("Quadro completo P(cura)", "probabilidade_cura" in comp["cura"])
    teste("Indice terapeutico > 0", comp["indice_terapeutico"] > 0)

    motor.adicionar_evidencia("NSCLC_KRAS_G12C", 1, 0.80, 0.9, 1.3, "pubmed", "Estudo fase 3 ORR 55%")
    post = motor.obter_posterior("NSCLC_KRAS_G12C", 1)
    teste("Posterior atualizada", post is not None)

    resumo = motor.obter_resumo()
    teste("Motor v2.0.0", resumo["versao"] == "2.0.0")

def testar_camada_2():
    print("\n=== CAMADA 2: Evidence-Driven ===")
    from core.motor_probabilidade import ProbabilidadeTerapeutica
    from core.evidence_driven import EvidenceDrivenTherapy
    motor = ProbabilidadeTerapeutica()
    edt = EvidenceDrivenTherapy(motor)

    achados = [
        {"id_dimhex": "t1", "titulo": "Sotorasib ORR 37% phase 2 KRAS G12C NSCLC",
         "resumo": "CodeBreaK 200: ORR 37.1%, PFS 6.8 months",
         "texto": "phase 2 randomized KRAS G12C sotorasib objective response rate ORR: 37.1% median PFS: 6.8 months HR: 0.65 p < 0.001",
         "_fonte_original": "pubmed"},
        {"id_dimhex": "t3", "titulo": "Irrelevant diet study", "resumo": "Diet no impact",
         "texto": "diet nutrition food", "_fonte_original": "pubmed"},
    ]
    scores = {"t1": {"score_total": 0.78}, "t3": {"score_total": 0.10}}

    res = edt.processar_achados_dimhex(achados, scores)
    teste("Achados processados", res["achados_relevantes_processados"] >= 0)
    teste("Estrutura resultado", "total_acumulado" in res)

    impacto = edt.obter_impacto_evidencia("NSCLC_KRAS_G12C", 1)
    teste("Impacto contem tendencia", "tendencia_evidencia" in impacto)

def testar_camada_3():
    print("\n=== CAMADA 3: Otimizador Multi-Objetivo ===")
    from core.otimizador_multiobjetivo import OtimizadorMultiObjetivo
    otim = OtimizadorMultiObjetivo()

    class MF:
        ecog = 1; reserva_renal = 0.8; reserva_hepatica = 0.75; reserva_hematologica = 0.85
    class MP:
        exposicao_maxima = 0.8; toxicidade_da_droga = 0.15

    probs = {"cura": {"probabilidade_cura": 0.18}, "toxicidade": {"probabilidade_toxicidade_grave": 0.28}, "resposta": {"probabilidade_resposta": 0.42}}
    r = otim.otimizar_acao(probs, MF(), MP(), 0.3, 0, 0.75, 10)
    teste("Acao valida", r["acao_otima"] in ("INTENSIFICAR","INTENSIFICAR_MODERADO","MANTER_DOSE","REDUZIR","OBSERVAR","TROCAR_LINHA"))
    teste("U > 0", r["utilidade_total"] > 0)
    teste("Constraints", "constraints" in r)
    teste("Justificativa", len(r.get("justificativa","")) > 20)

    class MFD:
        ecog = 3; reserva_renal = 0.4; reserva_hepatica = 0.35; reserva_hematologica = 0.3
    rd = otim.otimizar_acao({"cura":{"probabilidade_cura":0.05},"toxicidade":{"probabilidade_toxicidade_grave":0.60},"resposta":{"probabilidade_resposta":0.12}}, MFD(), MP(), 0.6, 2, 0.15, 25)
    teste("ECOG 3 -> conservador", rd["acao_otima"] in ("REDUZIR","OBSERVAR"), f"acao={rd['acao_otima']}")

    teste("Otimizador v2.0.0", otim.obter_resumo()["versao"] == "2.0.0")

def testar_camada_4():
    print("\n=== CAMADA 4: CVM ===")
    from core.clinical_validation import ClinicalValidationModule
    cvm = ClinicalValidationModule()

    val = cvm.validar_decisao("INTENSIFICAR", "NSCLC KRAS G12C ctDNA=0.3 treg tbfet ifn-gamma",
        probabilidades={"resposta":{"probabilidade_resposta":0.45},"cura":{"probabilidade_cura":0.15}},
        subtipo="NSCLC_KRAS_G12C", linha=1)
    teste("Indice >= 0", val["indice_evidencia"] >= 0)
    teste("Classificacao valida", val["classificacao"] in ("FORTEMENTE_SUPORTADA","SUPORTADA","EXPERIMENTAL","INSUFICIENTE"))
    teste("Semaforo", val["cor_semaforo"] in ("verde","amarelo","laranja","vermelho"))
    teste("Trilha auditoria", len(val.get("trilha_auditoria",[])) >= 2)
    teste("ID CVM", val["validacao_id"].startswith("CVM-"))

    rank = cvm.validar_multiplas_acoes(["INTENSIFICAR","REDUZIR","OBSERVAR"], "treg th1 tbet crispr pd-1", {"resposta":{"probabilidade_resposta":0.30}})
    teste("Ranking 3 acoes", len(rank["ranking"]) == 3)

    cvm.adicionar_evidencia_dimhex("novo_fase3", 92, 1, "Fase III", "Silva et al., NEJM 2026", "ORR 62% KRAS G12C", ["kras","g12c","fase3"])
    teste("Evidencia DIMHEX", cvm.obter_resumo()["evidencias_dimhex"] >= 1)

    # Acao OBSERVAR tem menos evidencias mapeadas, teste com contexto neutro
    val_low = cvm.validar_decisao("OBSERVAR", "xyzwq nao_e_oncologia")
    teste("Contexto sem match = indice < 85", val_low["indice_evidencia"] < 85, f"idx={val_low['indice_evidencia']}")

def testar_integracao():
    print("\n=== INTEGRACAO: Agente + 4 Camadas ===")
    import pandas as pd
    np.random.seed(42)
    df = pd.DataFrame({'ctDNA': np.random.beta(2,5,50), 'CTC': np.random.lognormal(1.2,0.5,50),
                        'TMB': np.random.gamma(2,4,50), 'PD_L1': np.random.beta(1.5,3,50), 'TILs': np.random.beta(1,3,50)})

    from core.agente import AgenteOncologicoPrecisao
    agente = AgenteOncologicoPrecisao(df)

    teste("Agente tem motor_prob", hasattr(agente, 'motor_prob'))
    teste("Agente tem evidence_driven", hasattr(agente, 'evidence_driven'))
    teste("Agente tem otimizador", hasattr(agente, 'otimizador'))
    teste("Agente tem cvm", hasattr(agente, 'cvm'))

    agente.executar_ciclo({'ctDNA':0.35,'CTC':8,'TMB':12,'PD_L1':0.5,'TILs':0.2}, ciclo_id=1)
    teste("Ciclo executou", True)
    teste("Quadro probabilistico", agente.ultimo_quadro_probabilistico is not None)
    teste("Validacao CVM", agente.ultima_validacao_cvm is not None)
    teste("Dose valida", 0.0 <= agente.dose_atual <= 1.0, f"dose={agente.dose_atual}")

    if agente.ultimo_quadro_probabilistico:
        qp = agente.ultimo_quadro_probabilistico
        teste("QP P(resp)", "probabilidade_resposta" in qp.get("resposta",{}))
        teste("QP P(cura)", "probabilidade_cura" in qp.get("cura",{}))
        teste("QP IT", "indice_terapeutico" in qp)

    for i in range(2, 6):
        agente.executar_ciclo({'ctDNA':max(0.05,0.5-i*0.08),'CTC':max(1,12-i*1.5),'TMB':10,'PD_L1':0.4,'TILs':0.15+i*0.03}, ciclo_id=i)
    teste("5 ciclos sem crash", True)
    teste("Historico otimizacoes > 0", len(agente.otimizador.historico_otimizacoes) > 0)

if __name__ == "__main__":
    print("="*60)
    print("DIMHEX v2.0 -- Testes 4 Camadas Probabilisticas")
    print("="*60)
    testar_camada_1()
    testar_camada_2()
    testar_camada_3()
    testar_camada_4()
    testar_integracao()
    print(f"\nRESULTADO: {PASSOS} passaram, {FALHAS} falharam")
    sys.exit(0 if FALHAS == 0 else 1)