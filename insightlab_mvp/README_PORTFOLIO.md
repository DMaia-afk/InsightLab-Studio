# InsightLab Studio — Portfolio Edition

Um workspace analítico no-code, executável diretamente em `index.html`, com dados sintéticos e demonstração pública sem login.

## Destaques

- Dashboard builder: criar, editar, duplicar, ordenar widgets com drag & drop, configurar métricas, dimensões e tamanhos de 25%, 33%, 50% e 100%.
- Ajuste rápido: clique no canto inferior direito de um widget para percorrer as larguras (Shift+clique para voltar).
- Modelos inteligentes: Executivo, Operações e Comercial — modelos gerados a partir dos dados ativos.
- Explainable Analytics: sumário de indicadores, concentração por categoria e comparação entre os últimos meses disponíveis, com metodologia explicitada.
- CSV: ingestão local, edição, exportação; dashboards salvos via localStorage e JSON.
- Apresentação: botão **Apresentar** para exibir o canvas sem painéis; Esc para sair. Impressão: Ctrl+P.

## Como executar

Extraia os arquivos juntos e abra `index.html` em Chrome, Firefox ou Edge. O CSV de demonstração pode ser carregado em **Data Studio**. Sem build, credenciais ou serviços externos.

## Roteiro de demonstração para recrutadores (3 min)

1. Abra **Canvas no-code** e mostre os KPIs e gráficos da visão executiva.
2. Clique em **Modelos inteligentes**, digite `2` e compare a visão operacional.
3. Arraste widgets, altere métrica/agregação e mude largura pelo canto inferior direito.
4. Entre em **Data Studio**, importe um CSV válido e modifique uma linha.
5. Volte ao Canvas e mostre atualização de indicadores e observações automáticas.
6. Exporte o layout JSON e acione **Apresentar**.

## Limites e arquitetura

O analisador usa regras determinísticas JavaScript; **não existe conexão a LLM** neste MVP e as interpretações não provam causalidade. Os dados estão armazenados apenas neste navegador; não há backend Django/PostgreSQL integrado, colaboração multiusuário, autenticação ou salvamento em nuvem. CSV precisa conter data e valor nas colunas aceitas pela tela Data Studio. A edição visual usa grid responsivo, não posicionamento absoluto ou redimensionamento contínuo.

## Próximas etapas para produção

- Backend Django REST, PostgreSQL, persistência segura e versionamento de layouts por usuário.
- Mapeamento livre e tipagem de colunas do CSV; parser robusto com preview e validação de esquema.
- Drag resize contínuo, histórico de edições/undo e permissões de compartilhamento.
- API de agente LLM com ferramentas restritas para consultas e citações de origem, auditoria e controle de custos.
- Playwright E2E, validação de acessibilidade e GitHub Actions CI.
