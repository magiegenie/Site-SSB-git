/* =========================================================================
   CONNEXION / CREATION DE COMPTE — logique fonctionnelle (Supabase Auth)
   Auth reelle via Supabase (assets/vendor/supabase.js + assets/connexion/
   js/supabase-config.js pour l'URL/cle publiques, charges avant ce fichier).
   Comportement conserve a l'identique : validation au blur/submit, bascule
   connexion/creation, machine a ecrire sur la citation, toggle mot de
   passe, redirection apres succes. "ssb_account" reste ecrit en
   localStorage (nom en clair) au succes, pour un futur widget de compte
   dans le header qui n'existe pas encore sur ce site.
   ========================================================================= */
(function () {
  "use strict";

  var SESSION_KEY = "ssb_account";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var auth = window.SSBAuth;

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

  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = !!busy;
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
      if (!auth) {
        showAuthError(form, "Connexion indisponible pour le moment, réessaie plus tard.");
        return;
      }

      var inputs = Array.prototype.slice.call(form.querySelectorAll(".field-input"));
      var ok = true;
      var firstInvalid = null;
      inputs.forEach(function (input) {
        if (!validateField(input)) { ok = false; if (!firstInvalid) firstInvalid = input; }
      });
      if (!ok) { firstInvalid.focus(); return; }

      var email = form.querySelector('[name="email"]').value.trim();
      var password = form.querySelector('[name="password"]').value;

      setBusy(form, true);
      auth.signIn(email, password).then(function (result) {
        setBusy(form, false);
        if (!result.success) {
          showAuthError(form, result.message);
          return;
        }
        var user = result.data.user;
        var name = (user && user.user_metadata && user.user_metadata.name) || email;
        succeed(form, name, "Connexion réussie. Redirection…");
      });
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
      if (!auth) {
        showAuthError(form, "Création de compte indisponible pour le moment, réessaie plus tard.");
        return;
      }

      var inputs = Array.prototype.slice.call(form.querySelectorAll(".field-input"));
      var ok = true;
      var firstInvalid = null;
      inputs.forEach(function (input) {
        if (!validateField(input)) { ok = false; if (!firstInvalid) firstInvalid = input; }
      });
      if (!ok) { firstInvalid.focus(); return; }

      var name = form.querySelector('[name="name"]').value.trim();
      var email = form.querySelector('[name="email"]').value.trim();
      var password = form.querySelector('[name="password"]').value;

      setBusy(form, true);
      auth.signUp(email, password, name).then(function (result) {
        setBusy(form, false);
        if (!result.success) {
          showAuthError(form, result.message);
          return;
        }
        // Si la confirmation email est activee cote Supabase, il n'y a pas
        // encore de session a ce stade : on previent au lieu de rediriger
        // comme si le compte etait deja actif.
        if (result.needsEmailConfirmation) {
          showFeedback(form, "Compte créé ! Vérifie tes emails pour confirmer ton adresse avant de te connecter.");
          return;
        }
        succeed(form, name, "Compte créé. Redirection…");
      });
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
        if (!auth || !auth.client) {
          if (form) showFeedback(form, "Connexion Google indisponible pour le moment.");
          return;
        }
        // Necessite d'activer le provider Google dans Supabase
        // (Authentication > Providers) avant de fonctionner reellement.
        auth.client.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin + window.location.pathname.replace(/connexion\.html$/, "index.html") }
        }).then(function (res) {
          if (res.error && form) showFeedback(form, "Connexion Google pas encore activée côté Supabase.");
        });
      });
    });
  }

  /* ---- Retour du lien de confirmation email (?code=... ou #access_token=...) ---- */
  function initEmailConfirmationReturn(signinForm, signupForm) {
    if (!auth || !auth.client) return;
    var cameFromEmailLink = /[?&](code|access_token|token_hash)=/.test(window.location.href);
    if (!cameFromEmailLink) return;
    var handled = false;
    var visibleForm = function () { return signinForm.hidden ? signupForm : signinForm; };

    auth.client.auth.onAuthStateChange(function (event, session) {
      if (handled || event !== "SIGNED_IN" || !session) return;
      handled = true;
      var name = (session.user.user_metadata && session.user.user_metadata.name) || session.user.email;
      succeed(visibleForm(), name, "Email confirmé, tu es connecté(e) ! Redirection…");
    });

    // Filet : si l'echange du code de confirmation echoue silencieusement
    // (lien expire, deja utilise, ou ouvert dans un contexte navigateur
    // different de celui qui a fait l'inscription), on previent au lieu de
    // laisser un formulaire vide sans explication.
    setTimeout(function () {
      if (handled) return;
      showAuthError(visibleForm(), "Ce lien de confirmation est invalide, a expiré ou a déjà été utilisé. Connecte-toi directement avec ton email et ton mot de passe, ou recrée un compte si besoin.");
    }, 4000);
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
    if (signinForm && signupForm) initEmailConfirmationReturn(signinForm, signupForm);
  });
})();

/* Signale au watchdog inline que le script s est execute sans planter. */
document.documentElement.classList.add("js-ok");
