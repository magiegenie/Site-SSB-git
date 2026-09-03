#!/usr/bin/env node
/* =========================================================================
   RECOLTE DES OFFRES — stage / alternance / CDI, sport business.

   Trois couches, toutes légales (API officielles ou publiques ; aucun
   scraping de jobboard, ce que leurs CGU interdisent) :

     1. API publiques françaises  — France Travail, La Bonne Alternance
     2. Agrégateurs sous licence  — Adzuna, Jooble
     3. Sites carrière employeurs — ATS (Greenhouse, Lever, SmartRecruiters,
                                   Workable, Recruitee, Ashby)

   Une source sans identifiants est simplement ignorée : le script tourne
   avec ce qu'il a, et la couche 3 fonctionne sans aucune clé.

   Écrit assets/data/offres.json, lu par offres.html.
   Lancé chaque jour par .github/workflows/recolte-offres.yml.
   Documentation des clés : OFFRES-SOURCES.md
   ========================================================================= */

import { writeFile } from "node:fs/promises";

import * as franceTravail from "./sources/france-travail.mjs";
import * as laBonneAlternance from "./sources/la-bonne-alternance.mjs";
import * as adzuna from "./sources/adzuna.mjs";
import * as jooble from "./sources/jooble.mjs";
import * as ats from "./sources/ats.mjs";

const SOURCES = [franceTravail, laBonneAlternance, adzuna, jooble, ats];
const MAX_TOTAL = 150;
const SORTIE = new URL("../assets/data/offres.json", import.meta.url);

/* Deux sources peuvent republier la même annonce : on déduplique sur
   l'intitulé + l'employeur, en gardant la première rencontrée. */
function clef(o) {
  return `${o.intitule} ${o.entreprise}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function main() {
  const toutes = [];
  const parSource = {};

  for (const source of SOURCES) {
    console.log(`\n▸ ${source.nom}`);
    let offres = [];
    try {
      offres = await source.collecter();
    } catch (err) {
      console.warn(`  ! source en échec, ignorée — ${err.message}`);
    }
    console.log(`  = ${offres.length} offre(s)`);
    parSource[source.nom] = offres.length;
    toutes.push(...offres);
  }

  const vues = new Set();
  const offres = toutes
    .filter((o) => {
      if (!o.url || !o.intitule || !o.famille) return false;
      const k = clef(o);
      if (vues.has(k)) return false;
      vues.add(k);
      return true;
    })
    .sort((a, b) => (a.dateCreation < b.dateCreation ? 1 : -1))
    .slice(0, MAX_TOTAL);

  const compte = { Stage: 0, Alternance: 0, CDI: 0 };
  for (const o of offres) if (compte[o.famille] !== undefined) compte[o.famille]++;

  await writeFile(SORTIE, JSON.stringify({ genereLe: new Date().toISOString(), compte, offres }, null, 2) + "\n", "utf8");

  console.log(`\n${offres.length} offres retenues — ${compte.Stage} stage(s), ${compte.Alternance} alternance(s), ${compte.CDI} CDI.`);
  if (!offres.length) {
    console.warn("Aucune offre : vérifier les clés d'API et les tokens employeurs.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
