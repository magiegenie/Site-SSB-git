/* =========================================================================
   NAV BAR — menu mobile du header (partagé par toutes les pages).
   Le bouton burger ouvre/ferme le panneau .hdr-nav ; fermeture au clic
   extérieur, à Échap, et au clic sur un lien.
   ========================================================================= */
(function () {
  "use strict";

  var btn = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("nav-menu");
  if (!btn || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!nav.classList.contains("is-open"));
  });

  document.addEventListener("click", function (e) {
    if (!nav.classList.contains("is-open")) return;
    if (nav.contains(e.target) || btn.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      btn.focus();
    }
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
})();
