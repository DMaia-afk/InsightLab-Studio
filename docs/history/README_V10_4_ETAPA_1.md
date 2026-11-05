# InsightLab Studio v10.4 — Etapa 1: Integridade e segurança mínima

Esta versão parte da **v10.3**. O objetivo é impedir leituras incorretas quando se troca o CSV, preservar campos personalizados e validar dashboards/roteiros antes de carregá-los. **Não é uma versão SaaS nem implementa autenticação por usuário.**

## Mudanças entregues

1. **Identidade por CSV e revisão dos registros.** A nova unidade `integrity-v104.js` mantém `datasetId`, `revision`, fonte e nome do arquivo no `localStorage` sob a chave `insightlab_dataset_identity_v104`. Uma importação ou reset cria uma **nova identidade**; editar registros aumenta a revisão. Revisões são indicadores de invalidação, **não** backups históricos do CSV.
2. **Segurança dos vínculos.** Os dashboards novos incluem `datasetId`. Projetos antigos sem origem verificada ou importados de outro navegador exigem confirmação explícita em **Vincular base atual**. Se os campos e dimensões requeridos não existirem, o sistema recusa a vinculação. Enquanto houver incompatibilidade, os gráficos não mostram métricas numéricas da base errada.
3. **Exportação e importação JSON v2.** `schemaVersion: 2` preserva os nomes reais das métricas, dimensões, configurações de widgets, IDs remapeados de slides e filtros. Arquivos `version: 1` também são aceitos quando válidos. Entradas inválidas são rejeitadas **antes** de adicionar dashboards ao armazenamento. Limites: JSON até 5 MB, 100 dashboards por importação, 80 widgets por dashboard, 100 slides e até 3 widgets por slide.
4. **Filtros explícitos nos slides.** O recorte fixado captura data inicial, data final, unidade, status, busca textual e janela relativa. O modo dinâmico continua refletindo os filtros globais. *Recorte fixado* não é uma foto dos dados: ao editar o CSV na mesma fonte, os valores são recalculados dentro daqueles filtros.
5. **Higiene de segurança.** Rejeição de cabeçalhos CSV duplicados, IDs repetidos, datas inválidas, referências inexistentes no JSON importado e dimensões/metricas inválidas. Coordenadas dos overlays são limitadas à área dos slides. CORS e token administrativo do FastAPI mantidos. `start.bat` não imprime mais o token na saída; `.gitignore` exclui o arquivo local de credenciais.
6. **Falhas recuperáveis.** Caso o estado legado de dashboards esteja corrompido, o sistema preserva uma cópia sob `insightlab_dashboards_v2_backup_104` e mostra aviso. Excluir um widget antigo não faz um slide usar outro widget automaticamente: a apresentação mostra um estado de recuperação.

## Como atualizar

1. Faça **backup** dos seus dashboards exportando JSON na versão anterior. Os dados de demonstração e projetos salvos ficam no armazenamento **do navegador**, não são transferidos automaticamente ao trocar de navegador/perfil.
2. Extraia o pacote em uma pasta nova e execute o `start.bat` em Windows.
3. Importe a base CSV desejada no Data Studio. Selecione o dashboard e, caso apareça o aviso de fonte não confirmada, clique em **Vincular base atual** e confirme somente se os campos estiverem corretos.
4. Para transferir um projeto, exporte `insightlab_dashboards_v2.json`, depois importe no outro navegador. O JSON não inclui as linhas do CSV: reimporte a base original e confirme o vínculo.
5. Para testar, utilize as bases sintéticas em `examples/` e execute os testes abaixo.

## Testes

- `node tests/stage1_integrity.test.cjs`
- `python -m pytest -q tests/test_backend_security.py`
- `python tests/ui_smoke_stage1.py` — teste Chromium opcional, exige `playwright` e Chromium instalados. Em ambientes com rede local bloqueada, carrega os arquivos JS/CSS em memória e usa armazenamento de teste isolado.
- Sintaxe: `node --check insightlab_mvp/builder.js`, etc.; Python: `python -m compileall -q backend`.

**Casos de aceite:** arquivo de barbearia com `duracao_minutos` e `barbeiro`; filtros de status e busca preservados após fixar slide; novo CSV incompatível bloqueando o dashboard antigo; JSON malformado rejeitado sem perda de projetos; reset criando nova base vazia.

## Limitações deliberadas

- O login é um **mock local**; a API é **single-admin** e requer `INSIGHTLAB_ADMIN_TOKEN`. Não hospede publicamente o backend nem exponha sua porta sem implementar autenticação individual e RBAC.
- O backend guarda a chave do provedor em memória. Os dados CSV são salvos em armazenamento local do navegador: não utilize dados sensíveis sem política operacional adequada.
- A sincronização entre usuários/dispositivos não foi implementada. `datasetId` é um identificador **local**, não uma garantia criptográfica do conteúdo. Projetos importados requerem reconexão explícita.
- Esta etapa não refatora o motor de consultas nem o cache; ficam para a **Etapa 2 (v10.5)**. Não houve teste de carga nem chamada ao provedor real.
- A revisão de credenciais cobre o **pacote entregue**, não o histórico de um futuro repositório Git. Verifique também o histórico antes de publicar.

## Arquivos modificados

- **Novos:** `insightlab_mvp/integrity-v104.js`, `integrity-v104.css`, `tests/stage1_integrity.test.cjs`, `tests/test_backend_security.py`, `tests/ui_smoke_stage1.py`, `.gitignore`, `examples/*.csv` e este README.
- **Atualizados:** `insightlab_mvp/index.html`, `builder.js`, `presentation-studio.js`, `datastudio-grid.js`, `smart-import.js` e `start.bat`.
- **Backend:** nenhuma alteração nas rotas, contratos, dependências ou banco de dados.
