## [11.2.1] — Startup rendering fix

- Load all product styles before initial rendering to prevent the old UI flashing over the current one.
- Apply stored locale and theme before showing the workspace.
- Keep one semantic main landmark; Dashboard Story uses its own named region.
- Add startup layout regression tests.

## v11.2 — Language selector visibility & English README screenshots (2026-11-05)

- Added a persistent **Idioma / Language** PT-BR / English toggle to the desktop sidebar, with accessible selected states.
- Improved the mobile toolbar selector width and labeling; kept language selection on the login screen and in Preferences.
- Updated both selector variants to share the persisted locale, without reloading CSV data.
- Replaced only the English README screenshots with real English-language captures under `docs/images/en/`; kept the Portuguese README images untouched.
- Improved the focus behavior of the Smart Data Import dialog.
- Added frontend regression coverage for the visible language controls and verified 6 backend tests, dashboard/query integration tests and browser flows.

# Histórico de versões

O histórico detalhado das versões anteriores está em [`docs/history/`](docs/history/).

## [11.0.0-rc.2] — Chat contrast and visual README (2026-11-04)
- Changed user messages to dark text (`#111111`) on a neutral light gray bubble, including formatted Markdown content in both light and dark themes.
- Re-captured real interface screenshots using the synthetic barbershop CSV: dashboard, Smart Data Import, chat, dashboard proposal, and Dashboard Story.
- Updated the English and Brazilian Portuguese READMEs with a clearer visual walkthrough. No backend, API, or analytical business logic changes.

## [11.0.0-rc.1] — Documentation update
- README (English and Portuguese) expanded with the product origin, entrepreneur-focused value proposition, the CSV → chat → Canvas → Dashboard Story journey, and practical barbershop prompts.
- Added real screenshots of the data chat and its dashboard proposal, plus `docs/AGENT_WORKFLOW.md`.
- No changes to application code, backend endpoints, or dataset logic.

## [11.0.0-rc.1] — 2026-11-04

### Repositório e entrega
- Documentação principal reescrita para o produto atual, com instalação Windows/Linux/macOS.
- Screenshots reais do dashboard e Dashboard Story.
- Estrutura de documentação: arquitetura, data binding, testes e limites de segurança.
- CI com verificações estáticas, testes Node, pytest e smoke tests Chromium.
- Checagem automática para arquivos sensíveis e credenciais em fontes publicáveis.
- Licença MIT para o código e exclusão dos boards de referência visual não usados na execução.

### Compatibilidade
- Sem mudanças nas regras de negócio, contratos FastAPI ou modelo de persistência em relação à v10.5.

## [10.5] — 2026-11-04
- Motor analítico com cache compartilhado Canvas/Story, invalidação por revisão de dados, renderização seletiva e eventos para projetos recentes.

## [10.4] — 2026-11-04
- Identidade/revisão de datasets, validação de importações JSON, filtros fixados e segurança administrativa básica.

## [10.3] — 2026-11-03
- Agente integrado à análise do CSV e geração de dashboards a partir do chat.

## [10.2] — 2026-11-03
- Criação automática de roteiros Dashboard Story a partir do dashboard ativo.

## [10.1] — 2026-11-03
- Slides vinculados a widgets do Canvas e suporte a anotações narrativas.

## [10.0] — 2026-11-03
- Redesign human-centered da interface.
