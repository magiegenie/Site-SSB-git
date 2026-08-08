/* =========================================================================
   NAV BAR — menu mobile + groupes déroulants du header (toutes pages).
   Le bouton burger ouvre/ferme le panneau .hdr-nav ; les boutons de groupe
   (.nav-grp-btn) déplient leur sous-menu au clic (le survol est géré en
   CSS). Fermeture au clic extérieur, à Échap, et au clic sur un lien.
   ========================================================================= */
(function () {
  "use strict";

  var btn = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("nav-menu");
  if (!nav) return;

  function setOpen(open) {
    if (!btn) return;
    nav.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  }

  function closeGroups(except) {
    nav.querySelectorAll(".nav-grp.is-open").forEach(function (g) {
      if (g === except) return;
      g.classList.remove("is-open");
      var b = g.querySelector(".nav-grp-btn");
      if (b) b.setAttribute("aria-expanded", "false");
    });
  }

  if (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains("is-open"));
    });
  }

  nav.querySelectorAll(".nav-grp-btn").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var grp = b.parentElement;
      var willOpen = !grp.classList.contains("is-open");
      closeGroups(grp);
      grp.classList.toggle("is-open", willOpen);
      b.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
  });

  document.addEventListener("click", function (e) {
    if (!nav.contains(e.target) && (!btn || !btn.contains(e.target))) {
      closeGroups();
      if (nav.classList.contains("is-open")) setOpen(false);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeGroups();
    if (nav.classList.contains("is-open")) {
      setOpen(false);
      if (btn) btn.focus();
    }
  });

  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) {
      closeGroups();
      setOpen(false);
    }
  });
})();
