# ADR-0010 — Imobiliárias pré-cadastradas, com logo, escolhidas ao criar o profissional

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0008, ADR-0009, RN-01.6, P-12

## Contexto e problema

Pedido do usuário: "Quero que traga uma lista de imobiliárias pré-cadastradas na hora de criar o profissional, lembrando que na landing page de apresentação é carregado junto da incorporadora o logo da imobiliária." A ADR-0009 tirou do app o cadastro de empresas.

## Decisão

- `organizations.logo_url` (V4). A V4 pré-cadastra a **Omni**, única imobiliária real citada no protótipo, com o logo dele (`/logos/imobiliaria-omni.png`), e põe o logo da Dwell.
- O cadastro e a edição do profissional no admin trazem as imobiliárias ativas numa lista por nome, mais "Autônomo". O logo **não** aparece no admin, só na apresentação do empreendimento (pedido do usuário em 16/11/2026: "quero que traga uma lista por escrito, o logo aparecerá apenas na página de apresentação").
- A apresentação recebe `agency_name` e `agency_logo_url` do corretor; a ponte troca o logo do cartão "Imobiliária parceira". Sem imobiliária, o cartão some.
- Continua sem tela de cadastro de empresas (ADR-0009): imobiliária nova entra por migration, com o logo em `app/public/logos/`.

## Consequências

- Boas: o cliente vê a imobiliária certa de cada corretor, com o logo, como no protótipo.
- Ruins / riscos: incluir imobiliária exige migration e deploy até a tela voltar (P-12).
