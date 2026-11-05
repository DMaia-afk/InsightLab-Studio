# Correção de inicialização FastAPI — InsightLab v8

O `start.bat` agora aguarda uma resposta HTTP 200 de `http://127.0.0.1:8000/api/health` antes de abrir o frontend.

Se a API não responder, consulte a janela **InsightLab API** ou execute `diagnosticar_api.bat`.

- `ModuleNotFoundError`: execute `instalar_dependencias.bat`.
- `Address already in use`: encerre o processo existente na porta 8000.
- `ImportError` ou exceção em `app.py`: envie as últimas linhas do traceback.
- Confirme que o frontend está em `http://127.0.0.1:5500`, não aberto por `file://`.

Não desative SSL nem CORS para contornar falhas de inicialização.
