/* =========================================================================
   CONNEXION / CREATION DE COMPTE — logique fonctionnelle (demo localStorage)
   Port fidele de l'ancien assets/js/auth.js, adapte aux nouvelles classes
   (.field-input, .field-error, etc.) et au nouveau markup split-screen.
   Comportement identique : comptes demo en localStorage, validation au
   blur/submit, bascule connexion/creation, machine a ecrire sur la citation,
   toggle mot de passe, stub Google, redirection apres succes.
   ========================================================================= */
(function () {
  "use strict";

  var ACCOUNTS_KEY = "ssb_demo_accounts";
  var SESSION_KEY = "ssb_account";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CONTENT = {
    signin: {
      image: "assets/img/hero-amphi.jpg",
      quote: "Le sport business commence ici. Content de te revoir.",
      author: "Sorbonne Sport Business"
    },
    signup: {
      image: "assets/img/equipe-maillot.jpg",
      quote: "Rejoins la communauté. Un nouveau chapitre commence.",
      author: "Sorbonne Sport Business"
    }
  };

  function readAccounts() {
    try {
      var raw = window.localStorage.getItem(ACCOUNTS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveAccounts(list) {
    try { window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function setSession(name) {
    try { window.localStorage.setItem(SESSION_KEY, name); } catch (e) {}
  }

  function isEmailValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function showFieldError(field, show) {
    if (field) field.classList.toggle("is-invalid", !!show);
  }

  function showAuthError(form, message) {
    var el = form.querySelector("[data-auth-error]");
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.classList.add("is-shown");
    } else {
      el.textContent = "";
      el.classList.remove("is-shown");
    }
  }

  function showFeedback(form, message) {
    var el = form.querySelector("[data-auth-feedback]");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("is-shown", !!message);
  }

  /* --------------------------- Machine a ecrire --------------------------- */
  function typewriter(el, text) {
    if (!el) return;
    if (reduced) { el.textContent = text; return; }
    el.textContent = "";
    var i = 0;
    function step() {
      el.textContent = text.slice(0, i);
      i++;
      if (i <= text.length) setTimeout(step, 42);
    }
    step();
  }

  function setVisual(mode) {
    var c = CONTENT[mode] || CONTENT.signin;
    var media = document.querySelector("[data-auth-media]");
    if (media) media.style.backgroundImage = "url('" + c.image + "')";
    var quoteEl = document.querySelector("[data-typewriter]");
    var authorEl = document.querySelector("[data-quote-author]");
    if (authorEl) authorEl.textContent = c.author;
    typewriter(quoteEl, c.quote);
  }

  /* ----------------------------- Toggle mdp -------------------------------- */
  function initPasswordToggle(form) {
    form.querySelectorAll("[data-toggle-password]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var wrap = btn.closest(".field-password-wrap");
        var input = wrap ? wrap.querySelector(".field-input") : null;
        if (!input) return;
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
      });
    });
  }

  /* ------------------------------ Validation -------------------------------- */
  function validateField(input) {
    var field = input.closest(".field");
    if (input.required && !input.value.trim()) { showFieldError(field, true); return false; }
    if (input.type === "email" && input.value && !isEmailValid(input.value)) { showFieldError(field, true); return false; }
    if (input.type === "password" && input.value && input.minLength > 0 && input.value.length < input.minLength) {
      showFieldError(field, true);
      return false;
    }
    showFieldError(field, false);
    return true;
  }

  function succeed(form, name, message) {
    setSession(name);
    showAuthError(form, "");
    showFeedback(form, message);
    setTimeout(function () { window.location.href = "index.html"; }, 900);
  }

  /* -------------------------------- Sign in --------------------------------- */
  function initSignIn(form) {
    form.querySelectorAll(".field-input").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("is-invalid")) showFieldError(field, false);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll(".field-input"));
      var ok = true;
      var firstInvalid = null;
      inputs.forEach(function (input) {
        if (!validateField(input)) { ok = false; if (!firstInvalid) firstInvalid = input; }
      });
      if (!ok) { firstInvalid.focus(); return; }

      var email = form.querySelector('[name="email"]').value.trim().toLowerCase();
      var password = form.querySelector('[name="password"]').value;
      var account = readAccounts().filter(function (a) {
        return a.email.toLowerCase() === email && a.password === password;
      })[0];

      if (!account) {
        showAuthError(form, "Email ou mot de passe incorrect, ou compte inexistant.");
        return;
      }
      succeed(form, account.name, "Connexion réussie. Redirection…");
    });
  }

  /* -------------------------------- Sign up ---------------------------------- */
  function initSignUp(form) {
    form.querySelectorAll(".field-input").forEach(function (input) {
      input.addEventListener("blur", function () { validateField(input); });
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field && field.classList.contains("is-invalid")) showFieldError(field, false);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var inputs = Array.prototype.slice.call(form.querySelectorAll(".field-input"));
      var ok = true;
      var firstInvalid = null;
      inputs.forEach(function (input) {
        if (!validateField(input)) { ok = false; if (!firstInvalid) firstInvalid = input; }
      });
      if (!ok) { firstInvalid.focus(); return; }

      var name = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim().toLowerCase();
      var password = form.querySelector('[name="password"]').value;
      var accounts = readAccounts();
      var exists = accounts.some(function (a) { return a.email.toLowerCase() === email; });

      if (exists) {
        showAuthError(form, "Un compte existe déjà avec cet email.");
        return;
      }
      accounts.push({ name: name, email: email, password: password });
      saveAccounts(accounts);
      succeed(form, name, "Compte créé. Redirection…");
    });
  }

  /* ------------------------------ Mode switch --------------------------------- */
  function initModeSwitch(forms, current) {
    var switchText = document.querySelector("[data-switch-text]");
    var switchBtn = document.querySelector("[data-switch-btn]");

    function activate(mode) {
      current = mode;
      forms.forEach(function (form) {
        var on = form.dataset.authForm === mode;
        form.hidden = !on;
        if (on) showAuthError(form, "");
      });
      if (mode === "signup") {
        if (switchText) switchText.textContent = "Déjà un compte ?";
        if (switchBtn) switchBtn.textContent = "Se connecter";
      } else {
        if (switchText) switchText.textContent = "Pas encore de compte ?";
        if (switchBtn) switchBtn.textContent = "Créer un compte";
      }
      setVisual(mode);
    }

    if (switchBtn) {
      switchBtn.addEventListener("click", function () {
        activate(current === "signin" ? "signup" : "signin");
      });
    }

    activate(current);
  }

  /* -------------------------------- Google ------------------------------------ */
  function initGoogle() {
    document.querySelectorAll("[data-google]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var form = document.querySelector('[data-auth-form]:not([hidden])');
        if (form) showFeedback(form, "Connexion Google disponible en v2 (démo).");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var forms = Array.prototype.slice.call(document.querySelectorAll("[data-auth-form]"));
    var signinForm = document.querySelector('[data-auth-form="signin"]');
    var signupForm = document.querySelector('[data-auth-form="signup"]');

    if (signinForm) initSignIn(signinForm);
    if (signupForm) initSignUp(signupForm);
    forms.forEach(initPasswordToggle);

    var params = new URLSearchParams(window.location.search);
    var start = params.get("mode") === "signup" ? "signup" : "signin";

    initModeSwitch(forms, start);
    initGoogle();
  });
})();
