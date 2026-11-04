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
- Depuis 0.8.10, un quatrième chiffre (`0.X.Y.Z`) change à chaque livraison intermédiaire : 0.9.3.1, 0.9.3.2… jusqu'au palier suivant.
- **Regroupement** : le palier en cours garde le détail de chaque livraison. Au passage au palier suivant, ses livraisons sont regroupées en une seule entrée (par exemple 0.9.1.0 à 0.9.1.19 dans « 0.9.1 »), qui ne garde que le résultat final.
- La version 1.0 sera la première version stable.

Les versions antérieures à 0.5.0 ont été développées avant la mise en dépôt du code. Leur numérotation est reconstituée a posteriori, et leurs dates ne sont pas connues précisément (septembre – début octobre 2026).

---

## [0.9.5.2] — Actualisation automatique — 2026-11-03

### Utilisateurs
- *Nouveau* — **Actualisation automatique** : une modification faite ailleurs (autre table, vue native de Grist, autre utilisateur) apparaît d'elle-même après quelques secondes, sans cliquer sur ⟳ Actualiser. La position de défilement est gardée ; rien ne bouge pendant une saisie.

### Administrateurs
- *Nouveau* — Configuration, **4. Affichage → Actualisation automatique** : toutes les 10 s à 2 minutes (20 s par défaut) ou désactivée ; commun à toutes les pages.
- *Sécurité* — `index.html` : `connect-src` autorise les instances Grist `grist.numerique.gouv.fr`, `grist.toutatice.fr`, `grist.ac-rennes.fr` et `*.getgrist.com` (lecture de l'état du document). Une autre instance doit y être ajoutée, sinon l'actualisation automatique reste inactive (message dans la console).

### Développeurs
- *Nouveau* — `liveStart` / `liveCheck` / `docState` : `GET <baseUrl>/states?auth=<jeton>` (jeton de `getAccessToken({ readOnly: true })`, renouvelé avant expiration), comparaison du dernier état (`n:h`), `refreshAll(true)` silencieux si changement ; pas de vérification si l'onglet est caché, pendant `S.editing` ou avec la configuration ouverte ; vérification au retour sur l'onglet (`visibilitychange`) ; arrêt après 3 échecs consécutifs.
- *Nouveau* — `docActions` remplace les appels directs à `applyUserActions` : une modification faite par le widget ne déclenche pas de second rendu.
- *Nouveau* — Option `nav.refresh` (secondes : 0, 10, 20, 30, 60, 120 ; absente = 20).

## [0.9.5.1] — Mode Disposition à la souris retiré — 2026-11-03

### Administrateurs
- *Retiré* — **☰ → Disposition** (déplacer et redimensionner les blocs à la souris). La disposition se règle dans le panneau ⚙ : flèches ↑ ↓, largeur, colonne et hauteur en lignes de chaque vue, avec l'aperçu en haut du panneau. Les dispositions déjà enregistrées ne changent pas.

### Développeurs
- *Retiré* — `enterLayout`, `exitLayout`, `layoutRowsCss`, glisser-déposer et poignée de redimensionnement (`.lyr`), `S.layoutMode`, bouton `#btnLayout` et barre `#lybar` d'`index.html`, styles `.grid.layout` (environ 200 lignes de script, 80 de styles).

## [0.9.5.0] — Script découpé en trois fichiers, chargés à la demande — 2026-11-03

Palier 0.9.5 ; les livraisons 0.9.4.0 à 0.9.4.27 sont regroupées dans « 0.9.4 » ci-dessous.

### Utilisateurs
- *Amélioré* — **Ouverture des pages sans carte** : le code des cartes (environ 1 550 lignes) n'est plus chargé ni analysé ; celui de la configuration (environ 1 300 lignes) ne l'est qu'à l'ouverture de ⚙. Aucun changement visible.

### Administrateurs
- *Nouveau* — Deux fichiers à déposer à côté de `index.html` : **`ux-carte.js`** (cartes) et **`ux-config.js`** (panneau de configuration). Sans eux, les cartes et la configuration ne s'ouvrent pas (message dans la barre d'état). Rien à changer dans Grist.

### Développeurs
- *Nouveau* — `ux-widget.js` (cœur, environ 5 100 lignes) charge les autres parties par `loadPart("carte" | "config")` : balise `<script>` du même site, même `?v=` que `VERSION`, une seule fois par page ; les trois fichiers partagent l'espace global (fonctions et `const` de premier niveau). `render` attend `ux-carte.js` quand la page contient une carte ; `openConfig` charge `ux-carte.js` puis `ux-config.js`, puis appelle `openConfigPanel`.
- *Amélioré* — Découpage sans modification du code déplacé ; dépendances vérifiées par analyse du code : le cœur n'appelle les cartes que depuis `render` et les commandes des cartes, et la configuration que par `openConfig`. CSP inchangée (`script-src 'self'`).

## [0.9.4] — Cartes (impression, export, zonages, regroupements, IRIS), bloc-notes, filtre libre — 2026-10-29 → 2026-11-03

Regroupe les livraisons 0.9.4.0 à 0.9.4.27.

### Utilisateurs
- *Nouveau* — **Icône de la page** (celle du lien de menu) devant le titre de la page, ou devant les listes de sélection quand la page n'a pas de titre ; masquée sur smartphone, reprise à l'impression.
- *Nouveau* — **Cartes, imprimer la carte seule** (icône d'imprimante) : A4 paysage sur une page, légendes complètes, titre puis sélections, filtres, zonages et date sur une ligne. Une carte en plein écran garde son étendue, une carte plus petite son centre et son zoom ; le fond de carte s'imprime aussi sur imprimante.
- *Nouveau* — **Cartes, export interactif** : fichier HTML autonome (zoom, étiquettes, infobulles, zones, légendes), avec le Plan IGN quand la carte utilise OpenStreetMap.
- *Nouveau* — **Cartes, zonage et second zonage au choix** dans l'en-tête de la carte (aucun, communes, intercommunalités, IRIS, circonscriptions législatives, secteurs de collège, regroupements configurés) ; choix gardés jusqu'à la fermeture de l'onglet, puis retour aux zonages de la configuration. Second zonage en fins pointillés.
- *Nouveau* — **Cartes, regroupements de communes** (jusqu'à trois par carte, par exemple réseaux pédagogiques, circonscriptions IEN) : chaque zone qui contient des points est dessinée en entier, communes sans école comprises.
- *Nouveau* — **Bloc-notes** : un widget Markdown peut se modifier depuis la page (✎ ou double-clic, Ctrl+Entrée, Échap), avec ou sans aspect papier ; sur une table vide, le premier enregistrement crée la ligne.
- *Nouveau* — **Filtre libre** (« Filtrer sur… ») : une colonne au choix, puis une ou plusieurs valeurs ; avec les outils de la carte, sur une seconde ligne de l'en-tête.
- *Nouveau* — **Bloc replié** : icône du type de vue devant son titre.
- *Amélioré* — **Cartes, gestes** : la molette fait défiler la page, **Ctrl + molette** zoome ; sur écran tactile, un doigt fait défiler la page, deux doigts déplacent la carte (message discret) ; zoom par demi-niveaux.
- *Amélioré* — **Zonages plus rapides** : dessinés après la page et les points, fusion des communes environ six fois plus rapide, contours des communes gardés 30 jours dans le navigateur.
- *Amélioré* — **Zonage IRIS** : communes non découpées dessinées en entier ; possibilité de ne dessiner que les quartiers des points (trait et fond plus visibles) ; la carte s'ouvre cadrée sur tous les quartiers.
- *Amélioré* — **Message d'accueil** : vu une fois, il ne revient que si son texte change.
- *Corrigé* — **Graphiques avancés** : couleurs des barres à plusieurs séries et des séries regroupées, noms de séries, agrégations (moyenne, somme…) calculées comme dans Grist, étiquettes arrondies.
- *Corrigé* — **Regroupement lu dans une table d'établissements** : la commune prend la valeur la plus fréquente parmi ses lignes renseignées (les lignes vides n'effacent plus la commune).

### Administrateurs
- *Nouveau* — **Cartes, encadré « Zones sous les points »** :
  - **Regroupement 1 à 3** : table (une ou plusieurs lignes par commune), code INSEE (texte ou référence), colonne de regroupement, libellé ; utilisable comme zonage, second zonage, ou au choix de l'utilisateur ;
  - **Rattachement : quartiers IRIS** : tous les IRIS des communes, IRIS qui contiennent des points, ou colonne de code IRIS (commune non découpée : INSEE + `0000`).
- *Nouveau* — Encadré **Points** : **Zoom à la molette sans Ctrl** (`mapWheel`), **Export réservé aux administrateurs** (`mapExportAdmin`).
- *Nouveau* — Encadré **Filtre libre** : **Proposer un filtre libre** (`qfFree`), **Colonnes proposées** (`qfFreeCols`).
- *Nouveau* — Encadré **Texte (Markdown)** : **Modifiable depuis la page** (`mdEdit`) et **Aspect bloc-notes** (`mdNote`) ; voir le guide administrateur, « Bloc-notes ».
- *Amélioré* — Couleur des zones *selon une table Grist* : une référence est rendue par son texte ; IRIS non découpé relié par INSEE + `0000`.
- *Amélioré* — README : fond de carte des cartes exportées (Plan IGN) dans la sécurité, les services appelés et les licences.

### Développeurs
- *Nouveau* — `printMap` (carte au format 275 × 158 mm, `fitBounds` avec `zoomSnap = 0` pour une carte plus grande que la page, attente des tuiles) ; `exportMap` (calques relus avec `eachLayer`, WMTS `PLANIGNV2` à la place d'OSM, Leaflet par jsDelivr avec SRI).
- *Nouveau* — Zonages : `groupe`, `groupe2`, `groupe3` (`grp…`, `grp2…`, `grp3…`), `tableMap(…, group)` (vote majoritaire, code INSEE lu dans la ligne référencée), `dissolve` (annulation des côtés communs), `cachedJson` (Cache Storage, 30 jours), `drawZones` différé (`requestIdleCallback`, pause toutes les 30 ms) ; `irisCol` ; `userZone(id, k)` en `sessionStorage` (k = 2 : second zonage), choix retiré de la configuration ignoré.
- *Nouveau* — `mapGestures`, `MAP_ZOOM` ; filtre libre (`qfKey` `id:3`, `qfRowHtml`, ligne `.bh2`) ; `renderMarkdown` : `mdEdit` / `mdNote`, `textarea` sous `S.editing`, `UpdateRecord` ou `AddRecord` ; `.foldico` (`kindIcon`) ; `fixAggregate`, couleurs `groupby` de `renderAdvChart`.
- *Retiré* — Copie des tuiles dans un canevas et réduction CSS à l'impression (essais 0.9.4.12 à 0.9.4.14), qui privaient l'imprimante du fond de carte.

## [0.9.3] — Message d'accueil, mode sombre, icônes du menu, distancier routier — 2026-10-25 → 2026-10-27

Regroupe les livraisons 0.9.3.0 à 0.9.3.14.

### Utilisateurs
- *Nouveau* — **Message d'accueil** à l'ouverture du widget, quand l'administrateur en a rédigé un : fenêtre de 60 % de la largeur (90 % sur écran étroit), parties repliables, case **« Ne plus afficher ce message »** (le message revient si le texte change) ; **Aide → « Message d'accueil »** le réaffiche à la demande.
- *Nouveau* — **Mode sombre** : le widget suit le réglage clair ou sombre du système, y compris pendant l'utilisation ; le fond de carte reste clair, légèrement assombri ; l'impression reste claire.
- *Nouveau* — **Nombre de lignes** en bas de chaque tableau (« 12 sur 686 lignes » pendant une recherche).
- *Nouveau* — **Icônes** devant les noms des pages dans le menu.
- *Amélioré* — **Style neutre** : couleur principale rouge bordeaux, distincte du bleu de l'État.
- *Corrigé* — **Textes sur plusieurs lignes** : les sauts de ligne sont conservés dans les champs « retour à la ligne ».
- *Corrigé* — **Widgets Markdown** ajoutés depuis la galerie de Grist : affichés (ils étaient pris pour des graphiques).

### Administrateurs
- *Nouveau* — Section **Message d'accueil** : texte en Markdown commun à toutes les pages, parties repliables (`+++ Titre` … `+++`, `+++! Titre` : dépliée au départ), bouton **Aperçu**.
- *Nouveau* — **Affichage → Mode clair / sombre** : comme le système (par défaut), toujours clair ou toujours sombre.
- *Nouveau* — **Menu des pages** : champ « Icône (code SVG) » par lien, avec aperçu ; les fichiers SVG téléchargés tels quels sont acceptés (déclaration XML, styles, classes, blocs `<switch>`).
- *Nouveau* — Encadré **Tableau** : case **Nombre de lignes** (cochée par défaut).
- *Nouveau* — **Distancier routier** (`outils/distancier.html`, widget à accès complet) : distances par la route de chaque école vers ses N écoles les plus proches par la route (résultat exact) et vers son collège de secteur, ajoutées à `REF_DISTANCES`. Service Metric-OSRM de l'Insee (par défaut, sans clé, 25 destinations par appel, sans bateaux) ou IGN ; restriction aux écoles publiques ; collège en référence ou en code UAI ; bouton **Tester un appel** ; arrêt et reprise sans perte.
- *Amélioré* — **Widget personnalisé non reconnu** : le message affiche la description enregistrée par Grist.
- *Amélioré* — `index.html` contient la fenêtre du message d'accueil : à déposer avec `ux-widget.js`.

### Développeurs
- *Sécurité* — Message d'accueil mis en forme par marked puis nettoyé par DOMPurify (attribut `open` conservé) ; SVG des icônes nettoyé par `safeSvg` (formes simples, attributs de dessin, couleurs en `currentColor`).
- *Nouveau* — Thème par variables CSS redéfinies sous `prefers-color-scheme: dark` et pour `html.sombre` ; `nav.mode`, `nav.welcome`, `nav.items[].icon` ; graphiques Chart.js et Plotly aux couleurs du thème, repassés en clair à l'impression.
- *Nouveau* — Distancier : arrêt anticipé exact (distance routière ≥ distance à vol d'oiseau), réutilisation du sens inverse, service « table » d'OSRM par lots de 25 (`exclude=ferry`), débit réglable, écritures `BulkAddRecord` par lots de 25, échecs jamais enregistrés.
- *Corrigé* — `cellStyle` : `wrap` → `white-space: pre-line` ; `mdSpec` reconnaît le widget Markdown par `widgetId` ou par sa seule correspondance `Content`.

## [0.9.2] — Configuration réorganisée, journal par public, Markdown, secteurs de collège — 2026-10-22 → 2026-10-24

Regroupe les livraisons 0.9.2.0 à 0.9.2.9.

### Utilisateurs
- *Nouveau* — **Widgets Markdown** de Grist affichés dans la page (texte de la ligne sélectionnée, lecture seule).
- *Nouveau* — **Description des vues** : un ⓘ suit le titre d'un bloc dont la vue a une description dans Grist ; le texte s'affiche au survol.
- *Corrigé* — **Camemberts** : les étiquettes extérieures de plusieurs mots passent à la ligne et ne sont plus coupées ; la légende redondante n'est plus affichée.
- *Amélioré* — **Cartes à deux zonages** : le nom du second zonage s'affiche près de son trait pointillé, ou partout à l'intérieur de ses contours selon le réglage.
- *Amélioré* — Onglet *Nouveautés* : seuls les changements qui concernent les utilisateurs y figurent.

### Administrateurs
- *Amélioré* — **Configuration des vues** : réglages rangés dans des encadrés titrés, dans le même ordre pour toutes les vues (Affichage, puis Tableau, Fiches, Édition, Liste de sélection, Texte, Couleurs, Filtres, cartes), côte à côte quand la place le permet ; blocs repliés par défaut.
- *Nouveau* — **Taille du texte** des widgets Markdown (`mdSize`).
- *Nouveau* — **Secteurs de collège** : outil `outils/secteurs-colleges.html`, qui construit le fichier de zonage à partir de la carte scolaire (adresses) ; fichier `secteurs-colleges-22.geojson` des Côtes-d'Armor ; l'option « Fichier : … » accepte plusieurs fichiers séparés par des virgules.
- *Nouveau* — **« Étiquette au survol »** pour les cartes à deux zonages : zonage principal ou second zonage (`zoneHover`).
- *Amélioré* — **Journal des modifications** organisé en trois rubriques (Utilisateurs, Administrateurs, Développeurs), et regroupement des livraisons à chaque changement de palier.

### Développeurs
- *Sécurité* — Markdown des widgets nettoyé par DOMPurify, comme l'aide.
- *Amélioré* — UAI reconnu dans `identifiant_etablissement` ; plusieurs fichiers de zonage réunis, zones de même code fusionnées.
- *Amélioré* — Second zonage : trait transparent de 16 px pour le survol ; camemberts avancés : `automargin`, noms des parts via `text`.
- *Nouveau* — Description des vues lue dans `_grist_Views_section.description`.

## [0.9.1] — Couleurs des graphiques, cartes enrichies, configuration plus lisible — 2026-10-18 → 2026-10-22

Regroupe les livraisons 0.9.1.0 à 0.9.1.19.

### Utilisateurs
- *Corrigé* — **Messages de refus** (« Modification refusée par les règles d'accès »…) : ils restent visibles au moins 4 s, et s'effacent après 8 s ou d'un clic.
- *Retiré* — Bouton **Plein écran** : réservé aux administrateurs, le widget étant déjà la vue par défaut des utilisateurs.
- *Amélioré* — **En-têtes de colonnes** des tableaux plus discrets (graisse moyenne, gris foncé).
- *Corrigé* — **Listes de fiches** : les champs sont au même endroit dans toutes les fiches, chacun à la largeur de sa plus longue valeur, sans retour à la ligne inutile ; un champ vide garde sa place.
- *Nouveau* — Fiches compactes, quand l'administrateur l'a choisi : seules les valeurs sont affichées, le nom du champ apparaît au survol.
- *Corrigé* — **Couleurs des graphiques** stables d'un affichage à l'autre quand l'administrateur les a fixées.
- *Amélioré* — **Cartes** : étiquettes et fenêtres d'information à angles droits, encadrées de la couleur du point, doublée à l'intérieur de la couleur de son contour. Sur une carte liée à d'autres blocs, la fenêtre d'un point reste ouverte après le clic.

### Administrateurs
- *Nouveau* — **Couleurs du graphique** pour tous les graphiques (camemberts, histogrammes, courbes, graphiques avancés) : correspondance « catégorie = #code », colonne de codes, couleur de repli. Camembert et histogramme à une série : une couleur par catégorie ; plusieurs séries : une couleur par série.
- *Nouveau* — **Fiches : « Masquer les noms des champs »** (`hideLabels`).
- *Nouveau* — **Listes de sélection : « Ordre des groupes »** (A → Z ou Z → A, nombres et années classés par valeur).
- *Nouveau* — **Cartes, nouveaux zonages** : circonscriptions législatives et secteurs de collège, lus dans des fichiers régionaux déposés à côté du widget (`circonscriptions-bretagne.geojson`, `secteurs-colleges-bretagne.geojson`, préparation décrite dans le README).
  - **Rattachement** des points à leur zone par position ou par une colonne de code (ex. `2201`, UAI).
  - **Second zonage (contours)** : un autre découpage en pointillés par-dessus le premier, pour croiser deux fonds de carte.
  - **Couleur des zones → aucune (contours seuls)**.
- *Amélioré* — **Configuration des vues** : icône, type puis titre de chaque vue ; chaque vue retenue forme une carte distincte, repliable (▾ / ▸, **Tout replier**, **Tout déplier**).

### Développeurs
- *Nouveau* — Zonages en fichier génériques (`FILE_ZONES`, `loadZoneFile`) : code et nom de zone reconnus d'après le nom des propriétés ; fichiers lus sur le site du widget, CSP inchangée.
- *Nouveau* — Couleurs passées à Plotly (`marker.color(s)`) et à Chart.js ; graisse « Medium » de Marianne chargée depuis le paquet DSFR.

## [0.9.0] — Code séparé, sécurité stricte, ajout et suppression de lignes, impression fidèle — 2026-10-14 → 2026-10-18

Regroupe les livraisons 0.9.0 à 0.9.0.10. Évolution majeure de la structure du widget.

### Utilisateurs
- *Nouveau* — **+ Ajouter une ligne** et **− Supprimer la ligne** en bas des blocs qui le proposent. La ligne ajoutée est rattachée à l'élément sélectionné (une classe sous l'école choisie) et sa saisie s'ouvre ; la suppression demande confirmation. Les règles d'accès s'appliquent, avec un message en cas de refus.
- *Amélioré* — **Impression en A4 paysage**, avec la disposition de l'écran. Les tableaux longs se poursuivent sur les pages suivantes, en-tête répété, sans pages blanches.
- *Amélioré* — **Messages** dans une bulle discrète en haut au centre : ils ne décalent plus la page.
- *Nouveau* — Infobulles sur les liens du menu des pages, quand l'administrateur en a saisi.
- *Corrigé* — **Lenteurs** au changement de page et aux sélections pour les personnes soumises à des règles d'accès.
- *Amélioré* — Cartes : légende de la 2ᵉ colonne de couleur allégée.

### Administrateurs
- *Amélioré* — **Trois fichiers au lieu d'un**, à déposer ensemble dans le dépôt : `index.html`, `ux-widget.css`, `ux-widget.js`.
- *Nouveau* — Option de bloc **« Ajout et suppression de lignes »** (tableaux et listes de fiches, avec « Édition des champs »).
- *Nouveau* — **Navigation** : champ « Infobulle » pour chaque lien du menu.
- *Amélioré* — Chaque filtre rapide a son encadré (champ, valeur à l'ouverture, valeurs exclues) ; l'option **(SO)** du 1er filtre peut être choisie à l'ouverture ou exclue.

### Développeurs
- *Sécurité* — **Politique de sécurité du contenu (CSP)** : aucun script en ligne ; scripts limités au site du widget, à Grist et à jsDelivr ; connexions limitées au site du widget, à jsDelivr, à geo.api.gouv.fr et à data.geopf.fr ; pas d'envoi de formulaire ni d'objets intégrés. L'attribut `onerror` de l'icône AIA est remplacé par un traitement dans le script.
- *Amélioré* — Style et script chargés avec le numéro de version (`?v=…`), contre le cache des navigateurs.
- *Nouveau* — Diagnostic dans la console (F12) : lectures de tables de plus de 200 ms et récapitulatif du premier chargement.
- *Corrigé* — Une table interdite en lecture était redemandée au serveur à chaque affichage ; le refus est mémorisé jusqu'au prochain « Actualiser ».
- *Amélioré* — Impression en flux normal au lieu de la grille CSS, que les navigateurs coupent mal d'une page à l'autre.

## [0.8.11] — Cadrage des cartes, filtres rapides affinés — 2026-10-14

Regroupe les livraisons 0.8.11.0 à 0.8.11.6.

### Utilisateurs
- *Nouveau* — **Cartes cadrées sur l'ensemble des données** à l'ouverture, recadrées quand le bloc change de taille ; bouton **⤢** pour y revenir.
- *Nouveau* — Cartes : points sans valeur pour la couleur principale colorés selon une 2ᵉ colonne, avec sa légende.
- *Amélioré* — **Filtres rapides** : même présentation pour les deux filtres d'un bloc (au-delà de 4 valeurs : valeur active et liste au clic) ; option **(SO)** dans le 1er filtre pour les lignes sans valeur ; filtres affichés même quand le bloc n'a aucune donnée.

### Administrateurs
- *Nouveau* — **Valeurs exclues** pour chaque filtre rapide.
- *Nouveau* — Cartes, **« … sinon selon »** : 2ᵉ colonne de couleur des points.
- *Amélioré* — Réglages d'une carte en quatre encadrés : Points, Contour des points, Quartiers prioritaires (QPV), Zones sous les points.

## [0.8.10] — Plein écran, droit de configurer fermé par défaut, page d'accueil, second filtre — 2026-10-12 → 2026-10-14

Regroupe les livraisons 0.8.10 à 0.8.10.6.

### Utilisateurs
- *Nouveau* — **Plein écran** : la page Grist du widget dans un nouvel onglet, sans les menus de Grist.
- *Amélioré* — **Grand écran** : toutes les actions en icônes dans la barre, libellé en infobulle (menu ☰ sur écran étroit). Actualiser (⟳) et Configurer (⚙) sont des boutons directs. Version du widget en infobulle de l'aide.
- *Nouveau* — **Second filtre rapide** sur certains blocs, cumulé au premier.
- *Corrigé* — Le widget ne demande plus quelle configuration afficher : il ouvre la page d'accueil.
- *Corrigé* — **Références vers des lignes non lisibles** : le texte calculé par Grist s'affiche, comme dans les vues natives, au lieu d'un numéro.
- *Amélioré* — L'onglet « Guide » de l'aide ne traite plus que de l'utilisation.

### Administrateurs
- *Sécurité* — **Droit de configurer fermé par défaut** : seul qui lit au moins une ligne de `W_Admin` peut configurer (sauf document encore sans configuration).
- *Nouveau* — **Page d'accueil** de la navigation ; la question « quelle configuration ? » n'est plus posée qu'aux administrateurs et leur réponse devient la page d'accueil.
- *Nouveau* — Réglage du **2ᵉ filtre rapide** par bloc.
- *Nouveau* — Onglet **Administration** de l'aide (`GUIDE-ADMINISTRATEUR.md`), réservé aux administrateurs.
- *Retiré* — Fenêtre de choix de l'apparence à la première ouverture : l'apparence se règle dans la configuration (section Affichage).
- *Amélioré* — « Ouvrir les pages en mode page unique » n'est plus proposé avec « Changer de page dans le widget ».

### Développeurs
- *Sécurité* — Un éditeur pouvait configurer quand le témoin `_Securite` manquait ou lui était illisible : une table interdite était prise pour une table absente.
- *Amélioré* — README : tableau des données envoyées aux services externes par les cartes.

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
