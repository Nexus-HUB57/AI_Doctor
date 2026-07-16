# AI Doctor v2.0 - Project TODO

## Core Infrastructure
- [x] Configurar schema de banco de dados (pacientes, diagnósticos, tratamentos, etc)
- [x] Implementar tRPC routers para persistência de dados clínicos
- [x] Integrar Google Gemini API para análise RAG
- [ ] Configurar S3 para armazenamento de relatórios e sequências genômicas
- [x] Implementar sistema de autenticação e autorização (JWT + RBAC)

## Dashboard Hub
- [ ] Criar componente DashboardHub com métricas em tempo real
- [ ] Implementar exibição de TPS, latência, uptime e agentes ativos
- [ ] Adicionar navegação para todos os módulos
- [ ] Integrar com sistema de agentes dinâmicos

## Diagnóstico Assistido
- [ ] Criar painel de entrada de dados do paciente
- [ ] Implementar análise RAG via Gemini
- [ ] Exibir recomendações clínicas com score de confiança
- [ ] Integrar com persistência de dados clínicos

## Junta Médica PhD
- [ ] Implementar orquestração de 15 especialistas virtuais
- [ ] Criar sistema de cálculo de consenso clínico
- [ ] Gerar relatório consolidado de recomendações
- [ ] Integrar com banco de dados de especialistas

## Analytics Dashboard
- [ ] Implementar gráficos com Recharts (linha, pizza, barras)
- [ ] Exibir tendências de consultas
- [ ] Mostrar distribuição por especialidade
- [ ] Visualizar performance de agentes
- [ ] Integrar com dados do sistema

## LiveBook-rRNA
- [ ] Implementar algoritmo de Nussinov para predição de estrutura
- [ ] Criar visualização SVG circular de estrutura secundária
- [ ] Implementar identificação de mutações compensatórias
- [ ] Adicionar presets de sequências rRNA
- [ ] Integrar análise com agentes dinâmicos

## Telemedicina Acolhedora
- [ ] Criar interface de chat humanizada
- [ ] Implementar respostas com Gemini
- [ ] Adicionar suporte empático para pacientes oncológicos
- [ ] Integrar com histórico de pacientes

## Research Dashboard
- [ ] Implementar protocolo DIMHEX
- [ ] Acompanhar estudos clínicos em andamento
- [ ] Integrar com literatura científica (PubMed, Google Scholar)
- [ ] Exibir recomendações de terapia

## MoltBook Feed
- [ ] Criar feed social para agentes
- [ ] Implementar postagens de análises
- [ ] Adicionar sistema de comentários

## Painéis Avançados
- [ ] Implementar CerebroPanel (análise cerebral)
- [ ] Implementar WormholePanel (análise avançada)
- [ ] Implementar BlackholePanel (análise extrema)
- [ ] Implementar OncoResearchPanel (pesquisa oncológica)

## Sistema de Agentes
- [ ] Criar registro de agentes dinâmicos
- [ ] Implementar instanciação em tempo real
- [ ] Criar terminal de logs de bio-telemetria
- [ ] Implementar pipeline de orquestração bidirecional

## Integração com Dados
- [x] Persistência de dados de pacientes
- [x] Armazenamento de diagnósticos
- [x] Registro de mutações genéticas
- [x] Armazenamento de biomarcadores
- [x] Histórico de tratamentos
- [x] Recomendações clínicas

## Testes e Qualidade
- [ ] Escrever testes vitest para tRPC routers
- [ ] Testar componentes de UI críticos
- [ ] Validar integração com Gemini
- [ ] Testar persistência de dados

## Deployment
- [ ] Configurar variáveis de ambiente
- [ ] Preparar build para produção
- [ ] Testar em ambiente de staging
- [ ] Deploy final

---

## Completed Items
- [x] Estrutura de Navegação Principal (NavigationContext)
- [x] Componentes de Layout (Sidebar, TopBar, MainLayout)
- [x] Componentes Base Reutilizáveis (Card, Button, Badge, StatCard, Modal, TabGroup)
- [x] Sistema de Temas e Estilos (themes.ts, index.css, useTheme hook)
- [x] Configurações e Constantes (constants.ts)

## Fase 4 - Integração de Dados
- [ ] Instalar e configurar dependências do tRPC e React Query.
- [ ] Implementar routers tRPC para persistência de dados.
- [ ] Implementar routers tRPC para integração de literatura.
- [ ] Implementar routers tRPC para serviços RAG.
- [ ] Implementar routers tRPC para orquestração de junta médica.
- [ ] Conectar componentes de UI com as APIs tRPC.
- [ ] Configurar React Query para gerenciamento de estado e cache de dados.

## Fase 8 - Refinamento de UX, Visualização Avançada e Segurança
- [x] Refinar a Experiência do Usuário (UX)
    - [x] Desenvolver o componente DashboardHub com métricas em tempo real
    - [x] Integrar DashboardHub com dados de performance do sistema e agentes
    - [x] Implementar navegação fluida para todos os módulos
    - [x] Refinar a interface de chat da Telemedicina Acolhedora
    - [x] Integrar chatbot com histórico de pacientes
    - [x] Implementar funcionalidades de feedback do usuário para o chatbot
- [x] Implementar Visualizações Avançadas
    - [x] Implementar gráficos de linha, pizza e barras com Recharts para tendências de consultas
    - [x] Desenvolver visualizações para distribuição de casos por especialidade
    - [x] Criar gráficos para monitorar performance de agentes PhD
    - [x] Integrar Analytics Dashboard com dados persistidos
    - [x] Desenvolver visualização SVG circular da estrutura secundária de rRNA (algoritmo de Nussinov)
    - [x] Implementar interatividade na visualização de rRNA
    - [x] Integrar visualização de rRNA com identificação de mutações compensatórias
- [x] Fortalecer a Segurança da Plataforma
    - [x] Integrar provedor de autenticação JWT com bcryptjs
    - [x] Desenvolver sistema de autorização baseado em papéis (RBAC) com 4 roles
    - [x] Implementar gerenciamento de sessões seguras e proteção contra ataques (CSRF/XSS via Zod)
    - [x] Configurar S3 (mock para dev) para armazenamento seguro de relatórios e sequências genômicas
    - [x] Implementar lógica de upload e download de arquivos para o S3
    - [x] Garantir criptografia de dados em repouso (AES-256) e em trânsito (HTTPS/TLS) no S3
    - [x] Criar LoginPage com login/registro e credenciais de teste
    - [x] Criar AuthContext com hook useAuth e verificação de permissões
    - [x] Criar componente FileManager com upload, download e delete por categoria
    - [x] Integrar auth header (Bearer JWT) no client tRPC
    - [x] Adicionar guard de autenticação no App.tsx
    - [x] Atualizar Sidebar com info do usuário, role badge e logout funcional
    - [x] Atualizar TopBar com avatar, nome e role do usuário autenticado
    - [x] Criar routers tRPC auth (login, register, me, changePassword, rolesInfo)
    - [x] Criar router tRPC s3 (upload, download, list, delete, categories)
    - [x] Adicionar protectedProcedure e roleProtectedProcedure ao tRPC
