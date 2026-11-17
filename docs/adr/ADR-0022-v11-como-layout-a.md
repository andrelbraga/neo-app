# ADR-0022 — Página da entrega v11 como layout A (padrão), sem perfil e sem chat na página

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Substitui em parte:** ADR-0019 (qual página é A e qual é B), ADR-0021 (v11 como B)
- **Relacionados:** ADR-0008, ADR-0015, ADR-0019, ADR-0021, RN-03.3, RN-03.8, RN-03.15

## Contexto e problema

Pedido do usuário (17/11/2026):
- "Remova a sessão 'Crie seu perfil' da página."
- "Passe a página para abrir como padrão A."
- "Os dados de ambas páginas têm de vir para o Corretor."
- "Remova interações de chat via página."

Respostas do usuário na mesma conversa:
- a v11 vira o A e a página anterior vira o B;
- "Crie seu perfil" sai das duas páginas.

## Decisão

- **Troca de páginas:**
  - `public/showroom/boa-vista/index.html` (layout A, padrão) passa a ser a página da entrega v11;
  - `index-b.html` (layout B) passa a ser a apresentação anterior.
  - Links sem `?layout` e o padrão do empreendimento (`default_layout = a`) abrem a v11.
- **Perfil e chat fora das duas páginas:**
  - "Crie seu perfil" (`.vid-c` e o diálogo `#perfil`) e o painel de chat (`#mz-painel`) ficam escondidos por CSS;
  - os scripts das páginas usam esses elementos, e tirá-los do HTML quebraria o resto da página;
  - a bolha e "Prefiro conversar com o corretor" abrem o WhatsApp do corretor (ADR-0015).
- **Dados das duas páginas ao corretor:**
  - a ponte reconhece a v11 pelo coletor de medição dela (`window.BVMetrics`), não pela letra do layout. Cada página manda proposta, ações, seções e tempo do jeito dela;
  - "Viu o layout A/B" sai com a letra do link.

## Consequências

- Boas: o link padrão abre a v11, e a ponte segue certa mesmo que as letras troquem de novo.
- Ruins / riscos:
  - clientes registrados antes desta troca contam no layout da primeira visita: o "A" deles era a página anterior. A comparação A × B de antes de 17/11/2026, por volta das 20h30, mistura as duas páginas;
  - o perfil não vem mais da página. O corretor recebe nome e WhatsApp pela proposta.
