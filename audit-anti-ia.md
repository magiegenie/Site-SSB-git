# Audit anti-IA — Site Sorbonne Sport Business

> Audit réalisé le 20/07/2026 contre la checklist anti-IA de Melvin (10 points).
> Objectif : identifier ce qui « fait IA » puis corriger. Plan élaboré avec Fable 5, exécution prévue avec Opus 4.8.

---

## Verdict global

Le site est au-dessus du template IA moyen (palette marine+or propre, Fraunces, vraies animations signature, grilles éditoriales asymétriques par endroits). Mais il coche encore une grosse partie du bingo IA, surtout en bas de page d'accueil et dans les micro-détails (filets, hovers génériques, cartes en séries).

---

## Constats par critère de la checklist

### 1. Templates de sections — PROBLÈME MAJEUR
- Bas d'index.html = séquence cliché exacte : Témoignages 3 cartes → Steps 01-04 → FAQ accordéon → CTA final centré plein écran (index.html:279→365).
- devenir-adherent.html = Hero → Pricing 3 paliers (badge « Le plus complet ») → FAQ → CTA : template SaaS type.
- CTA final `cta-push` plein écran répété à l'identique en fin de 5 pages.
- Stats 4 colonnes dupliquées avec les mêmes chiffres (1200/250/40) sur index.html:127 et devenir-partenaire.html:73.
- Le haut d'index est bon (galaxie particules, darkblock, carrousels) : à préserver.

### 2. Couleurs — OK
- Marine (#041a35, #062750) + or (#ffb607) sur blanc/crème. Aucun violet/cyan IA. Identité réelle. Ne pas toucher.

### 3. Grille — PROBLÈME
- 7 grilles de cartes homogènes « numéro + titre + texte » : showcase (qui-sommes-nous:88), trio-card (devenir-partenaire:84), mission (index:187 + qui-sommes-nous:70), steps (index:304), tcard témoignages (index:279), plan pricing, team-grid 8 tuiles identiques.
- Zéro asymétrie volontaire : aucun margin négatif décoratif, aucune image qui déborde, aucun chevauchement, aucun grid-column span irrégulier. Tout est sage dans le conteneur centré.
- Layout `statement` figé : photo toujours à gauche (main.css:400/1211), pas de zig-zag.
- Points positifs existants : grilles 0.8fr/1.4fr, 1.05fr/1fr, 1.15fr/0.85fr ; en-têtes alignés à gauche.

### 4. Typographie — OK
- Fraunces + Lato, pas d'Inter/Poppins/Manrope. Vrais contrastes display (clamp jusqu'à 12rem), letter-spacing serré, numéros Fraunces italic. Ne pas toucher.

### 5. Animations — MIXTE
- Riches et à préserver : split-text par lignes, particules scroll, count-up chiffres, galerie 3D, brands scroll-pin, Ken Burns, liseré spéculaire, curseur pilule nav.
- Tell IA : socle `anim-fade` / `anim-up` (opacity 0→1 + translateY 42px) appliqué à quasi tout le contenu défilant (main.css:570-575).

### 6. Espace blanc — PROBLÈME
- Rythme binaire : 2 seuls paddings de section (`.section` clamp 72-170px, `.section--tight` clamp 48-100px, main.css:146-147).
- Alternance mécanique de fond blanc/crème une section sur deux.
- Paddings de cartes tous sur le même moule.

### 7. Langage visuel — FAIBLE
- Embryon : la pilule (radius 100px) + l'or en accent + numéros Fraunces italic.
- Mais pas de système graphique structurant ; empilement de composants-démo hétérogènes (chacun sa logique).

### 8. Images — PROBLÈME PONCTUEL
- Vraies photos d'événements (bon), mais placeholders gris `.ph--dark` visibles sur les cartes speakers d'index (section speakers) et les 4 valeurs de qui-sommes-nous : rendu « site pas fini ».

### 9. Micro-interactions — PROBLÈME
- Tell IA : translateY(-2/-4/-5px)+shadow sur tous boutons/cartes ; scale(1.05) systématique sur toutes les images.
- Riches existantes à préserver : curseur pilule nav, chroma spotlight souris, team-tile bio dépliable, rowlink padding-left.

### 10. Identité (test du logo) — MOYEN
- La palette marine/or est reconnaissable, mais la structure des pages ne l'est pas. Sans logo : « joli site template ».

### Règles mémoire Melvin (hors checklist)
- Tirets cadratins : AUCUN dans le contenu visible. Conforme.
- Filets horizontaux décoratifs : INFRACTIONS. Les pires :
  - `.trustband__label::before/::after` : deux traits encadrant le label « Ils nous ont fait confiance » (main.css:1150) + `.trustband` border-block (main.css:1147)
  - `.step` border-top 2px or (main.css:1183)
  - `.mission` border-top (main.css:486)
  - Profusion de border-top/bottom : rowlink, accordéons, simple-list, event-row, flow-step, chroma-card__info, plan__features, footer, statgrid en gap 1px sur fond ligne.
- Glassmorphism : 8 occurrences de backdrop-filter blur (header, mégamenu, hero__card, anchor-nav, brands-tabs, team-tile, mobilebar).
- Témoignages : 3 cartes identiques avec 5 étoiles pleines partout + avatars initiales = tell très fort.

---

## Plan de correction priorisé

### Lot A — Les tells les plus visibles (fort impact)
1. **Casser le bas d'index** : remplacer la séquence Témoignages-cartes → Steps → FAQ par des formes non-template :
   - Témoignages : passer de 3 cartes 5★ à une composition éditoriale (une grande citation display en Fraunces + citations secondaires décalées, sans étoiles, sans cartes).
   - Steps 01-04 : passer de 4 colonnes bordées à une timeline horizontale animée qui se dessine au scroll (cohérent point 5 de la checklist), ou liste éditoriale asymétrique.
2. **Supprimer les filets décoratifs** : trustband::before/after + border-block, step border-top or, mission border-top. Remplacer par espacement/panneaux pleins (règle mémoire). Garder uniquement les séparateurs fonctionnels de listes (event-row, accordéons) en les affinant (couleur plus discrète) ou les remplacer par de l'espacement.
3. **Placeholders gris** : remplacer les `.ph--dark` speakers/valeurs par de vraies photos existantes (assets/img) ou par des compositions typographiques marine/or (initiales Fraunces géantes), pas de gris vide.
4. **Zig-zag statements** : alterner photo gauche/droite entre les statements (variante `.statement--flip`).

### Lot B — Grille et rythme (personnalité)
5. **Asymétrie** : introduire 2-3 débordements maîtrisés sur index (image statement qui déborde de la grille, carte témoignage qui chevauche la section suivante, chiffre display qui sort du conteneur). Pas partout : ponctuel et intentionnel.
6. **Rythme d'espace blanc** : créer 1-2 variantes de padding (`.section--airy` très ample autour des moments forts, `.section--snug`) et casser l'alternance mécanique blanc/crème (2 sections claires d'affilée puis un bloc sombre).
7. **Différencier les CTA finaux** : garder cta-push sur index seulement ; variantes plus simples/journalistiques sur les autres pages. Dédoublonner les stats (les retirer de devenir-partenaire ou changer leur forme).

### Lot C — Micro-détails (finition)
8. **Hovers** : remplacer les translateY+shadow génériques par le vocabulaire signature existant (liseré spéculaire, glissement latéral type rowlink, révélation). Limiter le scale(1.05) d'image aux cartes cliquables.
9. **Reveals** : réserver anim-up aux petits éléments ; étendre le split-text par lignes (déjà codé) aux titres de section ; reveal par clip-path pour les images (classe img-reveal déjà existante, sous-utilisée).
10. **Langage visuel** : systématiser le trio pilule + or + numéros Fraunces italic comme signature déclarée (par ex. tous les eyebrows avec numéro de section 01-06 en Fraunces italic or), et réduire le glassmorphism aux 2 usages nav (header, mobilebar).

### Contraintes d'exécution
- Ne pas toucher : palette, typo, hero, galaxie particules, galerie 3D, brands scroll-pin, curseur pilule nav, chroma spotlight.
- Respect absolu : pas de tirets cadratins, pas de nouveaux filets horizontaux.
- Bump cache assets à chaque lot (main.css v17+...).
- Vérifier chaque lot dans le preview (port 4328, serveur ssb-wolverine) avant de passer au suivant.
- Skills à mobiliser : frontend-design (direction artistique), ui-ux-pro-max (patterns de composants).
