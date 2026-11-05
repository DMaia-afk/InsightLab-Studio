# v11.2.1 — Single-interface startup fix

## Observed behavior

The legacy inline CSS rendered before later stylesheet links in the document body were loaded. The product-specific theme, language and sidebar layout were applied after the first paint, causing the old appearance to flash before the current UI. This is a **flash of unstyled/late-styled content** (FOUC), not a second dashboard application.

## Fix

- All 14 CSS links are now inside `<head>`, preserving their existing cascade order.
- A minimal first-paint guard keeps the dashboard/login hidden until the login state, theme and UI localization are initialized. It shows a neutral InsightLab splash during boot, with a recovery timeout if the optional localization code fails.
- Theme and locale preferences are read before the first visible paint.
- The Dashboard Story editor now uses a named section rather than a second semantic `<main>` landmark.
- JavaScript business logic and API contracts are unchanged.

## Files modified

- `insightlab_mvp/index.html`
- `insightlab_mvp/i18n.js`
- `insightlab_mvp/presentation-studio.js`
- `tests/test_startup_layout.py` (new)

## Validation and limitations

Static checks verify stylesheet placement, semantic landmarks, and boot readiness. A Chromium smoke test with embedded local assets verified login, language changes, one workspace landmark and no JS errors. The browser environment blocked ordinary local HTTP navigation; **Windows and real-network loading need to be checked on the user's installation**.

To rule out cached files after updating, extract to a new directory and hard-refresh the browser (`Ctrl+F5`).
