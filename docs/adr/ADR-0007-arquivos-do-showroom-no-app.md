# ADR-0007 — Imagens e tour 3D servidos pelo próprio app nesta fase

- **Status:** aceita
- **Data:** 16/11/2026
- **Decisores:** time
- **Relacionados:** RN-02.5, P-06, P-09

## Contexto e problema

O Boa Vista precisa de imagens e da maquete 3D do protótipo. Ainda não há armazenamento de arquivos nem upload no admin.

## Decisão

As imagens do seed e a maquete (`maquete.html` + `bv3d/`) ficam em `app/public/showroom/boa-vista/` e são servidas pelo Caddy junto com o app. O admin informa endereços de imagem e do tour (caminho do app ou `https://`). O tour abre num iframe da mesma origem, só quando o cliente toca em "Abrir a maquete 3D".

## Consequências

- Boas: funciona sem infraestrutura nova; a maquete continua sendo a do protótipo.
- Ruins / riscos: cada novo empreendimento exige subir arquivos no repositório ou usar `https://` externo, até existir upload (P-06). A maquete usa three.js de CDN.
