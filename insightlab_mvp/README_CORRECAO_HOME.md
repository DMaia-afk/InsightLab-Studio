# Correção dos botões da home — v8.1

**Causa:** `ux-v7.js` era carregado antes do elemento `#uxModal` existir no DOM. O acesso a `.modal-dialog` falhava e o JavaScript encerrava antes de registrar os eventos dos três botões iniciais.

**Correção:** o modal é criado no HTML antes de carregar `ux-v7.js`, com uma verificação adicional.

- Importar CSV: abre a seção Data Studio.
- Criar com IA: abre o Canvas e rola para o painel do agente/planejador.
- Personalizar início: abre o modal de preferências e salva no navegador.

Para atualizar a versão em execução, substitua `index.html` e `ux-v7.js` do frontend. Force a atualização da página com Ctrl+F5.
