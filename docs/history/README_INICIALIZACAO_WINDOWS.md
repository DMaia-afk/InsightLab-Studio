# Inicializador do InsightLab v8 (correção Windows)

O erro de instalação que termina em `KeyboardInterrupt` significa que a operação foi interrompida, durante o carregamento de certificados do pip. Isso não comprova, isoladamente, falha do certificado.

1. Execute `start.bat`. Ele **não executa pip automaticamente**: verifica se os pacotes essenciais estão presentes.
2. Se os pacotes estiverem ausentes, execute `instalar_dependencias.bat` uma vez.
3. Se houver travamento ou erro, execute `diagnostico_ssl.bat`.
4. Se o ambiente virtual foi copiado de outra pasta, exclua apenas `backend/.venv` e recrie-o com Python 3.11 ou 3.12; não copie ambientes virtuais entre instalações.
5. Use o token impresso em `start.bat`. Ele é persistido no arquivo local `backend/.insightlab_admin_token` e deve permanecer privado.
6. Encerre instâncias anteriores antes de reiniciar: portas 8000 e 5500 precisam estar livres.

A verificação de portas é preventiva; a aplicação continua destinada a uso local e não oferece isolamento de credenciais para hospedagem pública.
