/* =========================================================================
   ESPACE MEMBRE — garde d'acces + remplissage des infos reelles du compte.
   Depend de vendor/supabase.js, common/supabase-config.js et
   common/supabase-auth.js (charges avant ce fichier).

   Regle tenue ici : on n'affiche que ce que la session contient vraiment
   (nom, email, confirmation, date de creation). Aucun palier d'adhesion
   n'est affiche comme actif, parce que le site n'a pas encore de paiement
   en ligne : ce serait faux.
   ========================================================================= */
(function () {
  "use strict";

  var auth = window.SSBAuth;

  function text(sel, value) {
    var el = document.querySelector(sel);
    if (!el) return;
    el.textContent = value;
    el.classList.remove("is-loading");
  }

  function firstName(fullName, email) {
    if (fullName) {
      var first = String(fullName).trim().split(/\s+/)[0];
      if (first) return first;
    }
    return email ? String(email).split("@")[0] : "";
  }

  function formatDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    try {
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return d.toLocaleDateString();
    }
  }

  function openGate() {
    var gate = document.querySelector("[data-gate]");
    if (gate) gate.classList.add("is-done");
  }

  function fill(user) {
    var meta = user.user_metadata || {};
    var name = meta.name || "";
    var prenom = firstName(name, user.email);

    text("[data-greeting]", prenom ? "Bonjour " + prenom + "." : "Bonjour.");
    text("[data-name]", name || "—");
    text("[data-email]", user.email || "—");
    text("[data-since]", formatDate(user.created_at));

    var badge = document.querySelector("[data-confirmed]");
    if (badge && user.email_confirmed_at) badge.hidden = false;
  }

  function initSignOut() {
    var btn = document.querySelector("[data-signout]");
    if (!btn || !auth) return;
    btn.addEventListener("click", function () {
      btn.disabled = true;
      btn.textContent = "Déconnexion…";
      auth.signOut("index.html");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!auth) {
      // Sans SDK charge, on ne peut ni verifier ni afficher : on renvoie
      // vers la connexion plutot que de laisser une page vide.
      window.location.href = "connexion.html";
      return;
    }

    auth.requireAuth("connexion.html").then(function (session) {
      if (!session) return; // requireAuth a deja declenche la redirection
      fill(session.user);
      initSignOut();
      openGate();
    });
  });
})();

/* Signale au watchdog inline que le script s est execute sans planter. */
document.documentElement.classList.add("js-ok");
