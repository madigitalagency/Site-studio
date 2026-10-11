// Mise en ligne du site Studio : construction à l'heure de Paris, contrôle, envoi des pages (tar | ssh), puis des médias.
// Sécurité : le serveur ne garde QUE les médias utilisés par les pages en ligne. Les vidéos d'un épisode pas encore
// sorti ne partent qu'avec sa page, et tout média qui n'est plus référencé est retiré du serveur.
// Usage : node scripts/deploy.mjs [--dry] [--auto]
//   --dry  : construit, contrôle et calcule ce qui partirait, sans rien envoyer.
//   --auto : mode tâche planifiée ; ne fait rien si les pages construites sont identiques à la dernière version envoyée.
// Journal : work/deploy.log. Prérequis : clé SSH autorisée sur le VPS, /opt/studio préparé (procédure de mise en ligne).
import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';

const HOTE = process.env.STUDIO_SSH ?? 'root@72.62.16.73';
const BASE = '/opt/studio';
const SITE = 'https://studio.madigitalagency.net';
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const auto = args.includes('--auto');
mkdirSync('work', { recursive: true });
const journal = (m) => { const l = `${new Date().toISOString()} ${m}`; console.log(l); appendFileSync('work/deploy.log', l + '\n'); };
const sortie = auto ? 'pipe' : 'inherit';
const sh = (cmd) => { console.log('>', cmd); if (!dry) execSync(cmd, { stdio: sortie }); };
const ssh = (cmd) => sh(`ssh -o BatchMode=yes ${HOTE} "${cmd.replace(/"/g, '\\"')}"`);
const fichiers = (d, filtre, out = []) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) fichiers(p, filtre, out); else if (filtre(p)) out.push(p); } return out; };

try {
  // 1. Construire à l'heure de Paris (STUDIO_DATE et STUDIO_BROUILLONS retirés) et contrôler
  const env = { ...process.env }; delete env.STUDIO_DATE; delete env.STUDIO_BROUILLONS;
  execSync('npx astro build', { stdio: sortie, env });
  execSync('npm run check', { stdio: sortie });

  // 2. Empreinte des pages : en mode --auto, rien à faire si elles n'ont pas changé
  const textes = fichiers('dist', (p) => !p.startsWith(join('dist', 'media')) && /\.(html|xml|txt|css|js|json|webmanifest)$/.test(p)).sort();
  const empreinte = createHash('sha256');
  for (const f of textes) empreinte.update(f).update(readFileSync(f));
  const versionPages = empreinte.digest('hex');
  const dernier = existsSync('work/derniere-version.txt') ? readFileSync('work/derniere-version.txt', 'utf8').trim() : '';
  if (auto && versionPages === dernier) { journal('auto : pages inchangées, rien à envoyer'); process.exit(0); }

  // 3. Médias référencés par les pages construites (HTML, plans du site, JSON-LD, llms.txt) : seuls ceux-là sont en ligne
  const refs = new Set();
  for (const f of textes) for (const m of readFileSync(f, 'utf8').matchAll(/\/media\/([A-Za-z0-9._\-\/]+)/g)) refs.add(m[1].replace(/\/$/, ''));
  const racine = 'public/media';
  const local = {};
  const manquants = [];
  for (const r of refs) {
    const p = join(racine, r);
    if (existsSync(p) && statSync(p).isFile()) local[r] = createHash('sha256').update(readFileSync(p)).digest('hex');
    else manquants.push(r);
  }
  if (manquants.length) throw new Error(`médias référencés introuvables en local : ${manquants.slice(0, 5).join(', ')}`);

  // 4. Pages
  sh('tar -czf work/site.tgz -C dist --exclude=./media .');
  ssh(`mkdir -p ${BASE}/incoming`);
  sh(`scp -o BatchMode=yes work/site.tgz ${HOTE}:${BASE}/incoming/site.tgz`);
  ssh(`sh ${BASE}/release.sh ${BASE}/incoming/site.tgz`);

  // 5. Médias : différence avec le manifeste du serveur ; envoi des nouveaux, retrait de ceux qui ne sont plus utilisés
  writeFileSync('work/media-manifest.json', JSON.stringify(local, null, 1));
  let distant = {};
  if (!dry) {
    const r = spawnSync('ssh', ['-o', 'BatchMode=yes', HOTE, `cat ${BASE}/media-manifest.json 2>/dev/null || cat ${BASE}/media/manifest.json 2>/dev/null || echo {}`], { encoding: 'utf8' });
    try { distant = JSON.parse(r.stdout || '{}'); } catch { distant = {}; }
  }
  const aEnvoyer = Object.keys(local).filter((k) => distant[k] !== local[k]);
  const aRetirer = Object.keys(distant).filter((k) => !(k in local));
  journal(`${Object.keys(local).length} médias en ligne, ${aEnvoyer.length} à envoyer, ${aRetirer.length} à retirer${dry ? ' (simulation, manifeste du serveur non lu)' : ''}`);
  if (aEnvoyer.length) {
    writeFileSync('work/media-a-envoyer.txt', aEnvoyer.join('\n') + '\n');
    sh(`tar -czf work/media.tgz -C ${racine} -T work/media-a-envoyer.txt`);
    sh(`scp -o BatchMode=yes work/media.tgz ${HOTE}:${BASE}/incoming/media.tgz`);
    ssh(`mkdir -p ${BASE}/media && tar -xzf ${BASE}/incoming/media.tgz -C ${BASE}/media && rm -f ${BASE}/incoming/media.tgz`);
  }
  if (aRetirer.length) {
    writeFileSync('work/media-a-retirer.txt', aRetirer.join('\n') + '\n');
    sh(`scp -o BatchMode=yes work/media-a-retirer.txt ${HOTE}:${BASE}/incoming/media-a-retirer.txt`);
    // Retrait limité au dossier media (chemins relatifs sans « .. »), puis dossiers vides supprimés
    ssh(`cd ${BASE}/media && while IFS= read -r f; do case "$f" in *..*|/*) ;; *) rm -f -- "$f";; esac; done < ${BASE}/incoming/media-a-retirer.txt; find ${BASE}/media -mindepth 1 -type d -empty -delete; rm -f ${BASE}/incoming/media-a-retirer.txt`);
  }
  sh(`scp -o BatchMode=yes work/media-manifest.json ${HOTE}:${BASE}/media-manifest.json`);
  ssh(`rm -f ${BASE}/media/manifest.json`);

  // 6. Vérification
  if (!dry) {
    writeFileSync('work/derniere-version.txt', versionPages + '\n');
    const r = spawnSync('curl', ['-s', '-o', 'NUL', '-w', '%{http_code}', SITE + '/'], { encoding: 'utf8' });
    journal(`mise en ligne terminée, accueil : ${r.stdout}`);
  } else console.log('simulation terminée');
} catch (e) {
  journal(`ÉCHEC : ${String(e.message || e).split('\n')[0]}`);
  process.exit(1);
}
