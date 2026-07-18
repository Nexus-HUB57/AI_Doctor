"""
DIMHEX — Orquestrador de Auto Sabedoria Exponencial

Motor de inteligência que transforma achados brutos de pesquisa em sabedoria
clínica profundamente conectada, alimentando todo o ecossistema Doctor AI.

Princípios:
1. COMPREENSÃO PROFUNDA: Não apenas indexa — compreende relações entre achados
2. DEDUPLICAÇÃO SEMÂNTICA: Artigos duplicados ou redundantes são fundidos
3. SÍNTESE CRUZADA: Conecta achados de fontes diferentes sobre o mesmo tema
4. ENRIQUECIMENTO EXPONENCIAL: Cada ciclo gera mais sabedoria que o anterior
5. FEEDBACK LOOP: Insights do agente oncológico geram novas queries de busca
6. MEMÓRIA SEMÂNTICA: Embeddings TF-IDF avançados com n-gramas médicos

Fluxo de Auto Sabedoria:
  Pesquisa Bruta → Limpeza → Deduplicação → Embedding → Síntese Cruzada
  → Geração de Hipóteses → Feedback para Busca → Enriquecimento do Agente
"""

import re
import math
import hashlib
import json
import datetime
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Tuple, Any

import numpy as np

from infrastructure.knowledge_updater import AtualizadorBaseConhecimento
from infrastructure.chroma_db import BancoVetorialChromaDB
from config import CONFIG


# === VOCABULÁRIO MÉDICO ESTRUTURADO ===
# Termos-chave com pesos semânticos para o domínio oncológico

VOCABULARIO_MEDICO = {
    # Biomarcadores líquidos
    "ctdna": 3.0, "circulating tumor dna": 3.0, "liquid biopsy": 2.8,
    "minimal residual disease": 2.5, "mrd": 2.0,
    "circulating tumor cell": 2.5, "ctc": 2.5,
    "cell-free dna": 2.0, "cfdna": 2.0,

    # Biomarcadores teciduais
    "tumor mutational burden": 2.5, "tmb": 2.5,
    "microsatellite instability": 2.0, "msi": 1.5, "msi-h": 2.0,
    "pdl1": 3.0, "pd-l1": 3.0, "pd-1": 2.5, "programmed death": 2.0,
    "checkpoint inhibitor": 2.0, "immune checkpoint": 2.0,
    "tumor infiltrating lymphocyte": 2.5, "tils": 2.5, "til": 2.0,

    # Mutações driver
    "kras": 2.5, "g12c": 2.5, "kras g12c": 3.0,
    "egfr": 2.5, "egfr mutation": 2.8, "egfr mutated": 2.5,
    "alk": 2.0, "ros1": 2.0, "braf": 2.0, "ntrk": 2.0,
    "her2": 2.0, "pi3k": 1.5, "tp53": 1.5,

    # Subtipos tumorais
    "nsclc": 2.5, "non-small cell lung": 2.5, "lung cancer": 2.0,
    "triple negative breast": 2.5, "tnbc": 2.5, "breast cancer": 2.0,
    "colorectal cancer": 1.5, "melanoma": 1.5, "renal cell": 1.5,

    # Modalidades terapêuticas
    "immunotherapy": 2.5, "checkpoint blockade": 2.0,
    "car-t": 3.0, "car-t cell": 3.0, "chimeric antigen": 2.5,
    "antibody drug conjugate": 2.5, "adc": 2.0,
    "targeted therapy": 2.0, "kinase inhibitor": 2.0, "tki": 1.5,
    "neoadjuvant": 2.0, "adjuvant": 1.5, "first-line": 1.5,
    "adaptive therapy": 2.5, "evolutionary therapy": 2.0,
    "combination therapy": 1.5, "sequential therapy": 1.5,

    # DIMHEX / Protocolo
    "apheresis": 2.0, "extracorporeal": 2.5, "hemodialysis": 1.5,
    "leukocyte": 1.5, "immune cell therapy": 2.0,
    "blood fractionation": 1.5, "immune potentiation": 2.0,
    "reinfusion": 1.5, "extracorporeal circulation": 2.0,

    # Sistema Fênix
    "crispr": 3.0, "gene editing": 2.5,
    "mrna vaccine": 3.0, "personalized vaccine": 2.5,
    "digital twin": 2.5, "clonal evolution": 2.0,
    "cytokine engineering": 2.0, "tumor microenvironment": 2.0,
    "treg depletion": 2.0, "cd34": 1.5,

    # Desfechos clínicos
    "overall survival": 2.5, "os": 1.0,
    "progression free survival": 2.5, "pfs": 1.0,
    "response rate": 2.0, "orr": 1.5,
    "complete response": 2.5, "partial response": 1.5,
    "pathological complete response": 2.5, "pcr": 1.0,
    "hazard ratio": 2.0, "hr": 0.5,
    "overall response rate": 2.0,

    # Metodologia
    "randomized": 2.0, "double blind": 2.0, "multicenter": 1.5,
    "phase 3": 2.0, "phase iii": 2.0, "phase 2": 1.5,
    "meta-analysis": 2.5, "systematic review": 2.5,
    "real-world evidence": 2.0, "prospective cohort": 1.5,

    # AI/Machine Learning
    "machine learning": 2.0, "deep learning": 2.0,
    "neural network": 1.5, "bayesian": 2.0,
    "explainable ai": 2.0, "xai": 1.5,
    "clinical decision support": 2.0, "predictive model": 2.0,
}

# N-gramas compostos para capturar relações entre termos
BIGRAMAS_MEDICOS = [
    ("immune", "checkpoint"), ("car", "cell"), ("antibody", "drug"),
    ("conjugate", "oncology"), ("tumor", "mutational"), ("circulating", "tumor"),
    ("minimal", "residual"), ("triple", "negative"), ("non-small", "cell"),
    ("overall", "survival"), ("progression", "free"), ("complete", "response"),
    ("hazard", "ratio"), ("phase", "iii"), ("randomized", "controlled"),
    ("digital", "twin"), ("gene", "editing"), ("mrna", "vaccine"),
    ("extracorporeal", "blood"), ("immune", "potentiation"),
    ("clonal", "evolution"), ("tumor", "microenvironment"),
    ("cytokine", "engineering"), ("treg", "depletion"),
]


class GeradorEmbeddingAvancado:
    """
    Gerador de embeddings semânticos avançados usando TF-IDF
    com vocabulário médico estruturado e n-gramas.

    Diferencial do embedding básico:
    - TF-IDF real com IDF calculado dinamicamente
    - N-gramas médicos (bigramas) para capturar relações
    - Normalização L2 e dimensionamento para 128 dimensões
    - Suporte a增量 learning (vocabulário cresce com o tempo)
    """

    DIM_EMBEDDING = 128

    def __init__(self):
        self.vocabulario = dict(VOCABULARIO_MEDICO)  # Cópia mutável
        self.bigramas = list(BIGRAMAS_MEDICOS)
        self.idf = {}  # Inverse Document Frequency
        self._num_documentos = 0
        self._df = Counter()  # Document frequency por termo

    def _tokenizar(self, texto: str) -> List[str]:
        """Tokenização com normalização médica."""
        texto = texto.lower().strip()
        # Preservar hífens e caracteres relevantes
        texto = re.sub(r'[^a-z0-9\-]', ' ', texto)
        tokens = texto.split()
        return [t for t in tokens if len(t) > 1]

    def _extrair_bigramas(self, tokens: List[str]) -> List[str]:
        """Extrai bigramas médicos relevantes."""
        bigramas = []
        for i in range(len(tokens) - 1):
            par = (tokens[i], tokens[i + 1])
            if par in self.bigramas or (par[0], par[1]) in self.bigramas:
                bigramas.append(f"{par[0]}_{par[1]}")
        return bigramas

    def atualizar_idf(self, documentos: List[str]):
        """Atualiza IDF com base em um corpus de documentos."""
        self._num_documentos += len(documentos)
        for doc in documentos:
            tokens_vistos = set()
            tokens = self._tokenizar(doc)
            bigramas = self._extrair_bigramas(tokens)
            for t in tokens + bigramas:
                if t not in tokens_vistos:
                    self._df[t] += 1
                    tokens_vistos.add(t)

        # Calcular IDF
        for termo, df in self._df.items():
            self.idf[termo] = math.log(1 + self._num_documentos / (1 + df))

    def gerar_embedding(self, texto: str, metadados: Dict = None) -> np.ndarray:
        """
        Gera embedding TF-IDF de 128 dimensões para um documento.
        Combina unigramas + bigramas + sinais de metadados.
        """
        embedding = np.zeros(self.DIM_EMBEDDING, dtype=np.float32)
        tokens = self._tokenizar(texto)
        bigramas = self._extrair_bigramas(tokens)
        todos_termos = tokens + bigramas

        # TF (Term Frequency) local
        tf = Counter(todos_termos)
        max_tf = max(tf.values()) if tf else 1

        # TF-IDF + hash para posição no vetor
        for termo, freq in tf.items():
            tf_norm = 0.5 + 0.5 * freq / max_tf  # Normalização log

            # Peso do vocabulário médico (se existir)
            peso_vocab = self.vocabulario.get(termo, 1.0)

            # IDF (fallback = 1.0 se não calculado)
            idf = self.idf.get(termo, 1.0)

            # Score composto
            score = tf_norm * peso_vocab * idf

            # Hash para posição no embedding
            hash_val = int(hashlib.md5(termo.encode()).hexdigest(), 16)
            posicao = hash_val % self.DIM_EMBEDDING
            embedding[posicao] += score

            # Posição secundária para redução de colisões
            posicao_2 = (hash_val >> 8) % self.DIM_EMBEDDING
            embedding[posicao_2] += score * 0.3

        # Sinais de metadados (enriquecem o embedding)
        if metadados:
            if metadados.get("classificacao") == "critico":
                embedding[0] += 2.0
            elif metadados.get("classificacao") == "alto":
                embedding[0] += 1.0

            score_dimhex = float(metadados.get("score_dimhex", 0))
            embedding[1] += score_dimhex * 2.0

            # Codificar fonte
            fonte = metadados.get("fonte", "")
            hash_fonte = int(hashlib.md5(fonte.encode()).hexdigest(), 16)
            embedding[2] = (hash_fonte % 100) / 100.0

            # Tipo de publicação
            tipo = metadados.get("tipo", "")
            if "ensaio" in tipo.lower():
                embedding[3] += 1.5
            elif "meta" in tipo.lower():
                embedding[3] += 1.8

        # Normalização L2
        norma = np.linalg.norm(embedding)
        if norma > 0:
            embedding = embedding / norma

        return embedding

    def similaridade_cosseno(self, emb_a: np.ndarray, emb_b: np.ndarray) -> float:
        """Calcula similaridade de cosseno entre dois embeddings."""
        produto = np.dot(emb_a, emb_b)
        norma_a = np.linalg.norm(emb_a)
        norma_b = np.linalg.norm(emb_b)
        if norma_a == 0 or norma_b == 0:
            return 0.0
        return float(produto / (norma_a * norma_b))

    def expandir_vocabulario(self, novos_termos: Dict[str, float]):
        """Expande o vocabulário com termos descobertos pela auto sabedoria."""
        for termo, peso in novos_termos.items():
            if termo not in self.vocabulario:
                self.vocabulario[termo] = peso
                print(f"   [Vocabulário] +{termo} (peso={peso:.1f})")


class DuplicadorSemantico:
    """
    Motor de deduplicação semântica de documentos.
    Identifica artigos duplicados, versões pré-print vs publicadas,
    e estudos redundantes que reportam os mesmos dados.
    """

    LIMIAR_DUPLICATA_EXATA = 0.95
    LIMIAR_DUPLICATA_PROVAVEL = 0.85
    LIMIAR_SIMILAR_REDUNDANTE = 0.75

    def __init__(self, gerador_embedding: GeradorEmbeddingAvancado):
        self.gerador = gerador_embedding
        self._cache_embeddings: Dict[str, np.ndarray] = {}
        self._cache_titulos: Dict[str, str] = {}

    def _normalizar_titulo(self, titulo: str) -> str:
        """Normaliza título para comparação: remove pontuação, lower, strip."""
        titulo = re.sub(r'[^a-z0-9\s]', '', titulo.lower().strip())
        return re.sub(r'\s+', ' ', titulo)

    def detectar_duplicatas(self, achados: List[Dict]) -> Tuple[List[Dict], List[Dict], Dict]:
        """
        Detecta duplicatas em uma lista de achados.

        Retorna:
        - unicos: lista de achados únicos (melhor versão de cada grupo)
        - duplicatas: lista de achados removidos como duplicatas
        - grupos: dicionário mapeando id_canonico -> lista de ids duplicatas
        """
        unicos = []
        duplicatas = []
        grupos = {}
        ids_processados = set()

        for achado in achados:
            id_atual = achado.get("id_dimhex", "")
            if id_atual in ids_processados:
                continue

            titulo_norm = self._normalizar_titulo(achado.get("titulo", ""))
            self._cache_titulos[id_atual] = titulo_norm

            # Gerar embedding para este achado
            texto_completo = f"{achado.get('titulo', '')} {achado.get('resumo', '')[:300]}"
            emb_atual = self.gerador.gerar_embedding(texto_completo, achado)
            self._cache_embeddings[id_atual] = emb_atual

            # Comparar com todos os já aceitos
            duplicata_de = None
            melhor_similaridade = 0.0

            for aceito in unicos:
                id_aceito = aceito.get("id_dimhex", "")
                emb_aceito = self._cache_embeddings.get(id_aceito)

                if emb_aceito is None:
                    continue

                # Comparação por título (rápida)
                titulo_aceito = self._cache_titulos.get(id_aceito, "")
                if titulo_norm == titulo_aceito:
                    duplicata_de = id_aceito
                    melhor_similaridade = 1.0
                    break

                # Jaccard de palavras no título
                palavras_atual = set(titulo_norm.split())
                palavras_aceito = set(titulo_aceito.split())
                intersecao = palavras_atual & palavras_aceito
                uniao = palavras_atual | palavras_aceito
                jaccard = len(intersecao) / max(1, len(uniao))

                if jaccard > 0.85:
                    duplicata_de = id_aceito
                    melhor_similaridade = jaccard
                    break

                # Similaridade de cosseno dos embeddings
                sim = self.gerador.similaridade_cosseno(emb_atual, emb_aceito)
                if sim > self.LIMIAR_DUPLICATA_PROVAVEL:
                    if sim > melhor_similaridade:
                        duplicata_de = id_aceito
                        melhor_similaridade = sim

            if duplicata_de:
                duplicatas.append(achado)
                ids_processados.add(id_atual)
                if duplicata_de not in grupos:
                    grupos[duplicata_de] = []
                grupos[duplicata_de].append(id_atual)
            else:
                unicos.append(achado)
                ids_processados.add(id_atual)

        return unicos, duplicatas, grupos

    def fundir_duplicatas(self, canonico: Dict, duplicata: Dict) -> Dict:
        """
        Funde metadados de uma duplicata no artigo canônico,
        preservando a versão mais completa.
        """
        fundido = dict(canonico)

        # Manter o resumo mais longo
        resumo_canon = canonico.get("resumo", "")
        resumo_dup = duplicata.get("resumo", "")
        if len(resumo_dup) > len(resumo_canon):
            fundido["resumo"] = resumo_dup

        # Combinar fontes
        fontes = [canonico.get("fonte", ""), duplicata.get("fonte", "")]
        fontes_unicas = [f for f in fontes if f]
        if len(fontes_unicas) > 1:
            fundido["fonte"] = f"{fontes_unicas[0]} + {fontes_unicas[1]}"

        # Manter o DOI se o canônico não tem
        if not fundido.get("doi") and duplicata.get("doi"):
            fundido["doi"] = duplicata["doi"]

        # Combinar URLs
        urls = [canonico.get("url", ""), duplicata.get("url", "")]
        urls_validas = [u for u in urls if u and u != canonico.get("url", "")]
        if urls_validas:
            fundido["urls_alternativas"] = urls_validas

        # Manter a data mais recente
        data_canon = canonico.get("data_publicacao", "")
        data_dup = duplicata.get("data_publicacao", "")
        if data_dup > data_canon:
            fundido["data_publicacao"] = data_dup

        return fundido


class SintetizadorCruzado:
    """
    Sintetiza conexões entre achados de fontes diferentes.
    Gera "sínteses cruzadas" — insights que só emergem quando
    achados de múltiplas fontes são analisados conjuntamente.

    Exemplo: PubMed tem o ensaio clínico, Google Scholar tem a meta-análise,
    ClinicalTrials tem o ensaio em andamento → síntese: "Convergência de
    evidência para tratamento X com 3 níveis de suporte"
    """

    def __init__(self, gerador_embedding: GeradorEmbeddingAvancado):
        self.gerador = gerador_embedding

    def sintetizar(self, achados_unicos: List[Dict]) -> List[Dict]:
        """
        Analisa achados e gera sínteses cruzadas.
        Agrupa por tema e identifica padrões multi-fonte.
        """
        sinteses = []

        # Agrupar por biomarcadores mencionados
        grupos_biomarcador = defaultdict(list)
        for achado in achados_unicos:
            for bm in achado.get("_biomarcadores", []):
                grupos_biomarcador[bm].append(achado)

        # Agrupar por subtipos
        grupos_subtipo = defaultdict(list)
        for achado in achados_unicos:
            for st in achado.get("_subtipos", []):
                grupos_subtipo[st].append(achado)

        # Síntese 1: Convergência de evidência por biomarcador
        for bm, achados in grupos_biomarcador.items():
            if len(achados) < 2:
                continue

            fontes = set(a.get("_fonte_original", a.get("fonte", "")) for a in achados)
            scores = [a.get("_score_dimhex", 0) for a in achados]
            score_medio = np.mean(scores)
            score_max = max(scores)

            if len(fontes) >= 2 and score_medio >= 0.35:
                sintese = {
                    "tipo": "convergencia_evidencia",
                    "biomarcador": bm,
                    "fontes_convergentes": list(fontes),
                    "qtd_achados": len(achados),
                    "score_medio": round(float(score_medio), 3),
                    "score_max": round(float(score_max), 3),
                    "niveau_evidencia": self._classificar_nivel(len(fontes), score_medio, len(achados)),
                    "resumo": (
                        f"Convergência de {len(achados)} achados de {len(fontes)} fontes "
                        f"sobre {bm}. Score médio: {score_medio:.2f}. "
                        f"Nível: {self._classificar_nivel(len(fontes), score_medio, len(achados))}."
                    ),
                    "ids_relacionados": [a.get("id_dimhex", "") for a in achados[:5]],
                }
                sinteses.append(sintese)

        # Síntese 2: Temas quentes (alta concentração recente)
        temas_quentes = self._identificar_temas_quentes(achados_unicos)
        sinteses.extend(temas_quentes)

        # Síntese 3: Gaps de evidência (biomarcadores sem cobertura)
        gaps = self._identificar_gaps(achados_unicos)
        sinteses.extend(gaps)

        # Síntese 4: Padrões terapêuticos emergentes
        padroes = self._identificar_padroes_terapeuticos(achados_unicos)
        sinteses.extend(padroes)

        # Ordenar por relevância
        sinteses.sort(key=lambda x: {
            "convergencia_evidencia": 0,
            "tema_quente": 1,
            "gap_evidencia": 2,
            "padrao_terapeutico": 1,
        }.get(x.get("tipo", ""), 3))

        return sinteses[:15]

    def _classificar_nivel(self, n_fontes: int, score_medio: float, n_achados: int) -> str:
        """Classifica o nível de convergência da evidência."""
        if n_fontes >= 3 and score_medio >= 0.6 and n_achados >= 5:
            return "CONVERGENCIA_FORTE"
        elif n_fontes >= 2 and score_medio >= 0.4:
            return "CONVERGENCIA_MODERADA"
        elif n_fontes >= 2:
            return "CONVERGENCIA_INICIAL"
        return "SINAL_ISOLADO"

    def _identificar_temas_quentes(self, achados: List[Dict]) -> List[Dict]:
        """Identifica temas com alta concentração de achados recentes."""
        temas = Counter()
        for achado in achados:
            titulo = achado.get("titulo", "").lower()
            for termo_chave in [
                "crispr", "mrna", "car-t", "adc", "liquid biopsy",
                "adaptive therapy", "digital twin", "extracorporeal",
                "treg", "cytokine", "apheresis",
            ]:
                if termo_chave in titulo:
                    temas[termo_chave] += 1

        temas_quentes = []
        for tema, contagem in temas.most_common(5):
            if contagem >= 2:
                temas_quentes.append({
                    "tipo": "tema_quente",
                    "tema": tema,
                    "frequencia": contagem,
                    "resumo": f"Tema emergente: '{tema}' mencionado em {contagem} achados",
                    "severidade": "critica" if contagem >= 4 else "alta",
                })
        return temas_quentes

    def _identificar_gaps(self, achados: List[Dict]) -> List[Dict]:
        """Identifica biomarcadores com pouca cobertura de evidência."""
        todos_biomarcadores = {
            "ctdna", "ctc", "tmb", "pdl1", "tils", "ecog", "resistencia"
        }
        biomarcadores_cobertos = set()
        for achado in achados:
            for bm in achado.get("_biomarcadores", []):
                biomarcadores_cobertos.add(bm.lower())

        gaps = todos_biomarcadores - biomarcadores_cobertos
        gap_list = []
        for bm in gaps:
            gap_list.append({
                "tipo": "gap_evidencia",
                "biomarcador": bm.upper(),
                "resumo": (
                    f"Gap de evidência: nenhum achado relevante sobre {bm.upper()} neste ciclo. "
                    f"Considerar ampliar termos de busca para este biomarcador."
                ),
                "severidade": "moderada",
            })
        return gap_list

    def _identificar_padroes_terapeuticos(self, achados: List[Dict]) -> List[Dict]:
        """Identifica padrões terapêuticos emergentes nos achados."""
        padroes = []

        # Buscar menções a tratamentos específicos em alto-relevância
        tratamentos_mencionados = Counter()
        for achado in achados:
            if achado.get("_score_dimhex", 0) >= 0.4:
                texto = f"{achado.get('titulo', '')} {achado.get('resumo', '')}".lower()
                for tratamento in [
                    "pembrolizumab", "nivolumab", "sotorasib", "osimertinib",
                    "sacituzumab", "trastuzumab", "docetaxel", "carboplatin",
                    "adaptive therapy", "combination immunotherapy",
                ]:
                    if tratamento in texto:
                        tratamentos_mencionados[tratamento] += 1

        for tratamento, freq in tratamentos_mencionados.most_common(3):
            if freq >= 2:
                padroes.append({
                    "tipo": "padrao_terapeutico",
                    "tratamento": tratamento,
                    "frequencia": freq,
                    "resumo": (
                        f"Padrão terapêutico: '{tratamento}' aparece em {freq} achados "
                        f"de alta relevância. Sinal de consolidação como padrão."
                    ),
                    "severidade": "alta",
                })

        return padroes


class GeradorHipoteses:
    """
    Gera hipóteses de pesquisa automaticamente a partir dos achados.
    Estas hipóteses alimentam o feedback loop — gerando novas queries
    de busca para o próximo ciclo DIMHEX.

    A auto sabedoria é EXPOENCIAL porque:
    - Ciclo 1: busca inicial com 20 termos
    - Ciclo 2: +5 termos gerados pelas hipóteses do ciclo 1
    - Ciclo N: vocabulário expandido exponencialmente
    """

    def __init__(self, gerador_embedding: GeradorEmbeddingAvancado):
        self.gerador = gerador_embedding
        self._historico_hipoteses: List[Dict] = []
        self._queries_geradas: List[str] = []

    def gerar_hipoteses(self, achados: List[Dict], sinteses: List[Dict]) -> List[Dict]:
        """
        Gera hipóteses de pesquisa a partir de achados e sínteses.
        Cada hipótese inclui uma query sugerida para o próximo ciclo.
        """
        hipoteses = []
        novas_queries = []

        # Hipótese 1: Termos de alto impacto sem cobertura suficiente
        termos_alta_freq = Counter()
        for achado in achados:
            texto = f"{achado.get('titulo', '')} {achado.get('resumo', '')}".lower()
            for termo, peso in VOCABULARIO_MEDICO.items():
                if peso >= 2.5 and termo in texto:
                    termos_alta_freq[termo] += 1

        # Termos frequentes que podem gerar buscas mais específicas
        for termo, freq in termos_alta_freq.most_common(5):
            if freq >= 3:
                # Criar query mais específica
                query = f"{termo} clinical outcome 2024"
                if query not in self._queries_geradas:
                    hipotese = {
                        "tipo": "profundacao",
                        "termo_base": termo,
                        "frequencia_ciclo": freq,
                        "query_sugerida": query,
                        "justificativa": (
                            f"Termo '{termo}' aparece em {freq} achados. "
                            f"Buscar especificamente por desfechos clínicos para "
                            f"alimentar o motor de probabilidade terapêutica."
                        ),
                    }
                    hipoteses.append(hipotese)
                    novas_queries.append(query)

        # Hipótese 2: A partir de gaps de evidência
        for sintese in sinteses:
            if sintese.get("tipo") == "gap_evidencia":
                bm = sintese["biomarcador"]
                query = f"{bm} biomarker cancer treatment 2024"
                if query not in self._queries_geradas:
                    hipotese = {
                        "tipo": "preenchimento_gap",
                        "biomarcador": bm,
                        "query_sugerida": query,
                        "justificativa": f"Preencher gap de evidência sobre {bm}",
                    }
                    hipoteses.append(hipotese)
                    novas_queries.append(query)

        # Hipótese 3: Convergências fortes merecem busca mais profunda
        for sintese in sinteses:
            if sintese.get("tipo") == "convergencia_evidencia":
                nivel = sintese.get("niveau_evidencia", "")
                if nivel in ("CONVERGENCIA_FORTE", "CONVERGENCIA_MODERADA"):
                    bm = sintese.get("biomarcador", "")
                    query = f"{bm} systematic review meta-analysis 2024"
                    if query not in self._queries_geradas:
                        hipotese = {
                            "tipo": "validacao_convergencia",
                            "biomarcador": bm,
                            "nivel_atual": nivel,
                            "query_sugerida": query,
                            "justificativa": (
                                f"Convergência {nivel} sobre {bm}. "
                                f"Buscar revisões sistemáticas para validar."
                            ),
                        }
                        hipoteses.append(hipotese)
                        novas_queries.append(query)

        # Hipótese 4: Conexões DIMHEX-específicas
        termos_dimhex = ["apheresis", "extracorporeal", "immune cell", "leukocyte"]
        for termo in termos_dimhex:
            query = f"{termo} cancer immunotherapy clinical evidence"
            if query not in self._queries_geradas:
                hipotese = {
                    "tipo": "dimhex_especifico",
                    "termo_dimhex": termo,
                    "query_sugerida": query,
                    "justificativa": (
                        f"Buscar evidência clínica específica para o protocolo DIMHEX: {termo}"
                    ),
                }
                hipoteses.append(hipotese)
                novas_queries.append(query)

        # Salvar no histórico
        self._historico_hipoteses.extend(hipoteses)
        self._queries_geradas.extend(novas_queries)

        # Limitar histórico
        if len(self._historico_hipoteses) > 100:
            self._historico_hipoteses = self._historico_hipoteses[-100:]

        return hipoteses

    def obter_queries_expandidas(self) -> List[str]:
        """Retorna todas as queries geradas para o próximo ciclo."""
        return list(set(self._queries_geradas))  # Deduplicadas

    def obter_historico(self) -> List[Dict]:
        """Retorna histórico de hipóteses geradas."""
        return self._historico_hipoteses[-50:]


class SabedoriaExponencialOrquestrador:
    """
    ORQUESTRADOR PRINCIPAL DE AUTO SABEDORIA EXPONENCIAL

    Coordena todos os motores de inteligência:
    1. GeradorEmbeddingAvancado — embeddings TF-IDF semânticos
    2. DuplicadorSemantico — deduplicação inteligente
    3. SintetizadorCruzado — síntese multi-fonte
    4. GeradorHipoteses — feedback loop exponencial

    Integração com o DIMHEX:
    - Recebe achados brutos de todas as fontes
    - Retorna achados enriquecidos + sínteses + hipóteses
    - Expande o vocabulário e as queries de busca

    A cada ciclo, o sistema fica MAIS INTELIGENTE porque:
    - Vocabulário cresce → embeddings melhores → busca mais precisa
    - Hipóteses geram novas queries → cobertura mais ampla
    - Sínteses cruzadas criam conhecimento que nenhuma fonte individual teria
    """

    VERSAO = "1.0.0"

    def __init__(self):
        self.gerador_embedding = GeradorEmbeddingAvancado()
        self.duplicador = DuplicadorSemantico(self.gerador_embedding)
        self.sintetizador = SintetizadorCruzado(self.gerador_embedding)
        self.gerador_hipoteses = GeradorHipoteses(self.gerador_embedding)

        # Coleção ChromaDB para embeddings avançados
        self.colecao_nome = "dimhex_sabedoria"
        try:
            self.chroma = BancoVetorialChromaDB(colecao_nome=self.colecao_nome)
        except Exception:
            self.chroma = None

        # Métricas acumuladas
        self.ciclos_processados = 0
        self.total_duplicatas_removidas = 0
        self.total_sinteses_geradas = 0
        self.total_hipoteses_geradas = 0
        self.vocabulario_expandido = 0

    def processar_ciclo_sabedoria(
        self,
        achados_brutos: List[Dict],
        scores_por_id: Dict[str, Dict],
    ) -> Dict[str, Any]:
        """
        Processamento completo de um ciclo de auto sabedoria.

        Fluxo:
        1. Enriquecer achados com scores
        2. Deduplicação semântica
        3. Atualizar IDF com corpus do ciclo
        4. Síntese cruzada
        5. Geração de hipóteses
        6. Indexação no ChromaDB (embeddings avançados)
        7. Expansão do vocabulário

        Retorna relatório completo do ciclo de sabedoria.
        """
        self.ciclos_processados += 1
        inicio = datetime.datetime.now()

        print(f"\n  [SABEDORIA v{self.VERSAO}] Ciclo #{self.ciclos_processados}")

        # === FASE 1: Enriquecer com scores ===
        achados_enriquecidos = []
        for achado in achados_brutos:
            id_dimhex = achado.get("id_dimhex", "")
            score_info = scores_por_id.get(id_dimhex, {})
            if score_info:
                achado["_score_dimhex"] = score_info.get("score_final", 0)
                achado["_classificacao"] = score_info.get("classificacao", "")
                achado["_biomarcadores"] = score_info.get("biomarcadores_mencionados", [])
                achado["_subtipos"] = score_info.get("subtipos_mencionados", [])
            achados_enriquecidos.append(achado)

        # === FASE 2: Deduplicação semântica ===
        print(f"  [SABEDORIA] Deduplicando {len(achados_enriquecidos)} achados...")
        unicos, duplicatas, grupos = self.duplicador.detectar_duplicatas(achados_enriquecidos)
        self.total_duplicatas_removidas += len(duplicatas)
        print(f"  [SABEDORIA] {len(unicos)} únicos, {len(duplicatas)} duplicatas removidas")

        # Fundir metadados de duplicatas nos canônicos
        for id_canonico, ids_dups in grupos.items():
            canonico = next((a for a in unicos if a.get("id_dimhex") == id_canonico), None)
            if not canonico:
                continue
            for id_dup in ids_dups:
                dup = next((a for a in achados_enriquecidos if a.get("id_dimhex") == id_dup), None)
                if dup:
                    canonico_atualizado = self.duplicador.fundir_duplicatas(canonico, dup)
                    # Atualizar na lista
                    for i, a in enumerate(unicos):
                        if a.get("id_dimhex") == id_canonico:
                            unicos[i] = canonico_atualizado
                            break

        # === FASE 3: Atualizar IDF ===
        corpus = [f"{a.get('titulo', '')} {a.get('resumo', '')[:300]}" for a in unicos]
        self.gerador_embedding.atualizar_idf(corpus)

        # === FASE 4: Síntese cruzada ===
        print(f"  [SABEDORIA] Sintetizando conexões cruzadas...")
        sinteses = self.sintetizador.sintetizar(unicos)
        self.total_sinteses_geradas += len(sinteses)

        # === FASE 5: Geração de hipóteses ===
        print(f"  [SABEDORIA] Gerando hipóteses para próximo ciclo...")
        hipoteses = self.gerador_hipoteses.gerar_hipoteses(unicos, sinteses)
        self.total_hipoteses_geradas += len(hipoteses)

        # === FASE 6: Indexação no ChromaDB ===
        print(f"  [SABEDORIA] Indexando embeddings avançados...")
        indexados = 0
        if self.chroma:
            for achado in unicos:
                try:
                    texto = f"{achado.get('titulo', '')} {achado.get('resumo', '')[:500]}"
                    embedding = self.gerador_embedding.gerar_embedding(
                        texto, metadados=achado
                    )
                    metadados = {
                        "titulo": achado.get("titulo", "")[:200],
                        "fonte": achado.get("fonte", ""),
                        "tipo": achado.get("tipo", ""),
                        "data_publicacao": achado.get("data_publicacao", ""),
                        "url": achado.get("url", ""),
                        "score_dimhex": str(achado.get("_score_dimhex", 0)),
                        "classificacao": achado.get("_classificacao", ""),
                        "biomarcadores": json.dumps(achado.get("_biomarcadores", [])),
                        "subtipos": json.dumps(achado.get("_subtipos", [])),
                        "ciclo_sabedoria": str(self.ciclos_processados),
                    }
                    self.chroma.indexar_caso_clinico(
                        caso_id=f"sab_{achado.get('id_dimhex', 'unknown')}",
                        vetor=embedding,
                        metadados=metadados,
                    )
                    indexados += 1
                except Exception as e:
                    print(f"  [SABEDORIA] Erro ao indexar: {e}")

        # === FASE 7: Expansão do vocabulário ===
        novos_termos = self._descobrir_novos_termos(unicos)
        if novos_termos:
            self.gerador_embedding.expandir_vocabulario(novos_termos)
            self.vocabulario_expandido += len(novos_termos)
            print(f"  [SABEDORIA] +{len(novos_termos)} termos descobertos no vocabulário")

        duracao = (datetime.datetime.now() - inicio).total_seconds()

        relatorio = {
            "ciclo_sabedoria": self.ciclos_processados,
            "versao": self.VERSAO,
            "duracao_segundos": round(duracao, 2),
            "entrada": {
                "achados_brutos": len(achados_brutos),
                "apos_deduplicacao": len(unicos),
                "duplicatas_removidas": len(duplicatas),
            },
            "sinteses": sinteses,
            "hipoteses": hipoteses,
            "indexados_chromadb": indexados,
            "vocabulario_expandido_neste_ciclo": len(novos_termos),
            "queries_para_proximo_ciclo": self.gerador_hipoteses.obter_queries_expandidas()[-10:],
            "metricas_acumuladas": self.obter_metricas(),
        }

        print(f"  [SABEDORIA] Ciclo concluído em {duracao:.1f}s | "
              f"{len(sinteses)} sínteses | {len(hipoteses)} hipóteses")

        return relatorio

    def _descobrir_novos_termos(self, achados: List[Dict]) -> Dict[str, float]:
        """
        Descobre novos termos relevantes nos achados que não estão
        no vocabulário atual. Mecanismo central da auto sabedoria exponencial.
        """
        novos_termos = {}
        vocab_existente = set(self.gerador_embedding.vocabulario.keys())

        for achado in achados:
            if achado.get("_score_dimhex", 0) < 0.4:
                continue  # Só aprender de achados relevantes

            texto = f"{achado.get('titulo', '')} {achado.get('resumo', '')}".lower()
            tokens = self.gerador_embedding._tokenizar(texto)

            # Contar frequência de termos não conhecidos
            freq = Counter(tokens)
            for termo, contagem in freq.items():
                if termo not in vocab_existente and len(termo) > 4:
                    # Termos que aparecem em múltiplos achados relevantes
                    if contagem >= 2 and termo not in novos_termos:
                        # Peso inicial baseado na frequência e score do achado
                        peso = min(2.0, 0.5 + contagem * 0.3)
                        novos_termos[termo] = round(peso, 1)

        # Limitar expansão por ciclo (evitar poluição do vocabulário)
        if len(novos_termos) > 10:
            # Manter os de maior frequência
            novos_termos = dict(sorted(novos_termos.items(), key=lambda x: -x[1])[:10])

        return novos_termos

    def buscar_sabedoria(self, query: str, top_k: int = 5) -> List[Dict]:
        """
        Busca na base de sabedoria (embeddings avançados).
        Usado pelo agente oncológico para decisões fundamentadas.
        """
        if not self.chroma:
            return []

        embedding = self.gerador_embedding.gerar_embedding(query)
        return self.chroma.buscar_casos_analogos(embedding, top_k=top_k)

    def obter_metricas(self) -> Dict:
        """Retorna métricas acumuladas do orquestrador de sabedoria."""
        return {
            "ciclos_processados": self.ciclos_processados,
            "total_duplicatas_removidas": self.total_duplicatas_removidas,
            "total_sinteses_geradas": self.total_sinteses_geradas,
            "total_hipoteses_geradas": self.total_hipoteses_geradas,
            "vocabulario_expandido": self.vocabulario_expandido,
            "tamanho_vocabulario": len(self.gerador_embedding.vocabulario),
            "queries_acumuladas": len(self.gerador_hipoteses.obter_queries_expandidas()),
            "dim_embedding": self.gerador_embedding.DIM_EMBEDDING,
        }

    def obter_queries_expandidas(self) -> List[str]:
        """Retorna queries expandidas para alimentar o próximo ciclo de busca."""
        return self.gerador_hipoteses.obter_queries_expandidas()