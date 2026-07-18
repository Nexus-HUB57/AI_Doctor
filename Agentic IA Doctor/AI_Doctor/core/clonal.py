import numpy as np

class DinamicaClonalResistencia:
    def __init__(self, proporcao_resistente_inicial=0.02, taxa_mutacao_tumoral=0.01):
        self.fracao_sensiveis = 1.0 - proporcao_resistente_inicial
        self.fracao_resistentes = proporcao_resistente_inicial
        self.exposicao_acumulada = 0.0
        self.taxa_mutacao = taxa_mutacao_tumoral
        self.historico_eficacia = [1.0]

    def aplicar_pressao(self, dose_aplicada, intensidade_toxicidade=0.8):
        morte_sensiveis = self.fracao_sensiveis * dose_aplicada * intensidade_toxicidade
        self.fracao_sensiveis = max(0.001, self.fracao_sensiveis - morte_sensiveis)
        fator_expansao = 1.0 + 0.08 * (1.0 - self.fracao_sensiveis)
        self.fracao_resistentes = min(1.0, self.fracao_resistentes * fator_expansao)
        self.fracao_resistentes += self.fracao_sensiveis * self.taxa_mutacao * dose_aplicada * 0.5
        self.fracao_resistentes = min(1.0, self.fracao_resistentes)
        total = self.fracao_sensiveis + self.fracao_resistentes + 1e-9
        self.fracao_sensiveis /= total
        self.fracao_resistentes /= total
        eficacia = self.fracao_sensiveis / (self.fracao_sensiveis + self.fracao_resistentes + 1e-9)
        self.historico_eficacia.append(eficacia)
        self.exposicao_acumulada += dose_aplicada
        return eficacia

    def eficacia_relativa(self):
        return self.historico_eficacia[-1] if self.historico_eficacia else 1.0

    def prever_resistencia_em(self, janela):
        if len(self.historico_eficacia) < 5:
            return 999
        import numpy as np
        tendencia = np.polyfit(range(len(self.historico_eficacia)), self.historico_eficacia, 1)[0]
        if tendencia >= 0:
            return 999
        t_falha = (0.2 - self.historico_eficacia[-1]) / tendencia
        return max(0, int(t_falha))
