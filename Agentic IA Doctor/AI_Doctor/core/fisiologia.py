import numpy as np

class FisiologiaSistemica:
    def __init__(self, ecog_inicial=0, reserva_renal=1.0, reserva_hepatica=1.0, reserva_hematologica=1.0):
        self.ecog = ecog_inicial
        self.reserva_renal = reserva_renal
        self.reserva_hepatica = reserva_hepatica
        self.reserva_hematologica = reserva_hematologica
        self.toxicidade_acumulada = 0.0

    def atualizar_com_toxicidade(self, dose_acumulada, toxicidade_da_droga=0.1):
        degradacao = dose_acumulada * toxicidade_da_droga
        self.reserva_renal = max(0.0, self.reserva_renal - degradacao * 0.4)
        self.reserva_hepatica = max(0.0, self.reserva_hepatica - degradacao * 0.3)
        self.reserva_hematologica = max(0.0, self.reserva_hematologica - degradacao * 0.3)
        self.toxicidade_acumulada = 1.0 - np.mean([self.reserva_renal, self.reserva_hepatica, self.reserva_hematologica])
        reserva_media = np.mean([self.reserva_renal, self.reserva_hepatica, self.reserva_hematologica])
        if reserva_media < 0.5:
            self.ecog = min(4, self.ecog + 1)
        elif reserva_media > 0.7 and self.ecog > 0:
            self.ecog = max(0, self.ecog - 1)

    def pode_intensificar(self):
        return self.ecog <= 2 and self.reserva_renal > 0.3 and self.reserva_hepatica > 0.3 and self.reserva_hematologica > 0.3

    def fator_ajuste_dose(self):
        return max(0.3, np.mean([self.reserva_renal, self.reserva_hepatica, self.reserva_hematologica]))
