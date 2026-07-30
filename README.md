<div align="center">

# AI_Doctor

### Plataforma de Oncologia de Precisão Humanizada

**15 especialistas PhD virtuais | Protocolo DIMHEX | CHIMERA IA Distribuída | RAG 6 Estágios | Auto-Cura | rRNA Bioinformática | Telemedicina empática**

[![CI](https://github.com/Nexus-HUB57/AI_Doctor/actions/workflows/ci.yml/badge.svg)](https://github.com/Nexus-HUB57/AI_Doctor/actions/workflows/ci.yml)
[![CD](https://github.com/Nexus-HUB57/AI_Doctor/actions/workflows/cd.yml/badge.svg)](https://github.com/Nexus-HUB57/AI_Doctor/actions/workflows/cd.yml)
[![Tests](https://img.shields.io/badge/tests-Vitest_12_suites-brightgreen)]()
[![Stress Tests 100](https://img.shields.io/badge/stress_tests-100%2F100-blue)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)

---

**Sistema completo de diagnóstico assistido por IA, orquestração de junta médica virtual, simulação do Protocolo DIMHEX e telemedicina acolhedora para pacientes oncológicos.**

</div>

---

## Sobre o Projeto

O **AI_Doctor** é uma plataforma full-stack de oncologia de precisão que vai muito além da análise de dados biomédicos. O sistema orquestra **15 agentes especializados PhD** para deliberar casos clínicos em consenso, integra uma base de conhecimento científico nível PhD atualizada em tempo real via PubMed e Google Scholar, e oferece um canal de telemedicina empático que traduz complexidade oncológica em orientação acessível e esperançosa para o paciente.

Tudo isso construído sobre uma arquitetura production-ready com CI/CD automatizado, Docker, Nginx reverse proxy, testes automatizados (Vitest + 12 test suites) e 100 stress tests E2E que validam resiliência sob carga.

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
| **Testes** | Vitest, Testing Library, Supertest, 12 test suites (unit + integração) + 100 stress E2E |

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
Módulo completo de bioinformática de rRNA com **7 abas de análise** executadas inteiramente no browser (zero backend dependency):

| Aba | Algoritmos | Descrição |
|-----|-----------|----------|
| **Sequência & Parser** | FASTA Parser, rRNA Classifier | Parser FASTA robusto, identificação automática de 16S/18S/23S/5S/28S/12S por comprimento, GC e motifs conservados, 6 presets de organismos reais (E. coli, S. aureus, P. aeruginosa, H. sapiens, S. cerevisiae), exportação FASTA |
| **Composição & Diversidade** | GC Content, k-mer, Shannon, Simpson | GC content global + sliding window profile, análise k-mer (k=2..6) com gráficos, índices de Shannon (H, Hmax, equitabilidade) e Simpson (D, 1/D), composição nucleotídica visual |
| **Alinhamento NW** | Needleman-Wunsch, Complemento | Alinhamento global com scoring configurável (match/mismatch/gap), identidade, mismatches, gaps, notação midline, complemento e reverse complemento |
| **Filogenia** | UPGMA, Neighbor-Joining, p-distance | Matriz de distâncias por p-distance (via NW), árvores UPGMA e Neighbor-Joining com formato Newick, suporte a N sequências |
| **Estrutura 2D** | Nussinov DP O(n³) | Predição de estrutura secundária com DP, visualização circular SVG, notação dot-bracket, MFE estimado, sequência colorida por base |
| **RAG Pipeline** | BM25, TF-IDF, Cross-Encoder | **NOVO** Pipeline RAG médico 6 estágios: Recursive Chunking (Langchain-style), TF-IDF + N-gram expansion, BM25 scoring com field boosting, Cross-encoder re-ranking, Context window assembly com source attribution, Síntese LLM. Base pré-carregada com 6 documentos médicos (DIMHEX, NCCN, ESMO, farmacogenômica) |
| **Auto-Cura DIMHEX** | Self-Healing, Wisdom Engine | **NOVO** Motor de auto-cura com 5 métricas quânticas (fidelity, coherence, decoherence, entanglement, superposition), 6 algoritmos de cura (recalibrate, stabilize, reboot, amplify, shield, resync), ciclo OBSERVAR→DETECTAR→DIAGNOSTICAR→PRESCREVER→EXECUTAR, e Wisdom Engine com aprendizado exponencial de padrões, insights e memória de decisões |

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
Testes Unitários/Integração:  12 test suites (server + UI + serviços)
Stress Tests E2E:             100 testes em 10 categorias
Cobertura:                    Server (auth, rag, board, literature, persistence, health, env) | UI (navigation, error-boundary, base components, login) | Gemini service
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
│ 1. Type Check (tsc)  │                │ 1. Docker Build (multi-stage)│
│ 2. Unit Tests (Vitest)│              │ 2. Push to GHCR              │
│ 3. Build Verification│                │ 3. Deploy (tag trigger)      │
└──────────────────────┘                └─────────────────────────────┘
```

### Docker (Produção)

```bash
# Build e deploy com Docker Compose
docker compose -f docker-compose.prod.yml up -d --build

# Staging
docker compose -f docker-compose.staging.yml up -d --build

# Full-stack (todos os 7 serviços: Web + Nginx + MySQL + Redis + ChromaDB + Streamlit + Agente Python)
docker compose -f docker-compose.fullstack.yml up -d --build
```

O Dockerfile utiliza **multi-stage build** (Alpine) com healthcheck automático, e o Nginx está configurado com reverse proxy, timeouts otimizados para requisições de IA, e headers de segurança. Para SSL/TLS, monte seus certificados em `nginx/ssl/` e ajuste a config do Nginx.

---

## Estrutura do Projeto

```
AI_Doctor/
├── .github/workflows/
│   ├── ci.yml                     # CI: lint, test, build
│   └── cd.yml                     # CD: Docker build & push
├── nginx/
│   ├── nginx.conf                 # Reverse proxy config
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
│   │   ├── LiveBookPanel.tsx      # Hub rRNA (7 abas: bioinfo + RAG + auto-cura)
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
│   │   ├── chimera/                # **NOVO** CHIMERA: Arquitetura IA Distribuída (9 módulos, 1.692 linhas)
│   │   │   ├── index.ts            # Barrel export
│   │   │   ├── live-lab-types.ts   # 39 interfaces do Live Lab Tri-Nuclear
│   │   │   ├── algorithms.ts       # PROMETHEE II, Cascade, Token Bucket, Budget, RBAC, PII
│   │   │   ├── observability.ts    # Logger JSON, Metrics Prometheus, Tracer spans
│   │   │   ├── agent-memory.ts     # Memória 4 tipos (episodic, semantic, working, procedural)
│   │   │   ├── agent-message-bus.ts # P2P, broadcast, request/reply, handoff, blackboard
│   │   │   ├── agent-negotiation.ts # Contract Net, Voting, Debate protocols
│   │   │   ├── semantic-cache.ts   # SHA-256 LRU cache para respostas LLM
│   │   │   ├── skill-learner.ts    # Rolling performance tracking + auto-tuning
│   │   │   ├── mcdm-meta-learner.ts # Aprendizado adaptativo de pesos MCDM
│   │   │   └── routing-evaluator.ts # Accuracy@1/3, MRR, A/B testing
│   │   ├── gemini-service.ts      # Integração Google Gemini
│   │   ├── rnaBioinformatics.ts   # Motor rRNA: FASTA, NW, UPGMA, Nussinov, k-mer
│   │   ├── medicalRagEngine.ts   # RAG 6 estágios: Chunking, TF-IDF, BM25, Rerank, Context, Generate
│   │   ├── selfHealingEngine.ts  # Auto-cura dos agentes: 5 métricas, 6 skills, diagnóstico
│   │   ├── wisdomEngine.ts       # DIMHEX Pilar 3: padrões, insights, memória de decisões
│   │   ├── persistence.ts         # Camada de persistência
│   │   ├── db.ts                  # Conexão MySQL/TiDB (Drizzle)
│   │   ├── schema.ts              # Schema do banco
│   │   ├── medical_board_orchestrator.ts  # Orquestração da junta
│   │   ├── telemedicine_orchestrator.ts   # Telemedicina
│   │   └── literature_integration.ts      # PubMed/Scholar
│   ├── lib/bio/                   # **NOVO** Biblioteca bioinformática modular
│   │   ├── parsers.ts            # FASTA/FASTQ parsers
│   │   ├── analysis.ts           # k-mer, diversidade, composição
│   │   ├── alignment.ts          # Needleman-Wunsch, distâncias
│   │   ├── phylogeny.ts          # UPGMA, Neighbor-Joining, Newick
│   │   ├── taxonomy.ts           # Classificação taxonômica
│   │   └── rna-tools.ts          # Identificação de genes rRNA (conserved regions)
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
├── docker-compose.prod.yml        # Produção (web + Nginx)
├── docker-compose.fullstack.yml   # Full-stack (7 serviços: Web, Nginx, MySQL, Redis, ChromaDB, Streamlit, Agente)
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
| `make stress` | Executa todos os 100 stress tests |

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

## CHIMERA — Arquitetura de Inteligência Artificial Distribuída

O **CHIMERA** (Fase 23) é uma camada de infraestrutura de IA portada do ecossistema LiveBook-rRNA, composta por **9 módulos e 1.692 linhas** de TypeScript puro (zero dependências externas). Prove os fundamentos para orquestração inteligente, comunicação inter-agentes, auto-aprendizado e governança.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHIMERA — 9 Módulos                        │
├─────────────────┬───────────────────────────────────────────────┤
│ Live Lab        │ PROMETHEE II (MCDM), Cascade Router,          │
│ Algorithms      │ Token Bucket, Budget Tracker, RBAC, PII Audit │
├─────────────────┼───────────────────────────────────────────────┤
│ Observability   │ Logger JSON, Metrics (Prometheus), Tracer    │
├─────────────────┼───────────────────────────────────────────────┤
│ Agent Memory    │ 4 tipos: episódica, semântica, trabalho,      │
│                 │ procedimental — TTL + importância + recall    │
├─────────────────┼───────────────────────────────────────────────┤
│ Message Bus     │ P2P, broadcast, request/reply, handoff,       │
│                 │ blackboard KV — inbox per-agente com TTL     │
├─────────────────┼───────────────────────────────────────────────┤
│ Negotiation     │ 3 protocolos: Contract Net, Votação, Debate   │
│                 │ — para coordenação multi-agente               │
├─────────────────┼───────────────────────────────────────────────┤
│ Semantic Cache  │ SHA-256 + LRU — cache de respostas LLM com   │
│                 │ hit rate tracking, TTL e invalidação         │
├─────────────────┼───────────────────────────────────────────────┤
│ Skill Learner   │ Rolling performance, detecção de skills       │
│                 │ ausentes, sugestão de ajuste de tokens        │
├─────────────────┼───────────────────────────────────────────────┤
│ MCDM Meta-      │ Aprendizado adaptativo de pesos por tipo de   │
│ Learner         │ intent — EWMA + blending com defaults          │
├─────────────────┼───────────────────────────────────────────────┤
│ Routing         │ Accuracy@1, Accuracy@3, MRR, custo/efficiency,│
│ Evaluator       │ cascade hit rate, A/B testing de variantes     │
└─────────────────┴───────────────────────────────────────────────┘
```

### Uso (import barrel)

```typescript
import {
  // Algoritmos
  computeMCDMScores, routeIntent, cascadeMatch,
  matchSkill, composeMetaSkill, TokenBucket, BudgetTracker,
  maskPIIWithAudit, rbacCheck,
  // Observabilidade
  logger, metrics, tracer, createLogger,
  // Agentes
  agentMemory, agentBus, agentNegotiator,
  // Cache & Learning
  semanticCache, skillLearner, mcdmLearner, routingEvaluator,
  // Types
  type LiveLabModel, type Skill, type RoutingResult,
} from './services/chimera';
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
| **6** | Testes: 12 test suites (server + UI + Gemini) |
| **7** | RAG: Integração com Gemini API, Persistência de Dados |
| **8** | Refinamento: UX, Segurança (JWT + RBAC + S3), Docker |
| **9** | Correções críticas, implementação real de funcionalidades |
| **10** | Testes abrangentes, Error Boundaries, Docker deployment |
| **11** | Endpoints RAG completos com Gemini API real |
| **12** | Testes expandidos (server + UI + Gemini) |
| **13** | Configuração de produção + health check + monitoramento |
| **14** | CI/CD pipelines, staging/prod, health endpoint, deploy |
| **15** | Production Hardening: Security, Performance, Accessibility |
| **16** | Stress Tests 100/100, Go Live UI, validação de carga |
| **17** | DIMHEX v2.1, 4 camadas probabilísticas, Senciência, pipeline cânceres raros |
| **18** | RAG povoado (585 registros), protocolo aprendizagem 4h, auto-seed |
| **19** | **LiveBook-rRNA v2.0:** Módulo bioinformática completo — FASTA parser, identificação 16S/18S/23S/5S, GC profile, k-mer, Shannon/Simpson, Needleman-Wunsch, UPGMA, Nussinov |
| **20** | **RAG Pipeline Médico 6 Estágios:** Recursive Chunking, TF-IDF + N-gram, BM25 scoring, Cross-encoder re-ranking, Context assembly, Síntese LLM. Base pré-carregada com 6 documentos clínicos. Inspirado no LiveBook-rRNA reestruturado |
| **21** | **Self-Healing Engine:** Motor reativo de auto-cura dos 15 agentes PhD com 5 métricas, 6 algoritmos de cura, diagnóstico automático de anomalias e ciclo completo OBSERVAR→EXECUTAR |
| **22** | **Wisdom Engine (DIMHEX Pilar 3):** Auto-sabedoria com reconhecimento de padrões, insight bank, memória de decisões, crescimento exponencial de sabedoria, e sugestões preventivas wisdom-guided |
| **23** | **CHIMERA IA Distribuída:** Arquitetura de 9 módulos (1.692 linhas) portada do LiveBook-rRNA — MCDM PROMETHEE II, Cascade Router, Token Bucket, Budget Tracker, RBAC, PII Audit, Observability (Logger + Metrics Prometheus + Tracer), Agent Memory (4 tipos), Message Bus (P2P/broadcast/handoff/blackboard), Negotiation (Contract Net/Voting/Debate), Semantic Cache, Skill Learner, MCDM Meta-Learner, Routing Evaluator (A/B testing) |

---

## Relatórios Técnicos (`reports/`)

Todos os relatórios de arquitetura, validação e planejamento estão disponíveis em PDF no diretório [`reports/`](reports/):

| Relatório | Descrição |
|-----------|-----------|
| [01_Arquitetura_Completa_v2.0.pdf](reports/01_Arquitetura_Completa_v2.0.pdf) | Arquitetura completa: stack, DIMHEX, agente oncologico, FENIX, Senciência |
| [02_Resumo_Desenvolvimento.pdf](reports/02_Resumo_Desenvolvimento.pdf) | 16 fases de desenvolvimento, testes automatizados, 100 stress tests |
| [03_Implementacao_Seguranca.pdf](reports/03_Implementacao_Seguranca.pdf) | JWT, RBAC, Helmet/CORS, rate limiting, S3 seguro, validação de entrada |
| [04_Roadmap_Deploy_Proximo_Nivel.pdf](reports/04_Roadmap_Deploy_Proximo_Nivel.pdf) | Transição para deploy: infraestrutura, checklist, roadmap pós-deploy |
| [05_Pipeline_Canceres_Raros.pdf](reports/05_Pipeline_Canceres_Raros.pdf) | 56 termos PubMed, 34 ClinicalTrials, 8 cânceres raros validados |
| [Relatorio_Validacao_DIMHEX_v2.1_Canceres_Raros.pdf](reports/Relatorio_Validacao_DIMHEX_v2.1_Canceres_Raros.pdf) | Validação completa contra 8 cânceres raros com 18 referências |
| [06_Expansao_RAG_v4_38_Subtipos.pdf](reports/06_Expansao_RAG_v4_38_Subtipos.pdf) | Expansão do RAG para 38 subtipos tumorais |
| [07_Technical_Analysis_E2E_Deployment_Roadmap.pdf](reports/07_Technical_Analysis_E2E_Deployment_Roadmap.pdf) | Análise técnica E2E e roadmap de deployment |

---

## Deploy — Próximo Nível

### Arquitetura de Produção (Full-Stack: 7 Serviços)

```
┌────────────┐     ┌──────────────┐     ┌────────────────┐
│   Nginx    │────>│  Express API │────>│  MySQL / TiDB  │
│  :80/443   │     │   :3001      │     │    :3306       │
│            │────>│  Frontend    │     ├────────────────┤
│  (SSL/    │     │  (static)    │     │  Redis :6379   │
│   proxy)  │     ├──────────────┤     └────────────────┘
│            │     │  Streamlit   │     ┌────────────────┐
│            │────>│  Dashboard   │────>│  ChromaDB :8000│
└────────────┘     │   :8501      │     └────────────────┘
                   │  Agente Python     ┌────────────────┐
                   │  (DIMHEX 240min)   │  Scheduler     │
                   └───────────────────┴────────────────┘
```

### Comandos de Deploy

```bash
# Desenvolvimento (apenas web)
docker compose up -d --build

# Staging (web only)
docker compose -f docker-compose.staging.yml up -d --build

# Produção (web + Nginx)
docker compose -f docker-compose.prod.yml up -d --build

# Full-stack (todos os 7 serviços)
docker compose -f docker-compose.fullstack.yml up -d --build

# Verificar saúde
curl http://localhost:3000/api/health
docker compose ps
```

### Roadmap Pós-Deploy

| Fase | Período | Entregáveis |
|------|---------|-------------|
| **Maturação** | Dias 1-30 | Monitoramento, bug fixes, otimização de queries |
| **Expansão DIMHEX** | Dias 30-60 | 4 recomendações implementadas, priores expandidos |
| **Integração LLM** | Dias 60-90 | Orquestração LLM + RAG avançada, auto-sabedoria |
| **Escala** | Dias 90-120 | Kubernetes, autoscaling, CDN, multi-região |
| **Produção** | Dias 120+ | SLA 99.9%, disaster recovery, compliance HIPAA |

---

## RAG & Protocolo de Aprendizagem

### Base de Conhecimento Povoada (Auto-Seed)

O RAG é automaticamente povoado na primeira execução com **585 registros** em 2 coleções ChromaDB:

| Coleção | Registros | Conteúdo |
|---------|-----------|----------|
| `ai_doctor_tumores` | 550 | Casos clínicos sintéticos (11 subtipos, biomarcadores realistas) |
| `dimhex_conhecimento` | 35 | 31 documentos científicos + 4 protocolos NCCN/ESMO |

**Subtipos tumorais cobertos:** 8 cânceres raros (sinonasal, biliar, adenoide cístico, amígdala, trompa de falópio, apendicular, paratireoide, ampular) + NSCLC KRAS G12C + NSCLC EGFR + TNBC mamário.

### Protocolo de Aprendizagem (Scheduler v3.0)

| Job | Intervalo | Função |
|-----|-----------|--------|
| DIMHEX Ciclo Completo | **4 horas** | 7 fases: Coletar → Avaliar → Sabedoria → Integrar → Analisar → Reportar |
| Auto-Povoamento RAG | Diário | +22 novos casos sintéticos |
| Manutenção Senciência | Diário | Compacção + sabedoria profunda |
| Relatório Diário | Diário | Consolidado para dashboard |
| Health Check | 10 min | Monitora ChromaDB + memória |

### Início Rápido

```bash
cd "Agentic IA Doctor/AI_Doctor"
cp .env.example .env
pip install -r requirements.txt
python main.py  # Auto-seed RAG + Bootstrap DIMHEX + Scheduler 4h
```

---

## Agente Orquestrador de Oncologia de Precisao (`Agentic IA Doctor/`)

Dentro do ecossistema AI_Doctor existe um motor de decisao oncologica independente, escrito em Python, que implementa um **agente agentic** com auto-cura evolutiva. Consulte a documentacao completa em [`Agentic IA Doctor/README.md`](Agentic%20IA%20Doctor/README.md).

O agente percebe o estado clinico do paciente via 7 biomarcadores (ctDNA, CTC, TMB, PD-L1, TILs, ECOG), gera 150 cenarios prognosticos por ciclo usando **RAG + Monte Carlo**, decide por **fusao bayesiana** modulada por um sistema limbico artificial, e realiza **auto-cura evolutiva** — mutando seu proprio paradigma terapeutico quando a performance degrada.

```
Ingestao (ctDNA, CTC, TMB, PD-L1, TILs, ECOG)
       |
       v
RAG Vetorial (ChromaDB) + Memoria de Casos Analogos
       |                              ^
       v                              |  DIMHEX (a cada 240min)
Monte Carlo (150 simulacoes/ciclo)   |  PubMed + ClinicalTrials + WHO
       |                              |  -> Scoring Bayesiano 5D
       v                              |  -> Indexacao ChromaDB
Decisao Bayesiana modulada por       |  -> Insights acionaveis
Estado Emocional + Evidencia DIMHEX  |
       |                              |
       v                              |
Acao terapeutica -> Dinamica Clonal -> Fisiologia -> Reflexao
       |
       v
Auto-Cura Evolutiva (se erros >= 3 ou eficacia < 0.2)
```

| Modulo | Funcao |
|--------|--------|
| `core/agente.py` | Cerebro: percepcao, decisao bayesiana, auto-cura evolutiva |
| `core/clonal.py` | Dinamica clonal de resistencia tumoral (previsao de falencia) |
| `core/emocao.py` | Sistema limbico artificial (ansiedade, esperanca, estresse) |
| `core/fisiologia.py` | Reserva organica (renal, hepatica, hematologica) + trava ECOG |
| `core/genoma.py` | Paradigma terapeutico mutavel (12 hiperparametros evolutivos) |
| `core/memoria.py` | RAG in-memory: recuperacao de casos analogos |
| `core/explicador.py` | XAI: SHAP simulado + relatorio clinico |
| `core/shap_xai.py` | XAI: SHAP real com RandomForest substituto |
| `core/dimhex.py` | **DIMHEX v2.1:** motor de inteligencia medica continua (240min, 7 fases) |
| `core/relevance_scorer.py` | DIMHEX: scoring bayesiano 5D de relevancia clinica (27 biomarcadores, 11 subtipos) |
| `infrastructure/chroma_db.py` | ChromaDB persistente (casos + conhecimento DIMHEX) |
| `infrastructure/rag_seeder.py` | **RAG Seeder v3.0:** povoamento automatico (550 casos + 35 docs + 4 protocolos) |
| `infrastructure/audit.py` | Auditoria PostgreSQL (SQLAlchemy 2.0) |
| `infrastructure/scheduler.py` | **Scheduler v3.0:** 5 jobs (DIMHEX 4h, auto-seed, saude, memoria, relatorio) |
| `infrastructure/research_sources.py` | DIMHEX: PubMed, ClinicalTrials.gov, WHO |
| `infrastructure/knowledge_updater.py` | DIMHEX: indexacao + geracao de insights |
| `data_connectors.py` | TCGA GDC API + fallback sintetico |
| `mapeadores.py` | Protocolos NCCN/ASCO (3 subtipos, 3 linhas) |
| `dashboard/app.py` | Painel Streamlit (Tumor Board + DIMHEX) |

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

*Plataforma Web: React 19 | TypeScript | Google Gemini | Express | tRPC*  ·  *Agente: Python | ChromaDB | SHAP | Streamlit*

</div>
