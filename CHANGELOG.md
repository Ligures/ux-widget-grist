# Journal des modifications — UX widget grist

<img src="aia.png" alt="AIA" width="40" align="left" /> **AIA — Assisté par l'intelligence artificielle.** Ce widget et sa documentation ont été réalisés avec l'assistance d'une IA, sous la direction et avec la validation de leur auteur. Icône : [Martine Peters](https://mpeters.uqo.ca/utilisation-transparente-de-lintelligence-artificielle/), CC BY-NC-SA 4.0.
<br clear="left" />

Toutes les évolutions notables du widget sont consignées ici, de la plus récente à la plus ancienne.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

**Qui est concerné** : chaque version range ses changements en trois rubriques.
- **Utilisateurs** : ce que voit toute personne qui consulte les pages.
- **Administrateurs** : la configuration, les réglages et l'installation, visibles des seuls administrateurs du widget.
- **Développeurs** : ce qui ne se voit pas à l'écran (code, sécurité, documentation, performances).

Dans l'onglet *Nouveautés* de l'aide, les utilisateurs ne voient que la première rubrique ; les administrateurs voient tout.

Chaque ligne commence par la nature du changement : *Nouveau*, *Amélioré*, *Corrigé*, *Retiré* ou *Sécurité*.

**Numérotation** : le widget est en développement, donc en version 0.
- Le **dixième** (`0.X`) marque une évolution majeure.
- Le chiffre suivant (`0.X.Y`) marque une évolution secondaire ou un ensemble de corrections. Il peut dépasser 9 : 0.8.9 est suivie de 0.8.10, puis 0.8.11…
- Depuis 0.8.10, un quatrième chiffre (`0.X.Y.Z`) change à chaque livraison intermédiaire : 0.9.2.1, 0.9.2.2… jusqu'au palier suivant.
- La version 1.0 sera la première version stable.

Les versions antérieures à 0.5.0 ont été développées avant la mise en dépôt du code. Leur numérotation est reconstituée a posteriori, et leurs dates ne sont pas connues précisément (septembre – début octobre 2026).

---

## [0.9.2.2] — Journal des modifications par public — 2026-10-22

### Administrateurs
- *Amélioré* — **Journal des modifications** réécrit en trois rubriques : Utilisateurs, Administrateurs, Développeurs. Dans l'onglet *Nouveautés*, les utilisateurs ne voient plus que ce qui les concerne.

### Développeurs
- *Amélioré* — L'onglet *Nouveautés* retire, pour un non-administrateur, les rubriques « Administrateurs » et « Développeurs », ainsi que les versions qui n'ont rien d'autre.

## [0.9.2.1] — Encadrés de réglages côte à côte — 2026-10-22

### Administrateurs
- *Amélioré* — **Configuration des vues** : tous les encadrés d'un bloc (Affichage, Tableau, Fiches, Édition, filtres, couleurs, cartes) partagent la même grille. Ils se placent côte à côte dès que la largeur le permet : 2 colonnes sur un écran courant, 3 sur un grand écran.

## [0.9.2.0] — Configuration des vues réorganisée — 2026-10-22

### Administrateurs
- *Amélioré* — **« Vues retenues »** : les réglages de chaque bloc sont rangés dans des encadrés titrés, dans le même ordre pour toutes les vues.
  - **Affichage**, commun à toutes les vues : taille, état à l'ouverture, « À la ligne », « Figer à l'écran », « Liste de sélection ».
  - Puis les encadrés propres au type de vue, s'il y a lieu : **Tableau**, **Fiches**, **Édition**, **Liste de sélection**, **Couleurs du graphique**, **Filtre rapide**, et les encadrés des cartes.
- *Amélioré* — **Blocs repliés par défaut** à l'ouverture de la configuration : restent visibles le titre, les flèches, la largeur, la colonne et le nombre de lignes. **Tout déplier** ouvre tous les blocs ; une vue que l'on vient d'ajouter s'ouvre dépliée.

## [0.9.1.19] — Zones en contours seuls — 2026-10-22

### Administrateurs
- *Nouveau* — **Cartes, « Couleur des zones » → aucune (contours seuls)** : le zonage principal est tracé en traits gris, sans fond ; le nom de la zone reste affiché au survol.

## [0.9.1.18] — Rattachement des points aux circonscriptions par code — 2026-10-22

### Administrateurs
- *Nouveau* — **Cartes, zonages lus dans un fichier** (circonscriptions législatives, secteurs de collège) : réglage **Rattachement**.
  - « position des points » (comme avant) : la zone dont le contour contient le point.
  - Une colonne de code (ex. `2201`, ou l'UAI d'un collège) : la zone donnée par vos données, même si le point est hors de son contour officiel (commune nouvelle à cheval sur deux circonscriptions…).

## [0.9.1.17] — Secteurs de collège, fichiers de zonage régionaux — 2026-10-22

### Utilisateurs
- *Amélioré* — Étiquettes et fenêtres des cartes : liseré intérieur plus large (8 px).

### Administrateurs
- *Nouveau* — **Cartes, zonage « secteurs de collège »**, coloré ou en contours (second zonage). Une table Grist peut colorer les secteurs, reliée par l'UAI du collège.
- *Amélioré* — **Circonscriptions législatives et secteurs de collège** lus dans des fichiers régionaux déposés à côté du widget : `circonscriptions-bretagne.geojson`, `secteurs-colleges-bretagne.geojson`. L'option « Fichier : … » permet d'en indiquer un autre. Le README explique comment les extraire des fichiers nationaux avec mapshaper.org.

### Développeurs
- *Sécurité* — CSP : les adresses data.gouv.fr ajoutées en 0.9.1.16 sont retirées, les fichiers étant désormais sur le même site que le widget.
- *Amélioré* — Lecture générique des zonages en fichier (`FILE_ZONES`, `loadZoneFile`) : code et nom de chaque zone reconnus d'après le nom des propriétés.

## [0.9.1.16] — Circonscriptions législatives et second zonage — 2026-10-22

### Administrateurs
- *Nouveau* — **Cartes, zonage « circonscriptions législatives »** : circonscriptions qui contiennent des points, colorées comme les autres zonages (une par circonscription, nombre de points, somme d'une colonne, table Grist reliée par le code).
- *Nouveau* — **Second zonage (contours)** : un deuxième découpage (communes, EPCI, IRIS, circonscriptions) tracé en pointillés noirs par-dessus le premier, pour croiser deux fonds de carte. Nom de la zone au survol du trait (`mapZone2`).

### Développeurs
- *Sécurité* — CSP : `connect-src` autorisait www.data.gouv.fr et static.data.gouv.fr (retiré en 0.9.1.17).

## [0.9.1.15] — Fenêtres des cartes : maintien à l'écran et double liseré — 2026-10-21

### Utilisateurs
- *Corrigé* — **Cartes liées à d'autres blocs** : la fenêtre d'information d'un point s'ouvrait puis disparaissait aussitôt. Elle reste maintenant ouverte, et ne se ferme que par ✕ ou un clic ailleurs sur la carte.
- *Amélioré* — **Étiquettes et fenêtres des cartes** : le cadre de la couleur du point est doublé, à l'intérieur, d'un liseré de la couleur du contour du point.

## [0.9.1.14] — Fenêtres d'information des cartes — 2026-10-21

### Utilisateurs
- *Amélioré* — **Cartes** : les fenêtres d'information (au clic sur un point) prennent le style des étiquettes : angles droits et cadre de 2 px de la couleur du point, pointe comprise. Le cadre des étiquettes passe aussi à 2 px.

## [0.9.1.13] — Correctif cartes — 2026-10-21

### Utilisateurs
- *Corrigé* — **Cartes** : depuis 0.9.1.12, une carte affichait une erreur (« can't access property "isOpen"… ») dès qu'un point n'avait pas d'étiquette.

## [0.9.1.12] — Étiquettes des cartes : angles droits, cadre de la couleur du point — 2026-10-21

### Utilisateurs
- *Amélioré* — **Cartes, étiquettes des points** : angles droits et cadre fin de la couleur du point, pointe comprise. Sans colonne de couleur, le cadre est bleu, ou rouge pour le point sélectionné. Les étiquettes des zones gardent un cadre gris.

## [0.9.1.11] — Ordre des groupes des listes de sélection — 2026-10-21

### Administrateurs
- *Nouveau* — **Listes de sélection, « Ordre des groupes »** : intertitres de « Regrouper par » en ordre alphabétique (A → Z) ou inverse (Z → A). Nombres et années classés par valeur (`selGroupOrder`).

## [0.9.1.10] — Largeur des champs des listes de fiches — 2026-10-20

### Utilisateurs
- *Corrigé* — **Listes de fiches** : les valeurs n'étaient plus coupées inutilement sur plusieurs lignes. Chaque champ prend la largeur de sa plus longue valeur, la même dans toutes les fiches, pour que les champs restent alignés.

## [0.9.1.9] — Noms des champs masquables dans les fiches — 2026-10-20

### Utilisateurs
- *Nouveau* — Dans les fiches où l'administrateur l'a choisi, seules les valeurs sont affichées ; le nom du champ apparaît au survol de la valeur.

### Administrateurs
- *Nouveau* — **Option de bloc « Masquer les noms des champs »** (fiches et listes de fiches) (`hideLabels`).

## [0.9.1.8] — Champs alignés d'une fiche à l'autre — 2026-10-20

### Utilisateurs
- *Corrigé* — **Listes de fiches** : les champs sont au même endroit dans toutes les fiches. Un champ vide garde sa place (il est retiré s'il est vide partout) ; un champ long occupe toute la largeur dans toutes les fiches ou dans aucune.

## [0.9.1.7] — Vues retenues plus lisibles dans la configuration — 2026-10-20

### Administrateurs
- *Amélioré* — **Nom des vues** dans la configuration : icône, **type** (en bleu), puis **titre**.
- *Amélioré* — **Vues retenues** : chaque vue forme une carte distincte, avec un bandeau de titre et un liseré bleu.

## [0.9.1.6] — Couleurs choisies pour tous les graphiques — 2026-10-19

### Utilisateurs
- *Corrigé* — Les couleurs des séries ne changent plus d'un affichage à l'autre quand l'administrateur les a fixées.

### Administrateurs
- *Nouveau* — **Couleurs du graphique** pour tous les graphiques, natifs ou avancés (l'encadré « Couleurs du camembert » est généralisé) : correspondance, colonne de codes, couleur de repli.
  - Histogramme à une seule série : une couleur par barre.
  - Plusieurs séries ou courbes : une couleur par série (valeur du regroupement ou nom de la colonne).
  - Graphique avancé (Plotly) : couleur de chaque trace d'après son nom.
  - Sans réglage, la palette est appliquée dans l'ordre d'apparition des séries, qui dépend des données.

## [0.9.1.5] — Icônes des types de vue dans la configuration — 2026-10-19

### Administrateurs
- *Nouveau* — **Configuration** : une icône devant chaque vue indique son type (tableau, fiche, graphique en barres, secteurs, courbe, carte, liste de sélection…). Le type exact s'affiche au survol.

## [0.9.1.4] — Réglages des vues repliables dans la configuration — 2026-10-19

### Administrateurs
- *Nouveau* — **Vues retenues** : bouton ▾ / ▸ pour replier les réglages d'un bloc (restent visibles : titre, flèches, largeur, colonne, nombre de lignes) ; boutons **Tout replier** et **Tout déplier**.

## [0.9.1.3] — Couleurs personnalisées des camemberts — 2026-10-19

### Administrateurs
- *Nouveau* — **Couleurs des camemberts** (natifs ou avancés) : encadré dans les réglages du bloc, enregistré dans `W_Composition`.
  - **Colonne de codes** : un code hexadécimal par ligne (`pieColorCol`).
  - **Correspondance** « catégorie = #code » (`pieColorMap`), prioritaire.
  - **Couleur de repli** pour les catégories sans code (`pieColorDefault`).

### Développeurs
- *Nouveau* — Couleurs passées à Plotly en `marker.colors` (graphiques avancés), et en couleurs de fond des parts pour Chart.js (graphiques natifs).

## [0.9.1.2] — En-têtes de colonnes plus discrets — 2026-10-19

### Utilisateurs
- *Amélioré* — **En-têtes de colonnes des tableaux** : graisse moyenne et gris foncé. Un en-tête mis en gras dans Grist reste en gras.

### Développeurs
- *Amélioré* — Graisse « Medium » de Marianne chargée depuis le paquet DSFR, comme les autres graisses.

## [0.9.1.1] — Plein écran réservé aux administrateurs — 2026-10-18

### Utilisateurs
- *Retiré* — Le bouton **Plein écran** n'est plus affiché aux utilisateurs : le widget est déjà leur vue par défaut.

## [0.9.1.0] — Messages d'erreur lisibles — 2026-10-18

Version de palier : elle regroupe les évolutions 0.9.0.1 à 0.9.0.10 (impression fidèle à l'écran, ajout et suppression de lignes, messages en bulle flottante, infobulles du menu, chargement plus rapide avec des règles d'accès).

### Utilisateurs
- *Corrigé* — **Messages de refus** (« Modification refusée par les règles d'accès »…) : ils étaient effacés aussitôt. Ils restent visibles au moins 4 s, s'effacent après 8 s ou d'un clic.

## [0.9.0.10] — Suppression de lignes, infobulles du menu — 2026-10-18

### Utilisateurs
- *Nouveau* — **− Supprimer la ligne**, à côté de « + Ajouter une ligne » : agit sur la ligne sélectionnée, après confirmation dans le bouton (second clic dans les 4 s, ligne surlignée en rouge). Une suppression interdite par les règles d'accès est refusée avec un message.
- *Nouveau* — Infobulles explicatives sur les liens du menu des pages, quand l'administrateur en a saisi.
- *Corrigé* — Le message « Ligne ajoutée » restait invisible.

### Administrateurs
- *Amélioré* — L'option du bloc devient « Ajout et suppression de lignes ».
- *Nouveau* — **Navigation** : champ « Infobulle » pour chaque lien du menu. Sans infobulle, le survol montre l'adresse de la page, sauf avec « Changer de page dans le widget ».

## [0.9.0.9] — Messages en bulle flottante — 2026-10-18

### Utilisateurs
- *Amélioré* — **Messages** (chargement, filtre appliqué, erreurs) dans une petite bulle discrète en haut au centre : ils ne décalent plus la page. Un message en cours reste jusqu'à la fin du traitement ; une information s'efface après 4 s ; une erreur après quelques secondes ou d'un clic.

## [0.9.0.8] — Tables interdites lues une seule fois — 2026-10-18

### Utilisateurs
- *Corrigé* — **Lenteurs** au changement de page et aux sélections, pour les personnes soumises à des règles d'accès.

### Développeurs
- *Corrigé* — Une table interdite en lecture (par exemple `U_Utilisateurs` derrière une colonne Référence) était redemandée au serveur à chaque affichage, chaque refus pouvant prendre plusieurs secondes. Le refus est mémorisé jusqu'au prochain « Actualiser ».

## [0.9.0.7] — Diagnostic des lenteurs de chargement — 2026-10-18

### Développeurs
- *Nouveau* — **Diagnostic dans la console du navigateur** (F12) : toute lecture de table de plus de 200 ms est signalée ; au premier affichage, une ligne récapitule le nombre de lectures, le temps cumulé et les cinq plus longues.

## [0.9.0.6] — Ajout de lignes dans un tableau modifiable — 2026-10-17

### Utilisateurs
- *Nouveau* — **+ Ajouter une ligne** en bas des blocs qui le proposent : la ligne est créée, rattachée à l'élément sélectionné dans la liste liée (par exemple une classe sous l'école choisie), puis la saisie de son premier champ s'ouvre. Un ajout interdit par les règles d'accès est refusé avec un message.

### Administrateurs
- *Nouveau* — **Option de bloc « Ajout de lignes »** (tableaux et listes de fiches, avec « Édition des champs »). Un bloc vide qui propose l'ajout reste affiché, même avec « masquer les blocs vides ».

## [0.9.0.5] — Impression des tableaux longs, 2ᵉ correction — 2026-10-14

### Utilisateurs
- *Corrigé* — **Impression des tableaux longs** : plus de pages blanches ni de morceaux de tableau isolés. Les blocs courts restent côte à côte ; un bloc plus haut qu'une page commence sur une nouvelle ligne et se poursuit sur les pages suivantes, en-tête de colonnes répété. Les tableaux des blocs figés et très grands s'impriment en entier, y compris avec Ctrl+P.

### Développeurs
- *Amélioré* — À l'impression, la grille CSS est remplacée par un flux normal (blocs courts en `inline-block`, blocs longs en `block`), que les navigateurs savent couper d'une page à l'autre.

## [0.9.0.4] — Impression des tableaux longs — 2026-10-14

### Utilisateurs
- *Corrigé* — **Impression** : un tableau ou une liste de fiches plus haut qu'une page peut se couper d'une page à l'autre, au lieu d'être repoussé en laissant une page blanche. Les lignes ne sont jamais coupées en deux et l'en-tête est répété.

## [0.9.0.3] — Impression fidèle à l'écran — 2026-10-14

### Utilisateurs
- *Amélioré* — **Impression en A4 paysage**, avec la disposition de l'écran : un graphique qui occupe 1/6 de l'écran occupe 1/6 de la page. Graphiques, cartes et tableaux sont redessinés à la taille de la page.
- *Corrigé* — Les blocs n'étaient plus empilés un par ligne à l'impression, et l'option « sans trous » ne provoque plus de chevauchements sur le papier.

## [0.9.0.2] — Réglages des filtres rapides regroupés — 2026-10-14

### Administrateurs
- *Amélioré* — Chaque filtre rapide a son encadré (**Filtre rapide**, **2ᵉ filtre rapide**) : champ, valeur à l'ouverture, valeurs exclues.
- *Amélioré* — **1er filtre** : l'option **(SO)** peut être choisie à l'ouverture et exclue.

## [0.9.0.1] — Légende de la seconde couleur allégée — 2026-10-14

### Utilisateurs
- *Amélioré* — Cartes : la légende de la 2ᵉ colonne de couleur n'affiche plus la mention « (si … vide) ».

## [0.9.0] — Code séparé et politique de sécurité stricte — 2026-10-14

Évolution majeure de la structure du widget, sans changement visible pour les utilisateurs.

### Administrateurs
- *Amélioré* — **Trois fichiers au lieu d'un**, à déposer ensemble dans le dépôt : `index.html`, `ux-widget.css`, `ux-widget.js`.

### Développeurs
- *Amélioré* — `index.html` charge le style et le script avec le numéro de version (`?v=…`), pour éviter l'usage d'une ancienne version en cache.
- *Sécurité* — **Politique de sécurité du contenu (CSP)** : aucun script en ligne exécuté ; scripts limités au site du widget, à Grist et à jsDelivr ; connexions limitées au site du widget, à jsDelivr, à geo.api.gouv.fr et à data.geopf.fr ; aucun envoi de formulaire ; pas d'objets intégrés.
- *Sécurité* — L'attribut `onerror` de l'icône AIA est remplacé par un traitement dans le script.

## [0.8.11.6] — Filtres rapides affichés sur un bloc sans données — 2026-10-14

### Utilisateurs
- *Amélioré* — **Filtres rapides** : ils restent affichés quand le bloc n'a aucune donnée (par exemple après une sélection), sauf si le bloc est masqué par « Masquer les blocs sans données ».

## [0.8.11.5] — Valeur « (SO) » du premier filtre — 2026-10-14

### Utilisateurs
- *Nouveau* — **Filtres rapides** : le 1er filtre propose **« (SO) »** (sans objet), en dernière position, pour n'afficher que les lignes sans valeur. Le 2nd filtre ne la propose pas.

## [0.8.11.4] — Pas d'option « (vide) » dans les filtres rapides — 2026-10-14

### Utilisateurs
- *Retiré* — **Filtres rapides** : la valeur « (vide) » n'est plus proposée ; les lignes sans valeur restent visibles avec « Tous ».

## [0.8.11.3] — Réglages des cartes réorganisés — 2026-10-14

### Administrateurs
- *Amélioré* — **Configuration d'une carte** en quatre encadrés : **Points**, **Contour des points**, **Quartiers prioritaires (QPV)**, **Zones sous les points**. Le code INSEE suit directement le choix du zonage.

## [0.8.11.2] — Seconde couleur des points — 2026-10-14

### Utilisateurs
- *Nouveau* — Cartes : les points sans valeur pour la couleur principale peuvent être colorés selon une 2ᵉ colonne, avec sa propre légende.

### Administrateurs
- *Nouveau* — **Cartes, « … sinon selon »** : 2ᵉ colonne de couleur pour les points dont « Couleur selon » est vide.

## [0.8.11.1] — Valeurs exclues des filtres rapides, présentation homogène — 2026-10-14

### Utilisateurs
- *Amélioré* — **Filtres rapides** : au-delà de 4 valeurs, même présentation que sur écran réduit (valeur active, liste au clic). Les deux filtres d'un bloc se présentent de la même façon.

### Administrateurs
- *Nouveau* — **Valeurs exclues** pour chaque filtre rapide : retirées des boutons et des lignes du bloc, y compris sur « Tous ».

## [0.8.11.0] — Cadrage des cartes — 2026-10-14

### Utilisateurs
- *Nouveau* — **Cartes cadrées sur l'ensemble des données** à l'ouverture (points et zones). Tant qu'on n'a pas déplacé la carte, elle se recadre quand son bloc change de taille.
- *Nouveau* — **Bouton ⤢** sous le zoom : revient au cadrage sur l'ensemble des données.

## [0.8.10.6] — Plus de question « quelle configuration ? » aux utilisateurs — 2026-10-14

### Utilisateurs
- *Corrigé* — Le widget ne demande plus quelle configuration afficher : il ouvre directement la page d'accueil.

### Administrateurs
- *Amélioré* — La question n'est posée qu'aux administrateurs ; leur choix devient la **page d'accueil** commune (enregistrée dans `W_Composition`).
- *Amélioré* — **Page d'accueil** toujours proposée (section Navigation). Avec « Changer de page dans le widget », elle s'impose ; sinon, elle sert quand le widget n'a pas de configuration enregistrée.

## [0.8.10.5] — Correction des références protégées — 2026-10-14

### Utilisateurs
- *Corrigé* — Références vers des lignes non lisibles : le texte affiché pouvait être celui d'une autre colonne (par exemple l'UAI au lieu du nom).

## [0.8.10.4] — Références vers des lignes protégées — 2026-10-14

### Utilisateurs
- *Corrigé* — **Références vers des lignes non lisibles** (règles d'accès par ligne) : le widget affichait un numéro ; il affiche le texte calculé par Grist, comme les vues natives.

## [0.8.10.3] — Guide d'administration séparé — 2026-10-14

### Utilisateurs
- *Amélioré* — **Aide** : l'onglet « Guide » ne contient plus que l'utilisation.

### Administrateurs
- *Nouveau* — Onglet **Administration** de l'aide (`GUIDE-ADMINISTRATEUR.md`), affiché aux seuls administrateurs, avec ses propres questions fréquentes (onglets absents, éditeur qui voit Configurer…).

## [0.8.10.2] — Actions en icônes sur grand écran — 2026-10-14

### Utilisateurs
- *Amélioré* — **Grand écran** (plus de 900 px) : plus de menu ☰ ; toutes les actions sont des icônes dans la barre, avec leur libellé en infobulle. Sur écran étroit, le menu ☰ revient.
- *Nouveau* — La version du widget figure dans l'infobulle du bouton Aide.

## [0.8.10.1] — Second filtre rapide, boutons directs, page d'accueil — 2026-10-14

### Utilisateurs
- *Nouveau* — **Second filtre rapide** sur certains blocs ; les deux filtres se cumulent et se synchronisent par clic milieu.
- *Amélioré* — **Actualiser** (⟳) et **Configurer** (⚙) sont des boutons directs de la barre.

### Administrateurs
- *Nouveau* — Réglage « 2ᵉ filtre rapide » par bloc, avec sa valeur à l'ouverture.
- *Nouveau* — **Page d'accueil** de la navigation (mode « Changer de page dans le widget »).
- *Retiré* — Fenêtre de choix de l'apparence à la première ouverture : l'apparence se règle dans la configuration (section Affichage). Par défaut : style État (DSFR).

## [0.8.10] — Plein écran, droit de configurer fermé par défaut — 2026-10-12

### Utilisateurs
- *Nouveau* — **Plein écran** : ouvre la page Grist du widget dans un nouvel onglet, sans les menus de Grist.
- *Nouveau* — Version du widget dans l'infobulle du menu ☰, avec la mention « nouvelle version » tant que les nouveautés n'ont pas été lues.

### Administrateurs
- *Amélioré* — L'option « Ouvrir les pages en mode page unique » n'est plus proposée avec « Changer de page dans le widget », où elle ne sert pas.
- *Sécurité* — **Droit de configurer fermé par défaut** : seul qui lit au moins une ligne de `W_Admin` peut configurer. Exception : un document encore sans configuration, où `W_Admin` est créée au premier enregistrement.

### Développeurs
- *Sécurité* — Un éditeur qui ne voyait pas `W_Admin` pouvait configurer quand le témoin `_Securite` manquait ou lui était illisible : une table interdite était prise pour une table absente.
- *Amélioré* — Documentation : tableau des données envoyées à des services externes par les cartes (README). Pour les communes et EPCI, c'est le code du département qui est envoyé à geo.api.gouv.fr.

## [0.8.9] — Apparence au choix, menu des pages sur smartphone, licence MIT, sans export CSV — 2026-10-11

### Utilisateurs
- *Nouveau* — **Smartphone** : le menu des pages est regroupé derrière un bouton, à gauche, qui porte le nom de la page affichée ; il est distinct du menu ☰ des actions.
- *Amélioré* — **Impression** : les boutons de filtre rapide ne sont plus imprimés ; un filtre actif est rappelé en texte (« Réseau : Privé »).
- *Corrigé* — **Listes de sélection synchronisées** : un choix s'applique aussi aux pages déjà visitées ; il ne s'impose plus depuis un autre document ou une autre table ; une sélection absente de la liste est ignorée.
- *Corrigé* — **Menu des pages** : le clic du milieu et le mode page unique fonctionnent sur les liens « — ce widget — ».
- *Retiré* — **Export CSV** des blocs : l'export se fait depuis les vues natives de Grist.

### Administrateurs
- *Nouveau* — **Choix de l'apparence** : **style État (DSFR)**, réservé aux services de l'État, ou **style neutre** pour toute autre structure. Commun au document (section Affichage).
- *Nouveau* — **Licence MIT** (fichier `LICENSE`) : elle couvre le code et la documentation, mais ni la police Marianne ni l'identité visuelle de l'État, ni l'icône AIA, ni les données QPV.

### Développeurs
- *Amélioré* — Police Marianne (normale) chargée depuis le paquet `@gouvfr/dsfr` 1.14.4, en version figée.
- *Amélioré* — README : sections « Apparence et DSFR » et « Licence ».

## [0.8.8] — Nouvelles pages, liens vers des formulaires, filtres rapides synchronisés — 2026-10-11

### Utilisateurs
- *Nouveau* — **Boutons vers des formulaires Grist** dans l'en-tête, avec commentaire au survol. Le formulaire s'ouvre dans une fenêtre au-dessus de la page, qui se ferme seule après l'envoi (bouton ↗ ou Ctrl+clic : nouvel onglet).
- *Nouveau* — **Filtres rapides synchronisés** : un clic milieu (ou Maj+clic) sur une valeur l'applique à tous les blocs filtrés sur le même champ ; le rapprochement se fait aussi par le début du texte (« Privé » garde « Privé sous contrat »).
- *Amélioré* — Un filtre rapide dont le champ n'a qu'une seule valeur n'est plus affiché.
- *Amélioré* — **Références et choix multiples dans les tableaux** : les valeurs se suivent sur la même ligne tant qu'il y a la place.

### Administrateurs
- *Nouveau* — **Page réglée** (section Général) : régler n'importe quelle page enregistrée sans changer celle qui est affichée ; boutons **＋ Nouvelle page** et **Dupliquer** ; encadré qui le signale, avec les options « afficher après l'enregistrement » et « ajouter au menu ».
- *Nouveau* — **Liens vers des formulaires Grist** par page (libellé, commentaire, adresse https, case « nouvel onglet »).
- *Amélioré* — « Nom de la configuration » devient **Nom de la page** ; enregistrer sous le nom d'une autre page, ou changer de page avec des modifications en cours, demande confirmation.
- *Retiré* — Bouton « Charger » et liste « Reprendre une configuration enregistrée », remplacés par « Page réglée ».

## [0.8.7] — Blocs figés empilés — 2026-10-11

### Utilisateurs
- *Corrigé* — **Blocs figés** : ils ne se recouvrent plus dans une même colonne ; un bloc figé déplié reste figé, son contenu défilant à l'intérieur ; un bloc figé sans place pour son en-tête n'est plus figé.
- *Corrigé* — **Contenu qui défile sous les blocs figés** : il n'apparaît plus entre eux ni sous le plus court de deux blocs voisins.
- *Corrigé* — **En-têtes de colonnes toujours visibles** quand on fait défiler un tableau dans son cadre (bloc figé, sur plusieurs rangées ou en plein écran).

## [0.8.6] — Diagnostic de la configuration — 2026-10-11

### Administrateurs
- *Nouveau* — Chaque vue retenue indique sa **table** Grist ; en bas du panneau, l'heure de lecture de la structure du document et le nombre de colonnes lues.

## [0.8.5] — Colonnes renommées — 2026-10-11

### Administrateurs
- *Corrigé* — Le panneau de configuration relit la structure du document à chaque ouverture : colonnes et vues renommées apparaissent sous leur nouveau nom.
- *Corrigé* — **Les colonnes choisies dans la configuration suivent leur renommage** (étiquette, couleur et contour de carte, code INSEE, listes de sélection, colonne additionnée, table de couleur des zones, filtre rapide). Les colonnes renommées avant cette version doivent être choisies à nouveau une fois.

### Développeurs
- *Amélioré* — Le widget mémorise le numéro interne de chaque colonne choisie, qui ne change pas au renommage.

## [0.8.4] — Mention AIA dans l'aide seulement — 2026-10-11

### Utilisateurs
- *Retiré* — La mention AIA n'apparaît plus en pied de page ; elle reste dans l'aide et en tête des documents.

## [0.8.3] — Mention AIA — 2026-10-11

### Utilisateurs
- *Nouveau* — **Icône AIA** (« assisté par l'intelligence artificielle », Martine Peters, CC BY-NC-SA 4.0) en pied de page et dans l'aide.

### Administrateurs
- *Nouveau* — Fichier `aia.png` à déposer à côté du widget ; s'il manque, seule la mention texte s'affiche.

## [0.8.2] — Menu de la barre d'outils — 2026-10-11

### Utilisateurs
- *Amélioré* — **Actions regroupées dans un menu ☰**, avec icônes et libellés ; il se ferme au choix, par un clic ailleurs ou par Échap.
- *Amélioré* — L'aide s'ouvre sur le guide ; la pastille « nouvelle version » reste visible tant que les nouveautés n'ont pas été lues.

## [0.8.1] — Aide intégrée — 2026-10-11

### Utilisateurs
- *Nouveau* — **Aide intégrée** : fenêtre à onglets **Guide** et **Nouveautés**, avec liens internes. Une pastille signale une nouvelle version tant que les nouveautés n'ont pas été lues.

### Administrateurs
- *Nouveau* — Onglet **À propos** (README), réservé aux administrateurs. L'aide est lue dans les fichiers Markdown du dépôt : déposer une nouvelle version sur GitHub la met à jour.

### Développeurs
- *Sécurité* — Markdown mis en forme par marked 12.0.2 (version figée, empreinte SRI), puis nettoyé par DOMPurify.

## [0.8.0] — Nouveau nom et documentation — 2026-10-11

### Utilisateurs
- *Amélioré* — **Nouveau nom : « UX widget grist »** (anciennement « page composée »).

### Administrateurs
- *Amélioré* — Nouveau dépôt `ux-widget-grist`. **Migration** : mettre à jour l'URL du widget dans Grist (`https://<compte>.github.io/ux-widget-grist/`). Les configurations de `W_Composition` sont conservées ; les sélections synchronisées en cours repartent de zéro, une fois.
- *Nouveau* — Numéro de version en bas du panneau de configuration.
- *Nouveau* — Guide d'utilisation (`GUIDE-UTILISATEUR.md`), README mis à jour, et ce journal des modifications.

### Développeurs
- *Amélioré* — Widget servi à la racine du dépôt (`index.html`) ; préfixe de console `[UX widget]` ; clé de synchronisation `uxwg_sync_…`.

## [0.7.0] — Filtre rapide et listes adaptatives — 2026-10-10

### Utilisateurs
- *Nouveau* — **Filtre rapide par bloc** : boutons « Tous | valeur 1 | valeur 2… » dans l'en-tête, qui ignorent majuscules et accents. Selon la place : boutons, bouton unique avec liste, ou icône d'entonnoir.
- *Nouveau* — **Smartphone** : listes de sélection sur une seule ligne, libellé en infobulle.
- *Amélioré* — Une liste de sélection à une seule entrée (selon les droits) est masquée ; sa sélection s'applique et figure dans le résumé imprimé.
- *Corrigé* — Un bloc sans donnée ne reste affiché que si c'est son filtre rapide qui l'a vidé.

### Administrateurs
- *Nouveau* — Réglage du filtre rapide par bloc : champ (champs de la vue, puis autres colonnes), valeur à l'ouverture.
- *Nouveau* — **Menu de navigation** : lien « — ce widget — » pour n'afficher qu'une configuration, quand toutes sont réunies dans une seule page Grist.
- *Corrigé* — La valeur à l'ouverture du filtre n'était pas appliquée après l'enregistrement ; le menu signalait à tort « page introuvable » pour des liens qui ne servent qu'à changer de configuration.
- *Retiré* — Filtre rapide commun à toutes les pages, remplacé par le réglage par bloc.

## [0.6.2] — Code commenté et README — 2026-10-10

### Développeurs
- *Amélioré* — Code commenté (en-tête, sommaire du script, une ligne par fonction) et réindenté avec Prettier, sans changement de comportement.
- *Nouveau* — Premier `README.md`.

## [0.6.1] — IRIS et données Grist par zone — 2026-10-10

### Utilisateurs
- *Nouveau* — Page sans donnée : message « Aucune donnée, pas d'élément sélectionné » au lieu d'une page blanche.
- *Corrigé* — Bloc en plein écran réduit à sa barre de titre en mode « sans trous » ; ascenseurs au survol des graphiques avancés ; rangée des listes de sélection rétrécie sous le menu des pages.

### Administrateurs
- *Nouveau* — **Zonage IRIS** (Géoplateforme IGN).
- *Nouveau* — **Couleur des zones selon une table Grist** reliée par code (INSEE, SIREN, IRIS) : dégradé pour un nombre, une couleur par valeur pour un texte, « sans donnée » en gris.
- *Nouveau* — **Commune déduite de la position des points**, ou d'un code INSEE porté par une référence imbriquée.
- *Amélioré* — Listes de colonnes de la configuration classées par ordre alphabétique.

### Développeurs
- *Nouveau* — Détail du rendu de chaque bloc dans la console quand la page est vide.

## [0.6.0] — Zonages et quartiers prioritaires — 2026-10-09

### Utilisateurs
- *Nouveau* — Cartes : zones (communes, EPCI) sous les points, avec légende ; périmètres des quartiers prioritaires et infobulle de situation QPV des points.

### Administrateurs
- *Nouveau* — **Zonages** : communes, EPCI (communes fusionnées), coloration selon le nombre de points ou la somme d'une colonne.
- *Nouveau* — **Quartiers prioritaires (QPV 2024)** : fichier `qpv-bretagne.geojson` (22, 29, 35, 56), repérage des points dans un QPV ou à moins de X m, contour des points selon la situation QPV.

## [0.5.0] — Hébergement, sécurité et configuration repensée — 2026-10-09

### Utilisateurs
- *Nouveau* — Cartes : contour coloré des points selon une colonne.
- *Amélioré* — Menu de navigation : les pages dont l'utilisateur ne peut lire aucune table sont masquées.
- *Corrigé* — Étiquettes de carte différentes de la carte native.

### Administrateurs
- *Nouveau* — **Hébergement sur GitHub Pages** : le widget est appelé par URL dans Grist.
- *Nouveau* — **Contour des points** : jusqu'à 3 couleurs selon une colonne (`=`, `≠`, `<`, `≤`, `>`, `≥`, `contient`).
- *Amélioré* — **Panneau de configuration refondu** : moitié de l'écran, aperçu de la disposition en haut, sections encadrées, explication au survol, position de défilement conservée.
- *Nouveau* — Menu de navigation : condition « visible si accès à une table ».

### Développeurs
- *Sécurité* — HTML des étiquettes de carte nettoyé par DOMPurify ; infobulles échappées ; bibliothèques en versions figées avec empreinte SRI (jsDelivr) ; liens du menu limités à `https://` ; export CSV protégé contre les formules.
- *Corrigé* — Mapping des colonnes de la carte enregistré par numéro de colonne, non reconnu.

## [0.4.1] — Barre d'outils et smartphone

### Utilisateurs
- *Nouveau* — Barre d'outils avec icônes et libellés (libellés en infobulle sur petit écran) ; affichage adapté aux smartphones ; blocs repliés mieux signalés.
- *Amélioré* — Palette de couleurs de carte plus contrastée ; valeurs invalides en rouge, vides en gris.
- *Corrigé* — Colonne Année trop large ; graphique qui s'allongeait sans fin ; bloc replié qui disparaissait en mode empilé ; blocs qui se chevauchaient sur smartphone.

### Administrateurs
- *Nouveau* — État des blocs à l'ouverture (auto, replié, déplié).

## [0.4.0] — Mode Disposition et export

### Utilisateurs
- *Nouveau* — Impression / PDF de la page, et export CSV par bloc.
- *Nouveau* — Tri et filtre par colonne depuis les en-têtes ; recherche par bloc ; listes de fiches.
- *Corrigé* — Boutons de filtre qui élargissaient les colonnes.

### Administrateurs
- *Nouveau* — **Mode Disposition** : déplacer et redimensionner les blocs à la souris.
- *Nouveau* — Fiche en mode liste et largeur des fiches ; largeur des colonnes (ajustées, figées, de la vue Grist, automatiques) ; mode « Empiler les blocs sans trous ».
- *Corrigé* — Blocs qui se chevauchaient ou ne se déplaçaient pas en mode Disposition.
- *Retiré* — Export Excel.

## [0.3.0] — Édition selon les droits

### Utilisateurs
- *Nouveau* — **Modification des valeurs** dans les tableaux et les fiches, selon les droits Grist (texte, nombres, dates, choix, références), avec sélecteurs intégrés et conditions de liste déroulante ; lecteurs en lecture seule.
- *Amélioré* — Ligne sélectionnée soulignée, cellules modifiables teintées au survol.
- *Corrigé* — Colonnes qui bougeaient au survol ; double-clic impossible pendant le rafraîchissement.

### Administrateurs
- *Nouveau* — Option de bloc « Édition des champs ».

## [0.2.1] — Navigation et performance

### Utilisateurs
- *Nouveau* — **Menu de navigation entre pages**, changement de page instantané dans le widget, ouverture en mode page unique.
- *Corrigé* — Page bloquée par un cycle de liaisons entre vues.

### Développeurs
- *Amélioré* — Préchargement des tables en parallèle et des autres pages du menu, cache, rendu progressif des grands tableaux, tri accéléré (Intl.Collator), rendu interrompu par un rendu plus récent.

## [0.2.0] — Configuration stockée, administration et cartes

### Utilisateurs
- *Nouveau* — **Cartes** (widget carte Grist) avec couleurs selon une colonne et contours des communes ; plein écran par bloc ; en-tête collant ; tableaux sans limite de lignes.
- *Corrigé* — Carte grise au premier affichage.

### Administrateurs
- *Nouveau* — **Configuration stockée dans le document** (table `W_Composition`), qui survit aux mises à jour du code.
- *Nouveau* — **Configuration réservée aux administrateurs** : table `W_Admin` et témoin `_Securite`.
- *Corrigé* — Configuration qui revenait à la première après une mise à jour du code.

### Développeurs
- *Nouveau* — Cartes rendues avec Leaflet ; coordonnées Lambert 93 et virgules décimales acceptées.

## [0.1.2] — Listes de sélection et mise en forme Grist

### Utilisateurs
- *Nouveau* — **Listes de sélection dans l'en-tête**, qui pilotent les blocs, navigables au clavier.
- *Nouveau* — **Mise en forme reprise de Grist** : gras, couleurs, règles conditionnelles, pastilles des choix, disposition des fiches ; descriptions de colonnes en infobulle.
- *Corrigé* — Tri des listes par commune puis par école.

### Administrateurs
- *Nouveau* — Listes de sélection : regroupement, ordre, synchronisation entre pages par identifiant commun.

## [0.1.1] — Graphiques avancés et mode ultracompact

### Utilisateurs
- *Nouveau* — **Graphiques avancés** (widget Plotly de Grist).
- *Corrigé* — Pages affichées « (sans nom) » ; graphiques vides ou limités à l'axe X.

### Administrateurs
- *Nouveau* — **Mode ultracompact** ; position des blocs : colonne de départ, hauteur en rangées.

## [0.1.0] — Prototype

### Utilisateurs
- *Nouveau* — Première version : plusieurs vues natives Grist (tableaux, fiches, graphiques) réaffichées sur une seule page, avec leurs liaisons (filtre, curseur, tables de synthèse).

### Administrateurs
- *Nouveau* — Grille de 6 colonnes et panneau de configuration.

### Développeurs
- *Nouveau* — Configuration des vues lue dans les tables de métadonnées `_grist_*`.
