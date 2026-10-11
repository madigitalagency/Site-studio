true
#!/bin/sh
# Bascule atomique d'une version du site Studio. Exécuté sur le VPS par scripts/deploy.mjs (ou à la main).
# Usage : sh /opt/studio/release.sh /opt/studio/incoming/site.tgz
# Décompresse dans releases/<horodatage>, vérifie, pointe current dessus, garde les 5 dernières versions.
set -eu
BASE=/opt/studio
TGZ="${1:-$BASE/incoming/site.tgz}"
[ -f "$TGZ" ] || { echo "archive absente : $TGZ" >&2; exit 1; }
STAMP=$(date -u +%Y-%m-%dT%H%M%SZ)
DEST="$BASE/releases/$STAMP"
mkdir -p "$DEST" "$BASE/media"
tar -xzf "$TGZ" -C "$DEST"
[ -f "$DEST/index.html" ] || { echo "index.html absent, version refusée" >&2; rm -rf "$DEST"; exit 1; }
# Lien relatif, résolu à l'identique dans le conteneur (/srv) et sur l'hôte (/opt/studio)
ln -sfn "releases/$STAMP" "$BASE/current.tmp" && mv -Tf "$BASE/current.tmp" "$BASE/current"
rm -f "$TGZ"
# Garde les 5 dernières versions
ls -1d "$BASE"/releases/* | sort | head -n -5 | xargs -r rm -rf
# nginx relit le lien à chaque requête : pas de rechargement nécessaire
echo "version $STAMP en ligne ($(find "$DEST" -name index.html | wc -l) pages)"
