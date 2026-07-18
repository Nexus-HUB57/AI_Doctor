import numpy as np

class EstadoEmocionalPaciente:
    def __init__(self, paradigma):
        self.ansiedade = 0.1
        self.esperanca = 0.1
        self.curiosidade = 0.5
        self.estresse = 0.0
        self.paradigma = paradigma

    def atualizar(self, desfecho_real, volatilidade_clinica, deterioracao_atual, variacao_biomarcador):
        if desfecho_real < -0.01:
            self.ansiedade = min(1.0, self.ansiedade + 0.25)
            self.esperanca = max(0.0, self.esperanca - 0.2)
        elif desfecho_real > 0.01:
            self.esperanca = min(1.0, self.esperanca + 0.2)
            self.ansiedade = max(0.0, self.ansiedade - 0.15)
        self.estresse = min(1.0, deterioracao_atual * 3.0 + volatilidade_clinica * 2.0)
        taxa = self.paradigma.taxa_homeostase
        self.ansiedade = max(0.0, self.ansiedade - taxa)
        self.esperanca = max(0.0, self.esperanca - taxa)
        self.curiosidade = float(np.clip(self.curiosidade + np.random.normal(0, 0.05), 0.1, 0.9))

    def confianca_interna(self):
        return max(0.0, (1.0 - self.ansiedade) * 0.6 + self.esperanca * 0.4 - self.estresse * 0.3)
