# InsightLab — correção do Gemini 503

O erro `503 UNAVAILABLE` indica sobrecarga temporária do modelo na API Gemini; o antigo `502` era a forma como o backend convertia a exceção.

## Alterações
- Até **3 tentativas** para indisponibilidade temporária (503), com espera exponencial e pequeno jitter, tanto no teste de credenciais quanto na geração.
- Erros definitivos (401, 403, 404) continuam sem repetição.
- Se as tentativas falharem, a API retorna **HTTP 503** com mensagem de orientação, em vez de 502 genérico.
- O modelo permanece configurável na Central de IA; **não** existe fallback silencioso, para evitar gerar um dashboard com modelo não autorizado pelo usuário.
- Nenhuma edição é aplicada ao Canvas até existir um plano completo e validado.

## Atualização
Substitua os arquivos do projeto pela versão nova, feche os processos antigos na porta 8000 e abra `start.bat` na pasta `insightlab_langchain`. Configure o modelo Gemini já validado (`gemini-3.1-flash-lite`) e tente gerar novamente. Se houver 503 persistente, tente outro modelo realmente testado; a listagem de modelos por si só não garante capacidade disponível.

**Nota:** retries podem realizar múltiplas chamadas pagas. Evite enviar tokens em logs ou capturas de tela.
