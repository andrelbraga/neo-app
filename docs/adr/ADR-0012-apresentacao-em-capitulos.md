# ADR-0012 — Apresentação em capítulos, com abertura guiada, planta viva e pagamento em linha do tempo

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** ADR-0003, ADR-0008, ADR-0011 (complementa as etapas), RN-03.5, RN-03.11

## Contexto e problema

Depois da pesquisa de landing pages de lançamento, o usuário pediu: "faça os itens 1, 2, 3 e 4":

1. abertura cinematográfica, com a rolagem levando do alto até o empreendimento e um sobrevoo na maquete 3D;
2. capítulos com rolagem guiada (imagem fixa enquanto o texto passa) e a barra de etapas como índice;
3. planta viva: tocar no ambiente, ver área e foto, "um dia no apartamento" com o sol e atalho para o 3D;
4. pagamento em linha do tempo ligado ao simulador.

## Decisão

Tudo na cópia da apresentação (`app/public/showroom/boa-vista/index.html`), com marcas `Neo360 (ADR-0012)`; o protótipo segue congelado (ADR-0003).

- **Capítulos:** a barra passa a ser Lugar → Projeto → Apartamento → Dúvidas → Condições. "Dúvidas" continua antes das condições (ADR-0011). "A Vida em Gramado" não virou capítulo próprio: não há material além do que já está em Lugar. O hero antigo e a seção "Torres, vagas e áreas" ficam no HTML, escondidos por CSS, porque o conteúdo foi para os capítulos novos.
- **Abertura (Lugar):** uma seção alta com o palco fixo; a rolagem troca quatro cenas (Serra, endereço, empreendimento, apartamento) com aproximação lenta da foto. Mostra "Apresentado por" com o nome do corretor (preenchido pela ponte). Não usa vídeo de fundo: o único vídeo (`convite.mp4`) é o convite com áudio, e a rolagem sobre fotos é mais leve no celular.
- **Sobrevoo 3D:** `BV3D.voo()` abre a maquete e desce a câmera do alto até a vista do condomínio em 6 s; um toque interrompe. A descida acontece no palco da maquete, não atrás do texto da abertura, para não carregar ~10 MB de modelos antes de o cliente pedir.
- **Planta viva (Apartamento):** a planta do encarte recortada com pontos sobre os números do material. Cada ponto mostra nome, área e, quando há, foto do catálogo. Áreas e descrições vêm só do material (tabela de ambientes e ficha); ambientes sem foto própria não recebem foto. "Um dia no apartamento" (`BV3D.dia()`) abre a planta 3D e anima o sol das 7h às 19h em 9 s. "Ver em 3D" abre a planta 3D.
- **Pagamento:** "Como você paga" logo abaixo do resumo da proposta, com barra proporcional e marcos (entrada, parcelas, reforços, chaves, veículo). Usa `calc()` do simulador, sem conta própria, e redesenha a cada mudança nos campos.
- **Medição:** novas ações `voo_3d`, `comodo_<ambiente>`, `dia_no_apto` e `abriu_planta3d_viva` passam por `regAcao`, ou seja, só são gravadas com o aceite de medição; o CRM tem rótulos para elas.
- **Movimento reduzido:** com `prefers-reduced-motion`, a abertura vira uma seção comum, sem trocas de cena, e o sobrevoo vai direto à vista final.

## Consequências

- A página fica mais longa no topo (a abertura ocupa ~4 telas de rolagem); a barra de capítulos permite pular.
- Posições dos pontos da planta dependem do recorte da imagem `planta-54m2-referencia.webp`; se a imagem mudar, os pontos precisam ser revistos.
- Valores e condições continuam os da campanha já exibida (sujeitos à confirmação); nenhum dado comercial novo foi criado.
