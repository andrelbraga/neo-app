# Neo360 — instruções do projeto

> Após cada alteração, registre o que mudou em `.claude/specs.md`.

## O que é

Showroom de empreendimentos (lançamentos, decorados) com CRM leve para corretores. O corretor se cadastra, gera um **link exclusivo** por empreendimento e envia ao cliente pelo WhatsApp. O cliente abre o showroom (fotos, destaques, maquete 3D), tira dúvidas e envia a proposta; a conversa e o fechamento são pelo WhatsApp do corretor (ADR-0015). O corretor vê quem reagiu e o que fez, ajusta a proposta e registra a venda ou o encerramento. O **admin** vê tudo e cadastra empreendimentos e profissionais (incorporadoras e imobiliárias fora da tela por ora, ADR-0009).

Primeiro empreendimento pré-carregado: **Boa Vista Residencial** (Gramado/RS), migrado do protótipo em `prototipo/boa-vista-104a/`.

## Arquivos de referência

| Arquivo | Quando ler |
|---|---|
| `.claude/rules.md` | **Sempre** — regras técnicas |
| `.claude/design.md` | Ao criar domínio, rota, tabela ou tela |
| `.claude/style.md` | Ao escrever código (Go, SQL, TS) |
| `.claude/specs.md` | Para saber o que mudou e o que está em andamento |
| `.claude/business-rules/` | Antes de mexer em conta, link, showroom, cliente, proposta ou venda |
| `docs/pendencias.md` | Antes de implementar regra de negócio sem fonte |
| `docs/adr/` | Decisões de arquitetura e produto (MADR) |

## Estrutura

Este repositório é o **app web** (`neo-app`): painel do corretor, admin, showroom público e a apresentação do Boa Vista (`public/showroom/`). A API está em [`neo-api`](https://github.com/andrelbraga/neo-api). As decisões (`docs/adr/`), as pendências e as regras de negócio (`.claude/business-rules/`) existem nos dois repositórios: ao mudar uma, atualize a cópia no outro (ADR-0017).

```
src/        React 18 · Vite · TypeScript · Tailwind · TanStack Query · zustand
public/     apresentação do Boa Vista (public/showroom/boa-vista) e a ponte com a API (public/showroom/neo360-bridge.js)
prototipo/  Protótipo estático do Boa Vista — evidência congelada (ADR-0003)
resources/  Referência de layout do painel (ADR-0013)
docs/       ADRs e pendências (cópia compartilhada)
```

Servido por Caddy no Railway.

Módulos (`src/modules/`): `showroom` (página pública `/e/:slug/:code`), `auth`, `broker-area` (`/painel`), `admin` (`/admin`), `leads`, `developments`, `brokers`, `landing`.

## Rodar local

```bash
make setup                                # dependências
make dev                                  # App em http://localhost:5174 (API em http://localhost:8081, repositório neo-api)
```

Portas diferentes do neonflow (5432/8080/5173) para os dois rodarem juntos.

## Estado em 16/11/2026

Implementado e testado (API com 95,7% de cobertura em `internal/` com integração; app com 33 testes):
cadastro do corretor sem CRECI obrigatório; link exclusivo por empreendimento; showroom com destaques, galeria, tour 3D e contato pelo WhatsApp; rastreio do que o cliente abre; dono fixo pelo primeiro link; proposta com versões (cliente e ajustes do corretor) e desfecho (venda fechada ou sem venda); CRM do corretor (quadro, ficha com Resumo, Propostas e Atividades, WhatsApp); admin com cadastro de incorporadoras, imobiliárias, empreendimentos e profissionais e visão de todos os clientes.

Desde 16/11/2026 (ADR-0008) o Boa Vista abre com a apresentação do protótipo, ligada à API por `public/showroom/neo360-bridge.js` (repositório neo-app): ao mudar o HTML da apresentação, confira a ponte.

Fora desta versão (ver `docs/pendencias.md`): valores comerciais editáveis no admin, aviso com o painel fechado, upload de imagens, recuperação de senha, campanhas Neo360.
