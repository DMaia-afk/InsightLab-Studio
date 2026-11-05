# InsightLab Studio v9.5.2 — Data Studio Planilha

- Campo de exemplo do login alterado para `email@gmail.com` (inclusive conta demo).
- Grade editável com pesquisa, ordenação, paginação (25/50/100/250), inclusão e exclusão de registros.
- Filtros de data inclusivos (De / Até) e de status.
- Exportação dos dados filtrados em CSV.
- Importação conserva colunas adicionais do CSV (além de data, valor, unidade, categoria e status), visualizando-as e permitindo editá-las na grade.
- Período selecionado filtra indicadores da Home e componentes do Canvas.
- Alterações ficam no armazenamento local do navegador. Para cargas enormes, convém futuramente adicionar virtualização e persistência no backend.

## Limitações
- O motor analítico continua baseado nos campos normalizados `date`, `amount`, `store`, `category` e `status`; outros campos podem ser vistos/editados/exportados, mas ainda não agregados automaticamente no Canvas.
- As linhas de dados ficam no navegador e não são vinculadas a uma conta real.
- Login segue sendo mock de demonstração, sem autenticação real.
