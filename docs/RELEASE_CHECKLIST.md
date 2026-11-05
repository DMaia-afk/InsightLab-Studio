# Checklist de publicação — v11.0 RC

## Confirmado neste pacote

- [x] README principal da versão atual, em português, com screenshots reais.
- [x] Instruções de instalação em Windows/Linux/macOS, limites do mock login e token administrativo.
- [x] Arquitetura, Data Binding, testes, segurança, contribuições e changelog documentados.
- [x] Testes Node, pytest e smoke tests Chromium preparados para GitHub Actions.
- [x] Script de auditoria de artefatos sensíveis; `.gitignore` e `.gitattributes` preparados.
- [x] Arquivos de referência visual não usados e de licença não confirmada removidos do pacote público.
- [x] Três CSVs fictícios incluídos em `examples/`.

## Pendências para o mantenedor antes de tornar público

- [ ] Conferir autoria, direitos sobre o código e os ícones SVG; a licença MIT deve refletir sua intenção de licenciamento.
- [ ] Criar o repositório GitHub e configurar a descrição, tópicos, screenshot e branch default.
- [ ] Configurar **private vulnerability reporting** em GitHub Security (quando disponível).
- [ ] Habilitar branch protection com CI obrigatório e revisão de PRs.
- [ ] Rodar `start.bat` em Windows limpo com Python 3.11/3.12 (não executado na validação Linux).
- [ ] Executar conexão com um provedor real em ambiente local, sob sua própria chave/cota.
- [ ] Inspecionar `git diff --cached` e `git ls-files` para garantir que não há arquivos privados versionados.
- [ ] Rodar scanner externo de segredos no histórico Git, se já existir histórico; a auditoria incluída verifica apenas arquivos presentes na árvore de publicação.

## Critério de release

Esta release pode ser publicada como **código demonstrativo de portfólio local**, não como aplicação multiusuário hospedada. Serviços compartilhados exigem autenticação, RBAC, isolamento e retenção de dados antes da implantação.

Relatório dos testes locais: [`VALIDATION_REPORT.md`](VALIDATION_REPORT.md).
