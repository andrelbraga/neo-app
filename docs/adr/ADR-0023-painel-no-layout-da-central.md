# ADR-0023 — Painel e admin no layout da Central de trabalho (entrega v12)

- **Status:** aceita
- **Data:** 24/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0013 (substituída), ADR-0009, ADR-0019, P-04, P-13, RN-01.10

## Contexto e problema

Pedido (CLI, 24/11/2026): "Analisa todas as telas deste sistema (`resources/Neo360_BoaVista_COMPLETO_v12/dist/dashboard.html`). Quero implementar esse layout no app." A Central tem moldura própria (barra lateral de 242 px com marca, seletor de ambiente e menu com rótulo; barra superior com o caminho; destaque verde) e dez telas: Início, Clientes, Convites, Campanhas, Negociações, Financeiro, Participantes, Empreendimentos, Página e Histórico.

## Opções consideradas

1. Manter a paleta índigo do ADR-0013 e trazer só a estrutura da Central.
2. Adotar o visual da Central inteiro (paleta, serifa, moldura) nas telas que já existem.
3. Além disso, criar as telas novas da Central.

## Decisão

Opção 2, escolhida pelo usuário, com o "ver como" do admin (RN-01.10).

- **Paleta (`.theme-sys` em `app/src/index.css`):** a de `cockpit/style.css`: fundo `#F4F6F1`, texto `#193E35`, cinza `#718078`, linha `#E0E7DF`, botão `#245B49`, menta `#D8EEE2` no item ativo, destaque `#193F35`, dourado `#B28D53`/`#FAF0DC`. Títulos `h1`/`h2` e números grandes em Georgia; cartões com borda fina e canto de 11 px; botões com canto de 7 px (classe `btn`).
- **Moldura (`PanelLayout`):** barra lateral com logo, "Central de trabalho", "Seu ambiente" e menu com ícone e rótulo; pé com a conta e "Sair". A barra superior traz o caminho (`Neo360 / Clientes`), a busca, o sino e o menu da conta. No celular continua a pílula flutuante.
- **Início do corretor e visão geral do admin:** destaque verde com os anéis da Central, rótulo pequeno, título em serifa e botão dourado.
- **Ambiente:** no admin, "Visualizar como" lista os corretores (RN-01.10). No corretor, mostra o código dele. Incorporadora e imobiliária não entram: seguem em P-04 (ADR-0009).

## Consequências

- Boas: o painel fica com a mesma cara da Central apresentada ao cliente. Mudar cor ou tipo continua sendo mudar `.theme-sys`. O item "Usuários" (ADR-0020) e a comparação de layouts A e B (ADR-0019) ficam como estavam, dentro da moldura nova.
- Fora desta decisão, por não terem regra nem API: Convites (cadastro prévio do cliente pelo corretor muda o dono do lead, RN-03), Campanhas, Negociações, Financeiro, Participantes, Página e Histórico (P-04, P-13). A faixa "SINTÉTICA · dados de exemplo" não entra: o app usa dados reais.
- A entrada e o cadastro (também `.theme-sys`) passam para a paleta nova.

## Fontes

- `resources/Neo360_BoaVista_COMPLETO_v12/dist/dashboard.html`, `cockpit/app.js`, `cockpit/style.css`, `cockpit/invites.mjs` (exportação de 18/11/2026, versão 12).
