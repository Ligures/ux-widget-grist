# UX widget grist

<img src="aia.png" alt="AIA" width="40" align="left" /> **AIA — Assisté par l'intelligence artificielle.** Ce widget et sa documentation ont été réalisés avec l'assistance d'une IA, sous la direction et avec la validation de leur auteur. Icône : [Martine Peters](https://mpeters.uqo.ca/utilisation-transparente-de-lintelligence-artificielle/), CC BY-NC-SA 4.0.
<br clear="left" />

Widget personnalisé [Grist](https://www.getgrist.com/) qui rassemble sur **une seule page, condensée et lisible**, plusieurs vues natives d'un document : tableaux, fiches, listes de fiches, graphiques natifs et avancés, cartes et listes déroulantes.

Le widget ne duplique rien. Il **relit la configuration des vues Grist** (tables de métadonnées `_grist_*`) et en reproduit le rendu. Cela comprend les colonnes affichées, le tri, les filtres, les liaisons entre vues, la mise en forme conditionnelle et la disposition des fiches. Quand une vue change dans Grist, la page suit.

**Version actuelle : 0.9.1.12** (en développement) · Développeur : **Ligures** — voir le [journal des modifications](CHANGELOG.md).
Pour l'usage au quotidien, voir le [guide d'utilisation](GUIDE-UTILISATEUR.md), aussi accessible dans le widget par le bouton **Aide**.

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Contenu du dépôt](#contenu-du-dépôt)
- [Installation](#installation)
- [Préparer le document Grist](#préparer-le-document-grist)
- [Cartes et zonages](#cartes-et-zonages)
- [Sécurité et confidentialité](#sécurité-et-confidentialité)
- [Dépendances](#dépendances)
- [Structure du code](#structure-du-code)
- [Limites connues](#limites-connues)
- [Licence et sources des données](#licence-et-sources-des-données)

---

## Fonctionnalités

**Vues prises en charge**

| Vue Grist | Rendu dans la page |
|---|---|
| Tableau | Tableau à largeurs ajustées, en-têtes fixes, tri et filtres par colonne, recherche, colonnes figées |
| Fiche | Fiche avec la disposition de la vue Grist, navigation précédent / suivant, ou toutes les fiches en liste |
| Fiches | Liste de fiches, largeur réglable |
| Graphique | Graphiques natifs (barres, lignes, secteurs, aires…) avec Chart.js |
| Graphique avancé | Widget Plotly de Grist, sources de données comprises |
| Carte | Widget carte de Grist avec Leaflet, voir [Cartes et zonages](#cartes-et-zonages) |
| Liste déroulante | Liste de sélection dans l'en-tête, qui pilote les autres blocs |

**Comportements repris de Grist**
- Liaisons entre vues : filtre, curseur, tables de synthèse.
- Mise en forme : couleurs, gras, règles conditionnelles de cellule et de ligne, pastilles des choix.
- Descriptions de colonnes en infobulle.
- Fiche d'un enregistrement référencé, ouverte en fenêtre superposée.
- **Édition** des champs, si le bloc l'autorise :
  - texte, nombres, dates, choix, références, références multiples ;
  - conditions des listes déroulantes ;
  - les règles d'accès de Grist s'appliquent, les lecteurs restent en lecture seule.

**Filtrer**
- **Listes de sélection** dans l'en-tête :
  - regroupement et ordre réglables ;
  - synchronisation d'une page à l'autre ;
  - liste masquée automatiquement quand une seule entrée est possible (selon les droits).
- **Filtre rapide par bloc** : boutons `Tous | valeur 1 | valeur 2…` sur un champ au choix, avec une valeur à l'ouverture. Selon la place disponible, ils se réduisent en un bouton unique, puis en une icône.

**Mise en page**
- Grille de 6 colonnes : largeur, colonne de départ, hauteur en rangées, retour à la ligne.
- Mode ultracompact : blocs ajustés à leurs données.
- Mode empilé sans trous.
- **Mode Disposition** : déplacer et redimensionner les blocs à la souris.
- Blocs repliables, état à l'ouverture réglable, blocs figés à l'écran, plein écran.
- Affichage adapté aux smartphones, avec les listes de sélection sur une seule ligne.

**Navigation et export**
- Menu commun à toutes les configurations. Les pages que l'utilisateur ne peut pas lire sont masquées, et un lien peut être conditionné à l'accès à une table.
- Changement de configuration instantané dans le widget : une seule page Grist peut accueillir toutes les configurations.
- Impression / PDF.

**Aide intégrée**
- **Aide** (dans le menu ☰) : guide, nouveautés et README (ce dernier réservé aux administrateurs), lus directement dans les fichiers du dépôt.
- Pastille signalant une nouvelle version.

---

## Contenu du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | La page du widget (structure HTML), servie par défaut par GitHub Pages |
| `ux-widget.js` | Le script du widget |
| `ux-widget.css` | Les styles du widget |
| `qpv-bretagne.geojson` | Périmètres des quartiers prioritaires 2024 (22, 29, 35, 56), facultatif |
| `aia.png` | Icône AIA (« assisté par l'IA ») de Martine Peters, affichée dans l'aide |
| `README.md` | Ce document : installation et fonctionnement technique (onglet « À propos » de l'aide) |
| `GUIDE-UTILISATEUR.md` | Guide des utilisateurs (onglet « Guide ») |
| `GUIDE-ADMINISTRATEUR.md` | Guide des administrateurs : composer les pages (onglet « Administration », visible des seuls administrateurs) |
| `CHANGELOG.md` | Journal des modifications (onglet « Nouveautés ») |
| `LICENSE` | Licence MIT du code, et ce qu'elle ne couvre pas |

Les quatre fichiers Markdown sont lus par le widget : ils doivent rester à côté de `index.html`, avec ces noms.

---

## Installation

Le widget tient en **trois fichiers** (`index.html`, `ux-widget.js`, `ux-widget.css`), sans étape de construction.

1. **Héberger les fichiers** : déposer `index.html`, `ux-widget.js`, `ux-widget.css`, `qpv-bretagne.geojson`, les fichiers Markdown et `aia.png` dans un dépôt GitHub (par exemple `ux-widget-grist`), puis activer **GitHub Pages** (*Settings → Pages → Deploy from a branch → main / root*).
   Adresse obtenue :
   ```
   https://<compte>.github.io/<dépôt>/
   ```
2. **Ajouter le widget dans Grist** :
   - *Ajouter un widget → Personnalisé*, sur n'importe quelle table ;
   - *URL personnalisée* : coller l'adresse ci-dessus ;
   - *Niveau d'accès* : **Accès complet au document**. Le widget doit lire les métadonnées des vues.
3. **Choisir l'apparence** : dans la configuration, section Affichage, un administrateur choisit le **style État (DSFR)**, réservé aux services de l'État, ou le **style neutre**, pour toute autre structure (voir [Apparence et DSFR](#apparence-et-dsfr)). Par défaut : style État.
4. **Mettre à jour** : remplacer les fichiers modifiés dans le dépôt (en général `index.html`, `ux-widget.js` et `ux-widget.css` ensemble, car `index.html` porte le numéro de version des deux autres), attendre la republication (1 à 2 minutes), puis recharger Grist avec **Ctrl+F5**. La version installée s'affiche en bas du panneau de configuration.

**Organisation recommandée**
- Garder les vues natives sur des pages « support », éventuellement masquées aux utilisateurs.
- Placer le widget sur **une seule page** d'affichage.
- Dans le menu de navigation, activer *Changer de page dans le widget* et choisir **— ce widget —** pour chaque lien.

> Tout autre hébergement statique en HTTPS convient aussi, par exemple un serveur interne. Le fichier GeoJSON des QPV doit être placé à côté du widget, ou son adresse indiquée dans la configuration de la carte.

**Migration depuis l'ancien nom (« page composée »)**
- Le dépôt s'appelle désormais `ux-widget-grist` et le widget est servi à sa racine (`index.html`) : mettre à jour l'URL du widget dans Grist.
- Les configurations enregistrées sont conservées.

---

## Préparer le document Grist

Le widget enregistre sa configuration **dans le document**. Elle survit donc aux mises à jour du code.

| Table | Rôle | Création |
|---|---|---|
| `W_Composition` | Une ligne par configuration (`Nom`, `Config` en JSON). Contient aussi la ligne réservée `_Navigation` (menu commun, apparence). Une ligne `_Securite` héritée des versions antérieures à 0.8.10 n'est plus utilisée | Automatique au premier enregistrement |
| `W_Admin` | Détermine qui peut configurer : seules les personnes qui **lisent au moins une ligne** de cette table ont accès à **Configurer** et **Disposition** | Automatique au premier enregistrement (avec une ligne), ou à créer à la main |

**Règles d'accès recommandées**
- `W_Admin` : lecture réservée aux propriétaires, par exemple refuser la lecture si `user.Access != OWNER`.
- `W_Composition` : lecture pour tous, **modification réservée aux propriétaires**.

Masquer les boutons n'est qu'un confort. La vraie protection, ce sont ces règles d'accès.

**Fermé par défaut** (depuis 0.8.10) : si `W_Admin` est absente ou illisible, personne ne peut configurer, sauf dans un document qui n'a encore aucune configuration (installation). Le premier enregistrement crée alors `W_Admin` avec une ligne ; tant qu'aucune règle d'accès ne la protège, tous les éditeurs peuvent configurer. Pensez à poser la règle juste après l'installation.

Pour vérifier : *Règles d'accès → Voir en tant que* un éditeur, puis ouvrir la page du widget : ni le bouton ⚙ Configurer ni l'action ☰ → Disposition ne doivent apparaître.

La composition des pages (choix des vues, réglages des blocs, filtres rapides, menu) est décrite dans le [guide d'administration](GUIDE-ADMINISTRATEUR.md).

---

## Cartes et zonages

Un bloc carte reprend le widget carte de Grist : colonnes Nom / Latitude / Longitude, fond de carte. Les coordonnées en Lambert 93 et les virgules décimales sont acceptées.

**Points**
- **Étiquette** : par défaut la colonne « Name » de la carte Grist. Si elle contient du HTML, l'étiquette s'ouvre au clic, après nettoyage.
- **Couleur selon** une colonne.
- **Contour selon** une colonne, avec 3 couleurs choisies au plus, ou selon la **situation QPV**.

**Zonages** (sous les points)

| Zonage | Source | Remarque |
|---|---|---|
| Communes | [geo.api.gouv.fr](https://geo.api.gouv.fr) | Communes qui contiennent des points |
| EPCI | geo.api.gouv.fr, communes fusionnées | EPCI entiers |
| IRIS | Géoplateforme IGN, couche WFS `STATISTICALUNITS.IRISGE:iris_ge` | Communes découpées en IRIS uniquement |
| QPV | Fichier GeoJSON fourni (QPV 2024, ANCT) | Points dans un QPV ou à moins de X m |

**Commune des points** : lue dans une colonne de code INSEE (directement ou via une référence), sinon **déduite de la position du point**.

**Couleur des zones**
- Une couleur par zone, ou un dégradé selon le nombre de points ou la somme d'une colonne.
- Ou une valeur lue dans **une table Grist reliée par code** (code INSEE, SIREN, code IRIS).

**Couche QPV pour un autre territoire**
1. Télécharger les périmètres sur [data.gouv.fr (ANCT)](https://www.data.gouv.fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv).
2. Filtrer les départements voulus.
3. Convertir en WGS84 (EPSG:4326).
4. Déposer le fichier à côté du widget, puis indiquer son nom dans l'option *Fichier des QPV*.

---

## Sécurité et confidentialité

- **Droits** : le widget passe par l'API de Grist et ne contourne aucune règle d'accès. Les lecteurs ne peuvent rien modifier.
- **Affichage des données** : toutes les valeurs insérées dans la page sont échappées.
- **HTML des étiquettes de carte** : nettoyé par DOMPurify. La mise en forme est conservée ; scripts et gestionnaires d'événements sont retirés.
- **Politique de sécurité (CSP)** : la page n'accepte que ses propres scripts (`ux-widget.js`) et ceux de Grist et de jsDelivr ; tout script en ligne, ou injecté dans une valeur, est refusé par le navigateur. Les connexions sont limitées au site du widget, à jsDelivr et aux services géographiques publics (geo.api.gouv.fr, data.geopf.fr). `unsafe-eval` reste autorisé pour Plotly (graphiques avancés).
- **Bibliothèques externes** : versions figées, vérifiées par empreinte d'intégrité (SRI). Un fichier altéré sur le CDN est refusé.
- **Liens du menu** : seules les adresses `https://` sont acceptées.
- **Données envoyées à des services tiers (cartes)** : aucune valeur des tables (noms, effectifs, IPS, étiquettes…) ne quitte le navigateur. Seuls des codes géographiques, et parfois une position, partent vers des services publics :

  | Service | Ce qui est envoyé | Quand |
  |---|---|---|
  | geo.api.gouv.fr (Etalab) | le **code du département** (22, 29…) | zonage par communes ou EPCI : contours de toutes les communes du département |
  | geo.api.gouv.fr | les **coordonnées d'un point** (latitude, longitude) | seulement pour un point sans code INSEE, afin de trouver son département |
  | data.geopf.fr (IGN) | des **codes INSEE de communes** | zonage IRIS : contours des IRIS de ces communes |
  | Fond de carte (OpenStreetMap par défaut, ou le fournisseur réglé dans la carte Grist) | les numéros des tuiles affichées | toujours : le fournisseur voit la zone regardée, pas les points |
  | Fichier QPV | rien | lu sur le même site que le widget |

  Comme pour toute page web, chaque service voit aussi l'adresse IP de l'utilisateur et le site d'origine de la demande. Les bibliothèques (jsDelivr) sont téléchargées sans aucune donnée du document.
- **Compte d'hébergement** : quiconque peut modifier le dépôt modifie le widget de tous les utilisateurs. Activez la double authentification et limitez les droits d'écriture.

---

## Dépendances

Toutes sont chargées depuis un CDN, en version figée, avec empreinte d'intégrité.

| Bibliothèque | Version | Usage | Chargement |
|---|---|---|---|
| grist-plugin-api | — | API des widgets Grist | Au démarrage |
| Chart.js | 4.4.1 | Graphiques natifs | Au démarrage |
| Leaflet | 1.9.4 | Cartes | À la première carte |
| Plotly | 2.35.2 | Graphiques avancés | Au premier graphique avancé |
| DOMPurify | 3.2.6 | Nettoyage du HTML des étiquettes | Si une étiquette contient du HTML |
| polygon-clipping | 0.15.7 | Fusion des communes en EPCI | Avec le zonage EPCI |
| marked | 12.0.2 | Mise en forme de l'aide (Markdown) | À la première ouverture de l'aide |

Police : Marianne (style État), chargée depuis le paquet `@gouvfr/dsfr` 1.14.4 ; police du système en style neutre.

### Apparence et DSFR

Le widget est **inspiré** du Système de design de l'État (DSFR), sans en être une implémentation officielle : il ne charge ni le CSS ni le JavaScript du DSFR.

- **Style État (DSFR)** : police Marianne, bleu France (`#000091`). Le DSFR et la police Marianne sont réservés aux services de l'État par leurs [conditions d'utilisation](https://www.systeme-de-design.gouv.fr/composants-et-modeles).
- **Style neutre** : police du système, bleu neutre (`#1f4e8c`). À utiliser par toute autre structure (collectivité, association, entreprise…).

Le choix est commun au document ; il est enregistré dans la ligne `_Navigation` de `W_Composition` (`nav.theme`). Sans choix enregistré, le widget s'affiche en style État.

---

## Structure du code

Les trois fichiers sont commentés. Un **sommaire** en tête de `ux-widget.js` décrit les parties, le cycle de vie, le stockage et le schéma de configuration. Chaque fonction est précédée d'une ligne d'explication.

```
index.html      en-tête (menu, barre d'outils, listes de sélection), grille, panneau, aide ;
                politique de sécurité (CSP) ; charge ux-widget.css et ux-widget.js
ux-widget.css   grille, blocs, tableaux, fiches, filtres rapides, cartes, panneau de configuration, impression
ux-widget.js
  État (objet S), VERSION et utilitaires
  Métadonnées      loadMeta, getInfo           lecture des vues Grist
  Données          rowsFor, selectedRowId      filtres, tri, liaisons
  Filtre rapide    qfCol, qfApply, qfHtml, fitQf
  Rendu des blocs  renderTable, renderSingle, renderCards, renderChart,
                   renderAdvChart, renderMap (+ zonages, QPV, IRIS)
  Rendu principal  render() via scheduleRender()
  Aide             openHelp, helpLoad          fichiers Markdown du dépôt
  Interactions, mode Disposition, export, configuration, navigation, démarrage (init)
```

**Cycle de vie**
1. `grist.onOptions` → `init()` : métadonnées, configurations, menu, droits.
2. `render()` : premier affichage.
3. Ensuite, toute modification passe par `scheduleRender()`. Un rendu doublé par un plus récent est abandonné. Les dessins lourds (cartes, graphiques, grands tableaux) sont différés après l'affichage.

**Règles de contribution**
- Toute valeur issue des données ou de la configuration passe par `esc()` avant d'être insérée en HTML.
- Une nouvelle bibliothèque est ajoutée à `LIBS`, avec sa version figée et son empreinte SRI.
- Une nouvelle option de bloc est déclarée dans `renderConfig()`, avec une explication au survol.
- Aucun script ni attribut `on…=` dans la page : la CSP les refuse. Les événements se branchent dans `ux-widget.js` (`addEventListener`).
- Une nouvelle adresse externe (service, CDN) doit être ajoutée à la CSP de `index.html`.
- Chaque version incrémente `VERSION` (dans `ux-widget.js`), le numéro `?v=…` des deux liens de `index.html` (pour vider le cache des navigateurs), et ajoute une entrée au `CHANGELOG.md`. Les utilisateurs voient alors la pastille « nouvelle version » sur le bouton Aide.

**Diagnostic** : la console du navigateur affiche une ligne `[UX widget] page « … » calculée en … ms`. Elle donne le nombre de blocs affichés, masqués ou non pris en charge, et la raison pour chaque bloc vide.

---

## Limites connues

- Formulaires et widgets personnalisés autres que carte et graphique avancé : non affichés.
- Conditions de liste déroulante qui utilisent `user` : la liste complète est proposée, et Grist valide à l'enregistrement.
- Contours geo.api.gouv.fr simplifiés : de fins traits peuvent subsister à l'intérieur d'un EPCI fusionné.
- Filtre rapide : son choix n'est pas mémorisé au rechargement (retour à la valeur à l'ouverture).
- Très grandes tables (plusieurs centaines de milliers de lignes) : le premier chargement peut prendre quelques secondes. Les tables sont ensuite en cache.

---

## Licence et sources des données

- **Code** : © 2026 Ligures, [licence MIT](LICENSE). Elle couvre uniquement le code et la documentation.
- **Police Marianne et identité visuelle de l'État** : non couvertes par la licence MIT ; soumises aux conditions d'utilisation du DSFR (voir [Apparence et DSFR](#apparence-et-dsfr)).
- **QPV 2024** : © ANCT, [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
- **Contours des communes et EPCI** : [API Découpage administratif](https://geo.api.gouv.fr), IGN / INSEE.
- **Contours IRIS** : © IGN – INSEE, via la Géoplateforme.
- **Fond de carte** : © contributeurs [OpenStreetMap](https://www.openstreetmap.org/copyright).
- **Icône AIA** : © 2023 Martine Peters, [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) — [Acronymes et icônes pour une utilisation transparente de l'IA](https://mpeters.uqo.ca/utilisation-transparente-de-lintelligence-artificielle/).
