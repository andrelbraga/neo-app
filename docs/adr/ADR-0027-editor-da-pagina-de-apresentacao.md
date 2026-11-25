# ADR-0027 — Editor da página de apresentação no admin (mini CMS)

- **Status:** aceita
- **Data:** 24/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-02.6, ADR-0008, ADR-0019, ADR-0021, ADR-0022, ADR-0026, P-01, P-20

## Contexto e problema

Pedido (CLI, 24/11/2026): "Na tela do adminitrador quero criar um mini CMS da pagina do produto no qual eu possa editar, configurar, habilitar ou desabilitar as sessões da pagina. Ex: Quero desabilitar o 3d, marco para desabilitar, quero mudar o texto XPTO, quero remover o rodapé, quero alterar o footer, use referencias em sites que fazem esse tipo de trabalho de criação de página".

A página do Boa Vista é o HTML da entrega v11 (layouts A e B). Ela traz o liga e desliga do protótipo (`aplicaConfig`, com o painel em `painel.html` da v12), mas preso ao armazenamento do protótipo. Em produção, roda só com o padrão.

## Referências

- **Shopify, editor de temas:** lista de seções com o olho para mostrar ou ocultar, configurações da seção e prévia ao vivo com troca entre computador e celular.
- **WordPress, Personalizar:** prévia ao vivo; nada vai para o ar até "Publicar".
- **Webflow, Editor:** clicar no texto da prévia leva à edição dele.
- **Wix e Squarespace:** seções ligadas e desligadas na própria página; "Descartar" volta ao publicado.

## Opções consideradas

1. Reescrever a página como blocos estruturados no banco: reescrita grande, que perderia a página aprovada.
2. Reaproveitar o `cfg` do protótipo: ele só cobre os blocos que o protótipo previu, não qualquer texto, e fica preso aos scripts dele.
3. Editar por fora: a ponte da página lê as seções e os textos do próprio HTML e aplica a configuração guardada na API.

## Decisão

Opção 3.

- **API:**
  - V12 cria `developments.page_config` (JSONB), com seções ocultas, blocos desligados e textos trocados, validada em `PageConfig.Validate`;
  - `PUT /api/admin/developments/:id/page` publica;
  - a configuração vem com o empreendimento, também no showroom público.
- **Ponte** (`neo360-bridge.js`):
  - **Página do cliente:** aplica a configuração. Seção ou bloco oculto fica fora da tela; texto trocado é achado pelo texto original dentro da seção (se a página mudar e o original sumir, a troca não se aplica); quebra de linha vira quebra de linha; texto vazio some.
  - **Seções:** têm chave estável (a mesma nos layouts A e B), e a configuração vale nos dois.
  - **Textos editáveis:** só elementos com texto puro (com negrito, itálico e quebra). Elemento com imagem, ícone ou campo dentro não entra, para a troca não apagar o resto. Os textos que a ponte preenche com o corretor do link também não entram.
  - **Blocos:** Planta 3D do apartamento, Condomínio em 3D e Posição do sol.
  - **Chegada exclusiva (ADR-0026):** pode ser desligada.
- **Editor** (`/admin/empreendimentos/:id/pagina`, botão "Editar página" no cadastro):
  - à esquerda, as seções, com o olho e o selo de mudanças; aberta, cada seção mostra os blocos (interruptor) e os textos (busca quando são muitos, "Restaurar" e aviso quando o texto fica vazio);
  - à direita, a prévia em modo editor (`?cms=1`): sem API nem visita registrada, sem o aviso de medição, com cada mudança na hora, Layout A ou B e Computador ou Celular;
  - clicar num texto da prévia abre o campo dele;
  - "Publicar" e "Descartar", com aviso ao sair com mudanças não publicadas;
  - as mensagens entre o editor e a prévia só valem da mesma origem.

## Consequências

- Boas:
  - o admin oculta seções e o 3D e troca qualquer texto, inclusive o rodapé, sem mexer no HTML;
  - a página aprovada continua a mesma;
  - vale para outra página própria que siga o mesmo padrão de seções.
- Ruins / riscos:
  - sem histórico de versões: "Descartar" volta só ao último publicado;
  - preço e condições ficam fora (P-03; "valores comerciais editáveis no admin" estão fora desta versão);
  - trocar um título com formatação (por exemplo, a segunda linha dourada) deixa o texto sem essa formatação;
  - o modelo padrão do showroom não tem editor.

## Fontes

- Conversa de 24/11/2026 (CLI).
- `resources/Neo360_BoaVista_COMPLETO_v12/dist/painel.html` (neo360-app): liga e desliga por seção e blocos de 3D do protótipo.
