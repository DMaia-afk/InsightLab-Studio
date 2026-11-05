# v9.8 — Smart Data Import & AI Observability

## Importação
Importe CSV e escolha Automático, Assistido ou Híbrido; revise tipos, papéis e inclusão de colunas. Todas as colunas são preservadas no dataset local, mesmo as não marcadas como analíticas. O catálogo semântico é salvo no localStorage.

**Limite atual:** os dashboards legados ainda usam date/amount/store/category/status; quando o CSV não traz data ou valor, o dado original continua disponível, mas os gráficos financeiros não possuem significado até o usuário mapear essas colunas. Não trate o motor como universal pleno ainda.

## Logs
Em Configurações, abaixo do modelo, use Atualizar, Exportar JSON e Limpar. A API protege GET/DELETE /api/ai/logs pelo token administrativo. Os logs são só de metadados operacionais, mantidos em memória e não incluem CSV, perguntas ou chaves. Consumo de tokens depende da disponibilidade de usage_metadata do modelo.

## Segurança
Frontend demonstrativo, não adequado à hospedagem pública sem autenticação.
