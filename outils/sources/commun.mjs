/* =========================================================================
   OUTILS PARTAGES PAR TOUTES LES SOURCES D'OFFRES.
   Chaque source renvoie des offres au meme format ; c'est ici qu'on
   normalise, qu'on devine la famille de contrat et qu'on filtre.
   ========================================================================= */

/* Mots-cles qui rendent une offre pertinente pour le sport business.
   Utilise uniquement pour les sources generalistes (agregateurs) : les
   offres venant d'un employeur du secteur sont pertinentes par nature. */
export const MOTS_CLES_SPORT = [
  "sport", "sportif", "sportive", "football", "rugby", "basket", "tennis",
  "esport", "olympique", "club", "fédération", "federation", "stade",
  "sponsoring", "sponsorship", "billetterie", "ticketing", "athlète", "athlete",
];

const RE_STAGE = /\b(stage|stagiaire|internship|intern)\b/i;
const RE_ALTERNANCE = /\b(alternance|alternant|apprentissage|apprenti|contrat pro|professionnalisation|apprentice)\b/i;
const RE_CDD = /\b(cdd|contrat à durée déterminée|fixed[- ]term|temporary|intérim|interim)\b/i;

/* La famille se lit d'abord dans le type de contrat annonce, sinon dans
   l'intitule. Une offre d'emploi qui n'est ni un stage, ni une alternance,
   ni un CDD est traitee comme un CDI : c'est le cas par defaut sur les
   sites carriere, qui annoncent rarement "CDI" en toutes lettres. */
export function deviner(famille, intitule, typeContrat) {
  if (famille) return famille;
  const texte = `${typeContrat || ""} ${intitule || ""}`;
  if (RE_ALTERNANCE.test(texte)) return "Alternance";
  if (RE_STAGE.test(texte)) return "Stage";
  if (RE_CDD.test(texte)) return null; // les CDD ne sont pas affiches
  return "CDI";
}

export function estEnFrance(lieu) {
  if (!lieu) return false;
  return /france|paris|lyon|marseille|lille|bordeaux|nantes|toulouse|nice|rennes|strasbourg|montpellier|grenoble|saint-denis|boulogne|levallois|issy|remote|télétravail|teletravail/i.test(lieu);
}

export function estPertinente(texte) {
  const bas = String(texte || "").toLowerCase();
  return MOTS_CLES_SPORT.some((mot) => bas.includes(mot));
}

export function nettoyer(html, longueur = 220) {
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, longueur);
}

/* Format unique consomme par offres.json, donc par la page. */
export function offre({ id, source, intitule, entreprise, lieu, famille, typeContrat, dateCreation, description, url }) {
  return {
    id: `${source}:${id}`,
    source,
    intitule: String(intitule || "").trim(),
    entreprise: String(entreprise || "").trim(),
    lieu: String(lieu || "").trim(),
    famille,
    typeContrat: String(typeContrat || "").trim(),
    dateCreation: dateCreation || "",
    description: nettoyer(description),
    url,
  };
}

/* Un appel reseau ne doit jamais faire tomber toute la recolte : une source
   en panne est signalee, les autres continuent. */
export async function jsonOuNull(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
    if (res.status === 204 || res.status === 404) return null;
    if (!res.ok) {
      console.warn(`  ! ${res.status} sur ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`  ! échec réseau sur ${url} — ${err.message}`);
    return null;
  }
}
