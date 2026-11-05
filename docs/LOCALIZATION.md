# Localization architecture / Arquitetura de localização

**InsightLab Studio v11.2 — English / Português do Brasil**

## User-facing behavior / Comportamento

- The language selector is available in the login dialog, toolbar and Preferences panel.
- O idioma é salvo em `localStorage` sob a chave `insightlab_locale_v111`; o padrão é `pt-BR` para preservar a experiência anterior.
- `html[lang]` changes between `pt-BR` and `en`; the document title and interactive UI are updated without reloading the dataset.
- Saved CSV values, column identifiers, project names and previously sent chat messages are **not translated**. This prevents changing the meaning of user data or rewriting historical content.
- Currency remains the currency represented by the dataset (BRL in the legacy demo). Number/date display follows the selected locale.

## Frontend

- `insightlab_mvp/i18n.js`: dependency-free translator with a Portuguese-source compatibility dictionary, dynamic DOM observation, persistence, formatting helpers and `insightlab:locale-changed` event.
- `insightlab_mvp/i18n.en.json`: editable source of Portuguese-to-English UI strings and bounded message patterns (the runtime dictionary is embedded in `i18n.js` for offline operation).
- `insightlab_mvp/i18n.css`: selector UI and modal stacking fix.
- `assistant-data-engine.js` and `intelligence-chat.js`: English local-query interpretation and messages; English requests work without paid AI.
- `presentation-studio.js`: English local executive narratives, slide highlights and number formatting.
- `index.html`, `smart-import.js`, `ux-v7.js`, `hud-v9.js`: localized generated messages and dates.

### Maintaining translations

The project still contains legacy Portuguese strings in its JavaScript templates. To add a new fixed UI label, add a Portuguese → English pair to `i18n.en.json` **and the embedded `en` dictionary in `i18n.js`**. For dynamic strings with user values, use `window.InsightLabI18n.getLocale()` or `window.InsightLabI18n.t()` rather than broad text replacement.

Do not translate arbitrary CSV cell values, stored project titles, user prompts, or model answers by using `innerHTML` or global string replacement. The translator only changes application-owned text nodes and safe accessibility attributes; never use model output as HTML without sanitization.

The current implementation is a compatibility layer for the existing plain-JavaScript frontend. A future refactor can migrate static components to stable message IDs without changing user-facing behavior.

## AI backend

Optional `locale: "pt-BR" | "en"` fields were added to the existing chat, workspace, dashboard generation, planning and explanation requests. **Existing API consumers do not need to change**, because omitted language defaults to `pt-BR`.

The model instructions ask for the selected language while preserving exact field names, numbers, privacy rules and structured query validation. Responses already stored in the chat remain in the language in which they were produced.

## Test / Validação

Run from the repository root:

```bash
python tests/test_i18n_ui.py
python -m pytest -q tests/test_backend_security.py tests/test_i18n_backend.py
```

Tests use an in-memory browser harness and synthetic barbershop fixture; no provider credentials are required. The actual operating-system launch scripts and live Gemini/OpenAI integration still require validation on the target computer.

## Version 11.2 / Versão 11.2

- Desktop: persistent **Language / Idioma** switcher (PT-BR / English) in the sidebar, plus the existing toolbar selector.
- Mobile: visible language selector in the top toolbar; the sidebar selector is hidden to conserve space.
- Login: language selection remains available before accessing the demo workspace.
- The English README uses English-language application screenshots from `docs/images/en/`. The Portuguese README retains its original screenshots in `docs/images/`.
- Smart Data Import focuses its heading rather than the bottom action button when opening, preventing unintended initial scrolling.
