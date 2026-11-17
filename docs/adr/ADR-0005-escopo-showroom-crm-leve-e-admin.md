# ADR-0005 — Escopo inicial: showroom, CRM leve e admin com visão de tudo

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-01.4, P-03, P-04

## Contexto e problema

Foram apresentadas três opções, a partir de plataformas parecidas (DWV e Órulo, que ligam incorporadora e corretor; CV CRM e Sienge, com portal do corretor e espelho de vendas; Apto e Imóvel Guide, com página do corretor):

- A: showroom com captação;
- B: A mais CRM leve (funil, linha do tempo, chat);
- C: B mais espelho de vendas, campanhas e papéis de imobiliária e incorporadora.

## Decisão

B, com um admin que vê tudo e cadastra empreendimentos, incorporadoras, imobiliárias e profissionais (usuário: "Execute a B, porém esse CRM tem de ter um Admin no qual tenha visão de tudo"). O modelo de dados já separa empreendimento, empresa, corretor, cliente e evento, para crescer em direção à C.

## Consequências

- Boas: entrega o fluxo pedido de ponta a ponta.
- Ruins / riscos: reserva de unidade, campanhas e visão da imobiliária ficam para depois (P-04).
