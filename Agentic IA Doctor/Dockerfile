FROM python:3.10-slim

# Evita que o Python escreva arquivos .pyc e bufere o stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instala dependências de sistema essenciais para compilação de pacotes C/C++
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /lib/apt/lists/*

# Copia apenas o arquivo de requerimentos primeiro para cachear a camada do Docker
COPY requirements.txt .

# Instala as dependências travando versões de produção estáveis
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o restante do código-fonte do motor e modelos pré-treinados
COPY . .

# Cria os diretórios necessários para armazenamento local de auditoria e RAG
RUN mkdir -p chroma_db models

# Expõe a porta nativa de comunicação do painel Streamlit
EXPOSE 8501

# Comando padrão para subir o painel de oncologia de precisão
CMD ["streamlit", "run", "main.py", "--", "--dashboard"]
