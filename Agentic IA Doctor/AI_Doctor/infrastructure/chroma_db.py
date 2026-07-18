import numpy as np
import chromadb
from chromadb.config import Settings
from config import CONFIG

class BancoVetorialChromaDB:
    def __init__(self, colecao_nome="ai_doctor_tumores"):
        self.client = chromadb.Client(Settings(anonymized_telemetry=False))
        self.collection = self.client.get_or_create_collection(name=colecao_nome)

    def indexar_caso_clinico(self, caso_id, vetor, metadados):
        self.collection.upsert(ids=[caso_id], embeddings=[vetor.tolist()], metadatas=[metadados])

    def buscar_casos_analogos(self, vetor_consulta, top_k=5):
        if self.collection.count() == 0:
            return []
        resultados = self.collection.query(
            query_embeddings=[vetor_consulta.tolist()],
            n_results=min(top_k, self.collection.count())
        )
        casos = []
        if resultados and resultados['metadados']:
            for i, meta in enumerate(resultados['metadados'][0]):
                meta_copia = dict(meta)
                meta_copia['distancia'] = resultados['distances'][0][i] if 'distances' in resultados else 0.0
                casos.append(meta_copia)
        return casos
