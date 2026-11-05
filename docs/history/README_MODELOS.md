# InsightLab — Seleção dinâmica de modelos (v5.3)

## Mudanças
- Gemini usa `gemini-3.1-flash-lite` como sugestão inicial, não mais Gemini 2.x.
- Botão **Buscar modelos** consulta a API Gemini usando a chave digitada e mostra os identificadores com `generateContent`.
- Selecionar um modelo preenche automaticamente o campo **Modelo**.
- Continua possível digitar livremente o identificador de modelos da OpenAI, Anthropic, Groq ou Gemini.
- **Testar credenciais** executa uma geração real; aparecer na lista não garante acesso à geração.
- **Testar e ativar** muda o modelo usado pelo gerador de dashboards.

## Instalação
1. Faça backup da versão anterior, extraia o ZIP e reinstale dependências na venv do backend: `python -m pip install -r requirements.txt`.
2. Execute `uvicorn app:app --host 127.0.0.1 --port 8000 --reload` na pasta `backend`.
3. Em outro terminal, a partir da pasta `insightlab_langchain`, execute `python -m http.server 5500 --directory insightlab_mvp`.
4. Entre em **Canvas no-code** → **Conectar provedor de IA**, selecione Google, informe chave e token administrativo, clique em **Buscar modelos**, escolha `gemini-3.1-flash-lite`, **Testar credenciais** e **Testar e ativar**.

**Importante:** a chave não é salva no navegador. A configuração ativa é global para a instância do backend e permanece só na memória. Não publique este servidor como serviço multiusuário antes de adicionar autenticação por usuário, isolamento de credenciais e persistência segura.

## Inicializacao rapida no Windows (v5.3 + launcher)

Dê dois cliques em **`start.bat`** na pasta `insightlab_langchain`.
O inicializador cria `backend/.venv` se necessario, instala `requirements.txt`
na primeira execucao, abre duas janelas (API na porta 8000 e site na 5500)
e abre o navegador automaticamente.

Ele gera um **token administrativo temporario** e o exibe na janela inicial.
Copie-o no campo de token administrativo da Central de IA. Ao reiniciar, um
novo token sera criado (a menos que a variavel `INSIGHTLAB_ADMIN_TOKEN`
ja esteja definida antes da execucao). Nunca publique esse token.

Se a pasta `.venv` ja existir mas faltar alguma dependencia, execute
`backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt`
a partir da pasta `insightlab_langchain`, ou exclua o marcador
`backend\.venv\.insightlab_dependencies_ok` para reinstalar no proximo start.

Para parar, pressione Ctrl+C nas janelas API e Web. Se a porta 8000 ou 5500
estiver ocupada, encerre o processo anterior antes de executar novamente.
O `start.bat` destina-se a testes locais, nao a hospedagem publica.
