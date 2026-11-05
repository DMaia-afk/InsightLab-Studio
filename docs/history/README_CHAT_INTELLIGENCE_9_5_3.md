# InsightLab v9.5.3 – Intelligence no canto inferior direito

- O menu Intelligence agora é acessível pelo botão flutuante de chat.
- Perguntas simples são calculadas localmente com os dados do CSV, respeitando o intervalo de datas do Data Studio.
- Com provedor configurado no backend, a rota protegida POST /api/ai/chat envia somente o perfil estatístico e o histórico recente à IA via LangChain.
- Nunca envia o CSV completo ao modelo nesta implementação.
- Requer token administrativo do InsightLab configurado na Central de IA.
- Login mock é apenas visual: não é autenticação real nem separa dados de usuários. Não publique como SaaS multiusuário.
- O Canvas continua limitado ao modelo canônico date,amount,store,category,status e não gera dashboards universais.
