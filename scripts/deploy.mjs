// Mise en ligne du site Studio : construction à la date du jour, contrôle, envoi des pages (tar | ssh) et des médias
// nouveaux ou modifiés (manifeste SHA-256), bascule atomique côté serveur par ops/server/release.sh.
// Usage : node scripts/deploy.mjs [--pages] [--media] [--dry]   (sans option : pages + médias)
// Prérequis : clé SSH autorisée sur le VPS, dossier /opt/studio préparé (voir la procédure de mise en ligne).
import { execSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const HOTE = process.env.STUDIO_SSH ?? 'root@72.62.16.73';
const BASE = '/opt/studio';
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const faireTout = !args.includes('--pages') && !args.includes('--media');
const sh = (cmd, opts = {}) => { console.log('>', cmd); if (!dry) execSync(cmd, { stdio: 'inherit', ...opts }); };
const ssh = (cmd) => sh(`ssh ${HOTE} "${cmd.replace(/"/g, '\\"')}"`);

// 1. Construire à la date réelle (seules les pièces publiées ou dont la date est passée apparaissent) et contrôler
if (faireTout || args.includes('--pages')) {
  const env = { ...process.env }; delete env.STUDIO_DATE; delete env.STUDIO_BROUILLONS;
  sh('npx astro build', { env });
  sh('npm run check');
  mkdirSync('work', { recursive: true });
  // Pages sans les médias (public/media est servi à part)
  sh('tar -czf work/site.tgz -C dist --exclude=./media .');
  ssh(`mkdir -p ${BASE}/incoming`);
  sh(`scp work/site.tgz ${HOTE}:${BASE}/incoming/site.tgz`);
  ssh(`sh ${BASE}/release.sh ${BASE}/incoming/site.tgz`);
}

// 2. Médias : manifeste local, comparaison avec celui du serveur, envoi des différences seulement
if (faireTout || args.includes('--media')) {
  const racine = 'public/media';
  const fichiers = [];
  const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else fichiers.push(p); } };
  walk(racine);
  const local = {};
  for (const f of fichiers) local[relative(racine, f).split('\\').join('/')] = createHash('sha256').update(readFileSync(f)).digest('hex');
  writeFileSync('work/media-manifest.json', JSON.stringify(local, null, 1));
  let distant = {};
  const r = spawnSync('ssh', [HOTE, `cat ${BASE}/media-manifest.json 2>/dev/null || cat ${BASE}/media/manifest.json 2>/dev/null || echo {}`], { encoding: 'utf8' });
  try { distant = JSON.parse(r.stdout || '{}'); } catch { distant = {}; }
  const aEnvoyer = Object.keys(local).filter((k) => distant[k] !== local[k]);
  const aSupprimer = Object.keys(distant).filter((k) => !(k in local));
  console.log(`${Object.keys(local).length} médias, ${aEnvoyer.length} à envoyer, ${aSupprimer.length} à retirer`);
  if (aEnvoyer.length) {
    const liste = 'work/media-a-envoyer.txt';
    writeFileSync(liste, aEnvoyer.join('\n') + '\n');
    // Une seule archive pour tous les fichiers à envoyer, décompressée en place
    sh(`tar -czf work/media.tgz -C ${racine} -T ${liste}`);
    sh(`scp work/media.tgz ${HOTE}:${BASE}/incoming/media.tgz`);
    ssh(`mkdir -p ${BASE}/media && tar -xzf ${BASE}/incoming/media.tgz -C ${BASE}/media && rm -f ${BASE}/incoming/media.tgz`);
  }
  if (aSupprimer.length) ssh(`cd ${BASE}/media && rm -f ${aSupprimer.map((k) => `'${k}'`).join(' ')}`);
  sh(`scp work/media-manifest.json ${HOTE}:${BASE}/media-manifest.json`);
  // Ancien emplacement (dans /media/, donc servi publiquement) : retiré
  ssh(`rm -f ${BASE}/media/manifest.json`);
}

// 3. Vérification en ligne
if (!dry) {
  const r = spawnSync('curl', ['-sI', 'https://studio.madigitalagency.net/'], { encoding: 'utf8' });
  console.log(r.stdout.split('\n').filter((l) => /^(HTTP|content-security-policy|strict-transport|cache-control)/i.test(l)).join('\n'));
}
console.log(dry ? 'simulation terminée' : 'mise en ligne terminée');
