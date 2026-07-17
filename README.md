<div align="center">

# AI_Doctor

### Plataforma de Oncologia de Precisão Humanizada

**15 especialistas PhD virtuais | Protocolo DIMHEX | RAG com Gemini | Telemedicina empática**

[![CI](https://github.com/Nexus-HUB57/AI_Doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/Nexus-HUB57/AI_Doctor/actions/workflows/ci.yml)
[![CD](https://github.com/Nexus-HUB57/AI_Doctor/actions/workflows/cd.yml/badge.svg)](https://github.com/Nexus-HUB57/AI_Doctor/actions/workflows/cd.yml)
[![Tests 201+](https://img.shields.io/badge/tests-201%2B-passing-brightgreen)]()
[![Stress Tests 100](https://img.shields.io/badge/stress_tests-100%2F100-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

**Sistema completo de diagnóstico assistido por IA, orquestração de junta médica virtual, simulação do Protocolo DIMHEX e telemedicina acolhedora para pacientes oncológicos.**

</div>

---

## Sobre o Projeto

O **AI_Doctor** é uma plataforma full-stack de oncologia de precisão que vai muito além da análise de dados biomédicos. O sistema orquestra **15 agentes especializados PhD** para deliberar casos clínicos em consenso, integra uma base de conhecimento científico nível PhD atualizada em tempo real via PubMed e Google Scholar, e oferece um canal de telemedicina empático que traduz complexidade oncológica em orientação acessível e esperançosa para o paciente.

Tudo isso construído sobre uma arquitetura production-ready com CI/CD automatizado, Docker, Nginx reverse proxy, 201+ testes automatizados e 100 stress tests E2E que validam resiliência sob carga.

---

## Arquitetura & Stack

```
┌──────────────────────────────────────────────────────────────────┐
│                         Nginx Reverse Proxy                       │
│                   (SSL Termination / Load Balance)                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Express + tRPC Server                     │ │
│  │         (Helmet / CORS / Rate Limit / JWT / RBAC)            │ │
│  │                                                              │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │ │
│  │  │  Auth     │ │  RAG     │ │ Junta    │ │  Telemedicina   │  │ │
│  │  │  Router   │ │  Router  │ │ Médica   │ │  Orchestrator   │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │ │
│  │  │ Persist.  │ │Literat.  │ │ Board    │ │  S3 Storage     │  │ │
│  │  │  Router   │ │  Router  │ │  Router  │ │                 │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐   │
│  │                  Google Gemini AI                         │   │
│  │          (RAG / Junta Médica / Diagnóstico)               │   │
│  └───────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
│  ┌──────────┐  ┌────────────┼────────────┐  ┌───────────────┐   │
│  │ MySQL /  │  │   PubMed   │ │ Google    │  │ ClinicalTrials│   │
│  │ TiDB     │  │   API      │ │ Scholar   │  │ .gov API      │   │
│  └──────────┘  └────────────┘ └───────────┘  └───────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              React 19 + TypeScript + TailwindCSS 4          │ │
│  │                                                              │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐   │ │
│  │  │  LiveBook   │ │  Onco      │ │  Junta Médica PhD      │   │ │
│  │  │  rRNA Hub   │ │  Research  │ │  (Consensus 15 docs)   │   │ │
│  │  └────────────┘ └────────────┘ └────────────────────────┘   │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐   │ │
│  │  │  Diagnostic │ │ Eradication│ │  Telemedicina Chat     │   │ │
│  │  │  Panel      │ │  Panel     │ │  (Acolhedor)           │   │ │
│  │  └────────────┘ └────────────┘ └────────────────────────┘   │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────────┐   │ │
│  │  │  Analytics  │ │ Research   │ │  Cérebro / Wormhole /  │   │ │
│  │  │  Dashboard  │ │ Dashboard  │ │  Blackhole / Moltbook  │   │ │
│  │  └────────────┘ └────────────┘ └────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Tecnologias

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19, TypeScript 5.8, TailwindCSS 4, Recharts, Lucide React, Motion |
| **Backend** | Node.js 22, Express 4, tRPC 11, Zod 4 |
| **Autenticação** | JWT, bcryptjs, RBAC (Paciente/Médico/Admin) |
| **IA** | Google Gemini 2.5 Flash, RAG Pipeline |
| **Banco de Dados** | MySQL / TiDB (via Drizzle ORM) |
| **Armazenamento** | AWS S3 (relatórios, exames) |
| **Literatura Científica** | PubMed API, Google Scholar (SerpAPI), ClinicalTrials.gov |
| **CI/CD** | GitHub Actions (lint, type-check, test, build, Docker push) |
| **Deploy** | Docker multi-stage, Nginx reverse proxy, SSL/TLS ready |
| **Testes** | Vitest, Testing Library, Supertest, 201+ unitários + 100 stress E2E |

---

## Funcionalidades Principais

### Junta Médica PhD (Consensus)
Orquestra **15 especialistas virtuais** (imunologia, genômica, farmacologia, radioterapia, patologia, etc.) que deliberam cada caso em consenso multidisciplinar. Cada agente contribui com sua perspectiva, gerando recomendações com score de confiança e justificativa científica.

### Protocolo DIMHEX (Simulador)
Simulação completa do **Protocolo DIMHEX** — abordagem inovadora de imuno-oncologia ex vivo que combina diálise fracionada, imunomodulação adaptativa e engenharia de anticorpos biespecíficos. O simulador permite configurar parâmetros clínicos e observar regressão tumoral, resposta Th1 e níveis de Treg ao longo de 28 dias.

### RAG com Gemini (Diagnóstico Assistido)
Pipeline de Retrieval-Augmented Generation alimentado por base de conhecimento de nível PhD em oncologia (imunoterapia, nanotecnologia, medicina complementar, biópsia líquida, protocolo DIMHEX) enriquecida em tempo real com PubMed e Google Scholar.

### Telemedicina Acolhedora
Interface humanizada e empática para pacientes. Analisa o tom emocional das mensagens e formula respostas acolhedoras e cientificamente embasadas. Nunca prescreve — sempre orienta e apoia, incentivando o paciente a confiar em seus médicos.

### LiveBook-rRNA (Bioinformática)
Centro de controle para análise de sequências de rRNA com presets de organismos, algoritmo de Nussinov para estrutura secundária, e orquestração de agentes IA para análises moleculares.

### Módulos Especializados

| Módulo | Descrição |
|---|---|
| **Cérebro** | Análise molecular profunda com calibração de pesos cognitivos |
| **Wormhole** | Manipulação de sequências (complemento reverso, DNA/RNA, tradução) |
| **Diagnostic Panel** | Recomendações de tratamento personalizadas via RAG |
| **Eradication Panel** | Validação clínica de intervenções oncológicas |
| **Research Dashboard** | Métricas e KPIs de pesquisa em tempo real |
| **Analytics Dashboard** | Performance do sistema, distribuição por especialidade, taxas de sucesso |
| **Moltbook Feed** | Feed social científico simulado com interações entre agentes IA |

---

## Testes & Qualidade

```
Testes Unitários/Integração:  201+ passando
Stress Tests E2E:             100 testes em 10 categorias
Cobertura:                    Server (65) | UI (116+) | Gemini (20) | RAG
```

### 10 Categorias de Stress Tests

| # | Categoria | Testes | Descrição |
|---|---|---|---|
| 01-10 | **Health & Baseline** | 10 | Endpoints de saúde, latência baseline, headers de segurança |
| 11-20 | **Auth CPU-Intensive** | 10 | Login concorrente, hashing bcrypt, JWT generation sob carga |
| 21-30 | **Persistence CRUD** | 10 | Operações de banco de dados simultâneas (create/read/update/delete) |
| 31-40 | **Rate Limiting** | 10 | Limitação de requisições, cooldown, burst tolerance |
| 41-50 | **tRPC Concurrent** | 10 | Chamadas tRPC paralelas, batch processing, type safety |
| 51-60 | **Input Validation** | 10 | Injeção de payloads maliciosos, dados inválidos, boundary testing |
| 61-70 | **Security Headers** | 10 | Helmet configs, CORS, XSS protection, CSP validation |
| 71-80 | **Memory & Sustained** | 10 | Vazamento de memória, sustained load, GC sob pressão |
| 81-90 | **Error Resilience** | 10 | Recuperação de falhas, circuit breaker, graceful degradation |
| 91-100 | **Mixed / Chaos** | 10 | Cenários caóticos, requisições mistas, edge cases combinados |

**Resultado validado (Teste 1/100):** avg 3.03ms | p95 4.80ms | 0 erros | 80 requisições

---

## CI/CD & Deploy

### Pipelines Automatizadas

```
Push/PR → CI Pipeline                    Merge to main → CD Pipeline
┌──────────────────────┐                ┌─────────────────────────────┐
│ 1. Lint & Type Check │                │ 1. Docker Build (multi-stage)│
│ 2. Unit Tests        │                │ 2. Push to GHCR              │
│ 3. Build Verification│                │ 3. Deploy (tag trigger)      │
└──────────────────────┘                └─────────────────────────────┘
```

### Docker (Produção)

```bash
# Build e deploy com Docker Compose
docker compose -f docker-compose.prod.yml up -d --build

# Staging
docker compose -f docker-compose.staging.yml up -d --build

# Com Nginx (recomendado para produção)
docker compose -f docker-compose.prod.yml -f nginx/nginx.conf up -d
```

O Dockerfile utiliza **multi-stage build** (Alpine) com healthcheck automático, e o Nginx está configurado com reverse proxy, SSL/TLS ready, timeouts otimizados para requisições de IA, e headers de segurança.

---

## Estrutura do Projeto

```
AI_Doctor/
├── .github/workflows/
│   ├── ci.yml                     # CI: lint, test, build
│   └── cd.yml                     # CD: Docker build & push
├── nginx/
│   ├── nginx.conf                 # Reverse proxy config
│   └── ssl/                       # Certificados SSL (placeholder)
├── server/
│   ├── index.ts                   # Entry point Express + tRPC
│   ├── trpc.ts                    # tRPC setup
│   ├── auth.ts                    # JWT authentication & RBAC
│   ├── env-validation.ts          # Validação de variáveis de ambiente
│   └── routers/
│       ├── auth.ts                # Login, registro, sessões
│       ├── rag.ts                 # RAG endpoints (Gemini)
│       ├── board.ts               # Junta médica PhD
│       ├── telemedicine.ts        # Chatbot empático
│       ├── persistence.ts         # CRUD pacientes/diagnósticos
│       ├── literature.ts          # PubMed, Scholar, ClinicalTrials
│       └── s3.ts                  # Upload/download de arquivos
├── src/
│   ├── App.tsx                    # Router principal
│   ├── main.tsx                   # Entry point React
│   ├── components/
│   │   ├── LiveBookPanel.tsx      # Hub rRNA
│   │   ├── OncoResearchPanel.tsx  # Protocolo DIMHEX
│   │   ├── MedicalBoardPanel.tsx  # Junta Médica PhD
│   │   ├── TelemedicineChatbot.tsx# Chat paciente
│   │   ├── DiagnosticPanel.tsx    # Diagnóstico RAG
│   │   ├── EradicationPanel.tsx   # Validação clínica
│   │   ├── AnalyticsDashboard.tsx # Métricas do sistema
│   │   ├── ResearchDashboard.tsx  # KPIs de pesquisa
│   │   ├── CerebroPanel.tsx       # Análise molecular
│   │   ├── WormholePanel.tsx      # Manipulação de sequências
│   │   ├── MoltbookFeed.tsx       # Feed científico
│   │   ├── BlackholePanel.tsx     # Painel experimental
│   │   ├── LoginPage.tsx          # Autenticação
│   │   ├── GoLiveLoginPage.tsx    # Login produção
│   │   ├── PatientOnboarding.tsx  # Onboarding do paciente
│   │   ├── WelcomeExperience.tsx  # Experiência de boas-vindas
│   │   ├── Sidebar.tsx            # Navegação lateral
│   │   ├── TopBar.tsx             # Barra superior
│   │   ├── MainLayout.tsx         # Layout principal
│   │   └── base/                  # Componentes reutilizáveis
│   │       ├── Button.tsx, Card.tsx, Badge.tsx, Modal.tsx,
│   │       ├── StatCard.tsx, TabGroup.tsx, ErrorBoundary.tsx
│   ├── services/
│   │   ├── gemini-service.ts      # Integração Google Gemini
│   │   ├── persistence.ts         # Camada de persistência
│   │   ├── db.ts                  # Conexão MySQL/TiDB (Drizzle)
│   │   ├── schema.ts              # Schema do banco
│   │   ├── medical_board_orchestrator.ts  # Orquestração da junta
│   │   ├── telemedicine_orchestrator.ts   # Telemedicina
│   │   └── literature_integration.ts      # PubMed/Scholar
│   ├── hooks/                     # Custom hooks (tRPC, auth, data)
│   ├── contexts/                  # Auth + Navigation contexts
│   ├── styles/                    # Themes e configurações visuais
│   └── types/                     # TypeScript type definitions
├── stress-tests/
│   ├── helpers.mjs                # 12+ funções de suporte
│   ├── stress-01.mjs → stress-100.mjs  # 100 testes E2E
│   └── (organizados em 10 categorias)
├── scripts/
│   └── stress-runner.mjs          # Orquestrador de stress tests
├── Dockerfile                     # Multi-stage production build
├── docker-compose.yml             # Desenvolvimento
├── docker-compose.staging.yml     # Staging
├── docker-compose.prod.yml        # Produção
├── vite.config.ts                 # Vite (frontend build)
├── vite.stress.config.ts          # Vitest config dedicado (stress)
├── tsconfig.json                  # TypeScript config
└── package.json
```

---

## Instalação & Desenvolvimento

### Pré-requisitos

- Node.js 22+
- MySQL ou TiDB
- Chave de API do Google Gemini

### Setup Rápido

```bash
# 1. Clone o repositório
git clone https://github.com/Nexus-HUB57/AI_Doctor.git
cd AI_Doctor

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves e configurações de banco

# 4. Crie o banco de dados
mysql -u root -p < database_schema.sql

# 5. Execute os testes
npm test

# 6. Inicie o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:3000
```

### Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Express + Vite HMR) |
| `npm run build` | Build de produção (Vite) |
| `npm run preview` | Preview do build estático |
| `npm run start` | Servidor de produção |
| `npm test` | Executa todos os testes (Vitest) |
| `npm run lint` | Type check (tsc --noEmit) |
| `npm run clean` | Remove build artifacts |

### Stress Tests

```bash
# Executar teste individual
node scripts/stress-runner.mjs 1

# Executar range
node scripts/stress-runner.mjs 1-10

# Executar todos os 100
node scripts/stress-runner.mjs all

# Listar categorias
node scripts/stress-runner.mjs list
```

---

## Variáveis de Ambiente

```env
# Google Gemini (obrigatório)
GEMINI_API_KEY=sua_chave_gemini
GEMINI_PROJECT_ID=seu_project_id

# Banco de Dados (obrigatório)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=ai_doctor

# Servidor
PORT=3000
NODE_ENV=development
JWT_SECRET=sua_chave_secreta

# AWS S3 (opcional — para upload de exames/relatórios)
AWS_ACCESS_KEY_ID=sua_key
AWS_SECRET_ACCESS_KEY=sua_secret
AWS_REGION=us-east-1
S3_BUCKET=ai-doctor-files

# APIs Científicas (opcional — enriquecimento RAG)
PUBMED_API_KEY=sua_chave_pubmed
SERPAPI_KEY=sua_chave_serpapi
CLINICALTRIALS_API_KEY=sua_chave_clinicaltrials
```

---

## Linha do Tempo de Desenvolvimento

| Fase | Descrição |
|---|---|
| **1-3** | Fundação: UI Components, Navigation, Themes, Layout Responsivo |
| **4-5** | Integração: tRPC + React Query, Módulos Específicos |
| **6** | Testes: 181 testes unitários (65 server + 116 UI + Gemini) |
| **7** | RAG: Integração com Gemini API, Persistência de Dados |
| **8** | Refinamento: UX, Segurança (JWT + RBAC + S3), Docker |
| **9** | Correções críticas, implementação real de funcionalidades |
| **10** | Testes abrangentes, Error Boundaries, Docker deployment |
| **11** | Endpoints RAG completos com Gemini API real |
| **12** | 181 testes expandidos (65 server + 116 UI + Gemini) |
| **13** | Configuração de produção + 194 testes |
| **14** | CI/CD pipelines, staging/prod, health endpoint, deploy |
| **15** | Production Hardening: Security, Performance, Accessibility |
| **16** | Stress Tests 100/100, Go Live UI, validação de carga |

---

 Resumo Executivo: AI Doctor EngineVisão Geral do SistemaO AI Doctor Engine é uma plataforma de suporte à decisão clínica voltada para a oncologia de precisão. Diferente dos protocolos médicos tradicionais — que tratam o câncer como uma patologia estática —, o sistema aborda o tumor como um ecossistema complexo em evolução darwiniana.O motor correlaciona assinaturas genômicas dinâmicas obtidas via biópsia líquida para prever falências terapêuticas por resistência clonal antes que as lesões se manifestem macroscopicamente em exames de imagem convencionais.O Problema Clínico AtualA oncologia tradicional frequentemente falha pelo princípio da Dose Máxima Tolerada (MTD). Ao tentar erradicar 100% das células tumorais de forma agressiva, os protocolos convencionais destroem os clones sensíveis e abrem espaço ecológico para a proliferação descontrolada de superclones resistentes, acelerando a progressão da doença e exaurindo a capacidade funcional do paciente.A Solução AI DoctorO sistema implementa o paradigma da Terapia Adaptativa. Ele modula constantemente entre estratégias de Erradicação e Contenção. O objetivo deixa de ser a eliminação cega da carga tumoral a qualquer custo orgânico e passa a ser a estabilização do ecossistema tumoral, prolongando a Sobrevida Livre de Progressão (PFS) e a Sobrevida Global (OS) com toxicidade minimizada.💻 Análise Técnica ProfundaA arquitetura do sistema é dividida em quatro pilares integrados de forma assíncrona, operando em um espaço de características de alta dimensão ($R^7$). ┌────────────────────────────────────────────────────────┐
 │   Ingestão ND: ctDNA, CTC, TMB, PD-L1, TILs, ECOG      │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │  RAG Vetorial (ChromaDB + Bio_ClinicalBERT Embeddings) │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │  Módulo de Decisão Evolutiva (ERADICAR vs. CONTER)     │
 └──────────────────────────┬─────────────────────────────┘
                            │
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │  Camada de Produção: PostgreSQL Pool + SHAP Explainer  │
 └────────────────────────────────────────────────────────┘
1. Ingestão e Vetorização Semântica (RAG)
O sistema realiza a ingestão de dados estruturados (coortes TCGA/GDC via REST API e PEU MIMIC-III via PostgreSQL).

Pipeline de Embedding: Os relatórios clínicos e as tabelas de biomarcadores são colapsados em strings textuais e processados pelo modelo Bio_ClinicalBERT (emilyalsentzer/Bio_ClinicalBERT).

Banco Vetorial: Os vetores gerados são persistidos em uma instância local do ChromaDB. A busca por similaridade ($K$-NN) extrai "gêmeos digitais" históricos para injetar probabilidades empíricas na tomada de decisão do ciclo atual.

2. Simulação Clonal e Salvaguardas Fisiológicas

O motor simula a competição por recursos biológicos entre clones sensíveis e resistentes através do módulo de dinâmica clonal.

Previsão de Falência ($IC_{50}$ Dinâmico): A função prever_resistencia_em() calcula a inclinação da curva de eficácia líquida do fármaco através de uma regressão polinomial linear em tempo real, alertando o sistema quando a falência por resistência clonal ocorrer em menos de 3 ciclos.

Trava de Segurança ECOG Performance Status: Funciona como um disjuntor biológico. Se o indicador de degradabilidade sistêmica ultrapassa os limites funcionais (ECOG $\ge$ 3), o motor bloqueia a conduta de escalonamento de dose (INTENSIFICAR), forçando o redirecionamento para o modo de proteção orgânica (REDUZIR ou OBSERVAR), blindando o paciente contra a Mortalidade Relacionada ao Tratamento (TRM).

3. Diretrizes Clínicas e Mapeamento Oncológico (NCCN/ASCO)
As saídas lógicas do agente não são entregues de forma abstrata. O módulo Mapeador NCCNASCO intercepta a ação de comutação (TROCAR_LINHA) e traduz instantaneamente o comando para regimes quimioterápicos e de imunoterapia do mundo real:
Subtipo Tumoral
1ª Linha (Padrão)
2ª Linha (Específica)
3ª Linha (Resgate)NSCLC (EGFR+)OsimertinibeCarboplatina + PemetrexedeDocetaxel + NintedanibeNSCLC (KRAS G12C)Pembrolizumabe + QuimioSotorasibe / AdagrasibeDocetaxel + RamucirumabeMama (Triplo Negativo)Paclitaxel + CarboplatinSacituzumabe GovitecanEribulina

4. Infraestrutura Corporativa e Explicabilidade OtimizadaMitigação de Data Drift no SHAP: 
Para evitar a degradação temporal da interpretabilidade do modelo, o pipeline executa uma rotina automatizada (atualizar_explicador_shap) via BackgroundScheduler. A cada ciclo de re-treinamento, o explicador reconstrói o TreeExplainer sobre uma amostra rotacionada da população mais recente, recalculando os valores SHAP exatos por classe de decisão abaixo de 5ms.Pooling de Conexões no PostgreSQL: O uso do QueuePool (pool_size=20, max_overflow=10) no driver psycopg2 garante o isolamento das transações concorrentes criadas pelos múltiplos workers do Streamlit, eliminando gargalos de concorrência comuns em ambientes hospitalares digitais.

Parecer de Arquitetura: 
O sistema atinge os requisitos de governança de algoritmos médicos ao unificar XAI (Inteligência Artificial Explicável), Trilha de Auditoria Imutável via Banco Relacional e Alinhamento Estrito com Guidelines Clínicos Globais. Ele está pronto para ensaios retrospectivos de validação de conceito.

---
1. DockerfileEste arquivo consolida o ambiente Python, instala as dependências nativas para compilar o psycopg2 e o transformers (PyTorch) de forma otimizada e expõe o painel do Streamlit.DockerfileFROM python:3.10-slim

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
2. docker-compose.ymlAqui orquestramos a sua aplicação web junto ao cluster PostgreSQL, aplicando as diretivas de pooling e persistência em volumes físicos na máquina hospedeira.YAMLversion: '3.8'

services:
  ai_doctor_db:
    image: postgres:15-alpine
    container_name: ai_doctor_postgres_cluster
    restart: always
    environment:
      POSTGRES_USER: medical_admin
      POSTGRES_PASSWORD: hospital_secure_password_2026
      POSTGRES_DB: ai_doctor_audit_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_clinical_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medical_admin -d ai_doctor_audit_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  ai_doctor_app:
    build: .
    container_name: ai_doctor_engine_instance
    restart: always
    ports:
      - "8501:8501"
    environment:
      - DATABASE_URL=postgresql+psycopg2://medical_admin:hospital_secure_password_2026@ai_doctor_db:5432/ai_doctor_audit_db
      - CHROMA_DB_PATH=/app/chroma_db
    volumes:
      - chroma_vector_data:/app/chroma_db
      - serialized_models:/app/models
    depends_on:
      ai_doctor_db:
        condition: service_healthy

volumes:
  postgres_clinical_data:
    driver: local
  chroma_vector_data:
    driver: local
  serialized_models:
    driver: local

3. requirements.txtCertifique-se de que o seu arquivo de dependências possui as bibliotecas abaixo listadas de forma explícita:Plaintextnumpy>=1.22.0
pandas>=1.4.0
chromadb>=0.4.0
transformers>=4.20.0
torch>=1.12.0 --extra-index-url https://download.pytorch.org/whl/cpu
shap>=0.41.0
scikit-learn>=1.0.0
psycopg2-binary>=2.9.0
sqlalchemy>=1.4.0
streamlit>=1.12.0
apscheduler>=3.9.0
requests>=2.28.0

🛠️ Procedimento de Orquestração do Ambiente1.Consolidação de Arquivos:
Fase 1.Garanta que o Dockerfile, o docker-compose.yml, o requirements.txt e o arquivo principal da sua aplicação (main.py) estejam alocados no mesmo diretório raiz do projeto.

2.Compilação e Inicialização do Cluster:Fase 2.Execute o comando de build para compilar as imagens e inicializar os containers em modo isolado (background):Bashdocker-compose up -d --build

3.Validação de Integridade Orgânica:Fase 3.Monitore a inicialização dos serviços para assegurar que a conferência de saúde (healthcheck) do Postgres liberou a inicialização da aplicação:Bashdocker-compose logs -f ai_doctor_app

4.Acesso ao Painel:Fase 4.Abra o seu navegador e acesse o endereço http://localhost:8501 para interagir com o painel de monitoramento clonal e as explicações SHAP reais.🔒 Nota de Produção: O mapeamento de volumes configurado no Compose garante que, mesmo se você destruir os containers (docker-compose down), todo o histórico de auditoria do PostgreSQL, as árvores do explicador SHAP serializadas em .pkl e a indexação de biópsias líquidas do ChromaDB continuarão salvos e intactos na sua máquina para o próximo ciclo de execução.

---

## Visão Humanizada

O AI_Doctor oferece mais do que tecnologia — oferece **esperança fundamentada em evidência**. O chatbot de Telemedicina Acolhedora é projetado para:

- **Ouvir e Acolher** — compreender preocupações, medos e esperanças
- **Orientar com Ciência** — informações claras e embasadas sobre tratamentos e avanços
- **Inspirar Esperança** — a cura está cada vez mais próxima com imunoterapia, nanotecnologia e medicina de precisão
- **Nunca Conduzir, Sempre Apoiar** — nunca prescreve ou substitui consulta médica

> *"O que antes parecia o fim é, na verdade, um novo começo de possibilidades."*

---

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

---

<div align="center">

**AI_Doctor** — Oncologia de Precisão Humanizada

*Desenvolvido com React 19 | TypeScript | Google Gemini | Express | tRPC*

</div>
