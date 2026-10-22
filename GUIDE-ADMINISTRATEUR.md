# Guide d'administration — UX widget grist

<img src="aia.png" alt="AIA" width="40" align="left" /> **AIA — Assisté par l'intelligence artificielle.** Ce widget et sa documentation ont été réalisés avec l'assistance d'une IA, sous la direction et avec la validation de leur auteur. Icône : [Martine Peters](https://mpeters.uqo.ca/utilisation-transparente-de-lintelligence-artificielle/), CC BY-NC-SA 4.0.
<br clear="left" />

Ce guide s'adresse aux **administrateurs**, qui composent les pages. Il n'est affiché dans l'aide qu'aux personnes qui peuvent configurer le widget. Pour l'utilisation courante, voir l'onglet **Guide** ; pour l'installation et le fonctionnement technique, l'onglet **À propos** (README).

---

## Sommaire

1. [Composer une page](#1-composer-une-page)
   - [Ouvrir la configuration](#ouvrir-la-configuration)
   - [Choisir et régler les vues](#choisir-et-régler-les-vues)
   - [Disposition](#disposition)
   - [Filtre rapide](#filtre-rapide)
   - [Listes de sélection](#listes-de-sélection)
   - [Cartes : réglages](#cartes--réglages)
   - [Graphiques : couleurs](#graphiques--couleurs)
   - [Menu de navigation](#menu-de-navigation)
   - [Apparence](#apparence)
   - [Enregistrer](#enregistrer)
2. [Questions fréquentes](#2-questions-fréquentes)

---

## 1. Composer une page

Le bouton **⚙ Configurer** et l'action **Disposition** n'apparaissent qu'aux administrateurs : les personnes qui lisent au moins une ligne de la table `W_Admin`.

### Ouvrir la configuration

Le bouton **⚙ Configurer** ouvre un panneau sur la moitié droite de l'écran :
- l'**aperçu de la disposition** reste affiché en haut ;
- chaque option est expliquée au **survol** de son libellé (soulignement en pointillés) ;
- rien n'est appliqué avant **Enregistrer**, et **Annuler** ferme le panneau sans rien changer.

**Général**
- **Page réglée** : la page dont on règle la composition. Par défaut, c'est la page affichée (marquée « — affichée »). On peut en choisir une autre : l'affichage du widget ne change pas.
- **＋ Nouvelle page** : crée une page vide, sans toucher à la page affichée. **Dupliquer** crée une nouvelle page à partir de celle en cours de réglage (mêmes blocs, mêmes réglages).
- Quand la page réglée n'est pas la page affichée, un encadré jaune le signale. L'enregistrement range alors la page dans `W_Composition` sans changer l'affichage. Deux options :
  - **L'afficher dans ce widget après l'enregistrement** : le widget affichera désormais cette page ;
  - **L'ajouter au menu de navigation** (mode « Changer de page dans le widget ») : un lien vers la page est ajouté au menu commun.
- **Nom de la page** : identifie la page dans `W_Composition`. Si le nom existe déjà, le widget demande confirmation avant de remplacer l'autre page. Un nom ne peut pas commencer par « _ » (réservé).
- **Liens vers des formulaires Grist** (facultatif) : « + Ajouter un lien vers un formulaire », puis un libellé (ex. « Signaler un problème »), un commentaire au survol facultatif (affiché dans une infobulle sur le bouton) et l'adresse du formulaire. Pour obtenir l'adresse : dans Grist, ouvrir la vue Formulaire, cliquer sur « Publier », puis « Partager » et copier le lien. Chaque lien devient un bouton dans l'en-tête de la page, à gauche du menu ☰. Le formulaire s'ouvre dans une fenêtre au-dessus de la page, ou dans un nouvel onglet si la case « nouvel onglet » est cochée. La fenêtre se ferme avec ✕, Échap ou un clic à côté, et toute seule après l'envoi du formulaire ; la page est alors rechargée pour montrer la nouvelle réponse. La fermeture automatique fonctionne si l'utilisateur peut lire la table du formulaire ; sinon, réglez dans Grist une redirection après l'envoi (n'importe quelle adresse). Le bouton ↗ de la fenêtre ouvre le formulaire dans un nouvel onglet. Seules les adresses en https sont acceptées.
- **Titre affiché** : laissé vide, il libère de la place en haut de page.

### Choisir et régler les vues

1. **Vues disponibles** : choisir une page Grist, puis cocher ses vues. On peut combiner des vues de plusieurs pages.
2. **Vues retenues** : chaque vue cochée devient un bloc.
   - Les flèches ↑ ↓ règlent l'ordre ; ✕ retire le bloc (la vue Grist n'est pas supprimée).
   - Les réglages de chaque bloc sont **repliés par défaut** : restent visibles son titre, ses flèches, sa largeur, sa colonne et son nombre de lignes. ▸ / ▾ déplie ou replie un bloc ; **Tout déplier** et **Tout replier** agissent sur tous. Une vue que l'on vient d'ajouter s'ouvre dépliée.
   - Déplié, un bloc présente ses réglages dans des encadrés titrés, toujours dans le même ordre :
     - **Affichage**, commun à toutes les vues : taille, état à l'ouverture, « À la ligne », « Figer à l'écran », « Liste de sélection » ;
     - puis les encadrés propres au type de vue, s'il y a lieu : **Tableau**, **Fiches**, **Édition**, **Liste de sélection**, **Couleurs du graphique**, **Filtre rapide**, et pour les cartes **Points**, **Contour des points**, **QPV**, **Zones sous les points**.
   - Chaque bloc a ses réglages :

| Réglage | Effet |
|---|---|
| Largeur, Colonne, Hauteur (lignes) | Place du bloc dans la grille de 6 colonnes |
| Taille | Hauteur maximale ; au-delà, le contenu défile dans le bloc |
| À l'ouverture | Bloc replié ou déplié à l'arrivée sur la page |
| À la ligne | Le bloc commence une nouvelle rangée |
| Figer à l'écran | Le bloc reste visible pendant le défilement d'un bloc voisin. Plusieurs blocs figés d'une même colonne s'empilent. Un bloc déplié trop haut défile à l'intérieur de son cadre ; un bloc dont même l'en-tête ne tient plus défile normalement, sous les autres |
| Édition des champs | Autorise la modification des valeurs (droits Grist respectés) |
| Ajout et suppression de lignes | Tableaux et listes de fiches, avec « Édition des champs » : boutons « + Ajouter une ligne » et « − Supprimer la ligne » en bas du bloc. Si le bloc est lié à une sélection, la nouvelle ligne y est rattachée. Le bloc reste affiché même vide. Droits de création et de suppression Grist requis : sinon l'action est refusée avec un message |
| Masquer les noms des champs | Fiches et listes de fiches : seules les valeurs sont affichées ; le nom du champ apparaît au survol de la valeur |
| Afficher les champs vides | Pour les fiches de ce bloc |
| Largeur des colonnes | Ajustées (sans ascenseur horizontal), celles de Grist, ou automatiques |
| Afficher toutes les fiches | Une vue fiche affichée en liste |
| Liste de sélection | Le bloc devient une liste déroulante dans l'en-tête |
| **Filtre rapide**, **Filtre à l'ouverture** | Voir ci-dessous |

### Disposition

- **Section « Disposition » du panneau** :
  - **Mode ultracompact** : les blocs prennent la largeur de leurs données.
  - **Combler automatiquement les espaces libres** : un petit bloc peut remonter dans un trou.
  - **Empiler les blocs sans trous** : chaque colonne s'empile indépendamment.
- **☰ → Disposition** (hors du panneau) : on déplace les blocs à la souris et on les redimensionne par leur coin inférieur droit. Terminer par *Enregistrer* ou *Annuler*.

### Filtre rapide

Dans les réglages du bloc, chaque filtre a son encadré : **Filtre rapide**, puis **2ᵉ filtre rapide** (proposé une fois le premier choisi). Chacun contient :
1. **Champ** : le champ filtré (par exemple *Réseau*). Les champs de la vue sont proposés d'abord, puis les autres colonnes de la table : un champ non affiché peut donc servir de filtre.
2. **À l'ouverture** : *Tous*, ou la valeur à présélectionner.
3. **Valeurs exclues** (facultatif) : cocher les valeurs à retirer. Elles disparaissent des boutons du filtre **et** des lignes du bloc, même sur « Tous » (par exemple un établissement « Fermé »). Pour le 1er filtre, **(SO)** (lignes sans valeur) peut aussi être exclu.

Les deux filtres se cumulent : *Public* et *Ecole*.

Le filtre est disponible pour les tableaux, les listes de fiches, les graphiques et les cartes.

### Listes de sélection

Pour une vue affichée en **Liste de sélection** :
- **Colonne affichée** : le texte proposé dans la liste.
- **Ordre** : alphabétique, ou celui de la vue Grist.
- **Regrouper par** : intertitres dans la liste (par exemple les écoles par commune).
- **Ordre des groupes** (si « Regrouper par » est choisi) : intertitres en ordre alphabétique (A → Z) ou inverse (Z → A). Les nombres et les années sont classés par valeur : en ordre inverse, la rentrée la plus récente vient en premier.
- **ID de synchronisation** : les listes qui portent le même identifiant gardent la même sélection d'une page à l'autre (pages du widget comme autres pages Grist du même onglet).
  - Seules les listes **sur la même table** se synchronisent : deux listes de tables différentes (par exemple Circonscriptions et Écoles) peuvent porter le même identifiant sans interférer.
  - La sélection partagée est propre au **document** : elle ne passe pas d'un document à un autre (par exemple d'une copie de développement au document en service).
  - Elle dure le temps de l'onglet du navigateur ; un nouvel onglet repart de la première valeur.

### Cartes : réglages

Les réglages d'une carte sont regroupés en quatre encadrés.

**Points**

| Réglage | Effet |
|---|---|
| Étiquette | Colonne affichée au survol (par défaut celle de la carte Grist) |
| Étiquettes toujours visibles | Affiche toutes les étiquettes en permanence |
| Couleur selon | Couleur des points selon une colonne |
| … sinon selon | Pour les points dont la colonne « Couleur selon » est vide : couleur selon une 2ᵉ colonne (teintes différentes, légende à part, sous le nom de la colonne). Les autres points gardent leur couleur |

**Contour des points**

| Réglage | Effet |
|---|---|
| Contour selon | Cercle autour des points : selon une colonne, avec jusqu'à 3 couleurs et conditions (`=`, `≠`, `<`, `≤`, `>`, `≥`, `contient`), ou **situation QPV (calculée)** |

**Quartiers prioritaires (QPV)**

| Réglage | Effet |
|---|---|
| Afficher les périmètres | Dessine les périmètres des QPV en pointillés rouges |
| Proximité d'un QPV | Distance retenue pour « à proximité » (0 à 500 m) |
| Fichier des QPV | Fichier GeoJSON des périmètres (par défaut `qpv-bretagne.geojson`) |

**Zones sous les points**

| Réglage | Effet |
|---|---|
| Zonage | Communes, EPCI, IRIS, circonscriptions législatives ou secteurs de collège, dessinés sous les points |
| Second zonage (contours) | Un autre découpage tracé en pointillés noirs par-dessus le premier, pour croiser deux fonds (ex. secteurs de collège colorés + circonscriptions législatives). Nom au survol du trait |
| Rattachement : circonscriptions / secteurs de collège | « position des points » (défaut) : la zone dont le contour contient le point. Ou une colonne de code (ex. `2201`, UAI) : la zone désignée par vos données, même si le point est hors de son contour (commune partagée entre deux zones, commune nouvelle…) |
| Fichier : circonscriptions / secteurs de collège | Fichier GeoJSON déposé à côté du widget. Vide : `circonscriptions-bretagne.geojson`, `secteurs-colleges-bretagne.geojson`. Préparation : voir le README |
| Code INSEE | Colonne du code commune ; ou « position des points » pour le déduire des coordonnées |
| Couleur des zones | Une couleur par zone, aucune (contours seuls, sans fond), nombre de points, somme d'une colonne, ou valeur d'une table Grist reliée par code |

**Colorer les zones avec vos propres données** (par exemple la population des 3-10 ans par IRIS) :
1. Importer une table dans Grist, avec une colonne de code :
   - code IRIS à 9 caractères pour les IRIS ;
   - code INSEE pour les communes ;
   - SIREN pour les EPCI ;
   - code de la circonscription (ex. `2901`) pour les circonscriptions législatives ;
   - UAI du collège pour les secteurs de collège.
2. Couleur des zones → *selon une table Grist* : choisir la table, la colonne du code et la colonne de la valeur.

### Graphiques : couleurs

L'encadré **Couleurs du graphique** de chaque bloc graphique (natif ou avancé) fixe les couleurs :
- **camembert** (secteurs, anneau) et **histogramme à une seule série** : une couleur par catégorie (part ou barre) ;
- **plusieurs séries** (graphique multi-séries, plusieurs colonnes de valeurs) et **courbes** : une couleur par série, désignée par la valeur du regroupement (ex. `Public`) ou le nom de la colonne.

Sans réglage, les couleurs suivent la palette du widget dans l'ordre d'apparition des catégories ou des séries ; cet ordre peut changer avec les données, d'où l'intérêt de les fixer.

| Réglage | Effet |
|---|---|
| Colonne de codes | Colonne de la table qui donne, pour chaque ligne, un code hexadécimal (`#000091`, `000091` ou `#009`). Elle peut être une formule, par exemple `$Reseau.Couleur` pour reprendre la couleur rangée dans une table de référence |
| Correspondance | Une catégorie ou une série par ligne : `Public = #000091`, `Privé = #e1000f`. La casse est ignorée. Des pastilles montrent les couleurs reconnues |
| Couleur de repli | Couleur des catégories sans code. Vide : couleurs habituelles du widget |

Priorité : correspondance, puis colonne de codes, puis couleur de repli. Un code invalide est ignoré. Les réglages sont enregistrés avec la page dans `W_Composition`.

### Menu de navigation

Section **5. Navigation entre pages**. Ce réglage est commun à toutes les configurations.

- **Adresse du document** : adresse de base du document Grist (https).
- **Changer de page dans le widget** : le menu bascule de configuration sans recharger Grist. Recommandé quand toutes les configurations sont réunies dans une seule page Grist.
- **Page d'accueil** : page affichée à l'ouverture, pour tous les utilisateurs. Avec « Changer de page dans le widget », elle s'impose ; sinon, elle sert quand le widget n'a pas de configuration enregistrée. Si le widget ne sait pas quelle configuration afficher, seul un administrateur se voit poser la question, et sa réponse devient la page d'accueil ; les utilisateurs ne sont jamais interrogés.
- **Ouvrir les pages en mode page unique** : les liens ouvrent Grist sans ses menus. Proposé seulement sans « Changer de page dans le widget » ; sinon, utiliser le bouton **Plein écran** de la barre d'outils, réservé aux administrateurs.
- **Pour chaque lien** :
  - libellé ;
  - infobulle (facultative) : texte affiché au survol du lien ; sans infobulle, le survol montre l'adresse de la page, sauf avec « Changer de page dans le widget » ;
  - page Grist, ou **— ce widget —** ;
  - configuration à afficher ;
  - visibilité : *tous*, ou *si accès à* une table (le lien n'apparaît qu'aux personnes qui voient au moins une ligne de cette table).

### Apparence

Section **4. Affichage**, **Apparence (tout le document)** :
- **Style État (DSFR)** : police Marianne et bleu France. Réservé aux **services de l'État** par les conditions d'utilisation du Système de design de l'État.
- **Style neutre** : police du système et bleu neutre, pour toute autre structure (collectivité, association, entreprise…).

Sans choix, le widget s'affiche en style État. Le choix vaut pour toutes les pages du document ; il n'est jamais proposé aux utilisateurs.

### Enregistrer

**Enregistrer** applique la configuration et l'écrit dans la table `W_Composition` du document. Les filtres rapides reviennent alors à leur valeur à l'ouverture.

---

## 2. Questions fréquentes

**Un éditeur voit le bouton Configurer.**
Il lit une ligne de `W_Admin`. Réservez la lecture de cette table aux administrateurs par une règle d'accès, puis vérifiez avec *Règles d'accès → Voir en tant que*.

**Les onglets n'apparaissent pas pour certains utilisateurs.**
Le menu des onglets est enregistré dans la ligne `_Navigation` de `W_Composition` : ces utilisateurs doivent pouvoir **lire** cette table (seule la modification est à réserver aux administrateurs). Vérifiez aussi les liens réglés sur « si accès à <table> ».

**J'ai renommé une colonne ou une vue dans Grist.**
Le panneau **Configurer** relit la structure à chaque ouverture : les nouveaux noms y apparaissent. Les colonnes déjà choisies dans les réglages suivent automatiquement leur renommage, pour les configurations enregistrées depuis la version 0.8.5. Pour l'affichage des pages, cliquez sur **⟳ Actualiser**.

**Une carte reste vide.**
- Vérifiez que les colonnes de latitude et de longitude sont renseignées.
- Pour les contours des communes, la colonne **Code INSEE** doit contenir un code à 5 chiffres, et non le nom de la commune. Sinon, choisissez « position des points ».

**Où voir la version du widget ?**
Au survol du bouton Aide, dans l'onglet **Nouveautés**, et en bas du panneau **Configurer**.
