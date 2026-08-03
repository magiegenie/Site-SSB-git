/* =========================================================================
   MENTIONS LEGALES / CONFIDENTIALITE — chrome commun, sobre.
   Reveal discret sur les blocs de texte, ancrage doux vers les sections,
   sommaire avec surlignage de la section active au scroll.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initAnchors();
  initToc();
  initFloatnav();

  if (!M || typeof M.animate !== "function") {
    root.classList.remove("motion-ready");
    return;
  }

  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (!id || id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        var top = t.getBoundingClientRect().top + window.pageYOffset - 88;
        window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
      });
    });
  }

  function initToc() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".legal-toc-list a"));
    if (!links.length) return;
    var sections = links.map(function (a) {
      return document.querySelector(a.getAttribute("href"));
    }).filter(Boolean);
    if (!sections.length || typeof IntersectionObserver === "undefined") return;

    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

    function setActive(id) {
      links.forEach(function (a) { a.classList.remove("is-active"); });
      if (byId[id]) byId[id].classList.add("is-active");
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-30% 0px -60% 0px" });

    sections.forEach(function (s) { observer.observe(s); });
    setActive(sections[0].id);
  }

  function initFloatnav() {
    var navEl = document.querySelector(".floatnav");
    if (!navEl) return;
    var lastY = window.scrollY;
    var ticking = false;
    function apply() {
      ticking = false;
      var h = window.innerHeight;
      var y = window.scrollY;
      if (y < h * 0.6) navEl.classList.remove("is-hidden");
      else if (y > lastY + 4) navEl.classList.add("is-hidden");
      else if (y < lastY - 4) navEl.classList.remove("is-hidden");
      lastY = y;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }
})();
