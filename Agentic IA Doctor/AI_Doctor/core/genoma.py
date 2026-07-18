import numpy as np

class ParadigmaTerapeuticoAvancado:
    def __init__(self):
        self.limiar_agressividade_sup = 70.0
        self.limiar_agressividade_inf = 30.0
        self.limiar_variacao_biomarcador = 0.05
        self.janela_prognostica = 5
        self.tolerancia_toxicidade = 0.5
        self.limiar_deterioracao = 0.10
        self.confianca_minima = 0.55
        self.taxa_homeostase = 0.05
        self.exposicao_maxima = 0.75
        self.cooldown_mutacoes = 10
        self.modo_terapia = 'ERADICAR'
        self.limiar_resistencia_aceitavel = 0.3
        self.taxa_mutacao_tumoral = 0.01
        self.toxicidade_da_droga = 0.15

    def mutar(self):
        novo = ParadigmaTerapeuticoAvancado()
        novo.limiar_agressividade_sup = float(np.clip(
            self.limiar_agressividade_sup + np.random.normal(0, 2), 60, 85))
        novo.limiar_agressividade_inf = float(np.clip(
            self.limiar_agressividade_inf + np.random.normal(0, 2), 15, 40))
        novo.janela_prognostica = int(np.clip(
            self.janela_prognostica + round(np.random.normal(0, 1)), 2, 15))
        novo.tolerancia_toxicidade = float(np.clip(
            self.tolerancia_toxicidade + np.random.normal(0, 0.05), 0.1, 0.9))
        novo.confianca_minima = float(np.clip(
            self.confianca_minima + np.random.normal(0, 0.03), 0.4, 0.85))
        novo.taxa_homeostase = float(np.clip(
            self.taxa_homeostase + np.random.normal(0, 0.01), 0.01, 0.2))
        novo.exposicao_maxima = float(np.clip(
            self.exposicao_maxima + np.random.normal(0, 0.05), 0.3, 0.95))
        novo.cooldown_mutacoes = int(np.clip(
            self.cooldown_mutacoes + round(np.random.normal(0, 1)), 5, 25))
        novo.modo_terapia = self.modo_terapia if np.random.random() > 0.3 else (
            'CONTER' if self.modo_terapia == 'ERADICAR' else 'ERADICAR')
        novo.limiar_resistencia_aceitavel = float(np.clip(
            self.limiar_resistencia_aceitavel + np.random.normal(0, 0.05), 0.1, 0.8))
        novo.toxicidade_da_droga = float(np.clip(
            self.toxicidade_da_droga + np.random.normal(0, 0.02), 0.05, 0.4))
        return novo
