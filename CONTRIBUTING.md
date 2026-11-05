# Contribuindo com o InsightLab Studio

Obrigado pelo interesse. O projeto é um MVP local de portfólio; antes de propor novas funcionalidades, priorize regressões, clareza de código, acessibilidade, segurança e fidelidade dos cálculos.

1. Abra uma Issue com cenário, resultado esperado e passos para reproduzir (sem dados privados ou chaves de API).
2. Faça uma alteração pequena e específica. Preserve os contratos FastAPI e o vínculo `datasetId`/`datasetRevision` dos slides.
3. Adicione um teste para a regressão ou nova regra, de preferência usando `examples/`.
4. Rode os testes explicados em [`docs/TESTING.md`](docs/TESTING.md) e o auditor `python scripts/audit_release.py`.
5. Abra um Pull Request com resumo das modificações e das limitações conhecidas.

## Convenções

- Evite adicionar bibliotecas grandes sem justificativa e comparação de custo.
- Nunca faça upload de CSVs reais de pessoas/clientes.
- Trate resultados de IA como propostas, não como fonte de verdade para indicadores.
- Prefira funções testáveis, com pouco acoplamento ao DOM, antes de ampliar telas.
- O login demonstrativo é parte do escopo de portfólio, não deve ser divulgado como mecanismo de segurança.
