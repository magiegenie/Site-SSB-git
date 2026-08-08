/* =========================================================================
   ETAT DU COMPTE DANS LE HEADER (partage par toutes les pages).
   Bascule le lien "Se connecter" en "Mon espace" quand une session
   Supabase valide existe.

   Pourquoi lire localStorage plutot que le SDK : ce fichier tourne sur les
   10 pages du site alors que le SDK pese ~200 ko. Il ne sert qu'a l'etat
   VISUEL du header. La protection reelle des pages membres passe par
   SSBAuth.requireAuth(), qui interroge vraiment Supabase.
   ========================================================================= */
(function () {
  "use strict";

  var link = document.querySelector("[data-account-link]");
  if (!link) return;

  var key = window.SSB_SUPABASE_STORAGE_KEY;
  if (!key) return;

  function readSession() {
    var raw;
    try { raw = window.localStorage.getItem(key); } catch (e) { return null; }
    if (!raw) return null;

    // Le SDK stocke soit du JSON brut, soit "base64-<json encode>".
    if (raw.indexOf("base64-") === 0) {
      try { raw = atob(raw.slice(7)); } catch (e) { return null; }
    }
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  var session = readSession();
  if (!session || !session.access_token) return;

  // Session expiree : on laisse le header en mode invite plutot que
  // d'envoyer la personne vers une page qui la renverra aussitot.
  if (session.expires_at && session.expires_at * 1000 < Date.now()) return;

  link.setAttribute("href", "espace-membre.html");

  // Le lien contient un chip fleche en <span> : on ne remplace que le
  // premier noeud texte, sinon textContent effacerait la fleche.
  var label = null;
  for (var i = 0; i < link.childNodes.length; i++) {
    if (link.childNodes[i].nodeType === 3 && link.childNodes[i].nodeValue.trim()) {
      label = link.childNodes[i];
      break;
    }
  }
  if (label) label.nodeValue = "Mon espace";
  else link.textContent = "Mon espace";
})();
