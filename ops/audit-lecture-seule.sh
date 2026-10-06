#!/usr/bin/env bash
# Lot 0 — audit du VPS en LECTURE SEULE (CDC v2 §10.2). Ne modifie rien.
# Usage : ssh root@<ip> bash < ops/audit-lecture-seule.sh > audit.txt
set +e
sec(){ echo; echo "=================================================================="; echo "## $1"; echo "=================================================================="; }
sec "Système"; hostname; date -u; lsb_release -a 2>/dev/null; uname -r; uptime; ls /var/run/reboot-required* 2>/dev/null && echo "REDÉMARRAGE REQUIS" || echo "pas de redémarrage requis"
sec "Mises à jour en attente"; apt list --upgradable 2>/dev/null | head -60; echo "unattended-upgrades :"; dpkg -l unattended-upgrades 2>/dev/null | tail -1; cat /etc/apt/apt.conf.d/20auto-upgrades 2>/dev/null
sec "Ports en écoute (ss)"; ss -tulpn
sec "Docker : conteneurs et ports publiés"; docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null || echo "docker absent"
sec "Docker : images (versions)"; docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}' 2>/dev/null | head -30
sec "n8n : version et variables d'environnement (sans valeurs secrètes)"
for c in $(docker ps --format '{{.Names}}' 2>/dev/null | grep -i n8n); do echo "conteneur: $c"; docker exec "$c" n8n --version 2>/dev/null; docker inspect "$c" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep -iE '^N8N_|^WEBHOOK|^GENERIC' | sed -E 's/=(.*)/=<valeur>/' ; done
sec "Pare-feu ufw"; ufw status verbose 2>/dev/null || echo "ufw absent"
sec "fail2ban"; fail2ban-client status 2>/dev/null || echo "fail2ban absent"; fail2ban-client status sshd 2>/dev/null | head -12
sec "SSH : configuration effective"; sshd -T 2>/dev/null | grep -Ei '^(passwordauthentication|permitrootlogin|kbdinteractiveauthentication|pubkeyauthentication|allowusers|port|maxauthtries) '
sec "SSH : clés autorisées (empreintes)"; for f in /root/.ssh/authorized_keys /home/*/.ssh/authorized_keys; do [ -f "$f" ] && { echo "$f :"; ssh-keygen -lf "$f" 2>/dev/null; }; done
sec "Utilisateurs avec shell"; grep -E '/bin/(ba)?sh$' /etc/passwd; echo "sudoers :"; getent group sudo
sec "nginx : installé où ?"; which nginx && nginx -v 2>&1; systemctl is-active nginx 2>/dev/null; ls /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null
sec "nginx : configuration complète (nginx -T)"; nginx -T 2>/dev/null || echo "nginx -T indisponible sur l'hôte (peut-être en conteneur)"
sec "Certificats Let's Encrypt"; ls /etc/letsencrypt/live 2>/dev/null; certbot certificates 2>/dev/null | head -40; systemctl list-timers 2>/dev/null | grep -i certbot
sec "Sites servis : racines et tailles"; du -sh /var/www/* 2>/dev/null
sec "DNS vus depuis le serveur"; for h in madigitalagency.net www.madigitalagency.net studio.madigitalagency.net; do printf "%s -> " "$h"; getent hosts "$h" || echo "(aucun)"; done; curl -s -4 ifconfig.me; echo " (IP publique sortante)"
sec "Connexions récentes"; last -n 15 2>/dev/null; echo "--- échecs/acceptations auth (50 dernières) ---"; grep -iE 'accepted|failed password|invalid user' /var/log/auth.log 2>/dev/null | tail -50 || journalctl -u ssh --no-pager -n 50 2>/dev/null | grep -iE 'accepted|failed|invalid'
sec "Disque et mémoire"; df -h / /var 2>/dev/null; free -h
sec "Sauvegardes et snapshots (indices)"; ls /root/*.sh /opt 2>/dev/null; crontab -l 2>/dev/null; ls /etc/cron.d 2>/dev/null
echo; echo "FIN AUDIT (lecture seule)"
