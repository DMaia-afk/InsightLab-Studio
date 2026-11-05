# Testes, qualidade e benchmarking

## Pré-requisitos

- Node.js 20+ para testes JavaScript (sem `npm install` e sem bibliotecas de teste externas).
- Python 3.11+ com `fastapi`, `pydantic`, `httpx` e `pytest` para testes HTTP locais.
- Opcional: `playwright` e navegador Chromium para testes de interface. As ferramentas de IA são simuladas; as suítes não solicitam tokens reais.

Para instalar apenas dependências de teste no Python que você já utiliza:

```bash
python -m pip install "fastapi>=0.115,<1" "pydantic>=2.8,<3" httpx pytest playwright
python -m playwright install chromium
```

> Para a aplicação completa, use `backend/requirements.txt`; este conjunto mais curto permite executar os testes sem instalar todas as bibliotecas de fornecedores de IA. O backend importa integrações opcionais somente quando são chamadas.

## Testes rápidos

Na raiz do repositório:

```bash
node tests/stage1_integrity.test.cjs
node tests/stage2_query_engine.test.cjs
node tests/stage2_business_fixtures.test.cjs
python -m pytest -q tests/test_backend_security.py
python scripts/audit_release.py
```

**Cobertura funcional:** identidade/versionamento do CSV, importação/exportação de JSON, integridade dos links dos widgets, cache compartilhado e invalidação, consultas com colunas personalizadas e proteção da API.

## Testes no navegador

```bash
python tests/ui_smoke_stage1.py
python tests/ui_smoke_stage2.py
```

Os smoke tests utilizam um Chromium local e injetam os assets estáticos em memória. **Não abrem conexões a modelos reais.** Verificam login demonstrativo, Smart Import, vínculos, criação automática de Story, projetos recentes e console JavaScript.

## Benchmark

```bash
node tests/benchmark_stage2.cjs
```

O benchmark compara consulta repetitiva sem cache com o motor compartilhado. É **microbenchmark reproduzível**, não comparação universal. Meça em seu hardware antes de divulgar ganhos de performance. Resultados variam com o número de widgets e a frequência de reutilização.

## Critérios mínimos para PRs

- Todos os testes Node e Python aprovados.
- Testes de navegador sem erros JavaScript.
- O CSV da barbearia mantém métricas personalizadas em importação/exportação.
- Nenhum dado real ou credencial incluído.
- `python scripts/audit_release.py` passa.
- Documentação atualizada ao alterar o fluxo de dados ou API.

## CI

`.github/workflows/ci.yml` usa Node 22 e Python 3.11. Executa auditoria de pacote, checagem sintática, testes Node, pytest e smoke tests Chromium. Não necessita GitHub Secrets para os testes atuais. Versões futuras com testes integrados a provedores exigirão opt-in, sem credenciais em forks.
