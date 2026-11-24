# ADR-0013 — Painel e admin no layout e na paleta da referência `resources/design_tela.jpg`

- **Status:** substituída pela ADR-0023 (24/11/2026)
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0005, ADR-0008, ADR-0012

## Contexto e problema

Pedido do usuário: "Dentro deste projeto tem uma pasta chamada resources no qual tem uma referencia de layout desse sistema, analise de forma minunciosa, se atente a os detalhes mantenha a mesma paleta de cores." Perguntado, escolheu **a paleta da referência** e aplicar **no painel do corretor e no admin**. A apresentação ao cliente continua com o visual do protótipo (ADR-0008, ADR-0012).

## Leitura da referência

Cores medidas nos pixels:

| Uso | Cor |
|---|---|
| Fundo externo | `#F4F4FC` |
| Fundo da área de conteúdo, cabeçalho de tabela | `#F5F4F9` lavanda |
| Cartões e moldura | `#FFFFFF` |
| Primária (item ativo, botão +, aba ativa) | `#3227DB` índigo |
| Ícone e aba ativos (fundo) | `#E6E3FF` |
| Barra de ações | `#232230` |
| Texto | `#27262C` |
| Situações | verde `#4B874B`, azul `#4CA1D7`, amarelo `#EAC165`, coral `#FFE4DC` com texto coral |

Elementos de layout:
- barra superior branca com logo, título da seção, busca em pílula com seletor e sino com ponto vermelho;
- menu lateral só de ícones, com o ativo num círculo lavanda e pontos separando grupos;
- lista em cartões brancos (avatar, nome, ponto colorido com a situação em caixa alta, valor e código à direita), com o item aberto preenchido de índigo e o avatar com anel e selo quando há novidade;
- detalhe com abas em caixa alta sublinhadas, botões redondos de ação e um X para fechar;
- título grande em negrito, código em cinza e etiqueta em pílula;
- datas com ícone num círculo branco e cartão "Billing to" à direita;
- tabela com cabeçalho em faixa lavanda e linhas como cartões brancos que sobem ao passar o mouse;
- tipografia sem serifa, com títulos em negrito.

## Decisão

- **Cores por variável:** as cores do Tailwind passam a ser variáveis CSS (`--c-*` em canais RGB). `:root` mantém a paleta Neo360; a classe `.theme-sys` aplica a da referência. Ela envolve o painel (`PanelLayout`), a entrada, o cadastro e o aviso de troca de conta. A página pública e a apresentação não usam essa classe e não mudam. Entraram os tons `ok` (verde) e `coral`.
- **Moldura (`PanelLayout`):** reproduz a barra superior, o menu de ícones com rótulo ao passar o mouse e o conteúdo lavanda com o canto superior esquerdo arredondado. A busca leva para os clientes (`?q=`). No celular, o menu vira uma pílula escura flutuante, no estilo da barra de ações da referência.
- **Ficha do cliente:** em telas a partir de 1280 px, a lista de clientes (`LeadList`) fica à esquerda e a ficha à direita. A ficha segue o detalhe da referência:
  - abas Resumo, Conversa e Atividade;
  - botões redondos de WhatsApp, ligação e conversa, e o X para fechar;
  - nome grande, `#empreendimento` e etiqueta da etapa;
  - datas com ícone, cartão "Contato" (e o dono, no admin);
  - etapas em controle segmentado;
  - interesse em tabela de cartões, com o contador no canto do ícone como a quantidade dos itens.
- **Etiquetas:** `Badge` e `StageBadge` usam ponto e texto em caixa alta. Novo fica em azul, em atendimento em amarelo, proposta em verde e encerrado em cinza. As barras do funil usam as mesmas cores.
- **Tabelas (`ResponsiveTable`):** cabeçalho na faixa lavanda e linhas como cartões que sobem no hover.
- **Títulos e nomes** em grafite. O índigo fica para ações, abas, item ativo e o contato da ficha.

## Consequências

- A barra de ações em massa da referência não foi copiada como função: o sistema não tem seleção múltipla, e criá-la seria escopo novo. O estilo dela foi usado no menu do celular.
- O amarelo e o cinza de texto foram escurecidos (`#E0A526`, `#7C7B8C`) para leitura sobre o branco.
- O logo Neo360 continua o mesmo; nada no logo da referência foi copiado.
- Mudar a cor do painel é mudar `.theme-sys` em `app/src/index.css`.
