/* =====================================================================
   Page connexion.html — split-screen connexion / création de compte.
   Reproduction vanilla du composant auth-fuse (formulaire + panneau
   visuel avec citation en machine à écrire), adaptée à la DA SSB.
   Mode démo (pas de back-end) : comptes dans localStorage, session
   active dans "ssb_account" (même clé lue par initAccount() dans main.js
   pour afficher l'avatar dans le header sur les autres pages).
   ===================================================================== */

(function () {
  "use strict";

  const ACCOUNTS_KEY = "ssb_demo_accounts";
  const SESSION_KEY = "ssb_account";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Contenu du panneau visuel selon le mode (image + citation). */
  const CONTENT = {
    signin: {
      image: "assets/img/hero-amphi.jpg",
      quote: "Le sport business commence ici. Content de te revoir.",
      author: "Sorbonne Sport Business",
    },
    signup: {
      image: "assets/img/equipe-maillot.jpg",
      quote: "Rejoins la communauté. Un nouveau chapitre commence.",
      author: "Sorbonne Sport Business",
    },
  };

  /* --------------------------- Stockage --------------------------- */
  function readAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveAccounts(accounts) {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      /* stockage indisponible : le compte reste en mémoire le temps de la session */
    }
  }
  function setSession(name) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ name: name }));
    } catch (e) {}
  }

  /* --------------------------- Helpers ---------------------------- */
  function isEmailValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  function showFieldError(field, show) {
    if (field) field.classList.toggle("is-invalid", !!show);
  }
  function showAuthError(form, message) {
    const el = form.querySelector("[data-auth-error]");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("is-shown", !!message);
  }
  function showFeedback(form, message) {
    const el = form.querySelector("[data-auth-feedback]");
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("is-shown", !!message);
  }

  /* ----------------------- Machine à écrire ----------------------- */
  let typeTimer = null;
  function typewriter(el, text) {
    if (!el) return;
    if (typeTimer) clearTimeout(typeTimer);
    if (reduced) {
      el.textContent = text;
      return;
    }
    el.textContent = "";
    let i = 0;
    (function step() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i += 1;
        typeTimer = setTimeout(step, 42);
      }
    })();
  }

  /* -------------------- Panneau visuel (droite) ------------------- */
  function setVisual(mode) {
    const media = document.querySelector("[data-auth-media]");
    const quote = document.querySelector("[data-typewriter]");
    const author = document.querySelector("[data-quote-author]");
    const content = CONTENT[mode];
    if (!content) return;
    if (media) media.style.backgroundImage = "url('" + content.image + "')";
    if (author) author.textContent = content.author;
    typewriter(quote, content.quote);
  }

  /* ---------------- Afficher / masquer le mot de passe ------------ */
  function initPasswordToggle(form) {
    const btn = form.querySelector("[data-toggle-password]");
    const input = form.querySelector('input[name="password"]');
    if (!btn || !input) return;
    btn.addEventListener("click", () => {
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
    });
  }

  /* ----------------------- Validation d'un champ ------------------ */
  function validateField(input) {
    const field = input.closest(".field");
    let bad = false;
    if (input.required && !input.value.trim()) bad = true;
    else if (input.type === "email" && !isEmailValid(input.value)) bad = true;
    else if (input.name === "password" && input.value.length < 6) bad = true;
    showFieldError(field, bad);
    return !bad;
  }

  /* ------------------------ Redirection succès -------------------- */
  function succeed(form, name, message) {
    setSession(name);
    showAuthError(form, "");
    showFeedback(form, message);
    setTimeout(() => {
      window.location.href = "index.html";
    }, 900);
  }

  /* --------------------------- Connexion -------------------------- */
  function initSignIn(form) {
    initPasswordToggle(form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showAuthError(form, "");
      const email = form.querySelector("#si-email");
      const password = form.querySelector("#si-password");
      const okEmail = validateField(email);
      const okPass = validateField(password);
      if (!okEmail || !okPass) return;

      const account = readAccounts().find(
        (a) => a.email.toLowerCase() === email.value.trim().toLowerCase() && a.password === password.value
      );
      if (!account) {
        showAuthError(form, "Email ou mot de passe incorrect.");
        return;
      }
      succeed(form, account.name, "Connecté ! Redirection…");
    });
  }

  /* ----------------------- Création de compte --------------------- */
  function initSignUp(form) {
    initPasswordToggle(form);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      showAuthError(form, "");
      const name = form.querySelector("#su-name");
      const email = form.querySelector("#su-email");
      const password = form.querySelector("#su-password");
      const okName = validateField(name);
      const okEmail = validateField(email);
      const okPass = validateField(password);
      if (!okName || !okEmail || !okPass) return;

      const accounts = readAccounts();
      if (accounts.some((a) => a.email.toLowerCase() === email.value.trim().toLowerCase())) {
        showAuthError(form, "Un compte existe déjà avec cet email.");
        return;
      }
      accounts.push({ name: name.value.trim(), email: email.value.trim(), password: password.value });
      saveAccounts(accounts);
      succeed(form, name.value.trim(), "Compte créé ! Redirection…");
    });
  }

  /* ----------------------- Bascule des modes ---------------------- */
  function initModeSwitch(forms, current) {
    const switchText = document.querySelector("[data-switch-text]");
    const switchBtn = document.querySelector("[data-switch-btn]");

    function activate(mode) {
      current.mode = mode;
      forms.signin.hidden = mode !== "signin";
      forms.signup.hidden = mode !== "signup";
      if (switchText && switchBtn) {
        switchText.textContent = mode === "signin" ? "Pas encore de compte ?" : "Déjà adhérent ?";
        switchBtn.textContent = mode === "signin" ? "Créer un compte" : "Se connecter";
      }
      setVisual(mode);
    }

    if (switchBtn) {
      switchBtn.addEventListener("click", () => activate(current.mode === "signin" ? "signup" : "signin"));
    }
    return activate;
  }

  /* --------------------------- Google ---------------------------- */
  function initGoogle(current) {
    const btn = document.querySelector("[data-google]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const form = document.querySelector('[data-auth-form="' + current.mode + '"]');
      if (form) showFeedback(form, "Connexion Google disponible en v2 (démo).");
    });
  }

  /* ---------------------------- Init ------------------------------ */
  document.addEventListener("DOMContentLoaded", () => {
    const forms = {
      signin: document.querySelector('[data-auth-form="signin"]'),
      signup: document.querySelector('[data-auth-form="signup"]'),
    };
    if (!forms.signin || !forms.signup) return;

    const current = { mode: "signin" };
    initSignIn(forms.signin);
    initSignUp(forms.signup);
    const activate = initModeSwitch(forms, current);
    initGoogle(current);

    const params = new URLSearchParams(window.location.search);
    activate(params.get("mode") === "signup" ? "signup" : "signin");
  });
})();
