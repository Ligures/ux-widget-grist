# Journal des modifications — UX widget grist

<img src="aia.png" alt="AIA" width="40" align="left" /> **AIA — Assisté par l'intelligence artificielle.** Ce widget et sa documentation ont été réalisés avec l'assistance d'une IA, sous la direction et avec la validation de leur auteur. Icône : [Martine Peters](https://mpeters.uqo.ca/utilisation-transparente-de-lintelligence-artificielle/), CC BY-NC-SA 4.0.
<br clear="left" />

Toutes les évolutions notables du widget sont consignées ici, de la plus récente à la plus ancienne.
Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

**Numérotation** : le widget est en développement, donc en version 0.
- Le **dixième** (`0.X`) marque une évolution majeure.
- Le chiffre suivant (`0.X.Y`) marque une évolution secondaire ou un ensemble de corrections. Il peut dépasser 9 : 0.8.9 est suivie de 0.8.10, puis 0.8.11…
- Depuis 0.8.10, un quatrième chiffre (`0.X.Y.Z`) change à chaque livraison intermédiaire : 0.8.10.1, 0.8.10.2… jusqu'au passage à 0.8.11.0.
- La version 1.0 sera la première version stable.

Les versions antérieures à 0.5.0 ont été développées avant la mise en dépôt du code. Leur numérotation est reconstituée a posteriori, et leurs dates ne sont pas connues précisément (septembre – début octobre 2026).

---

## [0.9.0.7] — Diagnostic des lenteurs de chargement — 2026-10-18

### Ajouté
- **Diagnostic de chargement** dans la console du navigateur (F12) : chaque lecture de table de plus de 200 ms est signalée. Au premier affichage, une ligne récapitule le nombre de lectures, le temps cumulé et les cinq lectures les plus longues. Utile pour voir si une règle d'accès ralentit la lecture d'une table.

## [0.9.0.6] — Ajout de lignes dans un tableau modifiable — 2026-10-17

### Ajouté
- **Ajout de lignes** (option de bloc, tableaux et listes de fiches, avec « Édition des champs ») : un bouton **+ Ajouter une ligne** en bas du bloc crée un enregistrement dans la table.
  - Si le bloc est lié à une sélection (liaison Grist), la nouvelle ligne y est rattachée : par exemple, une classe ajoutée sous l'école sélectionnée.
  - La nouvelle ligne est sélectionnée et la saisie de son premier champ modifiable s'ouvre.
  - Un bloc vide qui propose l'ajout reste affiché, même avec l'option « masquer les blocs vides ».
  - Les règles d'accès de Grist s'appliquent : un ajout interdit est refusé avec un message. Le bouton n'est pas imprimé.

## [0.9.0.5] — Impression des tableaux longs, 2ᵉ correction — 2026-10-14

### Corrigé
- **Impression des tableaux longs** (pages blanches, morceaux de tableau isolés, document de plusieurs centaines de pages) : à l'impression, la page n'utilise plus la grille CSS, que les navigateurs coupent mal d'une page à l'autre. Les blocs sont placés en flux normal :
  - les blocs courts restent côte à côte, chacun avec sa largeur en sixièmes ;
  - un bloc plus haut qu'une page commence sur une nouvelle ligne, garde sa largeur et se coupe d'une page à l'autre, en-tête de colonnes répété.
- Blocs « figés » et « très grands » : à l'impression, leur tableau s'affiche en entier ; il n'était plus limité à la hauteur de l'écran que dans la grille.
- Les blocs longs sont aussi repérés quand on imprime avec Ctrl+P.

## [0.9.0.4] — Impression des tableaux longs — 2026-10-14

### Corrigé
- **Impression des tableaux longs** : les blocs qui contiennent un tableau ou des fiches peuvent désormais se couper d'une page à l'autre. Avant, un bloc plus haut qu'une page était repoussé à la page suivante, ce qui laissait des pages blanches et des coupures inutiles. Les lignes d'un tableau ne sont jamais coupées en deux et l'en-tête est répété sur chaque page.

## [0.9.0.3] — Impression fidèle à l'écran — 2026-10-14

### Modifié
- **Impression** : la page s'imprime en **A4 paysage** et garde la disposition de l'écran (grille de 6 colonnes). Un graphique qui occupe 1/6 de l'écran occupe 1/6 de la page, au lieu d'une ligne entière.
- Avant l'impression, la grille prend la largeur de la page pour que graphiques, cartes et tableaux soient redessinés à la bonne taille ; l'affichage normal revient ensuite.

### Corrigé
- La règle « un bloc par ligne » des petits écrans (téléphone) ne s'applique plus à l'impression.
- Avec l'option « sans trous », les blocs ne se chevauchent plus et ne laissent plus de grands vides sur le papier.

## [0.9.0.2] — Réglages des filtres rapides regroupés — 2026-10-14

### Modifié
- **Configuration d'un bloc** : chaque filtre rapide a son encadré (**Filtre rapide**, **2ᵉ filtre rapide**), qui réunit le champ, la valeur à l'ouverture et les valeurs exclues, comme pour les réglages des cartes.
- **1er filtre** : l'option **(SO)** (lignes sans valeur) peut être choisie à l'ouverture et cochée dans les valeurs exclues.

---

## [0.9.0.1] — Légende de la seconde couleur allégée — 2026-10-14

### Modifié
- Cartes : la légende de la 2ᵉ colonne de couleur n'affiche plus la mention « (si … vide) ».

---

## [0.9.0] — Code séparé et politique de sécurité stricte — 2026-10-14

Évolution majeure de la structure du widget, sans changement visible pour les utilisateurs.

### Modifié
- **Trois fichiers au lieu d'un** : `index.html` (structure de la page), `ux-widget.css` (styles) et `ux-widget.js` (script). Ils sont à déposer ensemble dans le dépôt ; `index.html` charge les deux autres avec le numéro de version (`?v=0.9.0`), pour que les navigateurs ne gardent pas une ancienne version en cache.

### Sécurité
- **Politique de sécurité du contenu (CSP)** dans `index.html` : aucun script en ligne n'est exécuté (un script injecté dans une donnée ou une étiquette serait refusé par le navigateur) ; scripts limités au site du widget, à Grist et à jsDelivr ; connexions limitées au site du widget, à jsDelivr, à geo.api.gouv.fr et à data.geopf.fr ; aucun envoi de formulaire ; pas d'objets intégrés.
- L'attribut `onerror` de l'icône AIA, incompatible avec cette politique, est remplacé par un traitement dans le script.

---

## [0.8.11.6] — Filtres rapides affichés sur un bloc sans données — 2026-10-14

### Modifié
- **Filtres rapides** : ils restent affichés quand le bloc n'a aucune donnée (par exemple après une sélection), avec les valeurs connues du champ. Exception : un bloc masqué par l'option « Masquer les blocs sans données ».

---

## [0.8.11.5] — Valeur « (SO) » du premier filtre — 2026-10-14

### Modifié
- **Filtres rapides, lignes sans valeur** : le 1er filtre propose l'option **« (SO) »** (sans objet), en dernière position, pour n'afficher que ces lignes ; le 2nd filtre ne propose pas d'option pour elles (elles restent visibles avec « Tous »).

---

## [0.8.11.4] — Pas d'option « (vide) » dans les filtres rapides — 2026-10-14

### Modifié
- **Filtres rapides** : la valeur « (vide) » n'est plus proposée. Les lignes sans valeur restent visibles avec « Tous ».

---

## [0.8.11.3] — Réglages des cartes réorganisés — 2026-10-14

### Modifié
- **Configuration d'une carte** : les réglages sont regroupés en quatre encadrés — **Points** (étiquette, étiquettes toujours visibles, couleur selon, … sinon selon), **Contour des points**, **Quartiers prioritaires (QPV)** (afficher les périmètres, proximité, fichier) et **Zones sous les points** (zonage, code INSEE, couleur des zones). Le code INSEE suit désormais directement le choix du zonage.

---

## [0.8.11.2] — Seconde couleur des points — 2026-10-14

### Ajouté
- **Cartes, « … sinon selon »** : une 2ᵉ colonne de couleur pour les points dont la colonne « Couleur selon » est vide. Elle ne remplace pas la première : les autres points gardent leur couleur. Teintes différentes de la 1re colonne et légende à part (« … (si … vide) »).

---

## [0.8.11.1] — Valeurs exclues des filtres rapides, présentation homogène — 2026-10-14

### Ajouté
- **Valeurs exclues** pour chaque filtre rapide (réglages du bloc) : les valeurs cochées sont retirées des boutons du filtre et des lignes affichées dans le bloc, y compris sur « Tous ».

### Modifié
- **Présentation des filtres rapides** : au-delà de 4 valeurs, plus de liste déroulante du navigateur, mais le même affichage que sur écran réduit (valeur active, liste au clic, qui défile si elle est longue). Les deux filtres d'un bloc ont ainsi la même présentation ; le clic milieu fonctionne de la même façon.

---

## [0.8.11.0] — Cadrage des cartes — 2026-10-14

### Ajouté
- **Cartes : cadrage sur l'ensemble des données** à l'ouverture (points et zones dessinées). Tant que l'utilisateur n'a pas déplacé ou zoomé la carte, elle se recadre quand son bloc change de taille (bloc déplié, plein écran, mise en page) : une carte repliée à l'ouverture est bien cadrée une fois dépliée.
- **Bouton ⤢** sous le zoom de chaque carte : revient au cadrage sur l'ensemble des données.

---

## [0.8.10.6] — Plus de question « quelle configuration ? » aux utilisateurs — 2026-10-14

### Modifié
- **Choix de la configuration à l'ouverture** : la question « Quelle configuration afficher sur cette page ? » n'est plus posée qu'aux administrateurs. Leur choix devient la **page d'accueil** commune (enregistrée dans `W_Composition`), donc plus de question aux chargements suivants. Un utilisateur n'est jamais interrogé : le widget ouvre la page d'accueil, sinon la configuration de la table du widget, sinon la première lisible.
- **Page d'accueil** : réglage toujours proposé (section Navigation). Avec « Changer de page dans le widget », elle s'impose ; sinon, elle sert quand le widget n'a pas de configuration enregistrée.

---

## [0.8.10.5] — Correction des références protégées — 2026-10-14

### Corrigé
- Références vers des lignes non lisibles : quand plusieurs colonnes visent la même table avec des champs affichés différents (par exemple l'UAI et le nom), le widget pouvait afficher le champ d'une autre colonne. Le texte est désormais pris dans la colonne d'affichage propre à chaque référence.

---

## [0.8.10.4] — Références vers des lignes protégées — 2026-10-14

### Corrigé
- **Références vers des lignes non lisibles** (règles d'accès par ligne, par exemple une circonscription d'un autre périmètre) : le widget affichait le numéro de ligne. Il affiche désormais le texte calculé par Grist (colonne d'affichage de la référence), comme les vues natives.

---

## [0.8.10.3] — Guide d'administration séparé — 2026-10-14

### Modifié
- **Aide** : le guide est scindé en deux. `GUIDE-UTILISATEUR.md` (onglet « Guide ») pour les utilisateurs ; `GUIDE-ADMINISTRATEUR.md` (nouvel onglet « Administration ») pour composer les pages, affiché aux seuls administrateurs. Chacun a ses propres questions fréquentes (nouvelles entrées : onglets absents, éditeur qui voit Configurer).

---

## [0.8.10.2] — Actions en icônes sur grand écran — 2026-10-14

### Modifié
- **Grand écran** (plus de 900 px de large) : plus de menu ☰ ; toutes les actions (Actualiser, Configurer, Tout déplier, Plein écran, Imprimer, Disposition, Aide) sont des icônes dans la barre, avec leur libellé en infobulle. Sur écran étroit, le menu ☰ revient.
- La version du widget figure aussi dans l'infobulle du bouton Aide.

---

## [0.8.10.1] — Second filtre rapide, boutons directs, page d'accueil — 2026-10-14

### Ajouté
- **Second filtre rapide** par bloc (« 2ᵉ filtre rapide » et sa valeur à l'ouverture), sur un autre champ. Les deux filtres se cumulent ; chacun se synchronise par clic milieu avec les blocs filtrés sur le même champ.
- **Page d'accueil** (menu de navigation, mode « Changer de page dans le widget ») : page du menu affichée à l'ouverture du widget.

### Modifié
- **Actualiser** (⟳) et **Configurer** (⚙, administrateurs) sortent du menu ☰ : boutons directs dans la barre, icône seule avec infobulle.
- **Apparence** : la fenêtre de choix à la première ouverture est supprimée ; l'apparence se règle uniquement dans la configuration (section Affichage), par un administrateur. Par défaut : style État (DSFR).

---

## [0.8.10] — Plein écran, droit de configurer fermé par défaut — 2026-10-12

### Ajouté
- **☰ → Plein écran** : ouvre la page Grist qui contient le widget dans un nouvel onglet, en mode page unique (sans les menus de Grist).
- **Version du widget** dans l'infobulle du menu ☰ (avec la mention « nouvelle version » tant que les nouveautés n'ont pas été lues).

### Modifié
- Documentation : tableau des données envoyées à des services externes par les cartes (README, « Sécurité et confidentialité ») et rappel dans le guide. Correction : pour les communes et EPCI, c'est le code du département, et non des codes INSEE, qui est envoyé à geo.api.gouv.fr.
- L'option « Ouvrir les pages en mode page unique » n'est plus proposée avec « Changer de page dans le widget », où elle ne sert pas ; elle n'est plus appliquée aux liens dans ce mode.

### Sécurité
- **Droit de configurer fermé par défaut** : un éditeur qui ne voyait pas la table `W_Admin` pouvait quand même configurer, quand le témoin `_Securite` de `W_Composition` manquait ou lui était illisible (une table interdite était prise pour une table absente). Désormais, seul qui lit au moins une ligne de `W_Admin` peut configurer ; exception : un document encore sans configuration (installation), où `W_Admin` est créée automatiquement au premier enregistrement.

---

## [0.8.9] — Apparence au choix, menu des pages sur smartphone, licence MIT, sans export CSV — 2026-10-11

### Ajouté
- **Choix de l'apparence** à la première ouverture par un administrateur : **style État (DSFR)** (police Marianne, bleu France), réservé aux services de l'État, ou **style neutre** (police du système, bleu neutre) pour toute autre structure. Les restrictions d'usage du DSFR sont rappelées. Le choix est commun au document et se modifie dans la configuration (section Affichage).
- **Smartphone** : le menu des pages est regroupé derrière un bouton, à gauche, qui porte le nom de la page affichée (icône de pages), distinct du menu ☰ des actions, à droite.
- **Licence MIT** (fichier `LICENSE`) : elle couvre le code et la documentation, mais ni la police Marianne ni l'identité visuelle de l'État, ni l'icône AIA, ni les données QPV.

### Corrigé
- **ID de synchronisation des listes de sélection** :
  - un choix fait sur une page s'applique désormais aussi aux pages du widget déjà visitées (elles gardaient leur ancienne sélection) ;
  - la sélection partagée est propre au document et à la table de la liste : elle ne s'impose plus depuis un autre document ouvert dans le même onglet, ni à une liste d'une autre table portant le même identifiant ;
  - une sélection partagée absente de la liste (droits, filtres) est ignorée.
- **Menu des pages, liens « — ce widget — »** : ils pointaient vers « # » (adresse du widget au survol), si bien que le clic du milieu et le mode page unique ne fonctionnaient pas. Ils pointent désormais vers la page Grist qui contient le widget (de préférence celle dont le widget affiche la configuration du lien), avec `?style=singlePage` si l'option est cochée.

### Modifié
- **Impression** : les boutons de filtre rapide ne sont plus imprimés ; un filtre actif est rappelé en texte dans l'en-tête du bloc (par exemple « Réseau : Privé »).
- **Export CSV supprimé** (bouton ⤓ des blocs) : l'export se fait depuis les vues natives de Grist.
- La police Marianne (normale) est chargée depuis le paquet `@gouvfr/dsfr` 1.14.4, en version figée, comme la police grasse (elle venait de la branche `master` du dépôt beta.gouv.fr).
- README : sections « Apparence et DSFR » et « Licence » ; le widget est présenté comme inspiré du DSFR, sans en être une implémentation officielle.

---

## [0.8.8] — Nouvelles pages, liens vers des formulaires, filtres rapides synchronisés — 2026-10-11

### Ajouté
- Configuration, section Général : **Page réglée** permet de régler n'importe quelle page enregistrée sans changer celle qui est affichée.
- Boutons **＋ Nouvelle page** (page vide) et **Dupliquer** (à partir de la page en cours de réglage).
- Encadré signalant qu'on règle une autre page que celle affichée, avec deux options : l'afficher dans ce widget après l'enregistrement, l'ajouter au menu de navigation.
- Le nom de la page réglée apparaît dans le titre du panneau.
- **Liens vers des formulaires Grist** (facultatifs, par page) : section Général, « + Ajouter un lien vers un formulaire » (libellé et adresse). Chaque lien devient un bouton dans l'en-tête, à gauche du menu, qui ouvre le formulaire dans un nouvel onglet. Seules les adresses https sont acceptées. Un **commentaire au survol** facultatif s'affiche dans une infobulle sur le bouton.
- **Formulaire dans une fenêtre** : par défaut, le formulaire s'ouvre dans une fenêtre au-dessus de la page (case « nouvel onglet » pour l'ancien comportement). La fenêtre se ferme avec ✕, Échap ou un clic à côté, et se ferme seule après l'envoi, puis la page se recharge. L'envoi est repéré par une nouvelle ligne dans la table du formulaire (si l'utilisateur peut la lire), ou par la redirection après l'envoi réglée dans Grist. Bouton ↗ pour basculer dans un nouvel onglet ; Ctrl+clic ouvre aussi un nouvel onglet.
- **Filtres rapides synchronisés** : un clic milieu (ou Maj+clic) sur une valeur l'applique à tous les blocs de la page filtrés sur le même champ ; « Tous » les remet tous à « Tous ». Infobulle explicative sur chaque valeur, message de confirmation. Si la valeur n'existe pas dans un bloc, le rapprochement se fait par le début du texte (mot entier) : « Privé » garde « Privé sous contrat » et « Privé hors contrat », et inversement. Les valeurs rapprochées sont surlignées dans le filtre du bloc, sans bouton supplémentaire.
- **Filtre rapide inutile masqué** : un bloc dont le champ n'a qu'une seule valeur (par exemple uniquement « Public ») n'affiche plus de filtre, même avec une valeur à l'ouverture. Auparavant, le filtre s'affichait à l'ouverture puis disparaissait après un clic sur « Tous ». Il reste affiché si une autre valeur lui a été appliquée par synchronisation (bloc vide), pour pouvoir revenir à « Tous ».

### Modifié
- **Listes de références et listes de choix dans les tableaux** : les valeurs se suivent sur la même ligne tant qu'il y a la place, au lieu d'une valeur par ligne.
- « Nom de la configuration » devient **Nom de la page**. Enregistrer sous le nom d'une autre page demande confirmation au lieu de la remplacer sans prévenir.
- Changer de page réglée, ou en créer une, demande confirmation si des modifications n'ont pas été enregistrées.
- Le bouton « Charger » et la liste « Reprendre une configuration enregistrée » sont remplacés par « Page réglée ».

---

## [0.8.7] — Blocs figés empilés — 2026-10-11

### Corrigé
- **Plusieurs blocs « Figer à l'écran » dans une même colonne se recouvraient** : un graphique figé glissait sur la carte figée au-dessus de lui. Chaque bloc figé se colle désormais sous ceux qui le précèdent, et la position se recalcule au pliage, au dépliage et au redimensionnement.
- **Bloc déplié** : il reste figé comme replié. Sa hauteur est limitée à la place restante à l'écran, et son contenu défile à l'intérieur.
- **Manque de place** : un bloc figé qui n'a plus la place de montrer son en-tête n'est plus figé. Il passe alors sous les blocs figés au lieu de les recouvrir.
- **Interstices comblés** : un liseré blanc entre les blocs figés, et sous l'en-tête, masque le contenu qui défile dessous. Une ombre légère marque la limite basse des blocs figés.
- **En-têtes de colonnes toujours visibles** quand on fait défiler un tableau dans son cadre, y compris dans un bloc figé, un bloc sur plusieurs rangées ou en plein écran.
- **Blocs figés côte à côte de hauteurs différentes** : un bloc qui défilait dessous passait derrière le plus haut mais restait visible sous le plus court. Un masque blanc couvre désormais toute la largeur des blocs figés voisins, jusqu'au bas du plus haut.
- **Tableau dans un bloc de 2 ou 3 rangées** : il s'affichait en entier et c'est la page qui défilait, en emportant les en-têtes. Sa hauteur maximale est désormais celle d'une rangée multipliée par le nombre de rangées, et il défile dans son cadre.

---

## [0.8.6] — Diagnostic de la configuration — 2026-10-11

### Ajouté
- Dans le panneau de configuration, chaque vue retenue indique sa **table** Grist.
- En bas du panneau, la ligne de diagnostic indique **l'heure de lecture de la structure** du document et le nombre de colonnes lues.

---

## [0.8.5] — Colonnes renommées — 2026-10-11

### Corrigé
- **Le panneau de configuration relit la structure du document à chaque ouverture** : les colonnes et les vues renommées dans Grist y apparaissent sous leur nouveau nom, sans recharger la page.
- **Les colonnes choisies dans la configuration suivent leur renommage** :
  - colonnes concernées : étiquette, couleur et contour de carte, code INSEE, colonnes des listes de sélection, colonne additionnée, table de couleur des zones, filtre rapide ;
  - le widget mémorise le numéro interne de chaque colonne, qui ne change pas, et retrouve son nouveau nom automatiquement.
  - Le suivi vaut pour les colonnes enregistrées à partir de cette version : celles renommées avant doivent être choisies à nouveau une fois.

---

## [0.8.4] — Mention AIA dans l'aide seulement — 2026-10-11

### Modifié
- La mention AIA n'apparaît plus en pied de page du widget. Elle reste dans la fenêtre d'aide et en tête des trois documents.

---

## [0.8.3] — Mention AIA — 2026-10-11

### Ajouté
- **Icône AIA** (« assisté par l'intelligence artificielle », Martine Peters, CC BY-NC-SA 4.0), avec la mention de l'auteure de l'icône et de sa licence :
  - en pied de page du widget ;
  - dans l'en-tête de la fenêtre d'aide ;
  - en tête du README, du guide et de ce journal.
- Nouveau fichier `aia.png`, à déposer à côté du widget. S'il manque, seule la mention texte s'affiche.

---

## [0.8.2] — Menu de la barre d'outils — 2026-10-11

### Modifié
- **Barre d'outils regroupée dans un menu ☰** : Tout replier, Actualiser, Imprimer, Aide, Disposition et Configurer sont dans une liste déroulante, avec icônes et libellés. Le menu se ferme au choix d'une action, par un clic ailleurs ou par Échap.
- **L'aide s'ouvre sur le guide d'utilisation.** La pastille « nouvelle version » reste visible sur le bouton ☰ et sur l'entrée Aide tant que l'onglet Nouveautés n'a pas été consulté.

---

## [0.8.1] — Aide intégrée — 2026-10-11

### Ajouté
- **Aide intégrée** : bouton **Aide** dans la barre d'outils, qui ouvre une fenêtre à onglets.
  - **Guide** : le guide d'utilisation.
  - **Nouveautés** : ce journal des modifications.
  - **À propos** : le README, réservé aux administrateurs.
- Le contenu est lu dans les fichiers Markdown du dépôt, à côté du widget : déposer une nouvelle version sur GitHub met l'aide à jour, sans rien recopier dans Grist.
- Les liens internes fonctionnent : sommaires, ancres, et liens d'un document à l'autre.
- **Pastille « nouvelle version »** sur le bouton Aide tant que l'utilisateur n'a pas consulté les nouveautés ; l'aide s'ouvre alors directement sur l'onglet Nouveautés. Le suivi se fait par navigateur.

### Sécurité
- Markdown mis en forme par marked 12.0.2 (version figée, empreinte SRI), puis nettoyé par DOMPurify.

---

## [0.8.0] — Nouveau nom et documentation — 2026-10-11

### Modifié
- **Nouveau nom : « UX widget grist »** (anciennement « page composée »). Changent :
  - le dépôt (`ux-widget-grist`), avec le widget servi à sa racine (`index.html`) ;
  - le titre ;
  - le préfixe des messages de la console (`[UX widget]`) ;
  - la clé de synchronisation des listes entre pages (`uxwg_sync_…`).
- Le numéro de version est affiché en bas du panneau de configuration.

### Documentation
- Ajout de ce journal des modifications.
- Ajout d'un guide d'utilisation (`GUIDE-UTILISATEUR.md`).
- Mise à jour du `README.md`.

### Migration
- Mettre à jour l'URL du widget dans Grist : `https://<compte>.github.io/ux-widget-grist/`.
- Les configurations enregistrées dans `W_Composition` sont conservées telles quelles.
- Les sélections synchronisées en cours de session repartent de zéro, une seule fois.

---

## [0.7.0] — Filtre rapide et listes adaptatives — 2026-10-10

### Ajouté
- **Filtre rapide par bloc** :
  - dans l'en-tête de chaque bloc, des boutons « Tous | valeur 1 | valeur 2… » filtrent ses lignes sur un champ choisi dans la configuration du bloc ;
  - le choix du champ présente les champs de la vue, puis les autres colonnes de la table ;
  - une valeur peut être sélectionnée à l'ouverture ;
  - le filtre s'applique à l'affichage et à l'export CSV, sans modifier les liaisons ;
  - la comparaison ignore les majuscules et les accents.
- **Filtre rapide adaptatif** : selon la place dans l'en-tête, boutons côte à côte, bouton unique avec liste verticale, ou icône d'entonnoir (pleine si un filtre est actif).
- **Listes de sélection à une seule entrée** (selon les droits) : elles sont masquées, mais leur sélection s'applique et figure dans le résumé imprimé.
- **Smartphone** : les listes de sélection tiennent sur une seule ligne, sans libellé (repris en infobulle).
- **Menu de navigation** : option « — ce widget — » pour les liens qui n'affichent qu'une configuration, quand toutes les configurations sont réunies dans une seule page Grist.

### Corrigé
- Un bloc sans aucune donnée restait affiché quand il avait un filtre rapide. Il n'est maintenu que si c'est le filtre lui-même qui l'a vidé.
- La valeur à l'ouverture du filtre rapide n'était pas appliquée après enregistrement de la configuration.
- Le menu signalait « page introuvable » pour des liens vers des pages Grist supprimées, alors qu'ils servent seulement à changer de configuration dans le widget.

### Retiré
- Le filtre rapide commun à toutes les pages, remplacé par le réglage par bloc.

---

## [0.6.2] — Code commenté et README — 2026-10-10

### Documentation
- Code commenté :
  - en-tête de fichier ;
  - sommaire du script (cycle de vie, stockage, schéma de configuration, règles à respecter) ;
  - une ligne d'explication pour chaque fonction.
- Code réindenté avec Prettier, sans changement de comportement (arbre syntaxique vérifié identique).
- Premier `README.md`.

---

## [0.6.1] — IRIS et données Grist par zone — 2026-10-10

### Ajouté
- **Zonage IRIS** : contours des IRIS des communes découpées, interrogés au service de la Géoplateforme IGN (`STATISTICALUNITS.IRISGE:iris_ge`).
- **Couleur des zones selon une table Grist** reliée par code (code INSEE, SIREN d'EPCI, code IRIS) :
  - dégradé pour un nombre, une couleur par valeur pour un texte ;
  - « sans donnée » en gris.
- **Commune déduite de la position des points** quand la colonne ne donne pas de code INSEE lisible, avec l'option explicite « position des points ».
- Lecture d'un code INSEE porté par une référence imbriquée.
- Listes de colonnes de la configuration classées par ordre alphabétique.
- **Page vide** :
  - le message « Aucune donnée, pas d'élément sélectionné » s'affiche, au lieu d'une page blanche ;
  - le détail par bloc est écrit dans la console.

### Corrigé
- Bloc en plein écran réduit à sa barre de titre en mode « Empiler les blocs sans trous » (carte invisible).
- Ascenseurs qui apparaissaient au survol des graphiques avancés, à cause d'un débordement de 4 px.
- Rangée des listes de sélection inutilement rétrécie sous le menu des pages.

---

## [0.6.0] — Zonages et quartiers prioritaires — 2026-10-09

### Ajouté
- **Zonages sous les points de carte** :
  - communes ;
  - EPCI, avec les contours des communes fusionnés (polygon-clipping) ;
  - coloration selon le nombre de points ou la somme d'une colonne, avec légende.
- **Quartiers prioritaires (QPV 2024)** :
  - couche des périmètres (fichier `qpv-bretagne.geojson` : départements 22, 29, 35 et 56) ;
  - repérage des points situés dans un QPV ou à moins de X m ;
  - contour des points calculé selon la situation QPV, et infobulle.

---

## [0.5.0] — Hébergement, sécurité et configuration repensée — 2026-10-09

### Ajouté
- **Hébergement sur GitHub Pages** : le widget est appelé par URL dans Grist.
- **Contour coloré des points de carte** : jusqu'à 3 couleurs choisies selon une colonne, avec les conditions `=`, `≠`, `<`, `≤`, `>`, `≥` et `contient`.
- **Panneau de configuration refondu** :
  - moitié de l'écran ;
  - aperçu de la disposition fixe en haut ;
  - sections encadrées ;
  - explication de chaque option au survol ;
  - position de défilement conservée.
- **Menu de navigation** :
  - les pages dont l'utilisateur ne peut lire aucune table sont masquées ;
  - condition « visible si accès à une table », pour les règles d'accès par ligne.

### Sécurité
- HTML des étiquettes de carte nettoyé par DOMPurify ; textes des infobulles échappés.
- Bibliothèques externes en versions figées, avec empreinte d'intégrité (SRI), servies par jsDelivr.
- Liens du menu limités aux adresses `https://`.
- Export CSV : neutralisation des cellules interprétables comme formules par Excel.

### Corrigé
- **Étiquette de carte différente de la carte native** : le mapping des colonnes, enregistré par numéro de colonne, n'était pas reconnu.

---

## [0.4.1] — Barre d'outils et smartphone

### Ajouté
- Barre d'outils avec icônes et libellés, ces derniers masqués sur petit écran (infobulle) : Tout replier, Actualiser, Imprimer, Disposition, Configurer.
- État des blocs à l'ouverture (auto, replié, déplié) ; blocs repliés mieux signalés.
- Affichage adapté aux smartphones.

### Modifié
- Palette de couleurs de carte plus contrastée ; valeurs invalides en rouge, valeurs vides en gris.

### Corrigé
- Colonne Année trop large sur grand écran, illisible sur petit écran.
- Graphique qui s'allongeait sans fin dans un bloc haut.
- Bloc replié qui disparaissait en mode empilé.
- Blocs côte à côte qui se chevauchaient sur smartphone.

---

## [0.4.0] — Mode Disposition et export

### Ajouté
- **Mode Disposition** : déplacer les blocs par glisser-déposer et les redimensionner à la souris. Réservé aux administrateurs.
- **Export** : impression / PDF de la page, et CSV par bloc (séparateur `;`, ouverture directe dans Excel).
- Tri et filtre par colonne depuis les en-têtes des tableaux ; champ de recherche par bloc.
- Listes de fiches, et fiche en mode liste ; largeur des fiches réglable.
- Colonnes ajustées sans ascenseur horizontal, colonnes figées, largeurs de la vue Grist ou automatiques.
- Mode « Empiler les blocs sans trous » (masonry).

### Retiré
- Export Excel (le CSV et l'impression suffisent).

### Corrigé
- Blocs qui se chevauchaient ou ne se déplaçaient pas en mode Disposition.
- Boutons de filtre qui élargissaient les colonnes.

---

## [0.3.0] — Édition selon les droits

### Ajouté
- **Édition des champs selon les droits Grist**, dans les tableaux et les fiches :
  - texte, nombres, dates, choix, références et références multiples ;
  - sélecteurs intégrés ;
  - respect des conditions de liste déroulante ;
  - lecteurs en lecture seule.
- Sélection de ligne soulignée, survol des cellules éditables teinté.

### Corrigé
- Colonnes qui bougeaient au survol ou à l'édition.
- Double-clic impossible pendant le rafraîchissement.

---

## [0.2.1] — Navigation et performance

### Ajouté
- **Navigation entre pages** :
  - menu commun ;
  - ouverture en mode page unique ;
  - changement de page instantané dans le widget.
- **Performance** :
  - préchargement des tables en parallèle et des autres pages du menu ;
  - mise en cache ;
  - rendu progressif des grands tableaux ;
  - tri accéléré (Intl.Collator) ;
  - rendu interrompu quand un rendu plus récent démarre.

### Corrigé
- Page bloquée par un cycle de liaisons entre vues.

---

## [0.2.0] — Configuration stockée, administration et cartes

### Ajouté
- **Stockage de la configuration dans le document** (table `W_Composition`), qui survit aux mises à jour du code ; choix de la configuration quand plusieurs sont possibles.
- **Accès à la configuration réservé aux propriétaires** : table `W_Admin` et témoin `_Securite`.
- **Cartes** :
  - widget carte Grist rendu avec Leaflet ;
  - Lambert 93 et virgules décimales acceptés ;
  - couleurs selon une colonne ;
  - contours des communes.
- Plein écran par bloc ; en-tête collant ; tableaux sans limite de lignes.

### Corrigé
- Configuration qui revenait toujours à la première après mise à jour du code.
- Carte grise au premier affichage.

---

## [0.1.2] — Listes de sélection et mise en forme Grist

### Ajouté
- **Listes de sélection intégrées** :
  - les listes déroulantes de la page s'affichent dans l'en-tête et pilotent les blocs ;
  - regroupement (par exemple les écoles par commune) et ordre réglables ;
  - synchronisation entre pages par identifiant commun ;
  - navigation au clavier.
- **Mise en forme reprise de Grist** : gras, couleurs, règles conditionnelles de cellule et de ligne, pastilles des choix, ordre et disposition des champs des fiches.
- Descriptions de colonnes en infobulle ; en-têtes centrés.

### Corrigé
- Tri des listes par commune puis par école.

---

## [0.1.1] — Graphiques avancés et mode ultracompact

### Ajouté
- **Graphiques avancés** (widget Plotly de Grist), y compris les sources `gristsrc` et les séries multiples.
- **Mode ultracompact** : blocs ajustés à leurs données ; en-têtes allégés, informations en infobulle.
- Contrôle de la position des blocs : colonne de départ, hauteur en rangées.

### Corrigé
- Pages affichées « (sans nom) ».
- Graphiques limités à l'axe X ou vides.

---

## [0.1.0] — Prototype

### Ajouté
- Première version : réaffichage sur une seule page de vues natives Grist (tableaux, fiches, graphiques), à partir de leur configuration lue dans les tables de métadonnées `_grist_*`.
- Liaisons entre vues (filtre, curseur, tables de synthèse).
- Grille de 6 colonnes et panneau de configuration.
