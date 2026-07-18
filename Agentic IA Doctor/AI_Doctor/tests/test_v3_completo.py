"""
Testes de Validacao AI Doctor v3.0
Cobre: base_neoplasia, biomarcadores expandidos, Senciencia v2.0,
pipeline_raros integrado, priores bayesianos raros, e mapeador completo.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))


def test_base_neoplasia_estatisticas():
    """Verifica que a base de neoplasia tem 8 dominios e 11 subtipos mapeados."""
    from core.base_neoplasia import BaseConhecimentoNeoplasia
    bc = BaseConhecimentoNeoplasia()
    stats = bc.obter_resumo_estatistico()
    assert stats["total_dominios"] == 8
    assert stats["subtipos_mapeados"] == 11
    assert stats["total_vias_moleculares"] == 8
    assert stats["total_checkpoint_alvos"] == 5
    assert stats["total_adcs"] == 5
    print("[PASS] test_base_neoplasia_estatisticas")


def test_base_neoplasia_vias_relevantes():
    """Verifica mapeamento de vias para canceres raros."""
    from core.base_neoplasia import BaseConhecimentoNeoplasia
    bc = BaseConhecimentoNeoplasia()
    for subtipo in ["CANCER_DUCTO_BILIAR", "CANCER_AMIGDALA", "CANCER_APPENDICE"]:
        vias = bc.obter_vias_relevantes(subtipo)
        assert len(vias) >= 2, f"{subtipo}: esperado >=2 vias, got {len(vias)}"
    print("[PASS] test_base_neoplasia_vias_relevantes")


def test_base_neoplasia_contexto_clinico():
    """Verifica geracao de contexto clinico rico."""
    from core.base_neoplasia import BaseConhecimentoNeoplasia
    bc = BaseConhecimentoNeoplasia()
    ctx = bc.gerar_contexto_clinico("CANCER_SEIOS_FACE", {"ctDNA": 0.4, "TMB": 12})
    assert "CANCER_SEIOS_FACE" in ctx
    assert len(ctx) > 100
    print("[PASS] test_base_neoplasia_contexto_clinico")


def test_biomarcadores_expandidos():
    """Verifica 27 biomarcadores ativos incluindo 10 novos."""
    from core.relevance_scorer import ScorerRelevanciaClinica
    scorer = ScorerRelevanciaClinica()
    novos = ["ntrk", "alk", "ros1", "braf", "egfr_mutation", "ret", "met", "kras_general", "tp53", "raridade"]
    for bm in novos:
        assert bm in scorer.BIOMARCADORES_SISTEMA, f"Falta biomarcador {bm}"
    assert len(scorer.BIOMARCADORES_SISTEMA) == 27
    print("[PASS] test_biomarcadores_expandidos")


def test_score_com_biomarcador_novo():
    """Verifica que biomarcadores novos sao detectados no scoring."""
    from core.relevance_scorer import ScorerRelevanciaClinica
    scorer = ScorerRelevanciaClinica()
    resultado = scorer.calcular_score({
        "id_dimhex": "test_ntrk",
        "titulo": "NTRK fusion larotrectinib response in rare tumor with BRAF V600E",
        "resumo": "Phase 2 trial overall survival benefit p<0.01",
        "tipo": "ensaio_clinico",
        "data_publicacao": "2025-06-01",
    })
    assert "ntrk" in resultado["biomarcadores_mencionados"]
    assert "braf" in resultado["biomarcadores_mencionados"]
    print("[PASS] test_score_com_biomarcador_novo")


def test_senciencia_v2_atributos():
    """Verifica que Senciencia v2.0 tem os novos atributos."""
    from core.memoria_persistente import MemoriaPersistenteSenciencia
    senc = MemoriaPersistenteSenciencia()
    assert senc.VERSAO == "2.0.0"
    assert hasattr(senc, "memoria_profunda")
    assert hasattr(senc, "gerar_recomendacoes_autoevolucao")
    assert hasattr(senc, "buscar_por_padrao")
    assert hasattr(senc, "obter_memoria_completa")
    print("[PASS] test_senciencia_v2_atributos")


def test_senciencia_registrar_e_buscar():
    """Verifica ciclo de registro e busca unificada."""
    from core.memoria_persistente import MemoriaPersistenteSenciencia
    import tempfile, shutil
    # Usar dir temporario para evitar restaurar estado de testes anteriores
    tmpdir = tempfile.mkdtemp()
    from config import CONFIG
    old_mem = CONFIG.get('DIMHEX_MEMORY_PATH')
    old_wis = CONFIG.get('DIMHEX_WISDOM_PATH')
    CONFIG['DIMHEX_MEMORY_PATH'] = os.path.join(tmpdir, 'mem_test.json')
    CONFIG['DIMHEX_WISDOM_PATH'] = os.path.join(tmpdir, 'sab_test.json')
    senc = MemoriaPersistenteSenciencia()
    inicial = senc.total_episodios
    senc.registrar_ciclo(
        {"ciclo": 1, "timestamp": "2025-01-01", "duracao_segundos": 30,
         "coleta": {"total_achados": 10, "por_fonte": {"pubmed": 10}},
         "avaliacao": {"distribuicao": {"critico": 1, "alto": 2, "moderado": 3, "baixo": 2, "irrelevante": 2}, "taxa_relevancia": 0.6},
         "insights": [{"biomarcador": "ctDNA", "score_medio": 0.7, "severidade": "alta"}],
         "achados_criticos": []},
        fase_sabedoria={"sinteses": [{"tema_principal": "ctDNA"}], "hipoteses": []}
    )
    completa = senc.obter_memoria_completa()
    assert len(completa) >= 5
    assert senc.total_episodios == inicial + 1
    # Restaurar config
    CONFIG['DIMHEX_MEMORY_PATH'] = old_mem
    CONFIG['DIMHEX_WISDOM_PATH'] = old_wis
    shutil.rmtree(tmpdir, ignore_errors=True)
    print("[PASS] test_senciencia_registrar_e_buscar")


def test_pipeline_raros_queries():
    """Verifica 98 queries totais do pipeline de canceres raros."""
    from infrastructure.pipeline_raros import obter_todas_queries_expandidas
    queries = obter_todas_queries_expandidas()
    assert len(queries) == 98
    print("[PASS] test_pipeline_raros_queries")


def test_pipeline_raros_integracao():
    """Verifica que RegistroFontesPesquisa tem contador de ciclo para rotacao."""
    from infrastructure.research_sources import RegistroFontesPesquisa
    reg = RegistroFontesPesquisa()
    assert hasattr(reg, "_ciclo_contador")
    assert reg._ciclo_contador == 0
    print("[PASS] test_pipeline_raros_integracao")


def test_config_raros():
    """Verifica novas configuracoes de canceres raros."""
    from config import CONFIG
    assert CONFIG["DIMHEX_RARE_CANCER_PIPELINE"] is True
    assert CONFIG["DIMHEX_RARE_QUERIES_PER_CYCLE"] == 5
    print("[PASS] test_config_raros")


def test_mapeador_11_subtipos():
    """Verifica que o mapeador cobre 11 subtipos."""
    from mapeadores import MapeadorNCCNASCO
    subtipos = MapeadorNCCNASCO.listar_subtipos_disponiveis()
    assert len(subtipos) == 11
    for st in ["CANCER_SEIOS_FACE", "CANCER_DUCTO_BILIAR", "CANCER_AMPULAR"]:
        assert st in subtipos, f"Falta subtipo {st}"
    print("[PASS] test_mapeador_11_subtipos")


def test_prior_bayesiano_raro():
    """Verifica que priores existem para os 8 canceres raros."""
    from core.motor_probabilidade import ProbabilidadeTerapeutica
    motor = ProbabilidadeTerapeutica()
    raros = [
        "CANCER_SEIOS_FACE", "CANCER_DUCTO_BILIAR", "CARCINOMA_ADENOIDE_CISTICO",
        "CANCER_AMIGDALA", "CANCER_TROMPA_FALOPIO", "CANCER_APPENDICE",
        "CANCER_PARATIREOIDE", "CANCER_AMPULAR"
    ]
    for r in raros:
        assert r in motor.PRIORS_ORR, f"Falta prior para {r}"
        assert 1 in motor.PRIORS_ORR[r], f"Falta linha 1 para {r}"
    print("[PASS] test_prior_bayesiano_raro")


def test_dimhex_versao():
    """Verifica versao DIMHEX."""
    from core.dimhex import DIMHEX
    assert DIMHEX.VERSAO == "2.1.0"
    print("[PASS] test_dimhex_versao")


def test_evidence_driven_raros():
    """Verifica que Evidence-Driven tem mapeamento para canceres raros."""
    from core.evidence_driven import EvidenceDrivenTherapy
    # Nao instancia (precisa de motor), mas verifica classe
    raros_mapeados = [
        "CANCER_SEIOS_FACE", "CANCER_DUCTO_BILIAR", "CARCINOMA_ADENOIDE_CISTICO",
        "CANCER_AMIGDALA", "CANCER_TROMPA_FALOPIO", "CANCER_APPENDICE",
        "CANCER_PARATIREOIDE", "CANCER_AMPULAR"
    ]
    for r in raros_mapeados:
        assert r in EvidenceDrivenTherapy.MAPEAMENTO_SUBTIPOS, f"Falta mapeamento {r}"
    print("[PASS] test_evidence_driven_raros")


def test_relatorios_existentes():
    """Verifica que relatorios de validacao estao no repo."""
    reports_dir = os.path.join(os.path.dirname(__file__), "..", "reports")
    assert os.path.isdir(reports_dir), "Diretorio reports/ nao existe"
    arquivos = os.listdir(reports_dir)
    assert len(arquivos) >= 3, f"Esperado >=3 arquivos em reports/, got {len(arquivos)}"
    print(f"[PASS] test_relatorios_existentes ({len(arquivos)} arquivos)")


if __name__ == "__main__":
    testes = [
        test_base_neoplasia_estatisticas,
        test_base_neoplasia_vias_relevantes,
        test_base_neoplasia_contexto_clinico,
        test_biomarcadores_expandidos,
        test_score_com_biomarcador_novo,
        test_senciencia_v2_atributos,
        test_senciencia_registrar_e_buscar,
        test_pipeline_raros_queries,
        test_pipeline_raros_integracao,
        test_config_raros,
        test_mapeador_11_subtipos,
        test_prior_bayesiano_raro,
        test_dimhex_versao,
        test_evidence_driven_raros,
        test_relatorios_existentes,
    ]

    print(f"\n{'='*60}")
    print(f"  AI Doctor v3.0 — Suite de Testes")
    print(f"  {len(testes)} testes")
    print(f"{'='*60}\n")

    falhas = 0
    for teste in testes:
        try:
            teste()
        except Exception as e:
            print(f"[FALHOU] {teste.__name__}: {e}")
            falhas += 1

    print(f"\n{'='*60}")
    if falhas == 0:
        print(f"  RESULTADO: {len(testes)}/{len(testes)} TESTES PASSARAM")
    else:
        print(f"  RESULTADO: {len(testes)-falhas}/{len(testes)} PASSARAM, {falhas} FALHARAM")
    print(f"{'='*60}")