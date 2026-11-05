# InsightLab Studio v10.1 — Dashboard Story (apresentações vinculadas)

## O que mudou

O módulo independente de edição de apresentações foi substituído por um roteiro do **dashboard atual**, acessível no botão `presentDashboard` (Roteiro / Apresentar) do Canvas e no botão “Roteiro” do topo.

Não existe mais a criação de projetos de PowerPoint independentes. A sequência de slides é salva no array `slides` do próprio dashboard, na chave existente `insightlab_dashboards_v2` do armazenamento local. Os projetos recentes exibem dashboards com a contagem de slides associados.

Dados antigos do módulo `insightlab_presentations_v1` são **mantidos intactos no localStorage**, porém não aparecem no novo roteiro. Não foi feita migração automática de HTML estático antigo para vínculos vivos, pois essa migração poderia associar o widget incorreto.

## 1. Arquitetura Dashboard → Slide

Cada slide guarda um `widgetId` do dashboard de origem, um `datasetKey`, os filtros `from`, `to` e `store` capturados, além de `widgetState` com dimensão, métrica, campo, tipo e título originais.

O seletor de vínculo oferece:

- **Dinâmico:** usa o widget atual e os filtros ativos do Data Studio no momento de renderizar. Assim, revisões no Canvas e mudanças de filtros aparecem na visualização.
- **Recorte fixado:** mantém filtros e agrupamento capturados, mas *não congela os valores*. Os registros continuam sendo consultados na base atual, respeitando as datas e dimensões fixadas. Uma atualização no CSV pode alterar o resultado do slide.

A fonte é o `data` usado pelo Canvas atual. Modificações efetuadas pelo Data Studio emitem o evento `insightlab:data-changed`, invalidando o cache de renderização. As consultas são recalculadas sobre o conjunto ativo no navegador, sem duplicar elementos do Canvas ou depender de consultas adicionais ao servidor.

**Limitação:** atualizações de outros dispositivos ou colaboração multiusuário em tempo real não estão disponíveis. O MVP permanece local; “ao vivo” significa sincronização no mesmo navegador quando a fonte local é alterada.

## 2. Interface

- `presentDashboard`: abre o roteiro vinculado ao dashboard selecionado.
- Em cada widget do Canvas há um comando **Fixar no roteiro**, criando um slide com referência ao widget.
- A barra esquerda permite adicionar widgets e reordenar slides, além de inserir slides vazios.
- A área central mostra apenas o slide selecionado, renderizado com o motor do Canvas.
- A coluna direita contém filtros, captura de recorte, narrativa, sugestão de destaque e edição de overlays.
- Notas e destaques podem ser arrastados no slide. O texto e a posição são persistidos.
- O **Presenter Mode** usa a sequência em tela cheia (quando permitido pelo navegador), com teclas `←`, `→` e `Esc`.
- O botão **Voltar ao dashboard** devolve o usuário à grade do Canvas (Grid Mode).

## 3. Narrativa automatizada e integração com IA

O mecanismo local gera resumos fundamentados nos registros: contagem considerada, totais, picos, menores valores e, para séries mensais e KPIs, comparação entre períodos com registros. O texto explicita quando períodos podem estar incompletos. Nenhuma causa ou previsão é inferida.

Um botão opcional **Refinar texto com IA conectada** utiliza o endpoint já existente `/api/ai/chat`, mediante token administrativo e provedor configurado. Envia metadados e valores agregados, não dados brutos. O texto deve ser revisado antes de apresentar; não foi adicionada nenhuma API nova.

O botão **Sugerir pico / queda** cria um destaque com base no agrupamento calculado, que pode ser reposicionado. Em gráficos de linha, a marca de maior valor também recebe destaque visual durante a renderização.

## 4. Estrutura JSON

Veja `dashboard_story_payload_example.json` na raiz do projeto. A estrutura usa `slides[]` dentro do próprio dashboard, sem objetos HTML e sem salvar gráficos duplicados. IDs usados no exemplo são apenas ilustrativos.

## 5. Performance

- Apenas o slide atual é renderizado; não são montadas dezenas de gráficos escondidos no DOM.
- O cache de HTML analítico é indexado por ID do dashboard, definição do widget, filtros, configuração capturada e revisão dos dados.
- O cache tem limite em memória e é invalidado após alterações na fonte.
- Notas e textos podem ser editados sem limpar cálculos já cacheados.
- `renderWidget` e `getWidgetAnalysis` são reutilizados do Canvas, sem uma segunda implementação de gráficos nem novas requisições a banco.
- O renderizador HTML local continua indicado para conjuntos moderados. Para datasets extensos, o futuro Universal Data Engine deverá centralizar agregações e cache de consulta no backend.

## 6. Arquivos modificados

- `insightlab_mvp/builder.js` — IDs e configuração de widgets, API de renderização e análise, persistência de `slides`, botão Fixar.
- `insightlab_mvp/presentation-studio.js` — roteiro, slides vinculados, overlays, narrativa, presenter, cache.
- `insightlab_mvp/presentation-studio.css` — interface responsiva do Dashboard Story.
- `insightlab_mvp/recent-projects.js` — projetos como dashboards com slides vinculados.
- `insightlab_mvp/design-system.js` — remove visualizador independente legado, mantém tema e atalho Roteiro.
- `insightlab_mvp/index.html` — emite evento de alterações nos registros.
- `insightlab_mvp/datastudio-grid.js` — emite evento de alteração de filtros.
- `insightlab_mvp/product-ui-v10.js` e `.css` — remove atalho de apresentação independente e ajusta ações.

## 7. Validação e limitações

- Verificação de sintaxe JavaScript nos arquivos modificados: OK.
- Teste interativo no Chromium: login, Canvas, roteiro, pin, reorder, notas, filtros fixados, resumo, Presenter Mode, persistência e responsividade: OK; sem erros de JavaScript.
- O navegador de teste possuía restrição de acesso a localhost/file, por isso o frontend foi carregado com scripts e CSS em linha e armazenamento local simulado.
- Não foi feita chamada real ao Gemini/OpenAI, nem teste do `start.bat` em Windows. Não há sincronização multiusuário em tempo real.
- O Canvas atual ainda utiliza majoritariamente campos normalizados de vendas; esta atualização **não** implementa o Universal Data Engine.
