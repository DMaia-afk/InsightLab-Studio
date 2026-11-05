# InsightLab Studio v10.3 — Chat ↔ Data Studio ↔ Canvas ↔ Dashboard Story

## O que mudou

- O chat central usa um **motor de consultas local sobre as colunas reais** do CSV, não apenas o perfil financeiro normalizado.
- Quando um provedor é configurado, o backend usa LangChain para planejar operações tipadas (`count`, `sum`, `avg`, `min`, `max`, `frequency`, `distinct`) por coluna, filtros de igualdade e recortes de data.
- O **navegador executa os cálculos** nos registros ativos do Data Studio (incluindo os filtros atuais). O resultado agregado e limitado é enviado de volta à IA para redigir a análise. O CSV completo não é enviado.
- O chat oferece uma **proposta revisável de dashboard** compatível com as colunas detectadas. Nada é criado antes do usuário confirmar.
- O Canvas agora aceita métricas e dimensões de colunas não-canônicas e mantém widgets editáveis; a API antiga de dashboards e os dados originais foram preservados.
- Dashboards gerados a partir do chat continuam no armazenamento local e acionam o **Dashboard Story automático** da v10.2.
- Os atalhos **Criar com IA**, **Criar workspace com IA** e as sugestões da Home abrem o chat central em vez de direcionar para os painéis antigos ocultos.
- A narrativa do Dashboard Story usa o endpoint de interpretação com **evidências do widget atual**, substituindo a antiga dependência de um perfil estatístico genérico.
- Ao alterar o CSV ou filtros, uma proposta ainda não aplicada é invalidada: o usuário precisa consultar novamente antes de criar.

## Fluxo de uso

1. Rode `start.bat` no Windows, como antes.
2. Abra o Data Studio e importe uma planilha, revisando o mapeamento das colunas.
3. No chat, experimente: `Como está o desempenho por serviço?`, `Quanto tempo médio de atendimento por profissional?` ou `Crie um dashboard com receita por categoria e evolução mensal`.
4. Leia os resultados e escolha **Confirmar e aplicar** na proposta do dashboard, se desejar.
5. Abra **Apresentar dashboard atual** no Canvas para acessar o roteiro vinculado.
6. Em Configurações, conecte um provedor e insira o token de administração para liberar planejamento e explicações com IA. Sem provedor, o motor local continua funcionando com regras limitadas.

## Arquitetura

`Chat (intelligence-chat.js) → AssistantCore + DataEngine (assistant-data-engine.js) → FastAPI /assistant/plan (assistant_tools.py) → execução local de consultas → /assistant/explain → proposta confirmada → builder.js → Dashboard Story`

### Contratos aditivos

- `POST /api/ai/assistant/plan` — recebe pergunta, histórico limitado, descrição do dashboard e esquema de colunas sem registros; devolve operações e widgets estruturados.
- `POST /api/ai/assistant/explain` — recebe pergunta e agregações calculadas, devolve uma explicação em Markdown.
- Ambos exigem autenticação administrativa via cabeçalho `Authorization: Bearer <INSIGHTLAB_ADMIN_TOKEN>`; não foi criado armazenamento de chaves no navegador.
- Rotas e contratos anteriores continuam disponíveis.

### Segurança e privacidade

- A saída do modelo **não executa SQL, Python nem JavaScript**: o cliente aceita apenas operações e campos catalogados.
- Por padrão, a IA vê os **nomes das colunas** e, na etapa de interpretação, **resultados agregados limitados**. Não recebe o arquivo CSV completo.
- Se forem detectados campos diretamente identificáveis (como CPF, e-mail, telefone ou endereço), a interpretação desses resultados é mantida localmente.
- **Atenção:** agregações agrupadas por nomes de pessoas ou por grupos muito pequenos ainda podem representar informações pessoais. Use um provedor confiável, revise os dados e não utilize este MVP como solução corporativa com dados sigilosos sem autenticação por usuário, políticas de retenção e controles de privacidade adicionais.
- Logs de chamadas continuam disponíveis em Configurações, sem registrar o conteúdo integral de prompts ou CSVs.

## O que ainda não está incluído

- Não há garantia de respostas semanticamente perfeitas para qualquer domínio; campos ambíguos podem exigir mapeamento manual.
- A base segue local no navegador, não sincronizada entre usuários/dispositivos.
- O modo local é limitado a regras de identificação de colunas; o planejamento mais sofisticado depende do modelo conectado.
- Nenhuma integração externa de e-mail ou automação sem confirmação foi adicionada.
- Não foram feitas alterações de banco de dados ou mudanças incompatíveis nas APIs anteriores.

## Verificações

- `node --check` em todos os JavaScript, inclusive scripts inline.
- `python -m py_compile` em `backend/app.py` e `backend/assistant_tools.py`.
- API local testada: 401 sem token, 409 sem provedor ativado.
- Chromium headless com HTML e recursos inline para contornar o bloqueio de rede de teste: login, importação de CSV de barbearia, análise de colunas arbitrárias, confirmação e criação do dashboard, vínculo com slides, persistência mockada. Nenhum erro JavaScript encontrado.
- Caminho de IA testado com respostas simuladas de `/assistant/plan` e `/assistant/explain`, confirmando que a média foi calculada localmente e que os campos escolhidos pela IA foram usados nos widgets.
- **Não houve chamada real ao Gemini/OpenAI/Claude nem execução do BAT no Windows neste ambiente**. Esses testes de integração final precisam ser realizados na máquina do usuário.
