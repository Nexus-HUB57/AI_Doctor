import numpy as np
import pandas as pd
import random
from collections import deque
from .genoma import ParadigmaTerapeuticoAvancado
from .clonal import DinamicaClonalResistencia
from .fisiologia import FisiologiaSistemica
from .emocao import EstadoEmocionalPaciente
from .memoria import MemoriaCasosClinicos
from .explicador import ExplicadorSHAPClinico
from .motor_probabilidade import ProbabilidadeTerapeutica
from .evidence_driven import EvidenceDrivenTherapy
from .otimizador_multiobjetivo import OtimizadorMultiObjetivo
from .clinical_validation import ClinicalValidationModule
from config import CONFIG

class AgenteOncologicoPrecisao:
    def __init__(self, df_historico, paradigma_inicial=None):
        self.df_historico = df_historico.copy()
        self.paradigma = paradigma_inicial if paradigma_inicial else ParadigmaTerapeuticoAvancado()

        self.clonal = DinamicaClonalResistencia(taxa_mutacao_tumoral=self.paradigma.taxa_mutacao_tumoral)
        self.fisiologia = FisiologiaSistemica()
        self.emocoes = EstadoEmocionalPaciente(self.paradigma)
        self.memoria = MemoriaCasosClinicos(self.df_historico, self, janela_max=CONFIG["RAG_JANELA_MAX"])

        self.matriz_probabilidade = {}
        self.memoria_acoes = deque(maxlen=500)
        self.estado_atual = None
        self.reserva_inicial = 100.0
        self.reserva_atuante = 100.0
        self.carga_terapeutica = 0.0
        self.historico_reserva = [100.0]
        self.dose_atual = 0.0
        self.linha_terapeutica = 0
        self.erros_consecutivos = 0
        self.total_mutacoes = 0
        self.ultimo_ciclo_mutacao = -100

        # === CAMADAS PROBABILISTICAS v2.0 ===
        self.motor_prob = ProbabilidadeTerapeutica()
        self.evidence_driven = EvidenceDrivenTherapy(self.motor_prob)
        self.otimizador = OtimizadorMultiObjetivo()
        self.cvm = ClinicalValidationModule()
        self.subtipo_tumoral = "NSCLC_KRAS_G12C"  # default
        self.ultimo_quadro_probabilistico = None
        self.ultima_validacao_cvm = None

        self._construir_matriz_empirica()

    # --- Percepção ---
    def _perceber_estado(self, row, paradigma_alvo=None):
        p = paradigma_alvo if paradigma_alvo else self.paradigma
        ctDNA = row.get('ctDNA', 0.5)
        CTC = row.get('CTC', 10)
        TMB = row.get('TMB', 8)
        PD_L1 = row.get('PD_L1', 0.2)
        TILs = row.get('TILs', 0.1)

        media_ctDNA = row.get('media_movel_ctDNA', ctDNA * 0.9)
        tendencia = "PROGRESSAO" if ctDNA > media_ctDNA else "REGRESSAO"

        if ctDNA > 0.7: pos_ct = 'ALTA_CTDNA'
        elif ctDNA < 0.2: pos_ct = 'BAIXA_CTDNA'
        else: pos_ct = 'MEDIA_CTDNA'

        if TMB > 15: tmb_status = 'ALTA_TMB'
        elif TMB < 5: tmb_status = 'BAIXA_TMB'
        else: tmb_status = 'MEDIA_TMB'

        agressividade = (PD_L1 * 0.3 + (1 - TILs) * 0.3 + (CTC / 50) * 0.4) * 100
        if agressividade > p.limiar_agressividade_sup:
            estado_ag = 'ALTA_AGRESSIVIDADE'
        elif agressividade < p.limiar_agressividade_inf:
            estado_ag = 'BAIXA_AGRESSIVIDADE'
        else:
            estado_ag = 'AGRESSIVIDADE_MODERADA'

        eficacia = self.clonal.eficacia_relativa()
        if eficacia > 0.7: status_eficacia = 'EFICAZ'
        elif eficacia > 0.4: status_eficacia = 'PARCIAL'
        else: status_eficacia = 'RESISTENTE'

        return f"{tendencia}|{pos_ct}|{tmb_status}|{estado_ag}|{status_eficacia}"

    # --- Atualização Incremental ---
    def _atualizar_indicadores_linha(self):
        if len(self.df_historico) < 35:
            return
        df_janela = self.df_historico.tail(35).copy()
        idx = self.df_historico.index[-1]
        for col in ['ctDNA', 'CTC', 'TMB', 'PD_L1', 'TILs']:
            if col in df_janela.columns:
                media = df_janela[col].rolling(20).mean()
                self.df_historico.loc[idx, f'media_movel_{col}'] = media.iloc[-1]

    # --- Matriz Empírica ---
    def _construir_matriz_empirica(self):
        df = self.df_historico
        estados = {}
        janela = self.paradigma.janela_prognostica
        limiar = 0.015
        for i in range(len(df) - janela - 1):
            estado = self._perceber_estado(df.iloc[i])
            var = (df.iloc[i + janela]['ctDNA'] - df.iloc[i]['ctDNA']) / (df.iloc[i]['ctDNA'] + 1e-9)
            if estado not in estados:
                estados[estado] = {'melhora': 0, 'piora': 0, 'estavel': 0}
            if var > limiar:
                estados[estado]['melhora'] += 1
            elif var < -limiar:
                estados[estado]['piora'] += 1
            else:
                estados[estado]['estavel'] += 1
        self.matriz_probabilidade.clear()
        for est, cont in estados.items():
            total = sum(cont.values())
            if total > 0:
                self.matriz_probabilidade[est] = {
                    'prob_melhora': cont['melhora'] / total,
                    'prob_piora': cont['piora'] / total,
                    'prob_estavel': cont['estavel'] / total,
                    'amostras': total
                }

    # --- Geração de Cenários (RAG + Monte Carlo) ---
    def _gerar_cenarios_prognosticos(self, row_atual):
        vetor_atual = np.array([
            row_atual.get('ctDNA', 0.5),
            np.log1p(row_atual.get('CTC', 10)) / 10.0,
            row_atual.get('TMB', 8) / 50.0,
            row_atual.get('PD_L1', 0.2),
            row_atual.get('TILs', 0.1)
        ])
        analogos = self.memoria.recuperar_analogos(vetor_atual, top_k=5)
        if analogos:
            prob_melhora_rag = sum(1 for a in analogos if a['desfecho'] > 0.015) / len(analogos)
            prob_piora_rag = sum(1 for a in analogos if a['desfecho'] < -0.015) / len(analogos)
        else:
            prob_melhora_rag = 0.33
            prob_piora_rag = 0.33

        volatilidade = max(0.005, row_atual.get('desvio_ctDNA', 0.01) / (row_atual.get('ctDNA', 0.5) + 1e-9))
        cenarios = []
        for _ in range(150):
            valor_sim = row_atual.get('ctDNA', 0.5)
            dose_sim = self.dose_atual * random.uniform(0.8, 1.2)
            for _ in range(self.paradigma.janela_prognostica):
                eficacia = self.clonal.aplicar_pressao(dose_sim, self.paradigma.toxicidade_da_droga)
                viés = (prob_melhora_rag - prob_piora_rag) * 0.005 * (1 + (1 - eficacia) * 0.5)
                ruido = np.random.normal(0, volatilidade)
                if random.random() < 0.04:
                    ruido *= 2.5
                valor_sim *= (1 + viés + ruido)
                valor_sim = max(0.01, valor_sim)
            cenarios.append((valor_sim - row_atual.get('ctDNA', 0.5)) / (row_atual.get('ctDNA', 0.5) + 1e-9))

        ciclos_ate_resistencia = self.clonal.prever_resistencia_em(self.paradigma.janela_prognostica)
        return {
            'prob_melhora_rag': prob_melhora_rag,
            'prob_piora_rag': prob_piora_rag,
            'prob_sim_melhora': sum(1 for x in cenarios if x > 0.015) / len(cenarios),
            'prob_sim_piora': sum(1 for x in cenarios if x < -0.015) / len(cenarios),
            'ciclos_ate_resistencia': ciclos_ate_resistencia,
            'cenarios': cenarios
        }

    # --- Decisão Bayesiana ---
    def _reagir(self, prob_emp, cenario):
        p_melhora_emp = prob_emp.get('prob_melhora', 0.33)
        p_piora_emp = prob_emp.get('prob_piora', 0.33)
        amostras = prob_emp.get('amostras', 0)
        peso_emp = min(0.7, amostras / 30.0)
        peso_rag = 1.0 - peso_emp

        p_melhora_rag = cenario['prob_melhora_rag']
        p_piora_rag = cenario['prob_piora_rag']

        prob_melhora_final = (p_melhora_emp * peso_emp) + (p_melhora_rag * peso_rag) * 0.6 + cenario['prob_sim_melhora'] * 0.4
        prob_piora_final = (p_piora_emp * peso_emp) + (p_piora_rag * peso_rag) * 0.6 + cenario['prob_sim_piora'] * 0.4

        fator_ansiedade = 1.0 - self.emocoes.ansiedade * 0.4
        fator_esperanca = 1.0 + self.emocoes.esperanca * 0.3

        prob_melhora_ajustada = prob_melhora_final * fator_ansiedade * fator_esperanca
        prob_piora_ajustada = prob_piora_final * fator_ansiedade / (fator_esperanca + 0.1)

        # Trava ECOG
        if self.fisiologia.ecog >= 3:
            if prob_piora_ajustada > 0.5:
                return 'REDUZIR', prob_piora_ajustada
            else:
                return 'OBSERVAR', 0.6

        # Resistência iminente
        if cenario['ciclos_ate_resistencia'] <= 3 and self.linha_terapeutica < 3:
            return 'TROCAR_LINHA', 0.85

        # Modo terapêutico
        if self.paradigma.modo_terapia == 'CONTER':
            if prob_melhora_ajustada > 0.5 and self.dose_atual < 0.6:
                return 'INTENSIFICAR_MODERADO', prob_melhora_ajustada
            elif prob_piora_ajustada > 0.6:
                return 'INTENSIFICAR', prob_piora_ajustada
            else:
                return 'MANTER_DOSE', 0.5
        else:
            if prob_melhora_ajustada > self.paradigma.confianca_minima and self.fisiologia.pode_intensificar():
                return 'INTENSIFICAR', prob_melhora_ajustada
            elif prob_piora_ajustada > self.paradigma.confianca_minima:
                return 'REDUZIR', prob_piora_ajustada
            else:
                if self.emocoes.curiosidade > 0.6 and random.random() < 0.1:
                    return 'INTENSIFICAR_MODERADO', 0.45
                return 'OBSERVAR', max(prob_melhora_ajustada, prob_piora_ajustada)

    # --- Avaliação Genética (para mutação) ---
    def _avaliar_protocolo(self, paradigma_candidato):
        df = self.df_historico.tail(200)
        score = 0
        acoes = 0
        janela = paradigma_candidato.janela_prognostica
        for i in range(len(df) - janela - 1):
            row = df.iloc[i]
            estado = self._perceber_estado(row, paradigma_alvo=paradigma_candidato)
            valor_atual = row.get('ctDNA', 0.5)
            valor_futuro = df.iloc[i + janela].get('ctDNA', 0.5)
            var_real = (valor_futuro - valor_atual) / (valor_atual + 1e-9)
            p_emp = self.matriz_probabilidade.get(estado, {'prob_melhora': 0.33, 'prob_piora': 0.33})
            if p_emp['prob_melhora'] > paradigma_candidato.confianca_minima:
                acoes += 1
                if var_real > 0.01:
                    score += 1.5
                else:
                    score -= 1.0
            elif p_emp['prob_piora'] > paradigma_candidato.confianca_minima:
                acoes += 1
                if var_real < -0.01:
                    score += 1.5
                else:
                    score -= 1.0
        fator_atividade = 1.0 if 5 <= acoes <= 40 else 0.5
        return score * fator_atividade

    # --- Reflexão e Auto-Cura ---
    def _refletir(self, acao, desfecho_real, ciclo_atual):
        max_reserva = max(self.historico_reserva)
        deterioracao = (max_reserva - self.historico_reserva[-1]) / max_reserva if max_reserva > 0 else 0
        vol_atual = self.df_historico.iloc[-1].get('desvio_ctDNA', 0.01) / (self.df_historico.iloc[-1].get('ctDNA', 0.5) + 1e-9)
        self.emocoes.atualizar(desfecho_real, 0.5, deterioracao, vol_atual)

        acertou = False
        if acao in ['INTENSIFICAR', 'INTENSIFICAR_MODERADO'] and desfecho_real > 0.01:
            acertou = True
        elif acao in ['REDUZIR', 'TROCAR_LINHA'] and desfecho_real < -0.01:
            acertou = True
        elif acao in ['OBSERVAR', 'MANTER_DOSE'] and abs(desfecho_real) <= 0.01:
            acertou = True

        if not acertou:
            self.erros_consecutivos += 1
        else:
            self.erros_consecutivos = 0

        mutacao_permitida = (ciclo_atual - self.ultimo_ciclo_mutacao) >= self.paradigma.cooldown_mutacoes
        if (self.erros_consecutivos >= 3 or
            deterioracao > self.paradigma.limiar_deterioracao or
            self.emocoes.ansiedade > 0.7 or
            self.clonal.eficacia_relativa() < 0.2) and mutacao_permitida:
            print(f"\n🧬 AUTO-CURA EVOLUTIVA ATIVADA!")
            print(f"   Erros consecutivos: {self.erros_consecutivos}")
            print(f"   Eficácia: {self.clonal.eficacia_relativa():.2f}")
            filhos = [self.paradigma.mutar() for _ in range(15)]
            melhor_filho = max(filhos, key=lambda p: self._avaliar_protocolo(p) * (1 - self.emocoes.ansiedade))
            self.paradigma = melhor_filho
            self._construir_matriz_empirica()
            self.memoria = MemoriaCasosClinicos(self.df_historico, self, janela_max=CONFIG["RAG_JANELA_MAX"])
            self.erros_consecutivos = 0
            self.total_mutacoes += 1
            self.ultimo_ciclo_mutacao = ciclo_atual
            print(f"   ✅ Novo paradigma adotado | Janela: {self.paradigma.janela_prognostica} | Modo: {self.paradigma.modo_terapia}")

    # --- Decisao com Camadas Probabilisticas (v2.0) ---
    def _decidir_com_camadas(self, prob_emp, cenarios, ultima_linha, ciclo_id):
        """
        Decide a acao terapeutica usando as 4 camadas probabilisticas.
        Fallback: se as camadas nao puderem calcular, usa o metodo legado.
        """
        try:
            # Preparar biomarcadores normalizados
            biomarcadores = {
                'ctDNA': float(ultima_linha.get('ctDNA', 0.5)),
                'CTC': float(ultima_linha.get('CTC', 10)),
                'TMB': float(ultima_linha.get('TMB', 8)),
                'PD_L1': float(ultima_linha.get('PD_L1', 0.2)),
                'TILs': float(ultima_linha.get('TILs', 0.1)),
            }

            reserva_media = float(np.mean([
                self.fisiologia.reserva_renal,
                self.fisiologia.reserva_hepatica,
                self.fisiologia.reserva_hematologica,
            ]))

            # CAMADA 1: Calcular probabilidades completas
            quadro_prob = self.motor_prob.calcular_completo(
                subtipo=self.subtipo_tumoral,
                linha=max(1, self.linha_terapeutica),
                biomarcadores=biomarcadores,
                dose_atual=self.dose_atual,
                reserva_fisiologica=reserva_media,
                ecog=self.fisiologia.ecog,
                eficacia_clonal=self.clonal.eficacia_relativa(),
                ciclo=ciclo_id,
            )

            self.ultimo_quadro_probabilistico = quadro_prob

            # CAMADA 3: Otimizar acao multi-objetivo
            resultado_otimizador = self.otimizador.otimizar_acao(
                probabilidades=quadro_prob,
                fisiologia=self.fisiologia,
                paradigma=self.paradigma,
                dose_atual=self.dose_atual,
                linha_atual=self.linha_terapeutica,
                eficacia_clonal=self.clonal.eficacia_relativa(),
                ciclo=ciclo_id,
                emocoes=self.emocoes,
            )

            acao = resultado_otimizador["acao_otima"]
            confianca = resultado_otimizador["utilidade_total"]

            # CAMADA 4: Validacao cientifica da decisao
            contexto_clinico = self.estado_atual or ""
            contexto_clinico += f" ctDNA={biomarcadores['ctDNA']:.2f}"
            contexto_clinico += f" TMB={biomarcadores['TMB']:.0f}"
            contexto_clinico += f" PD-L1={biomarcadores['PD_L1']:.1f}"

            validacao = self.cvm.validar_decisao(
                acao=acao,
                contexto_clinico=contexto_clinico,
                probabilidades=quadro_prob,
                subtipo=self.subtipo_tumoral,
                linha=max(1, self.linha_terapeutica),
            )

            self.ultima_validacao_cvm = validacao

            # Log probabilistico
            p_cura = quadro_prob["cura"]["probabilidade_cura"]
            p_resp = quadro_prob["resposta"]["probabilidade_resposta"]
            p_tox = quadro_prob["toxicidade"]["probabilidade_toxicidade_grave"]
            indice_ev = validacao["indice_evidencia"]
            print(f"   [v2.0] P(resp)={p_resp:.1%} P(cura)={p_cura:.1%} P(tox)={p_tox:.1%} "
                  f"IT={quadro_prob['indice_terapeutico']:.2f} Evidencia={indice_ev:.0f}/100 "
                  f"Acao={acao}")

            # Se a evidencia e INSUFICIENTE (< 40), aplicar cautela extra
            if validacao["classificacao"] == "INSUFICIENTE":
                if acao in ("INTENSIFICAR", "INTENSIFICAR_MODERADO"):
                    acao = "MANTER_DOSE"
                    print(f"   [CVM] Acao rebaixada para MANTER_DOSE (evidencia insuficiente)")

            return acao, confianca

        except Exception as e:
            # Fallback: usar metodo legado
            print(f"   [v2.0] Fallback para decisao legada: {e}")
            return self._reagir(prob_emp, cenarios)

    # --- Ciclo Principal (v2.0 com camadas probabilisticas) ---
    def executar_ciclo(self, nova_medicao, ciclo_id):
        self.df_historico.loc[len(self.df_historico)] = nova_medicao
        self._atualizar_indicadores_linha()
        ultima_linha = self.df_historico.iloc[-1]
        valor_atual = ultima_linha.get('ctDNA', 0.5)

        self.estado_atual = self._perceber_estado(ultima_linha)
        cenarios = self._gerar_cenarios_prognosticos(ultima_linha)
        prob_emp = self.matriz_probabilidade.get(self.estado_atual, {})

        # === DECISAO v2.0: Camadas Probabilisticas ===
        acao, confianca = self._decidir_com_camadas(
            prob_emp, cenarios, ultima_linha, ciclo_id
        )

        # Execução
        if acao == 'TROCAR_LINHA':
            self.linha_terapeutica += 1
            self.dose_atual = 0.3
            self.clonal = DinamicaClonalResistencia(taxa_mutacao_tumoral=self.paradigma.taxa_mutacao_tumoral)
            print(f"   🔄 Linha alterada para {self.linha_terapeutica}")
        elif acao == 'INTENSIFICAR':
            self.dose_atual = min(CONFIG["DOSE_MAXIMA"], self.dose_atual + CONFIG["FATOR_INTENSIFICAR"])
        elif acao == 'INTENSIFICAR_MODERADO':
            self.dose_atual = min(CONFIG["DOSE_MAXIMA"], self.dose_atual + CONFIG["FATOR_MODERADO"])
        elif acao == 'REDUZIR':
            self.dose_atual = max(CONFIG["DOSE_MINIMA"], self.dose_atual - CONFIG["FATOR_REDUZIR"])
        elif acao == 'MANTER_DOSE':
            pass
        else:  # OBSERVAR
            self.dose_atual = max(CONFIG["DOSE_MINIMA"], self.dose_atual - 0.02)

        eficacia = self.clonal.aplicar_pressao(self.dose_atual, self.paradigma.toxicidade_da_droga)
        self.fisiologia.atualizar_com_toxicidade(self.dose_atual, self.paradigma.toxicidade_da_droga)
        self.historico_reserva.append(self.reserva_atuante + self.carga_terapeutica * valor_atual)

        if len(self.df_historico) > self.paradigma.janela_prognostica + 1:
            valor_passado = self.df_historico.iloc[-self.paradigma.janela_prognostica - 1].get('ctDNA', 0.5)
            desfecho_real = (valor_atual - valor_passado) / (valor_passado + 1e-9)
            self._refletir(acao, desfecho_real, ciclo_id)
