/* =========================================================================
   DEVENIR PARTENAIRE — motion design (Motion + Lenis)
   Même chorégraphie que qui-sommes-nous.html : entrée hero en lignes,
   halos qui dérivent, parallax discret, révélations décalées. S'y ajoute
   un compte-up sur les statistiques (chiffres déjà présents sur le site,
   aucune métrique inventée).
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!M || typeof M.animate !== "function") {
    root.classList.remove("motion-ready");
    initTheme();
    initAnchors(null);
    initCountUp(null);
    return;
  }

  var EASE = [0.16, 1, 0.3, 1];
  var tablet = window.matchMedia("(min-width: 769px)").matches;

  /* --------------------------- Smooth scroll --------------------------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  }

  initTheme();
  initAnchors(lenis);
  initCountUp(M);

  /* ====================== 1. ENTRÉE SIGNATURE (HERO) ==================== */
  var heroLines = document.querySelectorAll(".hero-title .ln > span");
  if (heroLines.length) {
    if (reduced) {
      heroLines.forEach(function (el) { el.style.transform = "none"; });
    } else {
      M.animate(heroLines,
        { transform: ["translateY(105%)", "translateY(0%)"] },
        { duration: 0.95, delay: M.stagger(0.09), ease: EASE }
      );
    }
  }

  if (!reduced) {
    var drifts = [
      { sel: ".pod-1", x: [0, 34, 0], y: [0, -18, 0], d: 19 },
      { sel: ".pod-2", x: [0, -26, 0], y: [0, 22, 0], d: 23 },
      { sel: ".pod-3", x: [0, 22, 0], y: [0, 14, 0], d: 27 }
    ];
    drifts.forEach(function (p) {
      var el = document.querySelector(p.sel);
      if (!el) return;
      M.animate(el, { x: p.x, y: p.y },
        { duration: p.d, repeat: Infinity, ease: "easeInOut" });
    });
  }

  /* ========================= 2. PARALLAX DISCRET ======================== */
  if (tablet && !reduced) {
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      var s = parseFloat(el.dataset.parallax) || 0;
      M.scroll(
        M.animate(el, { transform: [
          "translateY(" + (-s * 30).toFixed(1) + "%)",
          "translateY(" + (s * 30).toFixed(1) + "%)"
        ] }, { ease: "linear" }),
        { target: el, offset: ["start end", "end start"] }
      );
    });
  }

  /* ===================== 3. RÉVÉLATIONS AU DÉFILEMENT =================== */
  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  /* ===================================================================== */
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

    function apply() {
      ticking = false;
      var h = window.innerHeight;
      var top = bgAt(h * 0.12);
      var bottom = bgAt(h - 52);
      if (body.dataset.theme !== top) body.dataset.theme = top;
      if (body.dataset.navtheme !== bottom) body.dataset.navtheme = bottom;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    apply();
  }

  /* Ancres internes : défilement fluide via Lenis quand il est actif. */
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

  /* Compte-up des statistiques : se déclenche une fois, à l'entrée dans
     le viewport. Sans Motion (ou reduced-motion), la valeur finale
     s'affiche directement. */
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
})();
