# Dados sintéticos para experimentação

Estes CSVs são **ficcionais**, criados para exercícios e testes do InsightLab. Não representam clientes ou transações reais.

| Arquivo | Domínio | Estrutura diferente que exercita |
|---|---|---|
| `barbearia.csv` | Serviços e atendimentos | Data, profissional, serviço, receita, tempo, comissão, cancelamento |
| `pizzaria.csv` | Vendas e entrega | Canal, tamanho, filial, preparo e entrega, pedido |
| `brinquedos.csv` | Vendas e estoque | Linhas por item de pedido, SKU, faixa etária, preço e custo |

## Passo a passo da barbearia

1. Importe `barbearia.csv` no Data Studio e use o modo híbrido.
2. Confira os papéis de `data_atendimento`, `barbeiro`, `servico`, `valor_cobrado` e `duracao_minutos` (use os campos presentes no arquivo).
3. Faça a pergunta: **“Qual profissional gerou mais receita? Agrupe o valor cobrado por barbeiro.”**
4. Depois: **“Crie um dashboard de gestão da barbearia com receita, atendimentos, duração média e serviços mais frequentes.”**
5. Confirme a proposta e abra **Dashboard Story** para gerar o roteiro automaticamente.

Os exemplos ajudam a verificar se a IA e o motor do Canvas utilizam as colunas reais, sem pressupor que toda planilha é uma tabela financeira de vendas genérica.

Para resultados calculados dos testes, execute `node tests/stage2_business_fixtures.test.cjs`.
