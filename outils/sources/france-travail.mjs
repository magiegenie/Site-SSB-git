/* =========================================================================
   FRANCE TRAVAIL — API officielle "Offres d'emploi v2".
   Clés à créer sur https://francetravail.io (scopes api_offresdemploiv2
   o2dsoffre), puis à mettre dans les secrets GitHub :
     FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET
   ========================================================================= */

import { offre, deviner, jsonOuNull } from "./commun.mjs";

const TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

const RECHERCHES = [
  { famille: "CDI", params: { typeContrat: "CDI", motsCles: "sport business,marketing sportif,sponsoring sportif,événementiel sportif,droits médias sport" } },
  { famille: "Alternance", params: { alternance: "true", motsCles: "sport business,marketing sportif,communication sport,événementiel sportif" } },
  { famille: "Stage", params: { motsCles: "stage marketing sportif,stage sport business,stage événementiel sportif,stage communication sport,stage sponsoring" } },
];

export const nom = "France Travail";

export async function collecter() {
  const id = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const secret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;
  if (!id || !secret) {
    console.log("  → ignorée (FRANCE_TRAVAIL_CLIENT_ID / _SECRET absents)");
    return [];
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: id,
      client_secret: secret,
      scope: "api_offresdemploiv2 o2dsoffre",
    }),
  });
  if (!res.ok) {
    console.warn(`  ! authentification refusée (${res.status})`);
    return [];
  }
  const token = (await res.json()).access_token;

  const offres = [];
  for (const recherche of RECHERCHES) {
    const url = new URL(SEARCH_URL);
    url.searchParams.set("range", "0-49");
    url.searchParams.set("sort", "1");
    for (const [k, v] of Object.entries(recherche.params)) url.searchParams.set(k, v);

    const data = await jsonOuNull(url, { headers: { Authorization: `Bearer ${token}` } });
    for (const o of (data && data.resultats) || []) {
      offres.push(offre({
        id: o.id,
        source: "France Travail",
        intitule: o.intitule,
        entreprise: (o.entreprise && o.entreprise.nom) || "",
        lieu: (o.lieuTravail && o.lieuTravail.libelle) || "",
        famille: deviner(recherche.famille, o.intitule, o.typeContratLibelle),
        typeContrat: o.typeContratLibelle || o.typeContrat || "",
        dateCreation: o.dateCreation,
        description: o.description,
        url: (o.origineOffre && o.origineOffre.urlOrigine) || `https://candidat.francetravail.fr/offres/recherche/detail/${o.id}`,
      }));
    }
  }
  return offres;
}
