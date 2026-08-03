/* =========================================================================
   DEVENIR PARTENAIRE — motion design (Motion + Lenis)
   Chorégraphie propre à cette page, pensée pour un public partenaire
   (décideurs) : preuve immédiate (hero photo + Ken Burns + rideau doré qui
   se retire, compte-up), exploration active (onglets formats avec rail qui
   glisse), sensation de réseau (bandeaux qui défilent en continu). Pas de
   copie du hero en lignes / halos qui dérivent de qui-sommes-nous.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initTabs();

  if (!M || typeof M.animate !== "function") {
    root.classList.remove("motion-ready");
    initTheme();
    initAnchors(null);
    initCountUp(null);
    initWipe(false);
    return;
  }

  /* --------------------------- Smooth scroll --------------------------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  }

  initTheme();
  initAnchors(lenis);
  initCountUp(M);
  initWipe(!reduced);

  /* ====================== 1. KEN BURNS SUR LA PHOTO HERO ================ */
  if (!reduced) {
    var media = document.querySelector("[data-kenburns] img");
    if (media) {
      M.animate(media, { transform: ["scale(1.08)", "scale(1)"] },
        { duration: 9, ease: [0.16, 1, 0.3, 1] });
    }
  }

  /* ===================== 2. RÉVÉLATIONS AU DÉFILEMENT =================== */
  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  /* ===================================================================== */
  function initWipe(animated) {
    var els = document.querySelectorAll("[data-wipe]");
    if (!els.length) return;
    if (!animated) { els.forEach(function (el) { el.classList.add("is-wiped"); }); return; }
    els.forEach(function (el, i) {
      setTimeout(function () { el.classList.add("is-wiped"); }, 220 + i * 200);
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
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }
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

  function initCountUp(motion) {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    if (!motion || reduced) {
      els.forEach(function (el) { el.textContent = el.dataset.count; });
      return;
    }
    motion.inView(els, function (entry) {
      var el = entry.target;
      var target = parseFloat(el.dataset.count);
      motion.animate(0, target, {
        duration: 1.3, ease: [0.22, 1, 0.36, 1],
        onUpdate: function (latest) { el.textContent = Math.round(latest); }
      });
    }, { margin: "0px 0px -20% 0px" });
  }

  /* Onglets « Ce qu'on propose » : clic bascule tab + media + rail. Pas
     besoin de Motion, transitions CSS suffisent (peu d'états, peu coûteux). */
  function initTabs() {
    var wrap = document.querySelector("[data-tabs]");
    if (!wrap) return;
    var tabs = Array.prototype.slice.call(wrap.querySelectorAll(".formats-tab"));
    var panels = Array.prototype.slice.call(wrap.querySelectorAll(".formats-media"));
    var rail = wrap.querySelector("[data-rail]");

    function placeRail(tab) {
      if (!rail) return;
      rail.style.transform = "translateY(" + tab.offsetTop + "px)";
      rail.style.height = tab.offsetHeight + "px";
    }

    function activate(index) {
      tabs.forEach(function (t, i) {
        var on = i === index;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p, i) { p.classList.toggle("is-active", i === index); });
      placeRail(tabs[index]);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { activate(i); });
    });
    window.addEventListener("resize", function () {
      var active = tabs.findIndex(function (t) { return t.classList.contains("is-active"); });
      placeRail(tabs[active < 0 ? 0 : active]);
    }, { passive: true });

    placeRail(tabs[0]);
  }
})();
