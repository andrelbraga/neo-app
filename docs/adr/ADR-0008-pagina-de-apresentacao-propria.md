# ADR-0008 — Página de apresentação própria por empreendimento, ligada por uma ponte

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0003, ADR-0007, RN-03.3, RN-03.8, P-01, P-03

## Contexto e problema

Pedido do usuário: "Quero que a apresentação do empreendimento se apresente da mesma forma que está aqui" (`prototipo/boa-vista-104a/index.html`). A página do protótipo tem 2.176 linhas: simulador, montagem de proposta, perfil do cliente, planta e maquete 3D com sol, chat e aviso de medição. Reescrevê-la em React levaria semanas e se afastaria do original.

## Opções consideradas

1. Reescrever a apresentação em React.
2. Servir uma cópia da página e ligá-la à API por um script ponte.

## Decisão

Opção 2. O empreendimento ganhou o campo `presentation_url` (V3). Com ele preenchido, `/e/:slug/:code` abre a página em tela cheia (iframe da mesma origem) com `?slug=&code=&api=`. A cópia fica em `app/public/showroom/boa-vista/index.html`, igual ao protótipo mais uma linha que carrega `app/public/showroom/neo360-bridge.js` (desde a ADR-0011, também com a ordem das seções reorganizada). A ponte, sem editar o HTML:

- abre a visita e guarda o token, como o showroom padrão (RN-03.1, RN-03.2);
- troca o consultor de exemplo pelo corretor do link (nome, CRECI, código, imobiliária) e mostra as iniciais no lugar da foto ilustrativa;
- envia seções vistas, cliques (`regAcao`) e tempo por seção **só depois do aceite de medição que a própria página pede**;
- grava a proposta e o perfil enviados, com nome e WhatsApp (RN-03.8);
- liga o chat da página à API e acrescenta o botão de WhatsApp do corretor.

A apresentação só aceita caminho do próprio app (não `https://` externo), porque roda na mesma origem do token do cliente.

## Consequências

- Boas: a apresentação é a mesma do protótipo; tudo o que o cliente faz nela chega ao CRM.
- Ruins / riscos: a ponte depende de nomes do HTML (`regAcao`, `regGravaProposta`, `#mz-form`, `.tc-nome`); mudar a página exige conferir a ponte. Preços e condições do protótipo aparecem como estão (P-03). Os modelos 3D somam cerca de 27 MB em `app/public` (P-09).
