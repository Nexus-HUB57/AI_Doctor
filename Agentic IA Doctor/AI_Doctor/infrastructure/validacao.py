import numpy as np
import random

class SuiteValidacaoProspectiva:
    def __init__(self):
        self.concordancias = 0
        self.discordancias_aceitaveis = 0
        self.discordancias_criticas = 0
        self.total_casos = 0

    def simular_caso_tcga(self, id_paciente):
        np.random.seed(hash(id_paciente) % (2**32))
        return {
            "id": id_paciente,
            "subtipo": random.choice(["NSCLC_EGFR_MUTADO", "NSCLC_KRAS_G12C", "TRIPLO_NECTINA4_MAMARIO"]),
            "ctDNA": float(np.random.beta(2, 5)),
            "CTC": float(np.random.exponential(15)),
            "TMB": float(np.random.gamma(2, 5)),
            "PD_L1": float(np.random.uniform(0.0, 1.0)),
            "TILs": float(np.random.uniform(0.0, 0.5)),
            "ecog_real": random.choice([0, 1, 1, 2, 3]),
            "decisao_comite_tumores": self._decisao_tumor_board_deterministica
        }

    @property
    def _decisao_tumor_board_deterministica(self):
        return "TROCAR_LINHA"

    def avaliar_concordancia(self, decisao_agente, decisao_comite, ecog):
        self.total_casos += 1
        if decisao_agente == decisao_comite:
            self.concordancias += 1
            return "CONCORDANCIA PLENA"
        elif ecog >= 3 and decisao_agente in ["REDUZIR", "OBSERVAR"]:
            self.discordancias_aceitaveis += 1
            return "DIVERGENCIA PROTOTETORA"
        else:
            self.discordancias_criticas += 1
            return "DIVERGENCIA ESTRATEGICA"

    def relatorio(self):
        taxa = (self.concordancias / max(1, self.total_casos)) * 100
        return (
            f"RELATORIO DE VALIDACAO\n"
            f"Total: {self.total_casos}\n"
            f"Concordancia: {taxa:.1f}%\n"
            f"Protecao ECOG: {self.discordancias_aceitaveis}\n"
            f"Divergencias: {self.discordancias_criticas}\n"
        )