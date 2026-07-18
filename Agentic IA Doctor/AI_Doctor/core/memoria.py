import numpy as np
import pandas as pd
from collections import deque

class MemoriaCasosClinicos:
    def __init__(self, df_historico, organismo, janela_max=2000):
        self.organismo = organismo
        self.janela_max = janela_max
        self.vetores_casos = []
        self._indexar_historico(df_historico)

    def _indexar_historico(self, df):
        self.vetores_casos.clear()
        janela = self.organismo.paradigma.janela_prognostica
        inicio = max(10, len(df) - self.janela_max)
        for i in range(inicio, len(df) - janela - 1):
            row = df.iloc[i]
            ctDNA = row.get('ctDNA', 0.5)
            CTC = row.get('CTC', 10)
            TMB = row.get('TMB', 8)
            PD_L1 = row.get('PD_L1', 0.2)
            TILs = row.get('TILs', 0.1)
            vetor = np.array([
                ctDNA,
                np.log1p(CTC) / 10.0,
                TMB / 50.0,
                PD_L1,
                TILs
            ])
            ctDNA_futuro = df.iloc[i + janela].get('ctDNA', ctDNA)
            desfecho = (ctDNA_futuro - ctDNA) / (ctDNA + 1e-9)
            self.vetores_casos.append({'vetor': vetor, 'desfecho': desfecho})

    def recuperar_analogos(self, vetor_consulta, top_k=5):
        if not self.vetores_casos:
            return []
        distancias = []
        for item in self.vetores_casos:
            dist = np.linalg.norm(vetor_consulta - item['vetor'])
            distancias.append((dist, item))
        distancias.sort(key=lambda x: x[0])
        return [item for _, item in distancias[:top_k]]
