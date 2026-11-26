/*
 * Ponte entre a página de apresentação do empreendimento (HTML do protótipo, ADR-0008) e a API do Neo360.
 * A página é aberta pelo showroom em /e/:slug/:code, num iframe com ?slug=&code=&api=.
 *
 * O que a ponte faz, sem alterar o HTML da apresentação:
 *  - abre a visita do cliente e guarda o token (o mesmo do showroom padrão, RN-03.1 e RN-03.2);
 *  - troca o corretor de exemplo do protótipo pelo corretor do link;
 *  - registra seções vistas, cliques e tempo, só com o aceite de medição da própria página (RN-03.3);
 *  - grava a proposta que o cliente envia, com nome, WhatsApp e os números da condição (RN-03.4, RN-03.8);
 *  - leva a conversa para o WhatsApp do corretor: o chat da página saiu (ADR-0015, RN-03.5). Dúvidas, o
 *    botão "Fale com seu corretor" e o fechamento abrem o WhatsApp com o texto pronto.
 * Falhas de rede nunca aparecem para o cliente: a página segue funcionando como antes.
 */
(function () {
  "use strict";
  var Q = new URLSearchParams(location.search);
  var SLUG = Q.get("slug") || "";
  var CODE = Q.get("code") || "";
  var API = (Q.get("api") || "/api").replace(/\/$/, "");
  // Layout da apresentação que o cliente viu (ADR-0019): A é a página da entrega v11 (padrão), B a anterior (ADR-0022).
  var LAYOUT = Q.get("layout") === "b" ? "b" : "a";
  // Código do link de convite do cliente cadastrado pelo corretor (RN-03.16): a visita cai na ficha dele.
  var CONVITE = Q.get("convite") || "";
  var layoutSent = false;
  var CMS = Q.get("cms") === "1";
  if (!CMS && (!SLUG || !CODE)) return;

  var KEY = "neo360-visit:" + SLUG;
  var token = "";
  var broker = null;
  var hasContact = false;
  var $ = function (s) { return document.querySelector(s); };

  function storage(get, value) {
    try {
      if (get) return localStorage.getItem(KEY) || "";
      localStorage.setItem(KEY, value);
    } catch (e) { /* sem armazenamento: a visita vale só nesta aba */ }
    return "";
  }

  function call(method, path, body, keepalive) {
    var headers = { "Content-Type": "application/json" };
    if (token) headers["X-Visitor-Token"] = token;
    return fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, keepalive: !!keepalive })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.data && j.data.error); return j.data; }); });
  }

  // Página da entrega v11 (ADR-0021, ADR-0022): reconhecida pelo coletor de medição dela (metrics/collector.js),
  // que guarda o aceite e a visita em andamento no navegador. Vale qualquer que seja a letra do layout.
  var V11 = typeof window.BVMetrics === "object" && window.BVMetrics !== null;
  var B_METRICS = "neo360-bv-metrics-v1";
  var B_CHOICE = "neo360-bv-metrics-choice-v1";

  function consent() {
    try {
      if (V11) return localStorage.getItem(B_CHOICE) === "yes";
      return typeof REG_OK !== "undefined" && REG_OK === true;
    } catch (e) { return false; }
  }

  // Visita atual da medição do layout B: o coletor grava a visita em andamento por último.
  function bRow() {
    try {
      var rows = JSON.parse(localStorage.getItem(B_METRICS) || "[]");
      return Array.isArray(rows) && rows.length ? rows[rows.length - 1] : null;
    } catch (e) { return null; }
  }

  function track(kind, data, keepalive) {
    if (!token) return;
    call("POST", "/public/lead/events", { kind: kind, data: data || {} }, keepalive).catch(function () {});
  }

  function digits(s) { return String(s || "").replace(/\D/g, ""); }
  function waLink(text) {
    var d = digits(broker && broker.phone);
    if (d.length <= 11) d = "55" + d;
    return "https://wa.me/" + d + "?text=" + encodeURIComponent(text);
  }
  function firstName() { return broker ? broker.name.split(" ")[0] : ""; }

  /* ---------- página editável pelo admin (ADR-0027) ---------- */
  // O admin oculta seções, desliga blocos (como o 3D) e troca textos. A configuração vem com o empreendimento
  // e vale nos layouts A e B. Cada texto trocado é achado pelo texto original dentro da seção: se a página
  // mudar e o original sumir, a troca não se aplica. Tudo entra por textContent.
  var PAGE_OFF = "data-neo-off";
  // Blocos que dá para desligar sem tirar a seção inteira.
  var PAGE_BLOCKS = [
    { key: "3d.apartamento", label: "Planta 3D do apartamento", sel: ['[data-vis="apto3d"]', "#vapto"] },
    { key: "3d.condominio", label: "Condomínio em 3D (maquete)", sel: ['[data-vis="maq"]', "#vmaq"] },
    { key: "3d.sol", label: "Posição do sol no 3D", sel: ["#sol-ctl"] },
  ];
  // Nomes das seções no editor; sem nome aqui, vale o título da seção.
  var PAGE_NAMES = {
    chegada: "Chegada exclusiva (abertura com o nome do cliente)", topo: "Topo", apresentacao: "Abertura",
    "h-galeria": "Galeria de fotos", "h-planta": "Planta e 3D", "h-emp": "Torres, vagas e áreas", "h-sim": "Simulador de condições",
    "h-neg": "Proposta", "seu-consultor": "Cartão do corretor", "imobiliaria-parceira": "Imobiliária parceira",
    "incorporadora-responsavel": "Incorporadora", "crie-seu-perfil": "Convite para criar perfil", "h-quem": "Quem constrói",
    "h-ind": "Números da região", "h-vid": "Como usar esta página", "h-duv": "Dúvidas", "h-proj": "O projeto", "h-viva": "Ambientes do apartamento",
    "o-lugar": "O lugar", rodape: "Rodapé",
  };
  // Textos que a ponte preenche com o corretor do link: não são editáveis.
  var PAGE_DYNAMIC = "[data-consultor-nome],.tc-nome,.tc-esp,.mz-quem,.pf-cod,.cb-rod b,#neo-chegada";
  // Elementos que podem ser texto editável, e as marcas de formatação que um texto pode ter dentro. Elemento com
  // outra coisa dentro (imagem, campo, ícone) não é editável: trocar o texto apagaria o resto.
  var PAGE_TEXT = "h1,h2,h3,h4,h5,h6,p,li,figcaption,label,button,a,small,b,strong,em,span,dt,dd,td,th,blockquote,div";
  var PAGE_INLINE = { BR: 1, EM: 1, I: 1, B: 1, STRONG: 1, U: 1, SMALL: 1, SUP: 1, SUB: 1 };
  var pageOriginals = [];

  function pageSlug(s) {
    return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function norm(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  // Texto de um elemento como o cliente lê: <br> vira quebra de linha; espaços repetidos viram um.
  function textOfEl(el) {
    var out = "";
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) out += n.data;
      else if (n.nodeName === "BR") out += "\n";
      else if (n.nodeType === 1) out += textOfEl(n);
    });
    return out;
  }
  function normText(s) { return String(s || "").replace(/[^\S\n]+/g, " ").replace(/ *\n */g, "\n").trim(); }

  // Cartões que são seção própria mesmo dentro de outra: no layout B ficam dentro de "Dúvidas"; no A, soltos.
  var PAGE_CARDS = { "seu-consultor": 1, "imobiliaria-parceira": 1, "incorporadora-responsavel": 1 };
  function pageKey(el) {
    return el.matches("footer") ? "rodape" : el.matches("header") ? "topo" : el.getAttribute("aria-labelledby") || pageSlug(el.getAttribute("aria-label")) || el.id;
  }
  // Cartão aninhado dentro de section (exceto a própria section).
  function innerCard(el, section) {
    var inner = el.closest("section");
    while (inner && inner !== section && section.contains(inner)) {
      if (PAGE_CARDS[pageKey(inner)]) return inner;
      inner = inner.parentElement && inner.parentElement.closest("section");
    }
    return null;
  }

  // Seções da página: as de primeiro nível e os cartões, com uma chave estável (a mesma nos layouts A e B quando o
  // conteúdo é o mesmo).
  function pageSections() {
    var list = [];
    document.querySelectorAll("section,footer.foot,header.top").forEach(function (el) {
      if (el.closest("#neo-chegada")) return;
      var key = pageKey(el);
      if (el.parentElement && el.parentElement.closest("section") && !PAGE_CARDS[key]) return;
      if (!key || list.some(function (x) { return x.key === key; })) return;
      var h = el.querySelector("h1,h2,h3");
      list.push({ key: key, el: el, label: PAGE_NAMES[key] || norm(h && h.textContent) || el.getAttribute("aria-label") || key });
    });
    return list;
  }

  // Textos editáveis de uma seção: o elemento mais externo que só tem texto (e formatação) dentro. Os textos de
  // um cartão aninhado ficam com o cartão, para valerem nos dois layouts.
  function pageTexts(section) {
    var out = [];
    var picked = [];
    section.querySelectorAll(PAGE_TEXT).forEach(function (el) {
      if (el.closest(PAGE_DYNAMIC) || innerCard(el, section) || picked.some(function (p) { return p.contains(el); })) return;
      for (var i = 0; i < el.children.length; i++) if (!PAGE_INLINE[el.children[i].tagName]) return;
      var t = normText(textOfEl(el));
      if (!t) return;
      picked.push(el);
      out.push({ el: el, text: t });
    });
    return out;
  }

  function pageBlockEls(b) {
    var els = [];
    b.sel.forEach(function (sel) { document.querySelectorAll(sel).forEach(function (el) { els.push(el); }); });
    return els;
  }

  function pageStyle() {
    if (document.getElementById("neo-page-style")) return;
    var st = el("style", "", "[" + PAGE_OFF + "]{display:none!important}" +
      "[data-neo-cms] [data-neo-text]{cursor:pointer}[data-neo-cms] [data-neo-text]:hover{outline:2px dashed #2d5b48;outline-offset:3px}" +
      "[data-neo-cms] .neo-focus{outline:3px solid #d8b77c!important;outline-offset:4px;transition:outline-color .3s}" +
      // No editor, o aviso de medição da página cobriria a prévia.
      "[data-neo-cms] .med-aviso{display:none!important}");
    st.id = "neo-page-style";
    document.head.appendChild(st);
  }

  // Desfaz a configuração anterior (prévia ao vivo) e aplica a nova.
  function applyPage(cfg) {
    cfg = cfg || {};
    pageStyle();
    document.querySelectorAll("[" + PAGE_OFF + "]").forEach(function (e) { e.removeAttribute(PAGE_OFF); });
    pageOriginals.forEach(function (o) { o.el.replaceChildren.apply(o.el, o.nodes); });
    pageOriginals = [];
    var sections = pageSections();
    var hidden = cfg.sections || {};
    sections.forEach(function (s) { if (hidden[s.key] && hidden[s.key].hidden) s.el.setAttribute(PAGE_OFF, ""); });
    var blocks = cfg.blocks || {};
    PAGE_BLOCKS.forEach(function (b) { if (blocks[b.key] === false) pageBlockEls(b).forEach(function (e) { e.setAttribute(PAGE_OFF, ""); }); });
    (cfg.texts || []).forEach(function (t) {
      var s = sections.filter(function (x) { return x.key === t.section; })[0];
      if (!s) return;
      pageTexts(s.el).forEach(function (x) {
        if (x.text !== normText(t.from)) return;
        pageOriginals.push({ el: x.el, nodes: Array.prototype.slice.call(x.el.childNodes) });
        if (!normText(t.to)) { x.el.setAttribute(PAGE_OFF, ""); return; }
        var parts = String(t.to).split("\n");
        var nodes = [];
        parts.forEach(function (p, i) { if (i) nodes.push(document.createElement("br")); nodes.push(document.createTextNode(p)); });
        x.el.replaceChildren.apply(x.el, nodes);
      });
    });
  }

  // Editor do admin (?cms=1, dentro do iframe do painel): sem API nem visita. Conta ao painel as seções, os
  // textos e os blocos; aplica cada mudança na hora; clique num texto leva ao campo dele no painel.
  function cmsMode() {
    var parentOk = function (e) { return e.source === window.parent && e.origin === location.origin; };
    var post = function (msg) { msg.source = "neo-cms"; window.parent.postMessage(msg, location.origin); };
    document.documentElement.setAttribute("data-neo-cms", "");
    pageStyle();
    var outline = [{ key: "chegada", label: PAGE_NAMES.chegada, texts: [], blocks: [] }].concat(pageSections().map(function (s) {
      var seen = {};
      var texts = pageTexts(s.el).filter(function (x) {
        x.el.setAttribute("data-neo-text", "");
        x.el.setAttribute("data-neo-section", s.key);
        if (seen[x.text]) return false;
        seen[x.text] = true;
        return true;
      }).map(function (x) { return { text: x.text, tag: x.el.tagName.toLowerCase() }; });
      var blocks = PAGE_BLOCKS.filter(function (b) {
        return pageBlockEls(b).some(function (e) { return s.el.contains(e); });
      }).map(function (b) { return { key: b.key, label: b.label }; });
      return { key: s.key, label: s.label, texts: texts, blocks: blocks };
    }));
    window.addEventListener("message", function (e) {
      if (!parentOk(e) || !e.data || e.data.source !== "neo-cms") return;
      if (e.data.type === "config") applyPage(e.data.config);
      if (e.data.type === "focus") {
        var target = null;
        document.querySelectorAll("[data-neo-section]").forEach(function (x) {
          if (!target && x.getAttribute("data-neo-section") === e.data.section && (!e.data.from || x.getAttribute("data-neo-from") === normText(e.data.from))) target = x;
        });
        if (!target) {
          var sec = pageSections().filter(function (x) { return x.key === e.data.section; })[0];
          target = sec && sec.el;
        }
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("neo-focus");
        setTimeout(function () { target.classList.remove("neo-focus"); }, 1600);
      }
    });
    // Guarda o texto original de cada elemento editável, para achar o campo mesmo depois da troca.
    document.querySelectorAll("[data-neo-text]").forEach(function (x) { x.setAttribute("data-neo-from", normText(textOfEl(x))); });
    document.addEventListener("click", function (e) {
      var x = e.target && e.target.closest && e.target.closest("[data-neo-text]");
      if (!x) return;
      e.preventDefault();
      e.stopPropagation();
      post({ type: "select", section: x.getAttribute("data-neo-section"), from: x.getAttribute("data-neo-from") });
    }, true);
    post({ type: "outline", sections: outline });
  }

  /* ---------- chegada exclusiva (ADR-0026) ---------- */
  // Antes da apresentação, uma abertura só para o cliente, como o convite da entrega v12 (dashboard.html#convites):
  // "Um convite de Fernando para você", "Boa noite, Rodrigo." e o empreendimento. Aparece uma vez por sessão do
  // navegador; quem volta é recebido de novo. Tudo por textContent: nome e textos vêm de fora.
  var ARRIVAL_SESSION = "neo360-chegada:" + SLUG;
  var ARRIVAL_SEEN = "neo360-chegada-vista:" + SLUG;
  var arrival = null;

  function hello(date) {
    var h = (date || new Date()).getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  }
  function clientFirst(name) { return String(name || "").trim().split(/\s+/)[0] || ""; }
  function flag(store, key, value) {
    try {
      if (value === undefined) return window[store].getItem(key) === "1";
      window[store].setItem(key, "1");
    } catch (e) { /* sem armazenamento: a chegada aparece de novo */ }
    return false;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  var ARRIVAL_CSS =
    "#neo-chegada{position:fixed;inset:0;z-index:2147483000;overflow-y:auto;background:#e7ece7 url(img/folhas-geada.jpg) center/cover;color:#0d1510;" +
    "font:16px/1.6 Inter,system-ui,-apple-system,'Segoe UI',sans-serif;animation:neoIn .45s ease-out}" +
    "#neo-chegada::before{content:'';position:fixed;inset:0;background:rgba(244,241,234,.62);pointer-events:none}" +
    "#neo-chegada .nc-box{position:relative;max-width:620px;margin:0 auto;min-height:100%;display:flex;flex-direction:column}" +
    "#neo-chegada .nc-top{background:#97d5d0;padding:18px 22px;display:flex;align-items:center}" +
    "#neo-chegada .nc-top img{height:40px;width:auto}" +
    "#neo-chegada .nc-body{padding:34px 22px 28px;flex:1;display:flex;flex-direction:column;gap:14px}" +
    "#neo-chegada .nc-eyebrow{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#27322b;font-weight:600}" +
    "#neo-chegada h1{font:600 clamp(36px,9vw,52px)/1.08 Newsreader,Georgia,serif;margin:0;color:#183a2d;text-wrap:balance}" +
    "#neo-chegada .nc-back{font:italic 18px/1.4 Newsreader,Georgia,serif;color:#2d5b48;margin:0}" +
    "#neo-chegada .nc-text{font-size:17px;max-width:34em;margin:0}" +
    "#neo-chegada .nc-sign{font:italic 16px Newsreader,Georgia,serif;color:#2d5b48;margin:0}" +
    "#neo-chegada .nc-card{position:relative;margin-top:16px;border-radius:24px;overflow:hidden;min-height:340px;display:flex;flex-direction:column;justify-content:flex-end;" +
    "padding:26px 22px;color:#fff;background:#183a2d center/cover;box-shadow:0 18px 40px rgba(13,21,16,.25)}" +
    "#neo-chegada .nc-card::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,21,16,0) 25%,rgba(13,21,16,.78) 100%)}" +
    "#neo-chegada .nc-card>*{position:relative}" +
    "#neo-chegada .nc-dev{font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:600}" +
    "#neo-chegada h2{font:600 clamp(30px,7vw,42px)/1.1 Newsreader,Georgia,serif;margin:6px 0 18px;color:#fff}" +
    "#neo-chegada h2 em{font-style:normal;color:#d8b77c;display:block}" +
    "#neo-chegada .nc-go{appearance:none;border:0;border-radius:14px;background:#e2c27c;color:#183a2d;font:700 16px Inter,system-ui,sans-serif;padding:18px 22px;text-align:left;cursor:pointer}" +
    "#neo-chegada .nc-go:hover{background:#d8b77c}#neo-chegada .nc-go:focus-visible{outline:3px solid #fff;outline-offset:3px}" +
    "@keyframes neoIn{from{opacity:0}to{opacity:1}}@keyframes neoOut{to{opacity:0}}" +
    "@media (prefers-reduced-motion:reduce){#neo-chegada{animation:none}}";

  // Monta a chegada com o corretor e o empreendimento; o nome do cliente entra quando a visita responde.
  function showArrival(room) {
    var page = (room.development && room.development.page_config) || {};
    if (flag("sessionStorage", ARRIVAL_SESSION) || (page.sections && page.sections.chegada && page.sections.chegada.hidden)) return;
    var d = room.development || {};
    var style = el("style", "", ARRIVAL_CSS);
    var root = el("div");
    root.id = "neo-chegada";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "nc-hello");
    var box = el("div", "nc-box");
    var top = el("div", "nc-top");
    var logo = el("img");
    logo.src = "/neo360-logo-nova.png";
    logo.alt = "Neo360";
    top.appendChild(logo);
    var body = el("div", "nc-body");
    var h1 = el("h1", "", hello() + ".");
    h1.id = "nc-hello";
    var back = el("p", "nc-back", "Que bom te ver de novo.");
    back.hidden = !flag("localStorage", ARRIVAL_SEEN);
    var text = el("p", "nc-text", "Separei esta oportunidade no " + (d.name || "empreendimento") + " para você conhecer com calma. Veja o apartamento e simule uma proposta do seu jeito.");
    body.append(el("p", "nc-eyebrow", "Um convite de " + firstName() + " para você"), h1, back, text, el("p", "nc-sign", firstName() + " · seu corretor"));
    var card = el("div", "nc-card");
    if (d.cover_image_url) card.style.backgroundImage = "url(\"" + String(d.cover_image_url).replace(/["\\]/g, "") + "\")";
    var h2 = el("h2", "", "Seu próximo lugar");
    if (d.city) h2.appendChild(el("em", "", "em " + d.city + "."));
    var go = el("button", "nc-go", "Conhecer esta oportunidade →");
    go.type = "button";
    card.append(el("p", "nc-dev", d.name || ""), h2, go);
    body.appendChild(card);
    box.append(top, body);
    root.appendChild(box);
    var html = document.documentElement;
    var overflow = html.style.overflow;
    html.style.overflow = "hidden";
    function close() {
      flag("sessionStorage", ARRIVAL_SESSION, true);
      flag("localStorage", ARRIVAL_SEEN, true);
      document.removeEventListener("keydown", esc);
      html.style.overflow = overflow;
      root.remove();
      style.remove();
      arrival = null;
    }
    function esc(e) { if (e.key === "Escape") close(); }
    go.addEventListener("click", close);
    document.addEventListener("keydown", esc);
    document.head.appendChild(style);
    document.body.appendChild(root);
    // O foco começa na própria chegada (leitores de tela leem a saudação); Tab leva ao botão.
    root.tabIndex = -1;
    root.style.outline = "none";
    root.focus({ preventScroll: true });
    arrival = { h1: h1 };
  }

  // Com o nome do cliente: a saudação e o título da aba passam a ser dele.
  function greetClient(name) {
    var first = clientFirst(name);
    if (!first) return;
    if (arrival) arrival.h1.textContent = hello() + ", " + first + ".";
    document.title = (devName ? devName + " · " : "") + "preparado para " + first;
  }

  /* ---------- corretor do link no lugar do exemplo do protótipo ---------- */
  function fillBroker(room) {
    broker = room.broker;
    devName = room.development.name;
    var first = firstName();
    var tag = first + " · " + broker.code;

    var nome = $(".tc-nome");
    if (nome) nome.textContent = broker.name;
    // Abertura (ADR-0012): "Apresentado por" com o nome do corretor.
    document.querySelectorAll("[data-consultor-nome]").forEach(function (el) { el.textContent = broker.name; });
    document.querySelectorAll("[data-consultor-linha]").forEach(function (el) { el.hidden = false; });
    var esp = $(".tc-esp");
    if (esp) esp.textContent = broker.creci ? "Corretor de imóveis · CRECI " + broker.creci : "Corretor de imóveis";
    var foto = $(".tc-foto");
    if (foto) {
      var ini = broker.name.split(" ").filter(Boolean).slice(0, 2).map(function (p) { return p[0].toUpperCase(); }).join("");
      var av = document.createElement("span");
      av.setAttribute("aria-hidden", "true");
      av.textContent = ini;
      // !important: o CSS da apresentação muda a cor dos textos do cartão do consultor.
      [["display", "flex"], ["width", "100%"], ["height", "100%"], ["align-items", "center"], ["justify-content", "center"],
        ["background", "#c9a25e"], ["color", "#111511"], ["font", "800 56px \"Plus Jakarta Sans\",system-ui,sans-serif"],
        ["letter-spacing", ".04em"], ["border-radius", "inherit"]].forEach(function (p) { av.style.setProperty(p[0], p[1], "important"); });
      foto.replaceChildren(av);
      foto.setAttribute("aria-label", "Seu consultor, " + broker.name);
      // Foto que o corretor enviou no perfil (RN-01.11); sem ela, ou se não carregar, ficam as iniciais.
      if (broker.photo_path) {
        var img = document.createElement("img");
        img.alt = "";
        [["width", "100%"], ["height", "100%"], ["object-fit", "cover"], ["border-radius", "inherit"], ["display", "none"]]
          .forEach(function (p) { img.style.setProperty(p[0], p[1], "important"); });
        img.onload = function () {
          img.style.setProperty("display", "block", "important");
          av.remove();
        };
        img.src = API + broker.photo_path;
        foto.appendChild(img);
      }
    }
    var quem = $(".mz-quem");
    if (quem) quem.textContent = tag;
    var cod = $(".pf-cod");
    if (cod) cod.textContent = "Veio pelo consultor " + tag;
    var rod = $(".cb-rod b");
    if (rod) rod.textContent = tag;

    // Imobiliária do corretor (pré-cadastrada, ADR-0010): o logo dela entra no cartão da apresentação,
    // junto ao da incorporadora. Corretor autônomo não tem esse cartão.
    var agency = document.querySelector('section.inc-card[aria-label="Imobiliária parceira"]');
    if (agency) {
      var logo = agency.querySelector(".ic-logo");
      if (!broker.agency_name) {
        agency.hidden = true;
      } else if (logo) {
        var mark;
        if (broker.agency_logo_url) {
          mark = document.createElement("img");
          mark.className = "ic-img";
          mark.src = broker.agency_logo_url;
          mark.alt = "Imobiliária " + broker.agency_name;
        } else {
          mark = document.createElement("b");
          mark.textContent = broker.agency_name;
        }
        var label = document.createElement("small");
        label.textContent = "Imobiliária parceira";
        logo.replaceChildren(mark, label);
      }
    }
    try { parent.document.title = room.development.name + " · " + broker.name; } catch (e) {}

    addWhatsApp();
  }

  function formatPhone(d) {
    d = digits(d);
    if (d.length > 11 && d.indexOf("55") === 0) d = d.slice(2);
    if (d.length === 11) return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
    if (d.length === 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return d;
  }

  /*
   * Dados já enviados (RN-03.10): mostra o resumo "Usaremos o seu perfil" com "Trocar meus dados", no padrão
   * que a apresentação já usa para o perfil (chave bc-perfil). Trocar continua possível, mas vira uma ação
   * consciente; a API guarda os dados anteriores e avisa o corretor.
   */
  function showSaved(name, phone) {
    if (!name || digits(phone).length < 10) return;
    var zap = formatPhone(phone);
    try {
      var p = JSON.parse(localStorage.getItem("bc-perfil") || "null") || {};
      p.nome = name;
      p.zap = zap;
      localStorage.setItem("bc-perfil", JSON.stringify(p));
    } catch (e) {}
    // Os campos de nome e WhatsApp ficam à vista e preenchidos (ADR-0016): o cliente confere antes de enviar.
    var nome = $("#p-nome");
    var z = $("#p-zap");
    if (nome) nome.value = name;
    if (z) z.value = zap;
  }

  function prefill(v) {
    hasContact = !!(v.name && digits(v.phone).length >= 10);
    [["#p-nome", v.name], ["#pf-nome", v.name], ["#p-zap", v.phone], ["#pf-zap", v.phone]].forEach(function (p) {
      var el = $(p[0]);
      if (el && p[1] && !el.value) el.value = p[1];
    });
    showSaved(v.name, v.phone);
  }

  /* ---------- medição: só com o aceite da própria página ---------- */
  var origAcao = window.regAcao;
  if (!V11 && typeof origAcao === "function") {
    window.regAcao = function (chave) {
      origAcao(chave);
      if (!consent()) return;
      // Com o aceite de medição, registra uma vez qual layout o cliente viu (comparação A/B).
      if (!layoutSent && token) {
        layoutSent = true;
        track("acao", { chave: "layout_" + LAYOUT });
      }
      track("acao", { chave: chave });
    };
  }

  var seen = {};
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.getAttribute("aria-labelledby") || e.target.id || e.target.getAttribute("aria-label");
        if (!id || seen[id] || !consent() || !token) return;
        seen[id] = true;
        track("secao", { id: id });
      });
    }, { threshold: 0.4 });
    document.querySelectorAll("section").forEach(function (s) { io.observe(s); });
  }

  var lastTime = "";
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "hidden" || !consent()) return;
    try {
      var row = V11 ? bRow() : null;
      var secoes = V11 ? row && row.sections : REG.secoes;
      var rolagem = V11 ? row && row.scroll : REG.rolagem;
      if (!secoes) return;
      var t = JSON.stringify(secoes);
      if (t === lastTime || t === "{}") return;
      lastTime = t;
      track("tempo", { secoes: secoes, rolagem: rolagem }, true);
    } catch (e) {}
  });

  // Página v11: o coletor registra as ações sem passar por regAcao; a ponte manda as novas.
  if (V11) {
    var sentActions = {};
    setInterval(function () {
      if (!consent() || !token) return;
      if (!layoutSent) {
        layoutSent = true;
        track("acao", { chave: "layout_" + LAYOUT });
      }
      var row = bRow();
      Object.keys((row && row.actions) || {}).forEach(function (k) {
        if (sentActions[k]) return;
        sentActions[k] = true;
        track("acao", { chave: k });
      });
    }, 3000);
  }

  /* ---------- proposta e perfil: o cliente pediu retorno, então vão com nome e WhatsApp ---------- */
  function contact(name, phone) {
    if (!name || digits(phone).length < 10) return Promise.resolve();
    return call("PUT", "/public/lead/contact", { name: name, phone: phone })
      .then(function (v) {
        hasContact = true;
        showSaved(v.name, v.phone);
      })
      .catch(function () {});
  }

  // Condição da proposta em números (ADR-0014), lida do simulador da apresentação no momento do envio.
  // calc, CAMPANHA, veic, VEICS e nVeic são do script da apresentação; se não existirem, vai só o texto.
  function condicao() {
    try {
      /* global calc, CAMPANHA, veic, VEICS, nVeic */
      var c = calc();
      var entN = parseInt(($("#p-entn") || {}).value, 10) || 1;
      var r = function (v) { return Math.round((Number(v) || 0) * 100) / 100; };
      var cut = function (v, n) { return String(v || "").trim().slice(0, n); };
      return {
        preco: r(CAMPANHA.promo),
        preco_referencia: r(CAMPANHA.ref),
        campanha: cut(CAMPANHA.tipo, 60),
        validade: cut(CAMPANHA.validade, 20),
        entrada: r(c.ent),
        entrada_parcelas: window.ENTRADA_PARCELADA ? entN : 1,
        parcelas: c.par || 0,
        parcela_valor: c.saldo > 0 && c.par ? r(c.saldo / c.par) : 0,
        saldo: r(c.saldo),
        reforcos: c.refN,
        reforco_valor: r(c.refV),
        chaves: r(c.chaves),
        veiculos: !veic
          ? []
          : VEICS.slice(0, Math.min(3, nVeic())).map(function (v) {
              return { modelo: cut(v.mod, 40), ano: cut(v.ano, 4), km: cut(v.km, 9), valor: r(v.valor) };
            }),
        sujeita_aprovacao: c.ent < CAMPANHA.entMin || c.saldo < 0,
        // Fotos dos veículos já enviadas ao bucket (RN-03.23); a API liga à proposta só as deste cliente.
        fotos: veic ? vehiclePhotos.map(function (f) { return f.id; }) : [],
      };
    } catch (e) {
      return null;
    }
  }

  /*
   * Proposta (RN-03.8, ADR-0015): vai para o CRM com nome, WhatsApp e os números; a negociação segue pelo
   * WhatsApp. Reenviar a mesma condição com a mesma intenção não duplica; pedir o contrato depois de enviar
   * grava uma nova, marcada com o pedido.
   */
  var lastSent = "";
  var lastSummary = "";
  var origProposta = window.regGravaProposta;
  window.regGravaProposta = function (dados) {
    if (typeof origProposta === "function") { try { origProposta(dados); } catch (e) {} }
    var body = {
      name: String(dados.nome || "").trim(),
      phone: String(dados.whatsapp || ""),
      summary: String(dados.resumo || "").slice(0, 900),
      note: String(dados.observacao || "").slice(0, 400),
      wants_contract: !!dados.autorizou_contrato,
      condition: condicao() || {},
    };
    lastSummary = body.summary;
    var sig = JSON.stringify([body.summary, body.note, body.wants_contract, body.condition]);
    if (!token) return Promise.resolve(false);
    if (sig === lastSent) return Promise.resolve(true);
    return call("POST", "/public/lead/proposals", body)
      .then(function () {
        lastSent = sig;
        hasContact = true;
        showSaved(body.name, digits(body.phone));
        offerWhatsApp($("#nz-ok") ? "#nz-ok" : dados.autorizou_contrato ? "#p-aviso" : "#p-aviso-env");
        return true;
      })
      .catch(function () { return false; });
  };

  // Depois do envio, o próximo passo é o WhatsApp do corretor, com a proposta resumida na mensagem.
  function proposalText() {
    return "Olá, " + firstName() + "! Enviei uma proposta pelo seu link do " + devName + (lastSummary ? ": " + lastSummary : ".") +
      " Podemos conversar?";
  }
  function offerWhatsApp(after) {
    var ref = $(after);
    if (!ref || !broker) return;
    var old = document.getElementById("nz-wa-" + after.slice(1));
    if (old) old.remove();
    var a = document.createElement("a");
    a.id = "nz-wa-" + after.slice(1);
    a.href = waLink(proposalText());
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = "Continuar no WhatsApp com " + firstName();
    a.style.cssText = "display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;padding:13px 16px;border-radius:999px;" +
      "background:#25D366;color:#fff;font:600 15px Inter,system-ui,sans-serif;text-decoration:none";
    a.addEventListener("click", function () { track("whatsapp", { origem: "proposta" }); });
    ref.insertAdjacentElement("afterend", a);
  }

  /* ---------- fotos dos veículos (RN-03.23, ADR-0029) ---------- */
  // O cliente anexa até 6 fotos; cada uma vai reduzida para a API assim que escolhida e só chega ao corretor
  // junto com a proposta. Sem a API (falha de rede), a foto não entra e o aviso diz isso.
  var PHOTO_MAX = 6;
  var vehiclePhotos = [];
  var PHOTO_CSS =
    ".neo-fotos{display:flex;flex-wrap:wrap;gap:8px}.neo-fotos figure{position:relative;width:76px;height:76px;margin:0;" +
    "border-radius:10px;overflow:hidden;background:#efe9da;border:1px solid #e2dccd}.neo-fotos img{width:100%;height:100%;" +
    "object-fit:cover;display:block}.neo-fotos figure.enviando img{opacity:.45}.neo-fotos button{all:unset;position:absolute;" +
    "top:3px;right:3px;width:22px;height:22px;border-radius:50%;background:rgba(13,21,16,.75);color:#fff;font:700 14px/22px " +
    "system-ui;text-align:center;cursor:pointer}.neo-fotos button:focus-visible{outline:2px solid #b38d3e}";

  // Reduz a foto (lado maior até 1600 px, JPEG) para o envio ser rápido no celular; se o navegador não
  // conseguir ler o arquivo, vai o original e a API confere.
  function shrink(file) {
    if (typeof createImageBitmap !== "function") return Promise.resolve(file);
    return createImageBitmap(file).then(function (bmp) {
      var k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      var c = document.createElement("canvas");
      c.width = Math.round(bmp.width * k);
      c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (ok) { c.toBlob(function (b) { ok(b || file); }, "image/jpeg", 0.85); });
    }).catch(function () { return file; });
  }

  function setupVehiclePhotos() {
    var btn = $("#p-fotos");
    if (!btn) return;
    var st = el("style", "", PHOTO_CSS);
    document.head.appendChild(st);
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/*";
    input.multiple = true;
    input.hidden = true;
    var list = el("div", "neo-fotos");
    list.setAttribute("aria-label", "Fotos anexadas");
    var msg = el("p", "nnota");
    msg.setAttribute("role", "status");
    msg.hidden = true;
    btn.insertAdjacentElement("afterend", msg);
    btn.insertAdjacentElement("afterend", list);
    btn.insertAdjacentElement("afterend", input);
    var say = function (t) { msg.hidden = !t; msg.textContent = t || ""; };
    var refresh = function () {
      btn.hidden = vehiclePhotos.length + list.querySelectorAll(".enviando").length >= PHOTO_MAX;
    };

    btn.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () {
      var files = Array.prototype.slice.call(input.files || []);
      input.value = "";
      var room = PHOTO_MAX - vehiclePhotos.length - list.querySelectorAll(".enviando").length;
      say(files.length > room ? "Até " + PHOTO_MAX + " fotos por proposta." : "");
      files.slice(0, Math.max(0, room)).forEach(function (file) {
        var fig = el("figure", "enviando");
        var img = document.createElement("img");
        img.alt = "Foto do veículo";
        img.src = URL.createObjectURL(file);
        fig.appendChild(img);
        list.appendChild(fig);
        refresh();
        shrink(file).then(function (blob) {
          if (!token) throw new Error();
          var form = new FormData();
          form.append("file", blob, "veiculo.jpg");
          return fetch(API + "/public/lead/photos", { method: "POST", headers: { "X-Visitor-Token": token }, body: form })
            .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.data && j.data.error); return j.data; }); });
        }).then(function (photo) {
          var item = { id: photo.id, fig: fig };
          vehiclePhotos.push(item);
          fig.className = "";
          var rm = el("button", "", "×");
          rm.type = "button";
          rm.setAttribute("aria-label", "Remover foto");
          rm.addEventListener("click", function () {
            vehiclePhotos = vehiclePhotos.filter(function (f) { return f !== item; });
            URL.revokeObjectURL(img.src);
            fig.remove();
            say("");
            refresh();
          });
          fig.appendChild(rm);
          track("acao", { chave: "anexou_foto_veiculo" });
          refresh();
        }).catch(function (e) {
          URL.revokeObjectURL(img.src);
          fig.remove();
          say((e && e.message) ? "Não foi possível anexar a foto: " + e.message + "." : "Não foi possível anexar a foto. Tente de novo.");
          refresh();
        });
      });
    });
  }

  var pf = $("#pf-form");
  if (pf) {
    pf.addEventListener("submit", function () {
      var v = function (id) { var el = $(id); return el ? el.value.trim() : ""; };
      track("perfil", { tipo: v("#pf-tipo"), regiao: v("#pf-reg"), prazo: v("#pf-prazo"), faixa: v("#pf-faixa") });
      contact(v("#pf-nome"), v("#pf-zap"));
    });
  }

  /* ---------- conversa pelo WhatsApp (o chat da página saiu, ADR-0015) ---------- */
  function openWhatsApp(text, origem) {
    if (!broker) return;
    track("whatsapp", origem ? { origem: origem } : {});
    window.open(waLink(text || whatsappText()), "_blank", "noopener");
  }

  // Perguntas prontas e "tirar uma dúvida" vão prontas para o WhatsApp.
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-abre-chat],[data-duvida]");
    if (!t) return;
    e.preventDefault();
    var q = t.getAttribute("data-duvida");
    openWhatsApp(q ? "Olá, " + firstName() + "! Sobre o " + devName + ": " + q : "", q ? "duvida" : "botao");
  });

  // "Prefiro conversar com o corretor" no fechamento: WhatsApp com a proposta.
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#p-conversa")) openWhatsApp(proposalText(), "fechamento");
  }, true);

  // A bolha "Fale com seu corretor" vira o atalho do WhatsApp. Arrastar continua movendo a bolha.
  var bubble = $("#mz-abre");
  var panel = $("#mz-painel");
  if (panel) panel.remove();
  if (bubble) {
    var dica = $("#bc-dica");
    if (dica) dica.innerHTML = "<b>Fale com seu corretor</b><small>pelo WhatsApp</small>";
    bubble.setAttribute("aria-label", "Falar com o seu corretor pelo WhatsApp");
    bubble.removeAttribute("aria-controls");
    var down = null;
    bubble.addEventListener("pointerdown", function (e) { down = [e.clientX, e.clientY]; }, true);
    bubble.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var moved = down && e.clientX && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 8;
      down = null;
      // Clique feito pelo script da página (ex.: "Prefiro conversar com o corretor"), não pelo cliente:
      // o WhatsApp já foi aberto por quem chamou.
      if (!moved && e.isTrusted) openWhatsApp("", "bolha");
    }, true);
  }

  var devName = "empreendimento";
  function whatsappText() {
    return "Olá, " + firstName() + "! Vi o " + devName + " pelo seu link e quero saber mais.";
  }

  function addWhatsApp() {
    // Botões de WhatsApp da página (cartão do consultor e seção de dúvidas, ADR-0011).
    document.querySelectorAll("[data-zap]").forEach(function (a) {
      a.href = waLink(whatsappText());
      a.target = "_blank";
      a.rel = "noreferrer";
      a.addEventListener("click", function () { track("whatsapp", { origem: "botao" }); });
    });
  }

  /* ---------- página v11 (ADR-0021, ADR-0022): textos e envio ---------- */
  function adaptV11() {
    // A página foi escrita como protótipo sem envio. Com a ponte, proposta e medição chegam ao
    // corretor; o rodapé passa a dizer isso (RN-03.3, RN-03.8). O perfil e o chat estão fora da página (ADR-0022).
    var first = firstName();
    var texts = [
      ["footer.foot p", "Informações fornecidas pela incorporadora. Valores, condições e imagens ilustrativas, sujeitos a confirmação. A proposta vai para o seu corretor quando você a envia; a medição da navegação, só com o seu aceite."],
    ];
    texts.forEach(function (t) { var el = $(t[0]); if (el) el.textContent = t[1]; });

    // Aviso de medição do coletor: aparece ao abrir a página, enquanto o cliente não aceitou nem recusou.
    var consentText = "Registrar sua navegação nesta apresentação? Guardamos ações, rolagem e tempo por seção, sem texto digitado, e mandamos para " + first + " saber o que mais interessou a você.";
    function fixConsent() { var p = $(".med-aviso p"); if (p && p.textContent !== consentText) p.textContent = consentText; }
    fixConsent();
    new MutationObserver(fixConsent).observe(document.body, { childList: true });
  }

  /* ---------- início ---------- */
  if (CMS) {
    cmsMode();
    return;
  }
  call("GET", "/public/showroom/" + encodeURIComponent(SLUG) + "/" + encodeURIComponent(CODE))
    .then(function (room) {
      fillBroker(room);
      setupVehiclePhotos();
      if (V11) adaptV11();
      applyPage(room.development && room.development.page_config);
      showArrival(room);
      token = storage(true);
      return call("POST", "/public/showroom/" + encodeURIComponent(SLUG) + "/" + encodeURIComponent(CODE) + "/visit?layout=" + LAYOUT + (CONVITE ? "&convite=" + encodeURIComponent(CONVITE) : ""));
    })
    .then(function (v) {
      token = v.token;
      storage(false, token);
      prefill(v);
      greetClient(v.name);
    })
    .catch(function () {});
})();
