# Récolte automatique des offres — sources et réglages

La page `offres.html` affiche `assets/data/offres.json`, régénéré chaque jour
à 6h par la GitHub Action `.github/workflows/recolte-offres.yml`, qui exécute
`outils/recolter-offres.mjs`.

**Aucun site n'est scrapé.** Toutes les sources sont des API officielles ou
publiques, prévues pour être consommées. C'est un choix assumé : LinkedIn,
Indeed, Glassdoor, Welcome to the Jungle, HelloWork, Cadremploi, JobTeaser,
Monster, Meteojob, L'Étudiant et Stagiaires.fr interdisent le scraping dans
leurs conditions d'utilisation, le bloquent techniquement, et pour certains le
poursuivent en justice. Le contenu d'une partie d'entre eux remonte malgré tout
ici, par la voie légale : via les agrégateurs qui ont, eux, une licence.

---

## Les trois couches

### 1. API publiques françaises

| Source | Clé nécessaire | Où la créer |
|---|---|---|
| **France Travail** | `FRANCE_TRAVAIL_CLIENT_ID` + `FRANCE_TRAVAIL_CLIENT_SECRET` | [francetravail.io](https://francetravail.io) — application avec les scopes `api_offresdemploiv2 o2dsoffre` |
| **La Bonne Alternance** (alimente aussi 1jeune1solution et alternance.fr) | `LA_BONNE_ALTERNANCE_API_KEY` | [api.gouv.fr/les-api/api-apprentissage](https://api.gouv.fr/les-api/api-apprentissage) |

### 2. Agrégateurs sous licence

| Source | Clé nécessaire | Où la créer |
|---|---|---|
| **Adzuna** | `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` | [developer.adzuna.com](https://developer.adzuna.com/) |
| **Jooble** | `JOOBLE_API_KEY` | [fr.jooble.org/api/about](https://fr.jooble.org/api/about) |

Ces deux-là sont des méta-moteurs : ils indexent déjà une bonne partie des
offres visibles sur Indeed, HelloWork ou Cadremploi. C'est le moyen légal de
récupérer ce contenu.

### 3. Sites carrière des employeurs — **aucune clé**

La couche la plus intéressante pour SSB, et la seule qui tourne sans rien
configurer. Les employeurs du sport publient leurs offres via des ATS
(logiciels de recrutement) qui exposent tous une API JSON publique :
Greenhouse, Lever, SmartRecruiters, Workable, Recruitee, Ashby.

Les offres viennent directement de l'employeur, donc elles sont plus
pertinentes qu'un résultat d'agrégateur généraliste, et il n'y a aucune
ambiguïté juridique.

La liste est dans **`outils/employeurs-sport.json`**. C'est le fichier à
enrichir dans le temps : plus il y a d'employeurs, plus la page est fournie.

---

## Ajouter un employeur

1. Ouvrir la page « Carrières » / « Jobs » de l'employeur.
2. Regarder l'URL de la liste des offres, et en déduire les deux valeurs :

| URL du site carrière | `ats` | `token` |
|---|---|---|
| `boards.greenhouse.io/AAA` | `greenhouse` | `AAA` |
| `jobs.lever.co/AAA` | `lever` | `AAA` |
| `jobs.smartrecruiters.com/AAA` | `smartrecruiters` | `AAA` |
| `apply.workable.com/AAA` | `workable` | `AAA` |
| `AAA.recruitee.com` | `recruitee` | `AAA` |
| `jobs.ashbyhq.com/AAA` | `ashby` | `AAA` |

3. Ajouter l'entrée dans `outils/employeurs-sport.json` :

```json
{ "nom": "Nom affiché", "ats": "greenhouse", "token": "AAA" }
```

Si l'employeur utilise un autre ATS (Workday et Taleo, notamment, n'ont pas
d'API publique), il n'est pas récupérable automatiquement.

> ⚠️ **Les employeurs actuellement listés sont des hypothèses de départ, non
> vérifiées.** Le journal de la GitHub Action affiche, employeur par employeur,
> le nombre d'offres récupérées. Ceux qui restent à 0 ont un mauvais token ou
> un ATS différent : à corriger ou à supprimer après le premier run.

---

## Régler les mots-clés et les filtres

- **Mots-clés sport** (utilisés pour filtrer les agrégateurs) :
  `MOTS_CLES_SPORT` dans `outils/sources/commun.mjs`.
- **Classement stage / alternance / CDI** : fonction `deviner()`, même fichier.
  Une offre reconnue comme CDD est écartée, une offre d'emploi non identifiée
  est traitée comme un CDI.
- **Restriction géographique** : fonction `estEnFrance()`, même fichier — les
  employeurs internationaux publient aussi des postes hors de France, qu'on
  écarte.
- **Nombre maximum d'offres affichées** : `MAX_TOTAL` dans
  `outils/recolter-offres.mjs`.

---

## Vérifier que ça marche

Onglet **Actions** du dépôt → *Récolte des offres* → **Run workflow**. Le
journal détaille chaque source, puis le total retenu. Si `offres.json` change,
l'Action le commite automatiquement et le site se met à jour.

En local :

```sh
FRANCE_TRAVAIL_CLIENT_ID=... FRANCE_TRAVAIL_CLIENT_SECRET=... node outils/recolter-offres.mjs
```

Sans aucune variable d'environnement, le script tourne quand même : il ignore
les sources à clé et n'interroge que les sites carrière.

---

## Ce qui reste manuel

Les offres du réseau SSB (partenaires, parrains, alumni) n'ont, par nature,
aucune API. Elles peuvent être ajoutées à la main dans `assets/data/offres.json`
— mais attention, l'Action écrase ce fichier à chaque passage. Pour en ajouter
durablement, il faudrait un second fichier `offres-ssb.json`, fusionné par le
script. À faire le jour où il y en aura.
