# Plan de refonte MASTER — Site SSB

> Document unique de pilotage de la refonte. Fusionne les 3 analyses :
> 1. Audit anti-IA initial (`audit-anti-ia.md`)
> 2. Critique impeccable (score 27/40, `.impeccable/critique/`)
> 3. Study + audit hallmark de la référence **sportgensummit.com**
>
> Objectif client : atteindre le niveau de sportgensummit.com (dynamique, premium, « expérience sportive »), pas un empilement de sections qui fait IA.
> Mis à jour le 20/07/2026.

---

## 0. Direction actée (décisions validées)

- **Registre : SOMBRE IMMERSIF.** Fond navy profond, or lumineux, blanc. On abandonne le corps blanc/crème actuel.
- **Typo : serif display + sans bold (mix).** Fraunces conservé pour les grands titres émotionnels ; un sans bold introduit pour chiffres, labels, nav, UI et données (candidat à valider, ex. grotesk/géométrique bold ; on évite le pur Inter/Poppins qui fait IA).
- **Vrais visages + vraies preuves.** Fin des monogrammes KB/CD/TL et des noms inventés. Speakers actuels = fictifs → soit vrais intervenants + photos, soit requalification honnête (« intervenants types / profils représentés »). Bandeau « ils nous ont fait confiance » à requalifier honnêtement.
- **Énergie sport.** Motifs signature (traînées dorées lumineuses type lignes de vitesse), photos plein-cadre immersives, motion au scroll.

---

## 1. Système de design cible (à poser dans main.css avant tout)

### Couleurs (tokens)
- `--bg` : navy très profond (réf = `#000519`). Cible ~`#04101f` / `#000519`.
- `--surface` : navy légèrement plus clair pour cartes/panneaux (élévation par la lumière, pas par l'ombre sur fond sombre).
- `--ink-on-dark` : blanc cassé (`rgba(255,255,255,0.92)`) pour le corps ; interlignage +0.05 (texte clair sur sombre respire plus).
- **Or lumineux conservé** : `--gold #ffb607`, `--gold-soft #ffcf5c`. Sur fond sombre l'or *brille* (halo/glow léger autorisé ici, contrairement au fond clair).
- Sections claires ponctuelles autorisées en rupture (l'inverse du site actuel) : 1-2 respirations claires max, le reste sombre.

### Typographie
- **Fraunces** : grands titres hero + titres de section émotionnels (garde l'identité, nous distingue de la réf).
- **Sans bold** (à valider) : chiffres/stats, eyebrows requalifiés, labels UI, nav, prix, boutons. Poids 600-700, tracking serré.
- Nettoyer les polices mortes (PerfectlyNineties déclarée mais jamais chargée ; Gotham OTF → passer en woff2 auto-hébergé).

### Motion & motifs
- Révélations au scroll orchestrées (pas de fade-up uniforme sur tout).
- **Traînée dorée lumineuse** (SVG/CSS) comme fil visuel récurrent sur les sections sombres.
- Lenis : réduire `duration` de 1.1 → ~0.6 (le scroll « mou » est une cause du ressenti « lent »).

### Performance (bloquant pour le ressenti « lent »)
- Logos : `logos/` = 1,34 MB pour des vignettes ~40px. `france-rugby.png` = 674 KB (3840²). → redimensionner ~80px, convertir WebP (<5 KB pièce).
- Hero : `hero-amphi.jpg` 466 KB → compresser, `fetchpriority=high` (déjà eager, OK).
- 36/38 images sans `width`/`height` → ajouter les dimensions (anti-CLS).
- Polices woff2 auto-hébergées + `font-display: swap`.

---

## 2. Diagnostic consolidé (fusion des 3 analyses, dédupliqué)

Légende statut : ✅ déjà traité (Lots A-C) · 🔴 à faire · 🟡 partiel.

| Thème | Constat (source) | Statut |
|-------|------------------|--------|
| Registre clair-plat vs sombre-immersif | Corps 100% blanc, aucune ambiance sport (hallmark + impeccable P0) | 🔴 cœur de la refonte |
| Monotonie tonale, 0 rupture | 13 sections quasi toutes blanches ; « bloc sombre » rend en off-white (impeccable P0) | 🟡 filets retirés, mais fond toujours clair |
| Hero pas immersif | Réf = image plein-cadre + titre blanc/or ; nous = image sage (hallmark) | 🔴 |
| Speakers sans visage | Monogrammes + noms inventés vs vrais visages+logos de la réf (impeccable P1, hallmark major) | 🔴 |
| Bandeau « confiance » trompeur | FIFA/PSG sous « ils nous ont fait confiance » (impeccable P1) | 🔴 requalifier |
| 17 CTA, 2 actions concurrentes | Book-a-call ×8 / Adhérer ×6, aucune priorité (impeccable P0) | 🔴 |
| Prix jamais montré sur la home | « 2,99-8,99 € » cité 3× sans tableau (impeccable P2) | 🔴 |
| Pic « communauté » (galaxy) neutralisé | Titre gris 1,2:1 illisible, vignettes minuscules (impeccable P1) | 🔴 |
| Lenteur perçue | Lenis 1.1 + images lourdes + polices OTF (impeccable P1, hallmark) | 🔴 |
| Eyebrow sur chaque section | Tic de gabarit (hallmark major, détecteur) | 🟡 à raréfier |
| Marqueurs numérotés 01-04 | Détecteur `numbered-section-markers` ; OK pour le parcours, déco ailleurs | 🟡 |
| Filets décoratifs | trustband, step, mission (mon audit + mémoire) | ✅ retirés |
| Témoignages cartes 5★ | Refondus en éditorial | ✅ |
| Grilles de cartes identiques | Voices/roadmap/trio/showcase refondus | ✅ |
| Cibles tactiles mobiles < 44px | Burger 26×16, footer/réseaux 30-34px (impeccable P2) | 🔴 |
| mobilebar aria-hidden focusable | Incohérence clavier/SR (impeccable P2) | 🔴 |
| Contraste or/crème 4,58:1 | Limite (impeccable P3) | 🟡 réglé par le passage au sombre |

---

## 3. Plan page par page

> Principe : on bascule d'abord le **système sombre global** dans `main.css` (cascade sur les 10 pages), puis on ajuste chaque page. Ordre conseillé en §4.

### home — index.html (priorité 1, la vitrine)
- Hero : image amphi plein-cadre assombrie + titre Fraunces blanc/or split (« Le sport business, » blanc / « sans filtre. » or). Une seule action n°1 (Adhérer), Book-a-call secondaire discret.
- Bandeau confiance : requalifier (« Clubs et institutions représentés par nos intervenants ») + logos blancs sur navy.
- Section communauté (galaxy) : la transformer en vrai moment fort — mur d'images immersif plein-cadre sur navy, titre lisible, ou grille photo « la communauté en action ».
- Speakers : vrais visages (ou requalifier honnêtement) sur cartes navy + logo entreprise.
- Ajouter un mini-comparatif des 3 paliers (prix visible) avant le CTA final.
- Réduire les CTA : ~4 points de conversion rythmés, pas un par section.
- Introduire 1-2 motifs « traînée dorée » entre sections sombres.

### devenir-adherent.html
- Passer les cartes pricing sur navy (le palier Gold déjà en marine → étendre la logique). Or lumineux sur les prix.
- FAQ accordéon sur fond sombre.
- Un seul CTA final clair.

### devenir-partenaire.html
- Stats en grands chiffres or sur navy (déjà ouvertes, à basculer sombre).
- Trio formats déjà éditorial → adapter au sombre.
- Bloc « réseau de décideurs » = vraie section immersive navy + photo.

### evenements.html
- Liste d'événements sur navy, jauges d'inscription en or lumineux.
- Galerie 3D (gallery3d) : déjà un point fort, la mettre en valeur sur fond sombre.
- Vérifier la performance de gallery3d (reflow/frame).

### nos-intervenants.html
- **Déjà sombre (chroma cards navy + spotlight)** → c'est la page la plus proche de la cible, sert de référence interne.
- Remplacer monogrammes par vrais visages quand dispo.

### qui-sommes-nous.html
- Mission/valeurs/statements → fond sombre, garder l'escalier.
- Team-grid : vrais visages sur tuiles navy (déjà monogrammes navy, upgrader en photos).
- Statements zig-zag conservés, photos plein-cadre.

### book-a-call.html
- Formulaire sur navy, champs sombres lisibles (contraste AA).
- Section CTA « prochaine conférence » : fond à réharmoniser avec le nouveau système (fini le débat crème/blanc, ce sera navy).

### connexion.html
- Split-screen : visuel navy immersif + formulaire. Contraste AA sur champs.

### mentions-legales.html / confidentialite.html
- Pages légales : texte long lisible. Peuvent rester plus sobres mais cohérentes (navy + texte clair, mesure 65-75ch).

### Global (tous fichiers)
- Nav + footer : version sombre. Cibles tactiles ≥44px (burger, liens footer, réseaux, flèches).
- mobilebar : retirer `aria-hidden`, un seul CTA primaire.
- Bump cache assets (v19) au déploiement.
- Retirer `noindex,nofollow` en prod.

---

## 4. Ordre d'exécution conseillé

1. **Fondations sombres** dans `main.css` : tokens couleurs (bg/surface/ink-on-dark), typo (ajout sans bold), Lenis 0.6, nettoyage polices. → cascade immédiate sur les 10 pages.
2. **Performance images** : redimensionner/convertir logos + hero en WebP, ajouter width/height. (Débloque le « lent ».)
3. **home** (index) : hero immersif, communauté, speakers, prix visible, CTA rationalisés, motif doré.
4. **Pages de conversion** : devenir-adherent (pricing), devenir-partenaire, book-a-call.
5. **Pages contenu** : qui-sommes-nous, evenements, nos-intervenants (déjà proche).
6. **Finitions** : connexion, légales, accessibilité mobile (cibles 44px, mobilebar), bump cache, retrait noindex.
7. **Re-critique** `/impeccable critique index.html` pour mesurer la progression du score.

---

## 5. Ce qu'on garde absolument (acquis à ne pas casser)
- L'or comme couleur signature (il brillera mieux sur sombre).
- Micro-détails premium : liseré spéculaire des CTA, curseur-pilule de nav, spotlight chroma.
- Accessibilité : skip-link, focus-visible, reduced-motion, alt.
- Les refontes Lot A-C (voices éditorial, escaliers, filets retirés) : compatibles avec le passage au sombre.
- Pas de tirets cadratins, pas de filets horizontaux décoratifs (règles permanentes).
