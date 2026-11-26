# ADR-0029 — Fotos no bucket S3: foto do corretor e fotos dos veículos da proposta

- **Status:** aceita
- **Data:** 25/11/2026
- **Decisores:** responsável pelo produto (CLI)
- **Relacionados:** RN-01.11, RN-03.23, ADR-0007, ADR-0010, ADR-0014, P-06, P-21

## Contexto e problema

Pedido (CLI, 25/11/2026): "Na página tem a possibilidade de subir fotos de carros caso o cliente queira incluir na proposta, também quero incluir a possibilidade de incluir a foto do corretor para ser impresso na página de apresentação. Criei o bucket neo-files no railway para isso, faça a conexão".

Até aqui não havia armazenamento de arquivos (ADR-0007, P-06): o cartão "Seu consultor" mostrava as iniciais do corretor, e o botão "+ Anexar fotos" dos veículos estava desligado.

## Decisão

- **Armazenamento:** o Railway Bucket `neo-files` (S3, privado, sem acesso público). A API fala com ele pela biblioteca `minio-go` (escolha do usuário, 25/11/2026), versão compatível com Go 1.25. Credenciais pelas variáveis `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` e `S3_REGION`, que no Railway referenciam as do bucket. Sem elas, a API sobe e o envio de fotos responde "o envio de fotos ainda não está disponível".
- **Entrega ao navegador:** como o bucket é privado, a API lê e entrega a foto. O nome do arquivo é aleatório e muda a cada foto nova, então a foto do corretor vai com cache permanente.
- **Foto do corretor (RN-01.11):**
  - `PUT /api/me/photo` (multipart, campo `file`) troca a foto, e `DELETE /api/me/photo` volta às iniciais. A foto anterior sai do bucket.
  - `GET /api/public/media/brokers/:file` entrega só a foto atual de um corretor ativo.
  - O corretor e o showroom recebem `photo_path`. O app reduz a foto para 640 px antes de enviar.
- **Fotos dos veículos (RN-03.23):**
  - `POST /api/public/lead/photos` (cabeçalho `X-Visitor-Token`) recebe uma foto por vez, com no máximo 30 por cliente.
  - A proposta leva os ids em `condition.fotos`, no máximo 12. Ao gravar, a API liga à proposta só as fotos daquele cliente, incluindo as de um cadastro juntado a ele, que ainda não estão em outra proposta. Ids de outros clientes são descartados.
  - O corretor dono do cliente (`GET /api/me/leads/:id/photos/:photoID`) e o admin (`GET /api/admin/leads/:id/photos/:photoID`) veem as fotos ligadas às propostas.
  - Na apresentação, a ponte reduz a foto para 1600 px e aceita até 6 por proposta, com miniatura e botão de remover.
- **Arquivo:** só JPEG, PNG e WebP, conferidos pelo conteúdo, não pelo nome. Até 5 MB para a foto do corretor e 8 MB para a dos veículos.

## Consequências

- Boas:
  - o cartão do corretor mostra o rosto de quem atende;
  - o corretor vê o estado do carro antes de avaliar a permuta;
  - a mesma conexão serve para o upload do admin (P-06).
- Ruins / riscos:
  - fotos de veículo enviadas e não usadas em nenhuma proposta ficam no bucket;
  - não há prazo de guarda definido para as fotos dos clientes (P-21);
  - a API passa a ter tráfego de saída com as fotos.
