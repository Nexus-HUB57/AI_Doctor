# Fase 4 - Integração de Dados

## 📋 Resumo

A Fase 4 foca na integração dos componentes de UI desenvolvidos na Fase 3 com os serviços de backend, estabelecendo a comunicação de dados e o gerenciamento de estado da aplicação. Esta fase é crucial para transformar a interface estática em uma aplicação dinâmica e funcional.

## 🎯 Objetivos

### 1. Configuração do tRPC
- Instalar e configurar as dependências do tRPC no frontend e backend.
- Definir os tipos de dados e procedimentos para os routers do tRPC.

### 2. Implementação de Routers tRPC
- Criar routers tRPC para os serviços de persistência de dados (`server_persistence_endpoints.ts`).
- Criar routers tRPC para os serviços de integração de literatura (`server_literature_endpoints.ts`).
- Criar routers tRPC para os serviços RAG (`server_rag_endpoint.ts`).
- Criar routers tRPC para os serviços de orquestração de junta médica (`server_telemedicine_endpoints.ts`).

### 3. Conexão de Componentes com APIs
- Utilizar os hooks do tRPC para consumir os dados do backend nos componentes React.
- Integrar o gerenciamento de estado com React Query para cache, sincronização e atualização de dados.

### 4. Gerenciamento de Estado com React Query
- Configurar o `QueryClientProvider` na aplicação.
- Implementar `useQuery` e `useMutation` para as operações de dados.

## 📁 Estrutura de Arquivos (Modificações e Adições)

```
AI_Doctor/
├── src/
│   ├── trpc/
│   │   ├── client.ts              # Cliente tRPC para o frontend
│   │   └── _app.tsx               # Integração tRPC com React Query
│   ├── services/
│   │   └── api.ts                 # Definições de tipos e interfaces para APIs (se necessário)
├── server/
│   ├── trpc.ts                    # Contexto e inicialização do tRPC no backend
│   ├── routers/
│   │   ├── persistence.ts         # Router tRPC para persistência
│   │   ├── literature.ts          # Router tRPC para literatura
│   │   ├── rag.ts                 # Router tRPC para RAG
│   │   └── board.ts               # Router tRPC para junta médica
│   └── index.ts                   # Agregação de todos os routers tRPC
├── package.json                   # Adição de dependências tRPC e React Query
├── tsconfig.json                  # Ajustes para tRPC
└── todo.md                        # Atualizar itens da Fase 4
```

## 🛠️ Tarefas Detalhadas

### Backend
1. **Instalar dependências**: `npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query`
2. **Configurar tRPC**: Criar `server/trpc.ts` com o contexto e inicialização.
3. **Criar Routers**: Implementar `server/routers/persistence.ts`, `server/routers/literature.ts`, `server/routers/rag.ts`, `server/routers/board.ts`.
4. **Integrar Routers**: Agrupar todos os routers em `server/index.ts`.
5. **Atualizar `server.ts`**: Integrar o servidor tRPC com o Express.

### Frontend
1. **Instalar dependências**: (Já listado acima)
2. **Configurar Cliente tRPC**: Criar `src/trpc/client.ts`.
3. **Integrar React Query**: Criar `src/trpc/_app.tsx` para o `QueryClientProvider` e `trpc.Provider`.
4. **Atualizar `main.tsx`**: Envolver o `App` com o `trpc.Provider`.
5. **Conectar Componentes**: Modificar componentes da Fase 3 (ex: `DiagnosticPanel.tsx`, `MedicalBoardPanel.tsx`) para usar os hooks do tRPC (`trpc.useQuery`, `trpc.useMutation`).

## 🚀 Próximas Fases

### Fase 5: Módulos Específicos
- Desenvolvimento dos módulos principais da aplicação, utilizando a integração de dados estabelecida nesta fase.

## 📝 Notas

- Priorizar a segurança na comunicação entre frontend e backend.
- Implementar tratamento de erros robusto para as chamadas de API.
- Garantir a reatividade e performance da aplicação com o uso adequado do React Query.

---

**Status**: 📝 Em Andamento
**Data**: Julho 2026
**Versão**: 3.0.0
