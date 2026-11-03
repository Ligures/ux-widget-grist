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

## [0.9.4.27] — Icône du type de vue sur les blocs repliés — 2026-11-03

### Utilisateurs
- *Nouveau* — **Bloc replié** : l'icône du type de vue (tableau, fiche, graphique, carte, texte…) s'affiche devant son titre.
- *Corrigé* — **Texte (Markdown) modifiable sans l'aspect bloc-notes**, sur une table vide : la saisie est possible (elle ne l'était qu'avec l'aspect bloc-notes).

### Développeurs
- *Nouveau* — `blockShell` : `<span class="foldico">` (`kindIcon`) devant le titre, visible seulement sous `.block.collapsed`.
- *Corrigé* — Bloc Markdown sans ligne : test sur `mdEdit ?? mdNote` au lieu de `mdNote`.

## [0.9.4.26] — Bloc-notes vide : saisie possible — 2026-11-03

### Utilisateurs
- *Corrigé* — **Bloc-notes** sur une table vide (ou sans note pour l'élément sélectionné) : il s'affichait « Aucune donnée », sans moyen d'écrire. Il s'affiche désormais vide avec le bouton ✎ ; le premier enregistrement crée la ligne.

### Développeurs
- *Corrigé* — `render` n'écarte plus un bloc-notes sans ligne ; `renderMarkdown` crée la ligne par `AddRecord` (valeurs de liaison `S.linkSet` comprises) au premier enregistrement.

## [0.9.4.25] — Bloc-notes modifiable, second zonage plus discret — 2026-11-03

### Utilisateurs
- *Nouveau* — **Bloc-notes** : un widget Markdown peut s'afficher comme un bloc-notes (fond jaune pâle, marge rouge) et se modifier depuis la page : bouton ✎ ou double-clic, puis **Enregistrer** (Ctrl+Entrée) ou **Annuler** (Échap). Les droits Grist s'appliquent ; les lecteurs le voient sans pouvoir le modifier.
- *Amélioré* — **Cartes, second zonage** : pointillés plus fins et plus discrets (1 px au lieu de 2, 0,8 px pour les IRIS, tirets plus courts). Le survol garde sa zone de 16 px.

### Administrateurs
- *Nouveau* — Encadré **Texte (Markdown)** d'un bloc : case **Bloc-notes modifiable**. Le texte est enregistré dans la colonne *Content* du widget (colonne de données), pour la ligne affichée. Voir le guide administrateur, « Bloc-notes ».

### Développeurs
- *Nouveau* — Option `mdNote` ; `renderMarkdown` : vue `.mdnote`, édition dans un `textarea` (`S.editing` suspend les rendus), enregistrement par `saveValue` (`UpdateRecord`) ; bouton masqué à l'impression.
- *Amélioré* — Second zonage : `weight` 1 (IRIS 0,8), `opacity` 0,7, `dashArray` « 4 4 ».

## [0.9.4.24] — Zonage IRIS : trait plus visible, cadrage sur les quartiers — 2026-11-03

### Utilisateurs
- *Amélioré* — **Cartes, zonage principal « Quartiers IRIS » limité aux quartiers des points** : trait de 2 px et fond aussi visible que celui des communes (au lieu de 1 px et d'un fond très pâle, gardés pour l'affichage de tous les IRIS des communes).
- *Amélioré* — **Cadrage à l'ouverture** : la carte montre tous les quartiers IRIS dessinés, et plus seulement les points.

### Développeurs
- *Amélioré* — `drawZones` : `irisPts` (mode `iris`, `irisCol` renseigné, hors second zonage) → `weight: 2`, `fillOpacity: 0.18` ; `_uxExtend` appelé aussi pour les IRIS.

## [0.9.4.23] — Zonage IRIS limité aux quartiers des points — 2026-11-03

### Utilisateurs
- *Amélioré* — **Cartes, zonage « Quartiers IRIS »** : la carte peut ne dessiner que les quartiers des établissements affichés ; les zones suivent les filtres et les sélections.

### Administrateurs
- *Nouveau* — Configuration d'une carte, **Rattachement : quartiers IRIS** (zonage ou second zonage IRIS) : *tous les IRIS des communes des points* (comme avant), *IRIS qui contiennent des points* (position), ou une colonne de code IRIS (9 caractères ; commune non découpée : INSEE + `0000`). Avec une colonne, chaque point est rattaché au quartier de vos données, et les points sans code reconnu sont signalés sur la carte.

### Développeurs
- *Nouveau* — Option `irisCol` (`""`, `"__pts"` ou colId, suivie au renommage) ; code IRIS lu dans `p.zc.iris` (8 chiffres complétés d'un zéro) ; `drawZones` ne garde que les zones qui ont des points.

## [0.9.4.22] — Zonage IRIS : communes non découpées — 2026-11-03

### Utilisateurs
- *Amélioré* — **Cartes, zonage « Quartiers IRIS »** : une commune qui n'est pas découpée en IRIS est dessinée en entier (« Nom (commune non découpée) »), au lieu de rester sans zone.

### Administrateurs
- *Amélioré* — Couleur des zones *selon une table Grist* en IRIS : une commune non découpée est reliée par le code IRIS INSEE + `0000` (ex. `291030000`), comme dans les fichiers de l'INSEE.

### Développeurs
- *Amélioré* — `drawZones`, mode `iris` : pour les codes INSEE des points sans IRIS (`type_iris<>'Z'` les exclut du WFS), contour communal de geo.api.gouv.fr (`fetchCommuneShapes`), clé `<INSEE>0000`.

## [0.9.4.21] — Second zonage au choix, regroupements lus dans une table d'établissements — 2026-11-02

### Utilisateurs
- *Nouveau* — **Cartes** : une seconde liste dans l'en-tête choisit le **second zonage** (contours en pointillés par-dessus le premier), par exemple réseaux pédagogiques colorés + circonscriptions IEN. Gardé jusqu'à la fermeture de l'onglet, comme le premier ; l'en-tête imprimé l'indique (« Contours : … »).
- *Corrigé* — **Regroupement lu dans une table d'établissements** (ex. `REF_ETAB` : `CODE_COM`, `CODE_CIRCO`) : des communes avec établissement manquaient au tracé. La dernière ligne de la commune l'emportait, même vide (collège sans circonscription…) ; la commune prend désormais la valeur la plus fréquente parmi ses lignes non vides.

### Administrateurs
- *Amélioré* — Regroupements : la colonne du code INSEE peut être une référence vers la table des communes, même affichée par le nom de la commune (le code INSEE est lu dans la ligne référencée).

### Développeurs
- *Nouveau* — `userZone(id, k)` / `setUserZone(id, v, k)` : k = 2 pour le second zonage (`S.zoneSel2`, clé `…_2` en `sessionStorage`) ; `renderMap` remplace `mapZone2` par ce choix.
- *Amélioré* — `tableMap(table, code, valeur, group)` : en mode regroupement, vote majoritaire par commune sur les lignes non vides, et code INSEE cherché dans la ligne référencée quand la référence s'affiche autrement.

## [0.9.4.20] — Zonage d'origine à chaque ouverture — 2026-11-02

### Utilisateurs
- *Amélioré* — **Cartes** : le zonage choisi dans la liste « Zonage » est gardé jusqu'à la fermeture de l'onglet, et non plus d'une visite à l'autre ; à la réouverture du document, la carte reprend le zonage prévu par sa configuration.

### Développeurs
- *Amélioré* — `userZone` / `setUserZone` : `sessionStorage` au lieu de `localStorage` ; l'ancienne clé `uxwg_zone_…` est effacée de `localStorage` à la lecture.

## [0.9.4.19] — Plusieurs regroupements de communes par carte — 2026-11-02

### Utilisateurs
- *Nouveau* — **Cartes** : la liste « Zonage » peut proposer jusqu'à trois regroupements de communes (par exemple réseaux pédagogiques et circonscriptions IEN).

### Administrateurs
- *Nouveau* — Configuration d'une carte, « Zones sous les points » : réglages *Regroupement 1*, *2*, *3* (table des communes, code INSEE, colonne, libellé), toujours visibles ; un regroupement de plus apparaît quand le précédent est complet. Un regroupement complet est proposé aux utilisateurs même s'il n'est pas le zonage par défaut, et peut être choisi comme *Zonage* ou *Second zonage*.

### Développeurs
- *Nouveau* — Zonages `groupe2` et `groupe3`, options `grp2Table`/`grp2Key`/`grp2Col`/`grp2Label` et `grp3…` (colonnes suivies au renommage) ; aides `isGrp`, `grpN`, `grpF`, `grpOpt`, `grpChoices`.

## [0.9.4.18] — Zonage mémorisé qui n'existe plus — 2026-11-02

### Utilisateurs
- *Corrigé* — **Cartes** : un zonage choisi dans la liste « Zonage » puis retiré de la configuration (par exemple un regroupement de communes) n'est plus appliqué. La carte reprend le zonage prévu, au lieu d'afficher « table, colonne du code INSEE et colonne de regroupement à choisir » sans aucun contour.

### Développeurs
- *Corrigé* — `userZone(id)` ne renvoie qu'un choix présent dans `zoneChoices(b)` de la carte.

## [0.9.4.17] — Zonage différé et plus rapide — 2026-11-02

### Utilisateurs
- *Amélioré* — **Cartes avec zonage** : la page et les points s'affichent d'abord, les zones ensuite, sans bloquer la page. La fusion des communes (réseaux, EPCI) est environ six fois plus rapide, et les contours des communes sont gardés 30 jours dans le navigateur au lieu d'être téléchargés à chaque ouverture.

### Développeurs
- *Nouveau* — `dissolve(geoms)` : fusion par annulation des côtés communs et enchaînement des côtés restants en anneaux (Polygon multi-anneaux, remplissage pair-impair) ; `polygon-clipping` ne sert plus qu'en repli.
- *Nouveau* — `cachedJson(url, jours)` : réponses de geo.api.gouv.fr dans le Cache Storage (`uxwg-geo-1`, 30 jours), repli sur un téléchargement simple.
- *Amélioré* — `drawZones` attend `requestIdleCallback` (1,5 s au plus) puis rend la main au navigateur toutes les 30 ms pendant la fusion.

## [0.9.4.16] — Zonage par regroupement de communes (réseaux pédagogiques) — 2026-11-02

### Utilisateurs
- *Nouveau* — **Cartes : zonage par regroupement de communes**, par exemple les réseaux pédagogiques. Chaque réseau qui contient des écoles affichées est dessiné en entier (communes sans école comprises), avec une couleur par réseau. Il figure dans la liste « Zonage » de la carte sous le nom choisi par l'administrateur.

### Administrateurs
- *Nouveau* — Configuration d'une carte, zonage *regroupements de communes (table Grist)* : table des communes (ex. `P_Communes`), colonne du code INSEE (ex. `CODE_COM`), colonne de regroupement (ex. `CODE_RP` ; une référence est lue par sa colonne d'affichage) et libellé (ex. *Réseaux pédagogiques*). Utilisable aussi comme second zonage (contours) et avec toutes les couleurs des zones (nombre de points, somme, table Grist reliée par le nom du regroupement).

### Développeurs
- *Nouveau* — Zonage `groupe` : options `grpTable`, `grpKey`, `grpCol`, `grpLabel` (colonnes suivies au renommage) ; `drawZones` lit la table par `tableMap`, charge les contours des départements de toutes les communes des groupes concernés et les fusionne (`polygon-clipping`), comme les EPCI. `zoneChoices(b)` : liste « Zonage » de la carte (le regroupement seulement s'il est configuré).
- *Amélioré* — `zoneTableValues` s'appuie sur `tableMap(table, code, valeur)` : code INSEE numérique à 4 chiffres complété d'un zéro ; une référence est rendue par son texte, plus par son identifiant.

## [0.9.4.15] — Fond de carte sur imprimante : retour au rendu de la 0.9.4.10 — 2026-11-02

### Utilisateurs
- *Corrigé* — **Carte imprimée seule, sur imprimante** : le fond de carte s'imprime de nouveau, comme en 0.9.4.10. Une carte affichée en plein écran garde son étendue (zoom ajusté au format de la page) ; une carte plus petite garde son centre et son zoom.

### Développeurs
- *Retiré* — `tilesSnapshot` (copie des tuiles dans un canevas), réduction CSS `.printscale` (`transform: scale`) et neutralisation de `will-change` à l'impression : ces ajouts (0.9.4.12 à 0.9.4.14) privaient l'imprimante du fond de carte.
- *Amélioré* — `printMap` : carte toujours au format 275 × 158 mm ; plein écran → `fitBounds` de l'étendue affichée avec `zoomSnap = 0` (zoom fractionnaire, rétabli après l'impression).

## [0.9.4.14] — Fond de carte et légende à l'impression sur imprimante — 2026-11-02

### Utilisateurs
- *Corrigé* — **Carte imprimée seule, sur imprimante** : le fond de carte est recopié en une seule image avant l'impression ; il s'imprime comme dans le PDF.
- *Corrigé* — **Légendes des cartes à l'impression** : complètes, au lieu d'être coupées à la hauteur de leur zone de défilement.

### Développeurs
- *Nouveau* — `tilesSnapshot` : tuiles chargées recopiées dans un canevas (×2) placé dans le volet des tuiles, couches de tuiles masquées à l'impression ; canevas retiré après l'impression.
- *Corrigé* — Impression : `.map-legend` sans hauteur maximale ; `canvas.print-tiles` exclu de la règle `max-width: 100 %` des graphiques.

## [0.9.4.13] — Fond de carte à l'impression — 2026-11-02

### Utilisateurs
- *Corrigé* — **Carte imprimée seule** : le fond de carte s'imprime en entier. L'impression attend que toutes ses tuiles soient chargées (8 secondes au plus), et le cadrage n'est plus refait pendant la préparation.

### Développeurs
- *Corrigé* — `printMap` : attente de l'évènement `load` de la couche de tuiles (`tileLayer.isLoading()`), drapeau `S.mapPrinting` qui suspend le recadrage automatique (`ResizeObserver`) ; à l'impression, `will-change` et transitions des tuiles Leaflet neutralisés (Chrome n'imprime pas toujours ces calques).

## [0.9.4.12] — Carte imprimée au zoom de l'écran — 2026-11-02

### Utilisateurs
- *Corrigé* — **Carte imprimée seule** : le zoom choisi à l'écran est conservé. Une carte plus grande que la page (plein écran) est imprimée exactement comme à l'écran, réduite à la taille du papier ; une carte plus petite est agrandie au format de la page, avec le même centre et le même zoom.

### Développeurs
- *Corrigé* — `printMap` : carte plus grande que la zone imprimable (275 × 158 mm) laissée à sa taille d'écran et réduite par `transform: scale()` (classe `printscale`, variables `--pw`, `--ph`, `--pk`), sans recadrage ; sinon agrandie au format papier avec `setView` (centre et zoom).

## [0.9.4.11] — Impression d'une carte en plein écran — 2026-11-02

### Utilisateurs
- *Corrigé* — **Carte imprimée seule depuis le plein écran** : la carte s'imprimait à moitié vide et décalée, car elle gardait la hauteur de l'écran pendant la préparation de l'impression ; elle prend maintenant la taille du papier, comme hors plein écran.

### Développeurs
- *Corrigé* — `html.printone .printme .map-box` : `flex: none !important` (le bloc agrandi est une colonne flexible qui étirait la carte).

## [0.9.4.10] — Impression et export des cartes corrigés, message d'accueil vu une fois — 2026-11-02

### Utilisateurs
- *Corrigé* — **Carte imprimée seule** : toute la zone visible à l'écran figure sur le papier (le cadrage s'adapte au format de la page au lieu de garder le même zoom, qui coupait le haut et le bas).
- *Corrigé* — **Carte exportée** : le fond de carte s'affiche (Plan IGN, à la place d'OpenStreetMap, qui refuse les fichiers ouverts depuis le poste : « Access blocked ») ; les points sont dessinés au-dessus des zones, et un élément qui ne peut pas être affiché n'empêche plus les suivants.
- *Amélioré* — **Message d'accueil** : vu une fois, il ne revient que si son texte est modifié — ni à la visite suivante, ni après une mise à jour du widget ou un enregistrement de la configuration. La case « Ne plus afficher ce message » disparaît ; Aide → « Message d'accueil » le réaffiche.

### Administrateurs
- *Amélioré* — `index.html` : fenêtre d'accueil sans case à cocher, avec une phrase d'explication (à déposer avec `ux-widget.js`).

### Développeurs
- *Corrigé* — `printMap` : `fitBounds` sur la zone visible avant impression ; `exportMap` : tuiles `data.geopf.fr` (WMTS `PLANIGNV2`) quand la source est `tile.openstreetmap.org`, cercles triés après les polygones, `try/catch` par calque.
- *Amélioré* — Empreinte du message d'accueil enregistrée à chaque fermeture, aussi sous une clé de secours (`uxwg_welcome_doc`) quand l'identifiant du document n'a pas pu être lu à temps.

## [0.9.4.9] — Filtre libre à plusieurs valeurs, seconde ligne d'en-tête — 2026-11-02

### Utilisateurs
- *Amélioré* — **Filtre libre** : plusieurs valeurs peuvent être cochées ; le choix s'applique à la fermeture de la liste ou par **Appliquer** (**Toutes** décoche tout). Le bouton résume le choix (« Brest, Morlaix », ou « 3 valeurs »).
- *Amélioré* — **En-tête des blocs** : le filtre libre et les outils de la carte (zonage, impression, export) passent sur une seconde ligne ; le titre reste lisible.

### Développeurs
- *Amélioré* — `blockShell(…, extraRow)` crée la ligne `.bh2` ; filtre libre : `qfRowHtml`, `qfMultiHtml`, `qf3Open` / `qf3Close`, valeurs dans `S.qf["<bloc>:3"]` (tableau, vide = toutes).

## [0.9.4.8] — Cartes : impression sur une page, zoom progressif, filtre libre restreint — 2026-11-02

### Utilisateurs
- *Corrigé* — **Carte imprimée seule** : elle tient sur une page A4 paysage ; les choix (sélections, filtres, zonage, date) sont réunis sur une ligne sous le titre.
- *Amélioré* — **Zoom des cartes plus progressif** : demi-niveaux aux boutons + / −, molette et pincement deux fois plus doux, cadrage plus fin ; de même dans les cartes exportées.
- *Amélioré* — **Smartphone** : ni impression de la carte seule, ni zonage au choix, ni filtre libre (l'export reste proposé).

### Administrateurs
- *Nouveau* — **Filtre libre** : liste **Colonnes proposées** à cocher (`qfFreeCols`) ; aucune cochée : toutes les colonnes.

### Développeurs
- *Amélioré* — `MAP_ZOOM` (`zoomSnap` 0,25, `zoomDelta` 0,5, `wheelPxPerZoomLevel` 120) ; carte imprimée de 275 × 158 mm ; classe `qf3` du 3ᵉ filtre ; `qfFreeCandidates`.

## [0.9.4.7] — Cartes : imprimer seule, exporter, zonage au choix ; filtre libre — 2026-11-02

### Utilisateurs
- *Nouveau* — **Cartes, imprimer la carte seule** : icône d'imprimante dans l'en-tête de la carte ; A4 paysage, carte à pleine page avec ses légendes, titre, sélections, filtres et zonage en tête, cadrage de l'écran conservé.
- *Nouveau* — **Cartes, export interactif** : un fichier HTML autonome, à ouvrir dans un navigateur sans Grist (zoom, étiquettes, infobulles, zones et légendes comme à l'écran). Il contient les données visibles au moment de l'export.
- *Nouveau* — **Cartes, zonage au choix** : liste dans l'en-tête (aucun, communes, intercommunalités, quartiers IRIS, circonscriptions législatives, secteurs de collège), mémorisée dans le navigateur pour chaque carte.
- *Nouveau* — **Filtre libre** (« Filtrer sur… ») : l'utilisateur choisit une colonne de la table, puis une valeur ; il se cumule avec les filtres rapides.

### Administrateurs
- *Nouveau* — Encadré **Filtre libre** : case **Proposer un filtre libre** (`qfFree`), pour tout bloc qui accepte les filtres rapides.
- *Nouveau* — Encadré **Points** des cartes : case **Export réservé aux administrateurs** (`mapExportAdmin`).
- *Amélioré* — Le zonage de la configuration reste celui proposé au départ ; un zonage choisi par l'utilisateur reprend les couleurs par défaut (les couleurs propres à un zonage, table ou somme, ne s'appliquent qu'au zonage configuré).

### Développeurs
- *Nouveau* — Filtre libre : 3ᵉ emplacement des filtres rapides (`qfKey` `id:3`, colonne dans `S.qfFreeCol`).
- *Nouveau* — `userZone` / `setUserZone` (`localStorage`, clé `uxwg_zone_<document>_<page>_<bloc>`) ; `mapCtlHtml` ; `printMap` (classes `printone` / `printme`, carte de 275 × 165 mm à l'écran le temps de l'impression) ; `exportMap` (calques Leaflet relus avec `eachLayer`, styles, étiquettes, infobulles, volets et légendes ; Leaflet 1.9.4 par jsDelivr avec SRI).

## [0.9.4.6] — Cartes : message « deux doigts » plus discret — 2026-11-01

### Utilisateurs
- *Amélioré* — **Cartes sur écran tactile** : le message « Utilisez deux doigts pour déplacer la carte » n'apparaît plus à la fin d'un geste à deux doigts (quand un doigt se lève avant l'autre), ni pour un petit mouvement ; au plus une fois toutes les 30 secondes.

### Développeurs
- *Amélioré* — `mapGestures` : geste suivi de `touchstart` à `touchend` (multi-doigts mémorisé jusqu'au lever du dernier doigt), seuil de 40 px, intervalle de 30 s.

## [0.9.4.5] — Cartes : la page défile sans zoomer la carte — 2026-11-01

### Utilisateurs
- *Amélioré* — **Cartes** : la molette fait défiler la page au lieu de zoomer ; **Ctrl + molette** (⌘ sur Mac, ou pincement du pavé tactile) zoome. Sur écran tactile, **un doigt** fait défiler la page et **deux doigts** déplacent et zooment la carte. Un court message le rappelle. Les boutons + / − et le double-clic zooment toujours ; en plein écran du bloc, la carte est entièrement libre.

### Administrateurs
- *Nouveau* — Encadré **Points** des cartes : case **Zoom à la molette sans Ctrl** (`mapWheel`) pour retrouver l'ancien comportement sur un bloc.

### Développeurs
- *Nouveau* — `mapGestures` : molette sans Ctrl arrêtée en phase de capture avant Leaflet ; glisser désactivé au toucher (la page défile, `touch-action` de Leaflet), le pincement de Leaflet déplace et zoome ; carte libre si `.block.maxed` (recalcul à l'évènement `resize` de la carte).

## [0.9.4.4] — Agrégations des graphiques avancés — 2026-10-31

### Utilisateurs
- *Corrigé* — **Graphiques avancés avec agrégation** (moyenne, somme… par année, par exemple) : les valeurs sont agrégées comme dans Grist, une barre par catégorie, au lieu d'empiler chaque ligne ; les étiquettes montrent la valeur agrégée, arrondie au dixième.

### Développeurs
- *Corrigé* — `fixAggregate` : une transformation `aggregate` dont le regroupement est vide ou porte sur une colonne agrégée elle-même regroupe par l'axe des catégories (`groups: "x"`, ou `"y"` en barres horizontales) ; étiquettes reprenant les valeurs : `texttemplate` sur la valeur agrégée.

## [0.9.4.3] — Couleurs des séries regroupées des graphiques avancés — 2026-10-29

### Utilisateurs
- *Corrigé* — **Graphiques avancés dont les séries viennent d'une colonne de regroupement** (« Split » de l'éditeur, cas des graphiques natifs convertis) : chaque série prend la couleur choisie, d'après son nom renommé ou sa valeur ; la colonne de codes et la couleur de repli s'appliquent aussi.

### Développeurs
- *Corrigé* — `renderAdvChart` : transformation `groupby` colorée par `styles[].value.marker.color` (cible = valeur du groupe ; nom lu dans `styles[].value.name`), au lieu d'une couleur par barre.

## [0.9.4.2] — Couleurs des barres des graphiques avancés — 2026-10-29

### Utilisateurs
- *Corrigé* — **Graphiques avancés en barres à plusieurs séries** (par exemple convertis depuis un graphique natif) : les couleurs choisies s'appliquent ; les séries sans nom prennent dans la légende le nom de leur colonne au lieu de « trace 0 ».

### Développeurs
- *Corrigé* — `renderAdvChart` : une trace sans `name` est rapprochée de la correspondance des couleurs par le libellé de sa colonne de valeurs (`ysrc`, ou `xsrc` en barres horizontales) ; catégories imbriquées (plusieurs colonnes d'axe) assemblées en une étiquette par barre.

## [0.9.4.1] — Icône devant le titre de la page — 2026-10-29

### Utilisateurs
- *Amélioré* — **Icône de la page** : quand la page affiche un titre, l'icône le précède, à sa taille, comme sur le lien du menu. Sans titre, elle reste devant les listes de sélection.

### Développeurs
- *Amélioré* — `pageIcon("ticon")` dans `#title` ; `picon` réservé aux pages sans titre.

## [0.9.4.0] — Icône de la page — 2026-10-29

Palier 0.9.4 ; les livraisons 0.9.3.0 à 0.9.3.14 sont regroupées dans « 0.9.3 » ci-dessous.

### Utilisateurs
- *Nouveau* — **Icône de la page** : l'icône du lien de menu de la page s'affiche en tête de page, avant les listes de sélection, à leur hauteur et dans la couleur du thème ; seule, s'il n'y a pas de liste. Elle est masquée sur smartphone et reprise dans l'en-tête imprimé.

### Administrateurs
- *Nouveau* — Rien à régler : l'icône est celle saisie pour le lien de la page dans **Menu des pages** (champ « Icône (code SVG) »). Une page sans icône dans le menu n'en affiche pas.

### Développeurs
- *Nouveau* — `pageIcon()` : icône de l'élément de `nav.items` dont `cfg` est la configuration affichée, nettoyée par `safeSvg` ; classes `picon` (en-tête, 48 px) et `phicon` (impression, 40 px).

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
