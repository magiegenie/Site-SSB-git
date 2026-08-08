#!/bin/sh
# À exécuter UNE FOIS, au moment de la mise en production sur le domaine
# définitif : retire le noindex qui empêche aujourd'hui tout référencement.
#
#   ./outils/definir-domaine.sh https://www.le-vrai-domaine.fr
#   ./outils/mise-en-ligne.sh
#
# Les deux pages privées (connexion, espace membre) gardent leur noindex.

set -e
for f in *.html; do
  case "$f" in
    connexion.html|espace-membre.html) continue ;;
  esac
  perl -i -pe 's{\s*<meta name="robots" content="noindex, nofollow" />\n}{}' "$f"
done

echo "noindex retiré des pages publiques."
echo "Restent volontairement en noindex : connexion.html, espace-membre.html"
echo
echo "À faire ensuite, côté moteurs :"
echo "  1. Déclarer le site dans la Google Search Console"
echo "  2. Y soumettre le sitemap : \$DOMAINE/sitemap.xml"
echo "  3. Vérifier les données structurées : https://search.google.com/test/rich-results"
