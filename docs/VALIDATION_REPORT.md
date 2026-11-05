# Relatório de validação — InsightLab Studio v11.0.0-rc.1

**Data:** 2026-11-04  
**Base:** v10.5 — Etapa 2 (Performance e Refatoração)  
**Escopo desta entrega:** documentação, GitHub CI, higiene do repositório, testes executáveis e preparação de release. **Não foram alteradas regras de negócio nem contratos da API.**

## Testes executados nesta preparação

| Verificação | Resultado |
|---|---|
| `python scripts/audit_release.py` | Aprovado: 97 arquivos de texto inspecionados, sem padrões óbvios de credenciais |
| Sintaxe JS (`node --check` em todos os arquivos frontend) | Aprovado |
| `python -m compileall -q backend tests scripts` | Aprovado |
| `node tests/stage1_integrity.test.cjs` | Aprovado |
| `node tests/stage2_query_engine.test.cjs` | Aprovado |
| `node tests/stage2_business_fixtures.test.cjs` | Aprovado: barbearia, pizzaria, brinquedos |
| `python -m pytest -q tests/test_backend_security.py` | Aprovado: 3 testes |
| `python tests/ui_smoke_stage1.py` | Aprovado: dados, filtros, vinculação, importação, reset e console JS |
| `python tests/ui_smoke_stage2.py` | Aprovado: cache, Canvas, projetos, slides e console JS |
| Inspeção Git de arquivos rastreados | Aprovado: `.env.example` incluído; `backend/.insightlab_admin_token` e `.venv` ignorados |
| Checagem de referências HTML e links da documentação | Aprovado |

## Limitações da validação

- Ambiente: Linux com Chromium local. **Não foi realizada instalação limpa em Windows** usando `start.bat` nesta etapa.
- **Não foram executadas chamadas reais** a provedores externos (Gemini, OpenAI, Anthropic ou Groq), nem um teste de custos/quotas.
- O script de auditoria de segredos procura padrões óbvios na árvore atual, **não verifica histórico Git, imagens ocultando dados ou credenciais ofuscadas**.
- O workflow GitHub Actions foi escrito para repetir os testes, mas sua execução no serviço GitHub **não pode ser confirmada** antes do primeiro push.
- Sem pentest ou teste de carga corporativo. Os testes são adequados ao escopo de um MVP demonstrativo local.

## Recomendação de publicação

É adequado publicar o código como **Release Candidate de portfólio**, com o aviso de que o login é simulado e os endpoints administrativos não devem ser expostos publicamente. A liberação de um SaaS comercial exige um ciclo separado de autenticação, RBAC, persistência e segurança.
