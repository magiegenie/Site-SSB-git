/* =========================================================================
   JOOBLE — méta-moteur, API partenaire gratuite.
   Clé à demander sur https://fr.jooble.org/api/about, puis à mettre dans le
   secret GitHub JOOBLE_API_KEY.
   ========================================================================= */

import { offre, deviner, jsonOuNull, estPertinente } from "./commun.mjs";

const RECHERCHES = [
  { famille: null, keywords: "sport business" },
  { famille: null, keywords: "marketing sportif" },
  { famille: "Stage", keywords: "stage sport marketing" },
  { famille: "Alternance", keywords: "alternance sport" },
];

export const nom = "Jooble";

export async function collecter() {
  const cle = process.env.JOOBLE_API_KEY;
  if (!cle) {
    console.log("  → ignorée (JOOBLE_API_KEY absente)");
    return [];
  }

  const offres = [];
  for (const recherche of RECHERCHES) {
    const data = await jsonOuNull(`https://fr.jooble.org/api/${cle}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: recherche.keywords, location: "France", page: "1" }),
    });
    for (const j of (data && data.jobs) || []) {
      const intitule = j.title || "";
      if (!estPertinente(`${intitule} ${j.snippet || ""} ${j.company || ""}`)) continue;
      const famille = deviner(recherche.famille, intitule, j.type || "");
      if (!famille) continue;
      offres.push(offre({
        id: j.id || j.link,
        source: "Jooble",
        intitule,
        entreprise: j.company || "",
        lieu: j.location || "",
        famille,
        typeContrat: j.type || "",
        dateCreation: j.updated || "",
        description: j.snippet,
        url: j.link,
      }));
    }
  }
  return offres;
}
