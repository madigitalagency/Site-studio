# RUNBOOK — site Studio

Dépôt : `C:\dev\studio-site` · GitHub `madigitalagency/Site-studio` · serveur `/opt/studio` sur le VPS, conteneur `studio` derrière Traefik.
Construction locale, aucun code en ligne (CSP stricte posée par nginx), médias servis à part des versions.

## Publier un épisode en dix minutes

1. **Créer la fiche et le dossier média** (30 s)
   ```
   npm run new -- --serie rouvray --saison 1 --episode 4 --slug 04-le-titre --titre "Le titre" --en "The Title" --date 2026-11-01
   ```
   Pour un film hors série : `npm run new -- --film mon-film --titre "Mon film" --format pub --univers marques --date 2026-11-12`.
   La fiche naît en statut `brouillon` : invisible tant qu'elle n'est pas passée à `programme` ou `publie`.

2. **Encoder les médias depuis le master** (2 à 3 min)
   ```
   npm run media -- rouvray-s1e04 "C:\...\Episode-04\rouvray_ep4_reel_FR_V3.mp4"
   ```
   Produit `v916-fr-1080.mp4`, `v916-fr-720.mp4`, `teaser.mp4` (6 s muet), l'affiche `poster-916` (jpg, webp, avif) depuis l'image à 1 s (`--t 2.5` pour une autre, `--poster image.png` pour une image choisie), puis les variantes. La durée mesurée est reportée dans la fiche.
   Version anglaise : la même commande avec `--lang en`. Master 16:9 : `--large`.

3. **Compléter la fiche** `src/content/pieces/<id>.json` (3 min) : `pitch` (sauf séries « titre seul »), `coulisses.texte` en trois parties (l'idée, ce qui était difficile, ce qu'on a appris), `genere` / `manuel`, `chiffre`, `notions` (identifiants du Lexique), `sources` (avec note), `transcription`, `mention_ia`. Images de coulisses : fichiers dans `public/media/<id>/coulisses/`, puis `npm run variantes`.
   Aucun nom d'outil, aucun client, aucune personne réelle : `npm run check` les refuse.

4. **Statut et date** : `"statut": "programme"` avec `date_publication` = jour de sortie (la page apparaît ce jour-là, à la prochaine mise en ligne), ou `"publie"` tout de suite.

5. **Vérifier** (1 min)
   ```
   STUDIO_DATE=2026-11-01 npx astro build && npm run check
   npm run preview
   ```
   (`STUDIO_DATE` : voir le site comme à cette date. Sous PowerShell : `$env:STUDIO_DATE='2026-11-01'; npx astro build`.)

6. **Pousser** : `git add -A && git commit -m "ROUVRAY S1E04" && git push`.

7. **Mettre en ligne** (1 à 2 min selon le poids des médias)
   ```
   npm run deploy
   ```
   Construit à la date du jour, contrôle, envoie les pages (archive tar par SSH, bascule atomique), puis seulement les médias nouveaux ou modifiés (manifeste SHA-256). `npm run deploy -- --dry` pour voir sans rien envoyer.

8. **Après la sortie sur Instagram** : `liens.instagram` dans la fiche, `statut: "publie"`, puis `npm run deploy -- --pages`.

## Autres opérations

- **Nouvelle notion** : `src/content/notions/<id>.md` (titre anglais d'abord, français entre parenthèses), citée par au moins une pièce (`notions`).
- **Note du Carnet** : `src/content/carnet/<slug>.fr.md` et `.en.md`, `statut: publie`.
- **Série** : `src/content/series/<slug>.json` ; `episodes_titre_seul: true` pour des fiches sans résumé.
- **Contrôles** : `npm run check` (schémas, listes interdites, médias, liens internes), `npm run lighthouse` (mobile) ou `npm run lighthouse desktop`, aperçu lancé.
- **Document de relecture** : `node scripts/relecture.mjs <sortie.md>`.
- **Icônes** : `node scripts/favicon.mjs <MA_monogramme.png>`.
- **Serveur** : `ops/server/` (compose, nginx, release.sh, protection n8n), `ops/n8n/studio-contact.json` (flux du formulaire). Procédure de mise en ligne : coffre, `Studio/site/Procedure_mise_en_ligne_Studio_2026-10-11.md`.

## Ce qui est généré par le serveur, jamais par le site

Les en-têtes de sécurité (CSP, HSTS…), la redirection HTTPS, le certificat, le relais `/api/contact` vers n8n. Si une page a besoin d'un script ou d'un style en ligne, c'est non : on fait un fichier.
