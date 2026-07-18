"""
DIMHEX — Conector Google Scholar
Raspagem semântica de publicações científicas via Google Scholar.
Usa requests + BeautifulSoup com headers rotativos e parsing de HTML robusto.
Complementa o PubMed com cobertura mais ampla (preprints, conferências, livros).

NOTA: Google Scholar não possui API oficial. Este conector usa scraping
etico com rate-limiting agressivo (15s entre requests) para evitar bloqueio.
"""

import re
import time
import json
import hashlib
import datetime
import random
import requests
from typing import List, Dict, Optional
from urllib.parse import quote_plus, urlencode

try:
    from bs4 import BeautifulSoup
    _HAS_BS4 = True
except ImportError:
    _HAS_BS4 = False

from config import CONFIG


class GoogleScholarConnector:
    """
    Conector para Google Scholar via scraping.
    
    Estratégia anti-bloqueio:
    - Headers rotativos com User-Agents variados
    - Rate-limit de 15 segundos entre requests
    - Parser HTML resiliente com múltiplos seletores fallback
    - Suporte a proxy opcional via config
    
    Retorno: formato DIMHEX normalizado (compatível com as outras fontes).
    """

    NOME = "Google_Scholar"
    RATE_LIMIT_SEGUNDOS = 15.0
    BASE_URL = "https://scholar.google.com/scholar"

    # User-Agents rotativos para evitar fingerprint
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    ]

    # Termos de busca focados no DIMHEX e ecossistema Doctor AI
    TERMOS_DOMINIO = [
        "ctDNA liquid biopsy oncology 2024",
        "circulating tumor cells cancer detection recent",
        "tumor mutational burden immunotherapy response prediction",
        "PD-L1 biomarker predictive oncology",
        "tumor infiltrating lymphocytes prognosis immunotherapy",
        "KRAS G12C inhibitor clinical outcome",
        "EGFR mutated NSCLC treatment resistance",
        "triple negative breast cancer immunotherapy breakthrough",
        "adaptive therapy cancer evolutionary treatment",
        "explainable AI oncology clinical decision support",
        "Bayesian decision support cancer treatment",
        "liquid biopsy minimal residual disease monitoring",
        "CAR-T cell therapy solid tumor progress",
        "antibody drug conjugate oncology clinical trial",
        "extracorporeal blood treatment cancer immunotherapy",
        "leukocyte activation cancer therapy",
        "apheresis oncology immune potentiation",
        "mRNA vaccine cancer personalized treatment",
        "CRISPR PD-1 cancer immunotherapy clinical",
        "digital twin oncology clonal evolution prediction",
        "cytokine engineering tumor microenvironment",
    ]

    def __init__(self):
        self._ultima_chamada = 0.0
        self.timeout = CONFIG.get("DIMHEX_REQUEST_TIMEOUT", 30)
        self.session = requests.Session()
        self._total_coletados = 0
        self._total_bloqueados = 0
        self._UA_index = 0

    def _get_user_agent(self) -> str:
        """Retorna User-Agent rotativo."""
        ua = self.USER_AGENTS[self._UA_index % len(self.USER_AGENTS)]
        self._UA_index += 1
        return ua

    def _respeitar_rate_limit(self):
        """Rate-limit agressivo para Google Scholar."""
        decorrido = time.time() - self._ultima_chamada
        if decorrido < self.RATE_LIMIT_SEGUNDOS:
            tempo_espera = self.RATE_LIMIT_SEGUNDOS - decorrido
            # Jitter aleatório para parecer humano
            tempo_espera += random.uniform(1.0, 5.0)
            time.sleep(tempo_espera)
        self._ultima_chamada = time.time()

    def _detectar_bloqueio(self, soup) -> bool:
        """Detecta se o Google Scholar bloqueou a requisição."""
        texto_pagina = soup.get_text().lower()
        sinais_bloqueio = [
            "unusual traffic",
            "automated requests",
            "captcha",
            "not a robot",
            "our systems have detected",
            "too many requests",
        ]
        return any(sinal in texto_pagina for sinal in sinais_bloqueio)

    def _extrair_autores(self, texto_authors: str) -> List[str]:
        """Extrai lista de autores do texto do Google Scholar."""
        if not texto_authors:
            return []
        # Formato típico: "A Author, B Author, C Author - Journal, 2024"
        partes = texto_authors.split(" - ")
        if partes:
            autores_str = partes[0]
            # Separar por vírgula, mas preservar sobrenomes compostos
            autores = [a.strip() for a in autores_str.split(",") if a.strip()]
            # Limitar a 8 autores
            return autores[:8]
        return []

    def _extrair_ano(self, texto_info: str) -> str:
        """Extrai ano de publicação do texto informativo."""
        if not texto_info:
            return ""
        # Buscar ano de 4 dígitos entre 2018 e 2026
        match = re.search(r'\b(20[1-2]\d)\b', texto_info)
        return match.group(1) if match else ""

    def _extrair_citacoes(self, texto_info: str) -> int:
        """Extrai número de citações do texto."""
        if not texto_info:
            return 0
        match = re.search(r'Cited by\s*(\d+)', texto_info)
        return int(match.group(1)) if match else 0

    def _extrair_doi_do_url(self, url: str) -> str:
        """Tenta extrair DOI de URLs de publishers."""
        if not url:
            return ""
        # Padrões comuns de DOI em URLs
        match = re.search(r'10\.\d{4,}/[^\s&]+', url)
        return match.group(0) if match else ""

    def _normalizar_resultado(self, raw: Dict) -> Dict:
        """Converte resultado bruto do scraping para formato DIMHEX."""
        titulo = raw.get("titulo", "Sem titulo")
        snippet = raw.get("snippet", "")
        info = raw.get("info", "")
        url = raw.get("url", "")
        url_pdf = raw.get("url_pdf", "")

        autores = self._extrair_autores(info)
        ano = self._extrair_ano(info)
        citacoes = self._extrair_citacoes(info)
        doi = self._extrair_doi_do_url(url) or self._extrair_doi_do_url(url_pdf)

        # Determinar tipo
        tipo = "artigo_cientifico"
        snippet_lower = snippet.lower()
        if "conference" in snippet_lower or "proceedings" in snippet_lower:
            tipo = "conferencia"
        elif "preprint" in snippet_lower or "bioRxiv" in snippet_lower or "medRxiv" in snippet_lower:
            tipo = "preprint"
        elif "book" in snippet_lower or "chapter" in snippet_lower:
            tipo = "livro"

        # Gerar ID estável
        id_hash = hashlib.md5(f"{titulo}_{ano}".encode()).hexdigest()[:12]

        return {
            "id_dimhex": f"scholar_{id_hash}",
            "id_externo": id_hash,
            "fonte": self.NOME,
            "titulo": titulo,
            "resumo": snippet[:800] if snippet else "",
            "autores": autores,
            "jornal": raw.get("fonte_pub", ""),
            "data_publicacao": f"{ano}-01-01" if ano else "",
            "doi": doi,
            "url": url or url_pdf or f"https://scholar.google.com/scholar?q={quote_plus(titulo)}",
            "tipo": tipo,
            "termo_busca": raw.get("termo_busca", ""),
            "citacoes": citacoes,
            "url_pdf": url_pdf,
            "coletado_em": datetime.datetime.utcnow().isoformat(),
        }

    def buscar(self, termos_busca: List[str] = None, data_inicio: str = None,
               data_fim: str = None, max_resultados: int = 50) -> List[Dict]:
        """
        Executa busca no Google Scholar com scraping robusto.
        
        Retorna lista de resultados no formato DIMHEX normalizado.
        Em caso de bloqueio, retorna lista vazia (graceful degradation).
        """
        if not _HAS_BS4:
            print("   [Google Scholar] BeautifulSoup nao instalado — pulando")
            print("   Instale com: pip install beautifulsoup4")
            return []

        termos = termos_busca or self.TERMOS_DOMINIO
        resultados_finais = []
        ids_vistos = set()

        # Parâmetros de data para filtro (se fornecidos)
        as_ylo = ""
        as_yhi = ""
        if data_fim:
            match = re.search(r'(\d{4})', data_fim)
            if match:
                as_yhi = match.group(1)
        if data_inicio:
            match = re.search(r'(\d{4})', data_inicio)
            if match:
                as_ylo = match.group(1)

        for termo in termos:
            if len(resultados_finais) >= max_resultados:
                break

            self._respeitar_rate_limit()

            params = {
                "q": termo,
                "hl": "en",
                "num": 20,
                "as_sdt": "0,5",  # Artigos e patentes
            }
            if as_ylo:
                params["as_ylo"] = as_ylo
            if as_yhi:
                params["as_yhi"] = as_yhi

            headers = {
                "User-Agent": self._get_user_agent(),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "keep-alive",
            }

            try:
                resposta = self.session.get(
                    self.BASE_URL,
                    params=params,
                    headers=headers,
                    timeout=self.timeout,
                    allow_redirects=True
                )

                if resposta.status_code == 429:
                    self._total_bloqueados += 1
                    print(f"   [Google Scholar] Rate limited (429) — aguardando 60s")
                    time.sleep(60)
                    continue

                if resposta.status_code != 200:
                    self._total_bloqueados += 1
                    print(f"   [Google Scholar] HTTP {resposta.status_code}")
                    continue

                soup = BeautifulSoup(resposta.text, "html.parser")

                # Detectar bloqueio por CAPTCHA
                if self._detectar_bloqueio(soup):
                    self._total_bloqueados += 1
                    print(f"   [Google Scholar] BLOQUEADO — CAPTCHA detectado")
                    break  # Parar todas as buscas se bloqueado

                # Parser principal: extrair resultados
                resultados_raw = self._parsear_resultados(soup, termo)

                for raw in resultados_raw:
                    normalizado = self._normalizar_resultado(raw)
                    id_dimhex = normalizado["id_dimhex"]

                    if id_dimhex in ids_vistos:
                        continue
                    ids_vistos.add(id_dimhex)

                    resultados_finais.append(normalizado)
                    self._total_coletados += 1

                    if len(resultados_finais) >= max_resultados:
                        break

            except requests.exceptions.Timeout:
                print(f"   [Google Scholar] Timeout")
                self._total_bloqueados += 1
                continue
            except requests.exceptions.ConnectionError:
                print(f"   [Google Scholar] Erro de conexao")
                self._total_bloqueados += 1
                continue
            except Exception as e:
                print(f"   [Google Scholar] Erro inesperado: {e}")
                self._total_bloqueados += 1
                continue

        print(f"   [Google Scholar] {len(resultados_finais)} resultados "
              f"(bloqueios: {self._total_bloqueados})")

        return resultados_finais

    def _parsear_resultados(self, soup, termo_busca: str) -> List[Dict]:
        """
        Parser HTML robusto com múltiplos seletores fallback.
        O HTML do Google Scholar muda frequentemente — este parser
        tenta 3 estratégias diferentes.
        """
        resultados = []

        # Estratégia 1: Seletor padrão (data-mp)
        entries = soup.select("div.gs_r.gs_or.gs_scl")
        if not entries:
            # Estratégia 2: Fallback por classe
            entries = soup.select("div.gs_ri")
        if not entries:
            # Estratégia 3: Fallback genérico
            entries = soup.find_all("div", class_=re.compile(r"gs_r"))

        for entry in entries:
            try:
                raw = {"termo_busca": termo_busca}

                # Título
                titulo_tag = entry.select_one("h3.gs_rt a") or entry.select_one("h3 a")
                if titulo_tag:
                    raw["titulo"] = titulo_tag.get_text(strip=True)
                    raw["url"] = titulo_tag.get("href", "")
                else:
                    titulo_tag = entry.select_one("h3.gs_rt")
                    if titulo_tag:
                        raw["titulo"] = titulo_tag.get_text(strip=True)
                    else:
                        continue
                    raw["url"] = ""

                # Snippet/Resumo
                snippet_tag = entry.select_one("div.gs_rs")
                raw["snippet"] = snippet_tag.get_text(strip=True) if snippet_tag else ""

                # Info (autores, journal, ano, citações)
                info_tag = entry.select_one("div.gs_a")
                raw["info"] = info_tag.get_text(strip=True) if info_tag else ""

                # Fonte da publicação
                fonte_tag = entry.select_one("div.gs_a .gs_ggs gs_ggsd a") or \
                            entry.select_one("a[title]")
                raw["fonte_pub"] = fonte_tag.get_text(strip=True) if fonte_tag else ""

                # Link para PDF
                pdf_tag = entry.select_one("div.gs_or_ggsm a[href$='.pdf']") or \
                          entry.select_one("a[href*='.pdf']")
                raw["url_pdf"] = pdf_tag.get("href", "") if pdf_tag else ""

                if raw.get("titulo"):
                    resultados.append(raw)

            except Exception:
                continue

        return resultados

    def obter_estatisticas(self) -> Dict:
        """Retorna estatísticas do conector."""
        return {
            "fonte": self.NOME,
            "total_coletados": self._total_coletados,
            "total_bloqueios": self._total_bloqueados,
            "taxa_sucesso": (
                self._total_coletados / max(1, self._total_coletados + self._total_bloqueados)
            ),
        }