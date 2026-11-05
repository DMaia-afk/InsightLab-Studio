# InsightLab Studio v9.5.1 — ajuste de ícones + mock de login

## Correções visuais
- removida a duplicação de ícones em botões, atalhos e áreas da HUD
- `icons-ui.js` ajustado para respeitar ícones já presentes no HTML
- novo conjunto continua compatível com os nomes de arquivos já usados no projeto

## Novo recurso
- mock de login em tela inicial
- login local no front-end (sem backend)
- dados do usuário salvos em `localStorage`
- personalização da HUD com nome do usuário logado
- botão de sair incluído no topo

## Como funciona o mock de login
- você pode entrar com seu nome, e-mail e qualquer senha
- também existe um botão de conta demo
- ao entrar, o nome passa a aparecer no workspace

## Observação
- este login é apenas para demonstração visual / UX do portfólio
- não substitui autenticação real de produção
