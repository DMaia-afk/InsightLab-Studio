# Política de segurança — InsightLab Studio

## Âmbito do projeto

Este repositório é um **MVP de portfólio para execução local**. O frontend implementa um **login demonstrativo**; a API FastAPI utiliza **token administrativo único**, não autenticação individual, RBAC ou segregação de datasets. **Não execute o backend administrativo em rede pública ou como SaaS de terceiros.**

## Notificação de vulnerabilidades

Não publique chaves, tokens, informações pessoais ou exploits que atinjam terceiros em Issues. Se encontrar um risco, use **GitHub → Security → Report a vulnerability** caso o repositório esteja com *private vulnerability reporting* habilitado; caso não esteja, solicite ao mantenedor um canal privado sem divulgar detalhes sensíveis publicamente.

## Regras de operação segura

- Inicie os servidores apenas em `127.0.0.1` (comportamento dos scripts atuais).
- Gere um token administrativo aleatório por instalação; ele fica em `backend/.insightlab_admin_token` ao executar `start.bat` no Windows, arquivo excluído do Git.
- Nunca coloque chaves de Gemini/OpenAI/Claude/Groq em exemplos, testes, screenshots ou commits.
- As chaves de provedores são mantidas na memória RAM do backend enquanto a sessão administrativa está configurada; não são persistidas intencionalmente em disco.
- Não importe dados reais de clientes durante demonstrações públicas. Campos e valores resumidos podem ser transmitidos a um provedor externo se a IA for ativada.
- Faça backups e exporte projetos relevantes antes de limpar dados do navegador ou usar Reset.
- Restrinja `CORS_ORIGINS` às origens realmente usadas; CORS **não substitui autenticação**.
- Reveja dependências antes de atualizar, com `pip list --outdated` e as notas de segurança dos fornecedores.

## Limitadores atuais

O sistema **não** possui: sessões autenticadas, RBAC, isolamento multiusuário, gestão de consentimento, rate limiting por usuário, defesa integral contra abuso de API, quota de IA, armazenamento seguro de projetos no servidor ou suporte corporativo para dados regulados. Essas lacunas impedem recomendação de deploy público como serviço.

## Checklist antes de tornar o produto SaaS

1. Autenticação real e autorização por dashboard, dataset e apresentação, validadas no backend.
2. Armazenamento criptografado e isolamento por usuário/tenant; gestão segura de segredos no servidor.
3. Rate limiting, orçamento e limites de requisição, logs de auditoria e rastreabilidade.
4. HTTPS, cookies/sessões seguras, proteção CSRF quando aplicável e cabeçalhos de segurança.
5. Revisão de privacidade, consentimento para envio de dados à IA e políticas de retenção.
6. Teste de intrusão focado em IDOR/BOLA, XSS, importação JSON e prompt injection.
