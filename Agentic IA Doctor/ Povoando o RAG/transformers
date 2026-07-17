# embedding_model.py
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np

class ClinicalEmbedder:
    def __init__(self, model_name="emilyalsentzer/Bio_ClinicalBERT"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.eval()

    def embed_text(self, text):
        """Gera embedding para um texto clínico (ex: relatório de patologia)."""
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = self.model(**inputs)
        # Média dos tokens
        embedding = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()
        return embedding

    def embed_patient(self, patient_data):
        """Concatena dados clínicos em um texto e gera embedding."""
        # Cria um resumo textual
        texto = f"Paciente ECOG {patient_data.get('ECOG', 0)}, ctDNA {patient_data.get('ctDNA', 0.5):.2f}, TMB {patient_data.get('TMB', 8)} mut/Mb, PD-L1 {patient_data.get('PD_L1', 0.2):.2f}, linfócitos TILs {patient_data.get('TILs', 0.1):.2f}."
        return self.embed_text(texto)
