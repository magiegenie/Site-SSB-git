/* =========================================================================
   OFFRES — lit assets/data/offres.json (regenere chaque jour par la GitHub
   Action outils/recolter-offres.mjs) et remplit la grille.
   ========================================================================= */
(function () {
  "use strict";

  var grid = document.getElementById("offres-grid");
  var filtersEl = document.getElementById("offres-filters");
  if (!grid) return;

  var toutesLesOffres = [];
  var filtreActif = "tous";

  function echapper(texte) {
    var div = document.createElement("div");
    div.textContent = texte || "";
    return div.innerHTML;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try {
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function carte(offre) {
    var meta = [offre.entreprise, offre.lieu].filter(Boolean).join(" — ");
    return (
      '<a class="offre-card" href="' + echapper(offre.url) + '" target="_blank" rel="noopener">' +
      '<span class="offre-badge">' + echapper(offre.famille) + "</span>" +
      '<span class="offre-titre">' + echapper(offre.intitule) + "</span>" +
      (meta ? '<span class="offre-meta">' + echapper(meta) + "</span>" : "") +
      (offre.description ? '<span class="offre-desc">' + echapper(offre.description) + "…</span>" : "") +
      '<span class="offre-date">' + echapper(formatDate(offre.dateCreation)) + "</span>" +
      "</a>"
    );
  }

  function rendre() {
    var chargement = document.getElementById("offres-loading");
    if (chargement) chargement.remove();
    var liste = toutesLesOffres.filter(function (o) {
      return filtreActif === "tous" || o.famille === filtreActif;
    });
    if (!liste.length) {
      grid.innerHTML = "";
      grid.insertAdjacentHTML(
        "afterend",
        '<p class="offres-empty" id="offres-empty">Aucune offre dans cette catégorie pour le moment. Revenez bientôt, la liste se met à jour chaque jour.</p>'
      );
      return;
    }
    var ancienVide = document.getElementById("offres-empty");
    if (ancienVide) ancienVide.remove();
    grid.innerHTML = liste.map(carte).join("");
  }

  if (filtersEl) {
    filtersEl.addEventListener("click", function (e) {
      var bouton = e.target.closest("[data-filtre]");
      if (!bouton) return;
      filtreActif = bouton.dataset.filtre;
      filtersEl.querySelectorAll(".offres-filter").forEach(function (b) {
        b.classList.toggle("is-active", b === bouton);
        b.setAttribute("aria-pressed", b === bouton ? "true" : "false");
      });
      rendre();
    });
  }

  fetch("assets/data/offres.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("offres.json introuvable");
      return res.json();
    })
    .then(function (data) {
      toutesLesOffres = (data && data.offres) || [];
      rendre();
    })
    .catch(function () {
      var chargement = document.getElementById("offres-loading");
      if (chargement) chargement.remove();
      grid.innerHTML = "";
      grid.insertAdjacentHTML(
        "afterend",
        '<p class="offres-empty" id="offres-empty">Impossible de charger les offres pour le moment. Réessayez un peu plus tard.</p>'
      );
    });
})();
