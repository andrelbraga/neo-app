# ADR-0021 — Layout B passa a ser a página da entrega v11

- **Status:** substituída em parte pela ADR-0022 (a v11 passou a ser o layout A)
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Substitui em parte:** ADR-0019 (conteúdo do layout B)
- **Relacionados:** ADR-0008, ADR-0014, ADR-0015, ADR-0016, ADR-0019, RN-03.3, RN-03.8, RN-03.15, P-16

## Contexto e problema

Pedido do usuário (17/11/2026): substituir o layout B (estilo metrô, ADR-0016) pela página da pasta do Drive "Neo360 Boa Vista — PÁGINA ATUALIZADA PARA DEV — 17-11-2026", arquivo `Neo360_BoaVista_PAGINA_ATUALIZADA_DEV_2026-11-17_v11.zip`, `dist/index.html`, e publicar.

A página da v11 foi escrita como protótipo sem envio:
- a proposta é um rascunho local;
- a medição fica no navegador (`metrics/collector.js`);
- o chat não manda mensagens.

## Decisão

- `public/showroom/boa-vista/index-b.html` é o `dist/index.html` da v11, idêntico ao arquivo (SHA-256 `14ecb281…6b56e`), mais uma linha que carrega a ponte. Entram também os arquivos de que ela depende:
  - `sintetica.css`, `sintetica.js`, `metrics/collector.js`;
  - `planta.html`, `solar-study.js`;
  - `assets/planta-decorada-estudo.png`, `assets/planta-original.webp`, `img/fundo-geada-referencia.jpeg`.
- Imagens, modelos e `maquete.html` são os mesmos do A, sem cópia. Dashboards, evidências e referências do pacote ficam fora.
- Seleção, registro e comparação de layouts seguem a ADR-0019.
- A ponte (`neo360-bridge.js`), com `layout=b`:
  - **Medição:** só com o aceite do coletor da página (`neo360-bv-metrics-choice-v1`). Ações e tempo por seção são lidos da visita em andamento (`neo360-bv-metrics-v1`). "Viu o layout B" vai junto, como no A.
  - **Proposta:** vai para o CRM quando o cliente registra a intenção ("Sim, se a proposta for aprovada" pede o contrato; "Ainda não", não), com nome e WhatsApp obrigatórios (RN-03.8). O preço é o valor que o cliente propõe.
  - **Avisos:** os textos que diziam que nada era enviado ao corretor agora dizem o que vai para ele.
  - **Atalhos de demonstração:** os links para dashboards e referências ficam escondidos.
- Correção nos dois layouts: o clique que o script da página faz na bolha (depois de "Prefiro conversar com o corretor") não abre um segundo WhatsApp.
- A página estilo metrô (ADR-0016) sai do app. Ela continua no histórico do git.

## Consequências

- Boas: comparação A × B com a página nova, sem mudança na API nem no banco.
- Ruins / riscos:
  - a ponte depende de nomes da v11 (`setIntent`, `validProposal`, `textoResumo`, `allVehicles`, `#p-preco`, `.ndec`, `.med-aviso`); trocar a página exige conferir a ponte;
  - o B mostra valores, logos e textos de exemplo da entrega (P-16);
  - o link "voltar" do estudo solar leva ao A sem o corretor.

## Fontes

- Drive, `Neo360_BoaVista_PAGINA_ATUALIZADA_DEV_2026-11-17_v11.zip` (`00_LEIA_PRIMEIRO_DEV_PAGINA_ATUALIZADA.txt`, `README.md`, `VALIDATION.md`, `MANIFESTO_SHA256.txt`), 17/11/2026.
