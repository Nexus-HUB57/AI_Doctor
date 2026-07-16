# AI_Doctor: Plataforma LiveBook-rRNA e Protocolo DIMHEX

![AI_Doctor Logo](https://raw.githubusercontent.com/Nexus-HUB57/AI_Doctor/main/assets/logo.png) <!-- Placeholder for a potential logo -->

## Visão Geral do Projeto

O **AI_Doctor** é uma plataforma full-stack inovadora projetada para a vanguarda da pesquisa em bioinformática e imuno-oncologia. Ele oferece um ambiente interativo para a análise de sequências de RNA ribossômico (rRNA) e a simulação de um protocolo de tratamento oncológico ex vivo de ponta, conhecido como **Protocolo DIMHEX**. A aplicação utiliza inteligência artificial avançada para orquestrar agentes especializados, simular cenários clínicos e facilitar a exploração de novas terapias contra o câncer.

## Funcionalidades Principais

A plataforma é estruturada em diversos painéis interativos, cada um com um propósito específico:

*   **Hub Principal (LiveBook-rRNA):** O centro de controle para gerenciamento de sequências de rRNA. Permite a seleção de presets de organismos, entrada manual de sequências, visualização da estrutura secundária (utilizando o algoritmo de Nussinov) e a orquestração de agentes de IA para análises moleculares detalhadas.
*   **Moltbook Feed:** Um feed social científico simulado onde agentes de IA podem gerar comentários e interagir com postagens sobre descobertas em biologia molecular e mutações de rRNA, promovendo um ambiente colaborativo virtual.
*   **Cérebro (Análise Molecular Profunda):** Este módulo oferece uma análise aprofundada de sequências de rRNA, permitindo aos pesquisadores calibrar pesos cognitivos para aspectos como conteúdo GC, dobramento secundário e conservação evolutiva. A IA Gemini sintetiza veredictos científicos, fornecendo insights valiosos.
*   **Onco Research Panel (Protocolo DIMHEX):** O componente central para a pesquisa oncológica. Simula o **Protocolo DIMHEX**, um tratamento imuno-oncológico ex vivo, com um simulador clínico configurável, informações sobre a sinergia com o SUS (Sistema Único de Saúde) e um **Onco-Advisor AI** para responder a perguntas sobre o protocolo e suas implicações.
*   **Wormhole Panel:** Uma ferramenta lúdica e funcional para manipulação de sequências, incluindo complemento reverso, troca entre DNA/RNA e tradução de códons para aminoácidos.
*   **Blackhole Panel:** Um painel experimental que permite resetar o estado da simulação, manipular agentes ou explorar cenários de "colapso" de sequências.

## Protocolo DIMHEX: Imuno-Oncologia Ex Vivo

O **Protocolo DIMHEX** (Diálise, Imunomodulação Adaptativa e Engenharia de Anticorpos Biespecíficos) representa uma abordagem inovadora para o tratamento de neoplasias refratárias. Baseado no conceito de "sangria otimizada" (aférese de sangue total), ele propõe um sistema fechado de otimização multimodal que envolve:

*   **Coleta Estratificada ("Sangria Fracionada"):** Coleta seletiva de frações ricas em leucócitos, plasma e, opcionalmente, eritrócitos.
*   **Potencialização de Leucócitos (Engenharia Funcional):** Ativação e expansão ex vivo de linfócitos T (com polarização Th1 e depleção de Tregs), e potencialização de neutrófilos e macrófagos.
*   **Engenharia de Anticorpos Hiperpotentes:** Geração de anticorpos biespecíficos e conjugados com enzimas (como Granzima B e Perforina) para direcionamento tumoral e lise celular.
*   **Eritrócitos Carregados com Enzimas:** Utilização de hemácias do próprio paciente para encapsular enzimas como L-asparaginase e Arginase-1, promovendo a inanição metabólica seletiva de células tumorais.

O protocolo é simulado na plataforma, permitindo a configuração de parâmetros clínicos e a observação da regressão tumoral, resposta Th1 e níveis de Treg ao longo de 28 dias. Este painel também inclui um **Onco-Advisor AI** que pode responder a perguntas sobre o protocolo, seus mecanismos de ação, e sua viabilidade no contexto do SUS, destacando a autonomia sanitária brasileira.

## Tecnologias Utilizadas

*   **Frontend:** React, Vite, TypeScript, TailwindCSS, Lucide-React.
*   **Backend:** Node.js, Express, TypeScript, dotenv.
*   **Inteligência Artificial:** Google GenAI (modelo `gemini-3.5-flash`).
*   **Bioinformática:** Algoritmo de Nussinov para predição de estrutura secundária de RNA.

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

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto com sua chave de API do Google Gemini:
    ```
    GEMINI_API_KEY=SUA_CHAVE_AQUI
    ```

4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:3000`.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests. Por favor, siga as diretrizes de código e estilo do projeto.

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE).
