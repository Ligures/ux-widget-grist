/* UX widget grist — panneau de configuration ⚙ (version 0.9.5.2). Développeur : Ligures. Licence MIT (voir LICENSE).
   Chargé à la demande par ux-widget.js (openConfig → loadPart("config")), après ux-carte.js dont il utilise les
   réglages de zonage. Partage l'espace global de ux-widget.js, qui doit être chargé avant.
   Contenu : brouillon de configuration (draft), réglages par bloc (renderConfig), couleurs des cartes et des
   graphiques, regroupements de communes, menu de navigation, apparence, message d'accueil ; écouteurs du panneau
   (saisies, boutons Enregistrer / Annuler). */
"use strict";
/* ---------- Panneau de configuration ---------- */
let draftNav = { url: "", items: [] };
const refreshOf = (n) => (n?.refresh === undefined || n?.refresh === null ? 20 : Number(n.refresh) || 0); // actualisation (s)
// vues retenues dont les réglages sont dépliés dans la configuration (identifiants de vue). Par défaut, toutes
// sont repliées : seuls restent le titre, les flèches et la place dans la grille (largeur, colonne, lignes) ;
// non enregistré
const cfgOpen = new Set();
let draft = null,
  cfgPage = null;
/* Page en cours de réglage (0.8.8) : on peut régler une autre page, ou en créer une, sans toucher à celle
   qui est affichée. draftOrig = nom enregistré de la page réglée (null : nouvelle page, pas encore enregistrée),
   draftBase = état de départ (pour prévenir avant d'abandonner des modifications non enregistrées). */
let draftOrig = null,
  draftBase = "",
  draftShowAfter = false,
  draftAddNav = true,
  draftIsShown = true; // le brouillon est-il la page affichée par ce widget ?
const draftShown = () => draftIsShown;
// editDraft — Met une configuration dans le brouillon (orig : nom enregistré, ou null pour une nouvelle page).
function editDraft(cfg, orig, shown = false) {
  draftIsShown = shown;
  draft = { ...DEFAULTS, ...JSON.parse(JSON.stringify(cfg)) };
  draftOrig = orig;
  draftBase = JSON.stringify(draft);
  draftShowAfter = false;
  draftAddNav = true;
  const firstSec = draft.blocks.map((b) => S.meta.sections.get(b.id)).find(Boolean);
  cfgPage = firstSec?.parentId || cfgPage || S.meta.pages[0]?.viewId;
}
// leaveDraft — Abandonner le brouillon en cours ? (demande confirmation s'il a été modifié)
const leaveDraft = () =>
  !draft || JSON.stringify(draft) === draftBase || confirm(`Abandonner les modifications de « ${draft.name} » ?`);
// freeName — Nom libre dérivé de base (« Nouvelle page », « Nouvelle page 2 »…).
function freeName(base) {
  const used = new Set((S.stored || []).map((x) => x.name));
  let n = base,
    k = 1;
  while (used.has(n)) n = `${base} ${++k}`;
  return n;
}
// openConfigPanel — Ouvre le panneau de configuration sur un brouillon (draft) de la configuration courante.
//   Appelée par openConfig (ux-widget.js) une fois ce fichier chargé.
async function openConfigPanel() {
  if (!S.isAdmin) return;
  try {
    await loadMeta(); // toujours relire la structure : colonnes ou vues renommées depuis l'ouverture
    fixColIds(S.cfg);
  } catch (e) {
    status(e.message, true);
    return;
  }
  cfgPage = null;
  editDraft(S.cfg, S.cfg.name || null, true); // on part de la page affichée
  draftNav = JSON.parse(JSON.stringify(S.nav || { url: "", items: [] }));
  if (!draftNav.url) draftNav.url = await guessDocUrl();
  $("#config").hidden = false;
  renderConfig();
}
/* Listes de colonnes de la configuration : ordre alphabétique du libellé affiché */
const byLabel = (cols) => cols.slice().sort((a, b) => COLL.compare(a.label || a.colId, b.label || b.colId));
/* Choix de la table Grist qui colore les zones */
function zoneTableHtml(b, i) {
  const m = S.meta,
    tabs = [...m.tables.values()].filter(
      (t) => t.tableId && !t.tableId.startsWith("_grist") && !t.summarySourceTable && !/^W_/.test(t.tableId),
    );
  const t = tabs.find((x) => x.tableId === b.zoneTable);
  const cols = t
    ? byLabel(
        (m.colsByTable.get(t.id) || []).filter(
          (c) => !c.colId.startsWith("gristHelper_") && c.colId !== "manualSort",
        ),
      )
    : [];
  const so = (f, opts, cur) =>
    `<select data-f="${f}" data-i="${i}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  const lab = (txt, ctrl, tip) => `<label title="${esc(tip)}"><span class="lt">${txt}</span> ${ctrl}</label>`;
  const code =
    { communes: "code INSEE", epci: "SIREN de l'EPCI", iris: "code IRIS (9 caractères)", legis: "code de la circonscription (ex. 2901)", college: "UAI du collège" }[zoneMode(b)] || (isGrp(zoneMode(b)) ? "nom du regroupement" : "code");
  return (
    lab(
      "Table",
      so(
        "zoneTable",
        [
          ["", "—"],
          ...tabs.sort((x, y) => COLL.compare(x.tableId, y.tableId)).map((x) => [x.tableId, x.tableId]),
        ],
        b.zoneTable || "",
      ),
      "Table Grist contenant une ligne par zone (par exemple des données INSEE par IRIS).",
    ) +
    (t
      ? lab(
          "Colonne du code",
          so("zoneKey", [["", "—"], ...cols.map((c) => [c.colId, c.label || c.colId])], b.zoneKey || ""),
          `Colonne contenant le ${code}, qui relie chaque ligne à sa zone.`,
        ) +
        lab(
          "Colonne de la valeur",
          so("zoneVal", [["", "—"], ...cols.map((c) => [c.colId, c.label || c.colId])], b.zoneVal || ""),
          "Valeur qui colore la zone : dégradé en 5 classes pour un nombre, une couleur par valeur pour un texte.",
        )
      : "")
  );
}
// grpChoices — Regroupements configurés, pour les listes « Zonage » et « Second zonage » de la configuration
const grpChoices = (b) =>
  Array.from({ length: GRP_MAX }, (_, k) => k + 1)
    .filter((n) => grpReady(b, n) || (n === 1 && isGrp(zoneMode(b))))
    .map((n) => [grpMode(n), `${grpLabel(b, n)} (regroupement)`]);
// grpHtml — Regroupements de communes (0.9.4.16, plusieurs en 0.9.4.19) : pour chacun, table, code INSEE, colonne de
//   regroupement, libellé ; un regroupement de plus est proposé quand le précédent est complet (3 au plus)
function grpHtml(b, i) {
  const m = S.meta,
    tabs = [...m.tables.values()]
      .filter((t) => t.tableId && !t.tableId.startsWith("_grist") && !t.summarySourceTable)
      .sort((x, y) => COLL.compare(x.tableId, y.tableId));
  const so = (f, opts, cur) =>
    `<select data-f="${f}" data-i="${i}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(cur) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
  const lab = (txt, ctrl, tip) => `<label title="${esc(tip)}"><span class="lt">${txt}</span> ${ctrl}</label>`;
  let out = "";
  for (let n = 1; n <= GRP_MAX; n++) {
    if (n > 1 && !grpReady(b, n - 1) && !grpOpt(b, n, "Table")) break;
    const t = tabs.find((x) => x.tableId === grpOpt(b, n, "Table"));
    const cols = t
      ? byLabel((m.colsByTable.get(t.id) || []).filter((c) => !c.colId.startsWith("gristHelper_") && c.colId !== "manualSort"))
      : [];
    const co = [["", "—"], ...cols.map((c) => [c.colId, c.label || c.colId])];
    const h = `Regroupement ${n}`;
    out +=
      lab(
        `${h} : table des communes`,
        so(grpF(n, "Table"), [["", "—"], ...tabs.map((x) => [x.tableId, x.tableId])], grpOpt(b, n, "Table") || ""),
        "Table Grist avec une ligne par commune (ex. P_Communes). Une fois le regroupement complet, il est proposé dans la liste « Zonage » de la carte ; « — » le retire.",
      ) +
      (t
        ? lab(`${h} : code INSEE`, so(grpF(n, "Key"), co, grpOpt(b, n, "Key") || ""), "Colonne du code INSEE de la commune (ex. CODE_COM).") +
          lab(
            `${h} : colonne`,
            so(grpF(n, "Col"), co, grpOpt(b, n, "Col") || ""),
            "Colonne dont la valeur réunit les communes en une zone (ex. CODE_RP, réseau pédagogique). Une référence est lue par sa colonne d'affichage.",
          ) +
          lab(
            `${h} : libellé`,
            `<input type="text" data-zfile="${i}" data-zkey="${grpF(n, "Label")}" value="${esc(grpOpt(b, n, "Label") || "")}" placeholder="Regroupements de communes${n > 1 ? ` ${n}` : ""}" style="width:220px">`,
            "Nom du zonage dans la liste « Zonage » de la carte, dans la légende et dans l'en-tête imprimé (ex. Réseaux pédagogiques).",
          )
        : "");
  }
  return out;
}
/* Éditeur des couleurs choisies d'une carte */
function mapRulesHtml(b, i, s) {
  const col = (S.meta.colsByTable.get(s.tableRef) || []).find((c) => c.colId === b.mapRing);
  const tid = S.meta.tables.get(s.tableRef)?.tableId,
    rows = S.byId[tid];
  const vals =
    col && rows
      ? [
          ...new Set(
            [...rows.values()].map((r) => String(textOf(col, parseJSON(col.widgetOptions), r[col.colId]) ?? "")),
          ),
        ]
          .filter(Boolean)
          .sort(COLL.compare)
          .slice(0, 300)
      : [];
  const rules = b.mapRules || [];
  const DEF = ["#18753C", "#E4794A", "#CE0500"];
  return `<div class="mrules" title="Jusqu'à 3 couleurs de contour. Chaque point prend le contour de la première condition vérifiée ; les autres gardent le contour blanc habituel.">
    <span class="lt">Couleurs du contour</span>
    ${vals.length ? `<datalist id="mrv${i}">${vals.map((v) => `<option value="${esc(v)}">`).join("")}</datalist>` : ""}
    ${rules
.map(
  (r, k) => `<div class="mr">
<input type="color" data-mr="${i}:${k}:c" value="${esc(/^#[0-9a-f]{6}$/i.test(r.c || "") ? r.c : DEF[k])}" title="Couleur du contour des points qui vérifient la condition">
<select data-mr="${i}:${k}:op" title="Comparaison (les nombres sont comparés comme des nombres)">${RULE_OPS.map(([o, l]) => `<option value="${o}" ${o === (r.op || "=") ? "selected" : ""}>${l}</option>`).join("")}</select>
<input type="text" data-mr="${i}:${k}:v" value="${esc(r.v ?? "")}" list="mrv${i}" placeholder="valeur" style="width:120px" title="Valeur telle qu'affichée dans Grist (vide = cellule vide)">
<input type="text" data-mr="${i}:${k}:label" value="${esc(r.label ?? "")}" placeholder="légende (facultatif)" style="width:120px" title="Texte de la légende (par défaut : la condition)">
<button class="icon-btn" data-mrrm="${i}:${k}" title="Supprimer cette couleur">✕</button></div>`,
)
.join("")}
    ${rules.length < 3 ? `<button class="icon-btn" data-mradd="${i}" title="Ajouter une couleur (3 au plus)">+ Couleur</button>` : ""}
    ${rules.length ? "" : `<small> aucune pour l'instant</small>`}
  </div>`;
}
// secLabel — Libellé d'une vue dans la configuration : titre · type.
function secLabel(id) {
  const i = getInfo(id);
  return i ? `${i.title} · ${KIND[i.kind] || i.kind}` : `#${id}`;
}
// renderConfig — Construit le panneau de configuration. Chaque changement modifie `draft` puis reconstruit le panneau.
function renderConfig() {
  const m = S.meta;
  const pageOpts = m.pages
    .map(
      (p) =>
        `<option value="${p.viewId}" ${p.viewId === cfgPage ? "selected" : ""}>${"\u00a0\u00a0".repeat(p.indent)}${esc(p.name)}</option>`,
    )
    .join("");
  const secs = m.sectionsByView.get(cfgPage) || [];
  const picks =
    secs
      .map((s) => {
        const ok = SUPPORTED.includes(s.parentKey),
          on = draft.blocks.some((b) => b.id === s.id);
        return `<label class="${ok ? "" : "dis"}"><input type="checkbox" data-add="${s.id}" ${on ? "checked" : ""} ${ok ? "" : "disabled"}> ${kindTitle(s)}</label>`;
      })
      .join("") || '<div class="msg">Aucun widget sur cette page</div>';
  const widths = [
    [1, "1/6"],
    [2, "1/3"],
    [3, "1/2"],
    [4, "2/3"],
    [5, "5/6"],
    [6, "pleine"],
  ];
  const preview = draft.blocks
    .filter((b) => m.sections.has(b.id) && !isSelector(b))
    .map(
      (b) =>
        (draft.flux && b.newLine ? '<span class="brk"></span>' : "") +
        `<div style="${placement(b, m.sections.get(b.id).parentKey, !!draft.flux)}" title="${esc(secLabel(b.id))}">${esc(getInfo(b.id)?.title || "")}</div>`,
    )
    .join("");
  // libellé avec explication au survol
  const L = (text, ctrl, tip, after = false) =>
    `<label${tip ? ` title="${esc(tip)}"` : ""}>${after ? `${ctrl} <span class="lt">${text}</span>` : `<span class="lt">${text}</span> ${ctrl}`}</label>`;
  const C = (attr, on, text, tip) => L(text, `<input type="checkbox" ${attr} ${on ? "checked" : ""}>`, tip, true);
  // encadré de réglages titré, omis s'il est vide (réglages propres à un type de vue)
  const G = (title, tip, html) =>
    html && String(html).trim() ? `<div class="mgrp"><div class="mgrp-h" title="${esc(tip)}">${title}</div>${html}</div>` : "";
  const colOpts = (s) =>
    byLabel(
      (m.colsByTable.get(s.tableRef) || []).filter(
        (c) => !c.colId.startsWith("gristHelper_") && c.colId !== "manualSort",
      ),
    ).map((c) => [c.colId, esc(c.label || c.colId)]);
  const chosen =
    draft.blocks
      .map((b, i) => {
        const s = m.sections.get(b.id);
        if (!s)
          return `<li><span style="color:var(--rouge)">Vue #${b.id} introuvable (supprimée ?)</span><button class="icon-btn" data-rm="${i}" title="Retirer de la page">✕</button></li>`;
        const w = b.width || DEFAULT_WIDTH[s.parentKey] || 3;
        const sel = (f, opts, cur) =>
          `<select data-f="${f}" data-i="${i}">${opts.map(([v, l]) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${l}</option>`).join("")}</select>`;
        const isFiche = ["single", "detail", "record"].includes(s.parentKey),
          isMap = s.parentKey === "custom" && isMapSection(s);
        const fold = !cfgOpen.has(b.id);
        return `<li class="${fold ? "folded" : ""}"><div class="chead"><button class="icon-btn fold-btn" data-fold="${b.id}" title="${fold ? "Afficher tous les réglages de ce bloc" : "Replier les réglages (garder la place dans la grille)"}" aria-expanded="${!fold}">${fold ? "▸" : "▾"}</button><span class="cname" title="${esc(secLabel(b.id))}">${kindTitle(s, b)} <small>— ${esc(m.pageOfView.get(s.parentId) || "")} · table ${esc(m.tables.get(s.tableRef)?.tableId || "?")}</small></span>
<button class="icon-btn" data-up="${i}" title="Placer avant la vue précédente">↑</button><button class="icon-btn" data-down="${i}" title="Placer après la vue suivante">↓</button>
<button class="icon-btn" data-rm="${i}" title="Retirer de la page (la vue Grist n'est pas supprimée)">✕</button></div>
${
  isFiche
    ? `<div class="fl">Champs lus : ${esc(
        getInfo(b.id)
          .fields.map(
            (f) =>
              f.label +
              (b.editable ? (isEditableCol(f.col) ? " ✎" : f.col.isFormula && f.col.formula ? " ƒ" : "") : ""),
          )
          .join(", ") || "aucun",
      )}${b.editable ? " — ✎ éditable, ƒ formule (non éditable)" : ""}</div>`
    : ""
}
<div class="ctrls lay">
  ${
    draft.flux
      ? L(
          "Largeur",
          sel("fw", [[0, "ajustée au contenu"], ...widths], b.fw || 0),
          "Mode ultracompact : largeur du bloc. « Ajustée au contenu » prend juste la place nécessaire aux données.",
        )
      : L(
          "Largeur",
          sel("width", widths, w),
          "Part de la largeur de la page occupée par le bloc (grille de 6 colonnes).",
        ) +
        L(
          "Colonne",
          sel(
            "start",
            [
              [0, "auto"],
              [1, 1],
              [2, 2],
              [3, 3],
              [4, 4],
              [5, 5],
              [6, 6],
            ],
            b.start || 0,
          ),
          "Colonne de départ du bloc dans la grille. « auto » : le bloc se place à la suite du précédent.",
        ) +
        L(
          "Hauteur (lignes)",
          sel(
            "rows",
            [
              [1, 1],
              [2, 2],
              [3, 3],
            ],
            b.rows || 1,
          ),
          "Nombre de rangées de la grille occupées par le bloc, pour placer plusieurs petits blocs à côté d'un grand. Ignoré en mode empilé.",
        )
  }
</div><div class="ctrls more">
<div class="mgrps">
  ${G("Affichage", "Réglages communs à toutes les vues : taille, état à l'ouverture, placement dans la page.", [(L(
    "Taille",
    sel(
      "height",
      [
        ["", "normale"],
        ["mini", "mini"],
        ["compact", "compacte"],
        ["grand", "grande"],
        ["tresgrand", "très grande"],
      ],
      b.height || "",
    ),
    "Hauteur maximale du bloc (tableaux, graphiques, cartes). Au-delà, le contenu défile dans le bloc.",
  )),(L(
    "À l'ouverture",
    sel(
      "startFold",
      [
        ["", s.parentKey === "chart" || (s.parentKey === "custom" && !isMap && !isMarkdownSection(s)) ? "auto (replié)" : "auto (déplié)"],
        ["fold", "replié"],
        ["open", "déplié"],
      ],
      b.startFold || "",
    ),
    "État du bloc à l'ouverture de la page. Un bloc replié n'affiche que son titre ; un clic sur le titre le déplie.",
  )),(C(`data-nl="${i}"`, b.newLine, "À la ligne", "Le bloc commence une nouvelle rangée, même s'il reste de la place à droite du bloc précédent.")),(C(`data-stk="${i}"`, b.sticky, "Figer à l'écran", "Le bloc reste visible pendant que l'on fait défiler un bloc voisin plus long.")),(C(`data-asel="${i}"`, isSelector(b), "Liste de sélection", "Affiche cette vue sous forme de liste déroulante dans l'en-tête : choisir une valeur pilote les blocs liés, comme un sélecteur."))].join(""))}
  ${G("Tableau", "Réglages propres aux tableaux.", (s.parentKey === "record" ? C(`data-rowcount="${i}"`, b.rowCount !== false, "Nombre de lignes", "Affiche en bas à droite du tableau le nombre de lignes (avec la recherche du bloc : « 12 sur 686 lignes »).") : "") + (s.parentKey === "record"
      ? L(
          "Largeur des colonnes",
          sel(
            "colWidths",
            [
              ["", "ajustées (sans défilement horizontal)"],
              ["grist", "celles de la vue Grist"],
              ["auto", "automatique"],
            ],
            b.colWidths || "",
          ),
          "Ajustées : les colonnes se partagent la largeur du bloc, sans ascenseur horizontal. Grist : largeurs réglées dans la vue native. Automatique : selon le contenu.",
        )
      : ""))}
  ${G("Fiches", "Réglages propres aux fiches et listes de fiches.", [(s.parentKey === "single" ? C(`data-aslist="${i}"`, b.asList, "Afficher toutes les fiches (en liste)", "Affiche une fiche par enregistrement au lieu de la seule fiche sélectionnée.") : ""),(s.parentKey === "detail" || (s.parentKey === "single" && b.asList)
      ? L(
          "Largeur des fiches",
          sel(
            "cardW",
            [
              ["", "pleine largeur (comme Grist)"],
              ["s", "étroite (180 px)"],
              ["m", "moyenne (240 px)"],
              ["l", "large (340 px)"],
              ["xl", "très large (460 px)"],
            ],
            b.cardW || "",
          ),
          "Largeur de chaque fiche : plusieurs fiches étroites se placent côte à côte.",
        )
      : ""),(["single", "detail"].includes(s.parentKey) ? C(`data-nolab="${i}"`, b.hideLabels, "Masquer les noms des champs", "Pour ce bloc, n'affiche que les valeurs : les noms des champs restent visibles au survol d'une valeur.") : ""),(["single", "detail"].includes(s.parentKey) ? C(`data-sempty="${i}"`, b.showEmpty, "Afficher les champs vides", "Pour ce bloc seulement, montre aussi les champs sans valeur (sinon masqués selon l'option générale).") : "")].join(""))}
  ${G("Édition", "Modification des données depuis la page (droits Grist respectés).", [(isFiche ? C(`data-edit="${i}"`, b.editable, "Édition des champs", "Permet de modifier les valeurs directement dans la page (double-clic). Les règles d'accès de Grist s'appliquent : une modification interdite est refusée ; les lecteurs restent en lecture seule.") : ""),(["record", "detail"].includes(s.parentKey) ? C(`data-addr="${i}"`, b.addable, "Ajout et suppression de lignes", "Avec « Édition des champs », affiche en bas du bloc « + Ajouter une ligne » et « − Supprimer la ligne » (ligne sélectionnée, après confirmation). Si le bloc est lié à une sélection, la nouvelle ligne y est rattachée. Les règles d'accès de Grist s'appliquent (droits de création et de suppression).") : "")].join(""))}
  ${G("Texte (Markdown)", "Widget Markdown de Grist : affiché tel quel, ou en bloc-notes modifiable.", s.parentKey === "custom" && isMarkdownSection(s) ? L("Taille du texte", sel("mdSize", MD_SIZES, b.mdSize || ""), "Taille des caractères du texte affiché (les titres restent proportionnés).") + C(`data-mdedit="${i}"`, b.mdEdit ?? !!b.mdNote, "Modifiable depuis la page", "Le texte se modifie depuis la page (bouton ✎ ou double-clic) : le Markdown est enregistré dans la colonne du widget, pour la ligne affichée. La colonne doit être une colonne de données (pas une formule). Les règles d'accès de Grist s'appliquent ; les lecteurs ne peuvent pas modifier.") + C(`data-mdnote="${i}"`, b.mdNote, "Aspect bloc-notes", "Affiche le texte sur un fond de papier jaune pâle, avec une marge rouge.") : "")}
  ${G("Liste de sélection", "La vue est affichée comme une liste déroulante dans l'en-tête de la page.", (isSelector(b)
      ? L(
          "Colonne affichée",
          sel("selCol", [["", "auto"], ...colOpts(s)], b.selCol || ""),
          "Colonne dont les valeurs apparaissent dans la liste déroulante.",
        ) +
        L(
          "Ordre",
          sel(
            "selOrder",
            [
              ["", "alphabétique"],
              ["vue", "celui de la vue Grist"],
            ],
            b.selOrder || "",
          ),
          "Ordre des valeurs dans la liste.",
        ) +
        L(
          "Regrouper par",
          sel("selGroup", [["", "aucun"], ...colOpts(s)], b.selGroup || ""),
          "Classe les valeurs de la liste sous des intertitres (par exemple les écoles par commune).",
        ) +
        (b.selGroup
          ? L(
              "Ordre des groupes",
              sel(
                "selGroupOrder",
                [
                  ["", "alphabétique (A → Z)"],
                  ["desc", "inverse (Z → A)"],
                ],
                b.selGroupOrder || "",
              ),
              "Ordre des intertitres dans la liste. Les nombres et les années sont classés par valeur (2024 avant 2025, 9 avant 10).",
            )
          : "") +
        L(
          "ID de synchronisation",
          `<input type="text" data-sync="${i}" value="${esc(b.syncId ?? "")}" placeholder="${esc(selectorSyncId({ id: b.id }) || "aucun")}" style="width:110px">`,
          "Les listes portant le même identifiant gardent la même sélection d'une page à l'autre (comme le drop-down de Varamil).",
        )
      : ""))}
  ${(() => {
    // couleurs des graphiques (natifs, ou avancés Plotly) : par catégorie (camembert, histogramme à une série)
    // ou par série (plusieurs séries, courbes)
    const adv = s.parentKey === "custom" && !isMap ? advChartSpec(s)?.data : null;
    if (s.parentKey !== "chart" && !adv) return "";
    const isPie = (s.parentKey === "chart" && ["pie", "donut"].includes(s.chartType)) || (adv || []).some((t) => t?.type === "pie");
    const swatches = [...pieColorMapOf(b.pieColorMap).values()].slice(0, 12).map((c) => `<span class="pcs" style="background:${c}"></span>`).join("");
    const dflt = hexColor(b.pieColorDefault);
    return (
      `<div class="mgrp"><div class="mgrp-h" title="${isPie ? "Couleur de chaque part du camembert." : "Histogramme à une seule série : une couleur par barre (catégorie). Plusieurs séries, ou courbes : une couleur par série (valeur du regroupement ou nom de la colonne)."} Priorité : correspondance, puis colonne de codes, puis couleur de repli.">Couleurs du graphique</div>` +
      L("Colonne de codes", sel("pieColorCol", [["", "aucune"], ...colOpts(s)], b.pieColorCol || ""), "Colonne de la table contenant, pour chaque ligne, un code couleur hexadécimal (#000091), appliqué à la catégorie (ou à la série) de la ligne. Peut être une formule, par exemple $Reseau.Couleur.") +
      L("Correspondance", `<textarea data-pcm="${i}" rows="3" placeholder="Public = #000091&#10;Privé = #e1000f">${esc(b.pieColorMap || "")}</textarea>`, "Une catégorie ou une série par ligne : « Public = #000091 ». La casse est ignorée. Prioritaire sur la colonne de codes.") +
      (swatches ? `<div class="pcsl">${swatches}</div>` : "") +
      L("Couleur de repli", `<input type="text" data-pcd="${i}" value="${esc(b.pieColorDefault || "")}" placeholder="#c8c8c8" size="9">${dflt ? `<span class="pcs" style="background:${dflt}"></span>` : ""}`, "Couleur des catégories sans code. Vide : couleurs habituelles du widget.") +
      `</div>`
    );
  })()}
  ${(() => {
    // filtres rapides du bloc (0.9.0.2) : un encadré par filtre — champ, valeur à l'ouverture, valeurs exclues
    if (!(["record", "detail", "chart", "custom"].includes(s.parentKey) || (s.parentKey === "single" && b.asList)) || isSelector(b) || isMarkdownSection(s)) return "";
    const all = (m.colsByTable.get(s.tableRef) || []).filter((c) => !c.colId.startsWith("gristHelper_") && c.colId !== "manualSort");
    const shown = new Set((getInfo(b.id)?.fields || []).map((f) => f.col?.colId));
    const inView = byLabel(all.filter((c) => shown.has(c.colId))), others = byLabel(all.filter((c) => !shown.has(c.colId)));
    const groups = [];
    // deux emplacements : le 2nd est proposé une fois le premier choisi ; les deux se cumulent
    for (const k of [1, 2]) {
      const fk = k === 2 ? "qfField2" : "qfField",
        dk = k === 2 ? "qfDefault2" : "qfDefault";
      if (k === 2 && !b.qfField) break;
      const opt = (c) => `<option value="${esc(c.colId)}" ${c.colId === b[fk] ? "selected" : ""}>${esc(c.label || c.colId)}</option>`;
      const field = `<select data-f="${fk}" data-i="${i}"><option value="">aucun</option>${inView.length ? `<optgroup label="Champs de la vue">${inView.map(opt).join("")}</optgroup>` : ""}${others.length ? `<optgroup label="Autres colonnes de la table">${others.map(opt).join("")}</optgroup>` : ""}</select>`;
      let g = L(
        "Champ",
        field,
        k === 2
          ? "Second filtre dans l'en-tête du bloc, sur un autre champ. Il se cumule avec le premier (par exemple Réseau = Public et Type = Ecole)."
          : "Ajoute dans l'en-tête du bloc des boutons « Tous | valeur 1 | valeur 2… » (au-delà de 4 valeurs : la valeur active et une liste au clic) pour filtrer ses lignes sur ce champ. Exemple : Reseau → Tous | Public | Privé.",
      );
      const qc = b[fk] && all.find((c) => c.colId === b[fk]);
      if (qc) {
        const vals = qfValuesOf([qc]);
        // 1er filtre : les lignes sans valeur forment l'option « (SO) » (sans objet)
        if (k === 1) {
          const tid = m.tables.get(qc.parentId)?.tableId;
          if ([...(S.byId[tid]?.values() || [])].some((r) => qfText(qc, r) === "(vide)")) vals.push("(vide)");
        }
        if (b[dk] && !vals.some((v) => qfSame(v, b[dk]))) vals.push(b[dk]);
        const shownV = (v) => (v === "(vide)" ? "(SO)" : v);
        g += L("À l'ouverture", `<select data-f="${dk}" data-i="${i}"><option value="">Tous</option>${vals.map((v) => `<option value="${esc(v)}" ${b[dk] && qfSame(v, b[dk]) ? "selected" : ""}>${esc(shownV(v))}</option>`).join("")}</select>`, `Valeur de « ${qc.label || qc.colId} » sélectionnée à l'ouverture de la page. L'utilisateur peut ensuite changer.`);
        const ex = qfExclOf(b, k);
        g += `<div class="qfx" title="Valeurs retirées des boutons du filtre ET des lignes affichées dans ce bloc (par exemple « Fermé »)."><span class="lt">Valeurs exclues</span><span class="qfx-list">${[...new Set([...vals, ...ex])]
          .map((v) => `<label><input type="checkbox" data-qfx="${i}" data-qk="${k}" value="${esc(v)}" ${ex.some((x) => qfSame(x, v)) ? "checked" : ""}> ${esc(shownV(v))}</label>`)
          .join("")}</span></div>`;
      }
      groups.push(`<div class="mgrp"><div class="mgrp-h" title="Boutons « Tous | valeurs » dans l'en-tête du bloc">${k === 2 ? "2ᵉ filtre rapide" : "Filtre rapide"}</div>${g}</div>`);
    }
    groups.push(
      `<div class="mgrp"><div class="mgrp-h" title="Filtre dont l'utilisateur choisit lui-même la colonne">Filtre libre</div>${C(
        `data-qffree="${i}"`,
        b.qfFree,
        "Proposer un filtre libre",
        "Ajoute dans l'en-tête du bloc une liste « Filtrer sur… » : l'utilisateur choisit une colonne de la table, puis une de ses valeurs. Il se cumule avec les filtres rapides ; le choix est oublié à la fermeture de la page.",
      )}${
        b.qfFree
          ? `<div class="qfx" title="Colonnes proposées dans « Filtrer sur… ». Aucune cochée : toutes les colonnes de la table."><span class="lt">Colonnes proposées <small>(aucune : toutes)</small></span><span class="qfx-list">${qfFreeCandidates(s.tableRef)
              .map((c) => `<label><input type="checkbox" data-qffc="${i}" value="${esc(c.colId)}" ${(b.qfFreeCols || []).includes(c.colId) ? "checked" : ""}> ${esc(c.label || c.colId)}</label>`)
              .join("")}</span></div>`
          : ""
      }</div>`,
    );
    return groups.join("");
  })()}
  ${
    isMap
      ? `<div class="mgrp"><div class="mgrp-h" title="Ce qui s'affiche sur chaque point : son étiquette et sa couleur.">Points</div>` +
        L(
          "Étiquette",
          sel(
            "mapLabel",
            [
              [
                "",
                `auto (${esc(colByKey(m.colsByTable.get(s.tableRef) || [], mapSpec(s).name)?.colId || "aucune")})`,
              ],
              ...colOpts(s),
            ],
            b.mapLabel || "",
          ),
          "Colonne affichée au survol ou au clic sur un point. « auto » reprend la colonne « Name » de la carte Grist.",
        ) +
        C(
          `data-mlbl="${i}"`,
          b.mapLabelsOn,
          "Étiquettes toujours visibles",
          "Affiche l'étiquette de chaque point en permanence, au lieu de la montrer au survol.",
        ) +
        C(
          `data-mexpadm="${i}"`,
          b.mapExportAdmin,
          "Export réservé aux administrateurs",
          "Le bouton d'export de la carte (fichier HTML interactif) n'apparaît qu'aux administrateurs. Décochée : tous les utilisateurs peuvent exporter la carte qu'ils voient.",
        ) +
        C(
          `data-mwheel="${i}"`,
          b.mapWheel,
          "Zoom à la molette sans Ctrl",
          "Par défaut, la molette fait défiler la page et Ctrl + molette zoome sur la carte ; sur écran tactile, un doigt fait défiler la page et deux doigts déplacent la carte. Cochée : la molette et un doigt agissent directement sur la carte, comme avant. En plein écran du bloc, la carte est toujours libre.",
        ) +
        L(
          "Couleur selon",
          sel("mapColor", [["", "aucune"], ...colOpts(s)], b.mapColor || ""),
          "Colore les points selon la valeur d'une colonne (une couleur par valeur, ou des classes pour un nombre). Les valeurs invalides sont en rouge.",
        ) +
        (b.mapColor
          ? L(
              "… sinon selon",
              sel("mapColor2", [["", "aucune"], ...colOpts(s)], b.mapColor2 || ""),
              "Pour les points dont la colonne « Couleur selon » est vide : couleur selon cette 2ᵉ colonne (teintes différentes, légende à part). Les autres points gardent la couleur de la 1re colonne.",
            )
          : "") +
        `</div>` +
        `<div class="mgrp"><div class="mgrp-h" title="Cercle coloré autour des points, selon une colonne ou la situation en quartier prioritaire.">Contour des points</div>` +
        L(
          "Contour selon",
          sel("mapRing", [["", "aucun"], ["__qpv", "situation QPV (calculée)"], ...colOpts(s)], b.mapRing || ""),
          "Colore le cercle qui entoure chaque point selon la valeur d'une colonne, avec les couleurs que vous choisissez (3 au plus). Le remplissage du point reste celui de « Couleur selon ».",
        ) +
        (b.mapRing && b.mapRing !== "__qpv" ? mapRulesHtml(b, i, s) : "") +
        `</div>` +
        `<div class="mgrp"><div class="mgrp-h" title="Périmètres des QPV et proximité des points.">Quartiers prioritaires (QPV)</div>` +
        C(
          `data-mqpv="${i}"`,
          b.mapQpv,
          "Afficher les périmètres",
          "Dessine les périmètres des QPV 2024 (ANCT) en pointillés rouges. Avec « Contour selon : situation QPV », les points situés dans un QPV sont cerclés de rouge, ceux à proximité d'orange.",
        ) +
        (b.mapQpv || b.mapRing === "__qpv"
          ? L(
              "Proximité d'un QPV",
              sel(
                "qpvDist",
                [
                  [0, "dans le quartier seulement"],
                  [100, "100 m"],
                  [200, "200 m"],
                  [300, "300 m"],
                  [500, "500 m"],
                ],
                b.qpvDist ?? 300,
              ),
              "Distance en deçà de laquelle un point hors QPV est signalé comme proche (contour orange, infobulle).",
            ) +
            L(
              "Fichier des QPV",
              `<input type="text" data-qpvurl="${i}" value="${esc(b.qpvUrl || "")}" placeholder="${QPV_DEFAULT}" style="width:200px">`,
              "Fichier GeoJSON (WGS84) des périmètres, placé à côté du widget sur GitHub. Vide : qpv-bretagne.geojson. Le fichier doit être sur le même site que le widget (politique de sécurité) ; pour un autre site, ajouter son adresse à la CSP de index.html.",
            )
          : "") +
        `</div>` +
        `<div class="mgrp"><div class="mgrp-h" title="Communes, EPCI ou IRIS dessinés sous les points, et leur couleur.">Zones sous les points</div>` +
        L(
          "Zonage",
          sel(
            "mapZone",
            [
              ["", "aucun"],
              ["communes", "communes"],
              ["epci", "EPCI (intercommunalités)"],
              ["iris", "IRIS (quartiers INSEE)"],
              ["legis", "circonscriptions législatives"],
              ["college", "secteurs de collège"],
              ...grpChoices(b),
            ],
            zoneMode(b),
          ),
          "Dessine sous les points les communes qui en contiennent, les EPCI entiers (contours geo.api.gouv.fr, communes fusionnées), les IRIS des communes découpées en quartiers (service IGN, édition la plus récente), les circonscriptions législatives et les secteurs de collège (fichiers GeoJSON déposés à côté du widget), ou des regroupements de communes définis dans une table Grist (ex. réseaux pédagogiques).",
        ) +
        (zoneMode(b)
          ? L(
              "Second zonage (contours)",
              sel(
                "mapZone2",
                [
                  ["", "aucun"],
                  ...[
                    ["communes", "communes"],
                    ["epci", "EPCI"],
                    ["iris", "IRIS"],
                    ["legis", "circonscriptions législatives"],
                    ["college", "secteurs de collège"],
                    ...grpChoices(b),
                  ].filter(([v]) => v !== zoneMode(b)),
                ],
                b.mapZone2 || "",
              ),
              "Croise deux découpages : le second est tracé en pointillés noirs par-dessus le premier (sans couleur de fond), par exemple les communes colorées et les circonscriptions législatives. Son nom s'affiche au survol du trait.",
            ) +
            (b.mapZone2 && b.mapZone2 !== zoneMode(b)
              ? L(
                  "Étiquette au survol",
                  sel(
                    "zoneHover",
                    [
                      ["", "zonage principal"],
                      ["second", "second zonage"],
                    ],
                    b.zoneHover || "",
                  ),
                  "Zonage dont le nom s'affiche quand on survole la carte. « second zonage » : son nom s'affiche partout à l'intérieur de ses contours, et le zonage principal n'a plus d'étiquette.",
                )
              : "")
          : "") +
        Object.entries(FILE_ZONES)
          .filter(([k]) => [zoneMode(b), zoneMode(b) ? b.mapZone2 : ""].includes(k))
          .map(([k, Z]) =>
            L(
              `Rattachement : ${Z.label.toLowerCase()}`,
              sel(Z.colKey, [["", "position des points"], ...colOpts(s)], b[Z.colKey] || ""),
              `Comment relier chaque point à sa zone. « position des points » : la zone dont le contour contient le point. Une colonne : la zone dont le code est la valeur de la colonne (${k === "legis" ? "ex. 2201 pour la 1re circonscription des Côtes-d'Armor" : "UAI du collège"}) ; c'est le choix à faire quand vos données font foi, par exemple pour une commune partagée entre deux zones.`,
            ) +
            L(
              `Fichier : ${Z.label.toLowerCase()}`,
              `<input type="text" data-zfile="${i}" data-zkey="${Z.urlKey}" value="${esc(b[Z.urlKey] || "")}" placeholder="${Z.def}" style="width:220px">`,
              `Fichier GeoJSON (WGS84) déposé à côté du widget sur GitHub, restreint à la région (voir le README). Plusieurs fichiers : les séparer par des virgules (ex. ${Z.def}, ${Z.def.replace("bretagne", "22")}). Vide : ${Z.def}. Un fichier sur un autre site doit être autorisé dans la CSP de index.html.`,
            ),
          )
          .join("") +
        ([zoneMode(b), zoneMode(b) ? b.mapZone2 : ""].includes("iris")
          ? L(
              "Rattachement : quartiers IRIS",
              sel(
                "irisCol",
                [
                  ["", "tous les IRIS des communes des points"],
                  ["__pts", "IRIS qui contiennent des points (position)"],
                  ...colOpts(s).map(([v, t]) => [v, `IRIS des points : ${t}`]),
                ],
                b.irisCol || "",
              ),
              "Quels quartiers dessiner. « tous les IRIS des communes des points » : chaque commune découpée en entier. « IRIS qui contiennent des points » : seulement les quartiers où se trouve un point, d'après sa position. Une colonne (code IRIS à 9 caractères, ex. 290190101) : seulement les quartiers des points, d'après vos données ; une commune non découpée a pour code INSEE + 0000.",
            )
          : "") +
        grpHtml(b, i) +
        (needsInsee(b)
          ? L(
              "Code INSEE",
              sel(
                "mapCommune",
                [["", "auto"], ["__pos", "position des points"], ...colOpts(s)],
                b.mapCommune || "",
              ),
              "Colonne donnant le code INSEE de la commune (ou une référence vers la table des communes). « position des points » : la commune est déduite des coordonnées, sans colonne. Si la colonne ne donne pas de code lisible, la position est utilisée automatiquement.",
            )
          : "") +
        (zoneMode(b)
          ? L(
              "Couleur des zones",
              sel(
                "zoneColor",
                [
                  ["", zoneMode(b) === "epci" ? "une couleur par EPCI" : isGrp(zoneMode(b)) ? "une couleur par regroupement" : FILE_ZONES[zoneMode(b)] ? `une couleur par ${FILE_ZONES[zoneMode(b)].one}` : "couleur majoritaire des points"],
                  ["none", "aucune (contours seuls)"],
                  ["count", "selon le nombre de points"],
                  ["sum", "selon la somme d'une colonne"],
                  ["table", "selon une table Grist (par code)"],
                ],
                b.zoneColor || "",
              ),
              "Dégradé de bleus en 5 classes (quantiles) selon le nombre de points de chaque zone, la somme d'une colonne numérique (effectifs…), ou une valeur lue dans une table Grist reliée par le code de la zone (code INSEE, SIREN de l'EPCI, code IRIS à 9 caractères).",
            )
          : "") +
        (zoneMode(b) && b.zoneColor === "table" ? zoneTableHtml(b, i) : "") +
        (zoneMode(b) && b.zoneColor === "sum"
          ? L(
              "Colonne à additionner",
              sel(
                "zoneSum",
                [
                  ["", "—"],
                  ...byLabel(
                    (m.colsByTable.get(s.tableRef) || []).filter((c) => ["Numeric", "Int"].includes(baseType(c))),
                  ).map((c) => [c.colId, esc(c.label || c.colId)]),
                ],
                b.zoneSum || "",
              ),
              "Colonne numérique additionnée pour chaque zone (par exemple l'effectif des écoles).",
            )
          : "") +
        `</div>`
      : ""
  }
</div>
</div></li>`;
      })
      .join("") || '<li class="msg">Aucune vue retenue</li>';

  const body = $(".pbody"),
    keep = body ? body.scrollTop : 0; // la zone défilante est recréée : on garde sa position
  $("#panel").innerHTML = `
    <div class="phead"><h3>Composer la page <small style="font-weight:400">· ${esc(draft.name || "")}</small></h3>
<div class="actions"><button class="btn" id="cCancel" title="Fermer sans rien modifier">Annuler</button><button class="btn primary" id="cSave" title="Appliquer et enregistrer la configuration dans ${CFG_TABLE}">Enregistrer</button></div></div>
    <div class="pfix">
<div class="pvt">Aperçu de la disposition <span class="hint" title="Aperçu schématique : chaque rectangle est un bloc, à sa largeur et à sa place. Les listes de sélection, affichées dans l'en-tête, n'y figurent pas." style="text-transform:none;font-weight:400">ⓘ</span></div>
<div class="preview ${draft.flux ? "flux" : draft.dense !== false ? "dense" : ""}">${preview || '<span class="pdiag">Aucun bloc</span>'}</div>
    </div>
    <div class="pbody">
    <section class="cs"><h4>Général</h4>
<div class="cpage">
  ${L(
    "Page réglée",
    `<select id="cEdit">${draftOrig === null ? `<option value="" selected>${esc(draft.name)} (nouvelle)</option>` : ""}${(S.stored || [])
      .filter((x) => !x.name.startsWith("_"))
      .map((x) => `<option value="${x.id}" ${x.name === draftOrig ? "selected" : ""}>${esc(x.name)}${x.name === S.cfg.name ? " — affichée" : ""}</option>`)
      .join("")}</select>`,
    "Page dont on règle la composition. Choisir une autre page ne change pas ce qui est affiché dans le widget.",
  )}
  <button class="icon-btn" id="cNew" title="Créer une page vide, sans modifier la page affichée">＋ Nouvelle page</button>
  <button class="icon-btn" id="cDup" title="Créer une nouvelle page à partir de celle-ci (mêmes blocs, mêmes réglages)">Dupliquer</button>
</div>
${
  draftShown()
    ? ""
    : `<div class="cother">${draftOrig === null ? "Nouvelle page" : "Cette page n'est pas celle affichée"} : l'enregistrer ne change pas l'affichage du widget.
  ${C('id="cShowAfter"', draftShowAfter, "L'afficher dans ce widget après l'enregistrement", "Ce widget affichera désormais cette page au lieu de « " + (S.cfg.name || "") + " ».")}
  ${
    draftNav.inWidget && !draftNav.items.some((x) => x.cfg === draftOrig && draftOrig)
      ? C('id="cAddNav"', draftAddNav, "L'ajouter au menu de navigation", "Ajoute un lien vers cette page dans le menu commun (changement de page dans le widget).")
      : draftNav.inWidget
        ? ""
        : `<small>Pour l'afficher sur une autre page Grist : ajoutez-y ce widget, puis choisissez « ${esc(draft.name)} » dans « Page réglée » et cochez « L'afficher dans ce widget ».</small>`
  }</div>`
}
${L("Nom de la page", `<input type="text" id="cName" value="${esc(draft.name || "Page composée")}" style="width:60%">`, "Nom sous lequel la configuration est enregistrée dans la table " + CFG_TABLE + ".")}
${L("Titre affiché", `<input type="text" id="cTitle" value="${esc(draft.title)}" placeholder="(aucun)" style="width:100%">`, "Titre en haut de la page et des impressions. Vide : pas de titre, ce qui laisse plus de place.")}
<div class="cforms"><span class="lt" title="Boutons affichés dans l'en-tête de la page, à gauche du menu. Adresse du formulaire : dans Grist, ouvrir la vue Formulaire, « Publier », puis « Partager » → copier le lien.">Liens vers des formulaires Grist</span>
  ${(draft.forms || [])
    .map(
      (f, i) => `<div class="mn">
    <input type="text" data-fml="${i}" value="${esc(f.label || "")}" placeholder="Libellé (ex. Signaler)" title="Texte du bouton" style="width:150px">
    <input type="text" data-fmt="${i}" value="${esc(f.tip || "")}" placeholder="Commentaire au survol (facultatif)" title="Texte affiché au survol du bouton. Vide : « ouvre le formulaire dans un nouvel onglet »." style="flex:1;min-width:180px">
    <input type="text" data-fmu="${i}" value="${esc(f.url || "")}" placeholder="https://…/forms/…" title="Adresse du formulaire publié (https uniquement)" style="flex:1;min-width:200px">
    ${f.url && !safeBase(f.url) ? '<span style="color:var(--rouge)">adresse https requise</span>' : ""}
    <label title="Coché : le formulaire s'ouvre dans un nouvel onglet. Décoché : dans une fenêtre au-dessus de la page, qui se ferme après l'envoi."><input type="checkbox" data-fmtab="${i}" ${f.tab ? "checked" : ""}> nouvel onglet</label>
    <button class="icon-btn" data-fmrm="${i}" title="Retirer ce lien">✕</button></div>`,
    )
    .join("")}
  <button class="icon-btn" id="cFmAdd" title="Ajoute un bouton vers un formulaire Grist dans l'en-tête de cette page">+ Ajouter un lien vers un formulaire</button>
</div>
    </section>
    <section class="cs"><h4>1. Vues disponibles <small>— cocher les vues Grist à afficher</small></h4>
${L("Page", `<select id="cPage">${pageOpts}</select>`, "Page Grist dont on liste les vues. On peut combiner des vues de plusieurs pages.")}
<div class="pick">${picks}</div>
    </section>
    <section class="cs"><h4>2. Vues retenues <small>— dans l'ordre d'affichage</small> <button class="icon-btn" data-foldall="1" title="Replier les réglages de toutes les vues (largeur, colonne et lignes restent visibles)">Tout replier</button> <button class="icon-btn" data-foldall="0" title="Afficher tous les réglages de toutes les vues">Tout déplier</button></h4>
<ul class="chosen">${chosen}</ul>
    </section>
    <section class="cs"><h4>3. Disposition</h4>
${C('id="cFlux"', draft.flux, "Mode ultracompact", "Les blocs prennent la largeur de leurs données et s'enchaînent comme des mots dans un texte, au lieu d'une grille de 6 colonnes.")}
${
  draft.flux
    ? ""
    : C(
        'id="cDense"',
        draft.dense !== false,
        "Combler automatiquement les espaces libres",
        "Un bloc plus petit peut remonter dans un trou laissé plus haut, quitte à changer l'ordre d'affichage.",
      ) +
      C(
        'id="cMasonry"',
        draft.masonry,
        "Empiler les blocs sans trous",
        "Chaque colonne s'empile indépendamment, comme un mur de briques : plus de place perdue sous les blocs courts. L'option « Hauteur (lignes) » est alors ignorée.",
      )
}
    </section>
    <section class="cs"><h4>4. Affichage</h4>
${L(
  "Apparence (tout le document)",
  `<select id="cTheme"><option value="dsfr" ${draftNav.theme !== "neutre" ? "selected" : ""}>Style État (DSFR) — services de l'État</option><option value="neutre" ${draftNav.theme === "neutre" ? "selected" : ""}>Style neutre — autres structures</option></select>`,
  "Style État : police Marianne et bleu France, réservés aux services de l'État par les conditions d'utilisation du DSFR. Style neutre : police du système et rouge bordeaux, pour toute autre structure. Commun à toutes les pages du document.",
)}
${L(
  "Mode clair / sombre",
  `<select id="cMode">${[
    ["", "Comme le système de chaque utilisateur"],
    ["clair", "Toujours clair"],
    ["sombre", "Toujours sombre"],
  ]
    .map(([v, t]) => `<option value="${v}" ${(draftNav.mode || "") === v ? "selected" : ""}>${t}</option>`)
    .join("")}</select>`,
  "Par défaut, le widget passe en mode sombre quand l'ordinateur de l'utilisateur est réglé ainsi (réglage du système, pas celui de Grist). L'impression reste toujours claire. Commun à toutes les pages du document.",
)}
${L(
  "Actualisation automatique",
  `<select id="cRefresh">${REFRESH_CHOICES.map(([v, t]) => `<option value="${v}" ${refreshOf(draftNav) === v ? "selected" : ""}>${t}</option>`).join("")}</select>`,
  "Le widget vérifie à cet intervalle si le document a été modifié (saisie dans une autre table, par un autre utilisateur…) et, si oui, relit les données et redessine la page. Rien n'est vérifié tant que l'onglet est caché ou qu'une saisie est en cours. « désactivée » : seul le bouton Actualiser relit les données. Commun à toutes les pages du document.",
)}
${C('id="cHideFields"', draft.hideEmptyFields, "Masquer les champs vides dans les fiches", "Les champs sans valeur ne sont pas affichés dans les fiches (sauf en édition, ou si le bloc demande à les afficher).")}
${C('id="cHideBlocks"', draft.hideEmptyBlocks, "Masquer les blocs sans données", "Un bloc sans aucune ligne à afficher (par exemple après filtrage) disparaît de la page.")}
${L("Hauteur des graphiques (px)", `<input type="number" id="cChartH" min="100" step="20" value="${draft.chartHeight || 260}" style="width:80px">`, "Hauteur par défaut des graphiques d'une ligne.")}
${L("Hauteur maximale des tableaux (px)", `<input type="number" id="cMaxH" min="120" step="20" value="${draft.tableMaxHeight}" style="width:80px">`, "Au-delà, le tableau défile à l'intérieur de son bloc (en-têtes fixes).")}
    </section>
    <section class="cs adv"><h4>Message d'accueil <small>— affiché au démarrage, à tous les utilisateurs</small></h4>
${L("Texte (Markdown)", `<textarea id="cWelcome" rows="6" style="width:100%" placeholder="## Bienvenue&#10;Ce tableau de bord présente…&#10;&#10;+++ En savoir plus&#10;Texte replié, affiché au clic sur le titre.&#10;+++">${esc(draftNav.welcome || "")}</textarea>`, "Texte en Markdown (titres #, gras **, listes -, liens [texte](https://…)) affiché dans une fenêtre à l'ouverture du widget. Partie repliable : une ligne « +++ Titre » (ou « +++! Titre » pour qu'elle soit dépliée au départ), le texte, puis une ligne « +++ ». Chaque personne le voit une fois ; il ne revient que si le texte est modifié (Aide → « Message d'accueil » le réaffiche). Vide : pas de message.")}
<button class="icon-btn" id="cWelcomePrev" title="Afficher le message tel que le verront les utilisateurs">Aperçu</button>
    </section>
    <section class="cs adv"><h4>5. Navigation entre pages <small>— menu commun à toutes les configurations</small></h4>
${L("Adresse du document", `<input type="text" id="cMnUrl" value="${esc(draftNav.url)}" placeholder="https://…/o/organisation/document" style="width:100%">`, "Adresse de base du document Grist (https uniquement), utilisée pour construire les liens vers les pages.")}
${L(
  "Page d'accueil",
  `<select id="cMnHome"><option value="">— celle de ce widget —</option>${(S.stored || [])
    .filter((x) => !x.name.startsWith("_"))
    .map((x) => `<option value="${esc(x.name)}" ${x.name === draftNav.home ? "selected" : ""}>${esc(draftNav.items.find((i) => i.cfg === x.name)?.label || x.name)}</option>`)
    .join("")}</select>`,
  "Page affichée à l'ouverture, pour tous les utilisateurs. Avec « Changer de page dans le widget », elle s'impose ; sinon, elle sert quand le widget n'a pas de configuration enregistrée. Aucun choix n'est jamais demandé aux utilisateurs.",
)}
${C('id="cMnInWidget"', draftNav.inWidget, "Changer de page dans le widget", "Instantané, sans recharger Grist : le widget affiche la configuration de la page choisie. Clic du milieu : ouvre la vraie page Grist.")}
${
  draftNav.inWidget
    ? "" // pages changées dans le widget : le mode page unique ne sert pas (voir « Plein écran » du menu ☰)
    : C('id="cMnSingle"', draftNav.singlePage, "Ouvrir les pages en mode page unique", "Ajoute ?style=singlePage aux liens : la page s'ouvre sans les menus de Grist.")
}
<div>${draftNav.items
  .map(
    (x, i) => `<div class="mn">
  <input type="text" data-mnlabel="${i}" value="${esc(x.label || "")}" placeholder="Libellé" title="Texte du lien dans le menu (vide : nom de la page)" style="width:120px">
  <span class="mnico">${icoPreview(x.icon)}</span><input type="text" data-mnicon="${i}" value="${esc(x.icon || "")}" placeholder="Icône (code SVG)" title="Facultatif : collez le code d'une icône SVG (ouvrir le fichier .svg dans un éditeur de texte, tout copier). Elle s'affiche devant le libellé, dans la couleur du lien." style="width:110px">
  <input type="text" data-mntip="${i}" value="${esc(x.tip || "")}" placeholder="Infobulle" title="Texte affiché au survol du lien (facultatif)" style="width:180px">
  <select data-mnview="${i}" title="Page Grist ouverte par ce lien. En mode « Changer de page dans le widget », elle est facultative : le lien affiche simplement la configuration choisie.">${draftNav.inWidget ? `<option value="0" ${!m.pages.some((pg) => pg.viewId === x.viewId) ? "selected" : ""}>— ce widget —</option>` : ""}${m.pages.map((pg) => `<option value="${pg.viewId}" ${pg.viewId === x.viewId ? "selected" : ""}>${esc(pg.name)}</option>`).join("")}</select>
  <select data-mncfg="${i}" title="Configuration affichée sur cette page (sert à surligner la page courante et au changement de page dans le widget)"><option value="">— config —</option>${(
    S.stored || []
  )
    .map((c) => `<option value="${esc(c.name)}" ${c.name === x.cfg ? "selected" : ""}>${esc(c.name)}</option>`)
    .join("")}</select>
  <select data-mnneed="${i}" title="Afficher ce lien seulement aux utilisateurs qui voient au moins une ligne de cette table (règles d'accès). « tous » : le lien est masqué seulement si aucune table de la page n'est lisible."><option value="">visible : tous</option>${[
    ...m.tables.values(),
  ]
    .filter((t) => t.tableId && !t.tableId.startsWith("_grist") && !t.summarySourceTable)
    .map(
      (t) =>
        `<option value="${esc(t.tableId)}" ${t.tableId === x.needTable ? "selected" : ""}>si accès à ${esc(t.tableId)}</option>`,
    )
    .join("")}</select>
  ${m.pages.some((pg) => pg.viewId === x.viewId) || (draftNav.inWidget && x.cfg) ? "" : `<span style="color:var(--rouge)">${draftNav.inWidget ? "choisir une config" : `page introuvable (n°${x.viewId})`}</span>`}
  ${m.pages.some((pg) => pg.viewId === x.viewId) ? `<small style="color:var(--muet)">p/${x.viewId}</small>` : ""}
  <button class="icon-btn" data-mnup="${i}" title="Monter">↑</button><button class="icon-btn" data-mndown="${i}" title="Descendre">↓</button><button class="icon-btn" data-mnrm="${i}" title="Retirer du menu">✕</button>
</div>`,
  )
  .join("")}</div>
<button class="icon-btn" id="cMnAdd" style="margin-top:6px" title="Les pages dont l'utilisateur ne peut lire aucune table sont masquées automatiquement">+ Ajouter une page au menu</button>
    </section>
    <p class="pdiag">UX widget grist ${VERSION} · ${esc(m.diag || "")}</p>
    </div>`;
  if (keep) $(".pbody").scrollTop = keep;
}
$("#panel").addEventListener("change", (ev) => {
  const t = ev.target;
  if (t.id === "cPage") {
    cfgPage = Number(t.value) || 0;
    renderConfig();
    return;
  }
  if (t.dataset.add) {
    const id = Number(t.dataset.add);
    if (t.checked) {
      draft.blocks.push({ id, width: DEFAULT_WIDTH[S.meta.sections.get(id)?.parentKey] || 3 });
      cfgOpen.add(id); // vue ajoutée : ses réglages s'ouvrent
    }
    else draft.blocks = draft.blocks.filter((b) => b.id !== id);
    renderConfig();
    return;
  }
  if (t.dataset.f === "qfField") draft.blocks[Number(t.dataset.i)].qfDefault = ""; // nouveau champ : valeur à revoir
  if (t.dataset.f === "qfField2") draft.blocks[Number(t.dataset.i)].qfDefault2 = "";
  if (t.dataset.f === "qfField") draft.blocks[Number(t.dataset.i)].qfExclude = [];
  if (t.dataset.f === "qfField2") draft.blocks[Number(t.dataset.i)].qfExclude2 = [];
  if (t.dataset.qffree) {
    draft.blocks[Number(t.dataset.qffree)].qfFree = t.checked;
    renderConfig(); // affiche ou masque la liste des colonnes proposées
    return;
  }
  if (t.dataset.qffc) {
    const b = draft.blocks[Number(t.dataset.qffc)];
    const list = (b.qfFreeCols || []).filter((x) => x !== t.value);
    if (t.checked) list.push(t.value);
    b.qfFreeCols = list;
    return;
  }
  if (t.dataset.qfx) {
    const b = draft.blocks[Number(t.dataset.qfx)],
      key = Number(t.dataset.qk) === 2 ? "qfExclude2" : "qfExclude";
    const list = (b[key] || []).filter((x) => !qfSame(x, t.value));
    if (t.checked) list.push(t.value);
    b[key] = list;
    return;
  }
  if (t.dataset.f === "mapZone") draft.blocks[Number(t.dataset.i)].mapCommunes = false; // ancienne option remplacée par « Zonage »
  if (t.dataset.f) {
    const b = draft.blocks[Number(t.dataset.i)];
    b[t.dataset.f] = [
      "height",
      "selCol",
      "selGroup",
      "selGroupOrder",
      "selOrder",
      "mapLabel",
      "mapColor",
      "mapColor2",
      "mapRing",
      "qpvDist",
      "mapCommune",
      "mapZone",
      "mapZone2",
      "zoneHover",
      "legisCol",
      "irisCol",
      "collegeCol",
      "zoneColor",
      "zoneSum",
      "zoneTable",
      "zoneKey",
      "zoneVal",
      "grpTable",
      "grpKey",
      "grpCol",
      "grp2Table",
      "grp2Key",
      "grp2Col",
      "grp3Table",
      "grp3Key",
      "grp3Col",
      "cardW",
      "colWidths",
      "startFold",
      "qfDefault",
      "qfField",
      "qfDefault2",
      "qfField2",
      "pieColorCol",
      "mdSize",
    ].includes(t.dataset.f)
      ? t.value
      : Number(t.value) || 0;
    renderConfig();
    return;
  }
  if (t.dataset.pcm) {
    draft.blocks[Number(t.dataset.pcm)].pieColorMap = t.value;
    renderConfig();
    return;
  }
  if (t.dataset.pcd) {
    const v = t.value.trim();
    draft.blocks[Number(t.dataset.pcd)].pieColorDefault = v ? hexColor(v) || v : "";
    if (v && !hexColor(v)) status(`« ${v} » n'est pas un code couleur hexadécimal (ex. #c8c8c8)`, true);
    renderConfig();
    return;
  }
  if (t.dataset.sync) {
    draft.blocks[Number(t.dataset.sync)].syncId = t.value.trim();
    return;
  }
  if (t.id === "cMnUrl") {
    draftNav.url = t.value.trim();
    return;
  }
  if (t.id === "cMnSingle") {
    draftNav.singlePage = t.checked;
    return;
  }
  if (t.id === "cMnInWidget") {
    draftNav.inWidget = t.checked;
    renderConfig(); // la page Grist devient facultative (option « ce widget »)
    return;
  }
  if (t.dataset.mnicon) {
    const v = t.value.trim();
    draftNav.items[Number(t.dataset.mnicon)].icon = v || undefined;
    const pv = t.previousElementSibling;
    if (pv) pv.innerHTML = icoPreview(v);
    return;
  }
  if (t.dataset.mntip) {
    draftNav.items[Number(t.dataset.mntip)].tip = t.value;
    return;
  }
  if (t.dataset.mnlabel) {
    draftNav.items[Number(t.dataset.mnlabel)].label = t.value;
    return;
  }
  if (t.dataset.mnview) {
    draftNav.items[Number(t.dataset.mnview)].viewId = Number(t.value);
    return;
  }
  if (t.dataset.mncfg) {
    draftNav.items[Number(t.dataset.mncfg)].cfg = t.value;
    return;
  }
  if (t.dataset.mnneed) {
    draftNav.items[Number(t.dataset.mnneed)].needTable = t.value;
    return;
  }
  if (t.dataset.edit) {
    draft.blocks[Number(t.dataset.edit)].editable = t.checked;
    return;
  }
  if (t.dataset.mdnote) {
    const b = draft.blocks[Number(t.dataset.mdnote)];
    b.mdEdit ??= !!b.mdNote; // l'ancienne case réglait les deux : la modification reste telle quelle
    b.mdNote = t.checked;
    return;
  }
  if (t.dataset.mdedit) {
    draft.blocks[Number(t.dataset.mdedit)].mdEdit = t.checked;
    return;
  }
  if (t.dataset.rowcount) {
    draft.blocks[Number(t.dataset.rowcount)].rowCount = t.checked;
    return;
  }
  if (t.dataset.nolab) {
    draft.blocks[Number(t.dataset.nolab)].hideLabels = t.checked;
    return;
  }
  if (t.dataset.addr) {
    draft.blocks[Number(t.dataset.addr)].addable = t.checked;
    return;
  }
  if (t.dataset.stk) {
    draft.blocks[Number(t.dataset.stk)].sticky = t.checked;
    return;
  }
  if (t.dataset.aslist) {
    draft.blocks[Number(t.dataset.aslist)].asList = t.checked;
    renderConfig();
    return;
  }
  if (t.dataset.sempty) {
    draft.blocks[Number(t.dataset.sempty)].showEmpty = t.checked;
    return;
  }
  if (t.dataset.mcom) {
    draft.blocks[Number(t.dataset.mcom)].mapCommunes = t.checked;
    renderConfig();
    return;
  }
  if (t.dataset.mr) {
    const [i, k, f] = t.dataset.mr.split(":");
    draft.blocks[Number(i)].mapRules[Number(k)][f] = t.value;
    return;
  }
  if (t.dataset.mqpv) {
    draft.blocks[Number(t.dataset.mqpv)].mapQpv = t.checked;
    renderConfig();
    return;
  }
  if (t.dataset.zfile) {
    draft.blocks[Number(t.dataset.zfile)][t.dataset.zkey] = t.value.trim();
    return;
  }
  if (t.dataset.qpvurl) {
    draft.blocks[Number(t.dataset.qpvurl)].qpvUrl = t.value.trim();
    return;
  }
  if (t.dataset.mlbl) {
    draft.blocks[Number(t.dataset.mlbl)].mapLabelsOn = t.checked;
    return;
  }
  if (t.dataset.mexpadm) {
    draft.blocks[Number(t.dataset.mexpadm)].mapExportAdmin = t.checked;
    return;
  }
  if (t.dataset.mwheel) {
    draft.blocks[Number(t.dataset.mwheel)].mapWheel = t.checked;
    return;
  }
  if (t.dataset.asel) {
    draft.blocks[Number(t.dataset.asel)].asSelect = t.checked;
    renderConfig();
    return;
  }
  if (t.dataset.nl) {
    draft.blocks[Number(t.dataset.nl)].newLine = t.checked;
    renderConfig();
    return;
  }
  if (t.id === "cDense") {
    draft.dense = t.checked;
    renderConfig();
    return;
  }
  if (t.id === "cMasonry") {
    draft.masonry = t.checked;
    renderConfig();
    return;
  }
  if (t.id === "cFlux") {
    draft.flux = t.checked;
    renderConfig();
    return;
  }
  if (t.id === "cHideFields") draft.hideEmptyFields = t.checked;
  if (t.id === "cHideBlocks") draft.hideEmptyBlocks = t.checked;
  if (t.id === "cChartH") draft.chartHeight = Math.max(100, Number(t.value) || 260);
  if (t.id === "cMaxH") draft.tableMaxHeight = Math.max(120, Number(t.value) || 320);
  if (t.id === "cTitle") draft.title = t.value;
  if (t.id === "cName") draft.name = t.value;
  if (t.id === "cShowAfter") draftShowAfter = t.checked;
  if (t.id === "cTheme") draftNav.theme = t.value;
  if (t.id === "cMode") draftNav.mode = t.value;
  if (t.id === "cRefresh") draftNav.refresh = Number(t.value);
  if (t.id === "cMnHome") draftNav.home = t.value;
  if (t.id === "cWelcome") draftNav.welcome = t.value;
  if (t.dataset.fml) draft.forms[Number(t.dataset.fml)].label = t.value.trim();
  if (t.dataset.fmt) draft.forms[Number(t.dataset.fmt)].tip = t.value.trim();
  if (t.dataset.fmtab) draft.forms[Number(t.dataset.fmtab)].tab = t.checked;
  if (t.dataset.fmu) {
    draft.forms[Number(t.dataset.fmu)].url = t.value.trim();
    renderConfig(); // signale une adresse refusée
  }
  if (t.id === "cAddNav") draftAddNav = t.checked;
  if (t.id === "cEdit") {
    const x = (S.stored || []).find((y) => y.id === Number(t.value));
    if (x && leaveDraft()) editDraft({ ...x.cfg, name: x.name }, x.name, x.name === S.cfg.name);
    renderConfig(); // sinon (refus) : la liste revient sur la page en cours
  }
});
$("#panel").addEventListener("click", async (ev) => {
  const t = ev.target.closest("button");
  if (!t) return;
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= draft.blocks.length) return;
    [draft.blocks[i], draft.blocks[j]] = [draft.blocks[j], draft.blocks[i]];
    renderConfig();
  };
  if (t.id === "cWelcomePrev") {
    draftNav.welcome = $("#cWelcome")?.value ?? draftNav.welcome;
    return showWelcome(true, draftNav.welcome);
  }
  if (t.dataset.fold) {
    const id = Number(t.dataset.fold);
    cfgOpen.has(id) ? cfgOpen.delete(id) : cfgOpen.add(id);
    return renderConfig();
  }
  if (t.dataset.foldall) {
    cfgOpen.clear();
    if (t.dataset.foldall === "0") draft.blocks.forEach((b) => cfgOpen.add(b.id));
    return renderConfig();
  }
  if (t.dataset.up) return move(Number(t.dataset.up), -1);
  if (t.dataset.down) return move(Number(t.dataset.down), 1);
  if (t.dataset.rm) {
    draft.blocks.splice(Number(t.dataset.rm), 1);
    return renderConfig();
  }
  if (t.dataset.mradd) {
    const b = draft.blocks[Number(t.dataset.mradd)];
    b.mapRules = b.mapRules || [];
    if (b.mapRules.length < 3)
      b.mapRules.push({ op: "=", v: "", c: ["#18753C", "#E4794A", "#CE0500"][b.mapRules.length] });
    return renderConfig();
  }
  if (t.dataset.mrrm) {
    const [i, k] = t.dataset.mrrm.split(":").map(Number);
    draft.blocks[i].mapRules.splice(k, 1);
    return renderConfig();
  }
  if (t.id === "cCancel") {
    $("#config").hidden = true;
    return;
  }
  const mv = (i, d) => {
    const j = i + d,
      a = draftNav.items;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    renderConfig();
  };
  if (t.id === "cMnAdd") {
    draftNav.items.push({ label: "", viewId: draftNav.inWidget ? 0 : S.meta.pages[0]?.viewId || 0, cfg: draft.name || "" });
    return renderConfig();
  }
  if (t.dataset.mnup) return mv(Number(t.dataset.mnup), -1);
  if (t.dataset.mndown) return mv(Number(t.dataset.mndown), 1);
  if (t.dataset.mnrm) {
    draftNav.items.splice(Number(t.dataset.mnrm), 1);
    return renderConfig();
  }
  if (t.id === "cFmAdd") {
    (draft.forms ||= []).push({ label: "", url: "" });
    return renderConfig();
  }
  if (t.dataset.fmrm) {
    draft.forms.splice(Number(t.dataset.fmrm), 1);
    return renderConfig();
  }
  if (t.id === "cNew") {
    if (!leaveDraft()) return;
    editDraft({ name: freeName("Nouvelle page"), title: "", blocks: [] }, null);
    draftBase = ""; // une page neuve non enregistrée compte comme modifiée
    return renderConfig();
  }
  if (t.id === "cDup") {
    editDraft({ ...draft, name: freeName(`${draft.name} (copie)`) }, null); // garde les réglages en cours
    draftBase = "";
    return renderConfig();
  }
  if (t.id === "cSave") {
    draft.title = $("#cTitle").value;
    draft.name = $("#cName").value.trim() || "Page composée";
    draft.forms = (draft.forms || []).filter((f) => safeBase(f.url)); // lignes vides ou adresses refusées
    if (draft.name.startsWith("_")) return alert("Le nom d'une page ne peut pas commencer par « _ » (réservé).");
    if (
      draft.name !== draftOrig &&
      (S.stored || []).some((x) => x.name === draft.name) &&
      !confirm(`Une page « ${draft.name} » existe déjà : la remplacer par celle-ci ?`)
    )
      return;
    draftNav.url = $("#cMnUrl")?.value.trim() ?? draftNav.url;
    if (draftNav.inWidget && !draftShown() && draftAddNav && !draftNav.items.some((x) => x.cfg === draft.name))
      draftNav.items.push({ label: "", viewId: 0, cfg: draft.name }); // nouvelle page ajoutée au menu
    if (!draftShown() && !draftShowAfter) {
      // autre page que celle affichée : enregistrée dans la table seulement, l'affichage ne change pas
      $("#config").hidden = true;
      rememberColRefs(draft);
      try {
        await saveConfigToTable(draft);
        status(`Page « ${draft.name} » enregistrée (la page affichée n'a pas changé).`);
        setTimeout(() => status(""), 5000);
      } catch (e) {
        status(`Page « ${draft.name} » non enregistrée dans ${CFG_TABLE} : ${e.message || e}`, true);
      }
      if (JSON.stringify(draftNav) !== JSON.stringify(S.nav)) {
        S.nav = draftNav;
        S.navAccess = {};
        liveStart();
        try {
          await saveConfigToTable({ name: NAV_NAME, nav: draftNav });
        } catch {
          /* droits insuffisants */
        }
      }
      renderNav();
      return;
    }
    draft.dataTable = S.ext.tableId;
    S.choosing = false;
    status("");
    S.cfg = draft;
    S.qf = {}; // filtres rapides : on repart des valeurs à l'ouverture qui viennent d'être réglées
    $("#config").hidden = true;
    try {
      await grist.setOption("config", draft);
    } catch {
      /* options du widget : facultatif */
    }
    rememberColRefs(draft); // pour suivre les colonnes renommées
    try {
      await saveConfigToTable(draft);
    } catch (e) {
      status(`Configuration appliquée mais non enregistrée dans ${CFG_TABLE} : ${e.message || e}`, true);
    }
    if (JSON.stringify(draftNav) !== JSON.stringify(S.nav)) {
      S.nav = draftNav;
      S.navAccess = {};
      liveStart();
      try {
        await saveConfigToTable({ name: NAV_NAME, nav: draftNav });
      } catch {
        /* droits insuffisants */
      }
    }
    scheduleRender();
  }
});
