# Instalação e primeira execução

## Requisitos

- **Windows:** Windows 10/11 + Python 3.11 ou 3.12, `py` ou `python` no PATH. O `start.bat` cria o ambiente virtual e instala as dependências necessárias.
- **Linux/macOS:** Python >= 3.11, `venv` e `pip`; execute os dois servidores em terminais separados.
- **Opcional para contribuições:** Node.js >= 20 para testes de JavaScript e Playwright + Chromium para testes de interface.
- Uma API key de IA é **opcional** e pode gerar custos no provedor escolhido. Não é exigida para explorar os CSVs, editar dashboards ou fazer os testes locais.

## Windows — instalação guiada

1. Clone o repositório com `git clone <url-do-seu-fork-ou-repositorio>` ou baixe um ZIP. Navegue até a pasta que contém `start.bat`.
2. Execute `start.bat` em uma sessão de terminal com acesso às dependências Python. Ele cria `backend/.venv`, instala as bibliotecas ausentes, gera um token aleatório e inicia a API e o servidor web em **127.0.0.1**.
3. O frontend abre em **http://127.0.0.1:5500**. O endpoint de status da API está em **http://127.0.0.1:8000/api/health**.
4. Entre com **User** (login demonstrativo). Importante: não é uma autenticação real.
5. Para conectar um provedor, abra Configurações. Copie o token de `backend/.insightlab_admin_token` no campo **Token de administração**, insira a chave do provedor e selecione um modelo válido. Não versionar nem divulgar esses valores.
6. Vá ao Data Studio, importe `examples/barbearia.csv`, revise as colunas e crie o primeiro dashboard. Ao abrir o Dashboard Story, um roteiro pode ser gerado automaticamente com base nos widgets selecionados.

**Portas:** 5500 = frontend; 8000 = API. Os scripts param se detectarem conflitos. Evite abrir várias instâncias do programa simultaneamente.

## Linux/macOS — execução manual

Na raiz do repositório:

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
python -m pip install -r backend/requirements.txt
```

Gere um token temporário e inicie a API no terminal A:

```bash
export INSIGHTLAB_ADMIN_TOKEN="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
(cd backend && python -m uvicorn app:app --host 127.0.0.1 --port 8000)
```

Guarde esse token localmente durante a sessão se precisar acessar as configurações. Em outro terminal (B), a partir da raiz:

```bash
python3 -m http.server 5500 --bind 127.0.0.1 --directory insightlab_mvp
```

Abra http://127.0.0.1:5500. Para encerrar, pressione `Ctrl+C` em cada terminal.

## Windows — execução manual (PowerShell)

```powershell
py -3.11 -m venv backend\.venv
.\backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
$env:INSIGHTLAB_ADMIN_TOKEN = [guid]::NewGuid().ToString('N')
cd backend
.\.venv\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000
```

Em outro PowerShell, na raiz:

```powershell
.\backend\.venv\Scripts\python.exe -m http.server 5500 --bind 127.0.0.1 --directory insightlab_mvp
```

## Verificações e erros comuns

| Sintoma | Verificação |
|---|---|
| `No module named uvicorn` | Use o Python do ambiente `backend/.venv` e reinstale `backend/requirements.txt`. |
| `Failed to fetch` | Confira `/api/health`, origem e portas, e evite abrir `index.html` como `file://`. |
| `401` na configuração | Token administrativo ausente/incorreto. A API não aceita configuração com token vazio. |
| A IA responde em modo demo | Provedor não configurado ou desconectado. A análise local continua disponível. |
| Dashboard mostra aviso de fonte incompatível | Importe o CSV correto; só faça a vinculação após conferir as colunas esperadas. |
| Erro de SSL ao instalar dependências | Verifique certificado/proxy; consulte `diagnostico_ssl.bat`. Não desligue validação TLS como solução permanente. |
| Porta ocupada | Feche a instância anterior ou ajuste as portas e as origens CORS de forma coordenada. |

## Dados e backup

O CSV e os projetos ficam no navegador. Trocar de navegador/perfil ou limpar o armazenamento local pode excluir seu trabalho. Exporte os dashboards importantes em JSON e mantenha backup separado. O **Resetar demo** apaga a base CSV ativa; não foi concebido como operação reversível.

## Segurança

O backend é **single-admin**, não é um servidor multiusuário. As chamadas ao modelo podem compartilhar dados derivados do CSV com o fornecedor de IA. Use apenas dados sintéticos durante avaliações públicas. Leia [`SECURITY.md`](../SECURITY.md).
