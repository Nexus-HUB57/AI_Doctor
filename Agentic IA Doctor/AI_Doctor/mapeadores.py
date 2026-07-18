from typing import Dict, Any

class MapeadorNCCNASCO:
    GUIAS = {
        "NSCLC_KRAS_G12C": {
            1: {"esquema": "Pembrolizumabe + Carboplatina + Pemetrexede", "classe": "Imunoterapia + Platina"},
            2: {"esquema": "Sotorasibe (960mg VO/dia)", "classe": "Inibidor Alvo KRAS G12C"},
            3: {"esquema": "Docetaxel + Ramucirumabe", "classe": "Antiangiogenica"}
        },
        "NSCLC_EGFR_MUTADO": {
            1: {"esquema": "Osimertinibe 80mg VO/dia", "classe": "Inibidor TKI EGFR 3a Geracao"},
            2: {"esquema": "Pembrolizumabe + Carboplatina + Pemetrexede", "classe": "Imunoterapia + Platina"},
            3: {"esquema": "Docetaxel + Ramucirumabe", "classe": "Antiangiogenica"}
        },
        "TRIPLO_NEGATIVO_MAMARIO": {
            1: {"esquema": "Pembrolizumabe + Paclitaxel Nab", "classe": "Imunoterapia + Quimio"},
            2: {"esquema": "Sacituzumabe Govitecan", "classe": "Conjugado Anticorpo-Farmaco (ADC)"},
            3: {"esquema": "Eribulina", "classe": "Quimioterapia Citotoxica"}
        }
    }

    @classmethod
    def selecionar_esquema(cls, subtipo: str, linha: int) -> Dict[str, Any]:
        target_subtipo = subtipo if subtipo in cls.GUIAS else "NSCLC_KRAS_G12C"
        target_linha = min(3, max(1, linha))
        return cls.GUIAS[target_subtipo][target_linha]