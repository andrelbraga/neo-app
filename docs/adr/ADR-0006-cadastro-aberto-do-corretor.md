# ADR-0006 — Cadastro aberto do corretor, link na hora, CRECI opcional

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-01.1, RN-01.2, RN-01.5

## Contexto e problema

O corretor se cadastra com nome, sobrenome, telefone, e-mail e CRECI e passa a operar. Era preciso decidir se alguém aprova antes do primeiro link.

## Opções consideradas

1. Aprovação do gestor antes do link.
2. Link liberado na hora.

## Decisão

Opção 2 (usuário: "Pode gerar o link, CRECI é opcional"). O controle fica com o admin depois do fato: ele pode desativar o corretor, o que derruba a sessão e os links dele (RN-01.5).

## Consequências

- Boas: o corretor começa a usar em um minuto.
- Ruins / riscos: alguém que não é corretor pode criar conta e circular links até ser desativado.
