# InsightLab Studio v10.0 — Human-centered interface

Esta versão parte do código **v9.9**, preservando os módulos existentes, as funções de importação/edição, o Canvas, o chat, a agenda, o editor de apresentação e as APIs do backend.

## Direção de produto

- **Produto:** espaço de trabalho para importar CSVs, explorar indicadores, construir dashboards e apresentações e pedir assistência à IA.
- **Público:** pessoas que trabalham com dados, profissionais de operação e analistas que precisam explorar datasets sem preparar código.
- **Caráter:** preciso, tranquilo e colaborativo.
- **Mundo visual:** bancada de análise e livro-razão. Tabelas, páginas, linhas, índices e legendas inspiram o layout; não há ilustrações promocionais.
- **Elemento assinatura:** marca de duas lâminas angulares mantida, agora em cor sólida; cabeçalhos de seção usam índices discretos, como `01 / VISÃO GERAL`.
- **Foco principal:** primeiro a leitura dos indicadores e da série temporal obtidos dos registros reais carregados; depois ações do Canvas e análises guiadas.

## Sistema visual

- **Claro (padrão apenas no primeiro acesso):** fundo pedra `#F1F0EB`, papel `#FFFEFA`, bordas `#DCE1DC`, tinta `#202C31` e um único destaque azul-marinho/verde-petróleo `#345F70`.
- **Escuro:** fundo grafite `#151D23`, superfícies `#1D282F`, texto `#EDF1F0` e destaque `#91C4CE`.
- Feedback positivo, atenção e erro usam cores semânticas. Os ícones de navegação e ação foram refeitos em uma família outline consistente, preservando os caminhos de arquivos referenciados pelo app.
- Tipografia de sistema (sem dependência externa); 4px como unidade de ritmo; números tabulares; sem glassmorphism ou gradientes decorativos.

## Telas revisadas

1. **Acesso:** versão local do login, com layout de produto e formulário preservado.
2. **Visão geral:** cabeçalho compacto, ações com rótulos diretos, indicadores em uma faixa horizontal e gráfico temporal dominante; análises e composição abaixo.
3. **Navegação e salvos:** barra lateral persistente; lista de projetos compacta com rótulos claros e sem ícones decorativos variados. A lista só é redesenhada quando seu conteúdo muda.
4. **Data Studio:** filtros, tabelas e edição alinhados, com cabeçalhos fixos e estados de foco; fluxo Smart Data Import intacto.
5. **Canvas:** biblioteca, área de composição e painel de propriedades como partes de uma bancada, não como cartões flutuantes.
6. **Agenda, chat, Configurações/logs e Presentation Studio:** mesma linguagem visual, cores, campos e botões; componentes continuam editáveis e interativos.
7. **Mobile:** navegação inferior preservada, rolagem de tabelas e grades responsivas sem estourar a largura.

## Arquivos modificados

- `insightlab_mvp/product-ui-v10.css` — **novo**, tokens visuais e padronização de todos os módulos.
- `insightlab_mvp/product-ui-v10.js` — **novo**, agrupamento de preferências e acesso às análises locais, preservando as funções.
- `insightlab_mvp/index.html` — textos de interface, inclusão dos arquivos da v10 e rótulos de acessibilidade.
- `insightlab_mvp/design-system.js` — tema claro como padrão de primeira execução; preferências previamente escolhidas continuam respeitadas.
- `insightlab_mvp/ux-v7.js` — textos de apresentação e navegação.
- `insightlab_mvp/builder.js` — cores exclusivamente visuais das séries/legendas e microcopy; cálculos, widgets e persistência intactos.
- `insightlab_mvp/presentation-studio.js` — rótulos mais precisos de abertura/criação; ações preservadas.
- `insightlab_mvp/recent-projects.js` — ícones, layout e redução de atualizações DOM desnecessárias; armazenamento e botões mantidos.
- `insightlab_mvp/assets/icons-minimal/*.svg` — família única outline, incluindo a marca de duas lâminas.

**Não alterados:** `backend/app.py`, dependências, rotas HTTP, contratos da API, esquema de armazenamento ou scripts `.bat`.

## Verificação realizada

Smoke tests com Chromium headless e dependências locais interceptadas (sem rede externa):

- Login demonstrativo; visão geral com 4 KPIs horizontais; navegação sem aba Intelligence redundante.
- Smart Import com 6 colunas e um CSV de 3 registros; consulta de coluna adicional; filtro textual encontrando 2 linhas.
- Canvas de widgets; Agenda; modal de Configurações; painel de logs.
- Troca de tema claro/escuro; editor de apresentação; retorno de projeto à lista de salvos; abertura do chat.
- Mobile 390px: sem overflow horizontal, KPIs empilhados conforme breakpoint.
- Sem exceções de JavaScript ou arquivos de interface ausentes nos testes.
- Sintaxe dos scripts JS e backend Python verificada.

**Limites de validação:** estes testes exercitaram o frontend com um armazenamento de navegador isolado; não foram realizados testes visuais em todos os navegadores, execução do `start.bat` no Windows, nem chamadas reais ao Gemini/OpenAI com credenciais. Dados de demonstração já existentes foram utilizados sem gerar números fictícios para o dashboard.

## Para executar

Descompacte a pasta `insightlab_langchain` e use o `start.bat` no Windows como na v9.9. Em instalação já existente, mantenha o armazenamento do navegador se quiser preservar projetos salvos. Force atualização do cache do navegador (`Ctrl + F5`) para obter os novos SVGs e CSS.
