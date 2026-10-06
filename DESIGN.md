# DESIGN.md — Studio (mode nuit)

Monde visuel pinné par le cahier des charges : la charte M&A en mode nuit, lue comme une salle de projection. Grille éditoriale, un seul accent, les images sont les films.

## Couleurs (jetons dans `src/styles/tokens.css`)

| Jeton | Valeur | Rôle |
|---|---|---|
| `--night` | `#2A0A4A` | fond de page (indigo nuit de la charte) |
| `--night-deep` | `#1F0738` | puits du lecteur vidéo, pied de page |
| `--surface` | `#36125F` | surfaces à peine plus claires (cartes de film, blocs) |
| `--surface-2` | `#421A70` | survol, surfaces actives |
| `--line` | `rgba(244,239,252,.14)` | filets |
| `--ink` | `#F4EFFC` | texte (lavande de la charte) |
| `--ink-2` | `#CFC2E4` | texte secondaire, teinté lavande, jamais gris |
| `--muted` | `#A08FBE` | libellés, métadonnées (≥ 5:1 sur `--night`) |
| `--accent` | `#E22DE4` | magenta de la charte : filets d'accent, focus, badges, grands éléments |
| `--accent-ink` | `#F27AF3` | magenta éclairci pour les liens en texte courant (≥ 6:1 sur `--night`) |
| `--accent-fill` | `#C41AC6` | magenta approfondi pour les boutons pleins (texte blanc ≥ 4.8:1) |
| `--violet` | `#7830F0` | états (survol, sélection), jamais décoratif |

Le dégradé magenta → violet n'existe que dans le logo. Pas de dégradé de fond, pas de texte en dégradé.

## Typographie (auto-hébergée, `src/styles/fonts.css`)

- **Fraunces** : titres et grands chiffres. `font-variation-settings: 'opsz' 144` en très grand, `72` en titres de section, poids 400-500, interlettrage -0.015 em. Jamais en gras lourd.
- **Inter** : texte courant 17 px / 1.6, mesure 62-68 ch. Poids 400 et 500.
- **Montserrat** 600 : libellés en capitales espacées (.12 em), 11.5-12.5 px : durée, format, numéro d'épisode, « Images générées par IA ».
- Chiffres tabulaires partout où des nombres s'alignent (durées, numéros).

## Composition

- Conteneur 1180 px, gouttières 24 px (16 px sur téléphone), colonnes asymétriques : lecteur 9:16 à gauche (hauteur max 80 vh), fiche à droite.
- Rythme vertical : 96 px entre sections sur ordinateur, 64 px sur téléphone ; plus d'espace au-dessus d'un titre qu'en dessous.
- Filets `1px var(--line)` pour séparer ; des cartes seulement pour les films (affiche au vrai ratio, coins 6 px).
- Aucun eyebrow décoratif : les titres portent seuls. La numérotation des épisodes (S1 · E02) est une information, pas un ornement.

## Mouvement

- Une seule idée : au survol d'une carte, l'affiche cède la place au teaser muet de 6 s (`prefers-reduced-motion` : rien).
- Transitions 160 ms ease-out sur les couleurs et l'opacité ; rien n'apparaît au défilement.

## Composants

Carte de pièce · badges (format, univers, rendu, langue) · cartouche IA · lecteur vidéo natif · bascule 9:16 / 16:9 · lecteur de planches · bloc Coulisses (texte en trois temps, généré / fait à la main, notions) · comparateur avant / après · bloc « Le fait réel » · transcription · navigation épisode précédent / suivant · bouton « Parler d'un projet ».

## Surfaces du navigateur

Sélection de texte lavande sur violet, anneau de focus magenta décalé de 3 px, barre de défilement teintée, soulignement des liens décalé de 3 px.
