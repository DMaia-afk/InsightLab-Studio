# InsightLab Studio v9 — HUD renovada

Base: InsightLab v8.1, preservados FastAPI/LangChain, Canvas, agente de workspace, importação CSV e start.bat.

## Interface
- Sidebar fixa no desktop e navegação inferior no mobile.
- Dashboard inicial usa os indicadores reais calculados pelo mecanismo do InsightLab (nenhum KPI financeiro fixo).
- Assistente à direita prepara um comando para o agente no Canvas; a confirmação da proposta continua no agente de workspace.
- Os três botões do topo continuam funcionais: Importar CSV, Criar com IA e Personalizar início.
- O modal de agenda e a personalização permanecem no estilo da v8.1.
- Sem mapa de calor na navegação ou na HUD principal. Componentes anteriores do Canvas não são apagados.
- A pesquisa no topo é um atalho por palavra-chave para as seções (não uma busca global de conteúdo).

## Executar
Na pasta `insightlab_langchain`, rode `start.bat`. Em caso de dependências ausentes, siga a instalação guiada. Frontend http://127.0.0.1:5500 e backend http://127.0.0.1:8000.

## Limites
O layout segue a imagem de referência mas não é uma cópia pixel-perfect. Agendamento automático de relatórios, planos pagos, busca universal e notificações não foram implementados nesta versão; por isso não aparecem como controles fictícios. A IA depende de conexão válida e o agente mantém o fluxo de revisão e aplicação da versão anterior.
