# Fase 5 - Módulos Específicos

## 📋 Resumo

A Fase 5 concentra-se no desenvolvimento e implementação dos módulos principais da plataforma AI Doctor, utilizando a infraestrutura de UI (Fase 3) e a integração de dados (Fase 4) já estabelecidas. Cada módulo representa uma funcionalidade chave para o sistema, abrangendo desde diagnóstico assistido até análise avançada e telemedicina.

## 🎯 Objetivos

### 1. Dashboard Hub Completo
- Desenvolver o componente `DashboardHub.tsx` para exibir métricas em tempo real, status do sistema (TPS, latência, uptime) e agentes ativos.
- Integrar com os endpoints de analytics do tRPC para buscar e exibir dados dinamicamente.
- Implementar navegação intuitiva para todos os módulos.

### 2. Diagnóstico Assistido
- Criar o `DiagnosticPanel.tsx` para entrada de dados do paciente (nome, idade, diagnóstico, estágio).
- Integrar com o procedimento `rag.recommendTreatment` do tRPC para obter recomendações clínicas baseadas em RAG.
- Exibir as recomendações com score de confiança e sugestões de intervenções.
- Persistir os diagnósticos e recomendações utilizando os procedimentos `persistence.diagnoses.create` e `persistence.recommendations.create`.

### 3. Junta Médica PhD
- Desenvolver o `MedicalBoardPanel.tsx` para orquestrar a reunião de 15 especialistas virtuais.
- Implementar a seleção de tipo de tumor e estágio, e a listagem dos membros da junta.
- Integrar com os procedimentos `board.assemble`, `board.discuss`, `board.consensus` e `board.report` do tRPC para simular a discussão, calcular o consenso e gerar relatórios.
- Visualizar as discussões entre os agentes e a recomendação final com score de confiança.

### 4. Analytics em Tempo Real
- Aprimorar o `AnalyticsDashboard.tsx` para exibir gráficos de tendências de consultas, distribuição por especialidade e performance de agentes.
- Utilizar bibliotecas de visualização (ex: Recharts) para renderizar os dados obtidos dos procedimentos `persistence.analytics.getSystemStats`, `persistence.analytics.getQueryTrends` e `persistence.analytics.getAgentPerformance`.

### 5. LiveBook-rRNA
- Desenvolver o `LiveBookPanel.tsx` (ou similar) para implementar o algoritmo de Nussinov para predição de estrutura de rRNA.
- Criar visualização SVG circular da estrutura secundária.
- Integrar com o endpoint `/api/orchestrate` para análise de sequências e identificação de mutações compensatórias.

### 6. Telemedicina Acolhedora
- Criar o `TelemedicineChatbot.tsx` com uma interface de chat humanizada.
- Integrar com o backend para respostas geradas pelo Gemini, focando em suporte empático para pacientes oncológicos.
- Persistir o histórico de conversas e interações com pacientes.

### 7. Research Dashboard
- Desenvolver o `ResearchDashboard.tsx` para acompanhar estudos clínicos em andamento e exibir recomendações de terapia.
- Integrar com os procedimentos `literature.clinicalTrials.search` e `literature.treatmentRecommendations` do tRPC.
- Implementar a visualização de dados relacionados ao protocolo DIMHEX.

### 8. Painéis Avançados (CerebroPanel, WormholePanel, BlackholePanel, OncoResearchPanel)
- Desenvolver os componentes de UI para cada um desses painéis, conforme suas funcionalidades específicas descritas na arquitetura.
- Integrar com os respectivos endpoints de backend (ex: `/api/brain-analysis` para CerebroPanel) para processamento e exibição de análises avançadas.

## 📁 Estrutura de Arquivos (Modificações e Adições)

```
AI_Doctor/
├── src/
│   ├── components/
│   │   ├── DashboardHub.tsx             # Novo componente
│   │   ├── DiagnosticPanel.tsx          # Modificação e integração
│   │   ├── MedicalBoardPanel.tsx        # Modificação e integração
│   │   ├── AnalyticsDashboard.tsx       # Modificação e integração
│   │   ├── LiveBookPanel.tsx            # Novo componente
│   │   ├── TelemedicineChatbot.tsx      # Novo componente
│   │   ├── ResearchDashboard.tsx        # Modificação e integração
│   │   ├── CerebroPanel.tsx             # Novo componente
│   │   ├── WormholePanel.tsx            # Novo componente
│   │   ├── BlackholePanel.tsx           # Novo componente
│   │   └── OncoResearchPanel.tsx        # Novo componente
│   ├── hooks/
│   │   └── usePatientData.ts            # Exemplo de hook para dados de paciente
│   ├── types/
│   │   └── patient.ts                   # Definições de tipos para pacientes
│   │   └── medicalBoard.ts              # Definições de tipos para junta médica
│   └── App.tsx                          # Roteamento e integração dos novos módulos
```

## 🛠️ Tarefas Detalhadas

1. **Desenvolvimento de UI**: Criar e/ou modificar os componentes React para cada módulo, garantindo a responsividade e a usabilidade.
2. **Integração tRPC**: Conectar cada componente aos procedimentos tRPC correspondentes para buscar, enviar e atualizar dados.
3. **Gerenciamento de Estado**: Utilizar `useQuery` e `useMutation` do React Query para otimizar o gerenciamento de estado e cache de dados em cada módulo.
4. **Visualização de Dados**: Implementar gráficos e outras visualizações para os módulos de Analytics e Research.
5. **Lógica de Negócio Frontend**: Adicionar lógica específica de cada módulo, como validações de entrada, formatação de dados e interações com o usuário.
6. **Testes Unitários e de Integração**: Escrever testes para os novos componentes e para a integração com o backend.

## 🚀 Próximas Fases

### Fase 6: Testes e Otimização
- Testes unitários abrangentes para todos os módulos.
- Testes de integração ponta a ponta.
- Otimização de performance e acessibilidade (a11y).
- Auditoria de segurança.

## 📝 Notas

- Reutilizar os componentes base desenvolvidos na Fase 3 sempre que possível.
- Manter a consistência visual e de interação entre os módulos.
- Priorizar a experiência do usuário e a clareza na apresentação das informações médicas.

---

**Status**: 📝 Planejado
**Data**: Julho 2026
**Versão**: 3.0.0
