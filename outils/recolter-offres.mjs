#!/usr/bin/env node
/* =========================================================================
   RECOLTE DES OFFRES — stage / alternance / CDI, sport business.
   Source : API France Travail (gratuite, officielle — pas de scraping de
   jobboards, qui violerait leurs CGU). Écrit assets/data/offres.json,
   lu ensuite par offres.html côté navigateur.

   Lancé chaque jour par .github/workflows/recolte-offres.yml.
   Credentials à créer sur https://francetravail.io (application avec les
   scopes "api_offresdemploiv2 o2dsoffre"), puis à mettre dans les secrets
   GitHub du repo :
     FRANCE_TRAVAIL_CLIENT_ID
     FRANCE_TRAVAIL_CLIENT_SECRET
   ========================================================================= */

import { writeFile } from "node:fs/promises";

const CLIENT_ID = process.env.FRANCE_TRAVAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Il manque FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET dans l'environnement.");
  process.exit(1);
}

const TOKEN_URL = "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const SEARCH_URL = "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";
const MAX_PAR_RECHERCHE = 50;
const MAX_TOTAL = 60;
const SORTIE = new URL("../assets/data/offres.json", import.meta.url);

// Une recherche par famille de contrat : les stages n'ont pas de code
// "typeContrat" dédié dans l'API, on les cible donc par mots-clés.
const RECHERCHES = [
  { label: "CDI", params: { typeContrat: "CDI", motsCles: "sport business,marketing sportif,sponsoring sportif,événementiel sportif,droits médias sport" } },
  { label: "Alternance", params: { alternance: "true", motsCles: "sport business,marketing sportif,communication sport,événementiel sportif" } },
  { label: "Stage", params: { motsCles: "stage marketing sportif,stage sport business,stage événementiel sportif,stage communication sport,stage sponsoring" } },
];

async function getToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: "api_offresdemploiv2 o2dsoffre",
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Authentification France Travail échouée : ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function chercher(token, params) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("range", `0-${MAX_PAR_RECHERCHE - 1}`);
  url.searchParams.set("sort", "1"); // tri par date de création décroissante
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  // 204 = aucune offre trouvée pour cette recherche, ce n'est pas une erreur.
  if (res.status === 204) return [];
  if (!res.ok) {
    console.error(`Recherche échouée (${res.status}) pour ${url}`);
    return [];
  }
  const json = await res.json();
  return json.resultats || [];
}

function normaliser(offre, familleLabel) {
  const lieu = offre.lieuTravail && offre.lieuTravail.libelle ? offre.lieuTravail.libelle : "";
  const description = (offre.description || "").replace(/\s+/g, " ").trim().slice(0, 220);
  return {
    id: offre.id,
    intitule: offre.intitule || "",
    entreprise: (offre.entreprise && offre.entreprise.nom) || "",
    lieu,
    famille: familleLabel,
    typeContrat: offre.typeContratLibelle || offre.typeContrat || "",
    dateCreation: offre.dateCreation || "",
    description,
    url: (offre.origineOffre && offre.origineOffre.urlOrigine) || `https://candidat.francetravail.fr/offres/recherche/detail/${offre.id}`,
  };
}

async function main() {
  const token = await getToken();
  const parId = new Map();

  for (const recherche of RECHERCHES) {
    const resultats = await chercher(token, recherche.params);
    for (const offre of resultats) {
      if (!offre.id || parId.has(offre.id)) continue;
      parId.set(offre.id, normaliser(offre, recherche.label));
    }
  }

  const offres = Array.from(parId.values())
    .sort((a, b) => (a.dateCreation < b.dateCreation ? 1 : -1))
    .slice(0, MAX_TOTAL);

  const sortie = { genereLe: new Date().toISOString(), offres };
  await writeFile(SORTIE, JSON.stringify(sortie, null, 2) + "\n", "utf8");
  console.log(`${offres.length} offres écrites dans ${SORTIE.pathname}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
