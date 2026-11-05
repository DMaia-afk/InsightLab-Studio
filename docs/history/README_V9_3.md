# InsightLab Studio v9.3 — Design System + Apresentação

## Novidades
- `insightlab_mvp/design-system.css`: tokens semânticos para fundo, superfícies, texto, bordas, acentos, estados, raios, foco e sombras.
- Tema **Claro / Escuro** no topo. A preferência fica salva no `localStorage` deste navegador; o padrão inicial respeita a preferência de sistema.
- Botões, cards, badges, painéis, campos, modais e Canvas com tokens compartilhados.
- **Apresentar** no topo (ou no Canvas): tela cheia quando disponível, slide de abertura, dashboard atual, grupos de widgets no Canvas, setas/teclas PageUp/PageDown, Esc e impressão/PDF.
- Nenhuma alteração necessária no backend, start.bat, LangChain ou modelos de IA.

## Teste rápido
1. Inicie via `start.bat` e abra `http://127.0.0.1:5500`.
2. Clique em `Tema claro`, depois `Tema escuro` e atualize para validar persistência.
3. Importe CSV e abra `Apresentar` na Home.
4. Vá ao Canvas no-code, selecione ou gere um dashboard e clique `Apresentar`.
5. Utilize setas para navegar, Esc para sair e `PDF / Imprimir` para abrir a caixa de impressão do navegador.

## Limitações
- A apresentação mostra uma captura do DOM atual, sem atualização contínua enquanto está aberta.
- O PDF é produzido pela função de impressão do navegador, sem geração automática por backend.
- Algumas bibliotecas visuais ou elementos com estilos embutidos podem exigir refinamento específico em tema claro.
