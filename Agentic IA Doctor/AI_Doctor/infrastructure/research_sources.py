"""
DIMHEX — Fontes de Pesquisa Médica
Conectores para PubMed (NCBI E-utilities), ClinicalTrials.gov, WHO ICTRP.
Cada fonte retorna dados normalizados no formato padrao DIMHEX.
"""

import datetime
import time
import json
import hashlib
import requests
from typing import List, Dict, Optional
from config import CONFIG

try:
    from datetime import timezone
except ImportError:
    timezone = None

def _utcnow_iso():
    if timezone:
        return datetime.datetime.now(timezone.utc).isoformat()
    return datetime.datetime.utcnow().isoformat()


class FontePesquisaBase:
    """Classe base abstrata para fontes de pesquisa."""

    NOME: str = "base"
    RATE_LIMIT_SEGUNDOS: float = 1.0
    BASE_URL: str = ""

    def __init__(self):
        self._ultima_chamada = 0.0
        self.timeout = CONFIG.get("DIMHEX_REQUEST_TIMEOUT", 30)
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "DIMHEX-AIDoctor/1.0 (Medical Research Agent; contact@aidoctor.med)"
        })

    def _respeitar_rate_limit(self):
        """Garante intervalo minimo entre chamadas para nao sobrecarregar APIs publicas."""
        decorrido = time.time() - self._ultima_chamada
        if decorrido < self.RATE_LIMIT_SEGUNDOS:
            time.sleep(self.RATE_LIMIT_SEGUNDOS - decorrido)
        self._ultima_chamada = time.time()

    def _chamar_api(self, url: str, params: dict = None) -> Optional[dict]:
        """Chamada HTTP segura com retry e tratamento de erros."""
        self._respeitar_rate_limit()
        try:
            resposta = self.session.get(url, params=params, timeout=self.timeout)
            resposta.raise_for_status()
            return resposta.json() if resposta.content else None
        except requests.exceptions.Timeout:
            print(f"   [DIMHEX] Timeout em {self.NOME}: {url}")
            return None
        except requests.exceptions.HTTPError as e:
            print(f"   [DIMHEX] HTTP {e.response.status_code} em {self.NOME}: {url}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"   [DIMHEX] Erro de conexao em {self.NOME}")
            return None
        except Exception as e:
            print(f"   [DIMHEX] Erro inesperado em {self.NOME}: {e}")
            return None

    def buscar(self, termos_busca: List[str], data_inicio: str, data_fim: str,
               max_resultados: int = 50) -> List[Dict]:
        """Metodo abstrato — cada fonte implementa sua logica de busca."""
        raise NotImplementedError


class PubMedConnector(FontePesquisaBase):
    """
    Conector para PubMed via NCBI E-utilities API.
    Usa esearch + efetch para obter metadados + resumos de artigos.
    Limites: 3 requisicoes/segundo (NCBI guideline).
    """

    NOME = "PubMed"
    RATE_LIMIT_SEGUNDOS = 0.4  # ~2.5 req/s, abaixo do limite de 3
    ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

    # Termos oncologicos focados no dominio do AI Doctor
    TERMOS_DOMINIO = [
        "ctDNA liquid biopsy oncology",
        "circulating tumor cells detection cancer",
        "tumor mutational burden immunotherapy response",
        "PD-L1 expression predictive biomarker",
        "tumor infiltrating lymphocytes prognosis",
        "KRAS G12C inhibitor clinical trial",
        "EGFR mutated NSCLC treatment",
        "triple negative breast cancer immunotherapy",
        "neoadjuvant immunotherapy biomarker",
        "adaptive therapy cancer treatment",
        "SHAP explainable AI oncology",
        "Bayesian decision support oncology",
        "liquid biopsy minimal residual disease",
        "CAR-T cell therapy solid tumor",
        "antibody drug conjugate oncology",
        "ECOG performance status treatment outcome",
        "clonal resistance evolution cancer",
        "microsatellite instability immunotherapy",
        "next generation sequencing clinical decision",
        "precision oncology clinical trial"
    ]

    def buscar(self, termos_busca: List[str] = None, data_inicio: str = None,
               data_fim: str = None, max_resultados: int = 50) -> List[Dict]:
        termos = termos_busca or self.TERMOS_DOMINIO
        hoje = datetime.date.today().isoformat()
        data_inicio = data_inicio or (datetime.date.today() - datetime.timedelta(days=CONFIG.get("DIMHEX_LOOKBACK_DAYS", 30))).isoformat()
        data_fim = data_fim or hoje

        resultados_finais = []
        ids_vistos = set()

        for termo in termos:
            params_search = {
                "db": "pubmed",
                "term": f"{termo} AND ({data_inicio}[pdat] : {data_fim}[pdat])",
                "retmax": min(max_resultados, 20),
                "retmode": "json",
                "sort": "relevance"
            }

            dados_search = self._chamar_api(self.ESEARCH_URL, params_search)
            if not dados_search or "esearchresult" not in dados_search:
                continue

            id_list = dados_search["esearchresult"].get("idlist", [])
            ids_novos = [pmid for pmid in id_list if pmid not in ids_vistos]
            if not ids_novos:
                continue

            ids_vistos.update(ids_novos)

            params_fetch = {
                "db": "pubmed",
                "id": ",".join(ids_novos),
                "retmode": "json"
            }
            dados_fetch = self._chamar_api(self.EFETCH_URL, params_fetch)
            if not dados_fetch or "result" not in dados_fetch:
                continue

            for pmid in ids_novos:
                artigo = dados_fetch["result"].get(pmid)
                if not artigo:
                    continue

                autores = artigo.get("authors", [])
                nomes_autores = [a.get("name", "") for a in autores if isinstance(a, dict)]
                journal = ""
                if "source" in artigo:
                    journal = artigo["source"]

                resultados_finais.append({
                    "id_dimhex": f"pubmed_{pmid}",
                    "id_externo": pmid,
                    "fonte": self.NOME,
                    "titulo": artigo.get("title", "Sem titulo"),
                    "resumo": artigo.get("abstract", "") or "",
                    "autores": nomes_autores[:5],
                    "jornal": journal,
                    "data_publicacao": artigo.get("pubdate", ""),
                    "doi": self._extrair_doi(artigo.get("articleids", [])),
                    "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/",
                    "tipo": "artigo_cientifico",
                    "termo_busca": termo,
                    "coletado_em": _utcnow_iso()
                })

                if len(resultados_finais) >= max_resultados:
                    return resultados_finais

        return resultados_finais

    @staticmethod
    def _extrair_doi(article_ids: list) -> str:
        """Extrai DOI da lista de article IDs retornada pelo PubMed."""
        if not article_ids:
            return ""
        for item in article_ids:
            if isinstance(item, dict) and item.get("idtype") == "doi":
                return item.get("value", "")
        return ""


class ClinicalTrialsConnector(FontePesquisaBase):
    """
    Conector para ClinicalTrials.gov API v2.
    Busca ensaios clinicos ativos e recentes em oncologia.
    """

    NOME = "ClinicalTrials.gov"
    RATE_LIMIT_SEGUNDOS = 0.5
    BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

    TERMOS_ENSAIOS = [
        "ctDNA AND cancer",
        "liquid biopsy AND minimal residual disease",
        "KRAS G12C inhibitor",
        "PD-L1 biomarker AND immunotherapy",
        "adaptive therapy AND oncology",
        "antibody drug conjugate AND solid tumor",
        "CAR-T AND solid tumor",
        "neoadjuvant AND immunotherapy",
        "tumor mutational burden AND checkpoint inhibitor",
        "triple negative breast cancer AND immunotherapy"
    ]

    def buscar(self, termos_busca: List[str] = None, data_inicio: str = None,
               data_fim: str = None, max_resultados: int = 50) -> List[Dict]:

        termos = termos_busca or self.TERMOS_ENSAIOS
        hoje = datetime.date.today().isoformat()
        data_inicio = data_inicio or (datetime.date.today() - datetime.timedelta(days=CONFIG.get("DIMHEX_LOOKBACK_DAYS", 30))).isoformat()
        data_fim = data_fim or hoje

        resultados_finais = []
        ids_vistos = set()

        for termo in termos:
            params = {
                "query.term": termo,
                "filter.overallStatus": "RECRUITING,ACTIVE_NOT_RECRUITING",
                "filter.docs": f"lastUpdatePostDate={data_inicio},{data_fim}",
                "pageSize": min(max_resultados, 20),
                "format": "json"
            }

            dados = self._chamar_api(self.BASE_URL, params=params)
            if not dados or "studies" not in dados:
                continue

            for estudo in dados["studies"]:
                protocolo = estudo.get("protocolSection", {})
                identification = protocolo.get("identificationModule", {})
                nct_id = identification.get("nctId", "")

                if nct_id in ids_vistos:
                    continue
                ids_vistos.add(nct_id)

                status_module = protocolo.get("statusModule", {})
                design_module = protocolo.get("designModule", {})
                interventions = design_module.get("interventionsModule", {}).get("interventions", [])
                nomes_intervencoes = [
                    i.get("interventionName", "") for i in interventions if isinstance(i, dict)
                ]

                descricao = ""
                if "descriptionModule" in protocolo:
                    descricao = protocolo["descriptionModule"].get("briefSummary", "")

                resultados_finais.append({
                    "id_dimhex": f"clinicaltrial_{nct_id}",
                    "id_externo": nct_id,
                    "fonte": self.NOME,
                    "titulo": identification.get("briefTitle", "Sem titulo"),
                    "resumo": descricao[:800] if descricao else "",
                    "autores": [],
                    "jornal": "",
                    "data_publicacao": status_module.get("lastUpdatePostDate", ""),
                    "doi": "",
                    "url": f"https://clinicaltrials.gov/study/{nct_id}",
                    "tipo": "ensaio_clinico",
                    "termo_busca": termo,
                    "fase": design_module.get("phases", []),
                    "intervencoes": nomes_intervencoes[:5],
                    "status": status_module.get("overallStatus", ""),
                    "coletado_em": _utcnow_iso()
                })

                if len(resultados_finais) >= max_resultados:
                    return resultados_finais

        return resultados_finais


class WHOAlertsConnector(FontePesquisaBase):
    """
    Conector para alertas e publicacoes da OMS em oncologia.
    Usa a WHO Global Health Observatory API + feed de noticias.
    """

    NOME = "WHO"
    RATE_LIMIT_SEGUNDOS = 1.0
    BASE_URL = "https://ghoapi.azureedge.net/api"

    def buscar(self, termos_busca: List[str] = None, data_inicio: str = None,
               data_fim: str = None, max_resultados: int = 20) -> List[Dict]:
        """Busca indicadores e publicacoes de saude relevantes."""
        resultados = []

        # Indicadores de cancer da WHO GHO
        indicadores_cancer = [
            "WHOSIS_000002",  # Mortalidade por cancer
            "MDG_0000000009",  # Incidencia de cancer
        ]

        for codigo in indicadores_cancer:
            dados = self._chamar_api(f"{self.BASE_URL}/{codigo}")
            if dados and "value" in dados:
                for entrada in dados["value"][:5]:
                    resultados.append({
                        "id_dimhex": f"who_{codigo}_{hashlib.md5(str(entrada).encode()).hexdigest()[:8]}",
                        "id_externo": codigo,
                        "fonte": self.NOME,
                        "titulo": entrada.get("Dim1", "Indicador WHO"),
                        "resumo": f"Pais: {entrada.get('SpatialDim', 'Global')} | Valor: {entrada.get('NumericValue', 'N/A')} | Ano: {entrada.get('TimeDim', 'N/A')}",
                        "autores": ["World Health Organization"],
                        "jornal": "WHO Global Health Observatory",
                        "data_publicacao": str(entrada.get("TimeDim", "")),
                        "doi": "",
                        "url": f"https://www.who.int/data/gho/data/indicators/indicator-details/GHO/{codigo}",
                        "tipo": "indicador_saude",
                        "termo_busca": codigo,
                        "coletado_em": _utcnow_iso()
                    })

                    if len(resultados) >= max_resultados:
                        return resultados

        return resultados


class RegistroFontesPesquisa:
    """
    Registro central de todas as fontes de pesquisa disponiveis.
    Gerencia instanciacao e coordenacao entre fontes.

    Fontes disponiveis:
    - PubMed: artigos cientificos via NCBI E-utilities
    - ClinicalTrials.gov: ensaios clinicos ativos
    - WHO: indicadores e alertas globais de saude
    - google_scholar: cobertura ampliada com scraping (preprints, conferencias, livros)
    """

    def __init__(self):
        self.fontes: Dict[str, FontePesquisaBase] = {
            "pubmed": PubMedConnector(),
            "clinical_trials": ClinicalTrialsConnector(),
            "who": WHOAlertsConnector(),
        }
        # Google Scholar: instanciar com try/except (depende de beautifulsoup4)
        try:
            from infrastructure.google_scholar import GoogleScholarConnector
            self.fontes["google_scholar"] = GoogleScholarConnector()
        except Exception as e:
            print(f"   [RegistroFontes] Google Scholar desativado: {e}")
        self._historico_execucoes: List[Dict] = []
        self._queries_expandidas: List[str] = []  # Feedback loop de auto sabedoria

    def adicionar_queries_expandidas(self, queries: List[str]):
        """Adiciona queries geradas pela auto sabedoria ao proximo ciclo."""
        self._queries_expandidas = list(set(queries))

    def _obter_queries_adicionais(self) -> List[str]:
        """Retorna queries expandidas para injeção no ciclo."""
        queries = self._queries_expandidas[:5]  # Limitar a 5 queries extras
        self._queries_expandidas = self._queries_expandidas[5:]
        return queries

    def executar_ciclo_pesquisa(self, data_inicio: str = None, data_fim: str = None,
                                 max_por_fonte: int = 50) -> Dict[str, List[Dict]]:
        """
        Executa ciclo completo de pesquisa em todas as fontes ativas.
        Injeta queries expandidas pela auto sabedoria no PubMed e Google Scholar.
        Retorna dict com nome da fonte -> lista de resultados.
        """
        hoje = datetime.date.today().isoformat()
        padrao_inicio = (datetime.date.today() - datetime.timedelta(
            days=CONFIG.get("DIMHEX_LOOKBACK_DAYS", 30)
        )).isoformat()

        data_inicio = data_inicio or padrao_inicio
        data_fim = data_fim or hoje

        # Obter queries do feedback loop de auto sabedoria
        queries_adicionais = self._obter_queries_adicionais()

        todos_resultados = {}
        total_geral = 0

        print(f"\n{'='*60}")
        print(f"  DIMHEX — Ciclo de Pesquisa Iniciado")
        print(f"  Periodo: {data_inicio} ate {data_fim}")
        print(f"  Fontes ativas: {len(self.fontes)}")
        if queries_adicionais:
            print(f"  Queries expandidas (sabedoria): {len(queries_adicionais)}")
        print(f"{'='*60}")

        for nome, fonte in self.fontes.items():
            print(f"\n   [{nome}] Buscando...")
            try:
                # Injetar queries expandidas no PubMed e Google Scholar
                termos_extra = None
                if nome in ("pubmed", "google_scholar") and queries_adicionais:
                    termos_extra = queries_adicionais[:3]

                resultados = fonte.buscar(
                    termos_busca=termos_extra,
                    data_inicio=data_inicio,
                    data_fim=data_fim,
                    max_resultados=max_por_fonte
                )
                todos_resultados[nome] = resultados
                total_geral += len(resultados)
                print(f"   [{nome}] {len(resultados)} resultados encontrados")
            except Exception as e:
                print(f"   [{nome}] ERRO: {e}")
                todos_resultados[nome] = []

        self._historico_execucoes.append({
            "timestamp": _utcnow_iso(),
            "data_inicio": data_inicio,
            "data_fim": data_fim,
            "total_resultados": total_geral,
            "por_fonte": {k: len(v) for k, v in todos_resultados.items()}
        })

        print(f"\n{'='*60}")
        print(f"  DIMHEX — Ciclo Finalizado | Total: {total_geral} achados")
        print(f"{'='*60}\n")

        return todos_resultados

    def obter_historico(self) -> List[Dict]:
        """Retorna historico de execucoes do ciclo de pesquisa."""
        return self._historico_execucoes