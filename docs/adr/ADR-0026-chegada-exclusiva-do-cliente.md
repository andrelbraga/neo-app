# ADR-0026 — Chegada exclusiva: a apresentação abre com um convite pessoal ao cliente

- **Status:** aceita
- **Data:** 24/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-03.21, RN-03.16, ADR-0008, ADR-0019, ADR-0024

## Contexto e problema

Pedido (CLI, 24/11/2026), com uma imagem em `resources-neo/` (a chegada do convite da entrega v12): "apresenta uma idéia diferente de apresentação no qual traz uma pequena apresentação e saudação do cliente dando a entender a exclusividade com o mesmo, quero que aplique isso e demais critérios que deem a entender isso".

A apresentação já tinha um script de saudação pelo horário (`saudacao`), mas sem o elemento `#saud` na página, então nada aparecia.

## Decisão

A ponte (`public/showroom/neo360-bridge.js`) abre a apresentação, nos layouts A e B, com uma tela de chegada:
- topo com o logo Neo360;
- "Um convite de {corretor} para você";
- saudação pelo horário do aparelho com o primeiro nome do cliente ("Boa noite, Rodrigo."), ou só a saudação quando o nome ainda não é conhecido;
- o texto de boas-vindas da v12, com o nome do empreendimento;
- a assinatura "{corretor} · seu corretor";
- um cartão com a capa do empreendimento, "Seu próximo lugar em {cidade}." e o botão "Conhecer esta oportunidade →".

Outros sinais de exclusividade:
- A chegada aparece uma vez por sessão do navegador. Quem volta em outra sessão lê "Que bom te ver de novo."
- Com o nome do cliente, o título da aba vira "{empreendimento} · preparado para {nome}".
- O nome vem da visita: do convite do cliente cadastrado (RN-03.16) ou do contato que ele já deixou.

Nada é gravado na API: é só apresentação.

## Consequências

- Boas: o cliente percebe que a página foi preparada para ele, pelo corretor, antes de ver o empreendimento. Vale para qualquer empreendimento com página própria.
- Ruins / riscos:
  - o fundo de folhas (`img/folhas-geada.jpg`) é da pasta do Boa Vista; outra apresentação sem esse arquivo fica com fundo liso;
  - o modelo padrão do showroom (empreendimento sem página própria) não tem a chegada.

## Fontes

- `resources-neo/Screenshot 2026-11-24 at 22.15.29.png`.
- `resources/Neo360_BoaVista_COMPLETO_v12/dist/cockpit/invites.mjs` e `invite-landing.mjs` (neo360-app): "UM CONVITE DE … PARA VOCÊ", saudação pelo horário e texto de boas-vindas.
