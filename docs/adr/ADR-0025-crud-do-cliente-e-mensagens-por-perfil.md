# ADR-0025 — Cliente editável e arquivável, lista no lugar do quadro e mensagens por perfil e tom

- **Status:** aceita
- **Data:** 24/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-03.6, RN-03.17 a RN-03.20, ADR-0015, ADR-0024, P-19

## Contexto e problema

Pedido (CLI, 24/11/2026): "Ao entrar no detalhe do cliente quero ter a possibilidade de editar textos que vão compor o link do whatsapp, quero a possibilidade de escolher tons de textos distintos por tipo de cliente. Quero que seja possivel um crud do cliente, remova a visão de board de arrastar os clientes deixe apenas na visão de lista, com opções dos 3 pontinhos ao final".

Decisões do usuário no mesmo dia:
- tipo de cliente = perfil de compra: moradia, investimento e veraneio, mais "sem perfil";
- três tons (formal, próximo, direto), com modelos salvos pelo corretor e edição antes de cada envio;
- excluir = arquivar;
- editar = nome e WhatsApp, além do perfil.

## Opções consideradas

1. Excluir de vez o cliente.
2. Arquivar: sai da lista e dos números, com tudo guardado e restaurável.
3. Textos fixos no app, sem modelos do corretor.
4. Modelos por corretor, guardados na API, com o padrão no código.

## Decisão

Opções 2 e 4.

- **V11:**
  - `leads.profile` (vazio, moradia, investimento ou veraneio);
  - `leads.archived_at`;
  - `message_templates`, com os textos que o corretor mudou, por perfil e tom.
- **API:**
  - `PATCH /api/me/leads/:id` edita nome, WhatsApp e perfil, com a regra de WhatsApp único do cadastro (RN-03.16). Grava o evento `edicao` com os dados de antes. Quem já tinha WhatsApp não fica sem.
  - `DELETE /api/me/leads/:id` arquiva e `POST /api/me/leads/:id/restore` restaura.
  - O arquivado sai da lista, do resumo, do feed e da comparação A × B, e continua contando para o WhatsApp único.
  - Proposta nova do cliente tira do arquivo.
  - `GET /api/me/message-templates` devolve os doze modelos, os do corretor ou o padrão. `PUT` e `DELETE` em `/api/me/message-templates/:perfil/:tom` salvam ou voltam ao padrão.
- **App:**
  - "Meus clientes" e a lista do admin só em lista. O quadro saiu, nos dois.
  - Menu ⋮ do corretor em cada linha: Abrir ficha, Editar, Mensagem no WhatsApp, Mover para (desfecho abre o registro) e Arquivar ou Restaurar.
  - Filtro Ativos | Arquivados.
  - Ficha com editar, arquivar, perfil e aviso de arquivado.
  - "Mensagem no WhatsApp" começa no perfil do cliente. O corretor escolhe o tom, pode trocar o perfil da mensagem e edita o texto antes de abrir o WhatsApp.
  - "Meus modelos" (`/painel/mensagens`) ajusta os textos. Eles usam `{nome}`, `{empreendimento}`, `{link}` (convite do cliente cadastrado ou link exclusivo) e `{corretor}`.

## Consequências

- Boas: nada se perde ao "excluir"; o corretor fala com cada perfil no tom que escolher e reaproveita os textos.
- Ruins / riscos:
  - os doze textos padrão são rascunho (P-19);
  - mudar de etapa passa a ser pelo menu ou pela ficha, sem arrastar.

## Fontes

- Conversa de 24/11/2026 (CLI).
