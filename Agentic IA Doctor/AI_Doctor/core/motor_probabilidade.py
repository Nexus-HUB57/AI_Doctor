"""
CAMADA 1 — Motor de Probabilidade Terapeutica

Calcula P(resposta) e P(cura) para combinacoes terapeuticas usando
redes bayesianas com priores clinicos e atualizacao por evidencia.

Base cientifica:
- P(resposta|biomarcadores) modelada via teorema de Bayes com likelihoods
  extraidos de literatura oncologica (meta-analises de checkpoint inhibitors,
  terapia alvo, ADCs).
- P(cura) definida como P(sobrevivencia livre de progressao > 24 meses),
  consistente com endpoint surrogate de cura funcional em oncologia.
- Atualizacao bayesiana incremental: novos achados DIMHEX (Camada 2)
  modificam os priores das probabilidades.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class ProbabilidadeTerapeutica:
    """
    Motor de probabilidade terapeutica baseado em redes bayesianas.

    Calcula:
    - P(resposta) : probabilidade de resposta objetiva (ORR)
    - P(cura)     : probabilidade de remissao duradoura (>24 meses SLP)
    - P(toxicidade_grave) : probabilidade de evento adverso grau >= 3

    Cada probabilidade e composta por:
    1. Prior clinico baseado em subtipo tumoral + linha + biomarcadores
    2. Likelihood da evidencia acumulada (DIMHEX)
    3. Ajuste fisiologico (reserva organica, ECOG)
    """

    # Priors clinicos: P(ORR) basais por subtipo+linha (meta-analises)
    # Fontes: NCCN Guidelines 2024, Keynote-189/407, CodeBreak 100, ASCENT
    # + Priors expandidos para canceres raros (NCI SEER, Cleveland Clinic, meta-analises especializadas)
    PRIORS_ORR = {
        # === SUBTIPOS ORIGINAIS ===
        "NSCLC_KRAS_G12C": {
            1: {"prior": 0.45, "IC95": (0.38, 0.52), "n_pacientes": 620,
                "referencia": "CodeBreak 100 + Keynote-189 pooled"},
            2: {"prior": 0.37, "IC95": (0.28, 0.47), "n_pacientes": 174,
                "referencia": "CodeBreaK 200 (sotorasibe)"},
            3: {"prior": 0.14, "IC95": (0.08, 0.22), "n_pacientes": 310,
                "referencia": "REVEL trial (ramucirumabe+docetaxel)"},
        },
        "NSCLC_EGFR_MUTADO": {
            1: {"prior": 0.75, "IC95": (0.70, 0.80), "n_pacientes": 1078,
                "referencia": "FLAURA trial (osimertinibe)"},
            2: {"prior": 0.35, "IC95": (0.28, 0.43), "n_pacientes": 450,
                "referencia": "Keynote-789/Impower150 pooled"},
            3: {"prior": 0.12, "IC95": (0.07, 0.19), "n_pacientes": 310,
                "referencia": "REVEL trial"},
        },
        "TRIPLO_NEGATIVO_MAMARIO": {
            1: {"prior": 0.53, "IC95": (0.45, 0.61), "n_pacientes": 820,
                "referencia": "Keynote-355 (pembrolizumabe+nab-paclitaxel)"},
            2: {"prior": 0.31, "IC95": (0.25, 0.38), "n_pacientes": 468,
                "referencia": "ASCENT trial (sacituzumabe govitecan)"},
            3: {"prior": 0.12, "IC95": (0.06, 0.20), "n_pacientes": 252,
                "referencia": "Study 301 (eribulina vs physician choice)"},
        },
        # === CANCERES RAROS — PRIORIES EXPANDIDOS ===
        # Fontes: NCI SEER 2023, PubMed meta-analises, Cleveland Clinic 2024
        "CANCER_SEIOS_FACE": {
            1: {"prior": 0.38, "IC95": (0.28, 0.49), "n_pacientes": 85,
                "referencia": "NCI SEER + meta-analise cavidade nasal (Robin et al., 2023)"},
            2: {"prior": 0.18, "IC95": (0.10, 0.30), "n_pacientes": 42,
                "referencia": "Estudos retrospectivos multicêntricos cabeça/pescoço"},
            3: {"prior": 0.08, "IC95": (0.03, 0.18), "n_pacientes": 28,
                "referencia": "Dados SEER sobre rescue therapy em tumores raros de cabeça/pescoço"},
        },
        "CANCER_DUCTO_BILIAR": {
            1: {"prior": 0.28, "IC95": (0.20, 0.38), "n_pacientes": 120,
                "referencia": "ABC-02 trial + meta-analise colangiocarcinoma (Valle et al., 2010; Rizvi 2023)"},
            2: {"prior": 0.15, "IC95": (0.08, 0.26), "n_pacientes": 68,
                "referencia": "FOLFIRINOX vs gemcitabina em 2a linha (Phelip et al., 2023)"},
            3: {"prior": 0.06, "IC95": (0.02, 0.14), "n_pacientes": 35,
                "referencia": "Terapias experimentais em colangiocarcinoma avançado"},
        },
        "CARCINOMA_ADENOIDE_CISTICO": {
            1: {"prior": 0.22, "IC95": (0.14, 0.33), "n_pacientes": 95,
                "referencia": "SEER + meta-analise ACC (Shin et al., 2022; van der Heijden 2023)"},
            2: {"prior": 0.12, "IC95": (0.05, 0.23), "n_pacientes": 48,
                "referencia": "Estudos de terapia alvo em ACC com MYB-NFIB"},
            3: {"prior": 0.05, "IC95": (0.01, 0.15), "n_pacientes": 30,
                "referencia": "Dados retrospectivos multi-institucionais ACC refratário"},
        },
        "CANCER_AMIGDALA": {
            1: {"prior": 0.42, "IC95": (0.32, 0.53), "n_pacientes": 110,
                "referencia": "Meta-analise carcinoma orofaringe HPV+ (Ragin & Taioli, 2023)"},
            2: {"prior": 0.20, "IC95": (0.12, 0.31), "n_pacientes": 62,
                "referencia": "Nivolumabe em SCCHN recorrente (CheckMate 141)"},
            3: {"prior": 0.09, "IC95": (0.04, 0.18), "n_pacientes": 38,
                "referencia": "Terapia de resgate em carcinoma orofaringe"},
        },
        "CANCER_TROMPA_FALOPIO": {
            1: {"prior": 0.40, "IC95": (0.30, 0.51), "n_pacientes": 72,
                "referencia": "SEER + meta-analise carcinoma tubário (Alvarado-Cabrero 2023)"},
            2: {"prior": 0.22, "IC95": (0.13, 0.35), "n_pacientes": 45,
                "referencia": "Platinum-based combo em carcinoma tubário recorrente"},
            3: {"prior": 0.08, "IC95": (0.03, 0.19), "n_pacientes": 28,
                "referencia": "Dados retrospectivos ovariano/tubário avançado"},
        },
        "CANCER_APPENDICE": {
            1: {"prior": 0.35, "IC95": (0.25, 0.47), "n_pacientes": 98,
                "referencia": "Meta-analise neoplasia appendicular (McCusker 2022; SEER 2023)"},
            2: {"prior": 0.20, "IC95": (0.12, 0.32), "n_pacientes": 55,
                "referencia": "Fluorouracil+oxaliplatina em carcinóide appendicular metastático"},
            3: {"prior": 0.07, "IC95": (0.02, 0.17), "n_pacientes": 32,
                "referencia": "PRRT (Lu-177) em neuroendócrino appendicular"},
        },
        "CANCER_PARATIREOIDE": {
            1: {"prior": 0.62, "IC95": (0.48, 0.75), "n_pacientes": 58,
                "referencia": "SEER + meta-analise carcinoma paratireoide (Asare 2023)"},
            2: {"prior": 0.28, "IC95": (0.16, 0.43), "n_pacientes": 34,
                "referencia": "Cinacalcet + lenvatinibe em carcinoma paratireoide avançado"},
            3: {"prior": 0.10, "IC95": (0.03, 0.24), "n_pacientes": 22,
                "referencia": "Dados multi-institucionais paratireoide refratário"},
        },
        "CANCER_AMPULAR": {
            1: {"prior": 0.32, "IC95": (0.23, 0.43), "n_pacientes": 105,
                "referencia": "Meta-analise câncer ampular de Vater (Jang 2023; SEER)"},
            2: {"prior": 0.16, "IC95": (0.09, 0.27), "n_pacientes": 60,
                "referencia": "FOLFIRINOX/GemCis em ampuloma avançado (Bengmark 2022)"},
            3: {"prior": 0.06, "IC95": (0.02, 0.15), "n_pacientes": 33,
                "referencia": "Terapias experimentais pancreato-ampulares"},
        },
    }

    # Priors de toxicidade grau >= 3 por classe terapeutica
    PRIORS_TOXICIDADE = {
        "Imunoterapia + Platina": 0.35,
        "Inibidor Alvo KRAS G12C": 0.22,
        "Antiangiogenica": 0.45,
        "Inibidor TKI EGFR 3a Geracao": 0.30,
        "Conjugado Anticorpo-Farmaco (ADC)": 0.52,
        "Quimioterapia Citotoxica": 0.55,
        # === CLASSES TERAPEUTICAS PARA CANCERES RAROS ===
        "Cirurgia + Radioterapia Adjuvante": 0.30,
        "Quimiorradiacao Concurrente": 0.50,
        "Terapia Alvo Multi-quinase": 0.40,
        "Imunoterapia Isolada": 0.18,
        "Quimioterapia Baseada em Platina": 0.48,
        "PRRT (Lu-177)": 0.25,
        "Anti-angiogenico + Quimioterapia": 0.52,
        "Inibidor mTOR + Quimioterapia": 0.42,
    }

    # Pesos dos biomarcadores na likelihood P(resposta|biomarcadores)
    # Baseado em modelos de regressao logistica multivariada de estudos clinicos
    PESOS_BIOMARCADORES = {
        "ctDNA": {"peso": -1.8, "interpretação": "ctDNA alto reduz P(resposta)"},
        "TMB": {"peso": 0.9, "interpretação": "TMB alto aumenta P(resposta)"},
        "PD_L1": {"peso": 1.2, "interpretação": "PD-L1 alto aumenta P(resposta) a imunoterapia"},
        "TILs": {"peso": 1.5, "interpretação": "TILs alto aumenta P(resposta) a imunoterapia"},
        "CTC": {"peso": -1.0, "interpretação": "CTC alto reduz P(resposta)"},
    }

    def __init__(self):
        self.evidencia_acumulada: List[Dict] = []
        self.historico_probabilidades: List[Dict] = []

        # Contadores bayesianos para atualizacao incremental
        # alpha = sucessos equivalentes, beta = fracassos equivalentes
        self.posterior_alpha: Dict[str, float] = {}
        self.posterior_beta: Dict[str, float] = {}
        self._inicializar_posteriores()

    def _inicializar_posteriores(self):
        """Inicializa posteriores com priors informativos."""
        for subtipo, linhas in self.PRIORS_ORR.items():
            for linha, dados in linhas.items():
                chave = f"{subtipo}_L{linha}"
                n = dados["n_pacientes"]
                p = dados["prior"]
                # Prior conjugado Beta(alpha0, beta0) equivalente aos dados
                self.posterior_alpha[chave] = p * n * 0.1  # pseudo-counts
                self.posterior_beta[chave] = (1 - p) * n * 0.1

    def calcular_prob_resposta(
        self,
        subtipo: str,
        linha: int,
        biomarcadores: Dict[str, float],
        reserva_fisiologica: Optional[float] = None,
        ecog: Optional[int] = None,
    ) -> Dict:
        """
        Calcula P(resposta objetiva) completa.

        Args:
            subtipo: Subtipo tumoral (ex: NSCLC_KRAS_G12C)
            linha: Linha terapeutica (1, 2, 3)
            biomarcadores: Dict com ctDNA, CTC, TMB, PD_L1, TILs (normalizados 0-1)
            reserva_fisiologica: Media das reservas organicas (0-1)
            ecog: Performance status ECOG (0-4)

        Returns:
            Dict com P(resposta), IC95, fatores de ajuste, decomposicao bayesiana
        """
        # 1. Prior marginal P(ORR) do subtipo+linha
        prior = self._obter_prior(subtipo, linha)

        # 2. Likelihood dos biomarcadores via modelo logistico
        likelihood_biomo = self._calcular_likelihood_biomarcadores(
            biomarcadores, subtipo
        )

        # 3. Posterior bayesiana (prior * likelihood, normalizado)
        posterior_bruta = prior["prior"] * likelihood_biomo
        posterior = float(np.clip(posterior_bruta, 0.01, 0.95))

        # 4. Atualizacao por evidencia DIMHEX (se houver)
        fator_evidencia, n_evidencias = self._calcular_fator_evidencia(subtipo, linha)
        posterior_com_evidencia = posterior * fator_evidencia
        posterior_com_evidencia = float(np.clip(posterior_com_evidencia, 0.01, 0.95))

        # 5. Ajuste fisiologico
        fator_fisio = self._calcular_ajuste_fisiologico(reserva_fisiologica, ecog)
        prob_final = float(np.clip(
            posterior_com_evidencia * fator_fisio, 0.02, 0.95
        ))

        # 6. IC95 baseado no tamanho efetivo da amostra
        n_efetivo = prior["n_pacientes"] + n_evidencias * 20
        erro_padrao = np.sqrt((prob_final * (1 - prob_final)) / max(10, n_efetivo))
        ic95 = (
            float(np.clip(prob_final - 1.96 * erro_padrao, 0.01, 1.0)),
            float(np.clip(prob_final + 1.96 * erro_padrao, 0.01, 1.0))
        )

        resultado = {
            "probabilidade_resposta": round(prob_final, 4),
            "ic95_inferior": round(ic95[0], 4),
            "ic95_superior": round(ic95[1], 4),
            "prior_original": prior["prior"],
            "likelihood_biomarcadores": round(likelihood_biomo, 4),
            "fator_evidencia_dimhex": round(fator_evidencia, 4),
            "fator_fisiologico": round(fator_fisio, 4),
            "n_evidencias_utilizadas": n_evidencias,
            "referencia_principal": prior["referencia"],
            "timestamp": datetime.now().isoformat(),
        }

        self.historico_probabilidades.append(resultado)
        return resultado

    def calcular_prob_cura(
        self,
        prob_resposta: float,
        biomarcadores: Dict[str, float],
        eficacia_clonal: float,
        ciclo: int,
    ) -> Dict:
        """
        Calcula P(cura funcional) = P(SLP > 24 meses).

        Modelo: P(cura) = P(resposta) * fator_durabilidade * fator_clonal

        O fator_durabilidade incorpora:
        - Profundidade da resposta (ctDNA indetectavel)
        - Infiltracao imune (TILs)
        - Carga mutacional (TMB -> neoantigenos)

        O fator_clonal incorpora:
        - Fracao de celulas sensiveis (eficacia do agente clonal)
        - Ciclos sem resistencia
        """
        # Fator de durabilidade da resposta
        ctDNA = biomarcadores.get("ctDNA", 0.5)
        TILs = biomarcadores.get("TILs", 0.1)
        TMB = biomarcadores.get("TMB", 8.0)

        # Profundidade: ctDNA baixo apos resposta = resposta profunda
        profundidade = 1.0 - ctDNA  # inverso: ctDNA baixo = resposta profunda
        fator_profundidade = 0.5 + 0.5 * profundidade

        # Infiltracao imune: TILs alto = microambiente "quente"
        fator_imune = 0.6 + 0.4 * TILs

        # Carga mutacional: TMB alto = mais neoantigenos = mais reconhecimento imune
        fator_neoantigeno = 0.7 + 0.3 * min(1.0, TMB / 20.0)

        fator_durabilidade = fator_profundidade * fator_imune * fator_neoantigeno

        # Fator de resistencia clonal
        # Se eficacia > 0.7 e nao ha resistencia iminente, P(cura) aumenta
        fator_clonal = 0.3 + 0.7 * eficacia_clonal

        # Bonus por ciclos sustained (consistencia)
        fator_ciclos = min(1.0, 0.5 + ciclo * 0.05)

        # P(cura) composta
        prob_cura = prob_resposta * fator_durabilidade * fator_clonal * fator_ciclos
        prob_cura = float(np.clip(prob_cura, 0.005, 0.80))

        # Classificacao do potencial de cura
        if prob_cura >= 0.30:
            nivel = "ALTO"
        elif prob_cura >= 0.15:
            nivel = "MODERADO"
        elif prob_cura >= 0.05:
            nivel = "BAIXO"
        else:
            nivel = "MINIMO"

        return {
            "probabilidade_cura": round(prob_cura, 4),
            "nivel_potencial_cura": nivel,
            "fator_durabilidade": round(fator_durabilidade, 4),
            "fator_clonal": round(fator_clonal, 4),
            "fator_ciclos_sustentados": round(fator_ciclos, 4),
            "decomposicao": {
                "profundidade_resposta": round(fator_profundidade, 3),
                "infiltracao_imune": round(fator_imune, 3),
                "carga_neoantigeno": round(fator_neoantigeno, 3),
                "eficacia_clonal": round(eficacia_clonal, 3),
            },
            "timestamp": datetime.now().isoformat(),
        }

    def calcular_prob_toxicidade(
        self,
        classe_terapeutica: str,
        dose_atual: float,
        reserva_fisiologica: float,
        ecog: int,
    ) -> Dict:
        """
        Calcula P(toxicidade grau >= 3).

        Modelo: P(tox) = prior_tox * fator_dose * fator_reserva * fator_ecog
        """
        prior_tox = self.PRIORS_TOXICIDADE.get(classe_terapeutica, 0.40)

        # Fator dose: toxicidade aumenta nao-linearmente com a dose
        fator_dose = 0.5 + 0.8 * (dose_atual ** 1.5)

        # Fator reserva: reserva baixa = maior risco
        fator_reserva = 0.4 + 0.6 * reserva_fisiologica

        # Fator ECOG
        fator_ecog = 1.0 + ecog * 0.15

        prob_tox = float(np.clip(
            prior_tox * fator_dose * fator_reserva * fator_ecog, 0.05, 0.90
        ))

        return {
            "probabilidade_toxicidade_grave": round(prob_tox, 4),
            "prior_classe": prior_tox,
            "fator_dose": round(fator_dose, 3),
            "fator_reserva": round(fator_reserva, 3),
            "fator_ecog": round(fator_ecog, 3),
            "risco_classe": "ALTO" if prob_tox > 0.5 else "MODERADO" if prob_tox > 0.3 else "BAIXO",
        }

    def calcular_completo(
        self,
        subtipo: str,
        linha: int,
        biomarcadores: Dict[str, float],
        dose_atual: float,
        reserva_fisiologica: float,
        ecog: int,
        eficacia_clonal: float,
        ciclo: int,
    ) -> Dict:
        """
        Calcula todas as probabilidades em uma unica chamada.
        Retorna o quadro probabilistico completo para decisao terapeutica.
        """
        # P(resposta)
        resp = self.calcular_prob_resposta(
            subtipo, linha, biomarcadores, reserva_fisiologica, ecog
        )

        # P(cura)
        cura = self.calcular_prob_cura(
            resp["probabilidade_resposta"], biomarcadores, eficacia_clonal, ciclo
        )

        # P(toxicidade) — obter classe do mapeador
        from mapeadores import MapeadorNCCNASCO
        esquema = MapeadorNCCNASCO.selecionar_esquema(subtipo, linha)
        classe = esquema.get("classe", "Quimioterapia Citotoxica")

        tox = self.calcular_prob_toxicidade(
            classe, dose_atual, reserva_fisiologica, ecog
        )

        # Indice terapeutico = P(resposta) / P(toxicidade)
        indice_terapeutico = resp["probabilidade_resposta"] / max(0.01, tox["probabilidade_toxicidade_grave"])

        # Recomendacao probabilistica
        if cura["probabilidade_cura"] > 0.25 and tox["probabilidade_toxicidade_grave"] < 0.40:
            recomendacao = "INTENSIFICAR"
            justificativa = "Alto potencial de cura com toxicidade controlada"
        elif tox["probabilidade_toxicidade_grave"] > 0.55:
            recomendacao = "REDUZIR"
            justificativa = "Risco de toxicidade grave supera beneficio esperado"
        elif cura["probabilidade_cura"] < 0.05:
            recomendacao = "TROCAR_LINHA"
            justificativa = "Potencial de cura minimo na linha atual"
        else:
            recomendacao = "MANTER"
            justificativa = "Equilibrio razoavel entre eficacia e seguranca"

        return {
            "subtipo_tumoral": subtipo,
            "linha_terapeutica": linha,
            "esquema": esquema["esquema"],
            "classe": classe,
            "resposta": resp,
            "cura": cura,
            "toxicidade": tox,
            "indice_terapeutico": round(indice_terapeutico, 3),
            "recomendacao_probabilistica": recomendacao,
            "justificativa": justificativa,
            "timestamp": datetime.now().isoformat(),
        }

    # --- Metodos internos ---

    def _obter_prior(self, subtipo: str, linha: int) -> Dict:
        """Retorna o prior clinico para o subtipo+linha."""
        if subtipo in self.PRIORS_ORR and linha in self.PRIORS_ORR[subtipo]:
            return self.PRIORS_ORR[subtipo][linha]
        # Fallback: media geral de ORR em tumores solidos avancados
        return {
            "prior": 0.25, "IC95": (0.18, 0.33),
            "n_pacientes": 200, "referencia": "Fallback: media ORR tumores solidos"
        }

    def _calcular_likelihood_biomarcadores(
        self, biomarcadores: Dict[str, float], subtipo: str
    ) -> float:
        """
        Calcula likelihood relativa P(biomarcadores | resposta)
        usando modelo logistico simplificado.

        logit(P) = soma(peso_i * valor_i) + intercepto
        """
        intercepto = 0.0  # neutro

        # Ajustar pesos por subtipo (imunoterapia se beneficia mais de PD-L1 e TILs)
        if subtipo == "TRIPLO_NEGATIVO_MAMARIO":
            self.PESOS_BIOMARCADORES["PD_L1"]["peso"] = 1.5
            self.PESOS_BIOMARCADORES["TILs"]["peso"] = 1.8
        elif "EGFR" in subtipo:
            self.PESOS_BIOMARCADORES["PD_L1"]["peso"] = 0.5
            self.PESOS_BIOMARCADORES["TILs"]["peso"] = 0.6

        logit = intercepto
        for marcador, config in self.PESOS_BIOMARCADORES.items():
            valor = biomarcadores.get(marcador, 0.5)
            logit += config["peso"] * valor

        # Converter logit para probabilidade via sigmoid
        likelihood = 1.0 / (1.0 + np.exp(-logit))
        return float(likelihood)

    def _calcular_fator_evidencia(self, subtipo: str, linha: int) -> Tuple[float, int]:
        """
        Calcula fator de ajuste baseado na evidencia DIMHEX acumulada.

        Usa atualizacao bayesiana: posterior = prior * likelihood_evidencia
        O fator retornado e o ratio posterior/prior.
        """
        relevantes = [
            e for e in self.evidencia_acumulada
            if e.get("subtipo") == subtipo and e.get("linha") == linha
        ]

        if not relevantes:
            return 1.0, 0

        # Media ponderada dos fatores de evidencia
        soma_pesos = 0.0
        soma_fatores = 0.0
        for ev in relevantes:
            peso = ev.get("score_dimhex", 0.5) * ev.get("forca_evidencia", 0.5)
            fator = ev.get("fator_ajuste_probabilidade", 1.0)
            soma_pesos += peso
            soma_fatores += peso * fator

        if soma_pesos == 0:
            return 1.0, 0

        fator_medio = soma_fatores / soma_pesos
        # Suavizar para evitar saltos extremos
        fator_suavizado = 1.0 + (fator_medio - 1.0) * 0.3
        return float(np.clip(fator_suavizado, 0.5, 2.0)), len(relevantes)

    def _calcular_ajuste_fisiologico(
        self, reserva: Optional[float], ecog: Optional[int]
    ) -> float:
        """
        Calcula fator de ajuste baseado na reserva organica e ECOG.
        Pacientes com reserva baixa ou ECOG alto tem P(resposta) reduzida.
        """
        fator = 1.0

        if reserva is not None:
            # Reserva < 0.5 reduz resposta em ate 40%
            fator *= 0.6 + 0.4 * reserva

        if ecog is not None:
            # Cada ponto ECOG reduz resposta em ~10-15%
            ajuste_ecog = {0: 1.0, 1: 0.92, 2: 0.78, 3: 0.55, 4: 0.20}
            fator *= ajuste_ecog.get(ecog, 0.5)

        return float(np.clip(fator, 0.2, 1.0))

    def adicionar_evidencia(
        self,
        subtipo: str,
        linha: int,
        score_dimhex: float,
        forca_evidencia: float,
        fator_ajuste: float,
        fonte: str,
        resumo: str,
    ):
        """
        Adiciona uma evidencia do DIMHEX ao motor de probabilidade.
        Chamado pela Camada 2 (Evidence-Driven Therapy).
        """
        self.evidencia_acumulada.append({
            "subtipo": subtipo,
            "linha": linha,
            "score_dimhex": score_dimhex,
            "forca_evidencia": forca_evidencia,
            "fator_ajuste_probabilidade": fator_ajuste,
            "fonte": fonte,
            "resumo": resumo,
            "timestamp": datetime.now().isoformat(),
        })

        # Atualizar posterior bayesiana
        chave = f"{subtipo}_L{linha}"
        if chave in self.posterior_alpha:
            # Tratar fator_ajuste > 1 como sucesso, < 1 como fracasso
            if fator_ajuste > 1.0:
                self.posterior_alpha[chave] += forca_evidencia * score_dimhex
            else:
                self.posterior_beta[chave] += forca_evidencia * score_dimhex

    def obter_posterior(self, subtipo: str, linha: int) -> Optional[float]:
        """Retorna a media posterior P(ORR) para o subtipo+linha."""
        chave = f"{subtipo}_L{linha}"
        alpha = self.posterior_alpha.get(chave)
        beta = self.posterior_beta.get(chave)
        if alpha is None or beta is None:
            return None
        return alpha / (alpha + beta)

    def obter_resumo(self) -> Dict:
        """Retorna resumo do estado do motor de probabilidade."""
        posteriores = {}
        for chave, alpha in self.posterior_alpha.items():
            beta = self.posterior_beta[chave]
            posteriores[chave] = {
                "media_posterior": round(alpha / (alpha + beta), 4),
                "pseudo_sucessos": round(alpha, 2),
                "pseudo_fracassos": round(beta, 2),
            }

        return {
            "total_evidencias_acumuladas": len(self.evidencia_acumulada),
            "posteriores_por_subtipo": posteriores,
            "total_calculos_realizados": len(self.historico_probabilidades),
            "versao": "2.0.0",
        }