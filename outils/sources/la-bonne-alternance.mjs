/* =========================================================================
   LA BONNE ALTERNANCE — API publique de l'État (api.apprentissage.beta.gouv.fr),
   qui alimente aussi 1jeune1solution et alternance.fr.
   Clé gratuite à demander sur https://api.gouv.fr/les-api/api-apprentissage,
   puis à mettre dans le secret GitHub LA_BONNE_ALTERNANCE_API_KEY.

   Recherche géographique obligatoire : on interroge autour de Paris, Lyon et
   Marseille avec un large rayon, sur les codes ROME du marketing, de la
   communication et du commercial — les portes d'entrée du sport business.

   Ces codes ROME couvrent TOUS les secteurs (luxe, banque, agroalimentaire...),
   pas seulement le sport : on filtre donc après coup sur le titre, la
   description et le nom de l'employeur, comme pour Adzuna et Jooble.
   ========================================================================= */

import { offre, deviner, jsonOuNull, estPertinente } from "./commun.mjs";

const BASE = "https://api.apprentissage.beta.gouv.fr/api/job/v1/search";

const ROMES = ["M1705", "E1103", "M1707", "M1706"]; // marketing, communication, stratégie commerciale, promotion des ventes
const ZONES = [
  { nom: "Paris", latitude: 48.8566, longitude: 2.3522 },
  { nom: "Lyon", latitude: 45.764, longitude: 4.8357 },
  { nom: "Marseille", latitude: 43.2965, longitude: 5.3698 },
];

export const nom = "La Bonne Alternance";

export async function collecter() {
  const cle = process.env.LA_BONNE_ALTERNANCE_API_KEY;
  if (!cle) {
    console.log("  → ignorée (LA_BONNE_ALTERNANCE_API_KEY absente)");
    return [];
  }

  const offres = [];
  for (const zone of ZONES) {
    const url = new URL(BASE);
    url.searchParams.set("latitude", zone.latitude);
    url.searchParams.set("longitude", zone.longitude);
    url.searchParams.set("radius", "100");
    url.searchParams.set("romes", ROMES.join(","));

    const data = await jsonOuNull(url, { headers: { Authorization: `Bearer ${cle}` } });
    // L'API renvoie { jobs: [...] } ; on reste tolérant sur la forme.
    const jobs = (data && (data.jobs || data.offers || data.data)) || [];
    for (const j of jobs) {
      const lieu = (j.workplace && (j.workplace.location && j.workplace.location.address)) || j.place?.city || "";
      const entreprise = (j.workplace && j.workplace.name) || j.company?.name || "";
      const url_offre = (j.apply && (j.apply.url || j.apply.phone)) || j.url || j.jobUrl;
      const intitule = j.offer?.title || j.title || "";
      const description = j.offer?.description || j.description || "";
      if (!url_offre) continue;
      if (!estPertinente(`${intitule} ${description} ${entreprise}`)) continue;
      offres.push(offre({
        id: j.identifier?.id || j.id || url_offre,
        source: "La Bonne Alternance",
        intitule,
        entreprise,
        lieu,
        famille: deviner(null, intitule, "alternance"),
        typeContrat: "Alternance",
        dateCreation: j.offer?.publication?.creation || j.createdAt || "",
        description,
        url: url_offre,
      }));
    }
  }
  return offres;
}
