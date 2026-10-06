# PRODUCT.md — studio.madigitalagency.net

**Produit.** Le Studio de M&A Digital Agency : un catalogue de films courts entièrement générés par IA (séries à épisodes, archives reconstituées, pubs fictives), avec la méthode et les coulisses qui montrent comment ils sont faits. Le site est une vitrine statique, bilingue FR/EN, sous-domaine du site de l'agence.

**Audience.** Dirigeants et responsables marketing de PME et de marques francophones (France, Belgique, Afrique francophone) et internationales. Ils ne savent pas juger une vidéo générée ; ils reconnaissent quelqu'un qui explique clairement ce qu'il fait. Premier cercle : réseau aérien et tourisme, contacts de l'agence, visiteurs venus d'Instagram `studio.madigitalagency`.

**Action attendue.** Une demande de devis via « Parler d'un projet ». Indicateur : au moins une demande liée au Studio d'ici mars 2027.

**Mécanisme unique.** Un catalogue plutôt qu'une promesse, et un acteur maison fictif (Roger) qui transforme la mention IA en argument de marque. Chaque fiche apprend quelque chose au visiteur (l'idée, ce qui était difficile, ce qu'on a appris) sans livrer la recette.

**Scène d'usage.** Un dirigeant reçoit le lien sur son téléphone, le soir ou entre deux réunions ; il regarde une vidéo verticale, lit trois lignes, et décide s'il transfère le lien à son associé « sans s'excuser ». Sur ordinateur, le lecteur vertical doit tenir sans ressembler à une page Instagram.

**Engagements de marque (pinnés, non négociables).**
- Mode nuit de la charte M&A : fond indigo nuit `#2A0A4A`, accents magenta `#E22DE4` et violet `#7830F0`, texte lavande `#F4EFFC`. Thème unique sombre (salle de projection).
- Typographies de l'agence, auto-hébergées : Fraunces (titres), Inter (texte), Montserrat (petits libellés). Choix validé le 01/10/2026, protégé.
- Le dégradé magenta → violet est réservé au logo.
- Mention « Images générées par IA » visible sur chaque pièce.
- Aucun client nommé, aucune personne ni marque réelle, aucun nom d'outil ou de modèle dans les textes.
- Zéro humour sur Prestations, Contact et la partie factuelle des fiches ; Roger n'apparaît qu'après la preuve.
- Aucun script, police ou lecteur tiers ; pas de cookie, pas de bandeau.

**Anti-références.** Site de start-up SaaS (Montserrat gras serré, cartes arrondies, dégradés), landing page d'« agence IA » (étincelles, néons, verre dépoli, compteurs animés), page Instagram (faux cadres de téléphone), portfolio centré à trois colonnes d'icônes.

**Références de ton.** Un studio de cinéma qui montre ses films et son atelier. DelgadoWorks pour la structure didactique (jamais les textes).

**Contraintes.** Statique (Astro 7), aucun code en ligne (CSP stricte via nginx), Lighthouse ≥ 95, WCAG 2.2 AA, LCP < 2 s en 4G, JS < 30 Ko, page hors vidéo < 500 Ko. Contenu = données (JSON/Markdown), jamais du HTML dupliqué.

**Documents de référence.** `Studio/site/CDC_site_Studio_v2_2026-09-23.md` et `CDC_site_Studio_v3_revision_2026-10-06.md` dans le coffre Dropbox.
