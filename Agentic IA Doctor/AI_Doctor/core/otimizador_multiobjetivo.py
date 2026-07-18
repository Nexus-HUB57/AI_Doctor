"""
CAMADA 3 — Otimizador Multi-Objetivo

Maximiza P(cura) respeitando constraints clinicos rigidos:
  - Toxicidade <= limiar aceitavel
  - ECOG <= 2 (ou restricao mais apertada do paciente)
  - Reserva organica >= minima
  - Dose dentro de faixa terapeutica

Metodo: Fronteira de Pareto com ponderacao adaptativa.
A cada ciclo, o otimizador avalia a acao que maximiza o objetivo
composto respeitando todas as restricoes.

Base cientifica:
- Programacao por metas (Goal Programming) adaptada a oncologia
- Conceito de "therapeutic window" (janela terapeutica)
- Trade-off eficacia-toxicidade modelado como funcao de utilidade
  (Karnofsky index + QALY proxy)
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from enum import Enum


class AcaoTerapeutica(Enum):
    INTENSIFICAR = "INTENSIFICAR"
    INTENSIFICAR_MODERADO = "INTENSIFICAR_MODERADO"
    MANTER_DOSE = "MANTER_DOSE"
    REDUZIR = "REDUZIR"
    TROCAR_LINHA = "TROCAR_LINHA"
    OBSERVAR = "OBSERVAR"


class OtimizadorMultiObjetivo:
    """
    Otimizador de acao terapeutica que maximiza P(cura)
    sujeito a constraints clinicos.

    Funcao objetivo:
      U(acao) = w_cura * P_cura(acao) - w_tox * P_tox(acao) + w_qualidade * Q(acao)

    Onde Q(acao) e uma funcao de qualidade de vida proxy
    que penaliza acoes que degradam a reserva organica.

    Constraints (hard):
      - P(toxicidade grave) <= 0.50 (limiar de seguranca)
      - ECOG <= 2 para intensificar
      - Reserva organica media >= 0.30
      - Dose em [DOSE_MIN, DOSE_MAX]

    Constraints (soft, penalizados):
      - Reserva >= 0.50 (preferencia)
      - P(cura) > P(cura_cenario_passivo) para justificar intensificacao
    """

    # Pesos do objetivo composto (normalizam para soma = 1)
    W_CURA = 0.50       # Peso da maximizacao de cura
    W_TOX = 0.30        # Peso da minimizacao de toxicidade
    W_QUALIDADE = 0.20  # Peso da preservacao de qualidade de vida

    # Constraints rigidos
    LIMIAR_TOXICIDADE = 0.50      # P(tox grau >= 3) maximo aceitavel
    LIMIAR_RESERVA_MINIMA = 0.30  # Reserva organica minima
    ECOG_MAX_INTENSIFICAR = 2     # ECOG maximo para permitir intensificacao

    # Funcoes de utilidade marginal
    # Utilidade de P(cura) — concava: ganhos decrescentes acima de 0.30
    # Utilidade de P(tox) — convexa: penalidade crescente acima de 0.40

    def __init__(self):
        self.historico_otimizacoes: List[Dict] = []
        self.contador = 0

    def otimizar_acao(
        self,
        probabilidades: Dict,
        fisiologia: object,
        paradigma: object,
        dose_atual: float,
        linha_atual: int,
        eficacia_clonal: float,
        ciclo: int,
        emocoes: Optional[object] = None,
    ) -> Dict:
        """
        Avalia todas as acoes possiveis e retorna a otima.

        Args:
            probabilidades: Dict do Motor de Probabilidade (Camada 1)
            fisiologia: Instancia de FisiologiaSistemica
            paradigma: Instancia de ParadigmaTerapeuticoAvancado
            dose_atual: Dose atual (0-1)
            linha_atual: Linha terapeutica atual
            eficacia_clonal: Eficacia clonal atual
            ciclo: Ciclo atual do agente
            emocoes: Opcional, instancia de EstadoEmocionalPaciente

        Returns:
            Dict com acao otima, utilidades, status dos constraints, justificativa
        """
        self.contador += 1
        ecog = fisiologia.ecog
        reserva_media = np.mean([
            fisiologia.reserva_renal,
            fisiologia.reserva_hepatica,
            fisiologia.reserva_hematologica,
        ])

        # Candidatas a acao (nao todas sao viaveis)
        candidatas = [
            AcaoTerapeutica.INTENSIFICAR,
            AcaoTerapeutica.INTENSIFICAR_MODERADO,
            AcaoTerapeutica.MANTER_DOSE,
            AcaoTerapeutica.REDUZIR,
            AcaoTerapeutica.OBSERVAR,
        ]

        # TROCAR_LINHA so se linha < 3, eficacia clonal baixa, ECOG <= 2
        if linha_atual < 3 and eficacia_clonal < 0.3 and ecog <= 2:
            candidatas.append(AcaoTerapeutica.TROCAR_LINHA)

        # Avaliar cada candidata
        avaliacoes = []
        for acao in candidatas:
            avaliacao = self._avaliar_acao(
                acao=acao,
                dose_atual=dose_atual,
                probabilidades=probabilidades,
                ecog=ecog,
                reserva_media=reserva_media,
                paradigma=paradigma,
                fisiologia=fisiologia,
                linha_atual=linha_atual,
                eficacia_clonal=eficacia_clonal,
                ciclo=ciclo,
            )
            avaliacoes.append(avaliacao)

        # Filtrar por constraints rigidos
        viaveis = [a for a in avaliacoes if a["constraints_satisfeitos"]]

        if not viaveis:
            # Todas as acoes violam constraints — escolher a menos pior
            viaveis = sorted(avaliacoes, key=lambda x: -x["utilidade_total"])[:1]

        # Selecionar acao otima (maior utilidade)
        otima = max(viaveis, key=lambda x: x["utilidade_total"])

        # Modulacao emocional (se disponivel)
        fator_emocional = 1.0
        if emocoes is not None:
            fator_emocional = self._modulacao_emocional(
                otima["acao"], emocoes
            )

        resultado = {
            "acao_otima": otima["acao"].value,
            "utilidade_total": round(otima["utilidade_total"], 4),
            "utilidade_cura": round(otima["utilidade_cura"], 4),
            "utilidade_toxicidade": round(otima["utilidade_toxicidade"], 4),
            "utilidade_qualidade": round(otima["utilidade_qualidade"], 4),
            "fator_emocional": round(fator_emocional, 4),
            "p_cura_projetada": otima.get("p_cura_projetada", 0.0),
            "p_tox_projetada": otima.get("p_tox_projetada", 0.0),
            "constraints": otima["constraints"],
            "todas_avaliacoes": [
                {"acao": a["acao"].value, "utilidade": round(a["utilidade_total"], 4),
                 "viavel": a["constraints_satisfeitos"]}
                for a in avaliacoes
            ],
            "justificativa": self._gerar_justificativa(otima, reserva_media, ecog),
            "ciclo": ciclo,
            "timestamp": self._agora_iso(),
        }

        self.historico_otimizacoes.append(resultado)
        if len(self.historico_otimizacoes) > 200:
            self.historico_otimizacoes = self.historico_otimizacoes[-200:]

        return resultado

    def _avaliar_acao(
        self,
        acao: AcaoTerapeutica,
        dose_atual: float,
        probabilidades: Dict,
        ecog: int,
        reserva_media: float,
        paradigma: object,
        fisiologia: object,
        linha_atual: int,
        eficacia_clonal: float,
        ciclo: int,
    ) -> Dict:
        """Avalia uma unica acao terapeutica candidata."""
        # 1. Projetar dose resultante
        dose_projetada = self._projetar_dose(acao, dose_atual, paradigma)

        # 2. Projetar P(cura) e P(tox) para a dose projetada
        p_cura = probabilidades.get("cura", {}).get("probabilidade_cura", 0.1)

        # Ajustar P(cura) pela acao
        delta_cura = self._estimar_delta_cura(acao, dose_projetada, dose_atual, eficacia_clonal)
        p_cura_projetada = float(np.clip(p_cura + delta_cura, 0.01, 0.90))

        # Ajustar P(tox) pela dose projetada
        p_tox_base = probabilidades.get("toxicidade", {}).get("probabilidade_toxicidade_grave", 0.30)
        delta_tox = self._estimar_delta_tox(acao, dose_projetada, dose_atual)
        p_tox_projetada = float(np.clip(p_tox_base + delta_tox, 0.05, 0.90))

        # 3. Projetar reserva apos acao
        delta_reserva = self._estimar_delta_reserva(acao, dose_projetada, paradigma)
        reserva_projetada = float(np.clip(reserva_media + delta_reserva, 0.0, 1.0))

        # 4. Projetar ECOG apos acao
        ecog_projetado = self._projetar_ecog(ecog, reserva_projetada)

        # 5. Verificar constraints
        constraints = self._verificar_constraints(
            p_tox_projetada, reserva_projetada, ecog_projetado,
            dose_projetada, acao, linha_atual
        )

        # 6. Calcular utilidades marginais
        u_cura = self._utilidade_cura(p_cura_projetada)
        u_tox = self._utilidade_toxicidade(p_tox_projetada)
        u_qualidade = self._utilidade_qualidade(reserva_projetada, ecog_projetado)

        # 7. Utilidade total ponderada
        u_total = (self.W_CURA * u_cura +
                   self.W_TOX * (1.0 - u_tox) +  # inverter: menos tox = melhor
                   self.W_QUALIDADE * u_qualidade)

        # Penalizar acoes que violam constraints soft
        if not constraints["todos_satisfeitos"]:
            u_total *= 0.7  # penalidade de 30% para acao que viola constraint

        return {
            "acao": acao,
            "dose_projetada": round(dose_projetada, 3),
            "p_cura_projetada": round(p_cura_projetada, 4),
            "p_tox_projetada": round(p_tox_projetada, 4),
            "reserva_projetada": round(reserva_projetada, 4),
            "ecog_projetado": ecog_projetado,
            "utilidade_cura": u_cura,
            "utilidade_toxicidade": u_tox,
            "utilidade_qualidade": u_qualidade,
            "utilidade_total": u_total,
            "constraints": constraints,
            "constraints_satisfeitos": constraints["todos_satisfeitos"],
        }

    def _projetar_dose(self, acao: AcaoTerapeutica, dose_atual: float, paradigma: object) -> float:
        """Projeta a dose resultante de uma acao."""
        if acao == AcaoTerapeutica.INTENSIFICAR:
            return min(paradigma.exposicao_maxima, dose_atual + 0.15)
        elif acao == AcaoTerapeutica.INTENSIFICAR_MODERADO:
            return min(paradigma.exposicao_maxima, dose_atual + 0.05)
        elif acao == AcaoTerapeutica.REDUZIR:
            return max(0.0, dose_atual - 0.10)
        elif acao == AcaoTerapeutica.OBSERVAR:
            return max(0.0, dose_atual - 0.02)
        elif acao == AcaoTerapeutica.TROCAR_LINHA:
            return 0.3
        return dose_atual

    def _estimar_delta_cura(self, acao, dose_proj, dose_atual, eficacia_clonal) -> float:
        """Estima o delta em P(cura) causado pela acao."""
        if acao == AcaoTerapeutica.TROCAR_LINHA:
            return 0.05  # Reset de resistencia pode melhorar P(cura)
        if acao in (AcaoTerapeutica.INTENSIFICAR, AcaoTerapeutica.INTENSIFICAR_MODERADO):
            # Margem de beneficio decrescente (concordancia)
            delta_dose = dose_proj - dose_atual
            return delta_dose * eficacia_clonal * 0.3
        if acao == AcaoTerapeutica.REDUZIR:
            return -0.02  # Pequena reducao de P(cura)
        return 0.0

    def _estimar_delta_tox(self, acao, dose_proj, dose_atual) -> float:
        """Estima o delta em P(tox) causado pela acao."""
        delta_dose = dose_proj - dose_atual
        # Toxicidade aumenta nao-linearmente com dose
        return delta_dose * 0.6 + delta_dose ** 2 * 0.4

    def _estimar_delta_reserva(self, acao, dose_proj, paradigma) -> float:
        """Estima o delta na reserva organica."""
        tox = paradigma.toxicidade_da_droga
        if acao == AcaoTerapeutica.REDUZIR or acao == AcaoTerapeutica.OBSERVAR:
            return tox * 0.05  # Pequena recuperacao
        return -dose_proj * tox * 0.08  # Degradacao

    def _projetar_ecog(self, ecog_atual: int, reserva_projetada: float) -> int:
        """Projeta ECOG baseado na reserva projetada."""
        if reserva_projetada < 0.4 and ecog_atual < 4:
            return min(4, ecog_atual + 1)
        if reserva_projetada > 0.7 and ecog_atual > 0:
            return max(0, ecog_atual - 1)
        return ecog_atual

    def _verificar_constraints(
        self, p_tox, reserva, ecog, dose, acao, linha
    ) -> Dict:
        """Verifica todos os constraints para uma acao."""
        c_tox = p_tox <= self.LIMIAR_TOXICIDADE
        c_reserva = reserva >= self.LIMIAR_RESERVA_MINIMA
        c_ecog_intensificar = ecog <= self.ECOG_MAX_INTENSIFICAR
        c_dose = 0.0 <= dose <= 1.0

        # Constraint adicional: se ECOG >= 3, so permitir reduzir/observar
        c_ecog_critico = True
        if ecog >= 3:
            c_ecog_critico = acao in (AcaoTerapeutica.REDUZIR, AcaoTerapeutica.OBSERVAR)

        # Constraint: nao trocar linha se ja na linha 3+
        c_linha = not (acao == AcaoTerapeutica.TROCAR_LINHA and linha >= 3)

        todos = all([c_tox, c_reserva, c_ecog_critico, c_dose, c_linha])

        return {
            "toxicidade_ok": c_tox,
            "p_tox_valor": round(p_tox, 3),
            "reserva_ok": c_reserva,
            "reserva_valor": round(reserva, 3),
            "ecog_ok": c_ecog_critico,
            "ecog_valor": ecog,
            "dose_ok": c_dose,
            "linha_ok": c_linha,
            "ecog_pode_intensificar": c_ecog_intensificar,
            "todos_satisfeitos": todos,
        }

    # --- Funcoes de utilidade marginal ---

    def _utilidade_cura(self, p_cura: float) -> float:
        """
        Funcao de utilidade para P(cura).
        Concava: ganhos decrescentes acima de 0.30.
        U(P) = 1 - exp(-3 * P)
        """
        return 1.0 - np.exp(-3.0 * p_cura)

    def _utilidade_toxicidade(self, p_tox: float) -> float:
        """
        Funcao de utilidade para toxicidade (penalidade).
        Convexa: custo crescente acima de 0.40.
        U(P) = P^1.5
        """
        return float(p_tox ** 1.5)

    def _utilidade_qualidade(self, reserva: float, ecog: int) -> float:
        """
        Funcao de utilidade para qualidade de vida.
        Combina reserva organica e ECOG.
        U = 0.6 * reserva + 0.4 * (1 - ECOG/4)
        """
        componente_reserva = 0.6 * reserva
        componente_ecog = 0.4 * (1.0 - ecog / 4.0)
        return componente_reserva + componente_ecog

    def _modulacao_emocional(self, acao_otima, emocoes) -> float:
        """
        Ajusta a confianca na acao baseado no estado emocional do paciente.
        Ansiedade alta -> reduz agressividade (multiplica utilidade por < 1)
        Esperanca alta -> aumenta confianca (multiplica por > 1)
        """
        confianca = emocoes.confianca_interna()
        return 0.7 + 0.6 * confianca  # range: 0.7 a 1.3

    def _gerar_justificativa(self, otima: Dict, reserva: float, ecog: int) -> str:
        """Gera justificativa textual da decisao otima."""
        acao = otima["acao"]
        u_total = otima["utilidade_total"]
        p_cura = otima.get("p_cura_projetada", 0)
        p_tox = otima.get("p_tox_projetada", 0)
        constraints = otima["constraints"]

        partes = [f"Acao {acao.value} selecionada (U={u_total:.3f})."]

        if acao == AcaoTerapeutica.INTENSIFICAR:
            partes.append(f"P(cura) projetada: {p_cura:.1%} com P(tox): {p_tox:.1%}.")
            if constraints.get("ecog_pode_intensificar"):
                partes.append("Reserva organica e ECOG permitem intensificacao.")
        elif acao == AcaoTerapeutica.REDUZIR:
            if not constraints["toxicidade_ok"]:
                partes.append(f"Toxicidade projetada ({p_tox:.1%}) excede limiar seguro.")
            if reserva < 0.5:
                partes.append(f"Reserva organica baixa ({reserva:.1%}) exige reducao.")
        elif acao == AcaoTerapeutica.TROCAR_LINHA:
            partes.append("Eficacia clonal comprometida indica necessidade de mudanca de linha.")
        elif acao == AcaoTerapeutica.OBSERVAR:
            partes.append("Perfil de risco-beneficio favoravel a manutencao conservadora.")

        return " ".join(partes)

    @staticmethod
    def _agora_iso():
        import datetime
        return datetime.datetime.now().isoformat()

    def obter_resumo(self) -> Dict:
        """Retorna resumo das otimizacoes realizadas."""
        acoes_count = {}
        for h in self.historico_otimizacoes:
            acao = h.get("acao_otima", "desconhecida")
            acoes_count[acao] = acoes_count.get(acao, 0) + 1

        return {
            "total_otimizacoes": self.contador,
            "distribuicao_acoes": acoes_count,
            "utilidade_media": round(
                np.mean([h["utilidade_total"] for h in self.historico_otimizacoes[-50:]])
            ) if self.historico_otimizacoes else 0.0,
            "versao": "2.0.0",
        }