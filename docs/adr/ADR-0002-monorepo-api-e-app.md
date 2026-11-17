# ADR-0002 — Stack do neonflow em um repositório com `api/` e `app/`

- **Status:** substituída pela ADR-0017 (17/11/2026): API e app em repositórios separados
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** —

## Contexto e problema

O pedido foi "inicie um novo projeto aqui dentro seguindo a stack padrão". A stack padrão (neonflow) usa Go/Gin/PostgreSQL na API e React/Vite/Tailwind no app, em dois repositórios irmãos.

## Opções consideradas

1. `api/` e `app/` dentro de `neo360-app` (um repositório).
2. Dois repositórios irmãos, `neo360-api` e `neo360-app`, como o neonflow.

## Decisão

Opção 1, escolhida pelo usuário em 16/11/2026. Mesma stack e mesmas convenções do neonflow (domínios, migrations `V{n}`, envelope `{status, data}`, Caddy, Railway), em um só repositório. Cada pasta tem seu Dockerfile, Makefile e `railway.json` e vira um serviço separado no Railway.

## Consequências

- Boas: uma mudança que cruza API e app fica em um só PR; um CI para os dois.
- Ruins / riscos: o Railway precisa apontar o diretório raiz de cada serviço (`api/` e `app/`).

## Fontes

- Conversa no CLI, 16/11/2026.
- `../neonflow-api/docs/adr/ADR-0009-stack-e-repositorios.md`.
