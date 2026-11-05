# Contratos de dados e Dashboard Story

## Objetivo

Um roteiro apresenta widgets do **dashboard atual** sem manter cópias independentes de gráficos. Cada referência preserva o ID do widget e, quando configurado, um recorte de filtros capturado no momento do `Pin to Slide`.

## Estrutura de referência

```json
{
  "schemaVersion": 2,
  "dashboards": [
    {
      "id": "dash-exemplo",
      "name": "Barbearia: operação",
      "datasetId": "csv-exemplo",
      "datasetBinding": "confirmed",
      "widgets": [
        {
          "id": "widget-duracao",
          "type": "bar",
          "title": "Duração média por profissional",
          "field": "duracao_minutos",
          "metric": "avg",
          "dimension": "barbeiro",
          "width": 6
        }
      ],
      "slides": [
        {
          "id": "slide-01",
          "title": "Tempo por profissional",
          "widgetRefs": [
            {
              "widgetId": "widget-duracao",
              "datasetId": "csv-exemplo",
              "datasetRevision": 7,
              "binding": "snapshot",
              "filters": {
                "from": "2026-01-01",
                "to": "2026-10-31",
                "status": "COMPLETED",
                "search": "",
                "store": ""
              },
              "widgetState": {
                "field": "duracao_minutos",
                "metric": "avg",
                "dimension": "barbeiro"
              }
            }
          ],
          "overlays": [],
          "narrative": {"text": "", "source": "local"}
        }
      ]
    }
  ]
}
```

*Exemplo conceitual e sintaticamente válido; os identificadores são ilustrativos.*

## Semântica dos vínculos

- **Dinâmico:** o slide utiliza os filtros atualmente selecionados no dashboard.
- **Fixado (`snapshot` nos arquivos atuais):** os filtros e a configuração do widget são capturados; os **dados não são congelados**. Novos registros na mesma base, que atendam ao filtro, podem alterar o gráfico.
- **Congelamento verdadeiro:** histórico de versões do dataset ou armazenamento imutável de agregações **ainda não está implementado**.

O nome técnico `snapshot` no payload se refere ao **estado de filtros/widget**, não à criação de uma fotografia dos dados.

## Importação, exportação e mudanças de schema

Na importação de JSON de projeto:

1. O arquivo é validado antes de modificar projetos existentes.
2. IDs duplicados e referências inexistentes são rejeitados.
3. A importação remapeia IDs dos widgets e atualiza referências de slides.
4. Métrica e dimensão são mantidas, incluindo nomes de colunas personalizados.
5. A vinculação ao dataset é marcada como **pendente de revisão**, evitando interpretar registros de outro CSV como se fossem os originais.

Quando a fonte não contém a coluna esperada, o sistema deve exibir aviso e impedir o cálculo enganoso. Não deve substituir `duracao_minutos` por `amount` ou `barbeiro` por `category` silenciosamente.

## Cache e desempenho

O motor `query-engine-v105.js` usa filtros normalizados, identidade/revisão do dataset e campo/métrica/dimensão na chave de cache. Canvas e Dashboard Story reutilizam agregações equivalentes; uma edição invalida resultados incompatíveis com a nova revisão.

O modo apresentador renderiza somente o slide ativo, com cache limitado. Resultados muito grandes ainda precisam de solução específica para execução fora da thread principal; o projeto não possui streaming ou banco de dados compartilhado em produção.

## Teste de aceitação sugerido

1. Importe `examples/barbearia.csv` e mapeie a duração por barbeiro.
2. Crie o dashboard e gere o roteiro.
3. Fixe filtros e altere a busca global.
4. Edite um atendimento dentro do recorte; o valor do slide deve recalcular.
5. Exporte/importa o projeto JSON; `field` e `dimension` devem continuar intactos.
6. Importe a pizzaria e confirme que o dashboard da barbearia **não** passe a mostrar os dados da pizzaria sem vinculação compatível.
