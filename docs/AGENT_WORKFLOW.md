# Agent workflow — from a CSV question to an editable dashboard

[English README](../README.md) · [Leia em português](../README.pt-BR.md)

## Product intention

InsightLab was created to help people who already maintain spreadsheets **understand their businesses through questions, visualizations, and decisions**. The assistant is the conversational entry point for data exploration, not a replacement for the Data Studio or for human judgment.

## Main components

| Component | Responsibility |
|---|---|
| Smart Data Import | Detects CSV columns and allows users to verify their meaning before import. |
| Data Studio | Stores the active data in the browser; exposes its columns and filters. |
| `assistant-data-engine.js` | Discovers schema, validates structured operations, executes calculations over real rows, and produces bounded findings. |
| `intelligence-chat.js` | Maintains the conversation UI, routes requests, and asks for approval before actions. |
| `assistant_tools.py` | Backend plan/explain API contracts for configured language models. |
| `builder.js` | Creates editable widgets in the selected Canvas project. |
| Dashboard Story | Builds a slide sequence using widget references rather than detached snapshots. |

## Two complementary execution modes

**Local mode (no model needed):** limited rules and deterministic operations answer simple questions such as record counts, numeric sums, and some text frequency searches. A dashboard proposal can also be generated with local heuristics.

**AI-connected mode:** the backend uses a configured model through LangChain to produce a structured plan of allowed analytical operations. The browser validates field names and operations, calculates results against the current dataset, and can pass bounded aggregates back for natural-language interpretation.

The model does not execute arbitrary SQL, Python, or JavaScript. It also does not receive an unrestricted dump of the entire CSV as the default interaction pattern.

## Example — a barbershop

1. Import `examples/barbearia.csv` through Data Studio, choosing Hybrid mapping.
2. Review the mappings of `data_atendimento`, `valor_cobrado`, `barbeiro`, and `servico`.
3. Ask: **“How much revenue did the barbershop generate, and how does it vary by barber?”**
4. The query engine calculates the results directly from the imported rows. For this example, the total `valor_cobrado` is **R$ 83,379.46** across **1,755** rows; **1,636** appointments have status `COMPLETED`. These are synthetic fixture values, not business benchmarks.
5. Ask: **“Create a dashboard with the main indicators.”** The assistant proposes widgets and waits for the user to confirm. The previous dashboard is not silently replaced.
6. Open the active dashboard's story mode to generate a data-linked narrative from the widgets.

### Why human review matters

The meaning of a column is domain-dependent. `valor_cobrado` may represent gross billing; it must not automatically be labeled net profit. An appointment record may be cancelled; a money transfer in personal finance is not automatically an expense. The user must verify business definitions, filters, and any explanatory claims.

## Data privacy and scope

- The mock **User** login is not user isolation; only use non-sensitive demo data in an environment that is not production hardened.
- When a provider is configured, some metadata and aggregated query findings can be sent externally. Small groups or aggregations can still be identifying.
- The browser maintains local project state; a user should export projects for backup and avoid shared computers for sensitive records.
- Administrative endpoints require a local token but do not implement organization-scoped permissions or multi-tenant RBAC.
- Automatic external email delivery or unsupervised actions are not part of this release.

## Correctness and efficiency

- Local deterministic calculations prevent the model from inventing arithmetic results.
- Plans are constrained to supported operations (`count`, `sum`, `avg`, `min`, `max`, `frequency`, `distinct`) and known dataset columns.
- Only bounded findings are used for explanations; this limits context size but also requires clear caveats for missing information.
- A changed dataset invalidates an unapproved dashboard proposal, and version-aware aggregation caching prevents redundant calculations in the Canvas/Story views.
- This architecture is a **portfolio MVP**; enterprise usage would require real authentication, permissions, auditability, privacy controls, and deeper semantic modeling.

Further reading: [Architecture](ARCHITECTURE.md), [Data Binding](DATA_BINDING.md), [Testing](TESTING.md), and the [Security Policy](../SECURITY.md).
