# ADR-0011 — Apresentação organizada em etapas, com contato antes da proposta

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0003, ADR-0008, RN-03.5, RN-03.11

## Contexto e problema

Pedido do usuário: "A página de empreendimento quero que organize melhor as etapas de forma que façam sentido na hora do cliente entrar em contato ou de mandar uma dúvida." Na cópia do protótipo:

- não havia botão de contato no corpo da página: só a bolha do chat, com o WhatsApp escondido dentro dela;
- "Crie seu perfil" pedia nome e WhatsApp logo depois da abertura, antes de o cliente ver o imóvel, e repetia o que a proposta pede;
- imobiliária e incorporadora apareciam antes do produto;
- a dúvida mandada pelo chat sem contato só podia ser respondida na própria página.

## Decisão

A cópia em `app/public/showroom/boa-vista/index.html` passa a ter a ordem **Conheça → Explore → Dúvidas → Proposta**, com uma barra de etapas fixa no topo que marca a etapa na tela:

1. Seu consultor, com "Tirar uma dúvida" (abre o chat) e "WhatsApp".
2. Conheça: a abertura.
3. Explore: galeria, planta e 3D, torres e áreas comuns.
4. Dúvidas: perguntas prontas (pagamento, prazo de entrega, investir e alugar, permuta, visita), chat e WhatsApp, e "Quem está com você nesta compra" (imobiliária e incorporadora).
5. Proposta.
6. ~~Crie seu perfil, no fim, opcional.~~ Escondido em 16/11/2026, a pedido do usuário ("Criar perfil de cliente por hora é desnecessário"); a seção fica no HTML porque o script do protótipo depende do botão.

O chat, depois da primeira dúvida sem contato, convida a deixar nome e WhatsApp para receber a resposta também por lá (RN-03.11). O cabeçalho com o logo deixa de ser fixo para a barra de etapas ser a única faixa fixa no celular. As mudanças no HTML estão marcadas com o comentário `Neo360 ... (ADR-0011)`; o protótipo em `prototipo/` não muda (ADR-0003).

## Consequências

- Boas: um caminho claro para perguntar antes de negociar; WhatsApp visível em dois lugares; a dúvida vira contato.
- Ruins / riscos: a cópia deixou de ser idêntica ao protótipo (ADR-0008); mudanças no protótipo precisam ser trazidas à mão.
