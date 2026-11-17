# RN-02 — Link exclusivo e showroom

| ID | Regra | Status | Onde é aplicada | Pendências |
|---|---|---|---|---|
| RN-02.1 | O link exclusivo é `/e/<endereço do empreendimento>/<código do corretor>`. O código (três letras do nome e quatro dígitos, como `FAB-0427` do protótipo) é gerado no cadastro e não muda | implementada (16/11/2026, usuário: "gerar um link exclusivo dele para repassar para seus clientes via whatsapp"; formato do código: `prototipo/boa-vista-104a/cadastros.html`) | `broker.NewCode`, `app/.../development.service.ts` (`brokerLink`) | — |
| RN-02.2 | O showroom só abre com empreendimento publicado e corretor ativo; senão, "link não disponível" | implementada (16/11/2026; decisão técnica) | `lead/service/public_service.go` (`Showroom`) | — |
| RN-02.3 | Só empreendimento publicado aparece para o corretor ofertar | implementada (16/11/2026) | `development_repository.go` (`List(onlyPublished)`) | — |
| RN-02.4 | O corretor compartilha o link pelo WhatsApp dele, com mensagem pronta, ou copia o link | implementada (16/11/2026, usuário: "via whatsapp mesmo") | `app/.../BrokerHomePage.tsx` | — |
| RN-02.5 | O Boa Vista Residencial vem pré-carregado com os textos, fotos e tour 3D do protótipo. Preço e condições comerciais ficam fora até confirmação | implementada (16/11/2026, usuário: "este sistema por hora já terá um empreendimento pré-carregado que é o mesmo que está nestas páginas") | `api/sql/migrations/V2_seed_boa_vista.up.sql` | P-03, P-07 |
