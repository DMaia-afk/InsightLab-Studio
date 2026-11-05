# InsightLab — Intelligent Data Workspace

MVP estático e responsivo de portfólio para Data Analytics e AI Engineering. Não utiliza marcas ou dados comerciais da empresa do projeto original.

## Como executar

Abra `index.html` em um navegador moderno. Para servir localmente: `python -m http.server 8000` e abra `http://localhost:8000`.

## O que funciona

- Dashboard com filtros de unidade e período, gráficos SVG, indicadores e mix de categorias.
- Importação de CSV (vírgula ou ponto e vírgula) com seleção de colunas conhecidas e validação básica.
- Tabela editável, exclusão de linhas e exportação de CSV; alteração reflete imediatamente nos indicadores.
- Mapa de calor por dia/horário.
- Insights determinísticos explicáveis e perguntas frequentes com respostas calculadas sobre dados ativos.
- Agenda mensal com inclusão/exclusão de eventos.
- Dados demonstrativos **sintéticos** e persistência local (localStorage).

## Limitações intencionais do MVP

- O assistente **não** utiliza LLM nem API de IA real. A integração com um LLM deverá ocorrer no backend, com validação e anonimização dos dados.
- Alterações em tempo real são reativas na interface, **não** sincronizadas entre múltiplos usuários.
- Importação por navegador: limitada a datasets moderados; muitos milhões de linhas precisam de ETL no servidor.
- Campos do CSV de exemplo antigo `sale_id` repetidos por itens são linhas de produtos, não transações únicas. A agregação deste MVP é por linha; para uso real implementar normalização/deduplicação no backend antes do cálculo de pedidos e ticket médio.
- Sem autenticação, banco persistente, upload remoto, testes automatizados ou segurança de multiusuários.

## Roadmap de integração à base Django existente

1. Renomear pacotes Django e remover logotipos, marcas, chaves e dados legados; usar migrations seguras.
2. Criar Dataset, DatasetVersion, DatasetColumn, ImportJob e InsightRun; usar PostgreSQL, armazenamento de arquivos e importação assíncrona.
3. Implementar perfilamento, mapping de colunas, normalização de moedas/data, deduplicação e reconciliação.
4. Criar APIs REST autenticadas para filtros, métricas, edição com auditoria e widget configuration.
5. Criar pipeline de IA: métricas calculadas por Python/SQL -> resultados estruturados -> LLM para interpretação com evidências, limites, prompt injection safeguards e privacidade.
6. Incluir execução de testes, CI, documentação e deploy no Render.

## Referência à base original

O arquivo submetido contém Django 5.2.7, Django REST Framework, análises operacionais (`analytics.py`), utilitário de qualidade CSV (`data_quality.py`), modelos de vendas, agenda, heatmap, scripts de testes e configuração Render. Este MVP visual é independente e não se apresenta como migração integral desse backend.

## Novo: Canvas analítico no-code (v2)

Abra a guia **Canvas no-code**. Não é necessário instalar dependências e tudo funciona no navegador.

- Crie, renomeie, duplique, alterne e exclua dashboards independentes.
- Adicione sete componentes com um clique: indicador (KPI), gráfico de barras, linha, rosca, tabela, bloco de texto e heatmap.
- Selecione um componente para alterar título, métrica (soma, contagem, média, menor ou maior), dimensão (categoria, unidade, status, dia, mês, hora) e largura (25%, 33%, 50%, 100%).
- Reordene arrastando os cartões em desktops. No celular os componentes ocupam toda a largura.
- Os componentes usam o dataset ativo do Data Studio, com atualização automática quando os dados são importados/editados.
- O layout é salvo em `localStorage` e pode ser exportado/importado como JSON (somente layout, **não** os dados).
- Botão “Layout de exemplo” restaura os widgets do dashboard ativo mediante confirmação.

**Limites importantes**: sem colaboração multiusuário, sem resize contínuo com mouse (largura é configurada por propriedade), sem autoidentificação de colunas arbitrárias no CSV (continua exigindo mapeamento de data/valor no importador atual), sem LLM real. Para publicar como produto, considerar API autenticada para salvar dashboards, esquema dinâmico de dados, filtros independentes por widget, RBAC, execução de consultas no servidor, versionamento e auditoria.
