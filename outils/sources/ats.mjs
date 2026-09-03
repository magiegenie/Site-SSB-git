/* =========================================================================
   SITES CARRIERE DES EMPLOYEURS DU SPORT.
   Les ATS (les logiciels de recrutement) exposent tous une API JSON publique,
   sans clé, prévue pour être consommée : c'est la voie la plus propre et la
   plus pertinente pour SSB, puisque les offres viennent directement des
   employeurs du secteur.

   La liste des employeurs est dans outils/employeurs-sport.json.
   Un employeur qui ne répond pas (token faux, ATS changé) est simplement
   ignoré, avec un avertissement dans le journal de l'Action.
   ========================================================================= */

import { readFile } from "node:fs/promises";
import { offre, deviner, jsonOuNull, estEnFrance } from "./commun.mjs";

export const nom = "Sites carrière (ATS)";

/* ------------------------------ GREENHOUSE ------------------------------ */
async function greenhouse(emp) {
  const data = await jsonOuNull(`https://boards-api.greenhouse.io/v1/boards/${emp.token}/jobs?content=true`);
  return ((data && data.jobs) || []).map((j) => ({
    id: j.id,
    intitule: j.title,
    lieu: (j.location && j.location.name) || "",
    typeContrat: "",
    dateCreation: j.updated_at,
    description: j.content,
    url: j.absolute_url,
  }));
}

/* --------------------------------- LEVER -------------------------------- */
async function lever(emp) {
  const data = await jsonOuNull(`https://api.lever.co/v0/postings/${emp.token}?mode=json`);
  return (Array.isArray(data) ? data : []).map((j) => ({
    id: j.id,
    intitule: j.text,
    lieu: (j.categories && j.categories.location) || "",
    typeContrat: (j.categories && j.categories.commitment) || "",
    dateCreation: j.createdAt ? new Date(j.createdAt).toISOString() : "",
    description: j.descriptionPlain || j.description,
    url: j.hostedUrl,
  }));
}

/* ----------------------------- SMARTRECRUITERS -------------------------- */
async function smartrecruiters(emp) {
  const data = await jsonOuNull(`https://api.smartrecruiters.com/v1/companies/${emp.token}/postings?limit=100`);
  return ((data && data.content) || []).map((j) => ({
    id: j.id,
    intitule: j.name,
    lieu: [j.location && j.location.city, j.location && j.location.country].filter(Boolean).join(", "),
    typeContrat: (j.typeOfEmployment && j.typeOfEmployment.label) || "",
    dateCreation: j.releasedDate,
    description: "",
    url: `https://jobs.smartrecruiters.com/${emp.token}/${j.id}`,
  }));
}

/* -------------------------------- WORKABLE ------------------------------ */
async function workable(emp) {
  const data = await jsonOuNull(`https://apply.workable.com/api/v1/widget/accounts/${emp.token}?details=true`);
  return ((data && data.jobs) || []).map((j) => ({
    id: j.shortcode || j.id,
    intitule: j.title,
    lieu: [j.city, j.country].filter(Boolean).join(", ") || j.location || "",
    typeContrat: j.employment_type || "",
    dateCreation: j.published_on || j.created_at || "",
    description: j.description,
    url: j.url || j.shortlink,
  }));
}

/* -------------------------------- RECRUITEE ----------------------------- */
async function recruitee(emp) {
  const data = await jsonOuNull(`https://${emp.token}.recruitee.com/api/offers/`);
  return ((data && data.offers) || []).map((j) => ({
    id: j.id,
    intitule: j.title,
    lieu: [j.city, j.country].filter(Boolean).join(", ") || j.location || "",
    typeContrat: j.employment_type_code || "",
    dateCreation: j.published_at || j.created_at || "",
    description: j.description,
    url: j.careers_url || j.careers_apply_url,
  }));
}

/* ---------------------------------- ASHBY ------------------------------- */
async function ashby(emp) {
  const data = await jsonOuNull(`https://api.ashbyhq.com/posting-api/job-board/${emp.token}`);
  return ((data && data.jobs) || []).map((j) => ({
    id: j.id,
    intitule: j.title,
    lieu: j.location || "",
    typeContrat: j.employmentType || "",
    dateCreation: j.publishedAt || "",
    description: j.descriptionPlain || "",
    url: j.jobUrl || j.applyUrl,
  }));
}

const CONNECTEURS = { greenhouse, lever, smartrecruiters, workable, recruitee, ashby };

export async function collecter() {
  const chemin = new URL("../employeurs-sport.json", import.meta.url);
  const employeurs = JSON.parse(await readFile(chemin, "utf8")).employeurs || [];

  const offres = [];
  for (const emp of employeurs) {
    const connecteur = CONNECTEURS[emp.ats];
    if (!connecteur) {
      console.warn(`  ! ATS inconnu pour ${emp.nom} : ${emp.ats}`);
      continue;
    }
    let brutes = [];
    try {
      brutes = await connecteur(emp);
    } catch (err) {
      console.warn(`  ! ${emp.nom} — ${err.message}`);
      continue;
    }
    let gardees = 0;
    for (const b of brutes) {
      if (!b.url || !b.intitule) continue;
      // Le site s'adresse à des étudiants en France : on écarte les postes
      // situés à l'étranger, que ces employeurs publient aussi.
      if (!estEnFrance(b.lieu)) continue;
      const famille = deviner(null, b.intitule, b.typeContrat);
      if (!famille) continue;
      offres.push(offre({
        id: `${emp.token}-${b.id}`,
        source: emp.nom,
        intitule: b.intitule,
        entreprise: emp.nom,
        lieu: b.lieu,
        famille,
        typeContrat: b.typeContrat,
        dateCreation: b.dateCreation,
        description: b.description,
        url: b.url,
      }));
      gardees++;
    }
    console.log(`  · ${emp.nom} (${emp.ats}) : ${gardees} offre(s) retenue(s) sur ${brutes.length}`);
  }
  return offres;
}
