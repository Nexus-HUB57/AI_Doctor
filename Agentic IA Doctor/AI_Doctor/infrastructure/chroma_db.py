import chromadb
from chromadb.config import Settings
from config import CONFIG
import os

class BancoVetorialChromaDB:
    def __init__(self, colecao_nome="ai_doctor_tumores"):
        # Detecta se está em ambiente Docker (host ChromaDB remoto)
        chroma_host = os.getenv("CHROMA_HOST")
        chroma_port = int(os.getenv("CHROMA_PORT", "8000"))

        if chroma_host:
            # Modo Docker: conectar ao ChromaDB remoto via HttpClient
            self.client = chromadb.HttpClient(
                host=chroma_host,
                port=chroma_port,
                settings=Settings(anonymized_telemetry=False)
            )
            self._remote = True
        else:
            # Modo local/desenvolvimento: PersistentClient embarcado
            persist_dir = CONFIG.get("CHROMA_PERSIST_DIR", "./chroma_db")
            os.makedirs(persist_dir, exist_ok=True)
            self.client = chromadb.PersistentClient(
                path=persist_dir,
                settings=Settings(anonymized_telemetry=False)
            )
            self._remote = False

        try:
            self.collection = self.client.get_or_create_collection(name=colecao_nome)
        except Exception as e:
            raise ConnectionError(
                f"Falha ao conectar ao ChromaDB "
                f"({'remoto ' + chroma_host if self._remote else 'local'}): {e}"
            )

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
        if resultados and resultados.get('metadatas'):
            for i, meta in enumerate(resultados['metadatas'][0]):
                meta_copia = dict(meta)
                meta_copia['distancia'] = resultados['distances'][0][i] if 'distances' in resultados else 0.0
                casos.append(meta_copia)
        return casos