# InsightLab v9.1 — Pacote de ícones integrado

36 ícones PNG separados em `insightlab_mvp/assets/icons/`, com fundo transparente (canal alfa), identificadores sem espaços e dimensões padronizadas. Três famílias: navegação, analytics e IA.

Arquivos incluídos: `icons-ui.css` e `icons-ui.js`. A integração adiciona os ícones a menu, ações da home, importação CSV, Canvas, agenda e botões principais. As imagens são decorativas e os textos dos botões foram preservados para acessibilidade.

Para novas telas, exemplo:
`<img src="assets/icons/robot.png" alt="" aria-hidden="true" class="il-icon">`

A execução de `start.bat`, backend e integração com LangChain não foi modificada. Ao atualizar somente o frontend, copiar `assets/icons/`, `icons-ui.css`, `icons-ui.js` e `index.html`.
