import numpy as np
import pandas as pd
import chromadb
import torch
from transformers import AutoTokenizer, AutoModel
from config import CONFIG

class ClinicalEmbedder:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained("emilyalsentzer/Bio_ClinicalBERT")
        self.model = AutoModel.from_pretrained("emilyalsentzer/Bio_ClinicalBERT")
        self.model.eval()

    def embed_patient(self, patient_data: dict) -> np.ndarray:
        text = f"Paciente ECOG {patient_data.get('ECOG', 0)}. ctDNA {patient_data.get('ctDNA', 0.5):.2f}, TMB {patient_data.get('TMB', 8):.1f} mut/Mb, PD-L1 {patient_data.get('PD_L1', 0.2):.2f}."
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = self.model(**inputs)
        return outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

class VetorStoreRAG:
    def __init__(self):
        self.embedder = ClinicalEmbedder()
        self.client = chromadb.PersistentClient(path=CONFIG["CHROMA_DB_PATH"])
        self.collection = self.client.get_or_create_collection(name="casos_oncologicos")

    def adicionar_casos(self, df: pd.DataFrame):
        ids = df['patient_id'].astype(str).tolist()
        embeddings = [self.embedder.embed_patient(row.to_dict()).tolist() for _, row in df.iterrows()]
        metadados = df[['ECOG', 'outcome', 'ctDNA']].to_dict('records')
        self.collection.add(ids=ids, embeddings=embeddings, metadatas=metadados)
