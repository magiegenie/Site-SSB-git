/* =========================================================================
   DEVENIR ADHÉRENT — motion design (Motion + Lenis)
   Signature propre : le prix d'appel s'intègre au titre du hero (aucune
   animation dédiée nécessaire, la mise en page fait le travail). La carte
   Gold a un filet doré qui tourne lentement autour de son contour — pas de
   translateY+shadow générique sur hover. Accordéon FAQ partagé avec le
   reste du site (composant neutre, pas une signature de page).
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initTheme();
  initAccordion();

  if (!M || typeof M.animate !== "function") {
    root.classList.remove("motion-ready");
    initAnchors(null);
    return;
  }

  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  }

  initAnchors(lenis);
  initGoldRing();

  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  /* Filet dore qui tourne lentement autour de la carte Gold. */
  function initGoldRing() {
    var card = document.querySelector(".plan--gold");
    if (!card || reduced) return;
    var angle = 0;
    function tick() {
      angle = (angle + 0.35) % 360;
      card.style.setProperty("--ga", angle + "deg");
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
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
          if (willOpen) { item.classList.add("is-open"); head.setAttribute("aria-expanded", "true"); }
        });
      });
    });
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

/* =========================================================================
   PALIERS — bascule mensuel / annuel (référence "pricing" fournie par Tom).
   Le prix se remplace derrière un court fondu, la pastille de la bascule
   glisse sur l'option choisie. Les tarifs annuels sont portés par les
   attributs data-mois / data-an du HTML, aucun calcul ici.
   ========================================================================= */
(function () {
  "use strict";

  var sw = document.querySelector(".billing-switch");
  if (!sw) return;
  var pin = sw.querySelector(".billing-pin");
  var opts = Array.prototype.slice.call(sw.querySelectorAll(".billing-opt"));

  /* Offre de lancement : la section porte sa date de fin (data-promo-until).
     Passée cette date, on retombe seul sur le plein tarif annuel et les
     mentions "-50 %" disparaissent, sans avoir à retoucher le HTML. */
  var section = sw.closest(".pricing");
  var echeance = section && section.dataset.promoUntil;
  var aujourdhui = new Date();
  var iso = aujourdhui.getFullYear() + "-" +
            String(aujourdhui.getMonth() + 1).padStart(2, "0") + "-" +
            String(aujourdhui.getDate()).padStart(2, "0");
  var promoEnCours = !echeance || iso <= echeance;
  if (section) section.classList.toggle("promo-finie", !promoEnCours);

  function movePin(btn) {
    pin.style.width = btn.offsetWidth + "px";
    pin.style.transform = "translateX(" + (btn.offsetLeft - 5) + "px)";
  }

  function select(btn) {
    opts.forEach(function (o) {
      var on = o === btn;
      o.classList.toggle("is-active", on);
      o.setAttribute("aria-pressed", on ? "true" : "false");
    });
    movePin(btn);

    var unite = btn.dataset.billing; // "mois" ou "an"
    /* La promo des 6 premiers mois est un tarif mensuel : on la masque
       lorsque l'on bascule en annuel. */
    if (section) section.classList.toggle("is-annual", unite === "an");
    document.querySelectorAll(".plan-price").forEach(function (price) {
      var amount = price.querySelector("[data-price]");
      var per = price.querySelector("[data-per]");
      if (!amount) return;
      price.classList.add("is-swapping");
      setTimeout(function () {
        amount.textContent = unite === "an"
          ? (promoEnCours ? amount.dataset.an : amount.dataset.anPlein || amount.dataset.an)
          : amount.dataset.mois;
        if (per) per.textContent = unite === "an" ? "/ an" : "/ mois";
        price.classList.remove("is-swapping");
      }, 200);
    });
  }

  opts.forEach(function (o) {
    o.addEventListener("click", function () { select(o); });
  });

  /* Position initiale de la pastille (après le rendu des polices). */
  function init() { movePin(sw.querySelector(".billing-opt.is-active")); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  else window.addEventListener("load", init);
  window.addEventListener("resize", init);
  init();
})();
