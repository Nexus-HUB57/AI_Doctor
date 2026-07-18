import numpy as np
import pandas as pd

class DinamicaClonalResistencia:
    def __init__(self):
        self.fracao_resistentes = 0.02
        self.historico_eficacia = [1.0]

    def aplicar_pressao(self, dose_aplicada: float) -> float:
        morte_sensiveis = (1.0 - self.fracao_resistentes) * dose_aplicada * 0.7
        self.fracao_resistentes = min(1.0, self.fracao_resistentes * (1.0 + 0.05 * dose_aplicada))
        eficacia = max(0.01, 1.0 - self.fracao_resistentes - (morte_sensiveis * 0.1))
        self.historico_eficacia.append(eficacia)
        return eficacia

class AgenteOncologicoPrecisao:
    def __init__(self, df_historico):
        self.df_historico = df_historico
        self.dose_atual = 0.3
        self.linha_terapeutica = 1
        self.estado_atual = "ESTÁVEL"
        self.clonal = DinamicaClonalResistencia()
        self.fisiologia = type('Phys', (), {'ecog': 0})()
        self.paradigma = type('Paradigm', (), {'modo_terapia': 'CONTER'})()

    def executar_ciclo(self, paciente_data: dict) -> str:
        self.fisiologia.ecog = int(paciente_data.get('ECOG', 0))
        ctdna = paciente_data.get('ctDNA', 0.5)
        
        # Proteção Orgânica Máxima (Travamento ECOG)
        if self.fisiologia.ecog >= 3:
            self.dose_atual = max(0.1, self.dose_atual - 0.15)
            conduta = "REDUZIR"
        elif ctdna > 0.6:
            self.dose_atual = min(1.0, self.dose_atual + 0.15)
            conduta = "INTENSIFICAR"
        else:
            conduta = "MANTER_DOSE"
            
        self.clonal.aplicar_pressao(self.dose_atual)
        self.estado_atual = f"ctDNA={ctdna:.2f}|ECOG={self.fisiologia.ecog}"
        return conduta
