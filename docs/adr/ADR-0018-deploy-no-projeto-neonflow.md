# ADR-0018 — Publicação no projeto neonflow do Railway, com o schema neo360 no Postgres dele

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0017

## Contexto e problema

O projeto `neo` do Railway (plano gratuito) recusou criar um Postgres: "Free plan resource provision limit exceeded". Pedido do usuário: subir "no mesmo projeto do neonflow" e usar "o mesmo banco porém em um schema diferente exclusivo para este projeto".

## Decisão

- Os serviços `neo-api` e `neo-app` ficam no projeto **neonflow** do Railway, ambiente `hml`, ligados aos repositórios do GitHub.
- A API usa o **Postgres do neonflow**:
  - pela rede privada do projeto, com `DATABASE_URL=${{Postgres.DATABASE_URL}}`, sem copiar a URL;
  - com `DB_SCHEMA=neo360`.
- Com `DB_SCHEMA`:
  - as conexões da API, das migrations e do `create-admin` usam só esse schema (`search_path`), e ele é criado se não existir;
  - tudo do Neo360 fica nele, inclusive o histórico de migrations (`schema_migrations`); nada no schema `public` do neonflow é lido ou alterado;
  - o nome é validado (minúsculas, números e `_`), porque entra no SQL.
- Sem `DB_SCHEMA`, como no desenvolvimento local, nada muda: vale o `public` do banco próprio.

## Consequências

- Os dois sistemas dividem o mesmo servidor de banco: carga, backup e restauração são compartilhados. Um restore do neonflow volta também o Neo360.
- O ambiente é o `hml` do neonflow. Quando houver plano com recurso para o projeto `neo`, mover é trocar o `DATABASE_URL` e copiar o schema `neo360` (`pg_dump -n neo360`).
- Testado localmente: as 7 migrations rodaram num schema isolado, com histórico próprio, sem tocar no `public`.
