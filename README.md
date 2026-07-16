# AI_Doctor: Plataforma LiveBook-rRNA e Protocolo DIMHEX

![AI_Doctor Logo](https://raw.githubusercontent.com/Nexus-HUB57/AI_Doctor/main/assets/logo.png) <!-- Placeholder for a potential logo -->

## Visão Geral do Projeto

O **AI_Doctor** é uma plataforma full-stack inovadora que transcende a pesquisa em bioinformática e imuno-oncologia, evoluindo para um sistema de **Oncologia de Precisão Humanizada**. Ele oferece um ambiente interativo para a análise de sequências de RNA ribossômico (rRNA), a simulação do **Protocolo DIMHEX**, e agora, um ecossistema completo para **diagnóstico assistido por IA, orquestração de junta médica PhD, análise de performance e telemedicina acolhedora**. A aplicação utiliza inteligência artificial avançada para orquestrar agentes especializados, simular cenários clínicos, integrar conhecimento científico global e, acima de tudo, **oferecer esperança fundamentada em evidência** aos pacientes oncológicos.

---

## Funcionalidades Principais (v2.1)

A plataforma é estruturada em diversos painéis interativos, cada um com um propósito específico, agora expandidos para oferecer uma experiência completa:

*   **Hub Principal (LiveBook-rRNA):** O centro de controle para gerenciamento de sequências de rRNA. Permite a seleção de presets de organismos, entrada manual de sequências, visualização da estrutura secundária (utilizando o algoritmo de Nussinov) e a orquestração de agentes de IA para análises moleculares detalhadas.

*   **Moltbook Feed:** Um feed social científico simulado onde agentes de IA podem gerar comentários e interagir com postagens sobre descobertas em biologia molecular e mutações de rRNA, promovendo um ambiente colaborativo virtual.

*   **Cérebro (Análise Molecular Profunda):** Este módulo oferece uma análise aprofundada de sequências de rRNA, permitindo aos pesquisadores calibrar pesos cognitivos para aspectos como conteúdo GC, dobramento secundário e conservação evolutiva. A IA Gemini sintetiza veredictos científicos, fornecendo insights valiosos.

*   **Onco Research Panel (Protocolo DIMHEX):** O componente central para a pesquisa oncológica. Simula o **Protocolo DIMHEX**, um tratamento imuno-oncológico ex vivo, com um simulador clínico configurável, informações sobre a sinergia com o SUS (Sistema Único de Saúde) e um **Onco-Advisor AI** para responder a perguntas sobre o protocolo e suas implicações.

*   **Wormhole Panel:** Uma ferramenta lúdica e funcional para manipulação de sequências, incluindo complemento reverso, troca entre DNA/RNA e tradução de códons para aminoácidos.

*   **Blackhole Panel:** Um painel experimental que permite resetar o estado da simulação, manipular agentes ou explorar cenários de "colapso" de sequências.

*   **Diagnostic Panel:** Agora integrado com o sistema RAG (Retrieval-Augmented Generation) para fornecer **recomendações de tratamento personalizadas** e análises clínicas baseadas em evidências científicas atualizadas.

*   **Eradication Panel:** Focado na **validação clínica de intervenções oncológicas**, utilizando o backend para verificar a eficácia e a segurança de diferentes abordagens terapêuticas.

*   **Research Dashboard:** Um painel abrangente para visualizar **métricas e KPIs de pesquisa**, oferecendo uma visão geral do progresso e dos resultados dos estudos.

*   **Analytics Dashboard:** Apresenta **visualizações em tempo real** da performance e uso do sistema, incluindo tendências de consultas, distribuição por especialidade, taxas de sucesso de tratamento e performance dos agentes PhD.

*   **Junta Médica PhD (Consensus):** Um módulo inovador que orquestra um **consenso entre 15 especialistas PhD em oncologia**. Cada caso é deliberado, gerando recomendações com score de confiança e perspectivas multidisciplinares.

*   **Telemedicina Acolhedora (Chatbot):** Uma interface humanizada e empática para pacientes, onde cada discussão é tratada pela junta médica "Consensus". O chatbot oferece **orientação científica, acolhimento e esperança**, traduzindo informações complexas em mensagens compreensíveis e inspiradoras, sempre reforçando que a cura está a um passo de acontecer com os avanços da medicina moderna.

---

## Protocolo DIMHEX: Imuno-Oncologia Ex Vivo

O **Protocolo DIMHEX** (Diálise, Imunomodulação Adaptativa e Engenharia de Anticorpos Biespecíficos) representa uma abordagem inovadora para o tratamento de neoplasias refratárias. Baseado no conceito de "sangria otimizada" (aférese de sangue total), ele propõe um sistema fechado de otimização multimodal que envolve:

*   **Coleta Estratificada ("Sangria Fracionada"):** Coleta seletiva de frações ricas em leucócitos, plasma e, opcionalmente, eritrócitos.
*   **Potencialização de Leucócitos (Engenharia Funcional):** Ativação e expansão ex vivo de linfócitos T (com polarização Th1 e depleção de Tregs), e potencialização de neutrófilos e macrófagos.
*   **Engenharia de Anticorpos Hiperpotentes:** Geração de anticorpos biespecíficos e conjugados com enzimas (como Granzima B e Perforina) para direcionamento tumoral e lise celular.
*   **Eritrócitos Carregados com Enzimas:** Utilização de hemácias do próprio paciente para encapsular enzimas como L-asparaginase e Arginase-1, promovendo a inanição metabólica seletiva de células tumorais.

O protocolo é simulado na plataforma, permitindo a configuração de parâmetros clínicos e a observação da regressão tumoral, resposta Th1 e níveis de Treg ao longo de 28 dias. Este painel também inclui um **Onco-Advisor AI** que pode responder a perguntas sobre o protocolo, seus mecanismos de ação, e sua viabilidade no contexto do SUS, destacando a autonomia sanitária brasileira.

---

## Tecnologias Utilizadas (v2.1)

O **AI_Doctor** é construído com uma stack tecnológica moderna e robusta:

*   **Frontend:** React 19, Vite, TypeScript, TailwindCSS, Recharts (para visualizações de dados), Lucide-React (ícones).
*   **Backend:** Node.js, Express, TypeScript, dotenv.
*   **Inteligência Artificial:** Google GenAI (modelo `gemini-3.5-flash`), Ollama (LLM local), OpenAI API (fallback).
*   **Bioinformática:** Algoritmo de Nussinov para predição de estrutura secundária de RNA.
*   **Banco de Dados:** MySQL/TiDB para persistência de dados e memória do sistema.
*   **Integrações Externas:** PubMed API, Google Scholar (via Serpapi), ClinicalTrials.gov API.

---

## Arquitetura Expandida

A arquitetura do AI_Doctor foi significativamente expandida para suportar as novas funcionalidades, com serviços backend dedicados:

*   **Serviço de Persistência:** Gerencia o armazenamento e recuperação de dados de pacientes, diagnósticos, tratamentos e histórico clínico em um banco de dados MySQL/TiDB.
*   **Serviço de Integração de Literatura:** Conecta-se a bases de dados científicas como PubMed, Google Scholar e ClinicalTrials.gov para enriquecer a base de conhecimento RAG com as últimas pesquisas.
*   **Serviço RAG (Retrieval-Augmented Generation):** Combina a base de conhecimento interna com informações externas para gerar respostas contextualizadas e personalizadas para consultas clínicas e recomendações de tratamento.
*   **Serviço de Orquestração da Junta Médica:** Coordena a deliberação entre os 15 agentes PhD, sintetizando suas perspectivas para formar um consenso clínico.
*   **Serviço de Telemedicina:** Gerencia o fluxo de diálogo do chatbot, analisa o tone emocional das mensagens do paciente e formula respostas acolhedoras e cientificamente embasadas.

---

## Base de Conhecimento RAG Avançada

A base de conhecimento do AI_Doctor foi ampliada para se tornar uma **biblioteca de nível PhD em oncologia**, abrangendo:

*   **Imunoterapia Moderna:** Terapias CAR-T, inibidores de checkpoint, microambiente tumoral.
*   **Nanotecnologia em Oncologia:** Nanopartículas para entrega de fármacos, teranóstica, fototermia plasmônica.
*   **Medicina Alternativa e Complementar:** Compostos polifenólicos, cogumelos medicinais, imunomoduladores naturais.
*   **Diagnóstico Avançado:** Biópsia líquida, ctDNA, IA em diagnóstico, perfil molecular.
*   **Protocolo DIMHEX:** Detalhes e mecanismos de ação do protocolo ex vivo.
*   **Algoritmos de Predição:** Scores de resposta imune, toxicidade, prognóstico.
*   **Estudos Clínicos em Andamento:** Informações atualizadas sobre ensaios clínicos relevantes.
*   **Recomendações para Seleção de Terapia:** Critérios de inclusão, algoritmos de decisão, manejo de eventos adversos.

Esta base é continuamente enriquecida através da integração com PubMed e Google Scholar, garantindo que as informações sejam sempre as mais recentes e relevantes.

---

## Visão Humanizada: Telemedicina Acolhedora

O **AI_Doctor** vai além da análise de dados, oferecendo um canal de comunicação empático e de suporte para pacientes oncológicos. O chatbot de Telemedicina Acolhedora é projetado para:

*   **Ouvir e Acolher:** Compreender as preocupações, medos e esperanças dos pacientes.
*   **Orientar com Ciência:** Fornecer informações claras e cientificamente embasadas sobre o câncer, tratamentos e avanços médicos.
*   **Inspirar Esperança:** Destacar que a cura é uma realidade cada vez mais próxima, graças à tecnologia e à pesquisa incessante. A mensagem central é que, com os avanços em imunoterapia, nanotecnologia e medicina de precisão, o que antes parecia o fim é, na verdade, um novo começo de possibilidades.
*   **Nunca Conduzir, Sempre Apoiar:** O sistema **nunca** prescreve ou substitui a consulta médica. Ele atua como um recurso de apoio, esclarecimento e motivação, incentivando o paciente a buscar e confiar em seus médicos.

---

## Instalação e Execução

Para configurar e executar o projeto localmente, siga os passos abaixo:

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Nexus-HUB57/AI_Doctor.git
    cd AI_Doctor
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Banco de Dados:**
    Crie o banco de dados e as tabelas usando o schema fornecido:
    ```bash
    mysql -u root -p < database_schema.sql
    # Ou use um cliente MySQL/TiDB para importar o arquivo
    ```

4.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto com suas chaves de API e configurações de banco de dados. Um exemplo (`.env.example`) está disponível no repositório.
    ```env
    # Google Gemini
    GEMINI_API_KEY=SUA_CHAVE_GEMINI
    GEMINI_PROJECT_ID=SEU_PROJECT_ID

    # Ollama (LLM local)
    OLLAMA_API_KEY=SUA_CHAVE_OLLAMA
    OLLAMA_BASE_URL=http://localhost:11434

    # OpenAI (fallback)
    OPENAI_API_KEY=SUA_CHAVE_OPENAI

    # Banco de Dados
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=SUA_SENHA_DB
    DB_NAME=ai_doctor

    # Servidor
    PORT=3000
    NODE_ENV=development

    # APIs Externas (Opcional, para RAG expandido)
    PUBMED_API_KEY=SUA_CHAVE_PUBMED # Opcional
    CLINICALTRIALS_API_KEY=SUA_CHAVE_CLINICALTRIALS # Opcional
    SERPAPI_KEY=SUA_CHAVE_SERPAPI # Para Google Scholar
    ```

5.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:3000`.

---

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests. Por favor, siga as diretrizes de código e estilo do projeto.

---

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).

---

**Versão:** 2.1.0  
**Data:** 15 de Julho de 2026  
**Desenvolvido por:** Manus AI
