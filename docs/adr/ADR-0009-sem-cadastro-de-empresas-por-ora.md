# ADR-0009 — Sem telas de imobiliárias e incorporadoras por ora

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0005, RN-01.4, RN-01.6, P-04

## Contexto e problema

Pedido do usuário: "Cadastro de imobiliárias e incorporadoras por hora podem ser tiradas."

## Decisão

Saem do app as telas `/admin/imobiliarias` e `/admin/incorporadoras`, os itens de menu e o seletor de incorporadora (empreendimento). O seletor de imobiliária no profissional voltou com a ADR-0010, a partir das imobiliárias pré-cadastradas. A API (`/api/admin/organizations`), a tabela `organizations` e os vínculos ficam como estão: o Boa Vista mantém a incorporadora Dwell do seed, e salvar um empreendimento ou um corretor preserva o vínculo que já existia. Voltar com as telas é só restaurar o módulo do app.

## Consequências

- Boas: admin mais simples enquanto não há empresas para cadastrar.
- Ruins / riscos: empreendimento novo fica sem incorporadora e corretor novo fica autônomo até as telas voltarem.
