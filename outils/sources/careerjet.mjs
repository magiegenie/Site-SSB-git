/* =========================================================================
   CAREERJET — méta-moteur, API publique gratuite en self-service.
   Clé (« affid ») à créer sur https://www.careerjet.com/partners/api,
   puis à mettre dans le secret GitHub CAREERJET_AFFID.
   ========================================================================= */

import { offre, deviner, jsonOuNull, estPertinente } from "./commun.mjs";

const BASE = "https://search.api.careerjet.net/v4/query";

const RECHERCHES = [
  { famille: null, keywords: "sport business" },
  { famille: null, keywords: "marketing sportif" },
  { famille: null, keywords: "club sportif" },
  { famille: null, keywords: "fédération sportive" },
  { famille: "Stage", keywords: "stage sport marketing" },
  { famille: "Alternance", keywords: "alternance sport" },
];

export const nom = "Careerjet";

export async function collecter() {
  const affid = process.env.CAREERJET_AFFID;
  if (!affid) {
    console.log("  → ignorée (CAREERJET_AFFID absente)");
    return [];
  }

  const offres = [];
  for (const recherche of RECHERCHES) {
    const url = new URL(BASE);
    url.searchParams.set("affid", affid);
    url.searchParams.set("keywords", recherche.keywords);
    url.searchParams.set("location", "France");
    url.searchParams.set("pagesize", "50");
    // Exigés par l'API Careerjet, sans usage réel ici : appel serveur à serveur.
    url.searchParams.set("url", "https://www.sorbonnesportbusiness.fr/offres.html");
    url.searchParams.set("user_ip", "0.0.0.0");
    url.searchParams.set("user_agent", "SSB-recolte-offres/1.0");

    const data = await jsonOuNull(url);
    for (const j of (data && data.jobs) || []) {
      const intitule = j.title || "";
      if (!estPertinente(`${intitule} ${j.description || ""} ${j.company || ""}`)) continue;
      const famille = deviner(recherche.famille, intitule, "");
      if (!famille) continue;
      offres.push(offre({
        id: j.url,
        source: "Careerjet",
        intitule,
        entreprise: j.company || "",
        lieu: j.locations || "",
        famille,
        typeContrat: "",
        dateCreation: j.date || "",
        description: j.description,
        url: j.url,
      }));
    }
  }
  return offres;
}
