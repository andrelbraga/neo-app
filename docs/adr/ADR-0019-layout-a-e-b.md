# ADR-0019 — Apresentação com layout A e B, escolhidos pelo admin e pelo corretor

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0008, ADR-0012, ADR-0016, RN-03.15

## Contexto e problema

Pedido do usuário (17/11/2026): "Crie um layout A e B então volte o layout antigo que estava", seguido de "Deixe as duas visões a encargo do administrador e o corretor até para ver qual converte mais".

## Decisão

- **Layout A** (`public/showroom/boa-vista/index.html`): a apresentação anterior ao estilo metrô, com capítulos, abertura guiada, planta viva e linha do tempo do pagamento (ADR-0012), sem chat (ADR-0015). Volta a ser o padrão.
- **Layout B** (`index-b.html`, ao lado): a versão em estilo metrô (ADR-0016). Desde a ADR-0021, a página da entrega v11.
- **Admin:** escolhe o layout padrão de cada empreendimento (`developments.default_layout`, V8), no cadastro do empreendimento.
- **Corretor:** no cartão do link, escolhe A ou B a cada envio. O link leva `?layout=a|b` e fica fixo, mesmo que o admin troque o padrão depois. Sem o parâmetro, vale o padrão do empreendimento.
- **Registro:**
  - a visita envia o layout (`POST .../visit?layout=`) e o cliente novo guarda o da primeira visita (`leads.layout`);
  - quem volta por outro layout continua contando no primeiro;
  - com o aceite de medição, a página também registra "Viu o layout A/B" na jornada.
- **Comparação:** o resumo (`/me/summary` e `/admin/summary`) traz `by_layout`, com clientes, quantos enviaram proposta, vendas e valor vendido em cada layout. O início do corretor (só os clientes dele) e a visão geral do admin (todos) mostram o cartão "Layout A × B", com a conversão em proposta e em venda. O layout com mais conversão em proposta fica destacado, com o aviso de que, com menos de 30 clientes em cada um, a diferença ainda pode ser acaso.

## Consequências

- O mesmo empreendimento tem duas páginas para manter. Mudança de conteúdo (preço, textos, fotos) vale para as duas, e a ponte (`neo360-bridge.js`) serve as duas.
- Não há sorteio automático de layout: a divisão depende de como admin e corretores escolhem. Para um teste justo, o ideal é alternar os envios.
- Cliente que juntou cadastros pelo WhatsApp (RN-03.14) fica com o layout do cadastro mais antigo.
