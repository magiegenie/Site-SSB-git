/* =========================================================================
   JETON CARD — interactions & scroll animations (GSAP + ScrollTrigger + Lenis)
   ========================================================================= */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* --------------------------- Smooth scroll --------------------------- */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGSAP) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  }

  /* ---------------------------- Anchor links --------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.pageYOffset - 60;
      if (lenis) lenis.scrollTo(top, { duration: 1.1 });
      else window.scrollTo({ top: top, behavior: "smooth" });
    });
  });

  /* ---------------- Adaptive theme (orange <-> light) ------------------ */
  var body = document.body;
  if (hasGSAP) {
    document.querySelectorAll("[data-bg]").forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec,
        start: "top 12%",
        end: "bottom 12%",
        onToggle: function (self) { if (self.isActive) body.dataset.theme = sec.dataset.bg; }
      });
    });
  } else {
    window.addEventListener("scroll", function () {
      var line = 80, current = "orange";
      document.querySelectorAll("[data-bg]").forEach(function (sec) {
        var r = sec.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) current = sec.dataset.bg;
      });
      body.dataset.theme = current;
    });
  }

  /* ----------------------------- Accordion ----------------------------- */
  function setItem(item, open) {
    var b = item.querySelector(".acc-body");
    item.classList.toggle("is-open", open);
    b.style.maxHeight = open ? b.scrollHeight + "px" : "0px";
  }
  document.querySelectorAll("[data-accordion]").forEach(function (acc) {
    var items = acc.querySelectorAll(".acc-item");
    items.forEach(function (item) {
      item.querySelector(".acc-head").addEventListener("click", function () {
        var willOpen = !item.classList.contains("is-open");
        items.forEach(function (it) { setItem(it, false); });
        setItem(item, willOpen);
      });
    });
  });

  /* ------------------------------ Reveals ------------------------------ */
  if (hasGSAP && !reduced) {
    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      onEnter: function (els) {
        els.forEach(function (el, i) { gsap.delayedCall(i * 0.07, function () { el.classList.add("in"); }); });
      }
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* -------------------- Scroll-driven effects (desktop) ---------------- */
  if (hasGSAP && !reduced) {
    var mm = gsap.matchMedia();

    // Dashboard zooms in while its section is pinned
    mm.add("(min-width:1025px)", function () {
      gsap.fromTo("[data-zoom-target]", { scale: 0.82, yPercent: 4 }, {
        scale: 1.16, yPercent: -2, ease: "none",
        scrollTrigger: {
          trigger: "[data-zoom-section]",
          start: "top top", end: "+=120%",
          scrub: 1, pin: ".access-sticky", pinSpacing: true
        }
      });
    });

    // Parallax on collage cards + showcase photos
    mm.add("(min-width:769px)", function () {
      document.querySelectorAll("[data-parallax]").forEach(function (el) {
        var s = parseFloat(el.dataset.parallax) || 0;
        gsap.fromTo(el, { yPercent: -s * 34 }, {
          yPercent: s * 34, ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
        });
      });
    });
  }

  /* --------------------------- refresh on load ------------------------- */
  window.addEventListener("load", function () {
    document.querySelectorAll(".acc-item.is-open").forEach(function (it) {
      var b = it.querySelector(".acc-body"); b.style.maxHeight = b.scrollHeight + "px";
    });
    if (hasGSAP) ScrollTrigger.refresh();
  });
})();
