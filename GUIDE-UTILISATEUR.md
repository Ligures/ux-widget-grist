# Guide d'utilisation — UX widget grist

<img src="aia.png" alt="AIA" width="40" align="left" /> **AIA — Assisté par l'intelligence artificielle.** Ce widget et sa documentation ont été réalisés avec l'assistance d'une IA, sous la direction et avec la validation de leur auteur. Icône : [Martine Peters](https://mpeters.uqo.ca/utilisation-transparente-de-lintelligence-artificielle/), CC BY-NC-SA 4.0.
<br clear="left" />

Ce guide s'adresse aux **utilisateurs**, qui consultent les pages. Les administrateurs disposent en plus d'un guide d'administration (onglet **Administration** de l'aide).

---

## Sommaire

1. [Consulter une page](#1-consulter-une-page)
   - [L'en-tête](#len-tête)
   - [Les blocs](#les-blocs)
   - [Tableaux et fiches](#tableaux-et-fiches)
   - [Cartes](#cartes)
   - [Imprimer et exporter](#imprimer-et-exporter)
   - [Sur smartphone](#sur-smartphone)
2. [Questions fréquentes](#2-questions-fréquentes)

---

## 1. Consulter une page

### L'en-tête

En haut de la page, de gauche à droite et de haut en bas :

- **Menu des pages** : un clic affiche une autre page. Seules les pages auxquelles vous avez accès apparaissent.
- **Boutons directs**, à gauche du menu ☰ :
  - **⟳ Actualiser** : recharge les données et la configuration des vues ;
  - **⚙ Configurer** : réservé aux administrateurs.
- **Menu ☰** (en haut à droite, sur écran étroit) : il ouvre la liste des autres actions. Sur grand écran, il n'y a pas de menu : toutes les actions sont des icônes dans la barre, avec leur nom au survol. L'infobulle du menu et celle de l'Aide indiquent la version du widget.

  | Action | Rôle |
  |---|---|
  | Tout replier / Tout déplier | Replie ou déplie tous les blocs d'un coup |
  | Imprimer | Imprime la page ou l'enregistre en PDF |
  | Aide | Ouvre ce guide ; l'onglet Nouveautés présente les évolutions du widget |
  | Plein écran | Réservé aux administrateurs |
  | Disposition | Réservé aux administrateurs |

  Une pastille rouge sur ☰ signale une nouvelle version du widget : elle disparaît après lecture de l'onglet Nouveautés.
- **Listes de sélection** (par exemple Département, Circonscription, École) : choisir une valeur filtre les blocs de la page.
  - Une liste qui ne propose qu'un seul choix, selon vos droits, n'est pas affichée : sa valeur s'applique automatiquement.
  - Certaines listes gardent leur sélection quand vous changez de page.

### Les blocs

Chaque vue s'affiche dans un **bloc**, avec un titre et quelques commandes :

| Élément | Rôle |
|---|---|
| ▾ / ▸ devant le titre | Replier ou déplier le bloc (un clic sur le titre fonctionne aussi) |
| **Filtre rapide** (`Tous \| Public \| Privé`) | Ne montrer que les lignes d'une valeur (voir ci-dessous) |
| Champ « Filtrer… » | Recherche dans les lignes du bloc (grands tableaux et listes de fiches) |
| ⛶ | Afficher le bloc en plein écran ; ✕ ou Échap pour revenir |

**Filtre rapide**
- **Ce qu'il fait** : il ne s'applique qu'à son bloc et ne change rien aux autres blocs ni aux sélections.
- **Synchroniser** : un **clic milieu** (molette) ou **Maj+clic** sur une valeur l'applique à tous les blocs de la page filtrés sur le même champ (par exemple *Réseau*). Sur « Tous », tous ces blocs sont remis à « Tous ». Dans une liste de valeurs, le clic milieu fonctionne de la même façon. L'infobulle de chaque valeur le rappelle. La comparaison porte sur le texte affiché, sans tenir compte des majuscules ni des accents. Si la valeur n'existe pas telle quelle dans un bloc, le rapprochement se fait par le début du texte : « Privé » garde « Privé sous contrat » et « Privé hors contrat » ; à l'inverse, « Privé sous contrat » garde « Privé ».
- **Selon la largeur du bloc et le nombre de valeurs** :
  - boutons côte à côte (4 valeurs au plus) ;
  - un seul bouton portant la valeur active (`Public ▾`), qui ouvre la liste des choix : c'est toujours le cas au-delà de 4 valeurs ;
  - une icône d'entonnoir, pleine et bleue quand un filtre est actif.
- **Rechargement** : la page revient à la valeur prévue par l'administrateur.
- **(SO)** (sans objet) : dans le premier filtre, cette option affiche les lignes sans valeur.
- **Une seule valeur** : si toutes les lignes du bloc ont la même valeur (par exemple uniquement « Public »), le filtre n'est pas affiché, puisqu'il ne changerait rien.

**Page vide** : le message « Aucune donnée, pas d'élément sélectionné » signifie qu'il faut d'abord faire un choix dans les listes de sélection.

### Tableaux et fiches

- **Trier** : cliquer sur le nom d'une colonne. Un deuxième clic inverse l'ordre, un troisième revient à l'ordre d'origine.
- **Filtrer une colonne** : bouton de filtre de l'en-tête, puis cocher les valeurs à garder.
- **Nombre de lignes** : en bas à droite de chaque tableau ; avec la recherche du bloc, « 12 sur 686 lignes ».
- **Message d'accueil** : s'il s'affiche à l'ouverture, cocher **Ne plus afficher ce message** avant de fermer pour ne plus le voir (il reviendra si son texte change). Pour le relire, ouvrir l'**Aide** puis **Message d'accueil**.
- **Description d'une colonne ou d'une vue** : survoler le ⓘ (en-tête de colonne, ou à côté du titre du bloc).
- **Fiche liée** : le petit lien à côté d'une valeur ouvre la fiche de l'élément référencé.
- **Fiche seule** : les flèches ◀ ▶ (ou celles du clavier) passent d'un enregistrement à l'autre.
- **Modifier une valeur**, si le bloc l'autorise et si vos droits le permettent : double-clic sur la cellule, saisie, puis Entrée pour valider ou Échap pour annuler.
- **Ajouter une ligne**, si le bloc le propose : bouton **+ Ajouter une ligne** en bas du bloc. La ligne est créée (rattachée à l'élément sélectionné dans la liste liée, s'il y en a une) et la saisie de son premier champ s'ouvre.
- **Supprimer une ligne**, si le bloc le propose : cliquer sur la ligne, puis sur **− Supprimer la ligne**. Le bouton demande confirmation (« Confirmer la suppression ? », ligne surlignée en rouge) : cliquer une seconde fois dans les 4 secondes. La suppression se fait aussi dans Grist ; elle peut être annulée dans Grist (Annuler).
  - Les valeurs calculées (formules) ne sont pas modifiables.
  - Une modification refusée par les droits est signalée.

### Cartes

- **Point** : le survol affiche son étiquette. Si l'étiquette est mise en forme, elle s'ouvre au clic.
- **Couleur d'un point** : elle dépend d'une valeur (par exemple la circonscription).
- **Cercle autour d'un point** : il peut signaler une autre information (réseau, situation en quartier prioritaire…).
- **Légendes** : elles expliquent les couleurs, en bas à gauche pour les points et en haut à droite pour les zones.
- **Zones** (communes, intercommunalités, quartiers IRIS) : le survol affiche leur nom et leurs chiffres.
- **Quartiers prioritaires (QPV)** : en pointillés rouges. L'infobulle d'un établissement indique s'il est dans un QPV ou à proximité.
- **Sélection** : cliquer sur un point le sélectionne et met à jour les blocs liés.
- **Cadrage** : à l'ouverture, la carte montre l'ensemble des données. Le bouton **⤢**, sous les boutons de zoom, y revient après un déplacement ou un zoom.

**Confidentialité** : les cartes n'envoient aucune donnée de vos tables à l'extérieur. Seuls des codes géographiques (département, communes), parfois la position d'un point sans code INSEE, et la zone affichée (fond de carte) sont transmis à des services publics. Le détail figure dans la documentation technique (README).

### Imprimer et exporter

- **Imprimer** : la page s'imprime en A4 paysage, avec la même disposition qu'à l'écran. Un bloc plus haut qu'une page (long tableau) commence sur une nouvelle ligne et se poursuit sur les pages suivantes. Utiliser le bouton **Imprimer** du widget, et non l'impression de la page Grist entière (qui n'imprime que la partie visible du widget). Tous les blocs sont dépliés le temps de l'impression. Le titre de la page et les sélections en cours figurent en tête. Pour un PDF, choisir « Enregistrer au format PDF » dans la fenêtre d'impression. Les boutons de filtre rapide ne sont pas imprimés ; un filtre actif est rappelé en texte à côté du titre du bloc (par exemple « Réseau : Privé »).
- **Exporter des données** : utiliser l'export de Grist (menu de la vue native, *Télécharger en CSV / XLSX*).

### Sur smartphone

- Les blocs s'affichent les uns sous les autres.
- Le menu des pages est regroupé derrière un bouton, en haut à gauche, qui porte le nom de la page affichée (icône de pages, ▾). Le menu ☰ des actions reste à droite.
- Les listes de sélection tiennent sur une seule ligne. Leur nom n'est plus affiché : la valeur choisie suffit à les reconnaître, et le texte complet apparaît à l'ouverture de la liste.

---

## 2. Questions fréquentes

**Une valeur ne correspond pas à ce que montre Grist.**
Le widget affiche les colonnes de la vue Grist. Vérifiez la vue native, puis cliquez sur **⟳ Actualiser**.

**Un bloc a disparu.**
Il est sans données et l'option « Masquer les blocs sans données » est active. Faites une sélection dans les listes.

**Le bouton Configurer n'apparaît pas.**
C'est normal : seuls les administrateurs composent les pages.

**Les onglets des pages n'apparaissent pas.**
Sur un écran étroit, ils sont regroupés derrière le bouton en haut à gauche, qui porte le nom de la page affichée. Sinon, signalez-le à l'administrateur : c'est une question de droits d'accès.

**Les modifications du widget n'apparaissent pas après une mise à jour.**
Rechargez la page avec **Ctrl + F5** pour vider le cache du navigateur.

**Une carte reste vide.**
Faites d'abord une sélection dans les listes de l'en-tête. Si elle reste vide, signalez-le à l'administrateur.

**Où voir la version du widget et ses nouveautés ?**
Au survol du bouton **Aide**, et dans la fenêtre **Aide**, onglet **Nouveautés**.
