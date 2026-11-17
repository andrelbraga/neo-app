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
  // Layout da apresentação que o cliente viu (ADR-0019): A é o padrão, B é a versão em estilo metrô.
  var LAYOUT = Q.get("layout") === "b" ? "b" : "a";
  var layoutSent = false;
  if (!SLUG || !CODE) return;

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

  function consent() {
    try { return typeof REG_OK !== "undefined" && REG_OK === true; } catch (e) { return false; }
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
    var dash = $(".dash-go");
    if (dash) dash.hidden = true;
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
  if (typeof origAcao === "function") {
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
      var t = JSON.stringify(REG.secoes);
      if (t === lastTime || t === "{}") return;
      lastTime = t;
      track("tempo", { secoes: REG.secoes, rolagem: REG.rolagem }, true);
    } catch (e) {}
  });

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
        veiculos: veic
          ? VEICS.slice(0, Math.min(3, nVeic())).map(function (v) {
              return { modelo: cut(v.mod, 40), ano: cut(v.ano, 4), km: cut(v.km, 9), valor: r(v.valor) };
            })
          : [],
        sujeita_aprovacao: c.ent < CAMPANHA.entMin || c.saldo < 0,
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
    if (!token || sig === lastSent) return Promise.resolve();
    return call("POST", "/public/lead/proposals", body)
      .then(function () {
        lastSent = sig;
        hasContact = true;
        showSaved(body.name, digits(body.phone));
        offerWhatsApp($("#nz-ok") ? "#nz-ok" : dados.autorizou_contrato ? "#p-aviso" : "#p-aviso-env");
      })
      .catch(function () {});
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
      if (!moved) openWhatsApp("", "bolha");
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

  /* ---------- início ---------- */
  call("GET", "/public/showroom/" + encodeURIComponent(SLUG) + "/" + encodeURIComponent(CODE))
    .then(function (room) {
      fillBroker(room);
      token = storage(true);
      return call("POST", "/public/showroom/" + encodeURIComponent(SLUG) + "/" + encodeURIComponent(CODE) + "/visit?layout=" + LAYOUT);
    })
    .then(function (v) {
      token = v.token;
      storage(false, token);
      prefill(v);
    })
    .catch(function () {});
})();
