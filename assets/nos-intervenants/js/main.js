/* =========================================================================
   NOS INTERVENANTS — motion design (Motion + Lenis)
   Motif propre à cette page : un halo qui suit le curseur, dans le hero et
   sur chaque carte intervenant (poursuite de scène). Pas de hero en lignes,
   pas de grille collage, pas de bandeau défilant : cette page a son propre
   langage, cohérent avec le reste du site (mêmes tokens/chrome).
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  initSpotlight();

  if (!M || typeof M.animate !== "function") {
    root.classList.remove("motion-ready");
    initTheme();
    initAnchors(null);
    return;
  }

  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  }

  initTheme();
  initAnchors(lenis);

  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  /* Halo hero : suit le curseur sur toute la section. */
  function initSpotlight() {
    if (!hasPointer) return;
    var hero = document.querySelector("[data-spotlight]");
    if (hero) {
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--sx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        hero.style.setProperty("--sy", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
    }
    var MAX_TILT = 9;
    document.querySelectorAll("[data-spotlight-card]").forEach(function (card) {
      var visual = card.querySelector(".speaker-visual");
      if (!visual) return;
      visual.addEventListener("pointermove", function (e) {
        var r = visual.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        visual.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        visual.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        visual.style.setProperty("--rx", ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + "deg");
        visual.style.setProperty("--ry", ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + "deg");
      });
      visual.addEventListener("pointerleave", function () {
        visual.style.setProperty("--rx", "0deg");
        visual.style.setProperty("--ry", "0deg");
      });
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
})();

/* Signale au watchdog inline que le script s est execute sans planter. */
document.documentElement.classList.add("js-ok");
