# InsightLab Studio v7 — Adaptive Workspace

## Novidades
- Home reduzida a uma saudação personalizada, quatro caminhos de entrada e ações diretas.
- Modal interno (fundo escurecido/desfocado) para criar e excluir compromissos da Agenda.
- Modal para nome, frase de boas-vindas e tela de abertura preferida. Salvo localmente sob `insightlab_home_preferences_v7`.
- Mapa de calor removido da navegação e da página dedicada. Componentes de heatmap no Canvas legado continuam disponíveis para não apagar dashboards existentes; retire-os individualmente se desejar.
- Integração Gemini/LangChain, Canvas e dados mantidos da versão anterior.
- Arquivo `ux-v7.js` encapsula preferências e diálogos da interface.

## Testes
Executar `start.bat` na pasta `insightlab_langchain`, acessar http://127.0.0.1:5500 e verificar:
1. Personalizar início → Nome e tela padrão → Salvar e recarregar.
2. Agenda → Novo evento → Salvar e clicar no evento para excluir.
3. Data Studio → importar CSV → Canvas no-code → usar o gerador com IA.
4. Abrir em DevTools mobile (375px, 390px, 768px).

Nota: a interface usa armazenamento local do navegador; a experiência de cada usuário fica no mesmo browser/device, não sincronizada no servidor.

## IA — possibilidades para próximas versões
1. Ingestão assistida: inferir tipos, mapear aliases de colunas, validar datas, moedas e faltantes (com revisão antes de aplicar).
2. Agente de dashboard: receber esquema e perfil agregado, devolver layout JSON validado; controles para revisar/desfazer alterações.
3. Conversa contextual: editar widget, trocar métricas, ajustar filtros e comparar períodos por comandos.
4. Analista explicável: identificar anomalias, sazonalidade e hipóteses, mostrando cálculos e limitações.
5. Recomendações para Agenda: sugerir ações a partir de tendências, exigindo confirmação para criar eventos.
6. Templates adaptativos: perguntar objetivo e nível de conhecimento, personalizando a primeira visão.

**Princípio**: nunca executar código livre enviado por modelo; ações devem ser tipadas, validadas e confirmadas. Manter a chave no backend. Evitar enviar CSV completo para a IA; usar perfis agregados e ferramentas que consultem dados sob controle.
