# InsightLab v8 — Agente central de workspace

## Como iniciar
Execute `start.bat` na pasta `insightlab_langchain` (Windows), ou inicie a API FastAPI na porta 8000 e o frontend na porta 5500. Utilize o token de administração gerado pelo inicializador.

## Fluxo
1. Abra Data Studio e importe um CSV compatível (data e valor; os demais campos podem ser inferidos por aliases conhecidos).
2. Abra Canvas no-code > Conectar IA. Informe o token administrativo. Opcionalmente conecte Gemini `gemini-3.1-flash-lite`, já testado; sem modelo, o agente atua em modo de demonstração.
3. No bloco **Agente central de workspace**, descreva seu objetivo e clique **Planejar meu workspace**.
4. Revise objetivo, páginas sugeridas, componentes, próximos passos e limitações. Clique **Aplicar proposta** ou **Descartar**.
5. **Desfazer última aplicação** remove apenas o dashboard criado por essa aplicação e restaura preferências de boas-vindas. Não altera os dados originais.

## Arquitetura
- POST `/api/ai/workspace/plan` recebe somente perfil estatístico e intenção textual, validando saída pelo Pydantic `WorkspacePlan`.
- LangChain e provedor ativo são reutilizados; erros temporários 503 têm retry; sem provedor, proposta local determinística.
- O frontend não executa código da IA: apenas aceita tipos permitidos no builder.
- O dataset permanece no navegador. Não enviamos linhas brutas do CSV automaticamente para o modelo, mas exemplos de valores de colunas e distribuições resumidas podem conter dados pessoais; use arquivos sintéticos ao demonstrar.
- Suporte real a CSV arbitrário **ainda não está implementado**: o Data Studio normaliza para `date`, `amount`, `store`, `category`, `status`. Campos adicionais não são representados no Canvas nesta versão.
- O agente propõe quais seções existentes usar, mas **não cria novas páginas ou ferramentas**.
- Undo vale para a última aplicação da sessão atual: não é um controle completo de versões.
- Não há colaboração multiusuário, banco de dados, execução autônoma de tarefas nem análises preditivas.

## Validação
Sintaxe de Python e JavaScript verificada. Testes com modelos externos dependem das credenciais da instalação.
