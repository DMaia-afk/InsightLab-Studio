# Diagnóstico do Gemini (v5.2)

1. Ative o ambiente virtual do backend.
2. `python -m pip install -U langchain-google-genai google-genai`
3. `python backend/testar_gemini.py` (execute a partir da pasta `insightlab_langchain`).
4. Se o teste direto funcionar e a conexão LangChain falhar, confira o traceback no terminal FastAPI.
5. Execute `uvicorn app:app --host 127.0.0.1 --port 8000 --reload` dentro de `backend`.

A versão 5.2 classifica erros 400, 401, 403, 404, 429, SSL, timeout e grava traceback no terminal. **Não publique o backend com token administrativo exposto**. A configuração continua adequada para demonstração privada, não multiusuário.
