# ADR-0016 — Apresentação em estilo metrô, proposta em formulário único e cliente pelo WhatsApp

- **Status:** aceita
- **Data:** 17/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Substitui em parte:** ADR-0011 (barra de etapas e seção de dúvidas no corpo), ADR-0012 (barra de capítulos e sobrevoo da maquete)
- **Relacionados:** ADR-0008, ADR-0014, ADR-0015, RN-03.1, RN-03.8, RN-03.11, RN-03.14

## Contexto e problema

Pedido do usuário (17/11/2026), sobre a apresentação do empreendimento:
- remover o cabeçalho (logo, etapas e logo), o ícone de WhatsApp da página, a maquete 3D e o fundo de folhas;
- cartão do consultor usando o container todo; seções na largura toda do container;
- sem cantos arredondados ("um estilo mais metro"); sem serifa, com fonte moderna de marketing; sem o azul-claro;
- galeria com carrossel maior e mais interativo no desktop;
- planta sem abas, com tudo na página;
- proposta como formulário único com os campos e a simulação; nome e telefone obrigatórios; etapa 3 (fechamento) como caixa de seleção;
- "caso um mesmo cliente tenha enviado mais de uma proposta fica salvo e atrelado ao número do telefone, na aba de propostas aparecerá as propostas enviadas";
- "ficou alguma dúvida" no rodapé, de forma mais elegante.

## Decisão

**Página** (`app/public/showroom/boa-vista/index.html`, marcas `Neo360 (ADR-0016)`). Os scripts originais do protótipo dependem de certos IDs. Por isso, o que saiu da vista e ainda é usado por eles fica no HTML, escondido (abas da planta, maquete, modal de fechamento, botões antigos, simulador genérico, bolha); o resto saiu do HTML.

- **Saem da vista:**
  - a faixa "Proposta personalizada", o cabeçalho com o logo e a barra de capítulos;
  - a bolha flutuante de WhatsApp;
  - a maquete do condomínio e os botões "Sobrevoar em 3D";
  - o fundo de folhas;
  - o simulador genérico (valor, entrada, parcelas): a proposta já simula com os números da campanha.
- **Estilo:**
  - camada final de CSS com fonte Plus Jakarta Sans (Google Fonts) em toda a página;
  - cantos retos e sem sombras;
  - grafite `#111511` e dourado `#c9a25e` no lugar do azul-claro `#97d5d0`;
  - seções na largura do container (até 1240 px), com faixas de cor na largura da janela (galeria e rodapé em grafite, proposta em areia).
- **Consultor:** faixa grafite na largura toda, com o quadro das iniciais, nome grande, especialidades e "Tirar uma dúvida no WhatsApp".
- **Galeria:** carrossel 16:9 (4:5 no celular) com:
  - setas, miniaturas e contador;
  - troca automática com barra de progresso, que pausa com o mouse em cima, com foco ou fora da tela;
  - teclado, arrastar ou deslizar o dedo;
  - ampliação em tela cheia com setas e Esc.
- **Apartamento:** a planta com os pontos dos ambientes, a planta 3D (abre sozinha quando a seção se aproxima), o controle do sol e as fichas "Ambientes e áreas" e "Ficha da unidade", tudo à vista, sem abas.
- **Proposta:** um formulário com:
  - a condição da campanha e os campos (entrada, parcelas, reforços, chaves, veículos);
  - nome e WhatsApp, obrigatórios e validados na página;
  - a observação e a caixa "Se a proposta for aprovada nessas condições, posso seguir para o contrato", que vai como `wants_contract`;
  - ao lado, a simulação (resumo e "Como você paga").

  Depois de enviar, a página confirma e oferece "Continuar no WhatsApp".
- **Dúvidas no rodapé:** "Pergunte direto a <corretor>", com perguntas prontas em lista (abrem no WhatsApp), imobiliária, incorporadora e o aviso legal.

**Cliente pelo WhatsApp (RN-03.14, migração V7):**
- se o cliente informa um WhatsApp que já existe em outro cadastro do mesmo empreendimento (outro navegador ou aparelho), os cadastros são juntados no mais antigo: eventos e propostas passam para ele, e os outros ficam com `merged_into`;
- o token do navegador juntado continua abrindo o cadastro que ficou;
- o dono é o do cadastro mais antigo, como manda a RN-03.1;
- cada proposta guarda `client_name` e `client_phone`, e a ficha mostra "Enviada por <nome> · <WhatsApp>".

## Consequências

- Um cliente que chegou por links de dois corretores em aparelhos diferentes fica com o primeiro. O segundo não vê a proposta. A confirmação da página não cita o nome do corretor, para não prometer o que não acontece.
- Quem digitar o WhatsApp de outra pessoa junta o seu cadastro ao dela. Nada da outra pessoa aparece na página, mas o nome dela pode voltar no preenchimento do formulário daquele navegador. Fica registrado em P-15.
- A apresentação perdeu a identidade visual do protótipo (creme, verde e serifa) e ganhou a da Neo360 em estilo metrô. O protótipo continua congelado (ADR-0003).
