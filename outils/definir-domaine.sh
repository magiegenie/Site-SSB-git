#!/bin/sh
# Change le domaine du site partout où il apparaît (canoniques, Open Graph,
# robots.txt, sitemap.xml, données structurées).
#
#   ./outils/definir-domaine.sh https://www.nouveau-domaine.fr
#
# Le domaine actuel est lu dans sitemap.xml : c'est la seule référence à tenir.

set -e
NOUVEAU="$1"
if [ -z "$NOUVEAU" ]; then
  echo "Usage : $0 https://www.mon-domaine.fr" >&2
  exit 1
fi
NOUVEAU=$(printf '%s' "$NOUVEAU" | sed 's:/*$::')   # pas de barre oblique finale

ACTUEL=$(grep -o '<loc>[^<]*</loc>' sitemap.xml | head -1 \
  | sed -e 's/<loc>//' -e 's|</loc>||' | awk -F/ '{print $1"//"$3}')
if [ -z "$ACTUEL" ]; then
  echo "Domaine actuel introuvable dans sitemap.xml" >&2
  exit 1
fi
if [ "$ACTUEL" = "$NOUVEAU" ]; then
  echo "Le domaine est déjà $NOUVEAU"
  exit 0
fi

echo "Remplacement de $ACTUEL par $NOUVEAU"
for f in *.html robots.txt sitemap.xml; do
  perl -i -pe "s{\Q$ACTUEL\E}{$NOUVEAU}g" "$f"
done
echo "Fait. Vérifiez : grep -rn '$NOUVEAU' sitemap.xml | head -3"
