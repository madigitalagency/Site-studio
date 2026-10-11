true
# Lecture seule, rien n'est modifié. À lancer sur le VPS : bash /root/lecture-lot6.sh > /root/lecture-lot6.txt ; puis coller le contenu.
# Donne les réglages dont le Studio a besoin pour s'aligner sur le site principal : réseau Traefik, résolveur de certificat,
# point d'entrée, relais du formulaire vers n8n, nom des identifiants SMTP, hôte de l'éditeur n8n.
masque() { sed -E 's/((PASSWORD|SECRET|KEY|TOKEN|PASS|CREDENTIAL)[A-Z_]*=).*/\1<masqué>/I'; }
echo "## date"; date -u
echo; echo "## compose du site principal (/opt/madigitalagency)"
ls -la /opt/madigitalagency 2>/dev/null
for f in /opt/madigitalagency/docker-compose.yml /opt/madigitalagency/docker-compose.yaml /opt/madigitalagency/compose.yml /opt/madigitalagency/compose.yaml; do [ -f "$f" ] && { echo "--- $f"; masque < "$f"; }; done
echo; echo "## nginx du site principal"
find /opt/madigitalagency -maxdepth 3 -name "*.conf" -print -exec sh -c 'echo "--- $1"; cat "$1"' _ {} \; 2>/dev/null
echo; echo "## compose Traefik + n8n (/root)"
for f in /root/docker-compose.yml /root/docker-compose.yaml /root/compose.yml /root/compose.yaml; do [ -f "$f" ] && { echo "--- $f"; masque < "$f"; }; done
echo; echo "## configuration Traefik (fichiers)"
find /root /opt /etc/traefik -maxdepth 3 \( -name "traefik.yml" -o -name "traefik.yaml" -o -name "traefik.toml" -o -name "dynamic*.yml" -o -name "acme.json" \) 2>/dev/null | while read -r f; do echo "--- $f"; case "$f" in *acme.json) echo "(présent, non affiché)";; *) masque < "$f";; esac; done
echo; echo "## étiquettes Traefik des conteneurs"
for c in $(docker ps -q); do echo "--- $(docker inspect --format '{{.Name}}' "$c")"; docker inspect --format '{{range $k,$v := .Config.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' "$c" | grep -i traefik; docker inspect --format 'réseaux : {{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' "$c"; done
echo; echo "## réseaux Docker"
docker network ls
echo; echo "## variables n8n utiles (valeurs masquées sauf hôte, protocole, URL de webhook)"
docker inspect root-n8n-1 --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep -E '^(N8N_HOST|N8N_PROTOCOL|N8N_PORT|WEBHOOK_URL|N8N_EDITOR_BASE_URL|N8N_PROXY_HOPS|GENERIC_TIMEZONE)='
echo; echo "## flux n8n : noms, webhooks et types de nœuds d'envoi (base SQLite, lecture seule)"
docker exec root-n8n-1 sh -c 'ls /home/node/.n8n/*.sqlite 2>/dev/null; command -v sqlite3 >/dev/null && sqlite3 -readonly /home/node/.n8n/database.sqlite "select name, active from workflow_entity;" 2>/dev/null; command -v sqlite3 >/dev/null && sqlite3 -readonly /home/node/.n8n/database.sqlite "select webhookPath, method from webhook_entity;" 2>/dev/null; command -v sqlite3 >/dev/null && sqlite3 -readonly /home/node/.n8n/database.sqlite "select name, type from credentials_entity;" 2>/dev/null' 2>/dev/null || echo "(sqlite3 absent dans le conteneur : les exports de /root/sauvegardes/2026-10-06/ feront foi)"
echo; echo "## exports de flux sauvegardés le 06/10 (noms seulement)"
ls -la /root/sauvegardes/2026-10-06/ 2>/dev/null
for f in /root/sauvegardes/2026-10-06/*.json; do [ -f "$f" ] && { echo "--- $f"; grep -oE '"(name|path|type|httpMethod)": *"[^"]*"' "$f" | grep -vE '"type": *"(string|number|boolean|object)"' | sort -u | head -60; }; done
echo; echo "## fin"
