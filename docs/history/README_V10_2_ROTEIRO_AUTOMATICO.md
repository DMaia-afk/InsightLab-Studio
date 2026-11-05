# InsightLab Studio v10.2 — Dashboard Story automático

## Objetivo

A apresentação agora deriva **automaticamente do dashboard selecionado no Canvas**, inclusive daqueles criados pelo Assistente de IA. Não existe um projeto separado de slides; cada slide guarda referências aos IDs dos widgets originais e seus filtros.

## Fluxo de uso

1. Abra o Canvas e selecione um dashboard no seletor superior.
2. Clique em **Apresentar dashboard atual**. Se o dashboard ainda não tiver roteiro, os slides são gerados automaticamente a partir dos widgets selecionados.
3. Na barra de composição, use **Gerar slides do dashboard atual** para refazer a sequência após adicionar, remover ou reorganizar widgets. Se já existirem slides, é pedida confirmação, porque anotações e narrativas personalizadas seriam substituídas.
4. Reordene slides, edite títulos, anotações e os recortes; depois clique em **Presenter Mode**.
5. Se um dashboard novo for criado pela IA, o roteiro já é preparado em segundo plano no momento da aplicação. Basta abrir a apresentação desse dashboard.

## Regras de composição

- Indicadores (KPIs) consecutivos são agrupados em slides de até 3 widgets.
- Gráficos de largura reduzida consecutivos podem compartilhar um slide (até 2).
- Demais componentes recebem seu próprio slide, respeitando a ordem original.
- Nenhum widget é perdido ou duplicado na geração inicial.
- Texto narrativo local é calculado dinamicamente no momento da renderização. Anotações manuais são salvas.
- Dados e filtros atuais continuam alimentando os widgets, sem salvar cópias estáticas de HTML.
- Um roteiro já editado é preservado ao reabrir. Regenerar exige confirmação.
- O armazenamento é local ao navegador. Alterações de outros usuários/dispositivos exigiriam sincronização por backend.

## Arquivos modificados

- `insightlab_mvp/presentation-studio.js`: gerador de sequência automático, seleção correta do dashboard, agrupamento e novo comando de regeneração.
- `insightlab_mvp/builder.js`: nome do botão atualizado, preparação automática de slides para dashboards gerados pela IA.

Nenhuma mudança na API, persistência do backend ou engine de dados.

## Verificação

- `node --check` nos dois scripts alterados.
- Testes de interação no Chromium: 10 cenários aprovados — geração completa, correspondência IDs, preservação do roteiro manual, atualização de dados, fluxo da IA, troca de dashboard, regeneração confirmada, Presenter Mode e mobile.
- Nenhum erro JavaScript detectado nos cenários executados.
- Não foram realizados testes com um provedor Gemini/OpenAI real ou inicialização pelo Windows `start.bat`.
