# ADR-0003 — Protótipo Boa Vista congelado como evidência

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** time
- **Relacionados:** RN-02.5, P-03

## Contexto e problema

As páginas do Boa Vista Residencial (Apto 104-A) foram feitas como artefato estático, com dados guardados no navegador ou no banco do artefato do Claude. Elas descrevem bem o produto (showroom, painel do gestor, evidências de navegação, dono do cliente), mas não são o sistema.

## Decisão

O protótipo fica em `prototipo/boa-vista-104a/` sem edição. Ele é a fonte das regras marcadas como "protótipo" e do seed do Boa Vista. O que for reaproveitado (tour 3D, imagens) é copiado para `app/public/`.

## Consequências

- Boas: dá para conferir a qualquer momento o que foi pedido no protótipo.
- Ruins / riscos: partes do protótipo (simulador, proposta, painel do gestor) ainda não existem no sistema (P-03).
