# neo-app

App web do **Neo360**: painel do corretor, admin, showroom público e a apresentação do Boa Vista Residencial. O corretor gera um link exclusivo por empreendimento; o cliente explora a apresentação e envia a proposta; a conversa e o fechamento são pelo WhatsApp.

A API está em [andrelbraga/neo-api](https://github.com/andrelbraga/neo-api).

React 18 · Vite · TypeScript · Tailwind · TanStack Query · zustand · Caddy · Railway

| Pasta | O que é |
|---|---|
| `src/` | App React |
| `public/showroom/` | Apresentação do Boa Vista e a ponte com a API (`neo360-bridge.js`) |
| `prototipo/` | Protótipo estático do Boa Vista (congelado, ADR-0003) |
| `resources/` | Referência de layout do painel (ADR-0013) |

## Rodar local

```bash
make setup
make dev        # http://localhost:5174 (API do neo-api em http://localhost:8081)
```

## Testes

```bash
make check      # typecheck, lint e testes
```

## Deploy (Railway)

O serviço publica a cada push na `main`. Variável de build: `VITE_API_BASE_URL` = URL pública da API + `/api`.

## Documentação

- Para agentes e devs: [`CLAUDE.md`](CLAUDE.md) e [`.claude/`](.claude/CLAUDE.md)
- Regras de negócio: [`.claude/business-rules/`](.claude/business-rules/README.md)
- Decisões: [`docs/adr/`](docs/adr/README.md) · Pendências: [`docs/pendencias.md`](docs/pendencias.md)
