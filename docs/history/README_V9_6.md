InsightLab Studio v9.6 — melhorias por etapas

ETAPA 1: Chat — renderização segura de Markdown básico (**negrito**, *itálico*, listas, código). Texto escapado antes de aplicar marcação.
ETAPA 2: Reset demo — esvazia o conjunto de dados ativo e mantém o CSV removido na próxima abertura. Não apaga apresentações e dashboards salvos.
ETAPA 3: Claro — superfícies brancas, fundo cinza-azulado, azul-marinho nos controles e destaques discretos em laranja.
ETAPA 4: Presentation Studio — editor com slides próprios, elementos movíveis e redimensionáveis, texto livre, salvar/reabrir, visualização e impressão. Biblioteca Projetos Salvos usa localStorage.

NOTAS: O editor é MVP: os elementos dos gráficos são snapshots do dashboard atual no momento em que são inseridos; não há sincronização dinâmica depois da inserção. O recurso PDF usa impressão do navegador e é destinado a slides individualmente ou à visualização atual. Dados e projetos salvos em localStorage não são armazenados em servidor; limpar dados do navegador pode removê-los. O login segue demonstrativo. Testado por verificação estática de sintaxe, não há teste real em navegador Windows neste ambiente.
