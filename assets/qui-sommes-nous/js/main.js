/* =========================================================================
   QUI SOMMES-NOUS — motion design (Motion + Lenis)
   Motion (motion.dev) est servi en local depuis js/vendor/motion.js.
   Chorégraphie volontairement resserrée : une entrée signature (hero),
   une mécanique liée au scroll (la scène qui zoome), du parallax discret,
   et des révélations décalées. Rien d'autre.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Si Motion n'a pas chargé, on retire l'état de départ posé dans <head> :
     la page reste entièrement lisible au lieu de s'afficher vide. */
  if (!M || typeof M.animate !== "function") {
    root.classList.remove("motion-ready");
    initTheme();
    initAccordion();
    initAnchors(null);
    return;
  }

  var EASE = [0.16, 1, 0.3, 1];   /* ease-out-expo */
  var desktop = window.matchMedia("(min-width: 1025px)").matches;
  var tablet = window.matchMedia("(min-width: 769px)").matches;

  /* --------------------------- Smooth scroll --------------------------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  }

  initTheme();
  initAccordion();
  initAnchors(lenis);

  /* ====================== 1. ENTRÉE SIGNATURE (HERO) ==================== */
  /* Les lignes du titre montent derrière leur masque, en cascade. C'est LE
     moment chorégraphié de la page ; tout le reste est plus discret. */
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

  /* Les halos du hero dérivent lentement : la scène respire sans distraire. */
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

  /* ================ 2. SCÈNE PINNÉE QUI GRANDIT AU SCROLL ============== */
  /* La photo d'amphi grandit pendant que la section reste épinglée : on entre
     littéralement dans la salle. Desktop uniquement (coût GPU + hauteur). */
  var scene = document.querySelector("[data-zoom-target]");
  var sceneSection = document.querySelector("[data-zoom-section]");
  if (scene && sceneSection && desktop && !reduced) {
    M.scroll(
      M.animate(scene, { transform: ["scale(0.88)", "scale(1.08)"] }, { ease: "linear" }),
      { target: sceneSection, offset: ["start start", "end end"] }
    );
  }

  /* ========================= 3. PARALLAX DISCRET ======================== */
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

  /* ===================== 4. RÉVÉLATIONS AU DÉFILEMENT =================== */
  /* inView plutôt qu'un écouteur de scroll. Le rappel reçoit une
     IntersectionObserverEntry : l'élément est dans entry.target. Ne rien
     renvoyer fait cesser l'observation après le premier passage (pas de
     ré-animation quand on remonte). Le décalage vient de --i, posé en HTML. */
  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  /* ===================================================================== */
  /* Thème adaptatif. Deux sondes distinctes, parce que les deux barres ne
     vivent pas au même endroit : l'en-tête lit la section derrière le HAUT de
     l'écran, la nav flottante lit celle derrière le BAS. Une sonde unique
     rendait la nav blanche sur le pied de page blanc. */
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

  /* Accordéon : l'ouverture passe par grid-template-rows (0fr -> 1fr), donc
     aucune hauteur n'est animée et rien ne saute au redimensionnement. */
  function initAccordion() {
    document.querySelectorAll("[data-accordion]").forEach(function (acc) {
      var items = Array.prototype.slice.call(acc.querySelectorAll(".acc-item"));
      items.forEach(function (item) {
        var head = item.querySelector(".acc-head");
        if (!head) return;
        head.setAttribute("aria-expanded", item.classList.contains("is-open") ? "true" : "false");
        head.addEventListener("click", function () {
          var willOpen = !item.classList.contains("is-open");
          items.forEach(function (it) {
            it.classList.remove("is-open");
            var h = it.querySelector(".acc-head");
            if (h) h.setAttribute("aria-expanded", "false");
          });
          if (willOpen) {
            item.classList.add("is-open");
            head.setAttribute("aria-expanded", "true");
          }
        });
      });
    });
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
})();

/* Signale au watchdog inline que le script s est execute sans planter. */
document.documentElement.classList.add("js-ok");
