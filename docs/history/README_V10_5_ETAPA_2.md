# InsightLab Studio v10.5 — Etapa 2: Performance e refatoração

Esta é a **segunda de três etapas** de estabilização para publicação do código no GitHub. Parte diretamente da v10.4 (Etapa 1). Preserva as regras de negócio, o design v10, os contratos FastAPI, o mock de login, o chat, o Canvas e o Dashboard Story.

## O que mudou

### 1. Motor de consultas compartilhado
- Novo arquivo `insightlab_mvp/query-engine-v105.js`: motor sem dependências com filtros, agregações numéricas (`sum`, `avg`, `count`, `min`, `max`), agrupamentos, recortes temporais, comparação entre meses e amostras limitadas para widgets de tabela.
- Resultados são indexados por **identidade/revisão do dataset + filtros normalizados + campo + métrica + dimensão + necessidade de mapa de calor**. Canvas e Dashboard Story compartilham o resultado agregado sem duplicar consultas equivalentes.
- Cache LRU limitado a 96 resultados e até 2 conjuntos de linhas filtradas, com até 150 mil referências de linha por conjunto. **São referências aos mesmos registros em memória**, não cópias profundas do CSV.
- Novas revisões do CSV invalidam caches. Filtros fixados são independentes dos filtros atuais da interface.
- O motor só agrega localmente; não envia registros ao provedor de IA nem modifica endpoints.

### 2. Canvas com atualização seletiva
- `builder.js` só reconstrói a grade quando widgets são adicionados, excluídos ou reordenados.
- Ao selecionar ou editar um widget, elementos não alterados permanecem no DOM. Cálculos já disponíveis são reutilizados.
- O painel de propriedades e a narrativa local não são recalculados quando nada relevante muda.
- A análise dos widgets passa a consumir o mesmo resultado do motor de consultas usado pela visualização.

### 3. Persistência e projetos
- `recent-projects.js` remove `setInterval(update,4000)` e recebe eventos `insightlab:dashboards-changed` e `insightlab:dashboard-created`.
- O Canvas expõe `getDashboardSummaries()` para evitar parsear `localStorage` toda vez que a lista é atualizada.
- Alterações de slides são persistidas com agrupamento de 280 ms, com descarregamento dos dados pendentes em `pagehide`/quando a aba se torna oculta. Alterações estruturais dos dashboards continuam usando salvamento imediato.
- Cache da representação HTML de slides limitado a 28 itens, além do cache analítico compartilhado.

### 4. Chat analítico
- `assistant-data-engine.js` usa o filtro compartilhado antes das consultas específicas do agente. Mantém a semântica existente: na ausência de filtro de status, consultas do agente incluem cancelamentos, diferente dos KPIs comerciais que os excluem por padrão.
- Consultas especiais (`frequency`, `distinct`, condições compostas) continuam no Tool Registry do agente para não mudar suas regras na Etapa 2.

## Testes e benchmarking

Execute a partir da pasta `insightlab_langchain/`:

```bash
node tests/stage1_integrity.test.cjs
node tests/stage2_query_engine.test.cjs
node tests/stage2_business_fixtures.test.cjs
node tests/benchmark_stage2.cjs
python -m pytest -q tests/test_backend_security.py
python tests/ui_smoke_stage1.py
python tests/ui_smoke_stage2.py
python -m compileall -q backend
```

Os testes Chromium exigem `playwright` e Chromium instalados; não são necessários para iniciar a aplicação Windows. Os CSVs fictícios usados nos testes estão em `examples/`.

A referência local em um ambiente de teste (Node 22, 36 leituras em 3 configurações analíticas) apresentou cerca de **146 ms no agrupamento independente vs. 62 ms no motor compartilhado com 100 mil linhas**. Houve 3 agregações reais, 33 acertos de cache e 1 scan do filtro. Números variam por computador, tamanho e diversidade das consultas. Em casos de pouca repetição ou bases pequenas, o cache não garante redução de tempo; o valor principal é eliminar consultas redundantes e limitar o uso de memória.

## Arquivos

**Novos:** `insightlab_mvp/query-engine-v105.js`, `tests/stage2_query_engine.test.cjs`, `tests/stage2_business_fixtures.test.cjs`, `tests/benchmark_stage2.cjs`, `tests/ui_smoke_stage2.py`, este README.

**Atualizados:** `insightlab_mvp/builder.js`, `index.html`, `presentation-studio.js`, `recent-projects.js`, `assistant-data-engine.js`.

**Não alterados:** backend FastAPI, schemas, endpoints e bibliotecas instaladas.

## Limitações deliberadas e próximos passos

- O chat preserva ferramentas analíticas especializadas; **não** foi substituído integralmente por um Query Engine único nesta etapa. A filtragem foi unificada e o cálculo compartilhado dos widgets foi centralizado.
- O motor e os datasets continuam no navegador. Uma base de centenas de milhares de registros pode exigir uma migração posterior para workers/IndexedDB/DuckDB. Não há paralelismo ou backend distribuído nesta versão.
- O mock de login **não** é autenticação real; não exponha o backend administrativo em uma instância pública sem RBAC e controle de acesso.
- As versões anteriores dos dashboards permanecem na mesma chave local, `insightlab_dashboards_v2`. Recomenda-se exportar os projetos em JSON antes da atualização.
- **Etapa 3:** README principal atualizado, padronização do repositório, instruções de instalação, CI, licença, revisão de segredos e screenshots oficiais.
