/* =========================================================================
   ADZUNA — agrégateur, API officielle gratuite (quota généreux).
   Identifiants à créer sur https://developer.adzuna.com/, puis à mettre
   dans les secrets GitHub ADZUNA_APP_ID / ADZUNA_APP_KEY.
   ========================================================================= */

import { offre, deviner, jsonOuNull, estPertinente } from "./commun.mjs";

const BASE = "https://api.adzuna.com/v1/api/jobs/fr/search";

const RECHERCHES = [
  { famille: null, what: "sport business" },
  { famille: null, what: "marketing sportif" },
  { famille: null, what: "sponsoring sportif" },
  { famille: "Stage", what: "stage sport" },
  { famille: "Alternance", what: "alternance sport" },
];

export const nom = "Adzuna";

export async function collecter() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    console.log("  → ignorée (ADZUNA_APP_ID / ADZUNA_APP_KEY absents)");
    return [];
  }

  const offres = [];
  for (const recherche of RECHERCHES) {
    const url = new URL(`${BASE}/1`);
    url.searchParams.set("app_id", appId);
    url.searchParams.set("app_key", appKey);
    url.searchParams.set("results_per_page", "50");
    url.searchParams.set("what", recherche.what);
    url.searchParams.set("content-type", "application/json");

    const data = await jsonOuNull(url);
    for (const r of (data && data.results) || []) {
      const intitule = r.title || "";
      // Adzuna ratisse large : on écarte ce qui n'a rien à voir avec le sport.
      if (!estPertinente(`${intitule} ${r.description || ""} ${(r.company && r.company.display_name) || ""}`)) continue;
      const famille = deviner(recherche.famille, intitule, r.contract_type || "");
      if (!famille) continue;
      offres.push(offre({
        id: r.id,
        source: "Adzuna",
        intitule,
        entreprise: (r.company && r.company.display_name) || "",
        lieu: (r.location && r.location.display_name) || "",
        famille,
        typeContrat: r.contract_time || r.contract_type || "",
        dateCreation: r.created,
        description: r.description,
        url: r.redirect_url,
      }));
    }
  }
  return offres;
}
