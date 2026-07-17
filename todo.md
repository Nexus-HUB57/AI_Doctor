# AI_Doctor v2.0 - Project TODO

## Core Infrastructure
- [x] Configurar schema de banco de dados (pacientes, diagnósticos, tratamentos, etc)
- [x] Implementar tRPC routers para persistência de dados clínicos
- [x] Integrar Google Gemini API para análise RAG
- [x] Configurar S3 para armazenamento de relatórios e sequências genômicas (mock dev)
- [x] Implementar sistema de autenticação e autorização (JWT + RBAC)

## Dashboard Hub
- [x] Criar componente DashboardHub com métricas em tempo real
- [x] Implementar exibição de métricas via API (especialistas, consenso, sessões)
- [x] Adicionar navegação para todos os módulos
- [x] Integrar com board statistics e system stats via tRPC

## Diagnóstico Assistido
- [x] Criar painel de entrada de dados do paciente
- [x] Implementar análise RAG via Gemini
- [x] Exibir recomendações clínicas com score de confiança
- [x] Integrar com persistência de dados clínicos

## Junta Médica PhD
- [x] Implementar orquestração de 15 especialistas virtuais com Gemini API
- [x] Criar sistema de cálculo de consenso clínico via IA
- [x] Gerar relatório consolidado de recomendações
- [x] Integrar com banco de dados de especialistas (medical_agents_registry.json)
- [x] Seleção automática de especialistas relevantes por keyword matching
- [x] Debate estruturado entre especialistas via Gemini

## Analytics Dashboard
- [x] Implementar gráficos com Recharts (linha, pizza, barras)
- [x] Exibir tendências de consultas
- [x] Mostrar distribuição por especialidade
- [x] Visualizar performance de agentes
- [x] Integrar com dados persistidos do sistema

## LiveBook-rRNA
- [x] Implementar algoritmo de Nussinov para predição de estrutura
- [x] Criar visualização SVG circular de estrutura secundária
- [x] Implementar identificação de mutações compensatórias
- [x] Adicionar presets de sequências rRNA
- [x] Integrar análise com agentes dinâmicos

## Telemedicina Acolhedora
- [x] Criar interface de chat humanizada
- [x] Implementar respostas com Gemini
- [x] Adicionar suporte empático para pacientes oncológicos
- [x] Integrar com histórico de pacientes

## Research Dashboard
- [x] Implementar protocolo DIMHEX
- [x] Acompanhar estudos clínicos em andamento
- [x] Integrar com literatura científica (PubMed, ClinicalTrials.gov)
- [x] Exibir recomendações de terapia

## MoltBook Feed
- [x] Criar feed social para agentes
- [x] Implementar postagens de análises
- [x] Adicionar sistema de comentários

## Painéis Avançados
- [x] Implementar CerebroPanel (análise cerebral)
- [x] Implementar WormholePanel (análise avançada)
- [x] Implementar BlackholePanel (análise extrema)
- [x] Implementar OncoResearchPanel (pesquisa oncológica)

## Sistema de Agentes
- [x] Criar registro de agentes dinâmicos (medical_agents_registry.json)
- [x] Implementar instanciação baseada em caso clínico (keyword matching)
- [x] Criar pipeline de orquestração via Gemini com personas

## Integração com Dados
- [x] Persistência de dados de pacientes (db.ts + in-memory fallback)
- [x] Armazenamento de diagnósticos
- [x] Registro de mutações genéticas
- [x] Armazenamento de biomarcadores
- [x] Histórico de tratamentos
- [x] Recomendações clínicas

## Integração com Literatura (Fase 9)
- [x] Implementar busca real no PubMed via E-utilities API
- [x] Implementar busca real no ClinicalTrials.gov via API v2
- [x] Cache de resultados com TTL
- [x] Recomendações de tratamento baseadas em literatura
- [x] Tópicos em tendência (curated + PubMed)
- [x] Resumo de artigos via Gemini

## Testes e Qualidade
- [x] Escrever testes vitest para tRPC routers (65 testes em 5 arquivos: persistence, rag, board, literature, auth)
- [x] Implementar Error Boundary no frontend para captura graciosa de erros
- [x] Refatorar componentes (DashboardHub, DiagnosticPanel, MedicalBoardPanel) com estados de loading/error
- [x] Criar hooks customizados (useTRPCMutation, useTRPCQuery) para padronizar chamadas tRPC
- [x] Testar componentes de UI críticos com @testing-library/react
- [x] Validar integração com Gemini (mock-based)

## Deployment
- [x] Criar Dockerfile multi-stage para build otimizado
- [x] Criar docker-compose.yml com healthcheck
- [x] Criar .dockerignore para builds limpos
- [x] Configurar variáveis de ambiente (produção)
- [x] Testar em ambiente de staging
- [x] Deploy final

---

## Completed Items
- [x] Estrutura de Navegação Principal (NavigationContext)
- [x] Componentes de Layout (Sidebar, TopBar, MainLayout)
- [x] Componentes Base Reutilizáveis (Card, Button, Badge, StatCard, Modal, TabGroup)
- [x] Sistema de Temas e Estilos (themes.ts, index.css, useTheme hook)
- [x] Configurações e Constantes (constants.ts)

## Fase 4 - Integração de Dados
- [x] Instalar e configurar dependências do tRPC e React Query
- [x] Implementar routers tRPC para persistência de dados
- [x] Implementar routers tRPC para integração de literatura
- [x] Implementar routers tRPC para serviços RAG
- [x] Implementar routers tRPC para orquestração de junta médica
- [x] Conectar componentes de UI com as APIs tRPC
- [x] Configurar React Query para gerenciamento de estado e cache de dados

## Fase 8 - Refinamento de UX, Visualização Avançada e Segurança
- [x] Refinar a Experiência do Usuário (UX)
- [x] Implementar Visualizações Avançadas
- [x] Fortalecer a Segurança da Plataforma

## Fase 9 - Correção de Bugs Críticos e Funcionalidades Reais
- [x] Corrigir tRPC client: adicionar Bearer token JWT no headers
- [x] Corrigir App.tsx: criar SharedStateContext e passar props para todos os componentes
- [x] Corrigir gemini-service.ts: migrar de @google/generative-ai para @google/genai
- [x] Corrigir db.ts: remover import de _core/env inexistente
- [x] Corrigir board router: corrigir schema mismatch, implementar endpoints reais com Gemini
- [x] Implementar Junta Médica PhD real: assemble, discuss, consensus, debate com Gemini API
- [x] Implementar DashboardHub com dados dinâmicos da API
- [x] Implementar literature router: busca real PubMed + ClinicalTrials.gov
- [x] Wire persistence router: conectar ao db.ts com fallback in-memory
- [x] Atualizar MedicalBoardPanel para usar novos schemas
- [x] Remover código morto (serviços REST não utilizados)

## Fase 10 - Testes Abrangentes, Error Boundaries e Deployment
- [x] 65 testes Vitest em 5 arquivos (persistence: 27, rag: 10, auth: 15, board: 6, literature: 7)
- [x] ErrorBoundary component integrado em todas as abas do App.tsx
- [x] Refatoração de DashboardHub, DiagnosticPanel, MedicalBoardPanel com loading/error states
- [x] Hooks customizados useTRPCMutation e useTRPCQuery
- [x] Dockerfile multi-stage + docker-compose.yml + .dockerignore
- [x] Documentação FASE_10_TESTES_DEPLOYMENT.md

## Fase 11 - Endpoints RAG Completos com Gemini API
- [x] Implementar 7 novas funções no gemini-service.ts (analyzeBiomarkers, analyzeDIMHEX, predictTreatmentResponse, predictToxicity, recommendImmunotherapy, recommendNanotherapy, recommendComplementaryMedicine)
- [x] Wire todos os 7 endpoints TODO do RAG router com chamadas reais ao Gemini
- [x] Fallbacks robustos para cada endpoint quando Gemini indisponível
- [x] Atualizar testes rag.test.ts com mocks detalhados e asserts de valores
- [x] Zero TODOs restantes no rag.ts
- [x] 65 testes passando em 3.19s

## Fase 12 - Testes de Componentes UI e Integração Gemini (Mock)
- [x] Infraestrutura: test-setup.ts (jest-dom, window mocks, console suppression)
- [x] Corrigir vite.config.ts: environment jsdom, glob .tsx, setupFiles
- [x] Instalar @testing-library/user-event
- [x] 57 testes de componentes base (Button: 13, Card: 7, StatCard: 9, Modal: 7, TabGroup: 6, Badge: 10, Login: 5)
- [x] 10 testes do ErrorBoundary (catch, reset, custom fallback, navigation, deep nesting, onError callback)
- [x] 14 testes do LoginPage (login/register toggle, auth flows, loading states, validation)
- [x] 13 testes do Sidebar + TopBar (navigation, logout, context mocks, user info, role badges)
- [x] 22 testes de integração Gemini mock-based (todas 11 funções do gemini-service, happy path + fallback)
- [x] Pragmas @vitest-environment node nos 5 test files de server
- [x] 181 testes passando (65 server + 116 frontend/integration)

## Fase 13 - Configuração de Ambiente para Produção
- [x] .env.example completo com todas as 6 variáveis documentadas (GEMINI_API_KEY, JWT_SECRET, DATABASE_URL, NODE_ENV, PORT, DISABLE_HMR)
- [x] .envignore para proteger .env de versionamento
- [x] server/env-validation.ts: validação de ambiente com specs declarativas, erros/warnings, config object
- [x] Integrar validateAndReport() no server.ts (executa antes de qualquer inicialização)
- [x] Corrigir bug crítico do Dockerfile: server.ts e arquivos _endpoints.js não eram copiados para produção
- [x] Melhorar Dockerfile: HEALTHCHECK inline, comentários por seção, npm ci --omit=dev
- [x] Remover JWT_SECRET hardcoded do docker-compose.yml (agora requerido via ${JWT_SECRET:?ERROR})
- [x] Melhorar segurança do server/auth.ts: JWT_SECRET obrigatório em produção (throw), não usa fallback
- [x] PORT dinâmico via env var (server.ts usa parseInt(envConfig.PORT))
- [x] 13 testes de env-validation (missing key, short key, valid, production JWT required, warnings)
- [x] 194 testes passando em 11 arquivos

## Fase 14 - CI/CD, Staging & Deploy Final
- [x] GitHub Actions CI pipeline (.github/workflows/ci.yml): lint, type-check, test matrix (Node 20/22), build, Docker build test
- [x] GitHub Actions CD pipeline (.github/workflows/cd.yml): build & push to GHCR, deploy staging (on main), deploy production (on version tag)
- [x] /api/health endpoint dedicado no server.ts (status, version, uptime, memory, environment, timestamp)
- [x] 7 testes do /api/health endpoint (server/health.test.ts com supertest)
- [x] docker-compose.staging.yml: single replica, debug logging, resource limits, volume mounts, healthcheck via /api/health
- [x] docker-compose.prod.yml: Nginx reverse proxy, 2 app replicas, persistent volumes, resource limits, structured logging
- [x] nginx/nginx.conf: upstream round-robin, proxy headers, timeouts para AI requests, SSL ready (comentado), security headers
- [x] Makefile: help, dev, install, lint, test, test-watch, test-coverage, build, clean, staging, prod, deploy, rollback, health, ps, shell
- [x] scripts/deploy.sh: pre-flight checks, pre-deploy validation (tsc + test + build), deploy staging/prod, wait_for_healthy, rollback automático
- [x] .github/ISSUE_TEMPLATE/bug_report.md e feature_request.md
- [x] .github/PULL_REQUEST_TEMPLATE.md
- [x] Corrigir race condition em seedUsers() (idempotente por usuário, remover chamada não-awaited no router)
- [x] Atualizar todos Dockerfiles/docker-compose para usar /api/health no healthcheck
- [x] 201 testes passando em 12 arquivos

## Fase 15 - Production Hardening (Segurança, Performance, Acessibilidade)
- [x] Security middleware: helmet (15+ headers), CORS configurável, rate-limiting (100/15min geral, 20/min AI endpoints)
- [x] Body size limit (1MB) para proteção contra payloads excessivos
- [x] Structured request logging (JSON com correlationId, method, path, status, duration)
- [x] Trust proxy habilitado em produção (para Nginx)
- [x] Code splitting: 14 painéis com React.lazy() + Suspense (reduz initial bundle significativamente)
- [x] Bundle optimization: manual chunks (vendor-recharts 420KB, vendor-aws, vendor-genai, vendor-react, vendor-motion)
- [x] tRPC error interceptor: auto-logout em UNAUTHORIZED, retry com backoff exponencial (2x) em 5xx
- [x] Acessibilidade Modal: role="dialog", aria-modal, aria-labelledby, focus trap, Escape key, focus restore
- [x] Acessibilidade Button: aria-busy no loading, aria-hidden em ícones decorativos, aria-live no texto
- [x] Acessibilidade Sidebar: aria-label na nav, aria-current="page" nos itens ativos
- [x] Acessibilidade LoginPage: role="alert" + aria-live="assertive" nos erros, aria-pressed nos botões de role, aria-busy no submit
- [x] CSS: prefers-reduced-motion (desabilita animações para usuários com sensibilidade), focus-visible (ring apenas por teclado)
- [x] CSS: utilitário .sr-only para screen readers
- [x] Hooks robustos: useTRPCQuery com AbortController, enabled flag, tipagem genérica (sem any)
- [x] Hooks robustos: useTRPCMutation com AbortController, tipagem genérica (sem any)
- [x] CORS_ORIGINS documentado no .env.example
- [x] 201 testes passando em 12 arquivos, build OK com code splitting