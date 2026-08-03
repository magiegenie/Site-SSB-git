/* =========================================================================
   BOOK A CALL — motion design (Motion + Lenis) + formulaire fonctionnel
   Le formulaire reprend integralement le comportement existant : branches
   par profil (partenaire/speaker/adherent), validation au blur et a la
   soumission, feedback et reinitialisation. Pas de backend branche (demo) —
   meme etat que l'ancienne version.
   ========================================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var M = window.Motion;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initTheme();
  initForm();
  initBookCall();

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

  M.inView(".reveal", function (entry) {
    entry.target.classList.add("in");
  }, { margin: "0px 0px -14% 0px" });

  /* ------------------------------- Compte-up ------------------------------ */
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

  /* ------------------------- Validation du formulaire ---------------------- */
  function initForm() {
    var form = document.querySelector("[data-form]");
    if (!form) return;
    var feedback = form.querySelector(".form-feedback");

    function setInvalid(field, invalid) { if (field) field.classList.toggle("is-invalid", invalid); }
    function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    form.querySelectorAll(".field-input, .field-textarea").forEach(function (input) {
      input.addEventListener("blur", function () {
        var field = input.closest(".field");
        if (input.required && !input.value.trim()) { setInvalid(field, true); return; }
        if (input.type === "email" && input.value && !emailOk(input.value)) { setInvalid(field, true); return; }
        setInvalid(field, false);
      });
      input.addEventListener("input", function () {
        var f = input.closest(".field");
        if (f && f.classList.contains("is-invalid")) setInvalid(f, false);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstInvalid = null;
      form.querySelectorAll(".field-input, .field-textarea").forEach(function (input) {
        if (input.disabled) return;
        var field = input.closest(".field");
        var bad = false;
        if (input.required && !input.value.trim()) bad = true;
        if (input.type === "email" && input.value && !emailOk(input.value)) bad = true;
        setInvalid(field, bad);
        if (bad && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }
      if (feedback) {
        feedback.classList.add("is-shown");
        feedback.textContent = "Merci, votre demande est bien notée. L'équipe SSB vous recontacte sous 48 h.";
        feedback.setAttribute("role", "status");
      }
      form.reset();
    });
  }

  /* -------------------- Profil (partenaire/speaker/adherent) --------------- */
  function initBookCall() {
    var form = document.querySelector("[data-bookcall]");
    if (!form) return;
    var typeSelect = form.querySelector('[name="type"]');
    if (!typeSelect) return;

    var COPY = {
      partenaire: {
        cta: "Envoyer ma demande",
        micro: "Réponse sous 48 h ouvrées. Aucune donnée partagée.",
        msg: "Dites-nous en quelques mots ce que vous avez en tête.",
        feedback: "Merci ! Le bureau vous recontacte sous 48 h ouvrées pour caler votre partenariat."
      },
      adherent: {
        cta: "Envoyer ma demande",
        micro: "Réponse sous 48 h ouvrées. Aucune donnée partagée.",
        msg: "Dis-nous en quelques mots ce qui t'amène.",
        feedback: "Merci ! On te recontacte sous 48 h ouvrées pour répondre à toutes tes questions."
      },
      speaker: {
        cta: "Envoyer ma demande",
        micro: "Réponse sous 48 h ouvrées. Aucune donnée partagée.",
        msg: "Décrivez le sujet que vous aimeriez aborder.",
        feedback: "Merci ! Le bureau revient vers vous sous 48 h ouvrées pour construire votre intervention."
      }
    };

    var branches = Array.prototype.slice.call(form.querySelectorAll("[data-branch]"));
    var ctaEl = form.querySelector("[data-form-cta]");
    var microEl = form.querySelector("[data-form-micro]");
    var msgEl = form.querySelector("[data-msg]");

    function activate(profile) {
      var c = COPY[profile] || COPY.partenaire;
      branches.forEach(function (b) {
        var on = b.dataset.branch === profile;
        b.classList.toggle("is-active", on);
        b.querySelectorAll("input, textarea, select").forEach(function (el) { el.disabled = !on; });
      });
      if (ctaEl) ctaEl.textContent = c.cta;
      if (microEl) microEl.textContent = c.micro;
      if (msgEl) msgEl.setAttribute("placeholder", c.msg);
    }

    typeSelect.addEventListener("change", function () { activate(typeSelect.value); });

    document.querySelectorAll("[data-profile]").forEach(function (el) {
      el.addEventListener("click", function () {
        var p = el.getAttribute("data-profile");
        typeSelect.value = p;
        activate(p);
      });
    });

    form.addEventListener("submit", function () {
      var c = COPY[typeSelect.value] || COPY.partenaire;
      queueMicrotask(function () {
        var fb = form.querySelector(".form-feedback");
        if (fb && fb.classList.contains("is-shown")) {
          fb.textContent = c.feedback;
          activate(typeSelect.value || "partenaire");
        }
      });
    }, true);

    var hash = (window.location.hash || "").replace("#", "");
    var start = typeSelect.value || "partenaire";
    if (["partenaire", "adherent", "speaker"].indexOf(hash) !== -1) {
      typeSelect.value = hash;
      start = hash;
      var target = document.getElementById("reserver");
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
    }
    activate(start);
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
