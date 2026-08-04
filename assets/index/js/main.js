/* =========================================================================
   ACCUEIL — motion design (Motion + Lenis)
   Signature de cette page : les photos de la communauté dérivent en continu
   (chacune à sa propre vitesse, effet galaxie), avec un supplément d'élan
   quand on scrolle, et les intervenants défilent dans un carrousel qu'on
   peut glisser à la souris ou au doigt.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initTheme();
  initCarouselDrag();

  if (!M || typeof M.animate !== "function") {
    root.classList.remove("motion-ready");
    initAnchors(null);
    initCountUp(null);
    return;
  }

  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  }

  initAnchors(lenis);
  initCountUp(M);

  if (!reduced) {
    var media = document.querySelector("[data-kenburns] img");
    if (media) M.animate(media, { transform: ["scale(1.08)", "scale(1)"] }, { duration: 9, ease: [0.16, 1, 0.3, 1] });
    initGalaxy();
  }

  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  /* Derive continue des photos de la galaxie (vitesse propre a --depth),
     plus un supplement d'elan au scroll. Tourne en permanence, meme sans
     scroller, pour ne jamais donner une impression d'image figee. */
  function initGalaxy() {
    var container = document.querySelector(".galaxy");
    var field = document.querySelector("[data-galaxy]");
    if (!container || !field) return;
    var images = Array.prototype.slice.call(field.querySelectorAll(".g-img"));
    if (!images.length) return;

    var CFG = { speed: 0.15, ease: 0.1, scrollMultiplier: 0.05 };
    var ps = { current: 0, target: 0, last: 0 };
    var direction = "down", directionSign = 1, containerHeight = 0, containerOffset = 0;

    function layout() {
      var cRect = container.getBoundingClientRect();
      images.forEach(function (img) {
        var depth = parseFloat(img.dataset.depth) || 0.5;
        img._speed = 0.6 + depth;
        var r = img.getBoundingClientRect();
        img._top = r.top - cRect.top;
        img._height = r.height;
        img._extra = 0;
      });
      containerHeight = container.offsetHeight;
      containerOffset = containerHeight * 0.15;
      ps.current = ps.target = ps.last = 0;
    }

    function tick(dt) {
      ps.target += CFG.speed * dt * directionSign;
      ps.current += (ps.target - ps.current) * CFG.ease;
      direction = ps.current < ps.last ? "down" : "up";
      images.forEach(function (img) {
        img._position = -ps.current * img._speed - img._extra;
        var nBottom = img._position + img._top + img._height;
        var isBefore = nBottom < -containerOffset;
        var isAfter = nBottom > containerHeight + containerOffset;
        if (direction === "up" && isBefore) img._extra -= containerHeight + containerOffset;
        if (direction === "down" && isAfter) img._extra += containerHeight + containerOffset;
        img.style.transform = "translate3d(0," + img._position.toFixed(2) + "px,0)";
      });
      ps.last = ps.current;
    }

    function impulse(velocity, dir) {
      ps.target += velocity * CFG.scrollMultiplier;
      if (dir) directionSign = dir;
    }

    if (lenis) {
      lenis.on("scroll", function (e) { impulse(e.velocity || 0, e.direction || 0); });
    } else {
      var lastY = window.scrollY;
      window.addEventListener("scroll", function () {
        var y = window.scrollY, v = y - lastY; lastY = y;
        impulse(v, v > 0 ? 1 : v < 0 ? -1 : 0);
      }, { passive: true });
    }

    layout();
    window.addEventListener("resize", layout);

    var lastT = performance.now();
    requestAnimationFrame(function frame(now) {
      var dt = Math.min(64, now - lastT); lastT = now;
      tick(dt);
      requestAnimationFrame(frame);
    });
  }

  /* Compte-up sur la statistique partenariat. */
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

  /* Carrousel intervenants : glisser a la souris/au doigt + boutons prev/next. */
  function initCarouselDrag() {
    var track = document.querySelector("[data-sp-track]");
    if (!track) return;
    var prevBtn = document.querySelector("[data-sp-prev]");
    var nextBtn = document.querySelector("[data-sp-next]");
    var step = function () {
      var card = track.querySelector(".sp-card");
      return card ? card.offsetWidth + 24 : 280;
    };
    if (nextBtn) nextBtn.addEventListener("click", function () { track.scrollBy({ left: step(), behavior: "smooth" }); });
    if (prevBtn) prevBtn.addEventListener("click", function () { track.scrollBy({ left: -step(), behavior: "smooth" }); });

    var dragging = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener("mousedown", function (e) {
      dragging = true; moved = false; startX = e.clientX; startScroll = track.scrollLeft;
      track.classList.add("is-grab");
    });
    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    window.addEventListener("mouseup", function () { dragging = false; track.classList.remove("is-grab"); });
    track.addEventListener("click", function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
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
})();
