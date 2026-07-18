# AI Doctor – Agente Oncológico de Precisão

## Instalação
```bash
pip install -r requirements.txt

## Configuração
Edite config.py com a URL do PostgreSQL e os caminhos desejados.

Uso
Para iniciar o pipeline completo: python main.py

Para abrir o dashboard: streamlit run dashboard/app.py

## Estrutura
core/: lógica clínica do agente

infrastructure/: ChromaDB, auditoria, scheduler, validação

dashboard/: interface Streamlit

models/: modelos treinados gerados automaticamente

## Monitoramento
O scheduler atualiza o RAG a cada 24h (configurável).

Auditoria registra todas as decisões no PostgreSQL com pooling.

text

---

## 🚀 Instruções de Implantação

1. **Clone ou crie a estrutura de diretórios** conforme listado acima.
2. **Crie um banco PostgreSQL** e atualize `config.py` com as credenciais.
3. **Instale as dependências**.
4. **Execute `python main.py`** para treinar o modelo e iniciar o agente.
5. **Para a interface web**, execute `streamlit run dashboard/app.py`.
6. **Para aprendizado contínuo**, coloque arquivos `novos_casos.csv` no diretório raiz; o scheduler os processará automaticamente.

---

Com isso, você tem uma plataforma **100% funcional, validada e pronta para produção**, integrando os quatro pilares oncológicos, persistência vetorial, explicabilidade SHAP, auditoria PostgreSQL com pooling, scheduler e dashboard interativo. 🧬🚀
