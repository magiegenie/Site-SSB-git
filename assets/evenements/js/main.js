/* =========================================================================
   NOS ÉVÉNEMENTS — motion design (Motion + Lenis + rAF vanilla)
   Trois signatures : jauges d'inscription qui se remplissent au scroll,
   filtres d'agenda interactifs, galerie courbe qu'on fait glisser (souris,
   tactile, molette, flèches, boucle infinie). La galerie tourne sur une
   boucle rAF maison (indépendante de Motion) : c'est un calcul de position,
   pas une animation de propriété.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lerp = function (a, b, t) { return (1 - t) * a + b * t; };

  initTheme();
  initDates();
  initFilters();
  var stopGallery = initGallery3d();

  if (!M || typeof M.animate !== "function") {
    root.classList.remove("motion-ready");
    initAnchors(null);
    initGauges(false);
    return;
  }

  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  }

  initAnchors(lenis);
  initGauges(true);

  if (!reduced) {
    var media = document.querySelector("[data-kenburns] img");
    if (media) {
      M.animate(media, { transform: ["scale(1.08)", "scale(1)"] }, { duration: 9, ease: [0.16, 1, 0.3, 1] });
    }
  }

  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  /* ------------------------- Jauges d'inscription ------------------------ */
  function initGauges(animated) {
    var gauges = document.querySelectorAll("[data-fill]");
    if (!gauges.length) return;
    gauges.forEach(function (g) {
      var fill = g.querySelector(".gauge-fill");
      var pct = g.dataset.fill + "%";
      if (!animated || reduced) { fill.style.width = pct; return; }
      M.inView(g, function () {
        requestAnimationFrame(function () { fill.style.width = pct; });
      }, { margin: "0px 0px -20% 0px" });
    });
  }

  function initTheme() {
    var body = document.body;
    var sections = Array.prototype.slice.call(document.querySelectorAll("[data-bg]"));
    if (!sections.length) return;
    var ticking = false;

    function bgAt(line) {
      var current = sections[0].dataset.bg;
      for (var i = 0; i < sections.length; i++) {
        var r = sections[i].getBoundingClientRect();
        if (r.top <= line && r.bottom > line) current = sections[i].dataset.bg;
      }
      return current;
    }
    var navEl = document.querySelector(".floatnav");
    var lastY = window.scrollY;
    function apply() {
      ticking = false;
      var h = window.innerHeight;
      var top = bgAt(h * 0.12);
      var bottom = bgAt(h - 52);
      if (body.dataset.theme !== top) body.dataset.theme = top;
      if (body.dataset.navtheme !== bottom) body.dataset.navtheme = bottom;
      if (navEl) {
        var y = window.scrollY;
        if (y < h * 0.6) navEl.classList.remove("is-hidden");
        else if (y > lastY + 4) navEl.classList.add("is-hidden");
        else if (y < lastY - 4) navEl.classList.remove("is-hidden");
        lastY = y;
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();
  }

  function initAnchors(lenisInstance) {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        var top = t.getBoundingClientRect().top + window.pageYOffset - 70;
        if (lenisInstance) lenisInstance.scrollTo(top, { duration: 1.1 });
        else window.scrollTo({ top: top, behavior: "smooth" });
      });
    });
  }

  /* ----------------------- Auto-péremption des dates ---------------------- */
  /* Chaque .ev-row porte sa date en data-date. Au chargement, les événements
     échus sont reclassés dans « Passés » (classe, data-filter, position DOM,
     libellé de jauge) et la carte « Prochain rendez-vous » du hero est mise à
     jour avec le premier événement réellement à venir. Le HTML reste corrigé
     à la main comme source de vérité sans JS ; ceci est un filet contre la
     péremption entre deux mises à jour. Debug : ?today=2026-11-01. */
  function initDates() {
    var list = document.querySelector("[data-events]");
    if (!list) return;
    var rows = Array.prototype.slice.call(list.querySelectorAll(".ev-row[data-date]"));
    if (!rows.length) return;

    var override = null;
    try { override = new URLSearchParams(window.location.search).get("today"); } catch (e) {}
    var today = override ? new Date(override + "T00:00:00") : new Date();
    if (isNaN(today)) today = new Date();
    today.setHours(0, 0, 0, 0);

    var months = Array.prototype.slice.call(list.querySelectorAll(".ev-month"));
    var pastHead = null, upcomingHead = null;
    months.forEach(function (m) {
      if (/pass/i.test(m.textContent)) pastHead = m;
      else upcomingHead = m;
    });

    var upcoming = [];
    rows.forEach(function (row) {
      var d = new Date(row.dataset.date + "T00:00:00");
      if (isNaN(d)) return;
      if (d < today) {
        if (!row.classList.contains("ev-row--past")) {
          row.classList.add("ev-row--past");
          row.dataset.filter = (row.dataset.filter || "").replace(/\bupcoming\b/, "past");
          var cap = row.querySelector(".gauge-cap");
          if (cap) cap.textContent = cap.textContent.replace("inscrits", "participants");
        }
      } else {
        upcoming.push({ row: row, date: d });
      }
    });

    /* Regroupe et trie les passés (du plus récent au plus ancien), y compris
       les fraîchement reclassés. Insertion en tête après le titre « Passés » :
       on itère du plus ancien au plus récent pour finir avec l'ordre voulu. */
    if (pastHead) {
      var past = rows.filter(function (r) { return r.classList.contains("ev-row--past"); });
      past.sort(function (a, b) { return a.dataset.date < b.dataset.date ? -1 : 1; });
      past.forEach(function (r) { pastHead.parentNode.insertBefore(r, pastHead.nextElementSibling); });
    }
    if (upcomingHead && !upcoming.length) upcomingHead.style.display = "none";

    var card = document.querySelector("[data-next-card]");
    if (card) {
      var titleEl = card.querySelector(".next-card-title");
      var metaEl = card.querySelector(".next-card-meta");
      if (upcoming.length) {
        upcoming.sort(function (a, b) { return a.date - b.date; });
        var next = upcoming[0];
        var h4 = next.row.querySelector("h4");
        var place = next.row.querySelector(".ev-meta span");
        var when = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(next.date);
        if (titleEl && h4) titleEl.textContent = h4.textContent;
        if (metaEl) metaEl.textContent = when + (place ? " · " + place.textContent : "");
      } else {
        if (titleEl) titleEl.textContent = "Saison en préparation";
        if (metaEl) metaEl.textContent = "Le prochain rendez-vous sera annoncé ici.";
      }
    }
  }

  /* ----------------------------- Filtres agenda --------------------------- */
  function initFilters() {
    var wrap = document.querySelector("[data-filters]");
    var list = document.querySelector("[data-events]");
    if (!wrap || !list) return;
    var buttons = Array.prototype.slice.call(wrap.querySelectorAll("button"));
    var rows = Array.prototype.slice.call(list.querySelectorAll(".ev-row"));
    var months = Array.prototype.slice.call(list.querySelectorAll(".ev-month"));

    function apply(filter) {
      rows.forEach(function (row) {
        var tags = (row.dataset.filter || "").split(" ");
        var match = filter === "all" || tags.indexOf(filter) > -1;
        row.style.display = match ? "" : "none";
      });
      months.forEach(function (m) {
        var sib = m.nextElementSibling, any = false;
        while (sib && !sib.classList.contains("ev-month")) {
          if (sib.classList.contains("ev-row") && sib.style.display !== "none") any = true;
          sib = sib.nextElementSibling;
        }
        m.style.display = any ? "" : "none";
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        buttons.forEach(function (x) {
          x.classList.toggle("is-active", x === b);
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        apply(b.dataset.filter || "all");
      });
    });
  }

  /* ------------------------- Galerie 3D courbe (rAF) ---------------------- */
  function initGallery3d() {
    var wrap = document.querySelector("[data-gallery3d]");
    if (!wrap) return null;
    var track = wrap.querySelector(".gallery3d-track");
    var cards = Array.prototype.slice.call(track.children);
    var N = cards.length;
    if (!N) return null;
    var section = wrap.closest("section") || document;
    var prevBtn = section.querySelector("[data-g3d-prev]");
    var nextBtn = section.querySelector("[data-g3d-next]");

    var W = wrap.clientWidth, step = 320, current = 0, target = 0;
    function measure() {
      W = wrap.clientWidth || 1;
      var cw = cards[0].offsetWidth || 300;
      step = cw + Math.min(90, W * 0.06);
    }
    measure();
    window.addEventListener("resize", measure);
    function total() { return step * N; }
    function wrapX(x) { var t = total(); x = ((x % t) + t) % t; if (x > t / 2) x -= t; return x; }
    function nearest() { return Math.round(target / step) * step; }

    var snapT;
    function snapSoon() { clearTimeout(snapT); snapT = setTimeout(function () { target = nearest(); }, 130); }

    wrap.addEventListener("wheel", function (e) {
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      target += d * 0.6; snapSoon();
    }, { passive: false });

    var dragging = false, startX = 0, startTarget = 0;
    function down(x) { dragging = true; startX = x; startTarget = target; wrap.classList.add("is-grab"); }
    function move(x) { if (dragging) target = startTarget - (x - startX); }
    function up() { if (!dragging) return; dragging = false; wrap.classList.remove("is-grab"); target = nearest(); }
    wrap.addEventListener("mousedown", function (e) { e.preventDefault(); down(e.clientX); });
    window.addEventListener("mousemove", function (e) { move(e.clientX); });
    window.addEventListener("mouseup", up);
    wrap.addEventListener("touchstart", function (e) { down(e.touches[0].clientX); }, { passive: true });
    wrap.addEventListener("touchmove", function (e) { if (dragging) move(e.touches[0].clientX); }, { passive: true });
    wrap.addEventListener("touchend", up);

    if (nextBtn) nextBtn.addEventListener("click", function () { target = nearest() + step; });
    if (prevBtn) prevBtn.addEventListener("click", function () { target = nearest() - step; });
    wrap.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); target += step; }
      else if (e.key === "ArrowLeft") { e.preventDefault(); target -= step; }
    });

    var activeIdx = -1, raf = null;
    function tick() {
      current = reduced ? target : lerp(current, target, 0.09);
      var H = Math.max(W / 2, 1);
      var B = Math.max(60, W * 0.18);
      var R = (H * H + B * B) / (2 * B);
      var best = Infinity, bestI = 0;
      cards.forEach(function (card, i) {
        var x = wrapX(i * step - current);
        var ax = Math.min(Math.abs(x), H);
        var arc = R - Math.sqrt(Math.max(0, R * R - ax * ax));
        var rot = Math.sign(x) * Math.asin(Math.min(1, ax / R)) * (180 / Math.PI) * 0.55;
        var t = Math.min(1, Math.abs(x) / (H + step));
        var scale = 1 - t * 0.14;
        var z = -Math.abs(x) * 0.25;
        card.style.transform =
          "translate(-50%,-50%) translate3d(" + x + "px," + (-arc) + "px," + z + "px) rotateZ(" + (-rot) + "deg) scale(" + scale + ")";
        card.style.opacity = String(1 - t * 0.45);
        card.style.zIndex = String(1000 - Math.round(Math.abs(x)));
        if (Math.abs(x) < best) { best = Math.abs(x); bestI = i; }
      });
      if (bestI !== activeIdx) {
        activeIdx = bestI;
        cards.forEach(function (c, i) { c.classList.toggle("is-active", i === bestI); });
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return function stop() { if (raf) cancelAnimationFrame(raf); };
  }
})();

/* Signale au watchdog inline que le script s est execute sans planter. */
document.documentElement.classList.add("js-ok");
