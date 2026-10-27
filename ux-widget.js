/* UX widget grist — script (version 0.9.3.13). Développeur : Ligures. Licence MIT (voir LICENSE).
   Chargé par index.html, à la fin du corps de la page. Voir le sommaire ci-dessous. */
"use strict";
/* ════════════════════════════════════════════════════════════════════════════
   SOMMAIRE DU SCRIPT
   ────────────────────────────────────────────────────────────────────────────
   État et constantes ........ objet S (tout l'état du widget), valeurs par défaut
   Utilitaires ............... esc, parseJSON, toRows, fetchRows (cache des tables)
   Métadonnées ............... loadMeta, getInfo : lecture des vues Grist
   Mise en forme ............. textOf, htmlOf, styles et règles conditionnelles
   Filtres, tri, liaisons .... rowsFor, selectedRowId, linkFor
   Rendu des blocs ........... blockShell, renderTable, renderSingle, renderCards,
                         renderChart (Chart.js), renderAdvChart (Plotly),
                         renderMap (Leaflet : points, QPV, zonages)
   Édition ................... startEdit, saveValue (droits Grist respectés)
   Listes de sélection ....... renderSelectors, synchronisation entre pages
   Rendu principal ........... render() — point central, appelé via scheduleRender()
   Interactions .............. clics, sélection de ligne, plein écran, Disposition
   Export .................... impression / PDF
   Configuration ............. panneau ⚙ (renderConfig), enregistrement
   Démarrage ................. init(), applyOptions(), abonnements grist.on…

   CYCLE DE VIE
     grist.ready → onOptions → applyOptions → init :
 loadMeta (tables _grist_*) → configurations de W_Composition → menu
 → droits (W_Admin) → render().
     Tout changement (sélection, données, options) passe par scheduleRender(),
     qui regroupe les demandes ; render() abandonne s'il est doublé par un rendu
     plus récent (S.renderSeq). Les dessins lourds (cartes, graphiques, grands
     tableaux) sont différés dans des « jobs » exécutés après l'affichage.

   STOCKAGE DANS LE DOCUMENT GRIST
     W_Composition (Nom, Config JSON) : une ligne par configuration de page,
 + ligne « _Navigation » (menu commun) et « _Securite » (témoin de protection).
     W_Admin : table réservée aux propriétaires par une règle d'accès ; qui en voit
 une ligne peut configurer (bouton ⚙, mode Disposition).

   CONFIGURATION D'UNE PAGE (S.cfg)
     { name, title, blocks: [...], flux, dense, masonry, hideEmptyFields,
 hideEmptyBlocks, tableMaxHeight, chartHeight, dataTable }
     Bloc (blocks[i]) : id = identifiant de la vue Grist (_grist_Views_section)
 Disposition : width (1-6), start, rows, fw (flux), newLine, height, sticky, startFold
 Tableaux/fiches : colWidths, rowCount, asList, cardW, editable, addable, showEmpty, hideLabels
 Liste de sélection : asSelect, selCol, selOrder, selGroup, selGroupOrder, syncId
 Couleurs des graphiques : pieColorCol, pieColorMap, pieColorDefault
 Carte : mapLabel, mapColor, mapRing + mapRules (contour), mapQpv, qpvDist,
         qpvUrl, mapZone (communes|epci|iris|legis|college), mapZone2 (contours croisés), zoneHover, legisUrl, collegeUrl, legisCol, collegeCol, mapCommune, zoneColor,
         zoneSum, zoneTable/zoneKey/zoneVal, mapLabelsOn

   RÈGLES À RESPECTER
     • Toute valeur issue des données ou de la configuration insérée dans du HTML
 passe par esc() (ou safeHtml() pour le HTML voulu des étiquettes de carte).
     • Les bibliothèques externes sont figées en version et vérifiées (SRI, LIBS).
     • Les droits restent ceux de Grist : le widget ne contourne aucune règle d'accès.
   ════════════════════════════════════════════════════════════════════════════ */

/* ---------- État et constantes ---------- */
// DEFAULTS — options d'une page neuve. KIND — libellé des types de vues Grist (parentKey).
// SUPPORTED — types affichables. DEFAULT_WIDTH — largeur initiale (en sixièmes) d'un bloc ajouté.
const VERSION = "0.9.3.13"; // voir CHANGELOG.md
const DEFAULTS = {
  name: "Page composée",
  title: "",
  blocks: [],
  hideEmptyFields: true,
  hideEmptyBlocks: false,
  tableMaxHeight: 320,
  chartHeight: 260,
};
const KIND = {
  record: "Tableau",
  single: "Fiche",
  detail: "Fiches",
  chart: "Graphique",
  custom: "Widget personnalisé",
  form: "Formulaire",
};
const SUPPORTED = ["record", "single", "detail", "chart", "custom"];
// Icônes des types de vue (configuration) : tracés SVG 24×24, couleur du texte
const KIND_ICONS = {
  table: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M3 14.5h18M9.5 4v16"/>',
  card: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  cards: '<rect x="3" y="4" width="8" height="7" rx="1"/><rect x="13" y="4" width="8" height="7" rx="1"/><rect x="3" y="13" width="8" height="7" rx="1"/><rect x="13" y="13" width="8" height="7" rx="1"/>',
  bar: '<path d="M4 20h16"/><rect x="6" y="11" width="3" height="9"/><rect x="11" y="6" width="3" height="14"/><rect x="16" y="14" width="3" height="6"/>',
  pie: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M14.5 2.5v7h7a7 7 0 0 0-7-7z"/>',
  line: '<path d="M4 20h16M4 16l5-6 4 3 6-8"/>',
  scatter: '<path d="M4 20h16"/><circle cx="7" cy="15" r="1.3"/><circle cx="11" cy="10" r="1.3"/><circle cx="15" cy="13" r="1.3"/><circle cx="18" cy="6" r="1.3"/>',
  map: '<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  select: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M14 11l2 2 2-2"/>',
  form: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 8h8M8 13h3M13 13h3M8 17h8"/>',
  text: '<path d="M4 5h16M4 10h16M4 15h10M4 20h7"/>',
  widget: '<path d="M10 4h4v3a2 2 0 1 0 4 0V4h2v6h-3a2 2 0 1 0 0 4h3v6h-6v-3a2 2 0 1 0-4 0v3H4v-6h3a2 2 0 1 0 0-4H4V4z"/>',
};
// viewKind — Type d'une vue : [clé d'icône, libellé] (tableau, fiche, graphique en barres / secteurs…, carte, liste de sélection…).
function viewKind(s, b) {
  let k = "widget",
    t = KIND[s.parentKey] || s.parentKey;
  if (b && isSelector(b)) [k, t] = ["select", "Liste de sélection"];
  else if (s.parentKey === "record") k = "table";
  else if (s.parentKey === "single") k = "card";
  else if (s.parentKey === "detail") k = "cards";
  else if (s.parentKey === "form") k = "form";
  else if (s.parentKey === "chart") {
    const ct = s.chartType || "bar";
    k = ["pie", "donut"].includes(ct) ? "pie" : ["line", "area", "kaplan_meier"].includes(ct) ? "line" : ct === "scatter" ? "scatter" : "bar";
    t = `Graphique (${{ pie: "secteurs", donut: "anneau", line: "courbe", area: "aires", scatter: "nuage de points", kaplan_meier: "courbe" }[ct] || "barres"})`;
  } else if (s.parentKey === "custom") {
    if (isMapSection(s)) [k, t] = ["map", "Carte"];
    else if (isMarkdownSection(s)) [k, t] = ["text", "Texte (Markdown)"];
    else {
      const data = advChartSpec(s)?.data;
      if (data) [k, t] = [data.some((x) => x?.type === "pie") ? "pie" : "bar", "Graphique avancé"];
    }
  }
  return [k, t];
}
// kindIcon — Icône SVG du type d'une vue.
function kindIcon(s, b) {
  const [k, t] = viewKind(s, b);
  return `<svg class="kico" viewBox="0 0 24 24" aria-hidden="true"><title>${esc(t)}</title>${KIND_ICONS[k]}</svg>`;
}
// kindTitle — Icône, type puis titre d'une vue (configuration).
function kindTitle(s, b) {
  return `${kindIcon(s, b)}<b class="ctype">${esc(viewKind(s, b)[1])}</b> <span class="ctitle">${esc(getInfo(s.id)?.title || `#${s.id}`)}</span>`;
}
const DEFAULT_WIDTH = { record: 6, single: 2, detail: 6, chart: 3, custom: 3 };
// BRAND — couleur principale des graphiques et cartes : bleu France (DSFR) ou rouge bordeaux du style neutre (voir applyTheme)
const BRAND = { c: "#000091" };
const PALETTE = [
  "#000091",
  "#009081",
  "#E18B76",
  "#68A532",
  "#A558A0",
  "#C8AA39",
  "#465F9D",
  "#E4794A",
  "#009099",
  "#D1B781",
  "#6A6AF4",
  "#CE614A",
];

// S — tout l'état du widget (un seul objet, pour savoir où chercher).
//   cfg : configuration de la page   meta : métadonnées Grist (loadMeta)   info : cache de getInfo
//   cache/byId : données des tables  sel : ligne sélectionnée par vue       search : texte « Filtrer… »
//   collapsed : blocs repliés        usort/ufilt : tri et filtres choisis dans les en-têtes
//   charts/maps : objets à détruire avant chaque rendu   mapViews : centre/zoom conservés par carte
const S = {
  cfg: { ...DEFAULTS },
  qf: {}, // filtre rapide : valeur choisie par bloc ("" = tous)
  meta: null,
  info: new Map(),
  cache: {},
  byId: {}, // données des tables
  sel: {},
  search: {},
  collapsed: {},
  usort: {},
  ufilt: {},
  fieldOpts: new Map(),
  ext: { tableId: null, rowId: null }, // sélection transmise au widget par Grist
  extSel: new Map(), // sélection déduite pour les widgets natifs (listes déroulantes…)
  charts: [],
  maps: [],
  mapViews: {},
  geoCache: {},
  ready: false,
  optsApplied: false,
  renderTimer: null,
};

/* ---------- Utilitaires ---------- */
const $ = (s) => document.querySelector(s);
// esc — Échappe un texte pour l'insérer dans du HTML. À utiliser pour TOUTE valeur venant des données ou de la configuration.
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
// parseJSON — Lit du JSON sans planter : renvoie `fallback` si le texte est vide ou invalide (les options Grist sont du JSON en texte).
const parseJSON = (s, def = {}) => {
  if (!s) return def;
  if (typeof s === "object") return s;
  try {
    return JSON.parse(s);
  } catch {
    return def;
  }
};
// isList — Valeur de liste Grist (RefList, ChoiceList) : tableau commençant par le marqueur "L".
const isList = (v) => Array.isArray(v) && v[0] === "L";
// isErr — Erreur de formule Grist : tableau commençant par le marqueur "E".
const isErr = (v) => Array.isArray(v) && v[0] === "E";
// isEmpty — Cellule vide au sens de Grist (null, chaîne vide, liste vide).
const isEmpty = (v) => v === null || v === undefined || v === "" || (isList(v) && v.length === 1);
// baseType — Type de colonne sans sa cible : "Ref:Ecoles" → "Ref".
const baseType = (col) => String(col?.type || "Any").split(":")[0];
// refTarget — Table cible d'une colonne Ref/RefList : "Ref:Ecoles" → "Ecoles".
const refTarget = (col) => String(col?.type || "").split(":")[1];
// groupBy — Regroupe un tableau d'objets par la valeur d'une clé → Map(clé → liste).
const groupBy = (arr, key) => {
  const m = new Map();
  for (const x of arr) {
    const k = x[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(x);
  }
  return m;
};
// status — Affiche un message dans la zone d'état sous l'en-tête (err = en rouge).
// Bulle flottante : un message en cours (« … ») reste affiché jusqu'à la fin ; une information s'efface
// seule après 4 s, une erreur après 12 s (ou au clic).
let statusTimer = null,
  statusErrUntil = 0;
function status(msg, err = false, force = false) {
  const el = $("#status");
  // une erreur (modification refusée…) reste lisible au moins 4 s : le réaffichage de la page, qui efface la
  // ligne d'état ou affiche « Calcul en cours… », ne la remplace pas avant (seule une autre erreur le peut)
  if (!force && !err && Date.now() < statusErrUntil) return;
  if (err) statusErrUntil = Date.now() + 4000;
  clearTimeout(statusTimer);
  el.textContent = msg || "";
  el.className = err ? "err" : "";
  el.title = msg && err ? `${msg} (cliquer pour fermer)` : msg || "";
  if (!msg || (!err && /…$/.test(msg))) return;
  statusTimer = setTimeout(
    () => {
      el.classList.add("fade");
      statusTimer = setTimeout(() => (el.textContent = ""), 400);
    },
    err ? 8000 : 4000,
  );
}
$("#status").addEventListener("click", () => {
  statusErrUntil = 0;
  status("", false, true);
});

// toRows — Convertit le format colonnes de fetchTable ({col: [valeurs]}) en tableau de lignes [{id, col…}].
function toRows(tbl) {
  const ids = tbl.id || [],
    cols = Object.keys(tbl);
  return ids.map((id, i) => {
    const r = {};
    for (const c of cols) r[c] = tbl[c][i];
    return r;
  });
}
// fetchRows — Charge une table (une seule fois, mise en cache) et indexe ses lignes par id dans S.byId.
function fetchRows(tableId) {
  if (!S.cache[tableId]) {
    S.cache[tableId] = grist.docApi
      .fetchTable(tableId)
      .then((t) => {
        const rows = toRows(t);
        S.byId[tableId] = new Map(rows.map((r) => [r.id, r]));
        noteRefDisplays(tableId, rows);
        return rows;
      })
      .catch((e) => {
        // table interdite par les règles d'accès : le refus est mémorisé jusqu'au prochain « Actualiser »
        // (sinon elle serait redemandée au serveur à chaque sélection, ce qui peut prendre plusieurs secondes)
        if (!/access|acc[eè]s|permission|denied|blocked/i.test(String(e?.message || e))) delete S.cache[tableId];
        throw e;
      });
  }
  return S.cache[tableId];
}

/* Texte des références vers des lignes que l'utilisateur ne peut pas lire (règles d'accès par ligne) :
   Grist calcule pour chaque colonne Référence une colonne cachée « gristHelper_Display » dans la table qui
   référence, lisible même quand la ligne visée ne l'est pas. On note ces textes par colonne Référence et par id
   (0.8.10.5 : par colonne, et non par table visée — deux colonnes vers la même table peuvent afficher des champs
   différents, par exemple l'UAI et le nom). */
S.refDisp = {};
function noteRefDisplays(tableId, rows) {
  const m = S.meta;
  if (!m) return;
  const tref = [...m.tables.values()].find((t) => t.tableId === tableId)?.id;
  for (const c of m.colsByTable.get(tref) || []) {
    const bt = baseType(c);
    if ((bt !== "Ref" && bt !== "RefList") || !c.displayCol) continue;
    const disp = m.cols.get(c.displayCol)?.colId;
    if (!disp) continue;
    const map = (S.refDisp[c.id] ||= new Map());
    for (const r of rows) {
      const v = r[c.colId],
        d = r[disp];
      if (bt === "Ref" && v && d != null && !isErr(d)) map.set(v, String(d));
      else if (bt === "RefList" && isList(v) && isList(d)) v.slice(1).forEach((id, i) => d[i + 1] != null && map.set(id, String(d[i + 1])));
    }
  }
}

/* ---------- Métadonnées de mise en page ---------- */
/* Diagnostic de lenteur : chaque lecture de table (fetchTable) est chronométrée ; les lectures de plus de
   200 ms sont signalées dans la console du navigateur (F12), avec le total au premier affichage. */
S.fetchLog = [];
{
  const orig = grist.docApi.fetchTable.bind(grist.docApi);
  grist.docApi.fetchTable = async (tableId, ...rest) => {
    const t0 = performance.now();
    try {
      return await orig(tableId, ...rest);
    } finally {
      const ms = Math.round(performance.now() - t0);
      S.fetchLog.push([tableId, ms]);
      if (ms > 200) console.info(`[UX widget] lecture de ${tableId} : ${ms} ms`);
    }
  };
}
async function loadMeta() {
  const names = [
    "_grist_Tables",
    "_grist_Tables_column",
    "_grist_Views",
    "_grist_Pages",
    "_grist_Views_section",
    "_grist_Views_section_field",
    "_grist_Filters",
  ];
  const [tables, cols, views, pages, sections, fields, filters] = await Promise.all(
    names.map((n) => grist.docApi.fetchTable(n).then(toRows)),
  );
  if (!sections.length || !cols.length) {
    throw new Error(
      "Les métadonnées des vues sont vides. Vérifier que le widget a l'accès « complet au document ».",
    );
  }
  const m = {};
  m.tables = new Map(tables.map((t) => [t.id, t]));
  m.cols = new Map(cols.map((c) => [c.id, c]));
  m.colsByTable = groupBy(cols, "parentId");
  m.views = new Map(views.map((v) => [v.id, v]));
  m.sections = new Map(sections.map((s) => [s.id, s]));
  m.sectionsByView = groupBy(
    sections.filter((s) => s.parentId),
    "parentId",
  );
  // Nom de page : nom de la vue, sinon titres de ses widgets, sinon numéro
  const pageName = (vid) =>
    m.views.get(vid)?.name ||
    (m.sectionsByView.get(vid) || [])
      .map((s) => s.title)
      .filter(Boolean)
      .slice(0, 2)
      .join(" / ") ||
    `Page n°${vid}`;
  const viewOf = (p) => Number(p.view ?? p.viewRef ?? p.View ?? 0);
  m.pages = pages
    .slice()
    .sort((a, b) => a.pagePos - b.pagePos)
    .map((p) => ({ viewId: viewOf(p), indent: p.indentation || 0 }))
    .filter((p) => p.viewId)
    .map((p) => ({ ...p, name: pageName(p.viewId) }));
  if (!m.pages.length) {
    // repli : vues possédant des widgets
    m.pages = [...m.sectionsByView.keys()]
      .sort((a, b) => a - b)
      .map((vid) => ({ viewId: vid, indent: 0, name: pageName(vid) }));
  }
  m.pageOfView = new Map(m.pages.map((p) => [p.viewId, p.name]));
  // Tables lisibles par l'utilisateur : une table entièrement interdite n'apparaît pas dans listTables
  // (et Grist vide son tableId dans les métadonnées)
  try {
    m.visibleTables = new Set(await grist.docApi.listTables());
  } catch {
    m.visibleTables = null;
  }
  m.loadedAt = new Date().toLocaleTimeString("fr-FR"); // heure de lecture de la structure (diagnostic)
  m.diag =
    `Structure lue à ${m.loadedAt} · ${cols.length} colonnes · ` +
    `Diagnostic — _grist_Pages : ${pages.length} lignes, colonnes [${Object.keys(pages[0] || {}).join(", ")}] · ` +
    `_grist_Views : ${views.length} · widgets : ${sections.length} · pages reliées à des widgets : ` +
    `${m.pages.filter((p) => m.sectionsByView.has(p.viewId)).length}`;
  m.fieldsBySection = groupBy(
    fields.slice().sort((a, b) => a.parentPos - b.parentPos),
    "parentId",
  );
  m.filtersBySection = groupBy(filters, "viewSectionRef");
  S.meta = m;
  S.info = new Map();
}

function groupCols(tableRef) {
  // colonnes de regroupement d'une table de synthèse : Map(colRef source -> colId)
  const t = S.meta.tables.get(tableRef);
  if (!t?.summarySourceTable) return null;
  return new Map(
    (S.meta.colsByTable.get(tableRef) || [])
      .filter((c) => c.summarySourceCol)
      .map((c) => [c.summarySourceCol, c.colId]),
  );
}
// tableLabel — Libellé lisible d'une table (nom de la page qui l'affiche, sinon son identifiant).
function tableLabel(tableRef) {
  const t = S.meta.tables.get(tableRef);
  if (!t) return "?";
  if (t.summarySourceTable) {
    const src = S.meta.tables.get(t.summarySourceTable)?.tableId || "?";
    return `${src} [${[...(groupCols(tableRef)?.values() || [])].join(", ") || "total"}]`;
  }
  return t.tableId;
}

// getInfo — Description complète d'une vue Grist (section) : table, type, champs affichés, tri, filtres, options. Mise en cache.
function getInfo(secId) {
  if (S.info.has(secId)) return S.info.get(secId);
  const m = S.meta,
    sec = m.sections.get(secId);
  if (!sec) return null;
  const table = m.tables.get(sec.tableRef);
  const fields = (m.fieldsBySection.get(secId) || [])
    .map((f) => {
      const col = m.cols.get(f.colRef);
      if (!col || col.colId.startsWith("gristHelper_")) return null;
      const opts = { ...parseJSON(col.widgetOptions), ...parseJSON(f.widgetOptions) };
      S.fieldOpts.set(f.id, opts);
      return { col, field: f, colId: col.colId, label: col.label || col.colId, opts };
    })
    .filter(Boolean);
  const filters = (m.filtersBySection.get(secId) || [])
    .map((f) => {
      const col = m.cols.get(f.colRef);
      const spec = parseJSON(f.filter, null);
      return col && spec && Object.keys(spec).length ? { col, spec } : null;
    })
    .filter(Boolean);
  const sort = parseJSON(sec.sortColRefs, [])
    .map((x) => {
      const n = parseInt(String(x), 10);
      const col = m.cols.get(Math.abs(n));
      return col ? { col, desc: n < 0, opts: parseJSON(col.widgetOptions) } : null;
    })
    .filter(Boolean);
  const info = {
    sec,
    secId,
    table,
    tableId: table?.tableId,
    kind: sec.parentKey,
    fields,
    filters,
    sort,
    opts: parseJSON(sec.options),
    title: sec.title || tableLabel(sec.tableRef),
  };
  S.info.set(secId, info);
  return info;
}

/* ---------- Mise en forme des valeurs ---------- */
function fmtNum(v, o, t) {
  const min = Math.min(20, Math.max(0, o.decimals ?? 0));
  const max = Math.min(20, Math.max(min, o.maxDecimals ?? (t === "Int" ? 0 : 10)));
  const f = { minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: !!o.numMode };
  if (o.numMode === "percent") f.style = "percent";
  if (o.numMode === "currency") {
    f.style = "currency";
    f.currency = o.currency || "EUR";
  }
  try {
    return new Intl.NumberFormat("fr-FR", f).format(v);
  } catch {
    return String(v);
  }
}
// refText — Texte affiché pour une référence : valeur de la colonne d'affichage (visibleCol) de la ligne ciblée.
function refText(col, id, depth) {
  if (!id) return "";
  const row = S.byId[refTarget(col)]?.get(id);
  if (!row) return S.refDisp[col.id]?.get(id) ?? String(id); // ligne non lisible : texte calculé par Grist
  const vis = col.visibleCol ? S.meta.cols.get(col.visibleCol) : null;
  if (!vis) return `${refTarget(col)}[${id}]`;
  return depth > 2
    ? String(row[vis.colId] ?? "")
    : textOf(vis, parseJSON(vis.widgetOptions), row[vis.colId], depth + 1);
}
// textOf — Texte d'une cellule tel que Grist l'afficherait (références, listes, dates, nombres, choix…).
function textOf(col, opts, v, depth = 0) {
  if (isErr(v)) return "#" + (v[1] || "ERREUR");
  if (isEmpty(v)) return "";
  const t = baseType(col);
  switch (t) {
    case "Ref":
      return refText(col, v, depth);
    case "RefList":
      return isList(v)
        ? v
            .slice(1)
            .map((id) => refText(col, id, depth))
            .join(", ")
        : "";
    case "ChoiceList":
      return isList(v) ? v.slice(1).join(", ") : String(v);
    case "Attachments": {
      const n = isList(v) ? v.length - 1 : 0;
      return n ? `${n} pièce${n > 1 ? "s" : ""} jointe${n > 1 ? "s" : ""}` : "";
    }
    case "Bool":
      return v ? "Oui" : "Non";
    case "Date":
      return typeof v === "number"
        ? new Date(v * 1000).toLocaleDateString("fr-FR", { timeZone: "UTC" })
        : String(v);
    case "DateTime":
      return typeof v === "number"
        ? new Date(v * 1000).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
        : String(v);
    case "Numeric":
    case "Int":
      return typeof v === "number" ? fmtNum(v, opts, t) : String(v);
    default:
      if (isList(v)) return v.slice(1).join(", ");
      if (typeof v === "object") return JSON.stringify(v);
      return String(v);
  }
}
// chip — Pastille colorée d'un choix (Choice/ChoiceList), avec les couleurs définies dans Grist.
function chip(val, opts) {
  const o = opts.choiceOptions?.[val] || {};
  const st = (o.fillColor ? `background:${o.fillColor};` : "") + (o.textColor ? `color:${o.textColor};` : "");
  return `<span class="chip" style="${esc(st)}">${esc(val)}</span>`;
}
// htmlOf — HTML d'une cellule pour un champ : texte formaté + pastilles + lien vers la fiche des références.
function htmlOf(f, v) {
  const t = baseType(f.col);
  if (isErr(v)) return `<span style="color:var(--rouge)">${esc(textOf(f.col, f.opts, v))}</span>`;
  if (t === "Bool") return v ? '<span class="ok">✔</span>' : '<span class="ko">—</span>';
  if (t === "Choice" && !isEmpty(v)) return chip(v, f.opts);
  if (t === "ChoiceList" && isList(v))
    return v
      .slice(1)
      .map((x) => chip(x, f.opts))
      .join("");
  if (t === "Ref" && v) return `${rlink(refTarget(f.col), v)}${esc(textOf(f.col, f.opts, v))}`;
  if (t === "RefList" && isList(v))
    return v
      .slice(1)
      .map((id) => `<span class="chip">${rlink(refTarget(f.col), id)}${esc(refText(f.col, id, 0))}</span>`)
      .join("");
  return esc(textOf(f.col, f.opts, v));
}
const LINK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.36 15.53 17 14.12l1.41-1.41a5 5 0 1 0-7.07-7.07L9.88 7.05 8.47 5.64l1.41-1.42a7 7 0 0 1 9.9 9.9l-1.42 1.41Zm-2.83 2.83-1.42 1.41a7 7 0 0 1-9.9-9.9l1.42-1.41L7.05 9.88 5.64 11.3a5 5 0 1 0 7.07 7.07l1.41-1.41 1.41 1.41Zm-.71-10.6 1.42 1.42-7.07 7.07-1.42-1.42 7.07-7.07Z"/></svg>';
// rlink — Petit lien qui ouvre la fiche de l'enregistrement référencé (fenêtre superposée).
const rlink = (table, id) =>
  table && id
    ? `<a class="rlink" data-rt="${esc(table)}" data-rr="${id}" title="Ouvrir la fiche" tabindex="0">${LINK_SVG}</a>`
    : "";

/* ---------- Fiche d'un enregistrement référencé (fenêtre superposée) ---------- */
const rcHist = [];
// openRecordCard — Ouvre la fiche (vue « carte d'enregistrement » de Grist) d'une ligne référencée, par-dessus la page.
async function openRecordCard(tableId, rowId, push = true) {
  const tbl = [...S.meta.tables.values()].find((t) => t.tableId === tableId);
  if (!tbl) return;
  await fetchRows(tableId);
  const row = S.byId[tableId]?.get(rowId);
  // fiche « Record card » définie dans Grist pour la table, sinon toutes ses colonnes
  let info = tbl.recordCardViewSectionRef ? getInfo(tbl.recordCardViewSectionRef) : null;
  if (!info || !info.fields.length) {
    const cols = (S.meta.colsByTable.get(tbl.id) || []).filter(
      (c) => !c.colId.startsWith("gristHelper_") && c.colId !== "manualSort",
    );
    info = {
      secId: -tbl.id,
      tableId,
      sec: {},
      opts: {},
      fields: cols.map((col) => ({
        col,
        colId: col.colId,
        label: col.label || col.colId,
        opts: parseJSON(col.widgetOptions),
      })),
    };
  }
  await ensureRefTables(info.fields.map((f) => f.col));
  if (push) rcHist.push([tableId, rowId]);
  const vis =
    (S.meta.colsByTable.get(tbl.id) || []).find((c) => /^(nom|name|libell|titre)/i.test(c.colId)) ||
    info.fields[0]?.col;
  const title = row && vis ? textOf(vis, parseJSON(vis.widgetOptions), row[vis.colId]) : `n°${rowId}`;
  $("#rc").innerHTML =
    `<div class="rch">${rcHist.length > 1 ? '<button class="icon-btn" data-rcback title="Fiche précédente">←</button>' : ""}
    <h3>${esc(title)} <small>· ${esc(tableId)}</small></h3><button class="icon-btn" data-rcclose title="Fermer (Échap)">✕</button></div>
    <div class="rcb">${row ? ficheHTML(info, row) : '<div class="msg">Enregistrement introuvable (supprimé ou non autorisé)</div>'}</div>`;
  $("#rc").classList.add("on");
  $("#rcBack").classList.add("on");
}
// closeRecordCard — Ferme la fiche superposée.
function closeRecordCard() {
  rcHist.length = 0;
  $("#rc").classList.remove("on");
  $("#rcBack").classList.remove("on");
}
// isNumCol — Colonne numérique (alignée à droite, triée comme un nombre).
const isNumCol = (col) => ["Numeric", "Int"].includes(baseType(col));

/* ---------- Mise en forme Grist (styles de cellule, règles conditionnelles) ---------- */
function refList(v) {
  if (isList(v)) return v.slice(1);
  if (Array.isArray(v)) return v;
  const a = parseJSON(v, []);
  return Array.isArray(a) ? (a[0] === "L" ? a.slice(1) : a) : [];
}
const STYLE_KEYS = ["textColor", "fillColor", "fontBold", "fontItalic", "fontUnderline", "fontStrikethrough"];
// applyRules — Applique les règles de mise en forme conditionnelle de Grist (colonne ou ligne) à une ligne donnée.
function applyRules(base, rules, rulesOptions, row) {
  const st = { ...base };
  // la règle la plus haute dans la liste l'emporte : on applique de bas en haut
  for (let i = rules.length - 1; i >= 0; i--) {
    const rc = S.meta.cols.get(rules[i]);
    if (rc && row[rc.colId] === true)
      for (const k of STYLE_KEYS)
        if (rulesOptions?.[i]?.[k] !== undefined && rulesOptions[i][k] !== null) st[k] = rulesOptions[i][k];
  }
  return st;
}
// styleCss — Convertit les options de style Grist (couleurs, gras, italique…) en CSS en ligne.
function styleCss(st, bgOnly = false) {
  let c = "";
  if (st.fillColor) c += `background:${st.fillColor};`;
  if (bgOnly) return c;
  if (st.textColor) c += `color:${st.textColor};`;
  if (st.fontBold) c += "font-weight:700;";
  if (st.fontItalic) c += "font-style:italic;";
  const deco = [st.fontUnderline && "underline", st.fontStrikethrough && "line-through"]
    .filter(Boolean)
    .join(" ");
  if (deco) c += `text-decoration:${deco};`;
  return c;
}
// rowStyle — Style de toute une ligne (règles conditionnelles de ligne de la vue).
function rowStyle(info, row) {
  const base = {}; // style de ligne par défaut, s'il est défini sur le widget
  for (const k of STYLE_KEYS)
    if (info.opts[k] !== undefined && info.opts[k] !== null && info.opts[k] !== "") base[k] = info.opts[k];
  const rules = refList(info.sec.rules);
  return rules.length ? applyRules(base, rules, info.opts.rulesOptions || [], row) : base;
}
// cellStyle — Style d'une cellule : style du champ, de la colonne, puis règles conditionnelles.
function cellStyle(f, row, rowSt = {}) {
  const o = f.opts;
  const base = { ...rowSt };
  for (const k of STYLE_KEYS) if (o[k] !== undefined && o[k] !== null && o[k] !== "") base[k] = o[k];
  const fRules = refList(f.field?.rules);
  const rules = fRules.length ? fRules : refList(f.col.rules);
  let css = styleCss(applyRules(base, rules, o.rulesOptions || [], row));
  if (o.alignment) css += `text-align:${o.alignment};`;
  if (o.wrap) css += "white-space:pre-line;"; // retour à la ligne de Grist : le texte s'enroule ET garde ses sauts de ligne
  return css;
}
// headerCss — Style de l'en-tête d'une colonne (couleurs d'en-tête définies dans Grist).
function headerCss(f) {
  const o = f.opts;
  return styleCss({
    textColor: o.headerTextColor,
    fillColor: o.headerFillColor,
    fontBold: o.headerFontBold,
    fontItalic: o.headerFontItalic,
    fontUnderline: o.headerFontUnderline,
    fontStrikethrough: o.headerFontStrikethrough,
  });
}

/* ---------- Filtres, tri, liaisons ---------- */
const same = (a, b) => (a ?? "") === (b ?? "");
// norm — null/undefined → "" pour comparer des valeurs.
const norm = (x) => x ?? "";
// passFilter — Vrai si une ligne passe le filtre enregistré d'une colonne (format _grist_Filters : included/excluded).
function passFilter(spec, v) {
  // listes de valeurs du filtre transformées une fois en ensembles (évite un coût lignes × valeurs)
  if (Array.isArray(spec.included) && !spec._inc) spec._inc = new Set(spec.included.map(norm));
  if (Array.isArray(spec.excluded) && !spec._exc) spec._exc = new Set(spec.excluded.map(norm));
  const vals = isList(v) ? (v.length > 1 ? v.slice(1) : [null]) : [v];
  if (spec._inc && !vals.some((x) => spec._inc.has(norm(x)))) return false;
  if (spec._exc && !vals.some((x) => !spec._exc.has(norm(x)))) return false;
  if (typeof spec.min === "number" && !(typeof v === "number" && v >= spec.min)) return false;
  if (typeof spec.max === "number" && !(typeof v === "number" && v <= spec.max)) return false;
  return true;
}
// cmp — Comparaison pour le tri : nombres, dates, puis texte en ordre alphabétique français (COLL).
function cmp(a, b) {
  const ea = isEmpty(a),
    eb = isEmpty(b);
  if (ea || eb) return ea === eb ? 0 : ea ? -1 : 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return COLL.compare(String(a), String(b));
}
const COLL = new Intl.Collator("fr", { numeric: true });
// sortRows — Trie les lignes selon le tri de la vue Grist (sortColRefs, avec sens).
function sortRows(info, rows) {
  const pos = (r) => r.manualSort ?? r.id;
  if (!info.sort.length) return rows.slice().sort((a, b) => pos(a) - pos(b));
  const key = (k, r) => {
    const v = r[k.col.colId];
    return ["Ref", "RefList", "ChoiceList"].includes(baseType(k.col)) ? textOf(k.col, k.opts, v) : v;
  };
  return rows
    .map((r) => ({ r, k: info.sort.map((s) => key(s, r)) }))
    .sort((a, b) => {
      for (let i = 0; i < info.sort.length; i++) {
        const c = cmp(a.k[i], b.k[i]);
        if (c) return info.sort[i].desc ? -c : c;
      }
      return pos(a.r) - pos(b.r);
    })
    .map((x) => x.r);
}

// ensureRefTables — Charge les tables ciblées par des colonnes Ref/RefList (et leurs colonnes d'affichage, sur 2 niveaux).
async function ensureRefTables(cols, depth = 0) {
  const targets = [
    ...new Set(
      cols
        .filter((c) => ["Ref", "RefList"].includes(baseType(c)))
        .map(refTarget)
        .filter(Boolean),
    ),
  ];
  await Promise.all(targets.map((t) => fetchRows(t).catch(() => null)));
  if (depth < 2) {
    const vis = cols
      .filter((c) => ["Ref", "RefList"].includes(baseType(c)) && c.visibleCol)
      .map((c) => S.meta.cols.get(c.visibleCol))
      .filter(Boolean);
    if (vis.length) await ensureRefTables(vis, depth + 1);
  }
}
// prepareSection — Charge tout ce qu'il faut pour afficher une vue : sa table et les tables référencées.
async function prepareSection(info) {
  await fetchRows(info.tableId);
  await ensureRefTables([...info.fields.map((f) => f.col), ...info.sort.map((s) => s.col)]);
}

// isRendered — Vrai si la vue fait partie des blocs de la configuration courante.
const isRendered = (secId) => S.cfg.blocks.some((b) => b.id === secId);

// rowsFor — Lignes à afficher pour une vue : table filtrée par la liaison (sélection d'une autre vue), les filtres et le tri. Mis en cache dans ctx pour un rendu.
async function rowsFor(secId, ctx, depth = 0) {
  ctx.pending ??= new Set();
  if (ctx.pending.has(secId))
    return rowsFor(secId, { rows: (ctx.cycleRows ??= new Map()), pending: new Set(), noLink: true }, depth);
  if (ctx.rows.has(secId)) return ctx.rows.get(secId);
  ctx.pending.add(secId);
  const p = (async () => {
    const info = getInfo(secId);
    if (!info?.tableId) throw new Error("Table introuvable");
    await prepareSection(info);
    let rows = (await fetchRows(info.tableId)).filter((r) =>
      info.filters.every((f) => passFilter(f.spec, r[f.col.colId])),
    );
    let focus = null;
    const link = depth < 8 && !ctx.noLink ? await linkFor(info, ctx, depth) : null;
    if (link?.filter) rows = rows.filter(link.filter);
    if (!ctx.noLink) (S.linkSet ??= {})[secId] = link?.set || null;
    if (link && "focus" in link) focus = link.focus;
    return { rows: sortRows(info, rows), focus };
  })().finally(() => ctx.pending.delete(secId));
  ctx.rows.set(secId, p);
  return p;
}

// selectedRowId — Ligne « sélectionnée » d'une vue (curseur) : choix de l'utilisateur, sinon sélection reçue de Grist, sinon première ligne.
async function selectedRowId(secId, ctx, depth = 0) {
  const { rows, focus } = await rowsFor(secId, ctx, depth);
  if (focus) return focus;
  const sel = S.sel[secId];
  if (sel && rows.some((r) => r.id === sel)) return sel;
  if (!isRendered(secId) && S.extSel.has(secId)) return S.extSel.get(secId);
  return rows[0]?.id || 0;
}

// summaryPairs — Couples de colonnes qui relient une table de synthèse à sa table source (ou à une autre synthèse).
function summaryPairs(src, tgt) {
  const sT = src.sec.tableRef,
    tT = tgt.sec.tableRef;
  const sG = groupCols(sT);
  if (!sG) return [];
  const base = S.meta.tables.get(sT).summarySourceTable;
  let tMap;
  if (tT === base) tMap = new Map((S.meta.colsByTable.get(base) || []).map((c) => [c.id, c.colId]));
  else if (S.meta.tables.get(tT)?.summarySourceTable === base) tMap = groupCols(tT);
  else return [];
  const pairs = [];
  for (const [ref, sc] of sG) {
    const tc = tMap.get(ref);
    if (!tc) return [];
    pairs.push([sc, tc]);
  }
  return pairs;
}

// linkFor — Calcule le filtre imposé à une vue par sa vue source (liaison Grist : linkSrcSectionRef / colonnes de liaison).
async function linkFor(info, ctx, depth) {
  const sec = info.sec,
    srcId = sec.linkSrcSectionRef;
  if (!srcId) return null;
  const src = getInfo(srcId);
  if (!src?.tableId) return null;
  const srcRowId = await selectedRowId(srcId, ctx, depth + 1);
  const srcRow = S.byId[src.tableId]?.get(srcRowId);
  if (!srcRow) return { filter: () => false };
  const sCol = sec.linkSrcColRef ? S.meta.cols.get(sec.linkSrcColRef)?.colId : null;
  const tCol = sec.linkTargetColRef ? S.meta.cols.get(sec.linkTargetColRef)?.colId : null;

  if (tCol) {
    // filtrage : cible.col = source.col (ou = ligne source)
    const val = sCol ? srcRow[sCol] : srcRowId;
    const vset = isList(val) ? new Set(val.slice(1)) : null;
    // valeur donnée à une ligne ajoutée dans ce bloc, pour qu'elle reste liée à la sélection
    const tType = baseType(S.meta.cols.get(sec.linkTargetColRef));
    const set =
      vset || val == null || val === "" ? null : { [tCol]: tType === "RefList" || tType === "ChoiceList" ? ["L", val] : val };
    return {
      set,
      filter: (r) => {
        const tv = r[tCol];
        if (isList(tv)) {
          for (let k = 1; k < tv.length; k++) if (vset ? vset.has(tv[k]) : tv[k] === val) return true;
          return false;
        }
        if (vset) return vset.has(tv);
        return same(tv, val);
      },
    };
  }
  if (sCol) {
    // curseur : fiche de l'enregistrement référencé
    const v = srcRow[sCol];
    return isList(v) ? { filter: (r) => v.slice(1).includes(r.id) } : { focus: v || 0 };
  }
  if (src.tableId === info.tableId) return { focus: srcRowId }; // même table : même ligne
  const pairs = summaryPairs(src, info); // tables de synthèse
  if (pairs.length) return { filter: (r) => pairs.every(([sc, tc]) => same(r[tc], srcRow[sc])) };
  return null;
}

/* ---------- Rendu ---------- */
const HEIGHTS = { mini: 130, compact: 200, grand: 460, tresgrand: 640 };
// gridPlacement — Position d'un bloc dans la grille de 6 colonnes (largeur, colonne de départ, nombre de rangées).
function gridPlacement(b, kind) {
  const start = b.newLine ? 1 : b.start || 0;
  const w = Math.min(b.width || DEFAULT_WIDTH[kind] || 3, start ? 7 - start : 6);
  let st = `grid-column:${start ? `${start} / span ${w}` : `span ${w}`};`;
  if ((b.rows || 1) > 1 && !S.cfg.masonry) st += `grid-row:span ${b.rows};align-self:stretch;`;
  return st;
}
// fluxPlacement — Largeur d'un bloc en mode ultracompact (flux) : ajustée au contenu ou en sixièmes.
function fluxPlacement(b, kind) {
  const n = b.fw || 0;
  if (n) return `flex:0 0 calc(${n} * (100% + var(--gap)) / 6 - var(--gap));min-width:0;`;
  if (kind === "chart" || kind === "custom") return "flex:1 1 320px;min-width:260px;max-width:100%;";
  if (kind === "detail") return "flex:1 1 480px;max-width:100%;";
  if (kind === "single") return "flex:0 1 auto;width:max-content;max-width:min(100%, 560px);";
  return "flex:0 1 auto;width:max-content;max-width:100%;";
}
// placement — Placement CSS d'un bloc selon le mode de mise en page.
function placement(b, kind, flux) {
  return flux ? fluxPlacement(b, kind) : gridPlacement(b, kind);
}
// blockStyle — Variables CSS du bloc (hauteur, largeur des fiches, nombre de rangées) + placement.
function blockStyle(b, kind) {
  const CW = { s: 180, m: 240, l: 340, xl: 460 };
  return (
    placement(b, kind, !!S.cfg.flux) +
    (HEIGHTS[b.height] ? `--h:${HEIGHTS[b.height]}px;` : "") +
    (CW[b.cardW] ? `--cw:${CW[b.cardW]}px;` : "") +
    (!S.cfg.flux && (b.rows || 1) > 1 ? `--rows:${b.rows};` : "") +
    (!S.cfg.flux ? `--span:${Math.min(b.width || DEFAULT_WIDTH[kind] || 3, 6)};` : "") // largeur à l'impression
  );
}
// état replié initial : option du bloc, sinon graphiques repliés (cartes et autres vues dépliées)
function initialFold(b, info) {
  if (b.startFold === "fold") return true;
  if (b.startFold === "open") return false;
  return (
    info.kind === "chart" ||
    (info.kind === "custom" && !isMapSection(info.sec) && !isMarkdownSection(info.sec) && !isSelector(b))
  );
}
/* ---------- Filtre rapide (un par bloc) ----------
   Chaque bloc peut recevoir, dans son en-tête, un sélecteur « Tous | valeur 1 | valeur 2… » sur un champ
   choisi dans sa configuration (b.qfField, ex. « Reseau »), avec une valeur à l'ouverture (b.qfDefault).
   Le filtre n'agit que sur l'affichage du bloc, pas sur les liaisons. */
const QF_KINDS = ["record", "detail", "chart", "custom"]; // + fiches affichées en liste
const QF_ICON = '<svg class="qf-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4-2v-4z"/></svg>';
// fitQf — Choisit la présentation du filtre rapide de chaque bloc selon la place disponible dans l'en-tête :
//   on garde au titre au moins 140 px (ou sa largeur entière s'il est plus court).
function fitQf(root = document) {
  for (const q of root.querySelectorAll(".bh .qf")) {
    const h2 = q.closest(".bh").querySelector("h2");
    const need = () => h2.clientWidth < Math.min(h2.scrollWidth, 140);
    // beaucoup de valeurs : jamais de boutons côte à côte, mais la valeur active et sa liste (comme sur petit écran)
    for (const mode of q.dataset.many ? ["compact", "icon"] : ["full", "compact", "icon"]) {
      q.classList.remove("full", "compact", "icon");
      q.classList.add(mode);
      if (!need()) break;
    }
  }
}
// qfClose — Ferme la liste ouverte d'un filtre rapide compact.
function qfClose() {
  document.querySelectorAll(".qf.open").forEach((q) => q.classList.remove("open"));
}
// qfToggle — Ouvre la liste verticale des options sous le bouton (position fixe : non coupée par le bloc).
function qfToggle(btn) {
  const q = btn.closest(".qf"),
    was = q.classList.contains("open");
  qfClose();
  if (was) return;
  q.classList.add("open");
  const r = btn.getBoundingClientRect(),
    opts = q.querySelector(".qf-opts");
  opts.style.top = `${r.bottom + 2}px`;
  opts.style.left = `${Math.max(4, Math.min(r.right - opts.offsetWidth, window.innerWidth - opts.offsetWidth - 4))}px`;
}
new ResizeObserver(() => fitQf()).observe(document.documentElement); // largeur du widget modifiée
document.addEventListener("mousedown", (e) => { if (!e.target.closest(".qf")) qfClose(); });
window.addEventListener("scroll", qfClose, true);
// qfCol — Colonne du filtre rapide dans la table d'un bloc (null si le champ est absent ou non configuré).
// Deux filtres rapides par bloc (0.8.10.1) : emplacement k = 1 (qfField, qfDefault) ou 2 (qfField2, qfDefault2).
const qfFieldOf = (b, k = 1) => (k === 2 ? b.qfField2 : b.qfField);
const qfKey = (b, k = 1) => (k === 2 ? `${b.id}:2` : b.id); // clé du choix de l'utilisateur dans S.qf
// valeurs exclues par l'administrateur (0.8.11.1) : retirées des boutons ET des lignes affichées
const qfExclOf = (b, k = 1) => (k === 2 ? b.qfExclude2 : b.qfExclude) || [];
const qfExcluded = (b, k, text) => qfExclOf(b, k).some((x) => qfSame(x, text));
function qfCol(b, info, k = 1) {
  const id = qfFieldOf(b, k);
  if (!id || !(QF_KINDS.includes(info.kind) || (info.kind === "single" && b.asList))) return null;
  return (S.meta.colsByTable.get(info.sec.tableRef) || []).find((c) => c.colId === id) || null;
}
// qfText — Valeur d'une ligne pour le filtre rapide, telle qu'affichée (« (vide) » si vide).
const qfText = (col, r) => String(textOf(col, parseJSON(col.widgetOptions), r[col.colId]) ?? "").trim() || "(vide)";
// qfSame — Égalité de deux valeurs sans tenir compte des majuscules ni des accents (« Privé » = « PRIVE »).
const qfSame = (a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }) === 0;
// qfCur — Valeur active pour un bloc : choix de l'utilisateur pendant la session, sinon valeur à l'ouverture
//   du bloc, sinon « Tous » (""). S.qf est vidé à chaque enregistrement de la configuration.
function qfCur(b, k = 1) {
  const key = qfKey(b, k);
  return S.qf[key] !== undefined ? S.qf[key] : (k === 2 ? b.qfDefault2 : b.qfDefault) || "";
}
// qfSync — Applique la valeur choisie à tous les blocs de la page dont le filtre rapide porte sur le même
//   champ (même identifiant de colonne ou même libellé) : clic milieu ou Maj+clic sur une valeur.
function qfSync(fromId, v, fromK = 1) {
  const src = S.cfg.blocks.find((x) => x.id === fromId),
    srcInfo = src && getInfo(src.id),
    col = src && srcInfo && qfCol(src, srcInfo, fromK);
  if (!col) return;
  let n = 0;
  for (const b of S.cfg.blocks) {
    const info = getInfo(b.id);
    if (!info) continue;
    for (const k of [1, 2]) {
      const c = qfCol(b, info, k);
      if (c && (c.colId === col.colId || (c.label && c.label === col.label))) {
        S.qf[qfKey(b, k)] = v;
        n++;
      }
    }
  }
  qfClose();
  scheduleRender();
  // message après le rendu (qui efface la ligne d'état)
  setTimeout(() => status(`Filtre « ${col.label || col.colId} » : ${v || "Tous"} — appliqué à ${n} bloc${n > 1 ? "s" : ""}`), 400);
  setTimeout(() => status(""), 3500);
}
// qfValuesOf — Valeurs connues d'un champ pour la configuration : choix déclarés dans Grist + données déjà chargées.
function qfValuesOf(cols) {
  const vals = new Set();
  for (const c of cols) {
    for (const ch of parseJSON(c.widgetOptions)?.choices || []) vals.add(String(ch));
    const t = S.meta.tables.get(c.parentId)?.tableId;
    for (const r of S.byId[t]?.values() || []) vals.add(qfText(c, r));
  }
  vals.delete("(vide)");
  return [...vals].sort(COLL.compare).slice(0, 200);
}
// qfApply — Ne garde que les lignes dont le champ vaut la valeur choisie pour ce bloc.
function qfApply(b, info, rows) {
  return qfApplyOne(b, info, qfApplyOne(b, info, qfDropExcluded(b, info, rows), 1), 2); // les deux filtres se cumulent
}
// qfDropExcluded — Retire les lignes dont un champ de filtre rapide vaut une valeur exclue.
function qfDropExcluded(b, info, rows) {
  for (const k of [1, 2]) {
    const col = qfCol(b, info, k);
    if (col && qfExclOf(b, k).length) rows = rows.filter((r) => !qfExcluded(b, k, qfText(col, r)));
  }
  return rows;
}
function qfApplyOne(b, info, rows, k) {
  const col = qfCol(b, info, k),
    v = qfCur(b, k);
  if (!col || !v) return rows;
  const texts = rows.map((r) => qfText(col, r));
  if (texts.some((t) => qfSame(t, v))) return rows.filter((r, i) => qfSame(texts[i], v)); // valeur présente : égalité
  // valeur absente de ce bloc (filtre synchronisé depuis un autre bloc) : on rapproche par le début du texte,
  // mot entier. « Privé » garde « Privé sous contrat » et « Privé hors contrat » ; à l'inverse,
  // « Privé sous contrat » garde « Privé ».
  const n = qfNorm(v);
  return rows.filter((r, i) => {
    const t = qfNorm(texts[i]);
    return t.startsWith(`${n} `) || n.startsWith(`${t} `);
  });
}
// qfNorm — Texte sans majuscules ni accents, espaces simplifiés (pour le rapprochement par le début).
const qfNorm = (x) =>
  String(x)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
// qfHtml — Sélecteurs de l'en-tête : boutons « Tous | valeurs » ; au-delà de 4 valeurs, valeur active et liste au clic.
function qfHtml(b, info, allRows) {
  return qfHtmlOne(b, info, allRows, 1) + qfHtmlOne(b, info, allRows, 2);
}
function qfHtmlOne(b, info, allRows, k) {
  const col = qfCol(b, info, k);
  if (!col) return "";
  const cur = qfCur(b, k);
  // lignes sans valeur : 1er filtre → option « (SO) » (sans objet), placée en dernier ;
  // 2nd filtre → pas d'option (ces lignes restent visibles avec « Tous »)
  // bloc sans aucune donnée : le filtre reste affiché, avec les valeurs connues du champ (choix Grist, table chargée)
  const noData = !allRows.length;
  const vals = [...new Set(noData ? qfValuesOf([col]).filter((v) => !qfExcluded(b, k, v)) : qfDropExcluded(b, info, allRows).map((r) => qfText(col, r)))]
    .filter((v) => k === 1 || v !== "(vide)")
    .sort((x, y) => (x === "(vide)") - (y === "(vide)") || COLL.compare(x, y));
  const shown = (v) => (v === "(vide)" ? "(SO)" : v); // libellé affiché
  // valeur synchronisée absente de ce bloc (« Privé » alors que le bloc a « Privé sous contrat »…) :
  // pas de bouton supplémentaire ; les valeurs rapprochées sont surlignées (voir qfApply)
  const exact = !cur || vals.some((x) => qfSame(x, cur));
  const isOn = (v) =>
    exact ? qfSame(v, cur) : qfNorm(v).startsWith(`${qfNorm(cur)} `) || qfNorm(cur).startsWith(`${qfNorm(v)} `);
  // une seule valeur dans le bloc : le filtre ne sert à rien (« Public » = « Tous »), sauf si une valeur
  // différente lui a été appliquée (synchronisation) : il reste alors affiché pour pouvoir revenir à « Tous »
  if (!noData && vals.length < 2 && (!cur || vals.every(isOn))) return "";
  const name = col.label || col.colId;
  const tip = `Filtrer ce bloc sur « ${name} »`;
  // aide au survol de chaque valeur : clic sur ce bloc, clic milieu (ou Maj+clic) sur tous les blocs
  const sync = `\nClic milieu (ou Maj+clic) : appliquer à tous les blocs de la page filtrés sur « ${name} »`;
  const pr = cur ? `<span class="qf-print">${esc(name)} : ${esc(shown(vals.find((x) => qfSame(x, cur)) || cur))}</span>` : ""; // impression
  // trois présentations, choisies par fitQf() selon la place dans l'en-tête :
  //   « full » boutons côte à côte · « compact » seule l'option active, les autres en liste au clic
  //   · « icon » icône de filtre (pastille si un filtre est actif), liste au clic
  const label = cur ? shown(vals.find((x) => qfSame(x, cur)) || cur) : "Tous"; // valeur rapprochée : son propre texte
  const many = vals.length > 4; // au-delà de 4 valeurs : valeur active + liste au clic, comme sur petit écran
  return `${pr}<span class="qf ${many ? "compact" : "full"}${cur ? " active" : ""}"${many ? ' data-many="1"' : ""} title="${esc(tip)}">
    <button type="button" class="qf-cur" data-qftog="${b.id}" data-qk="${k}" aria-haspopup="true" aria-label="${esc(tip)} : ${esc(label)}">${QF_ICON}<span class="qf-lab">${esc(label)}</span><span class="qf-caret">▾</span></button>
    <span class="qf-opts">${[["", "Tous"], ...vals.map((v) => [v, shown(v)])]
      .map(([v, l]) => `<button type="button" data-qf="${b.id}" data-qk="${k}" data-qv="${esc(v)}" class="${(v ? cur && isOn(v) : !cur) ? "on" : ""}" title="${esc(`Clic : ${v ? `n'afficher que « ${l} »` : "tout afficher"} dans ce bloc${sync}`)}">${esc(l)}</button>`)
      .join("")}</span></span>`;
}

// blockShell — Crée le cadre d'un bloc : en-tête (titre, compteur, recherche, export, plein écran) et zone de contenu vide.
function blockShell(b, info, badge, extraHead = "") {
  if (S.collapsed[b.id] === undefined) S.collapsed[b.id] = initialFold(b, info);
  const w = b.width || DEFAULT_WIDTH[info.kind] || 3;
  const el = document.createElement("section");
  el.className =
    "block" +
    (S.collapsed[b.id] && S.maxed !== b.id ? " collapsed" : "") +
    (!S.cfg.flux && (b.rows || 1) > 1 ? " tall" : "") +
    (S.maxed === b.id ? " maxed" : "") +
    (b.sticky && S.maxed !== b.id ? " sticky" : "");
  el.setAttribute("style", blockStyle(b, info.kind));
  el.dataset.sec = b.id;
  el.innerHTML = `<div class="bh"><button class="tog" data-tog="${b.id}" title="Replier / déplier">${S.collapsed[b.id] ? "▸" : "▾"}</button>
    <h2>${esc(info.title)}</h2>${secDescMark(info)}${extraHead}<span class="badge"></span>
    <button class="max" data-max="${b.id}" title="${S.maxed === b.id ? "Réduire (Échap)" : "Plein écran"}">${S.maxed === b.id ? "✕" : "⛶"}</button></div><div class="bb"></div>`;
  if (S.layoutMode) {
    el.draggable = true;
    el.style.cssText += layoutRowsCss(b);
    el.insertAdjacentHTML(
      "beforeend",
      `<span class="lyr" data-lyr="${b.id}" title="Tirer pour redimensionner"></span>`,
    );
  }
  return el;
}

// secDescMark — ⓘ après le titre d'un bloc quand la vue Grist a une description (« Description du widget »),
// affichée au survol (infobulle commune #tip, comme les descriptions de colonnes).
const secDescMark = (info) => {
  const d = String(info.sec?.description || "").trim();
  return d ? `<span class="info secinfo" data-desc="${esc(d)}" tabindex="0" aria-label="${esc(d)}">ⓘ</span>` : "";
};
// tableClasses — Classes CSS d'un tableau selon les options de la vue (lignes alternées, bordures…).
function tableClasses(info) {
  const o = info.opts; // valeurs par défaut de Grist : quadrillage horizontal et vertical, pas de zébrures
  return [
    o.zebraStripes ? "zebra" : "",
    o.horizontalGridlines === false ? "nohgrid" : "",
    "" /* quadrillage vertical volontairement ignoré */,
  ].join(" ");
}
let measureCtx = null;
// fitColumns — Répartit la largeur disponible entre les colonnes d'un tableau, sans ascenseur horizontal si possible.
function fitColumns(t) {
  const wrap = t.closest(".tbl-wrap");
  const avail = (S.cfg.flux ? t.closest(".grid")?.clientWidth : wrap?.clientWidth) || 0;
  const ths = [...t.querySelectorAll("thead th")];
  if (!avail || !ths.length) return false; // bloc replié : on attendra qu'il soit déplié
  measureCtx ??= document.createElement("canvas").getContext("2d");
  const firstTd = t.querySelector("tbody td");
  const bodyFont = firstTd ? getComputedStyle(firstTd).font : "12.5px Marianne, Arial, sans-serif";
  const headFont = getComputedStyle(ths[0]).font;
  const W = (txt, font) => {
    measureCtx.font = font;
    return measureCtx.measureText(txt).width;
  };
  const rows = [...t.querySelectorAll("tbody tr")].slice(0, 300);
  const cols = ths.map((th, i) => {
    const words = (th.querySelector(".ths")?.textContent || th.textContent)
      .replace(/[▲▼ⓘ]/g, "")
      .trim()
      .split(/\s+/);
    // le bouton de filtre se superpose à l'en-tête : il ne compte pas dans la largeur
    const headMin =
      Math.max(...words.map((w) => W(w, headFont))) +
      14 +
      (th.querySelector(".info") ? 10 : 0) +
      (th.querySelector(".arr")?.textContent ? 10 : 0);
    let content = 0,
      extra = 0;
    for (const tr of rows) {
      const td = tr.children[i];
      if (!td) continue;
      // liste de valeurs : la largeur minimale se règle sur la plus longue (les autres se suivent s'il reste de la place)
      const parts = td.classList.contains("multi")
        ? [...td.querySelectorAll(".chip")].map((c) => c.textContent.trim())
        : [td.textContent.trim()];
      for (const t of parts)
        content = Math.max(content, W(t, bodyFont) + (td.classList.contains("multi") ? 14 : 0));
      if (!extra && td.querySelector(".rlink")) extra += 16;
      if (td.dataset.kind === "sel") extra = Math.max(extra, 18);
    }
    const need = Math.min(Math.ceil(content) + 16 + extra, 380);
    const isWrap = th.dataset.wrap === "1";
    const min = Math.max(Math.ceil(headMin), 34);
    const full = Math.max(need, min);
    // contenu court (codes, années, nombres) : la colonne garde toujours sa largeur utile
    const floor = full <= 120 ? full : Math.max(min, isWrap ? 110 : 90);
    return { need: full, min, floor, isWrap, isText: !th.classList.contains("num") && content > 30 };
  });
  let ws = cols.map((c) => c.need);
  let total = ws.reduce((a, b) => a + b, 0);
  if (total > avail) {
    // trop large : on réduit les colonnes larges, jamais sous leur plancher
    const room = cols.map((c, i) => Math.max(0, ws[i] - Math.min(c.floor, ws[i])));
    const roomSum = room.reduce((a, b) => a + b, 0),
      excess = total - avail;
    if (roomSum > 0) ws = ws.map((w, i) => w - room[i] * Math.min(1, excess / roomSum));
  } else {
    // place disponible : elle va aux colonnes à retour à la ligne (moins de lignes)
    // à défaut, aux colonnes de texte, au prorata de leur largeur : le tableau occupe alors toute la largeur du bloc
    // (un tableau uniquement numérique garde des colonnes serrées)
    const wraps = cols.map((c, i) => (c.isWrap ? i : -1)).filter((i) => i >= 0);
    const texts = cols.map((c, i) => (c.isText ? i : -1)).filter((i) => i >= 0);
    const spare = avail - total - 2;
    if (wraps.length)
      wraps.forEach((i) => {
        ws[i] += spare / wraps.length;
      });
    else if (texts.length) {
      // les colonnes de texte grandissent d'abord, mais sans excès (au plus +120 px et 2,5 × leur besoin) ;
      // le reste est réparti sur toutes les colonnes au prorata : le tableau reste équilibré sur grand écran
      let left = spare;
      const base = texts.reduce((a, i) => a + ws[i], 0);
      texts.forEach((i) => {
        const add = Math.min((spare * ws[i]) / base, 120, ws[i] * 1.5);
        ws[i] += add;
        left -= add;
      });
      if (left > 0) {
        const all = ws.reduce((a, w) => a + w, 0);
        ws = ws.map((w) => w + (left * w) / all);
      }
    }
  }
  ws = ws.map((w) => Math.floor(w));
  const cg = document.createElement("colgroup");
  cg.innerHTML = ws.map((w) => `<col style="width:${w}px">`).join("");
  t.querySelector("colgroup")?.remove();
  t.prepend(cg);
  t.style.tableLayout = "fixed";
  t.style.width = `${ws.reduce((a, b) => a + b, 0)}px`;
  t.dataset.locked = "1";
  return true;
}
new ResizeObserver(() =>
  document.documentElement.style.setProperty("--toph", `${$("#top").offsetHeight}px`),
).observe($("#top"));
new ResizeObserver(() =>
  document.documentElement.style.setProperty("--barw", `${$(".bar").offsetWidth}px`),
).observe($(".bar"));
// renderForms — Liens de la page vers des formulaires Grist (ouverts dans un nouvel onglet).
function renderForms() {
  $("#forms").innerHTML = (S.cfg.forms || [])
    .filter((f) => safeBase(f.url))
    .map(
      (f) =>
        `<a class="tb formlink" href="${esc(safeBase(f.url))}" target="_blank" rel="noopener noreferrer"${f.tab ? "" : ` data-fmodal="${esc(f.label || "Formulaire")}"`} data-tip="${esc(f.tip || `${f.label || "Formulaire"} : ${f.tab ? "ouvre le formulaire dans un nouvel onglet" : "ouvre le formulaire"}`)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4" /></svg><span class="lbl">${esc(f.label || "Formulaire")}</span></a>`,
    )
    .join("");
}
/* Formulaire dans une fenêtre : il se ferme avec ✕, Échap ou un clic à côté, et tout seul après l'envoi.
   L'envoi est repéré de deux façons, car le formulaire vient d'un autre site (son contenu est illisible) :
   - le cadre change de page (formulaire réglé dans Grist pour « rediriger après l'envoi ») ;
   - une nouvelle ligne apparaît dans la table du formulaire (si l'utilisateur peut la lire). */
const FM = { timer: 0, loads: 0, done: false };
// formTables — Tables où arrivent les réponses : celle du formulaire publié (…/forms/clé/N), ou celles
// des vues d'une page du document (…/p/N), si le lien vise bien ce document.
async function formTables(url) {
  const m = S.meta;
  const sec = Number(/\/forms\/[^/]+\/(\d+)/.exec(url)?.[1]);
  if (sec) return [m?.tables.get(m.sections.get(sec)?.tableRef)?.tableId].filter(Boolean);
  const pm = /\/(?:doc\/)?([A-Za-z0-9]{8,})(?:\/[^/?#]*)?\/p\/(\d+)/.exec(url);
  if (!pm || !m) return [];
  const docId = /\/doc\/([^/?#]+)/.exec(await guessDocUrl())?.[1] || "";
  if (!docId || !(docId.startsWith(pm[1]) || pm[1].startsWith(docId))) return []; // autre document
  return [
    ...new Set((m.sectionsByView.get(Number(pm[2])) || []).map((x) => m.tables.get(x.tableRef)?.tableId).filter(Boolean)),
  ];
}
// formRows — Empreinte des tables surveillées (nombre de lignes et plus grand identifiant de chacune).
async function formRows(tids) {
  if (!tids?.length) return null;
  const out = [];
  for (const tid of tids) {
    try {
      const ids = (await grist.docApi.fetchTable(tid)).id || [];
      out.push(`${ids.length}:${Math.max(0, ...ids)}`);
    } catch {
      out.push("?"); // table non lisible
    }
  }
  return out.every((x) => x === "?") ? null : out.join("|");
}
async function openFormModal(url, label) {
  const m = $("#fmodal"),
    fr = $("#fmFrame");
  FM.loads = 0;
  FM.done = false;
  $("#fmTitle").textContent = label;
  $("#fmTab").href = url;
  $("#fmodal .fmmsg").textContent = "";
  fr.src = url;
  m.hidden = false;
  $("#fmClose").focus();
  clearInterval(FM.timer);
  const tids = await formTables(url);
  const base = await formRows(tids);
  if (base && !m.hidden)
    FM.timer = setInterval(async () => {
      const now = await formRows(tids);
      if (now && now !== base) formSubmitted();
    }, 2000);
}
function closeFormModal() {
  clearInterval(FM.timer);
  $("#fmodal").hidden = true;
  $("#fmFrame").src = "about:blank";
  if (FM.done) refreshAll(); // la nouvelle réponse apparaît dans la page
}
function formSubmitted() {
  if (FM.done || $("#fmodal").hidden) return;
  FM.done = true;
  clearInterval(FM.timer);
  $("#fmodal .fmmsg").textContent = "✓ Réponse envoyée";
  setTimeout(() => !$("#fmodal").hidden && closeFormModal(), 1500); // le temps de lire le message de Grist
}
$("#fmFrame").addEventListener("load", () => {
  if ($("#fmFrame").src === "about:blank" || $("#fmodal").hidden) return;
  if (++FM.loads >= 2) formSubmitted(); // 2e page chargée : redirection après l'envoi
});
$("#fmClose").addEventListener("click", closeFormModal);
$("#fmodal").addEventListener("mousedown", (e) => {
  if (e.target.id === "fmodal") closeFormModal(); // clic à côté de la fenêtre
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#fmodal").hidden) closeFormModal();
});
$("#forms").addEventListener("click", (e) => {
  const a = e.target.closest("a[data-fmodal]");
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return; // Ctrl+clic : nouvel onglet
  e.preventDefault();
  openFormModal(a.href, a.dataset.fmodal);
});
// menuToggle — Ouvre / ferme le menu hamburger de la barre d'outils.
function menuToggle(open = $("#tbMenu").hidden) {
  $("#tbMenu").hidden = !open;
  $("#btnMenu").setAttribute("aria-expanded", String(open));
  tip.classList.remove("on");
  if (open) $("#tbMenu .tb:not([hidden])")?.focus();
}
$("#btnMenu").addEventListener("click", (e) => {
  e.stopPropagation();
  menuToggle();
});
$("#tbMenu").addEventListener("click", (e) => {
  if (e.target.closest(".tb")) menuToggle(false); // une action choisie ferme le menu
});
document.addEventListener("mousedown", (e) => {
  if (!$("#tbMenu").hidden && !e.target.closest("#tbMenu, #btnMenu")) menuToggle(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("#tbMenu").hidden) {
    menuToggle(false);
    $("#btnMenu").focus();
  }
});
// infobulle immédiate des boutons quand leur texte est masqué (écran réduit), au survol comme au toucher
function tbTip(btn) {
  // les liens vers des formulaires montrent toujours leur commentaire, même quand leur libellé est visible
  if (!btn.classList.contains("formlink") && btn.id !== "btnMenu" && getComputedStyle(btn.querySelector(".lbl")).display !== "none") return;
  tip.textContent = btn.dataset.tip;
  tip.classList.add("on");
  const r = btn.getBoundingClientRect();
  tip.style.top = `${r.bottom + 4}px`;
  tip.style.left = `${Math.max(4, Math.min(r.left + r.width / 2 - tip.offsetWidth / 2, window.innerWidth - tip.offsetWidth - 4))}px`;
}
$(".bar").addEventListener("mouseover", (e) => {
  const b = e.target.closest(".tb");
  if (b) tbTip(b);
});
$(".bar").addEventListener("mouseout", (e) => {
  if (e.target.closest(".tb")) tip.classList.remove("on");
});
$(".bar").addEventListener(
  "touchstart",
  (e) => {
    const b = e.target.closest(".tb");
    if (b) {
      tbTip(b);
      setTimeout(() => tip.classList.remove("on"), 1500);
    }
  },
  { passive: true },
);
/* Blocs « figés à l'écran » : sans réglage, ils se colleraient tous au même endroit sous l'en-tête et se
   recouvriraient (un graphique figé glisserait sur la carte figée au-dessus). Chaque bloc figé se colle donc
   sous ceux, figés aussi, qui le précèdent dans la même colonne. Un bloc qui n'a plus la place de montrer son
   en-tête n'est plus figé, et passe alors sous les blocs figés. */
let stickyRO = null,
  stickyRaf = 0;
// stackSticky — Calcule la position de collage (top) de chaque bloc figé, colonne par colonne.
function stackSticky(grid = $("#grid")) {
  stickyRO?.disconnect();
  const els = [...grid.querySelectorAll(":scope > .block.sticky")];
  if (!els.length) return maskSticky();
  const apply = () => {
    const toph = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--toph")) || 0;
    const gap = 8,
      placed = [];
    els.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const above = placed.filter((p) => p.l < r.right - 1 && p.r > r.left + 1); // même colonne (chevauchement horizontal)
      const top = above.reduce((t, p) => Math.max(t, p.top + p.h + gap), toph + 6);
      // plus assez de place pour montrer au moins l'en-tête du bloc : il n'est plus figé. Sinon le bloc reste
      // figé quelle que soit sa hauteur (déplié ou non) : max-height le limite à la place restante et son
      // contenu défile à l'intérieur
      const head = el.querySelector(".bh")?.offsetHeight || 34;
      const tooLow = top + head + 40 > window.innerHeight;
      el.style.position = tooLow ? "relative" : "";
      el.style.top = tooLow ? "" : `${top}px`;
      el.style.maxHeight = tooLow ? "" : `calc(100vh - ${Math.round(top + 8)}px)`;
      // superposition : les blocs figés passent devant le reste, le premier figé devant les suivants ;
      // un bloc qui n'est plus figé passe SOUS les blocs figés (sinon il glisserait par-dessus la carte)
      el.style.zIndex = tooLow ? "1" : String(Math.max(3, 11 - i));
      if (!tooLow) placed.push({ l: r.left, r: r.right, top, h: el.offsetHeight });
    });
  };
  apply();
  maskSticky();
  stickyRO = new ResizeObserver(() => {
    cancelAnimationFrame(stickyRaf);
    stickyRaf = requestAnimationFrame(() => {
      apply(); // pliage, dépliage, contenu chargé
      maskSticky();
    });
  });
  els.forEach((el) => stickyRO.observe(el));
  stickyRO.observe($("#top")); // hauteur de l'en-tête
}
window.addEventListener("resize", () => stackSticky());
/* maskSticky — Masque blanc sous les blocs figés côte à côte. Quand deux blocs figés voisins n'ont pas la même
   hauteur, un bloc qui défile dessous passait derrière le plus haut mais restait visible sous le plus court.
   Les blocs figés voisins (qui se touchent ou presque horizontalement) forment un groupe ; un masque fixe couvre
   toute la largeur du groupe jusqu'au bas du plus haut : le contenu disparaît sur une même ligne. Le masque
   passe sous les blocs figés (z-index 2) et devant le reste. */
let maskRaf = 0;
function maskSticky() {
  let box = $("#stickyMask");
  if (!box) {
    box = document.createElement("div");
    box.id = "stickyMask";
    document.body.append(box);
  }
  const grid = $("#grid");
  const stuck = [...(grid?.querySelectorAll(":scope > .block.sticky") || [])]
    .filter((el) => el.offsetParent && el.style.position !== "relative" && getComputedStyle(el).position === "sticky")
    .map((el) => ({ el, r: el.getBoundingClientRect(), top: parseFloat(el.style.top) || 0 }))
    .filter((o) => o.r.top <= o.top + 1.5 && o.r.bottom > 0) // collé (ou repoussé vers le haut en fin de page)
    .sort((a, b) => a.r.left - b.r.left);
  // regroupe les blocs collés voisins (écart horizontal ≤ 24 px, soit la gouttière de la grille)
  const groups = [];
  stuck.forEach((o) => {
    const g = groups.find((g) => o.r.left <= g.r + 24 && o.r.right >= g.l - 24);
    if (g) {
      g.l = Math.min(g.l, o.r.left);
      g.r = Math.max(g.r, o.r.right);
      g.b = Math.max(g.b, o.r.bottom);
      g.n++;
    } else groups.push({ l: o.r.left, r: o.r.right, b: o.r.bottom, n: 1 });
  });
  const toph = $("#top")?.getBoundingClientRect().bottom || 0;
  box.innerHTML = groups
    .filter((g) => g.n > 1) // un bloc seul n'a pas besoin de masque (son liseré suffit)
    .map((g) => `<div style="left:${Math.round(g.l) - 4}px;width:${Math.round(g.r - g.l) + 8}px;top:${Math.round(toph)}px;height:${Math.max(0, Math.round(g.b - toph) + 8)}px"></div>`)
    .join("");
}
window.addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(maskRaf);
    maskRaf = requestAnimationFrame(maskSticky);
  },
  { passive: true },
);
/* chaque bloc réserve dans la grille un nombre de rangées de 2 px égal à sa hauteur réelle */
function setupMasonry(grid) {
  S.masonRO?.disconnect();
  if (!grid.classList.contains("masonry")) return;
  const gap = parseFloat(getComputedStyle(grid).getPropertyValue("--gap")) || 10;
  const fit = (el) => {
    if (!el.classList.contains("maxed"))
      el.style.gridRowEnd = `span ${Math.max(1, Math.ceil((el.offsetHeight + gap) / 2))}`;
  };
  S.masonRO = new ResizeObserver((es) => es.forEach((e) => fit(e.target)));
  grid.querySelectorAll(":scope > .block").forEach((el) => {
    fit(el);
    S.masonRO.observe(el);
  });
}
let refitTimer = null;
window.addEventListener("resize", () => {
  // largeur du widget modifiée : on réajuste les tableaux
  clearTimeout(refitTimer);
  refitTimer = setTimeout(() => {
    document.querySelectorAll("#grid table[data-fit]").forEach((t) => {
      delete t.dataset.locked;
      fitColumns(t);
    });
    freezeColumns($("#grid"));
  }, 200);
});
// lockColumns — Fige la largeur des colonnes une fois affichées (le survol ou l'édition ne les font plus bouger).
function lockColumns(root) {
  // fige la largeur des colonnes : survol, saisie ou ajout de lignes ne les font plus bouger
  root.querySelectorAll("table[data-fit]:not([data-locked])").forEach(fitColumns);
  root.querySelectorAll("table:not([data-locked])").forEach((t) => {
    const ths = [...t.querySelectorAll("thead th")];
    const ws = ths.map((th) => th.getBoundingClientRect().width);
    if (!ths.length || ws.some((w) => !w)) return; // bloc replié : on attendra qu'il soit déplié
    const cg = document.createElement("colgroup");
    cg.innerHTML = ws.map((w) => `<col style="width:${w}px">`).join("");
    t.prepend(cg);
    t.style.width = `${t.getBoundingClientRect().width}px`;
    t.style.tableLayout = "fixed";
    t.dataset.locked = "1";
  });
}
// freezeColumns — Colonnes figées à gauche (option « colonnes figées » de la vue Grist).
function freezeColumns(root) {
  root.querySelectorAll("table[data-frozen]").forEach((t) => {
    const n = Number(t.dataset.frozen);
    if (!n) return;
    const ths = [...t.querySelectorAll("thead th")].slice(0, n);
    let left = 0;
    ths.forEach((th, i) => {
      const x = left;
      left += th.getBoundingClientRect().width;
      t.querySelectorAll(`tr > :nth-child(${i + 1})`).forEach((c) => {
        c.classList.add("frz");
        c.style.left = `${x}px`;
      });
    });
  });
}
/* ---------- Tri et filtres des en-têtes de tableau ---------- */
const keyText = (f, r) => textOf(f.col, f.opts, r[f.colId]) || "(vide)";
// applyUserView — Applique le tri et les filtres choisis dans les en-têtes du tableau (en plus de ceux de la vue).
function applyUserView(info, rows, exceptCol = null) {
  const uf = S.ufilt[info.secId] || {};
  for (const [colId, ex] of Object.entries(uf)) {
    if (colId === exceptCol) continue;
    const f = info.fields.find((x) => x.colId === colId);
    if (!f) continue;
    rows = rows.filter((r) => !ex.has(keyText(f, r)));
  }
  const us = S.usort[info.secId];
  const f = us && info.fields.find((x) => x.colId === us.colId);
  if (f && exceptCol === null) {
    const t = baseType(f.col),
      raw = ["Numeric", "Int", "Date", "DateTime", "Bool"].includes(t);
    rows = rows
      .map((r) => ({ r, k: raw ? r[f.colId] : textOf(f.col, f.opts, r[f.colId]) }))
      .sort((a, b) => {
        const c = cmp(a.k, b.k);
        return us.desc ? -c : c;
      })
      .map((x) => x.r);
  }
  return rows;
}
// openFilter — Ouvre la petite fenêtre de filtre d'une colonne (cases à cocher des valeurs).
async function openFilter(btn, secId, colId) {
  document.querySelector(".fpop")?.remove();
  const info = getInfo(secId),
    f = info.fields.find((x) => x.colId === colId);
  const { rows } = await rowsFor(secId, { rows: new Map() });
  const counts = new Map();
  for (const r of applyUserView(info, rows, colId)) {
    const k = keyText(f, r);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const t = baseType(f.col),
    raw = ["Numeric", "Int", "Date", "DateTime"].includes(t);
  const byText = new Map(rows.map((r) => [keyText(f, r), r[f.colId]]));
  const keys = [...counts.keys()].sort((a, b) => (raw ? cmp(byText.get(a), byText.get(b)) : COLL.compare(a, b)));
  const ex = new Set(S.ufilt[secId]?.[colId] || []);
  const box = document.createElement("div");
  box.className = "fpop";
  box.innerHTML = `<input class="ed-input" type="text" placeholder="Rechercher une valeur…">
    <div class="fbtn"><button data-all>Tout</button><button data-none>Aucun</button></div>
    <ul>${keys
.slice(0, 1000)
.map(
  (k) =>
    `<li><label><input type="checkbox" value="${esc(k)}" ${ex.has(k) ? "" : "checked"}> <span>${esc(k)}</span> <small>${counts.get(k)}</small></label></li>`,
)
.join("")}</ul>
    ${keys.length > 1000 ? `<div class="msg">${keys.length - 1000} valeurs supplémentaires non listées</div>` : ""}
    <div class="fbtn"><button class="btn" data-cancel>Annuler</button><button class="btn primary" data-apply>Appliquer</button></div>`;
  document.body.append(box);
  const r = btn.getBoundingClientRect();
  box.style.top = `${Math.min(r.bottom + 4, window.innerHeight - box.offsetHeight - 4)}px`;
  box.style.left = `${Math.max(4, Math.min(r.left - 160, window.innerWidth - box.offsetWidth - 4))}px`;
  const inp = box.querySelector("input[type=text]");
  inp.addEventListener("input", () => {
    const q = inp.value.toLowerCase();
    box.querySelectorAll("li").forEach((li) => {
      li.hidden = !!q && !li.textContent.toLowerCase().includes(q);
    });
  });
  const visibleBoxes = () => [...box.querySelectorAll("li:not([hidden]) input")];
  const close = () => {
    box.remove();
    document.removeEventListener("mousedown", outside, true);
  };
  const outside = (e) => {
    if (!box.contains(e.target)) close();
  };
  setTimeout(() => document.addEventListener("mousedown", outside, true), 0);
  box.addEventListener("click", (e) => {
    if (e.target.closest("[data-all]"))
      visibleBoxes().forEach((c) => {
        c.checked = true;
      });
    if (e.target.closest("[data-none]"))
      visibleBoxes().forEach((c) => {
        c.checked = false;
      });
    if (e.target.closest("[data-cancel]")) close();
    if (e.target.closest("[data-apply]")) {
      const off = new Set([...box.querySelectorAll("li input")].filter((c) => !c.checked).map((c) => c.value));
      for (const k of ex) if (!counts.has(k)) off.add(k); // valeurs déjà masquées absentes de la liste
      S.ufilt[secId] ??= {};
      if (off.size) S.ufilt[secId][colId] = off;
      else delete S.ufilt[secId][colId];
      close();
      scheduleRender();
    }
  });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "Enter") box.querySelector("[data-apply]").click();
  });
  inp.focus();
}

// renderTable — Affiche une vue tableau. Rendu progressif : 400 lignes d'abord, le reste par paquets (jobs).
function renderTable(info, rows, body, selId, jobs = []) {
  const FIRST = 400,
    CHUNK = 1500,
    ed = blockEditable(info.secId);
  const us = S.usort[info.secId],
    uf = S.ufilt[info.secId] || {};
  const head = info.fields
    .map((f) => {
      const arrow = us?.colId === f.colId ? (us.desc ? " ▼" : " ▲") : "";
      return (
        `<th class="${isNumCol(f.col) ? "num" : ""}"${f.opts.wrap ? ' data-wrap="1"' : ""} style="${headerCss(f)}"${colDesc(f) ? descAttr(f) : ` title="${esc(f.label)} — cliquer pour trier"`}>` +
        `<span class="ths" data-sort="${esc(f.colId)}">${esc(f.label)}${infoMark(f)}<b class="arr">${arrow}</b></span>` +
        `<button class="thf${uf[f.colId] ? " on" : ""}" data-filt="${esc(f.colId)}" title="Filtrer cette colonne">⏷</button></th>`
      );
    })
    .join("");
  const line = (r) => {
    const txt = info.fields
      .map((f) => textOf(f.col, f.opts, r[f.colId]))
      .join(" ")
      .toLowerCase();
    const rs = rowStyle(info, r);
    const cells = info.fields
      .map((f) => {
        const t = textOf(f.col, f.opts, r[f.colId]);
        return `<td class="${isNumCol(f.col) ? "num" : ""}${["RefList", "ChoiceList"].includes(baseType(f.col)) ? " multi" : ""}" style="${cellStyle(f, r, rs)}" title="${esc(t)}"${edAttr(ed, f, r)}>${htmlOf(f, r[f.colId])}</td>`;
      })
      .join("");
    return `<tr data-row="${r.id}" data-text="${esc(txt)}" class="${r.id === selId ? "sel" : ""}">${cells}</tr>`;
  };
  const lines = rows.slice(0, FIRST).map(line).join("");
  // largeurs des colonnes : celles réglées dans la vue Grist (par défaut), ou calcul automatique
  const blk = S.cfg.blocks.find((x) => x.id === info.secId) || {};
  const ws = info.fields.map((f) => Number(f.field?.width) || 0);
  const useGrist = blk.colWidths === "grist" && ws.some((w) => w > 0);
  const fit = !blk.colWidths; // par défaut : colonnes ajustées au contenu et à la largeur du bloc
  const colgroup = useGrist
    ? `<colgroup>${ws.map((w) => `<col style="width:${w || 100}px">`).join("")}</colgroup>`
    : "";
  const tStyle = useGrist ? ` style="table-layout:fixed;width:${ws.reduce((a, w) => a + (w || 100), 0)}px"` : "";
  body.innerHTML = `<div class="tbl-wrap" style="--tmh:${S.cfg.tableMaxHeight}px;max-height:var(--h, var(--tmh))"><table class="${tableClasses(info)}"${useGrist ? ' data-locked="1"' : ""}${fit ? ' data-fit="1"' : ""}${tStyle} data-frozen="${Math.max(0, Number(info.opts.numFrozen) || 0)}">${colgroup}<thead><tr>${head}</tr></thead><tbody>${lines}</tbody></table></div>` +
    // nombre de lignes, en bas à droite comme dans Grist (mis à jour par la recherche du bloc)
    (blk.rowCount === false ? "" : `<div class="rowcount" data-total="${rows.length}">${rowCountText(rows.length)}</div>`);
  if (rows.length > FIRST)
    jobs.push(() => {
      // le reste est ajouté par paquets, sans bloquer l'affichage
      const tb = body.querySelector("tbody");
      let i = FIRST;
      const step = () => {
        if (!tb.isConnected) return;
        tb.insertAdjacentHTML(
          "beforeend",
          rows
            .slice(i, i + CHUNK)
            .map(line)
            .join(""),
        );
        i += CHUNK;
        if (S.search[info.secId]) applySearch(info.secId);
        if (i < rows.length) setTimeout(step, 0);
        else freezeColumns(body);
      };
      setTimeout(step, 0);
    });
}

// colDesc — Description d'une colonne (affichée en infobulle).
const colDesc = (f) => String(f.col.description || "").trim();
// descAttr — Attribut HTML portant la description d'une colonne.
const descAttr = (f) => (colDesc(f) ? ` data-desc="${esc(colDesc(f))}"` : "");
// infoMark — Petit ⓘ signalant qu'une colonne a une description.
const infoMark = (f) => (colDesc(f) ? '<span class="info">ⓘ</span>' : "");
/* ---------- Édition des champs (les règles d'accès de Grist restent souveraines) ---------- */
const EDIT_TYPES = [
  "Text",
  "Numeric",
  "Int",
  "Bool",
  "Date",
  "DateTime",
  "Choice",
  "Ref",
  "Any",
  "RefList",
  "ChoiceList",
];
S.canEdit = new URLSearchParams(location.search).get("readonly") !== "true"; // lecteur = lecture seule
// isEditableCol — Colonne modifiable dans le widget : données (pas formule), type géré.
function isEditableCol(col) {
  if (!col || ["id", "manualSort"].includes(col.colId) || col.colId.startsWith("gristHelper_")) return false;
  if (col.isFormula && String(col.formula || "").trim()) return false; // colonne calculée
  return EDIT_TYPES.includes(baseType(col));
}
// blockEditable — Vrai si le bloc autorise l'édition et que l'utilisateur n'est pas en lecture seule.
const blockEditable = (secId) => S.canEdit && !!S.cfg.blocks.find((x) => x.id === secId)?.editable;
// blockAddable — Vrai si le bloc (tableau ou fiches) propose « + Ajouter une ligne » : édition active et option cochée.
const blockAddable = (b, info) =>
  S.canEdit && !!b?.editable && !!b?.addable && ["record", "detail"].includes(info?.kind);
// addBtn — Bouton d'ajout d'une ligne en bas du bloc.
const addBtn = (b, del = true) =>
  `<div class="rowbtns"><button class="addrow" data-addrow="${b.id}" title="Ajouter un enregistrement dans la table">+ Ajouter une ligne</button>` +
  (del ? "" : "</div>") +
  (!del ? "" : `<button class="addrow delrow" data-delrow="${b.id}" title="Supprimer la ligne sélectionnée (deux clics : le premier demande confirmation)">− Supprimer la ligne</button></div>`);
// edAttr — Attributs HTML qui rendent une cellule éditable (double-clic).
const edAttr = (on, f, row) =>
  on && isEditableCol(f.col)
    ? ` data-ed="${f.col.id}" data-fld="${f.field?.id || ""}" data-rid="${row.id}" tabindex="0"${["Ref", "Choice", "RefList", "ChoiceList"].includes(baseType(f.col)) ? ' data-kind="sel"' : ""}`
    : "";
// tableOfCol — Identifiant de la table d'une colonne.
function tableOfCol(col) {
  return S.meta.tables.get(col.parentId)?.tableId;
}
/* ---------- Conditions de liste déroulante (formules « choice.X == $Y » de Grist) ---------- */
function compilePredicate(node) {
  const [op, ...a] = node;
  const all = (fn) => {
    const cs = a.map(compilePredicate);
    return (inp) => fn(cs.map((c) => c(inp)));
  };
  const incl = (h, n) =>
    Array.isArray(h) ? h.includes(n) : typeof h === "string" && typeof n === "string" ? h.includes(n) : false;
  switch (op) {
    case "And": {
      const cs = a.map(compilePredicate);
      return (i) => cs.every((c) => c(i));
    }
    case "Or": {
      const cs = a.map(compilePredicate);
      return (i) => cs.some((c) => c(i));
    }
    case "Add":
      return all(([x, y]) => x + y);
    case "Sub":
      return all(([x, y]) => x - y);
    case "Mult":
      return all(([x, y]) => x * y);
    case "Div":
      return all(([x, y]) => x / y);
    case "Mod":
      return all(([x, y]) => x % y);
    case "Not":
      return all(([x]) => !x);
    case "Eq":
    case "Is":
      return all(([x, y]) => x === y);
    case "NotEq":
    case "IsNot":
      return all(([x, y]) => x !== y);
    case "Lt":
      return all(([x, y]) => x < y);
    case "LtE":
      return all(([x, y]) => x <= y);
    case "Gt":
      return all(([x, y]) => x > y);
    case "GtE":
      return all(([x, y]) => x >= y);
    case "In":
      return all(([x, y]) => incl(y, x));
    case "NotIn":
      return all(([x, y]) => !incl(y, x));
    case "List":
      return all((v) => v);
    case "Const":
      return () => a[0];
    case "Comment":
      return compilePredicate(a[0]);
    case "Name": {
      const n = a[0];
      if (n === "user") throw new Error("user"); // l'utilisateur n'est pas accessible au widget
      if (!["rec", "choice"].includes(n)) throw new Error(`Variable inconnue ${n}`);
      return (i) => i[n];
    }
    case "Attr": {
      const base = compilePredicate(a[0]),
        attr = a[1];
      return (i) => {
        const v = base(i);
        if (v == null) throw new Error("valeur absente");
        if (typeof v === "string")
          return attr === "lower" ? () => v.toLowerCase() : attr === "upper" ? () => v.toUpperCase() : undefined;
        const x = attr === "id" ? v.id : v[attr];
        return isList(x) ? x.slice(1) : x; // listes Grist ["L", …] → tableaux
      };
    }
    case "Call": {
      const cs = a.map(compilePredicate);
      return (i) => {
        const f = cs[0](i);
        if (typeof f !== "function") throw new Error("non supporté");
        return f();
      };
    }
  }
  throw new Error(`Nœud non géré : ${op}`);
}
// dropdownFilter — Valeurs proposées dans une liste déroulante en tenant compte de sa condition (dropdownCondition).
function dropdownFilter(opts, rec, targetTable) {
  const dc = opts?.dropdownCondition;
  if (!dc?.text || !dc.parsed) return () => true;
  let pred;
  try {
    pred = compilePredicate(parseJSON(dc.parsed, null));
  } catch {
    return () => true;
  } // formule non gérée : liste complète
  return (choice) => {
    try {
      return !!pred({ rec, choice });
    } catch {
      return true;
    }
  };
}

// startEdit — Édition d'une cellule : champ de saisie, liste de choix ou sélecteur de référence selon le type.
function startEdit(el) {
  if (el.querySelector(".ed-input") || el.classList.contains("saving")) return;
  const col = S.meta.cols.get(Number(el.dataset.ed)),
    rid = Number(el.dataset.rid),
    tableId = tableOfCol(col);
  const row = S.byId[tableId]?.get(rid);
  if (!col || !row) return;
  const t = baseType(col),
    v = row[col.colId];
  const opts = S.fieldOpts.get(Number(el.dataset.fld)) || parseJSON(col.widgetOptions);
  const allowed = dropdownFilter(opts, row, refTarget(col)); // condition de liste déroulante définie dans Grist
  if (t === "Bool") return saveValue(el, tableId, rid, col, !v); // case à cocher : bascule directe
  if (t === "RefList" || t === "ChoiceList") {
    // plusieurs valeurs : liste à cases à cocher
    const cur = isList(v) ? v.slice(1) : [];
    const items =
      t === "ChoiceList"
        ? (opts.choices || [])
            .filter((c) => allowed(c) || cur.includes(c))
            .map((c) => ({ v: c, t: c, chip: true }))
        : [...(S.byId[refTarget(col)]?.values() || [])]
            .filter((r) => allowed(r) || cur.includes(r.id))
            .map((r) => ({ v: r.id, t: refText(col, r.id, 0) }))
            .sort((a, b) => COLL.compare(a.t, b.t));
    S.editing = true;
    const end = () => {
      S.editing = false;
      if (S.pendingRender) {
        S.pendingRender = false;
        scheduleRender();
      }
    };
    openMultiPicker(
      el,
      items,
      cur,
      t === "ChoiceList" ? opts : null,
      (list) => {
        S.editing = false;
        if (list.length === cur.length && list.every((x, i) => x === cur[i])) return end();
        saveValue(el, tableId, rid, col, list.length ? ["L", ...list] : null);
      },
      end,
    );
    return;
  }
  if (t === "Choice" || t === "Ref") {
    const items =
      t === "Choice"
        ? [
            { v: "", t: "" },
            ...(opts.choices || []).filter((c) => allowed(c)).map((c) => ({ v: c, t: c, chip: true })),
          ]
        : [
            { v: 0, t: "" },
            ...[...(S.byId[refTarget(col)]?.values() || [])]
              .filter((r) => allowed(r))
              .map((r) => ({ v: r.id, t: refText(col, r.id, 0) }))
              .sort((a, b) => COLL.compare(a.t, b.t)),
          ];
    S.editing = true;
    const end = () => {
      S.editing = false;
      if (S.pendingRender) {
        S.pendingRender = false;
        scheduleRender();
      }
    };
    openPicker(
      el,
      items,
      v ?? (t === "Ref" ? 0 : ""),
      t === "Choice" ? opts : null,
      (nv) => {
        S.editing = false;
        if (nv === (v ?? (t === "Ref" ? 0 : ""))) return end();
        saveValue(el, tableId, rid, col, nv);
      },
      end,
    );
    return;
  }
  let input;
  const pad = (n) => String(n).padStart(2, "0");
  if (t === "Choice") {
    input = document.createElement("select");
    input.innerHTML =
      `<option value=""></option>` +
      (opts.choices || []).map((c) => `<option ${c === v ? "selected" : ""}>${esc(c)}</option>`).join("");
  } else if (t === "Ref") {
    const target = refTarget(col),
      items = [...(S.byId[target]?.values() || [])]
        .map((r) => ({ id: r.id, t: refText(col, r.id, 0) }))
        .sort((a, b) => COLL.compare(a.t, b.t));
    input = document.createElement("select");
    input.innerHTML =
      `<option value="0"></option>` +
      items.map((x) => `<option value="${x.id}" ${x.id === v ? "selected" : ""}>${esc(x.t)}</option>`).join("");
  } else if (t === "Date") {
    input = document.createElement("input");
    input.type = "date";
    if (typeof v === "number") input.value = new Date(v * 1000).toISOString().slice(0, 10);
  } else if (t === "DateTime") {
    input = document.createElement("input");
    input.type = "datetime-local";
    if (typeof v === "number") {
      const d = new Date(v * 1000);
      input.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  } else {
    const multi =
      (t === "Text" || t === "Any") &&
      (opts.wrap || String(v ?? "").includes("\n") || String(v ?? "").length > 60);
    input = document.createElement(multi ? "textarea" : "input");
    if (!multi) {
      input.type = "text";
      if (t === "Numeric" || t === "Int") input.inputMode = "decimal";
    }
    input.value = isErr(v) || v == null ? "" : String(v);
  }
  input.className = "ed-input";
  const old = el.innerHTML;
  el.innerHTML = "";
  el.append(input);
  S.editing = true;
  let done = false;
  const finish = (commit) => {
    if (done) return;
    done = true;
    S.editing = false;
    if (!commit) {
      el.innerHTML = old;
      if (S.pendingRender) {
        S.pendingRender = false;
        scheduleRender();
      }
      return;
    }
    let nv;
    const raw = input.value;
    if (t === "Numeric" || t === "Int") {
      nv = raw.trim() === "" ? null : toNum(raw);
      if (raw.trim() !== "" && !Number.isFinite(nv)) {
        status(`« ${raw} » n'est pas un nombre`, true);
        el.innerHTML = old;
        return;
      }
      if (t === "Int" && nv !== null) nv = Math.round(nv);
    } else if (t === "Ref") nv = Number(raw) || 0;
    else if (t === "Date")
      nv = raw ? Date.UTC(...raw.split("-").map((x, i) => Number(x) - (i === 1 ? 1 : 0))) / 1000 : null;
    else if (t === "DateTime") nv = raw ? new Date(raw).getTime() / 1000 : null;
    else nv = raw;
    if ((nv ?? "") === (v ?? "")) {
      el.innerHTML = old;
      if (S.pendingRender) {
        S.pendingRender = false;
        scheduleRender();
      }
      return;
    }
    saveValue(el, tableId, rid, col, nv);
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    } else if (e.key === "Enter" && !(input.tagName === "TEXTAREA" && e.shiftKey)) {
      e.preventDefault();
      finish(true);
    }
  });
  input.addEventListener("blur", () => finish(true));
  if (input.tagName === "SELECT") input.addEventListener("change", () => finish(true));
  input.addEventListener("click", (e) => e.stopPropagation());
  input.focus();
  if (input.select && input.tagName === "INPUT" && input.type === "text") input.select();
  if (input.tagName === "SELECT") {
    try {
      input.showPicker?.();
    } catch {
      /* navigateur sans showPicker : la liste s'ouvre au clic suivant */
    }
  }
}
/* Liste déroulante avec recherche, affichée par-dessus la page */
function openPicker(anchor, items, current, choiceOpts, onPick, onCancel) {
  document.querySelector(".picker")?.remove();
  const box = document.createElement("div");
  box.className = "picker";
  box.innerHTML = `<input class="ed-input" type="text" placeholder="Rechercher…"><ul role="listbox"></ul>`;
  document.body.append(box);
  const inp = box.querySelector("input"),
    ul = box.querySelector("ul");
  const r = anchor.getBoundingClientRect();
  box.style.minWidth = `${Math.max(220, r.width)}px`;
  box.style.left = `${Math.max(4, Math.min(r.left, window.innerWidth - box.offsetWidth - 4))}px`;
  const below = window.innerHeight - r.bottom > 220 || r.top < 220;
  box.style.top = below ? `${r.bottom + 2}px` : "";
  box.style.bottom = below ? "" : `${window.innerHeight - r.top + 2}px`;
  let shown = [],
    idx = 0,
    closed = false;
  const label = (x) =>
    x.t === "" ? '<span class="pk-empty">(vide)</span>' : x.chip && choiceOpts ? chip(x.t, choiceOpts) : esc(x.t);
  const draw = () => {
    const q = inp.value.trim().toLowerCase();
    shown = items.filter((x) => !q || x.t.toLowerCase().includes(q)).slice(0, 500);
    if (idx >= shown.length) idx = Math.max(0, shown.length - 1);
    ul.innerHTML =
      shown
        .map(
          (x, i) =>
            `<li role="option" data-i="${i}" class="${i === idx ? "on" : ""}${x.v === current ? " cur" : ""}">${label(x)}</li>`,
        )
        .join("") || '<li class="pk-none">Aucun résultat</li>';
    ul.querySelector("li.on")?.scrollIntoView({ block: "nearest" });
  };
  const close = (pick) => {
    if (closed) return;
    closed = true;
    document.removeEventListener("mousedown", outside, true);
    box.remove();
    pick ? onPick(pick.v) : onCancel();
  };
  const outside = (e) => {
    if (!box.contains(e.target)) close(null);
  };
  inp.addEventListener("input", () => {
    idx = 0;
    draw();
  });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      idx = Math.min(shown.length - 1, idx + 1);
      draw();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      idx = Math.max(0, idx - 1);
      draw();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (shown[idx]) close(shown[idx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(null);
    }
  });
  ul.addEventListener("mouseover", (e) => {
    // la ligne sous le pointeur devient la ligne présélectionnée
    const li = e.target.closest("[data-i]");
    if (!li) return;
    const i = Number(li.dataset.i);
    if (i === idx) return;
    ul.querySelector("li.on")?.classList.remove("on");
    li.classList.add("on");
    idx = i;
  });
  ul.addEventListener("mousedown", (e) => {
    const li = e.target.closest("[data-i]");
    if (li) {
      e.preventDefault();
      close(shown[Number(li.dataset.i)]);
    }
  });
  setTimeout(() => document.addEventListener("mousedown", outside, true), 0);
  idx = Math.max(
    0,
    items.findIndex((x) => x.v === current),
  );
  draw();
  inp.focus();
}
/* Liste à choix multiples (Référence multiple, Liste de choix) */
function openMultiPicker(anchor, items, current, choiceOpts, onDone, onCancel) {
  document.querySelector(".picker")?.remove();
  const chosen = [...current]; // ordre conservé : valeurs existantes puis nouvelles
  const box = document.createElement("div");
  box.className = "picker multi";
  box.innerHTML = `<input class="ed-input" type="text" placeholder="Rechercher…"><ul role="listbox" aria-multiselectable="true"></ul>
    <div class="pk-foot"><span class="pk-count"></span><button class="btn" data-pkno>Annuler</button><button class="btn primary" data-pkok>Valider</button></div>`;
  document.body.append(box);
  const inp = box.querySelector("input"),
    ul = box.querySelector("ul"),
    cnt = box.querySelector(".pk-count");
  const r = anchor.getBoundingClientRect();
  box.style.minWidth = `${Math.max(260, r.width)}px`;
  box.style.left = `${Math.max(4, Math.min(r.left, window.innerWidth - box.offsetWidth - 4))}px`;
  const below = window.innerHeight - r.bottom > 280 || r.top < 280;
  box.style.top = below ? `${r.bottom + 2}px` : "";
  box.style.bottom = below ? "" : `${window.innerHeight - r.top + 2}px`;
  let shown = [],
    idx = 0,
    closed = false;
  const label = (x) => (x.chip && choiceOpts ? chip(x.t, choiceOpts) : esc(x.t || "(vide)"));
  const draw = () => {
    const q = inp.value.trim().toLowerCase();
    // valeurs cochées en tête, puis les autres
    shown = [...items.filter((x) => chosen.includes(x.v)), ...items.filter((x) => !chosen.includes(x.v))]
      .filter((x) => !q || x.t.toLowerCase().includes(q))
      .slice(0, 500);
    if (idx >= shown.length) idx = Math.max(0, shown.length - 1);
    ul.innerHTML =
      shown
        .map(
          (
            x,
            i,
          ) => `<li role="option" data-i="${i}" class="${i === idx ? "on" : ""}" aria-selected="${chosen.includes(x.v)}">
<input type="checkbox" tabindex="-1" ${chosen.includes(x.v) ? "checked" : ""}> ${label(x)}</li>`,
        )
        .join("") || '<li class="pk-none">Aucun résultat</li>';
    cnt.textContent = `${chosen.length} sélectionné${chosen.length > 1 ? "s" : ""}`;
    ul.querySelector("li.on")?.scrollIntoView({ block: "nearest" });
  };
  const toggle = (x) => {
    const k = chosen.indexOf(x.v);
    k >= 0 ? chosen.splice(k, 1) : chosen.push(x.v);
    draw();
  };
  const close = (ok) => {
    if (closed) return;
    closed = true;
    document.removeEventListener("mousedown", outside, true);
    box.remove();
    ok ? onDone(chosen) : onCancel();
  };
  const outside = (e) => {
    if (!box.contains(e.target)) close(true);
  }; // clic à côté = valider, comme dans Grist
  inp.addEventListener("input", () => {
    idx = 0;
    draw();
  });
  inp.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      idx = Math.min(shown.length - 1, idx + 1);
      draw();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      idx = Math.max(0, idx - 1);
      draw();
    } else if (e.key === " " && !inp.value) {
      e.preventDefault();
      if (shown[idx]) toggle(shown[idx]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey || !shown[idx]) close(true);
      else toggle(shown[idx]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(false);
    }
  });
  ul.addEventListener("mousedown", (e) => {
    const li = e.target.closest("[data-i]");
    if (li) {
      e.preventDefault();
      idx = Number(li.dataset.i);
      toggle(shown[idx]);
    }
  });
  ul.addEventListener("mouseover", (e) => {
    const li = e.target.closest("[data-i]");
    if (!li) return;
    ul.querySelector("li.on")?.classList.remove("on");
    li.classList.add("on");
    idx = Number(li.dataset.i);
  });
  box.querySelector("[data-pkok]").addEventListener("click", () => close(true));
  box.querySelector("[data-pkno]").addEventListener("click", () => close(false));
  setTimeout(() => document.addEventListener("mousedown", outside, true), 0);
  draw();
  inp.focus();
}
// saveValue — Enregistre une valeur dans Grist (UpdateRecord). Les règles d'accès de Grist peuvent refuser.
async function saveValue(el, tableId, rid, col, value) {
  el.classList.add("saving");
  try {
    await grist.docApi.applyUserActions([["UpdateRecord", tableId, rid, { [col.colId]: value }]]);
    // données à relire : la table modifiée et ses tables de synthèse (les formules en dépendent)
    const ref = col.parentId;
    for (const [id, t] of S.meta.tables)
      if (id === ref || t.summarySourceTable === ref) {
        delete S.cache[t.tableId];
        delete S.byId[t.tableId];
      }
    status("");
  } catch (e) {
    const msg = String(e?.message || e);
    status(
      /access|acc[eè]s|permission|denied|blocked/i.test(msg)
        ? `Modification refusée par les règles d'accès (${col.label || col.colId})`
        : `Enregistrement impossible : ${msg}`,
      true,
    );
  }
  S.pendingRender = false;
  scheduleRender();
}
// ficheCell — HTML d'un champ dans une fiche (libellé + valeur).
// Liste de fiches (renderCards) : mêmes emplacements d'une fiche à l'autre — un champ vide masqué garde sa place
// (case vide invisible) et un champ est « long » (pleine largeur) pour toutes les fiches ou pour aucune.
// fwStyle — Largeur fixe d'un champ dans une liste de fiches sans disposition Grist (identique d'une fiche à l'autre).
const fwStyle = (f) => (ficheCtx?.widths?.has(f) ? ` style="flex:0 0 ${ficheCtx.widths.get(f)}"` : "");
let ficheCtx = null,
  ficheNoLab = false; // noms des champs masqués (option du bloc) : le nom reste en infobulle
function ficheCell(f, row, showEmpty = false, ed = false) {
  const v = row[f.colId];
  if (S.cfg.hideEmptyFields && !showEmpty && !(ed && isEditableCol(f.col)) && isEmpty(v))
    return ficheCtx && !ficheCtx.allEmpty.has(f) ? `<div class="vide${ficheCtx.longF.has(f) ? " long" : ""}"${fwStyle(f)} aria-hidden="true"></div>` : "";
  const t = textOf(f.col, f.opts, v);
  const long = ficheCtx ? ficheCtx.longF.has(f) : t.length > 60 || t.includes("\n");
  const css = cellStyle(f, row);
  return `<div class="${long ? "long" : ""}"${fwStyle(f)}${ficheNoLab ? ` title="${esc(f.label)}"` : ""}><dt${descAttr(f)}>${esc(f.label)}${infoMark(f)}</dt><dd class="${isNumCol(f.col) ? "num" : ""}${css.includes("background") ? " styled" : ""}" style="${css}"${edAttr(ed, f, row)}>${htmlOf(f, typeof v === "string" ? v.replace(/\s+$/, "") : v)}</dd></div>`;
}
/* Disposition de la fiche telle que construite dans Grist (layoutSpec) :
   niveaux alternés vertical / horizontal, feuilles = champs de la vue */
function layoutHTML(node, depth, byField, row, used, se, ed) {
  if (!node || typeof node !== "object") return "";
  if (node.leaf !== undefined && node.leaf !== null) {
    const f = byField.get(node.leaf);
    if (!f) return "";
    used.add(f);
    return ficheCell(f, row, se, ed);
  }
  const parts = (node.children || [])
    .map((c) => layoutHTML(c, depth + 1, byField, row, used, se, ed))
    .filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  return `<div class="${depth % 2 === 0 ? "lv" : "lh"}">${parts.join("")}</div>`;
}
// ficheHTML — HTML d'une fiche complète, en respectant la disposition de la vue Grist si elle existe.
function ficheHTML(info, row, ctx = null) {
  ficheCtx = ctx;
  try {
    return ficheHTMLIn(info, row);
  } finally {
    ficheCtx = null;
    ficheNoLab = false;
  }
}
function ficheHTMLIn(info, row) {
  const se = !!S.cfg.blocks.find((x) => x.id === info.secId)?.showEmpty; // option du bloc : afficher les champs vides
  ficheNoLab = !!S.cfg.blocks.find((x) => x.id === info.secId)?.hideLabels; // option : noms des champs masqués
  const nl = ficheNoLab ? " nolabels" : "";
  const ed = blockEditable(info.secId);
  const style = styleCss(rowStyle(info, row));
  const spec = parseJSON(info.sec.layoutSpec, null);
  if (spec && (spec.children || spec.leaf !== undefined)) {
    const byField = new Map(info.fields.map((f) => [f.field?.id, f]));
    const used = new Set();
    let html = layoutHTML(spec, 0, byField, row, used, se, ed);
    const rest = info.fields
      .filter((f) => !used.has(f))
      .map((f) => ficheCell(f, row, se, ed))
      .join(""); // champs absents de la disposition
    if (rest) html += `<div class="lh wrap">${rest}</div>`;
    return `<dl class="fiche lay${nl}" style="${style}">${html || '<div class="msg">Aucun champ renseigné</div>'}</dl>`;
  }
  const items = info.fields.map((f) => ficheCell(f, row, se, ed)).join("");
  return `<dl class="fiche${nl}" style="${style}">${items || '<div class="msg">Aucun champ renseigné</div>'}</dl>`;
}
// renderSingle — Affiche une vue fiche (un enregistrement, avec flèches précédent/suivant).
function renderSingle(info, rows, body, selId, el) {
  const idx = Math.max(
    0,
    rows.findIndex((r) => r.id === selId),
  );
  const row = S.byId[info.tableId]?.get(selId) || rows[idx];
  if (!row) {
    body.innerHTML = '<div class="msg">Aucun enregistrement</div>';
    return;
  }
  body.className = "bb pad";
  body.innerHTML = ficheHTML(info, row);
  if (rows.length > 1 && !info.sec.linkSrcSectionRef) {
    // une fiche pilotée par un autre widget ne se parcourt pas
    const nav = document.createElement("span");
    nav.className = "nav";
    nav.innerHTML = `<button data-nav="-1" data-sec="${info.secId}">◀</button>${idx + 1}/${rows.length}<button data-nav="1" data-sec="${info.secId}">▶</button>`;
    el.querySelector(".badge").replaceWith(nav);
  }
}
// renderCards — Affiche une liste de fiches (vue « fiches » de Grist, ou fiche en mode liste).
function renderCards(info, rows, body, selId, jobs = []) {
  const FIRST = 60,
    CHUNK = 200;
  // champs « longs » : décidés une fois pour toute la liste (au moins une valeur longue dans les lignes)
  const longF = new Set(
    info.fields.filter((f) =>
      rows.some((r) => {
        const t = textOf(f.col, f.opts, r[f.colId]);
        return t.length > 60 || t.includes("\n");
      }),
    ),
  );
  const allEmpty = new Set(info.fields.filter((f) => rows.every((r) => isEmpty(r[f.colId])))); // champ vide partout : retiré
  // sans disposition Grist : chaque champ a la même largeur dans toutes les fiches, celle de sa plus longue valeur
  // (et de son nom s'il est affiché), entre 6 et 40 caractères ; les champs « longs » prennent toute la ligne
  const spec = parseJSON(info.sec.layoutSpec, null);
  const widths = new Map();
  if (!(spec && (spec.children || spec.leaf !== undefined))) {
    const noLab = !!S.cfg.blocks.find((x) => x.id === info.secId)?.hideLabels;
    // largeur mesurée dans la police de la page (canevas), plus juste qu'un nombre de caractères
    const ctx2d = (renderCards.cv ??= document.createElement("canvas")).getContext("2d");
    const ff = getComputedStyle(document.body).fontFamily;
    const measure = (txt, px) => {
      ctx2d.font = `${px}px ${ff}`;
      return ctx2d.measureText(txt).width;
    };
    for (const f of info.fields) {
      if (longF.has(f) || allEmpty.has(f)) continue;
      let w = noLab ? 0 : measure(String(f.label || ""), 11);
      for (const r of rows.length > 2000 ? rows.slice(0, 2000) : rows)
        w = Math.max(w, measure(textOf(f.col, f.opts, r[f.colId]), 13));
      widths.set(f, `${Math.round(Math.min(360, Math.max(40, w + 6)))}px`);
    }
  }
  const card = (r) => {
    const txt = info.fields
      .map((f) => textOf(f.col, f.opts, r[f.colId]))
      .join(" ")
      .toLowerCase();
    return `<div class="mini ${r.id === selId ? "sel" : ""}" data-row="${r.id}" data-text="${esc(txt)}">${ficheHTML(info, r, { longF, allEmpty, widths })}</div>`;
  };
  body.innerHTML = `<div class="cartes">${rows.slice(0, FIRST).map(card).join("")}</div>`;
  if (rows.length > FIRST)
    jobs.push(() => {
      // les fiches suivantes arrivent par paquets
      const box = body.querySelector(".cartes");
      let i = FIRST;
      const step = () => {
        if (!box.isConnected) return;
        box.insertAdjacentHTML(
          "beforeend",
          rows
            .slice(i, i + CHUNK)
            .map(card)
            .join(""),
        );
        i += CHUNK;
        if (S.search[info.secId]) applySearch(info.secId);
        if (i < rows.length) setTimeout(step, 0);
      };
      setTimeout(step, 0);
    });
  // la fiche sélectionnée reste visible
  jobs.push(() => {
    // sans faire défiler la page elle-même
    const box = body.querySelector(".cartes"),
      el = box?.querySelector(".mini.sel");
    if (!el || box.scrollHeight <= box.clientHeight) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = top - 8;
  });
}

/* ---------- Couleurs personnalisées des camemberts (option de bloc, enregistrée dans W_Composition) ----------
   pieColorMap : correspondance « catégorie = #code », une par ligne (ou séparées par « ; ») ;
   pieColorCol : colonne de la table contenant un code hexadécimal par ligne (ex. formule $Reseau.Couleur) ;
   pieColorDefault : couleur des catégories sans code (vide : palette habituelle).
   Priorité : correspondance, puis colonne, puis couleur de repli. */
// hexColor — Code couleur hexadécimal normalisé (« 000091 », « #009 »… → « #000091 », « #009 »), ou "" s'il est invalide.
function hexColor(v) {
  const m = /^\s*#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})\s*$/i.exec(String(v ?? ""));
  return m ? `#${m[1]}` : "";
}
const pieKey = (v) => String(v ?? "").trim().toLowerCase();
// pieColorMapOf — Lit la correspondance saisie : Map(catégorie en minuscules → #code).
function pieColorMapOf(txt) {
  const map = new Map();
  for (const line of String(txt || "").split(/[\n;]+/)) {
    const i = line.lastIndexOf("=");
    if (i < 1) continue;
    const c = hexColor(line.slice(i + 1));
    if (c) map.set(pieKey(line.slice(0, i)), c);
  }
  return map;
}
const pieCustom = (b) => !!(b && (b.pieColorCol || String(b.pieColorMap || "").trim() || hexColor(b.pieColorDefault)));
// pieColors — Couleur de chaque catégorie (labels), d'après la configuration du bloc.
// labelOfRow(r) donne la catégorie d'une ligne (pour lire la colonne de codes).
function pieColors(b, labels, rows, labelOfRow, fallback = (j) => PALETTE[j % PALETTE.length]) {
  const map = pieColorMapOf(b.pieColorMap),
    fromCol = new Map();
  if (b.pieColorCol)
    for (const r of rows) {
      const k = pieKey(labelOfRow(r)),
        c = hexColor(r[b.pieColorCol]);
      if (c && !fromCol.has(k)) fromCol.set(k, c);
    }
  const dflt = hexColor(b.pieColorDefault);
  return labels.map((l, j) => map.get(pieKey(l)) || fromCol.get(pieKey(l)) || dflt || fallback(j));
}

// renderChart — Affiche un graphique natif de Grist avec Chart.js (barres, lignes, secteurs, aires…).
function renderChart(info, rows, body, jobs) {
  const type = info.sec.chartType || "bar",
    o = info.opts,
    f = info.fields;
  const pie = type === "pie" || type === "donut";
  const multi = !!o.multiseries && !pie;
  if (f.length < (multi ? 3 : 2)) {
    body.innerHTML = '<div class="msg">Graphique incomplet (colonnes manquantes)</div>';
    return;
  }
  const [a, b, ...rest] = f;
  const groupF = multi ? a : null,
    xF = multi ? b : a,
    yFs = multi ? rest : [b, ...rest];
  const num = (v) => (typeof v === "number" ? v : Number(v) || 0);

  body.innerHTML = '<div class="chart-box"><canvas></canvas></div>';
  const canvas = body.querySelector("canvas");
  let data;

  if (type === "scatter") {
    data = {
      datasets: yFs.map((y, i) => ({
        label: y.label,
        backgroundColor: PALETTE[i % PALETTE.length],
        data: rows.map((r) => ({ x: num(r[xF.colId]), y: num(r[y.colId]) })),
      })),
    };
  } else {
    const xl = rows.map((r) => textOf(xF.col, xF.opts, r[xF.colId]) || "(vide)");
    const gl = multi ? rows.map((r) => textOf(groupF.col, groupF.opts, r[groupF.colId]) || "(vide)") : null;
    const labels = [...new Set(xl)];
    const blk = S.cfg.blocks.find((x) => x.id === info.secId);
    const custom = pieCustom(blk);
    const series = [];
    if (multi) {
      for (const g of new Set(gl))
        for (const y of yFs) series.push({ label: yFs.length > 1 ? `${g} – ${y.label}` : g, y, g });
    } else {
      for (const y of pie ? yFs.slice(0, 1) : yFs) series.push({ label: y.label, y, g: null });
    }
    // couleurs choisies (encadré « Couleurs du graphique ») : une couleur par catégorie pour un camembert ou un
    // histogramme à une seule série, sinon une couleur par série (valeur du regroupement ou nom de la colonne)
    const perCat = pie || (custom && series.length === 1 && type === "bar");
    const catCols = perCat
      ? custom
        ? pieColors(blk, labels, rows, (r) => textOf(xF.col, xF.opts, r[xF.colId]) || "(vide)", pie ? undefined : () => PALETTE[0])
        : labels.map((_, j) => PALETTE[j % PALETTE.length])
      : null;
    const map = custom ? pieColorMapOf(blk.pieColorMap) : null;
    const serieColor = (s, i) => {
      if (custom) {
        const c =
          map.get(pieKey(s.label)) ||
          (s.g !== null && map.get(pieKey(s.g))) ||
          map.get(pieKey(s.y.label)) ||
          (blk.pieColorCol && s.g !== null && hexColor(rows.find((r, k) => gl[k] === s.g && hexColor(r[blk.pieColorCol]))?.[blk.pieColorCol])) ||
          hexColor(blk.pieColorDefault);
        if (c) return c;
      }
      return PALETTE[i % PALETTE.length];
    };
    const datasets = series.map((s, i) => {
      const sums = new Map(labels.map((l) => [l, 0]));
      rows.forEach((r, k) => {
        if (s.g === null || gl[k] === s.g) sums.set(xl[k], sums.get(xl[k]) + num(r[s.y.colId]));
      });
      const c = serieColor(s, i);
      return {
        label: s.label,
        data: labels.map((l) => sums.get(l)),
        backgroundColor: catCols || (type === "area" ? c + "55" : c),
        borderColor: pie ? "#fff" : catCols || c,
        fill: type === "area",
        tension: 0.2,
        pointRadius: type === "line" ? 2 : 0,
      };
    });
    data = { labels, datasets };
  }
  const stacked = !!o.stacked;
  const chartType =
    { pie: "pie", donut: "doughnut", line: "line", area: "line", scatter: "scatter", kaplan_meier: "line" }[
      type
    ] || "bar";
  jobs.push(() => {
    S.charts.push(
      new Chart(canvas, {
        type: chartType,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          indexAxis: o.orientation === "h" ? "y" : "x",
          plugins: {
            legend: {
              display: pie || data.datasets.length > 1,
              position: "bottom",
              labels: { boxWidth: 10, font: { size: 11 } },
            },
          },
          scales: pie
            ? {}
            : {
                x: { stacked, ticks: { font: { size: 11 } } },
                y: { stacked, beginAtZero: true, ticks: { font: { size: 11 } } },
              },
        },
      }),
    );
  });
}

/* ---------- Carte (widget « Map » de Grist, Leaflet) ---------- */
/* Bibliothèques chargées à la demande : versions figées + empreinte d'intégrité (SRI).
   Si le fichier servi par le CDN a été modifié, le navigateur refuse de l'exécuter. */
const LIBS = {
  leafletCss: [
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
    "sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H",
  ],
  leaflet: [
    "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
    "sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH",
  ],
  plotly: [
    "https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.35.2/plotly.min.js",
    "sha384-cCVCZkAjYNxaYKbM8lsArLznDF/SvMFr1jcZrvOpSTCa0W40ZAdLzHCEulnUa5i7",
  ],
  clip: [
    "https://cdn.jsdelivr.net/npm/polygon-clipping@0.15.7/dist/polygon-clipping.umd.min.js",
    "sha384-2gzcIyrtB96QDjrxsFcJ1O461CWiXJ8fiHgIkJLwTgy4WTktHXTOXt4dviXz9Y5Q",
  ],
  marked: [
    "https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js",
    "sha384-/TQbtLCAerC3jgaim+N78RZSDYV7ryeoBCVqTuzRrFec2akfBkHS7ACQ3PQhvMVi",
  ],
  purify: [
    "https://cdn.jsdelivr.net/npm/dompurify@3.2.6/dist/purify.min.js",
    "sha384-JEyTNhjM6R1ElGoJns4U2Ln4ofPcqzSsynQkmEc/KGy6336qAZl70tDLufbkla+3",
  ],
};
// loadLib — Charge un script ou une feuille de style externe avec son empreinte d'intégrité (SRI).
function loadLib([src, integrity], name, css = false) {
  return new Promise((res, rej) => {
    const el = document.createElement(css ? "link" : "script");
    if (css) {
      el.rel = "stylesheet";
      el.href = src;
    } else el.src = src;
    el.integrity = integrity;
    el.crossOrigin = "anonymous";
    el.onload = res;
    el.onerror = () => {
      el.remove();
      rej(new Error(`${name} n'a pas pu être chargé`));
    };
    document.head.append(el);
  });
}
let leafletP = null;
// loadLeaflet — Charge Leaflet (cartes) à la première carte affichée.
function loadLeaflet() {
  return (leafletP ??= (
    window.L
      ? Promise.resolve()
      : Promise.all([
          loadLib(LIBS.leafletCss, "Leaflet (styles)", true).catch(() => {}),
          loadLib(LIBS.leaflet, "Leaflet"),
        ])
  ).catch((e) => {
    leafletP = null;
    throw e;
  }));
}
/* Nettoyage du HTML des étiquettes (DOMPurify) : mise en forme conservée, scripts et gestionnaires retirés.
   Sans DOMPurify, on n'affiche que le texte (DOMParser n'exécute rien). */
let purifyP = null;
// loadPurify — Charge DOMPurify (nettoyage du HTML des étiquettes de carte).
const loadPurify = () =>
  (purifyP ??= (window.DOMPurify ? Promise.resolve() : loadLib(LIBS.purify, "DOMPurify")).catch(() => {}));
// safeHtml — HTML nettoyé (mise en forme conservée, scripts retirés). Sans DOMPurify : texte seul.
function safeHtml(html) {
  if (window.DOMPurify)
    return DOMPurify.sanitize(String(html), {
      FORBID_TAGS: ["style", "form", "input", "button", "iframe", "object", "embed"],
      FORBID_ATTR: ["srcset"],
    });
  return esc(new DOMParser().parseFromString(String(html), "text/html").body.textContent || "");
}
// looksHtml — Vrai si un texte contient des balises HTML.
const looksHtml = (t) => /<[a-z][\s\S]*>/i.test(String(t || ""));
// mapSpec — Lit la configuration d'un widget carte Grist : colonnes Nom/Latitude/Longitude, fond de carte. null si ce n'est pas une carte.
function mapSpec(sec) {
  const cv = parseJSON(parseJSON(sec.options).customView, null);
  if (!cv) return null;
  const mapping = parseJSON(cv.columnsMapping, {}) || {};
  const pick = (k) => {
    const v = mapping[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const isMap = /map/i.test(cv.url || "") || ("Latitude" in mapping && "Longitude" in mapping);
  if (!isMap) return null;
  const wo = parseJSON(cv.widgetOptions, {}) || {};
  return {
    name: pick("Name"),
    lat: pick("Latitude"),
    lng: pick("Longitude"),
    tiles: wo.mapSource || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: wo.mapCopyright || "&copy; contributeurs OpenStreetMap",
  };
}
// isMapSection — Vrai si la vue est un widget carte.
const isMapSection = (sec) => !!mapSpec(sec);
/* ---------- Widget Markdown de Grist : affichage seul (pas d'édition), taille du texte réglable ---------- */
// mdSpec — Colonne « Content » du widget Markdown (mapping par colId ou numéro de colonne), sinon null.
function mdSpec(sec) {
  const cv = parseJSON(parseJSON(sec?.options).customView, null);
  if (!cv) return null;
  // widget Markdown de Grist : reconnu par son adresse (ancienne installation) ou, depuis la galerie de widgets,
  // par son identifiant (« @gristlabs/widget-markdown », sans adresse) ; à défaut, par son unique champ « Content »
  const mapping = parseJSON(cv.columnsMapping, {}) || {};
  const ids = [cv.url, cv.widgetId, cv.pluginId, cv.widgetDef?.widgetId, cv.widgetDef?.name, cv.widgetDef?.url].filter(Boolean).join(" ");
  const keys = Object.keys(mapping);
  if (!/markdown/i.test(ids) && !(keys.length === 1 && keys[0] === "Content" && !/plotly|chart/i.test(ids))) return null;
  const v = mapping.Content;
  return { content: Array.isArray(v) ? v[0] : v };
}
const isMarkdownSection = (sec) => !!mdSpec(sec);
const MD_SIZES = [
  ["", "normale (13 px)"],
  [11, "petite (11 px)"],
  [12, "12 px"],
  [14, "14 px"],
  [16, "grande (16 px)"],
  [18, "18 px"],
  [20, "très grande (20 px)"],
  [24, "24 px"],
];
// renderMarkdown — Texte Markdown de la ligne sélectionnée (comme le widget Grist), mis en forme par marked puis
// nettoyé par DOMPurify. Les liens s'ouvrent dans un nouvel onglet.
async function renderMarkdown(info, rows, body, selId, b) {
  const cols = S.meta.colsByTable.get(info.sec.tableRef) || [];
  const col =
    colByKey(cols, mdSpec(info.sec)?.content) ||
    info.fields.find((f) => ["Text", "Any"].includes(baseType(f.col)))?.col ||
    cols.find((c) => baseType(c) === "Text" && !c.colId.startsWith("gristHelper_"));
  const row = rows.find((r) => r.id === selId) || rows[0];
  if (!col || !row) {
    body.innerHTML = `<div class="msg">${col ? "Aucun texte à afficher" : "Widget Markdown : colonne du texte introuvable"}</div>`;
    return;
  }
  await Promise.all([
    window.marked ? null : loadLib(LIBS.marked, "marked"),
    window.DOMPurify ? null : loadLib(LIBS.purify, "DOMPurify"),
  ]);
  const size = Number(b.mdSize) || 0;
  body.innerHTML = `<div class="mdview"${size ? ` style="font-size:${size}px"` : ""}>${DOMPurify.sanitize(marked.parse(String(row[col.colId] ?? "")))}</div>`;
  body.querySelectorAll(".mdview a[href]").forEach((a) => Object.assign(a, { target: "_blank", rel: "noopener" }));
}
/* Le mapping d'un widget personnalisé est stocké par numéro de colonne (colRef) ou par colId */
const colByKey = (cols, k) =>
  k == null || k === ""
    ? null
    : cols.find((c) => c.colId === k) || cols.find((c) => c.id === Number(k) && /^\d+$/.test(String(k))) || null;
// l93ToWgs — Conversion Lambert 93 → latitude/longitude (formules IGN).
function l93ToWgs(x, y) {
  // Lambert 93 → latitude/longitude (formules IGN)
  const n = 0.725607765,
    c = 11754255.426,
    xs = 700000,
    ys = 12655612.05,
    e = 0.08181919106,
    lon0 = (3 * Math.PI) / 180;
  const dx = x - xs,
    dy = y - ys,
    R = Math.hypot(dx, dy),
    g = Math.atan(dx / -dy);
  const lon = lon0 + g / n,
    li = -Math.log(Math.abs(R / c)) / n;
  let phi = 2 * Math.atan(Math.exp(li)) - Math.PI / 2;
  for (let i = 0; i < 12; i++)
    phi =
      2 * Math.atan(Math.pow((1 + e * Math.sin(phi)) / (1 - e * Math.sin(phi)), e / 2) * Math.exp(li)) -
      Math.PI / 2;
  return [(phi * 180) / Math.PI, (lon * 180) / Math.PI];
}
// toNum — Nombre depuis une valeur ou un texte (« 48,39 » accepté).
const toNum = (v) =>
  typeof v === "number"
    ? v
    : Number(
        String(v ?? "")
          .trim()
          .replace(/\s/g, "")
          .replace(",", "."),
      );
// toLatLng — Coordonnées exploitables : détecte les colonnes inversées et le Lambert 93.
function toLatLng(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || (!a && !b)) return null;
  if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return [a, b];
  if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return [b, a]; // colonnes inversées
  if (b > 1e5 && b < 1.4e6 && a > 6e6 && a < 7.2e6) return l93ToWgs(b, a); // Lambert 93 (Y, X)
  if (a > 1e5 && a < 1.4e6 && b > 6e6 && b < 7.2e6) return l93ToWgs(a, b); // Lambert 93 (X, Y)
  return null;
}
/* Contours des communes (API Découpage administratif, geo.api.gouv.fr) */
function communeCode(col, v) {
  const ok = (x) => /^(\d{5}|2[AB]\d{3})$/i.test(String(x ?? "").trim());
  if (isErr(v) || isEmpty(v)) return null;
  const t = baseType(col);
  if (t === "Ref" || t === "RefList") {
    const id = isList(v) ? v[1] : v;
    const row = S.byId[refTarget(col)]?.get(id);
    if (!row) return null;
    const keys = Object.keys(row);
    const pref = keys.filter((k) => /insee|code.?com|cog|depcom/i.test(k)).concat(keys); // colonnes « code » d'abord
    for (const k of pref) if (ok(row[k])) return String(row[k]).trim().toUpperCase();
    // code porté par une référence de la table cible (ex. Commune → REF_COG)
    const tcols =
      S.meta.colsByTable.get([...S.meta.tables.values()].find((t) => t.tableId === refTarget(col))?.id) || [];
    for (const c of tcols.filter(
      (c) => baseType(c) === "Ref" && /insee|code|cog|commune/i.test(c.colId + " " + (c.label || "")),
    )) {
      const sub = S.byId[refTarget(c)]?.get(row[c.colId]);
      if (sub)
        for (const k of Object.keys(sub))
          if (/insee|code.?com|cog|depcom/i.test(k) && ok(sub[k])) return String(sub[k]).trim().toUpperCase();
    }
    return null;
  }
  const sv = String(v).trim();
  if (ok(sv)) return sv.toUpperCase();
  if (/^\d{4}$/.test(sv)) return "0" + sv; // code numérique ayant perdu son zéro initial
  return null;
}
// depOf — Département d'un code INSEE (2 caractères, 3 pour l'outre-mer).
const depOf = (code) => (code.startsWith("97") ? code.slice(0, 3) : code.slice(0, 2));
// fetchCommuneShapes — Contours des communes d'un département (geo.api.gouv.fr), avec leur EPCI. Mis en cache.
function fetchCommuneShapes(dep) {
  S.geoCache[dep] ??= fetch(
    `https://geo.api.gouv.fr/departements/${dep}/communes?format=geojson&geometry=contour&fields=nom,code,codeEpci,epci`,
  )
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .catch((e) => {
      delete S.geoCache[dep];
      throw e;
    });
  return S.geoCache[dep];
}

/* Couleurs des points : couleurs des choix Grist si définies, palette par valeur, ou classes pour un nombre */
/* Couleurs bien distinctes pour la carte : 12 teintes choisies (ni rouge ni gris, réservés),
   puis des teintes générées par l'angle d'or, avec luminosité alternée */
const MAP_COLORS = [
  "#000091",
  "#E4794A",
  "#68A532",
  "#A558A0",
  "#C8AA39",
  "#009099",
  "#8D533E",
  "#6A6AF4",
  "#CE70CC",
  "#FFCA00",
  "#1F5F3A",
  "#4BA3E3",
];
// distinctColor — i-ème couleur bien distincte (palette choisie, puis teintes générées).
function distinctColor(i) {
  if (i < MAP_COLORS.length) return MAP_COLORS[i];
  const k = i - MAP_COLORS.length;
  let h = (k * 137.508 + 20) % 360;
  if (h < 15 || h > 345) h = (h + 30) % 360; // on évite le rouge des valeurs invalides
  return `hsl(${Math.round(h)}, ${k % 2 ? 55 : 70}%, ${[38, 52, 64][k % 3]}%)`;
}
/* Couleurs choisies (3 règles au plus) : la première règle vérifiée donne la couleur, sinon « Autres » */
const RULE_OPS = [
  ["=", "="],
  ["!=", "≠"],
  ["<", "<"],
  ["<=", "≤"],
  [">", ">"],
  [">=", "≥"],
  ["~", "contient"],
];
// ruleTest — Vrai si une valeur vérifie une règle de couleur (=, ≠, <, ≤, >, ≥, contient).
function ruleTest(r, col, opts, v) {
  const txt = String(textOf(col, opts, v) ?? "").trim(),
    want = String(r.v ?? "").trim();
  const n = typeof v === "number" ? v : toNum(txt),
    w = toNum(want),
    numOk = Number.isFinite(n) && Number.isFinite(w) && txt !== "" && want !== "";
  const same = numOk ? n === w : COLL.compare(txt, want) === 0;
  // comparaisons d'ordre : numériques si la valeur de la règle est un nombre (une cellule non numérique ne vérifie pas),
  // sinon alphabétiques ; une cellule vide ne vérifie jamais
  const cmp = () =>
    txt === "" ? NaN : Number.isFinite(w) && want !== "" ? (numOk ? n - w : NaN) : COLL.compare(txt, want);
  switch (r.op) {
    case "!=":
      return !same;
    case "<":
      return cmp() < 0;
    case "<=":
      return cmp() <= 0;
    case ">":
      return cmp() > 0;
    case ">=":
      return cmp() >= 0;
    case "~":
      return txt.toLocaleLowerCase("fr").includes(want.toLocaleLowerCase("fr"));
    default:
      return same;
  }
}
// mapRuleScale — Échelle de couleurs à partir des règles choisies (3 au plus) ; « Autres » en gris.
function mapRuleScale(col, opts, pts, rules) {
  const OTHER = "#C8C8C8";
  const lbl = (r) =>
    r.label?.trim() ||
    (r.op === "=" || !r.op
      ? r.v === ""
        ? "(vide)"
        : r.v
      : `${(RULE_OPS.find((o) => o[0] === r.op) || ["", r.op])[1]} ${r.v}`);
  const colorOf = (v) => {
    for (const r of rules) if (ruleTest(r, col, opts, v)) return r.c || BRAND.c;
    return OTHER;
  };
  const items = rules.map((r) => [lbl(r), r.c || BRAND.c]);
  if (pts.some((p) => colorOf(p.cv) === OTHER && !rules.some((r) => (r.c || "").toUpperCase() === OTHER)))
    items.push(["Autres", OTHER]);
  return { colorOf, items };
}
// mapColorScale — Échelle de couleurs automatique : classes pour un nombre, une couleur par valeur sinon.
function mapColorScale(col, opts, pts, offset = 0) {
  // offset : décalage dans la palette (2ᵉ colonne de couleur : teintes différentes de la 1re)
  const t = baseType(col);
  const isNumeric = (t === "Numeric" || t === "Int") && pts.some((p) => typeof p.cv === "number");
  if (isNumeric) {
    const vals = [...new Set(pts.map((p) => p.cv).filter((v) => typeof v === "number"))].sort((a, b) => a - b);
    if (vals.length > 7) {
      // 5 classes par quantiles, dégradé de bleus
      const ramp = ["#dfe5fb", "#a8b8f0", "#6a83e0", "#2f4fc4", BRAND.c];
      const q = (k) => vals[Math.min(vals.length - 1, Math.floor((k * vals.length) / 5))];
      const cuts = [q(1), q(2), q(3), q(4)];
      const cls = (v) => cuts.filter((c) => v >= c).length;
      const f = (v) => textOf(col, opts, v);
      const bounds = [vals[0], ...cuts, vals[vals.length - 1]];
      return {
        colorOf: (v) => (typeof v === "number" ? ramp[cls(v)] : "#999"),
        items: ramp.map((c, i) => [`${f(bounds[i])} – ${f(bounds[i + 1])}`, c]),
      };
    }
  }
  // valeurs invalides (erreurs Grist : #InvalidTypedValue, #TypeError…) → rouge ; vides → gris clair
  const INVALID = "Valeur invalide",
    RED = "#CE0500",
    EMPTY = "#C8C8C8";
  const label = (v) =>
    isErr(v) || /^#[A-Z][A-Za-z]*(Error|Value|Ref)\b/.test(String(textOf(col, opts, v)))
      ? INVALID
      : textOf(col, opts, v) || "(vide)";
  const counts = new Map();
  for (const p of pts) {
    const l = label(p.cv);
    counts.set(l, (counts.get(l) || 0) + 1);
  }
  const choice = opts?.choiceOptions || {};
  // les valeurs les plus fréquentes reçoivent les couleurs les plus distinctes
  const ranked = [...counts.keys()]
    .filter((k) => k !== INVALID && k !== "(vide)" && !choice[k]?.fillColor)
    .sort((a, b) => counts.get(b) - counts.get(a) || COLL.compare(a, b));
  const MAX = 40;
  const map = new Map([
    [INVALID, RED],
    ["(vide)", EMPTY],
  ]);
  ranked.forEach((k, i) => map.set(k, i < MAX ? distinctColor(i + offset) : "#999"));
  for (const k of counts.keys()) if (choice[k]?.fillColor) map.set(k, choice[k].fillColor);
  const keys = [...counts.keys()].sort(
    (a, b) => (a === INVALID) - (b === INVALID) || (a === "(vide)") - (b === "(vide)") || COLL.compare(a, b),
  );
  const shownKeys = keys.filter((k) => map.get(k) !== "#999");
  const items = [
    ...shownKeys.map((k) => [k, map.get(k)]),
    ...(shownKeys.length < keys.length ? [["Autres", "#999"]] : []),
  ];
  return { colorOf: (v) => map.get(label(v)) || "#999", items };
}
/* Couche de zonage sous les points : communes ou EPCI (contours geo.api.gouv.fr).
   Les EPCI sont obtenus en fusionnant les contours de leurs communes (polygon-clipping). */
let clipP = null;
// loadClip — Charge polygon-clipping (fusion des contours de communes en EPCI).
const loadClip = () =>
  (clipP ??= (window.polygonClipping ? Promise.resolve() : loadLib(LIBS.clip, "polygon-clipping")).catch(
    () => {},
  ));
// zoneMode — Zonage demandé pour un bloc carte : "", "communes", "epci" ou "iris".
const zoneMode = (b) => b.mapZone || (b.mapCommunes ? "communes" : "");
// needsInsee — Le zonage (principal ou second) s'appuie-t-il sur le code INSEE des points ? (pas les circonscriptions)
const needsInsee = (b) =>
  [zoneMode(b), b.mapZone2 || ""].some((m) => m && !FILE_ZONES[m]);
const QRAMP = ["#e8edff", "#bccaf6", "#8aa1ea", "#4f6fd6", "#1d3fb8"];
// quantScale — Dégradé de bleus en 5 classes (quantiles) pour des valeurs numériques.
function quantScale(vals, fmt) {
  // 5 classes par quantiles
  const v = [...new Set(vals.filter(Number.isFinite))].sort((a, b) => a - b);
  if (!v.length) return { colorOf: () => QRAMP[0], items: [] };
  if (v.length <= 5)
    return {
      colorOf: (x) => QRAMP[Math.round((v.indexOf(x) * 4) / Math.max(1, v.length - 1))] || QRAMP[0],
      items: v.map((x, i) => [fmt(x), QRAMP[Math.round((i * 4) / Math.max(1, v.length - 1))]]),
    };
  const q = (k) => v[Math.min(v.length - 1, Math.floor((k * v.length) / 5))],
    cuts = [q(1), q(2), q(3), q(4)];
  const bounds = [v[0], ...cuts, v[v.length - 1]];
  return {
    colorOf: (x) => QRAMP[cuts.filter((c) => x >= c).length],
    items: QRAMP.map((c, i) => [`${fmt(bounds[i])} – ${fmt(bounds[i + 1])}`, c]),
  };
}
/* Quartiers prioritaires (QPV) : fichier GeoJSON (WGS84) déposé à côté du widget, par défaut qpv-bretagne.geojson.
   Chaque point est situé : dans un QPV, à moins de X m, ou hors QPV. */
const QPV_DEFAULT = "qpv-bretagne.geojson",
  QPV_IN = "#CE0500",
  QPV_NEAR = "#E4794A";
const qpvCache = {};
// loadQpv — Charge le fichier GeoJSON des QPV (une fois) et prépare les polygones avec leur emprise.
function loadQpv(url) {
  const u = new URL(String(url || "").trim() || QPV_DEFAULT, location.href);
  if (!/^https?:$/.test(u.protocol)) return Promise.reject(new Error("adresse du fichier QPV invalide"));
  return (qpvCache[u.href] ??= fetch(u.href)
    .then((r) => {
      if (!r.ok) throw new Error(`fichier QPV introuvable (HTTP ${r.status})`);
      return r.json();
    })
    .then((fc) => {
      const polys = [];
      for (const f of fc.features || []) {
        const g = f.geometry;
        if (!g) continue;
        const list = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
        let bb = [Infinity, Infinity, -Infinity, -Infinity];
        for (const pg of list)
          for (const [x, y] of pg[0])
            bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x), Math.max(bb[3], y)];
        polys.push({ props: f.properties || {}, list, bb });
      }
      return { fc, polys };
    })
    .catch((e) => {
      delete qpvCache[u.href];
      throw e;
    }));
}
// inRing — Point dans un anneau de polygone (algorithme du lancer de rayon).
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// qpvLocate — QPV contenant le point, ou le plus proche à moins de maxD mètres.
function qpvLocate(q, lat, lng, maxD) {
  // → { props, d } (d = 0 : dans le quartier ; d en mètres sinon) ou null
  const kx = 111320 * Math.cos((lat * Math.PI) / 180),
    ky = 110540;
  const mx = maxD / kx,
    my = maxD / ky;
  let best = null;
  for (const P of q.polys) {
    if (lng < P.bb[0] - mx || lng > P.bb[2] + mx || lat < P.bb[1] - my || lat > P.bb[3] + my) continue;
    for (const pg of P.list)
      if (inRing(lng, lat, pg[0]) && !pg.slice(1).some((h) => inRing(lng, lat, h)))
        return { props: P.props, d: 0 };
    if (!maxD) continue;
    for (const pg of P.list)
      for (const r of pg)
        for (let i = 1; i < r.length; i++) {
          // distance au bord
          const ax = (r[i - 1][0] - lng) * kx,
            ay = (r[i - 1][1] - lat) * ky,
            bx = (r[i][0] - lng) * kx,
            by = (r[i][1] - lat) * ky;
          const dx = bx - ax,
            dy = by - ay,
            L2 = dx * dx + dy * dy,
            t = L2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2)) : 0;
          const d = Math.hypot(ax + t * dx, ay + t * dy);
          if (d <= maxD && (!best || d < best.d)) best = { props: P.props, d };
        }
  }
  return best;
}
// qpvText — Texte de l'infobulle QPV d'un point.
const qpvText = (q) =>
  q
    ? `QPV ${q.props.lib_qp || q.props.code_qp || ""}${q.props.lib_com ? ` (${q.props.lib_com})` : ""}${q.d ? ` — à ${Math.round(q.d)} m` : ""}`
    : "";
/* Contours IRIS (INSEE) : service WFS de la Géoplateforme IGN, interrogé pour les seules communes ayant des points.
   Les communes non découpées (type « Z ») sont exclues : leur unique IRIS est la commune entière. */
const IRIS_WFS =
  "https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=STATISTICALUNITS.IRISGE:iris_ge&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&COUNT=5000&CQL_FILTER=";
const irisCache = {}; // code commune → Promise<features>
// fixLonLat — Remet les coordonnées dans l'ordre (longitude, latitude) si le service les a inversées.
function fixLonLat(g) {
  // certains services renvoient (lat, lon) : on remet (lon, lat)
  const first = (c) => (typeof c[0] === "number" ? c : first(c[0]));
  const [a, b2] = first(g.coordinates);
  if (Math.abs(a) <= 90 && a > 35 && Math.abs(b2) < 35) {
    const sw = (c) => (typeof c[0] === "number" ? [c[1], c[0]] : c.map(sw));
    g.coordinates = sw(g.coordinates);
  }
  return g;
}
// fetchIris — Contours IRIS des communes demandées (WFS IGN), par paquets de 60, mis en cache par commune.
function fetchIris(codes) {
  const todo = codes.filter((c) => !irisCache[c]);
  for (let i = 0; i < todo.length; i += 60) {
    const part = todo.slice(i, i + 60);
    const req = fetch(
      IRIS_WFS +
        encodeURIComponent(
          `code_insee IN (${part.map((c) => `'${c.replace(/[^0-9AB]/gi, "")}'`).join(",")}) AND type_iris<>'Z'`,
        ),
    )
      .then((r) => {
        if (!r.ok) throw new Error(`IRIS : HTTP ${r.status}`);
        return r.json();
      })
      .then((fc) => (fc.features || []).filter((f) => f.geometry).map((f) => (fixLonLat(f.geometry), f)));
    for (const c of part)
      irisCache[c] = req
        .then((fs) => fs.filter((f) => String(f.properties?.code_insee).toUpperCase() === c))
        .catch((e) => {
          delete irisCache[c];
          throw e;
        });
  }
  return Promise.all(codes.map((c) => irisCache[c])).then((l) => l.flat());
}
// polysOf — Liste des polygones d'une géométrie Polygon ou MultiPolygon.
const polysOf = (g) => (g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : []);
// inGeom — Point dans une géométrie (trous compris).
const inGeom = (g, lng, lat) =>
  polysOf(g).some((pg) => inRing(lng, lat, pg[0]) && !pg.slice(1).some((h) => inRing(lng, lat, h)));
/* ---------- Zonages lus dans un fichier GeoJSON (WGS84) déposé à côté du widget ----------
   circonscriptions législatives et secteurs de collège, restreints à la région (voir README) ; le fichier est lu
   une fois (cache). Code et nom de chaque zone sont reconnus d'après le nom des propriétés, variable selon les
   éditions (codeCirconscription, nomCirconscription ; UAI / code_rne, nom du collège…). */
const FILE_ZONES = {
  legis: {
    def: "circonscriptions-bretagne.geojson",
    urlKey: "legisUrl",
    colKey: "legisCol",
    label: "Circonscriptions législatives",
    one: "circonscription",
    code: [/^(id_?circo|code_?circ|codecirconscription|circo(nscription)?_?code|ref)$/i, /circ/i, /^code$/i, /^id$/i],
    name: [/^(nom|lib(elle)?)_?circ/i, /^nom/i, /^lib/i],
  },
  college: {
    def: "secteurs-colleges-bretagne.geojson",
    urlKey: "collegeUrl",
    colKey: "collegeCol",
    label: "Secteurs de collège",
    one: "secteur",
    code: [/^(uai|code_?uai|code_?rne|rne|numero_?uai|uai_?college|identifiant_?(de_?l_?)?etab(lissement)?)$/i, /uai|rne/i, /^code$/i],
    name: [/^(nom|lib(elle)?|appellation)_?(college|etab|etablissement)/i, /college|etab/i, /^nom/i, /^lib/i, /appellation/i],
  },
};
const zoneFileCache = {};
// Plusieurs fichiers peuvent être indiqués, séparés par des virgules (ex. un fichier par département) : leurs zones
// sont réunies ; deux zones de même code (un collège dont le secteur couvre deux départements) n'en font qu'une.
function loadZoneFile(kind, url) {
  const list = String(url || "")
    .split(/[,;]/)
    .map((x) => x.trim())
    .filter(Boolean);
  if (list.length > 1) return Promise.all(list.map((one) => loadZoneFile(kind, one))).then((all) => all.flat());
  const Z = FILE_ZONES[kind];
  const u = new URL(list[0] || Z.def, location.href);
  if (u.origin !== location.origin && u.protocol !== "https:") return Promise.reject(new Error("adresse du fichier invalide"));
  return (zoneFileCache[kind + " " + u.href] ??= fetch(u.href)
    .then((r) => {
      if (!r.ok) throw new Error(`fichier ${u.pathname.split("/").pop()} introuvable (HTTP ${r.status})`);
      return r.json();
    })
    .then((fc) => {
      const pick = (pr, res) => {
        for (const re of res) {
          const k = Object.keys(pr).find((x) => re.test(x) && pr[x] !== null && pr[x] !== "" && typeof pr[x] !== "object");
          if (k) return pr[k];
        }
        return null;
      };
      return (fc.features || [])
        .filter((f) => f.geometry)
        .map((f, i) => {
          const pr = f.properties || {};
          const dep = kind === "legis" ? pick(pr, [/^code_?d[eé]p/i, /^dep/i, /d[eé]partement/i]) : null;
          let code = pick(pr, Z.code);
          if (code !== null && dep !== null && String(code).length <= 2) code = `${dep}${String(code).padStart(2, "0")}`; // n° seul : préfixé du département
          const nom = pick(pr, Z.name);
          let bb = [Infinity, Infinity, -Infinity, -Infinity];
          for (const pg of polysOf(f.geometry))
            for (const [x, y] of pg[0]) bb = [Math.min(bb[0], x), Math.min(bb[1], y), Math.max(bb[2], x), Math.max(bb[3], y)];
          const key = String(code ?? f.id ?? i).toUpperCase();
          const name = nom
            ? String(nom) + (dep && !String(nom).includes(String(dep)) ? ` (${dep})` : "")
            : `${Z.one[0].toUpperCase()}${Z.one.slice(1)} ${key}`;
          return { f, bb, key, name };
        });
    })
    .catch((e) => {
      delete zoneFileCache[kind + " " + u.href];
      throw e;
    }));
}
/* Valeurs d'une table Grist reliées aux zones par un code (INSEE, SIREN d'EPCI, code IRIS) */
async function zoneTableValues(b) {
  const t = [...S.meta.tables.values()].find((x) => x.tableId === b.zoneTable);
  if (!t || !b.zoneKey || !b.zoneVal) return null;
  const cols = S.meta.colsByTable.get(t.id) || [];
  const kC = cols.find((c) => c.colId === b.zoneKey),
    vC = cols.find((c) => c.colId === b.zoneVal);
  if (!kC || !vC) return null;
  await ensureRefTables([kC, vC]);
  const rows = await fetchRows(t.tableId);
  const kO = parseJSON(kC.widgetOptions),
    vO = parseJSON(vC.widgetOptions),
    m = new Map();
  for (const r of rows) {
    const k = String(textOf(kC, kO, r[kC.colId]) ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s/g, "");
    if (!k) continue;
    const v = r[vC.colId];
    m.set(k, typeof v === "number" ? v : isEmpty(v) || isErr(v) ? null : textOf(vC, vO, v));
  }
  return { map: m, label: vC.label || vC.colId };
}
/* Commune d'un point d'après sa position : département obtenu par geo.api.gouv.fr (une requête, mise en cache),
   puis recherche du contour communal qui contient le point. Sert quand la colonne ne donne pas de code INSEE. */
const depAtCache = {};
// depAt — Département d'un point (geo.api.gouv.fr), mis en cache.
function depAt(lat, lng) {
  const k = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  return (depAtCache[k] ??= fetch(
    `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=code,codeDepartement`,
  )
    .then((r) => (r.ok ? r.json() : []))
    .then((l) => l[0]?.codeDepartement || null)
    .catch(() => null));
}
// locateCommunes — Attribue une commune aux points sans code INSEE d'après leur position.
async function locateCommunes(pts) {
  const deps = new Set(pts.filter((p) => p.code).map((p) => depOf(p.code)));
  for (let guard = 0; guard < 6; guard++) {
    const rest = pts.filter((p) => !p.code);
    if (!rest.length) break;
    const feats = (await Promise.all([...deps].map((d) => fetchCommuneShapes(d).catch(() => null)))).flatMap(
      (fc) => fc?.features || [],
    );
    for (const p of rest) {
      const f = feats.find((f) => f.geometry && inGeom(f.geometry, p.lng, p.lat));
      if (f) p.code = String(f.properties.code).toUpperCase();
    }
    const left = pts.find((p) => !p.code);
    if (!left) break;
    const d = await depAt(left.lat, left.lng);
    if (!d || deps.has(d)) break; // hors de France ou contour introuvable : on s'arrête
    deps.add(d);
  }
}
// drawZones — Couche de zonage sous les points : communes, EPCI (fusionnés) ou IRIS, avec couleur et légende.
// opt.mode : zonage à dessiner (sinon celui du bloc) ; opt.outline : second zonage, en simples contours par-dessus
async function drawZones(map, pts, comC, keepView, b, sumC, opt = {}) {
  const mode = opt.mode || zoneMode(b),
    outline = !!opt.outline;
  const note = (msg) => {
    const c = L.control({ position: "topright" });
    c.onAdd = () => {
      const d = L.DomUtil.create("div", "map-legend");
      d.textContent = msg;
      return d;
    };
    c.addTo(map);
  };
  const fileZ = FILE_ZONES[mode]; // zonage lu dans un fichier (circonscriptions, secteurs de collège)
  if (!fileZ && pts.some((p) => !p.code)) {
    if (comC)
      console.info(
        `[UX widget] carte : ${pts.filter((p) => !p.code).length} point(s) sans code INSEE lisible dans « ${comC.label || comC.colId} » (${comC.type}) — commune déduite de la position`,
      );
    await locateCommunes(pts);
    if (!map._container?.isConnected) return;
  }
  const byCode = new Map();
  for (const p of pts)
    if (p.code) {
      if (!byCode.has(p.code)) byCode.set(p.code, []);
      byCode.get(p.code).push(p);
    }
  if (!byCode.size && !fileZ) return note("Zonage : aucun code INSEE reconnu");
  const noFill = !outline && b.zoneColor === "none"; // contours seuls, sans couleur de fond
  // étiquette au survol : celle du zonage principal (par défaut) ou celle du second zonage, au choix
  const hoverSecond = !!b.mapZone2 && b.mapZone2 !== zoneMode(b) && b.zoneHover === "second";
  const how = outline || noFill ? "" : b.zoneColor || "";
  try {
    const codes = [...byCode.keys()];
    const deps = [...new Set(codes.map(depOf))];
    const [fcs, irisFeats, tv, fileFeats] = await Promise.all([
      mode === "iris" || fileZ ? [] : Promise.all(deps.map(fetchCommuneShapes)),
      mode === "iris" ? fetchIris(codes) : [],
      how === "table" ? zoneTableValues(b) : null,
      mode === "epci" ? loadClip() : null,
    ]).then(async (r) => [r[0], r[1], r[2], fileZ ? await loadZoneFile(mode, b[fileZ.urlKey]) : null]);
    if (!map._container?.isConnected) return;
    const all = fcs.flatMap((fc) => fc.features || []);
    const codeOf = (f) => String(f.properties?.code).toUpperCase();
    // zones : { key, name, feats, pts }
    const zones = new Map();
    if (mode === "epci") {
      for (const f of all) {
        const k = f.properties?.codeEpci || f.properties?.epci?.code;
        if (!k) continue;
        if (!zones.has(k))
          zones.set(k, { key: k, name: f.properties?.epci?.nom || `EPCI ${k}`, feats: [], pts: [] });
        zones.get(k).feats.push(f);
      }
      for (const z of zones.values()) for (const f of z.feats) z.pts.push(...(byCode.get(codeOf(f)) || []));
      for (const [k, z] of zones) if (!z.pts.length) zones.delete(k); // seulement les EPCI qui contiennent des points
    } else if (fileZ) {
      // zones des points : par la colonne de code choisie (ex. 2201), sinon par position (point dans le polygone,
      // après le rectangle englobant)
      const byCol = !!b[fileZ.colKey];
      const norm = (v) => String(v ?? "").trim().toUpperCase().replace(/^0+(?=\w)/, "");
      for (const c of fileFeats) {
        const inside = byCol
          ? pts.filter((p) => norm(p.zc?.[mode]) === norm(c.key))
          : pts
              .filter((p) => p.lng >= c.bb[0] && p.lng <= c.bb[2] && p.lat >= c.bb[1] && p.lat <= c.bb[3])
              .filter((p) => inGeom(c.f.geometry, p.lng, p.lat));
        if (!inside.length) continue;
        if (zones.has(c.key)) zones.get(c.key).feats.push(c.f), zones.get(c.key).pts.push(...inside); // zone en plusieurs morceaux
        else zones.set(c.key, { key: c.key, name: c.name, feats: [c.f], pts: inside });
      }
    } else if (mode === "iris") {
      for (const f of irisFeats) {
        const pr = f.properties || {},
          k = String(pr.code_iris || pr.iris || f.id);
        const cand = byCode.get(String(pr.code_insee).toUpperCase()) || [];
        const z = {
          key: k,
          name: `${pr.nom_iris || k} (${pr.nom_commune || pr.code_insee || ""})`,
          feats: [f],
          pts: cand.filter((p) => inGeom(f.geometry, p.lng, p.lat)),
        };
        for (const p of z.pts) p.iris = z.name;
        zones.set(k, z);
      }
    } else {
      for (const f of all) {
        const c = codeOf(f);
        if (byCode.has(c)) zones.set(c, { key: c, name: f.properties.nom, feats: [f], pts: byCode.get(c) });
      }
    }
    // valeur et couleur de chaque zone
    const fmtN = (x) => (Number.isInteger(x) ? x : Math.round(x * 10) / 10).toLocaleString("fr-FR");
    const val = (z) =>
      how === "table"
        ? (tv?.map.get(String(z.key).toUpperCase()) ?? null)
        : how === "sum" && sumC
          ? z.pts.reduce((t, p) => t + (Number.isFinite(p.sv) ? p.sv : 0), 0)
          : z.pts.length;
    const ordered = [...zones.values()].sort((a, c) => COLL.compare(a.name, c.name));
    for (const z of ordered) z.value = val(z);
    let scale = null;
    if (how === "table") {
      const vals = ordered.map((z) => z.value).filter((v) => v !== null && v !== "");
      if (vals.length && vals.every((v) => typeof v === "number")) scale = quantScale(vals, fmtN);
      else {
        // valeurs textuelles : une couleur par valeur
        const keys = [...new Set(vals.map(String))].sort(COLL.compare),
          cm = new Map(keys.map((k, i) => [k, distinctColor(i)]));
        scale = {
          colorOf: (v) => cm.get(String(v)) || "#C8C8C8",
          items: keys.slice(0, 30).map((k) => [k, cm.get(k)]),
        };
      }
    } else if (how)
      scale = quantScale(
        ordered.map((z) => z.value),
        fmtN,
      );
    const majority = (z) => {
      const n = new Map();
      for (const p of z.pts) {
        const c = p.fill || BRAND.c;
        n.set(c, (n.get(c) || 0) + 1);
      }
      return [...n].sort((a, c) => c[1] - a[1])[0]?.[0] || BRAND.c;
    };
    ordered.forEach((z, i) => {
      z.color = scale
        ? z.value === null || z.value === ""
          ? "#C8C8C8"
          : scale.colorOf(z.value)
        : mode === "epci" || fileZ
          ? distinctColor(i)
          : mode === "iris"
            ? "#6A6AF4"
            : majority(z);
    });
    // géométrie : fusion des communes pour un EPCI
    const geomOf = (z) => {
      if (z.feats.length === 1) return z.feats[0].geometry;
      const polys = z.feats.map((f) => polysOf(f.geometry));
      if (window.polygonClipping) {
        try {
          return { type: "MultiPolygon", coordinates: polygonClipping.union(...polys) };
        } catch {
          /* repli ci-dessous */
        }
      }
      return { type: "MultiPolygon", coordinates: polys.flat() };
    };
    const feats = ordered.map((z) => ({ type: "Feature", properties: z, geometry: geomOf(z) }));
    if (!map.getPane("zones")) map.createPane("zones").style.zIndex = 350; // sous les points
    if (outline && !map.getPane("zones2")) map.createPane("zones2").style.zIndex = 355; // second zonage : au-dessus du premier
    const what = how === "table" && tv ? tv.label : how === "sum" && sumC ? sumC.label || sumC.colId : "";
    const layer = L.geoJSON(
      { type: "FeatureCollection", features: feats },
      {
        pane: outline ? "zones2" : "zones",
        interactive: !outline && !hoverSecond, // seul le calque qui porte l'étiquette réagit au survol
        style: (f) =>
          outline
            ? { color: "#161616", weight: mode === "iris" ? 1.2 : 2, opacity: 0.85, dashArray: "6 4", fill: false }
            : noFill
              ? { color: "#3a3a3a", weight: mode === "iris" ? 1 : 1.5, opacity: 0.8, fillOpacity: 0 } // fond transparent : survol conservé
              : ({
          color: how ? "#1d3fb8" : f.properties.color,
          weight: mode === "epci" || fileZ ? 2.5 : mode === "iris" ? 1 : 1.5,
          opacity: 0.9,
          fillColor: f.properties.color,
          fillOpacity: how ? 0.55 : mode === "iris" ? 0.06 : 0.18,
        }),
        onEachFeature: (f, l) => {
          const z = f.properties;
          if (outline || hoverSecond) return; // contours : infobulle portée par un calque invisible (ci-dessous)
          l.bindTooltip(
            `<b>${esc(z.name)}</b>${mode === "iris" ? `<br><small>IRIS ${esc(z.key)}</small>` : ""}<br>${z.pts.length} point${z.pts.length > 1 ? "s" : ""}` +
              (what
                ? `<br>${esc(what)} : ${z.value === null || z.value === "" ? "—" : esc(typeof z.value === "number" ? fmtN(z.value) : z.value)}`
                : ""),
            { sticky: true },
          );
        },
      },
    ).addTo(map);
    // second zonage : le pointillé est fin, difficile à viser ; un trait transparent de 16 px le double et porte le
    // nom de la zone au survol
    if (outline)
      L.geoJSON(
        { type: "FeatureCollection", features: feats },
        {
          pane: "zones2",
          // étiquette du second zonage choisie : toute sa surface réagit au survol (fond transparent)
          style: { color: "#000", weight: 16, opacity: 0, fill: hoverSecond, fillOpacity: 0 },
          onEachFeature: (f, l) => l.bindTooltip(`<b>${esc(f.properties.name)}</b>`, { sticky: true }),
        },
      ).addTo(map);
    if (feats.length && mode !== "iris") map._uxExtend?.(layer.getBounds(), keepView); // cadrage : points + zones
    if (scale?.items.length && !outline) {
      const c = L.control({ position: "topright" });
      c.onAdd = () => {
        const d = L.DomUtil.create("div", "map-legend");
        d.innerHTML =
          `<b>${fileZ ? fileZ.label : { epci: "EPCI", iris: "IRIS", communes: "Communes" }[mode]} : ${esc(what || "nombre de points")}</b>` +
          scale.items
            .map(([t, col]) => `<div><i style="background:${esc(col)};border-radius:2px"></i>${esc(t)}</div>`)
            .join("") +
          (ordered.some((z) => z.value === null || z.value === "") && how === "table"
            ? `<div><i style="background:#C8C8C8;border-radius:2px"></i>sans donnée</div>`
            : "");
        L.DomEvent.disableScrollPropagation(d);
        return d;
      };
      c.addTo(map);
    }
    if (fileZ) {
      if (!zones.size) note(`${fileZ.label} : aucun point à l'intérieur des contours du fichier`);
    } else if (mode === "iris") {
      const split = new Set(irisFeats.map((f) => String(f.properties?.code_insee).toUpperCase()));
      if (!irisFeats.length) note("IRIS : aucune commune découpée en IRIS parmi celles des points");
      else if (split.size < codes.length)
        note(
          `IRIS : ${split.size} commune(s) découpée(s) ; les ${codes.length - split.size} autres forment un seul IRIS`,
        );
    } else {
      const missing = codes.filter((c) => !all.some((f) => codeOf(f) === c)).length;
      if (missing) note(`Zonage : ${missing} code(s) INSEE sans contour`);
    }
  } catch (e) {
    note(`${fileZ ? fileZ.label : "Contours"} indisponibles (${e.message || e})`);
  }
}
// renderMap — Affiche un widget carte : points, couleurs, contours, QPV, zonage, légendes. Le dessin Leaflet est différé (jobs).
async function renderMap(info, rows, body, jobs, selId, b = {}) {
  const spec = mapSpec(info.sec);
  const cols = S.meta.colsByTable.get(info.sec.tableRef) || [];
  const find = (id, re) => colByKey(cols, id) || cols.find((c) => re.test(c.colId) || re.test(c.label || ""));
  const latC = find(spec.lat, /^lat/i),
    lngC = find(spec.lng, /^(lon|lng)/i),
    nameC = (b.mapLabel && cols.find((c) => c.colId === b.mapLabel)) || find(spec.name, /^(nom|name|libell)/i);
  if (!latC || !lngC) {
    body.innerHTML = '<div class="msg">Carte : colonnes Latitude / Longitude introuvables</div>';
    return;
  }
  const colorC = b.mapColor ? cols.find((c) => c.colId === b.mapColor) : null;
  // 2ᵉ couleur (0.8.11.2) : colore les points dont la 1re colonne est vide, selon une autre colonne
  const colorC2 = colorC && b.mapColor2 ? cols.find((c) => c.colId === b.mapColor2) : null;
  const sumC = b.zoneColor === "sum" && b.zoneSum ? cols.find((c) => c.colId === b.zoneSum) : null;
  const qpvRing = b.mapRing === "__qpv"; // contour calculé : situation par rapport aux QPV
  const qpvDist = Number(b.qpvDist ?? 300) || 0;
  const ringC = b.mapRing && !qpvRing ? cols.find((c) => c.colId === b.mapRing) : null; // contour du point, couleurs choisies
  const ringRules = ringC ? (b.mapRules || []).filter((r) => r && r.v !== undefined) : [];
  const comC =
    needsInsee(b) && b.mapCommune !== "__pos"
      ? (b.mapCommune && cols.find((c) => c.colId === b.mapCommune)) ||
        cols.find((c) => /insee|code.?com|cog|depcom/i.test(c.colId)) ||
        cols.find((c) => /^commune/i.test(c.colId) && ["Ref", "RefList"].includes(baseType(c)))
      : null;
  await ensureRefTables([nameC, colorC, colorC2, comC, ringC].filter(Boolean));
  const ringOpts = ringC ? parseJSON(ringC.widgetOptions) : null;
  const colorOpts = colorC ? parseJSON(colorC.widgetOptions) : null;
  // zonages lus dans un fichier : rattachement des points par une colonne de code (sinon par leur position)
  const zcCols = Object.entries(FILE_ZONES)
    .map(([k, Z]) => [k, b[Z.colKey] && cols.find((c) => c.colId === b[Z.colKey])])
    .filter(([, c]) => c);
  await ensureRefTables(zcCols.map(([, c]) => c));
  const pts = rows
    .map((r) => {
      const ll = toLatLng(toNum(r[latC.colId]), toNum(r[lngC.colId]));
      return (
        ll && {
          id: r.id,
          lat: ll[0],
          lng: ll[1],
          name: nameC ? textOf(nameC, parseJSON(nameC.widgetOptions), r[nameC.colId]) : "",
          cv: colorC ? r[colorC.colId] : null,
          cv2: colorC2 ? r[colorC2.colId] : null,
          rv: ringC ? r[ringC.colId] : null,
          sv: sumC ? toNum(r[sumC.colId]) : null,
          code: comC ? communeCode(comC, r[comC.colId]) : null,
          zc: Object.fromEntries(zcCols.map(([k, c]) => [k, textOf(c, parseJSON(c.widgetOptions), r[c.colId])])),
        }
      );
    })
    .filter(Boolean);
  const noCv = (p) => isEmpty(p.cv) || String(p.cv).trim() === ""; // 1re colonne vide pour ce point
  const pts1 = colorC2 ? pts.filter((p) => !noCv(p)) : pts,
    pts2 = colorC2 ? pts.filter(noCv) : [];
  const legend = colorC ? mapColorScale(colorC, colorOpts, pts1) : null;
  const legend2 =
    colorC2 && pts2.length
      ? mapColorScale(
          colorC2,
          parseJSON(colorC2.widgetOptions),
          pts2.map((p) => ({ cv: p.cv2 })),
          legend?.items.length || 0,
        )
      : null;
  const ring = ringRules.length
    ? mapRuleScale(
        ringC,
        ringOpts,
        pts.map((p) => ({ cv: p.rv })),
        ringRules,
      )
    : null;
  const ringOf = (v) => {
    const c = ring?.colorOf(v);
    return c && c !== "#C8C8C8" ? c : null;
  }; // sans règle vérifiée : contour blanc habituel
  if (!pts.length) {
    const ex = rows[0]
      ? `${esc(latC.colId)} = ${esc(rows[0][latC.colId])}, ${esc(lngC.colId)} = ${esc(rows[0][lngC.colId])}`
      : "aucune ligne";
    body.innerHTML = `<div class="msg">Carte : aucune coordonnée exploitable (${rows.length} lignes ; exemple : ${ex})</div>`;
    return;
  }
  body.innerHTML = '<div class="map-box"></div>';
  const el = body.querySelector(".map-box");
  const key = pts.map((p) => p.id).join(",");
  jobs.push(async () => {
    try {
      let qpv = null,
        qpvErr = "";
      await Promise.all([
        loadLeaflet(),
        pts.some((p) => looksHtml(p.name)) ? loadPurify() : null,
        b.mapQpv || qpvRing
          ? loadQpv(b.qpvUrl).then(
              (q) => {
                qpv = q;
              },
              (e) => {
                qpvErr = e.message || String(e);
              },
            )
          : null,
      ]);
      if (qpv) for (const p of pts) p.qpv = qpvLocate(qpv, p.lat, p.lng, qpvDist);
      const map = L.map(el, { zoomControl: true, attributionControl: true }).setView(
        [pts[0].lat, pts[0].lng],
        11,
      ); // vue initiale sûre
      S.maps.push(map);
      L.tileLayer(spec.tiles, { attribution: spec.attribution, maxZoom: 19 }).addTo(map);
      const markers = new Map();
      // sans colonne de couleur : bleu, sélection en rouge ; avec : couleur de la valeur, sélection agrandie et cerclée de noir
      const style0 = (on, fill) =>
        fill
          ? on
            ? { radius: 9, color: "#161616", weight: 3, fillColor: fill, fillOpacity: 1 }
            : { radius: 6, color: "#fff", weight: 1.5, fillColor: fill, fillOpacity: 0.9 }
          : on
            ? { radius: 8, color: "#fff", weight: 2, fillColor: "#ce0500", fillOpacity: 1 }
            : { radius: 6, color: "#fff", weight: 1.5, fillColor: BRAND.c, fillOpacity: 0.85 };
      // couleur visible d'un point (celle reprise par le cadre de son étiquette)
      const ptColor = (on, fill) => fill || (on ? "#ce0500" : BRAND.c);
      // contour du point : couleur de la règle de contour, sinon le liseré du cercle (noir si sélectionné et coloré, sinon blanc)
      const ptRing = (on, fill, ring) => ring || (on && fill ? "#161616" : "#fff");
      const tipColor = (tt, c, c2) => {
        const el = tt?.getElement?.();
        if (!el) return;
        el.style.setProperty("--tc", c);
        el.style.setProperty("--tc2", c2 || "#fff"); // second liseré, à l'intérieur : couleur du contour du point
      };
      // contour coloré : cercle plus épais autour du point (sélection : point agrandi)
      const style = (on, fill, rc) =>
        rc
          ? { ...style0(on, fill), color: rc, weight: on ? 4 : 3, radius: on ? 10 : 7, opacity: 1 }
          : style0(on, fill);
      for (const p of pts) {
        p.fill = legend2 && noCv(p) ? legend2.colorOf(p.cv2) : legend ? legend.colorOf(p.cv) : null;
        p.ring = qpvRing ? (p.qpv ? (p.qpv.d ? QPV_NEAR : QPV_IN) : null) : ringOf(p.rv);
        const m = L.circleMarker([p.lat, p.lng], style(p.id === selId, p.fill, p.ring)).addTo(map);
        // Leaflet interprète les étiquettes comme du HTML : HTML nettoyé (popup au clic, comme la carte native), sinon texte échappé
        const qx = p.qpv ? `<div class="qpvinfo">${esc(qpvText(p.qpv))}</div>` : ""; // (l'IRIS est indiqué au survol de la zone)
        if (p.name && looksHtml(p.name) && !b.mapLabelsOn) {
          m.bindPopup(safeHtml(p.name) + qx, { maxWidth: 420 });
          // fenêtre d'information : même cadre que les étiquettes (couleur du point)
          m.on("popupopen", (e) => {
            {
              const on = p.id === (S.sel[info.secId] ?? selId);
              tipColor(e.popup, ptColor(on, p.fill), ptRing(on, p.fill, p.ring));
            }
            S.mapPopup = { sec: info.secId, id: p.id }; // à rouvrir si la page est redessinée (sélection d'un point lié)
          });
          m.on("popupclose", () => {
            if (!S.mapTeardown) S.mapPopup = null; // fermée par l'utilisateur (et non par le redessin de la page)
          });
        }
        else if (p.name || qx)
          m.bindTooltip((looksHtml(p.name) ? safeHtml(p.name) : esc(p.name)) + (b.mapLabelsOn ? "" : qx), {
            direction: "top",
            offset: [0, -6],
            permanent: !!b.mapLabelsOn,
            className: b.mapLabelsOn ? "lbl" : "",
          });
        // cadre de l'étiquette de la couleur du point (rouge s'il est sélectionné sans couleur choisie)
        m.on("tooltipopen", (e) => {
          const on = p.id === (S.sel[info.secId] ?? selId);
          tipColor(e.tooltip, ptColor(on, p.fill), ptRing(on, p.fill, p.ring));
        });
        if (m.getTooltip() && m.isTooltipOpen()) tipColor(m.getTooltip(), ptColor(p.id === selId, p.fill), ptRing(p.id === selId, p.fill, p.ring)); // étiquette permanente déjà ouverte (point sans étiquette : pas de tooltip)
        m.on("click", () => {
          S.sel[info.secId] = p.id;
          if (hasRenderedDependents(info.secId)) scheduleRender();
          else
            for (const [id, mk] of markers) {
              mk.setStyle(style(id === p.id, mk.fill, mk.ring));
              if (mk.getTooltip()) tipColor(mk.getTooltip(), ptColor(id === p.id, mk.fill), ptRing(id === p.id, mk.fill, mk.ring));
              if (id === p.id) mk.bringToFront();
            }
        });
        m.fill = p.fill;
        m.ring = p.ring;
        markers.set(p.id, m);
      }
      const saved = S.mapViews[info.secId];
      if (zoneMode(b)) drawZones(map, pts, comC, saved && saved.key === key, b, sumC);
      // second zonage, croisé avec le premier : simples contours en pointillés (ex. communes colorées + circonscriptions)
      if (b.mapZone2 && b.mapZone2 !== zoneMode(b))
        drawZones(map, pts, comC, true, b, sumC, { mode: b.mapZone2, outline: true });
      if (qpvErr) {
        const c = L.control({ position: "topright" });
        c.onAdd = () => {
          const d = L.DomUtil.create("div", "map-legend");
          d.textContent = `QPV : ${qpvErr}`;
          return d;
        };
        c.addTo(map);
      }
      if (qpv && b.mapQpv) {
        if (!map.getPane("qpv")) map.createPane("qpv").style.zIndex = 360; // au-dessus des zones, sous les points
        const nIn = (pr) => pts.filter((p) => p.qpv && p.qpv.props === pr).length;
        L.geoJSON(qpv.fc, {
          pane: "qpv",
          style: { color: QPV_IN, weight: 1.5, dashArray: "4 3", fillColor: QPV_IN, fillOpacity: 0.12 },
          onEachFeature: (f, l) => {
            const pr =
              qpv.polys.find((P) => P.props.code_qp === f.properties?.code_qp)?.props || f.properties || {};
            l.bindTooltip(
              `<b>QPV ${esc(pr.lib_qp || pr.code_qp || "")}</b><br>${esc(pr.lib_com || "")} · ${esc(pr.code_qp || "")}<br>${nIn(pr)} point(s) dedans ou à proximité`,
              { sticky: true },
            );
          },
        }).addTo(map);
      }
      const nQ = pts.filter((p) => p.qpv && !p.qpv.d).length,
        nN = pts.filter((p) => p.qpv && p.qpv.d).length;
      const ringItems = qpvRing
        ? [[`Dans un QPV (${nQ})`, QPV_IN], ...(qpvDist ? [[`À moins de ${qpvDist} m (${nN})`, QPV_NEAR]] : [])]
        : (ring?.items || []).filter(([t]) => t !== "Autres");
      if (legend?.items.length || legend2?.items.length || ringItems.length) {
        const ctl = L.control({ position: "bottomleft" });
        ctl.onAdd = () => {
          const d = L.DomUtil.create("div", "map-legend");
          d.innerHTML =
            (legend?.items.length
              ? `<b>${esc(colorC.label || colorC.colId)}</b>` +
                legend.items.map(([t, c]) => `<div><i style="background:${esc(c)}"></i>${esc(t)}</div>`).join("")
              : "") +
            (legend2?.items.length
              ? `<b style="margin-top:4px">${esc(colorC2.label || colorC2.colId)}</b>` +
                legend2.items.map(([t, c]) => `<div><i style="background:${esc(c)}"></i>${esc(t)}</div>`).join("")
              : "") +
            (ringItems.length
              ? `<b${legend?.items.length || legend2?.items.length ? ' style="margin-top:4px"' : ""}>Contour : ${esc(qpvRing ? "quartiers prioritaires" : ringC.label || ringC.colId)}</b>` +
                ringItems
                  .map(
                    ([t, c]) =>
                      `<div><i style="background:transparent;border:3px solid ${esc(c)};box-shadow:none"></i>${esc(t)}</div>`,
                  )
                  .join("")
              : "");
          L.DomEvent.disableScrollPropagation(d);
          return d;
        };
        ctl.addTo(map);
      }
      markers.get(selId)?.bringToFront();
      /* Cadrage (0.8.11) : à l'ouverture, la carte montre l'ensemble des données (points, et zones dessinées).
         Tant que l'utilisateur n'a pas déplacé ou zoomé la carte, elle se recadre quand son cadre change de taille
         (bloc déplié, plein écran, mise en page) ; le bouton ⤢ y revient à tout moment. */
      const dataBounds = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
      let userMoved = false;
      const fitAll = () => {
        if (!el.isConnected || !el.clientWidth || !el.clientHeight) return; // cadre invisible : plus tard
        map.invalidateSize();
        const bb = dataBounds;
        if (bb.getNorthEast().equals(bb.getSouthWest())) map.setView(bb.getCenter(), 14, { animate: false });
        else map.fitBounds(bb, { padding: [20, 20], maxZoom: 15, animate: false });
      };
      map._uxExtend = (bounds, keep) => {
        dataBounds.extend(bounds);
        if (!keep && !userMoved) fitAll();
      };
      const markMoved = () => (userMoved = true);
      map.on("dragstart", markMoved);
      for (const evName of ["wheel", "dblclick", "touchstart"]) el.addEventListener(evName, markMoved, { passive: true });
      const fitCtl = L.control({ position: "topleft" });
      fitCtl.onAdd = () => {
        const d = L.DomUtil.create("div", "leaflet-bar");
        d.innerHTML = '<a href="#" role="button" class="map-fit" title="Recadrer sur l\'ensemble des données" aria-label="Recadrer sur l\'ensemble des données">⤢</a>';
        L.DomEvent.disableClickPropagation(d);
        d.firstChild.addEventListener("click", (e) => {
          e.preventDefault();
          userMoved = false;
          fitAll();
        });
        return d;
      };
      fitCtl.addTo(map);
      el.querySelector(".leaflet-control-zoom")?.addEventListener("click", markMoved);
      if (saved && saved.key === key) {
        map.setView(saved.center, saved.zoom, { animate: false }); // même carte redessinée : on garde la vue
        userMoved = !!saved.userMoved;
      } else fitAll();
      map.on("moveend", () => {
        S.mapViews[info.secId] = { key, center: map.getCenter(), zoom: map.getZoom(), userMoved };
      });
      // un clic sur un point redessine la page quand d'autres blocs en dépendent : sa fenêtre d'information est rouverte
      if (S.mapPopup?.sec === info.secId) markers.get(S.mapPopup.id)?.openPopup();
      let lastW = el.clientWidth,
        lastH = el.clientHeight;
      new ResizeObserver(() => {
        if (!el.isConnected) return;
        map.invalidateSize();
        if ((el.clientWidth !== lastW || el.clientHeight !== lastH) && !userMoved) fitAll(); // cadre redimensionné
        lastW = el.clientWidth;
        lastH = el.clientHeight;
      }).observe(el);
    } catch (e) {
      el.outerHTML = `<div class="msg err">Carte : ${esc(e.message || e)}</div>`;
    }
  });
}

/* ---------- Graphique avancé (widget Plotly de Grist) : chargement de Plotly ---------- */
let plotlyP = null;
// loadPlotly — Charge Plotly (graphiques avancés) au premier besoin.
function loadPlotly() {
  return (plotlyP ??= (window.Plotly ? Promise.resolve() : loadLib(LIBS.plotly, "Plotly")).catch((e) => {
    plotlyP = null;
    throw e;
  }));
}
/* ---------- Listes de sélection intégrées ---------- */
function isSelector(b) {
  if (b.asSelect === true) return true;
  if (b.asSelect === false) return false;
  const sec = S.meta.sections.get(b.id);
  if (sec?.parentKey !== "custom") return false;
  const cv = parseJSON(parseJSON(sec.options).customView, null);
  return /drop-?down/i.test(cv?.url || "");
}
// selectorColumn — Colonne affichée par une liste de sélection.
function selectorColumn(b, info) {
  const cols = (S.meta.colsByTable.get(info.sec.tableRef) || []).filter(
    (c) => !c.colId.startsWith("gristHelper_") && c.colId !== "manualSort",
  );
  if (b.selCol) {
    const c = cols.find((x) => x.colId === b.selCol);
    if (c) return c;
  }
  const cv = parseJSON(parseJSON(info.sec.options).customView, null);
  const mapped = Object.values(parseJSON(cv?.columnsMapping, {}) || {})
    .map((v) => (Array.isArray(v) ? v[0] : v))
    .find(Boolean);
  if (mapped) {
    const c = colByKey(cols, mapped);
    if (c) return c;
  }
  return info.fields[0]?.col || cols[0];
}
/* Synchronisation entre pages (même principe que le drop-down de Varamil : un ID de session commun) */
function selectorSyncId(b) {
  if (b.syncId !== undefined && b.syncId !== "") return String(b.syncId);
  const sec = S.meta.sections.get(b.id);
  const cv = parseJSON(parseJSON(sec?.options).customView, null);
  return String(parseJSON(cv?.widgetOptions, {})?.sessionid || "");
}
/* Clé de stockage d'une sélection partagée (0.8.9) : document + table de la liste + identifiant.
   - le document : le stockage de session est commun à tout l'onglet, donc à tous les documents Grist ouverts
     successivement (sans lui, la sélection d'un autre document, par exemple sa copie de développement,
     s'imposait) ;
   - la table : un numéro de ligne n'a de sens que dans sa table (deux listes de tables différentes portant
     le même identifiant se « synchronisaient » sur des lignes sans rapport). */
const SYNC_PREFIX = "uxwg_sync_";
function syncKey(b) {
  const sid = selectorSyncId(b);
  if (!sid) return "";
  const tid = getInfo(b.id)?.tableId || "";
  return `${SYNC_PREFIX}${S.docKey || ""}:${tid}:${sid}`;
}
// readSync — Lit la sélection partagée (0 si aucune).
function readSync(key) {
  try {
    return Number(sessionStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}
// writeSync — Enregistre la sélection partagée.
function writeSync(key, rowId) {
  try {
    sessionStorage.setItem(key, String(rowId));
  } catch {
    /* stockage indisponible */
  }
}
window.addEventListener("storage", (ev) => {
  // autre widget ouvert dans le même onglet (autre page Grist) : même clé = même document, table et identifiant
  if (!ev.key?.startsWith(SYNC_PREFIX) || !S.meta || !ev.newValue) return;
  let hit = false;
  for (const b of S.cfg.blocks)
    if (isSelector(b) && syncKey(b) === ev.key && S.sel[b.id] !== Number(ev.newValue)) {
      S.sel[b.id] = Number(ev.newValue);
      hit = true;
    }
  if (hit) scheduleRender();
});

// renderSelectors — Affiche les listes de sélection dans l'en-tête (avec regroupement et ordre).
async function renderSelectors(sels, ctx) {
  const box = $("#filters");
  const parts = [];
  for (const b of sels) {
    const info = getInfo(b.id);
    const key = syncKey(b);
    try {
      const { rows } = await rowsFor(b.id, ctx);
      // sélection partagée : elle fait foi à chaque affichage (choix fait sur une autre page, y compris
      // une page du widget déjà visitée), à condition que la ligne figure dans cette liste
      if (key) {
        const v = readSync(key);
        if (v && rows.some((r) => r.id === v)) S.sel[b.id] = v;
      }
      const col = selectorColumn(b, info);
      const gcol = b.selGroup
        ? (S.meta.colsByTable.get(info.sec.tableRef) || []).find((c) => c.colId === b.selGroup)
        : null;
      await ensureRefTables(gcol ? [col, gcol] : [col]);
      const opts = parseJSON(col.widgetOptions),
        gopts = gcol ? parseJSON(gcol.widgetOptions) : null;
      const cmpFr = (x, y) => COLL.compare(x, y);
      let items = rows.map((r, i) => ({
        id: r.id,
        i,
        t: textOf(col, opts, r[col.colId]) || "(vide)",
        g: gcol ? textOf(gcol, gopts, r[gcol.colId]) || "(sans valeur)" : "",
      }));
      // groupe d'abord (ex. commune), puis ordre alphabétique du texte affiché, ou ordre de la vue Grist si choisi
      const viewOrder = b.selOrder === "vue",
        gDir = b.selGroupOrder === "desc" ? -1 : 1; // intertitres : A → Z, ou Z → A
      items.sort(
        (a, c) => (gcol ? gDir * cmpFr(a.g, c.g) : 0) || (viewOrder ? a.i - c.i : cmpFr(a.t, c.t) || a.i - c.i),
      );
      const cur = await selectedRowId(b.id, ctx);
      const opt = (x) => `<option value="${x.id}" ${x.id === cur ? "selected" : ""}>${esc(x.t)}</option>`;
      let inner = "";
      if (gcol) {
        let last = null;
        for (const x of items) {
          if (x.g !== last) {
            if (last !== null) inner += "</optgroup>";
            inner += `<optgroup label="${esc(x.g)}">`;
            last = x.g;
          }
          inner += opt(x);
        }
        if (last !== null) inner += "</optgroup>";
      } else inner = items.map(opt).join("");
      // une seule entrée possible (selon les droits) : la liste est masquée, mais sa sélection s'applique
      // et reste lisible à l'impression (selectionSummary lit aussi les listes masquées)
      const solo = items.length <= 1;
      const cap = esc(info.title);
      parts.push(
        `<label class="${solo ? "solo" : ""}" title="${cap}"><span class="fl">${cap}</span><select data-selector="${b.id}" aria-label="${cap}">${inner || "<option>(aucun choix)</option>"}</select></label>`,
      );
    } catch (e) {
      parts.push(`<label>${esc(info?.title || "")}<span class="msg err">${esc(e.message || e)}</span></label>`);
    }
  }
  const focused = document.activeElement?.dataset?.selector; // garder le focus clavier pendant le redessin
  box.innerHTML = parts.join("");
  if (focused) box.querySelector(`[data-selector="${focused}"]`)?.focus();
}
// onSelectorChange — Changement d'une liste de sélection : met à jour la sélection et relance le rendu.
function onSelectorChange(ev) {
  const t = ev.target.closest("[data-selector]");
  if (!t) return;
  if (S.sel[Number(t.dataset.selector)] === Number(t.value)) return; // « input » et « change » peuvent se suivre
  const id = Number(t.dataset.selector),
    rowId = Number(t.value);
  S.sel[id] = rowId;
  const b = S.cfg.blocks.find((x) => x.id === id),
    key = b && syncKey(b);
  if (key) {
    writeSync(key, rowId);
    for (const o of S.cfg.blocks) if (o.id !== id && isSelector(o) && syncKey(o) === key) S.sel[o.id] = rowId;
  }
  const all = [...document.querySelectorAll("#filters [data-selector]")];
  if (all.length && all[all.length - 1] === t) S.scrollTop = true; // dernière liste : on remonte en haut de page
  scheduleRender();
}
$("#filters").addEventListener("input", onSelectorChange);
$("#filters").addEventListener("change", onSelectorChange);

// advChartSpec — Lit la définition d'un graphique avancé (widget Plotly de Grist) et ses sources de données.
function advChartSpec(sec) {
  const cv = parseJSON(parseJSON(sec.options).customView, null);
  if (!cv) return null;
  const wo = parseJSON(cv.widgetOptions, {});
  const cands = [wo, ...Object.values(wo)]
    .map((x) => parseJSON(x, null))
    .filter((x) => x && typeof x === "object");
  for (const c of cands) {
    for (const d of [c, parseJSON(c.figure, null), parseJSON(c.chart, null)].filter(Boolean)) {
      const data = parseJSON(d.data, null);
      if (Array.isArray(data)) return { data, layout: parseJSON(d.layout, {}) };
    }
  }
  return { data: null, url: cv.url || "", keys: Object.keys(wo) };
}
// renderAdvChart — Affiche un graphique avancé avec Plotly, en remplaçant les références gristsrc par les données.
async function renderAdvChart(info, rows, body, jobs) {
  const spec = advChartSpec(info.sec);
  if (!spec?.data) {
    // diagnostic : description du widget dans Grist (sans ses options, parfois volumineuses)
    const cv = parseJSON(parseJSON(info.sec.options).customView, null);
    const raw = cv ? JSON.stringify({ ...cv, widgetOptions: undefined }).slice(0, 400) : "aucune description";
    body.innerHTML = `<div class="msg">Widget personnalisé non reconnu (ni graphique avancé, ni texte Markdown, ni carte)${spec ? ` — url : ${esc(spec.url) || "aucune"} ; options : ${esc(spec.keys.join(", ") || "aucune")}` : ""}<br><small style="font-family:monospace;word-break:break-all">${esc(raw)}</small></div>`;
    return;
  }
  const cols = S.meta.colsByTable.get(info.sec.tableRef) || [];
  await ensureRefTables(cols);
  const byName = new Map();
  for (const c of cols) {
    if (c.label && !byName.has(c.label)) byName.set(c.label, c);
  }
  for (const c of cols) byName.set(c.colId, c);
  const conv = (c, v) => {
    const t = baseType(c);
    if (isErr(v)) return null;
    if (t === "Numeric" || t === "Int" || t === "Bool") return v;
    if (t === "Date" && typeof v === "number") return new Date(v * 1000).toISOString().slice(0, 10);
    if (t === "DateTime" && typeof v === "number") return new Date(v * 1000).toISOString();
    return textOf(c, parseJSON(c.widgetOptions), v);
  };
  const seen = [],
    matched = [];
  const fill = (obj) => {
    // remplace chaque « xxxsrc: 'Colonne' » par les valeurs de la colonne
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      const srcs = k.endsWith("src")
        ? typeof v === "string"
          ? [v]
          : Array.isArray(v) && v.every((x) => typeof x === "string")
            ? v
            : null
        : null;
      if (srcs) {
        seen.push(`${k}=${srcs.join("+")}`);
        const cols = srcs.map((x) => {
          const m = /^gristsrc:(\d+)$/.exec(x);
          return m ? S.meta.cols.get(Number(m[1])) : byName.get(x);
        });
        if (cols.every(Boolean)) {
          matched.push(...srcs);
          const arrs = cols.map((c) => rows.map((r) => conv(c, r[c.colId])));
          // une colonne → tableau simple ; plusieurs → axe à catégories imbriquées (ex. NIVEAU puis RENTREE)
          obj[k.slice(0, -3)] = arrs.length === 1 ? arrs[0] : arrs;
        }
      } else if (typeof v === "object") fill(v);
    }
  };
  const data = JSON.parse(JSON.stringify(spec.data));
  data.forEach(fill);
  // camemberts : couleurs par catégorie (marker.colors), une valeur par ligne, dans l'ordre des lignes
  const blk = S.cfg.blocks.find((x) => x.id === info.secId);
  if (pieCustom(blk))
    for (const t of data)
      if (t && t.type !== "pie") {
        // barres, courbes… : couleur de la trace d'après son nom ; une seule trace de barres : une couleur par barre
        const map = pieColorMapOf(blk.pieColorMap);
        const named = map.get(pieKey(t.name));
        const cats = t.orientation === "h" ? t.y : t.x;
        if (named) {
          t.marker = { ...(t.marker || {}), color: named };
          if (t.type === "scatter") t.line = { ...(t.line || {}), color: named };
        } else if (data.length === 1 && (t.type || "scatter") === "bar" && Array.isArray(cats)) {
          const lab = cats.map((l) => (Array.isArray(l) ? l.join(" ") : l));
          const cols = pieColors(blk, lab, [], () => "", () => BRAND.c);
          if (blk.pieColorCol)
            lab.forEach((l, k) => {
              const own = hexColor(rows[k]?.[blk.pieColorCol]);
              if (own && !map.has(pieKey(l))) cols[k] = own;
            });
          if (cols.some((c) => c !== BRAND.c)) t.marker = { ...(t.marker || {}), color: cols };
        } else if (hexColor(blk.pieColorDefault) && !t.marker?.color) t.marker = { ...(t.marker || {}), color: hexColor(blk.pieColorDefault) };
      } else if (t?.type === "pie" && Array.isArray(t.labels)) {
        const lab = t.labels.map((l) => (Array.isArray(l) ? l.join(" ") : l));
        const cols = pieColors(blk, lab, [], () => "");
        // la colonne de codes se lit ligne à ligne (les étiquettes suivent l'ordre des lignes)
        if (blk.pieColorCol)
          lab.forEach((l, k) => {
            const own = hexColor(rows[k]?.[blk.pieColorCol]);
            if (own && !pieColorMapOf(blk.pieColorMap).has(pieKey(l))) cols[k] = own;
          });
        t.marker = { ...(t.marker || {}), colors: cols };
      }
  // camemberts : les étiquettes longues passent à la ligne (Plotly ne le fait pas) et la marge s'agrandit au
  // besoin pour les étiquettes placées à l'extérieur, qui étaient coupées au bord du bloc
  const wrapLabel = (l, max = 14) => {
    const words = String(l ?? "").split(/\s+/).filter(Boolean);
    if (String(l ?? "").length <= max || words.length < 2) return l;
    const lines = [];
    for (const w of words) {
      const last = lines[lines.length - 1];
      if (last && (last + " " + w).length <= max) lines[lines.length - 1] = last + " " + w;
      else lines.push(w);
    }
    return lines.join("<br>");
  };
  for (const t of data)
    if (t?.type === "pie") {
      t.automargin = true;
      // le nom des parts sur le graphique passe par « text » (coupé en lignes) ; « labels » reste intact pour la
      // légende et les couleurs
      const ti = String(t.textinfo || "percent");
      if (Array.isArray(t.labels) && /label/.test(ti) && !t.text) {
        t.text = t.labels.map((l) => (Array.isArray(l) ? l.join(" ") : wrapLabel(l)));
        t.textinfo = ti.replace("label", "text");
      }
    }
  if (!matched.length) {
    body.innerHTML =
      `<div class="msg">Graphique avancé : aucune colonne reconnue.<br>Références trouvées : ${esc(seen.join(" · ") || "aucune")}<br>` +
      `Traces : ${esc(JSON.stringify(spec.data).slice(0, 300))}</div>`;
    return;
  }
  const layout = {
    ...JSON.parse(JSON.stringify(spec.layout || {})),
    autosize: true,
    margin: { l: 45, r: 10, t: spec.layout?.title ? 34 : 10, b: 40 },
    font: { family: "Marianne, Arial, sans-serif", size: 11 },
    paper_bgcolor: "#fff",
    plot_bgcolor: "#fff",
  };
  delete layout.width;
  // camemberts : quand les parts portent déjà leur nom, la légende fait double emploi et recouvrait les étiquettes
  // placées à l'extérieur : elle est masquée (sauf si la légende est explicitement demandée dans le graphique)
  const pies = data.filter((t) => t?.type === "pie");
  if (pies.length && pies.every((t) => /text|label/.test(String(t.textinfo || ""))) && spec.layout?.showlegend !== true)
    layout.showlegend = false;
  body.innerHTML = '<div class="plot-box"></div>';
  const el = body.querySelector(".plot-box");
  delete layout.height;
  jobs.push(async () => {
    await loadPlotly();
    new ResizeObserver(() => {
      if (el.isConnected && el.data) Plotly.Plots.resize(el);
    }).observe(el);
    await Plotly.newPlot(el, data, layout, { displayModeBar: false, responsive: true });
  });
}

/* Sélection des widgets natifs de la page (ex. listes déroulantes en cascade).
   Grist transmet au widget la ligne choisie dans le widget qu'il « sélectionne par » ;
   on l'applique aux sections de même table, puis on remonte la chaîne de liaisons. */
function ancestorSections() {
  const set = new Set();
  for (const b of S.cfg.blocks) {
    let s = S.meta.sections.get(b.id),
      g = 0;
    while (s?.linkSrcSectionRef && g++ < 12) {
      if (!isRendered(s.linkSrcSectionRef)) set.add(s.linkSrcSectionRef);
      s = S.meta.sections.get(s.linkSrcSectionRef);
    }
  }
  return set;
}
// computeExtSel — Sélection reçue de Grist (ligne courante du widget) propagée vers les vues sources absentes de la page.
async function computeExtSel() {
  S.extSel = new Map();
  if (!S.ext.rowId || !S.ext.tableId) return;
  for (const secId of ancestorSections()) {
    if (getInfo(secId)?.tableId === S.ext.tableId) await propagateUp(secId, S.ext.rowId, 0);
  }
}
// propagateUp — Remonte une sélection le long de la chaîne de liaisons.
async function propagateUp(secId, rowId, depth) {
  S.extSel.set(secId, rowId);
  const info = getInfo(secId),
    sec = info?.sec,
    srcId = sec?.linkSrcSectionRef;
  if (!srcId || depth > 10 || isRendered(srcId) || S.extSel.has(srcId)) return;
  const src = getInfo(srcId);
  if (!src?.tableId) return;
  const row = (await fetchRows(info.tableId), S.byId[info.tableId].get(rowId));
  if (!row) return;
  const srcRows = await fetchRows(src.tableId);
  const sCol = sec.linkSrcColRef ? S.meta.cols.get(sec.linkSrcColRef)?.colId : null;
  const tCol = sec.linkTargetColRef ? S.meta.cols.get(sec.linkTargetColRef)?.colId : null;
  const first = (v) => (isList(v) ? v[1] : v);
  let srcRowId = 0;
  if (tCol && !sCol) srcRowId = first(row[tCol]);
  else if (tCol && sCol) srcRowId = srcRows.find((r) => same(first(r[sCol]), first(row[tCol])))?.id;
  else if (sCol)
    srcRowId = srcRows.find((r) => {
      const v = r[sCol];
      return isList(v) ? v.includes(rowId) : v === rowId;
    })?.id;
  else if (src.tableId === info.tableId) srcRowId = rowId;
  else {
    const pairs = summaryPairs(src, info);
    if (pairs.length) srcRowId = srcRows.find((r) => pairs.every(([sc, tc]) => same(r[sc], row[tc])))?.id;
  }
  if (srcRowId) await propagateUp(srcId, srcRowId, depth + 1);
}

// render — RENDU PRINCIPAL. Recalcule toute la page ; un rendu plus récent annule le précédent (renderSeq).
async function render() {
  if (!S.ready || !S.meta || S.choosing) return;
  fixColIds(S.cfg); // colonnes renommées dans Grist depuis l'enregistrement de la configuration
  if (S.editing) {
    S.pendingRender = true;
    return;
  }
  const my = (S.renderSeq = (S.renderSeq || 0) + 1); // un rendu plus récent annule celui-ci
  const stale = () => my !== S.renderSeq;
  applyTheme(S.nav?.theme); // apparence DSFR ou neutre (peut changer à l'enregistrement de la configuration)
  $("#title").textContent = S.cfg.title || "";
  renderForms();
  const setNoTitle = () =>
    $("#top").classList.toggle(
      "notitle",
      !String(S.cfg.title || "").trim() && !!($("#pnav").childElementCount || $("#filters").childElementCount),
    );
  renderNav();
  const grid = $("#grid");
  const scrolls = {};
  grid.querySelectorAll("[data-sec] .tbl-wrap").forEach((w) => {
    scrolls[w.closest("[data-sec]").dataset.sec] = w.scrollTop;
  });
  const winY = window.scrollY;

  const blocks = S.cfg.blocks.filter((b) => S.meta.sections.has(b.id));
  if (!blocks.length) {
    status(
      S.isAdmin
        ? "Aucune vue sélectionnée. Cliquer sur ⚙ pour choisir les vues à afficher."
        : "Cette page n'est pas encore configurée.",
    );
    grid.replaceChildren();
    $("#filters").replaceChildren();
    return;
  }
  status("");
  try {
    await computeExtSel();
  } catch {
    S.extSel = new Map();
  }
  grid.classList.toggle("dense", S.cfg.dense !== false && !S.cfg.flux);
  grid.classList.toggle("masonry", !!S.cfg.masonry && !S.cfg.flux);
  grid.classList.toggle("layout", !!S.layoutMode);
  grid.classList.toggle("flux", !!S.cfg.flux);
  grid.style.setProperty("--ch", `${S.cfg.chartHeight || 260}px`);
  const ctx = { rows: new Map() },
    frag = document.createDocumentFragment(),
    jobs = [];
  await prefetch(S.cfg); // toutes les tables en parallèle avant le calcul des blocs
  if (stale()) return;
  await renderSelectors(blocks.filter(isSelector), ctx);
  setNoTitle();

  let current = "",
    shown = 0,
    interrupted = false;
  const skipped = { unsupported: [], empty: [] }; // diagnostic : pourquoi un bloc n'est pas affiché
  const t0 = performance.now();
  const watch = setInterval(() => {
    if (current) status(`Calcul en cours : « ${current} »…`);
  }, 700);
  try {
    for (const b of blocks.filter((x) => !isSelector(x))) {
      const info = getInfo(b.id);
      if (!SUPPORTED.includes(info.kind)) {
        skipped.unsupported.push(`${info.title} (${info.kind})`);
        continue;
      }
      current = info.title;
      await new Promise((r) => setTimeout(r, 0)); // rend la main : l'indicateur et les clics restent actifs
      if (stale()) {
        interrupted = true;
        return;
      }
      const tb = performance.now();
      if (S.cfg.flux && b.newLine) {
        const br = document.createElement("div");
        br.className = "brk";
        frag.append(br);
      }
      try {
        let { rows } = await rowsFor(b.id, ctx);
        if (info.kind === "record") rows = applyUserView(info, rows); // tri et filtres choisis dans les en-têtes
        const qcs = [qfCol(b, info, 1), qfCol(b, info, 2)].filter(Boolean);
        if (qcs.length) await ensureRefTables(qcs); // champ du filtre rapide de type référence : texte affiché
        const before = rows.length; // lignes avant le filtre rapide
        const qfCtl = qfHtml(b, info, rows); // filtre rapide : sélecteur calculé sur toutes les lignes (affiché même sans données)…
        rows = qfApply(b, info, rows); // …puis seules les lignes choisies sont affichées
        const selId = await selectedRowId(b.id, ctx);
        const isSingle = info.kind === "single";
        if (!rows.length && !(isSingle && S.byId[info.tableId]?.get(selId))) {
          // diagnostic : table complète vs filtrée, et origine de la liaison
          try {
            const total = (await fetchRows(info.tableId)).length,
              srcId = info.sec.linkSrcSectionRef,
              src = srcId ? getInfo(srcId) : null;
            const srcSel = src ? await selectedRowId(srcId, ctx) : 0;
            const srcRow = src ? S.byId[src.tableId]?.get(srcSel) : null;
            const how = !src
              ? "aucune liaison"
              : `lié à « ${src.title} »${isRendered(srcId) ? "" : " (vue absente de la page"}${!isRendered(srcId) ? (S.extSel.has(srcId) ? ", sélection reçue de Grist)" : ", pas de sélection reçue de Grist)") : ""}, ligne sélectionnée : ${srcSel || "aucune"}${srcRow ? "" : srcSel ? " (introuvable)" : ""}`;
            skipped.detail = (skipped.detail || []).concat(
              `${info.title} : 0 ligne sur ${total} dans ${info.tableId} — ${how}`,
            );
          } catch {
            /* diagnostic facultatif */
          }
          // bloc masqué s'il n'a aucune donnée ; il reste affiché seulement si c'est le filtre rapide qui l'a vidé
          // (pour pouvoir revenir à « Tous »)
          if (S.cfg.hideEmptyBlocks && !(before && (qfCur(b) || qfCur(b, 2))) && !blockAddable(b, info)) {
            skipped.empty.push(info.title);
            continue;
          }
          const el = blockShell(b, info, KIND[info.kind], qfCtl); // le filtre reste affiché pour revenir à « Tous »
          el.classList.add("empty");
          el.querySelector(".bb").textContent = "Aucune donnée";
          if (blockAddable(b, info)) el.querySelector(".bb").insertAdjacentHTML("beforeend", addBtn(b, false));
          frag.append(el);
          continue;
        }
        const searchable =
          (info.kind === "record" || info.kind === "detail" || (info.kind === "single" && b.asList)) &&
          rows.length > 12;
        const search = searchable
          ? `<input class="search" data-search="${b.id}" placeholder="Filtrer…" value="${esc(S.search[b.id] || "")}">`
          : "";
        const badge =
          info.kind === "chart"
            ? KIND.chart
            : info.kind === "custom"
              ? isMarkdownSection(info.sec)
                ? "Texte"
                : "Graphique avancé"
              : `${rows.length} ligne${rows.length > 1 ? "s" : ""}`;
        const el = blockShell(b, info, badge, qfCtl + search);
        const body = el.querySelector(".bb");
        if (info.kind === "record") renderTable(info, rows, body, selId, jobs);
        else if (isSingle && b.asList)
          renderCards(info, rows, body, selId, jobs); // fiche affichée comme liste de fiches
        else if (isSingle) renderSingle(info, rows, body, selId, el);
        else if (info.kind === "detail") renderCards(info, rows, body, selId, jobs);
        else if (info.kind === "chart") renderChart(info, rows, body, jobs);
        else if (info.kind === "custom" && isMapSection(info.sec))
          await renderMap(info, rows, body, jobs, selId, b);
        else if (info.kind === "custom" && isMarkdownSection(info.sec)) await renderMarkdown(info, rows, body, selId, b);
        else if (info.kind === "custom") await renderAdvChart(info, rows, body, jobs);
        if (blockAddable(b, info)) body.insertAdjacentHTML("beforeend", addBtn(b));
        frag.append(el);
        shown++;
        const ms = Math.round(performance.now() - tb);
        if (ms > 300)
          console.info(
            `[UX widget] « ${info.title} » (${KIND[info.kind] || info.kind}) : ${rows.length} lignes, ${ms} ms`,
          );
      } catch (e) {
        const el = blockShell(b, info, "erreur");
        el.querySelector(".bb").innerHTML = `<div class="msg err">${esc(e.message || e)}</div>`;
        frag.append(el);
      }
    }
  } finally {
    clearInterval(watch);
    if (current) status("");
    console.info(
      `[UX widget] page « ${S.cfg.name} » ${interrupted ? "interrompue (un rendu plus récent a pris le relais)" : "calculée"} en ${Math.round(performance.now() - t0)} ms` +
        ` — blocs : ${blocks.length} configurés, ${blocks.filter(isSelector).length} liste(s) de sélection, ${shown} affichés` +
        (skipped.empty.length ? `, ${skipped.empty.length} vides masqués [${skipped.empty.join(" ; ")}]` : "") +
        (skipped.unsupported.length
          ? `, ${skipped.unsupported.length} non pris en charge [${skipped.unsupported.join(" ; ")}]`
          : "") +
        ` — widget posé sur ${S.ext.tableId || "?"}, ligne Grist ${S.ext.rowId || "aucune"}` +
        (skipped.detail?.length ? `\n  ${skipped.detail.join("\n  ")}` : ""),
    );
  }
  if (stale()) return;
  // jamais de page blanche : message simple (le détail reste dans la console)
  if (!frag.childElementCount) {
    const d = document.createElement("div");
    d.className = "msg";
    d.style.padding = "24px";
    d.textContent =
      skipped.unsupported.length && !skipped.empty.length
        ? `Type de vue non pris en charge : ${skipped.unsupported.join(", ")}`
        : "Aucune donnée, pas d'élément sélectionné";
    frag.append(d);
  }
  S.charts.forEach((c) => c.destroy());
  S.charts = [];
  if (window.Plotly) grid.querySelectorAll(".plot-box").forEach((el) => Plotly.purge(el));
  S.mapTeardown = true; // les fenêtres fermées par la suppression des cartes seront rouvertes
  S.maps.forEach((m) => m.remove());
  S.mapTeardown = false;
  S.maps = [];
  grid.replaceChildren(frag);
  if (S.maxed && !grid.querySelector(".maxed")) {
    // bloc plein écran disparu (vue retirée, bloc vide masqué…)
    S.maxed = null;
    $("#backdrop")?.classList.remove("on");
    document.body.style.overflow = "";
  }
  lockColumns(grid);
  fitQf(grid); // filtres rapides : présentation selon la place
  freezeColumns(grid);
  setupMasonry(grid);
  stackSticky(grid); // blocs figés empilés les uns sous les autres
  updateFoldButton();
  if (!S.prefetchedOthers) {
    S.prefetchedOthers = true;
    prefetchOthers();
  }
  jobs.forEach((j) =>
    Promise.resolve()
      .then(j)
      .catch((e) => status(e.message || String(e), true)),
  );
  grid.querySelectorAll("[data-sec] .tbl-wrap").forEach((w) => {
    const s = scrolls[w.closest("[data-sec]").dataset.sec];
    if (s) w.scrollTop = s;
  });
  for (const id of Object.keys(S.search)) applySearch(Number(id));
  if (S.scrollTop) {
    S.scrollTop = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else window.scrollTo(0, winY);
}
// scheduleRender — Demande un rendu (regroupe les demandes rapprochées ; différé pendant une édition).
function scheduleRender() {
  if (S.editing) {
    S.pendingRender = true;
    return;
  }
  clearTimeout(S.renderTimer);
  S.renderTimer = setTimeout(() => render().catch((e) => status(e.message, true)), 60);
}

// applySearch — Filtre les lignes affichées d'un bloc selon le champ « Filtrer… ».
function applySearch(secId) {
  const q = (S.search[secId] || "").toLowerCase().trim();
  let shown = 0;
  document.querySelectorAll(`[data-sec="${secId}"] tbody tr, [data-sec="${secId}"] .mini`).forEach((tr) => {
    tr.hidden = !!q && !tr.dataset.text.includes(q);
    if (!tr.hidden) shown++;
  });
  const rc = document.querySelector(`[data-sec="${secId}"] .rowcount`);
  if (rc) rc.textContent = q ? `${shown.toLocaleString("fr-FR")} sur ${rowCountText(Number(rc.dataset.total))}` : rowCountText(Number(rc.dataset.total));
}
// rowCountText — « 1 ligne », « 686 lignes ».
const rowCountText = (n) => `${n.toLocaleString("fr-FR")} ligne${n > 1 ? "s" : ""}`;
// hasRenderedDependents — Vrai si d'autres blocs affichés dépendent de la sélection de cette vue.
function hasRenderedDependents(secId) {
  return S.cfg.blocks.some((b) => {
    let s = S.meta.sections.get(b.id),
      g = 0;
    while (s?.linkSrcSectionRef && g++ < 10) {
      if (s.linkSrcSectionRef === secId) return true;
      s = S.meta.sections.get(s.linkSrcSectionRef);
    }
    return false;
  });
}

/* ---------- Interactions ---------- */
function onRlink(ev) {
  const a = ev.target.closest(".rlink");
  if (!a) return false;
  ev.preventDefault();
  ev.stopPropagation();
  openRecordCard(a.dataset.rt, Number(a.dataset.rr));
  return true;
}
$("#rc").addEventListener("click", (ev) => {
  if (onRlink(ev)) return;
  if (ev.target.closest("[data-rcclose]")) return closeRecordCard();
  if (ev.target.closest("[data-rcback]")) {
    rcHist.pop();
    const [t, r] = rcHist[rcHist.length - 1];
    openRecordCard(t, r, false);
  }
});
$("#rcBack").addEventListener("click", closeRecordCard);
document.addEventListener(
  "keydown",
  (ev) => {
    if (ev.key === "Escape" && $("#rc").classList.contains("on")) {
      ev.stopPropagation();
      closeRecordCard();
    }
  },
  true,
);
// selectRow — Sélection d'une ligne au clic : marque la ligne et met à jour les blocs liés.
function selectRow(rowEl) {
  const block = rowEl?.closest("[data-sec]");
  if (!block) return;
  const id = Number(block.dataset.sec),
    rid = Number(rowEl.dataset.row);
  // la sélection est marquée tout de suite, même si un recalcul des blocs liés suit
  block.querySelectorAll(".sel").forEach((x) => x.classList.remove("sel"));
  rowEl.classList.add("sel");
  if (S.sel[id] === rid) return;
  S.sel[id] = rid;
  if (hasRenderedDependents(id)) scheduleRender();
}
/* ---------- Mode disposition (glisser-déposer) ---------- */
// aperçu : un bloc de N lignes est N fois plus haut, pour visualiser la hauteur choisie
const layoutRowsCss = (b) =>
  !S.cfg.flux && !S.cfg.masonry && (b.rows || 1) > 1
    ? `--lyh:${(b.rows || 1) * 150 + ((b.rows || 1) - 1) * 40}px;`
    : "";
// enterLayout — Entre en mode Disposition (glisser-déposer et redimensionnement des blocs).
function enterLayout() {
  if (!S.isAdmin) return;
  S.layoutMode = true;
  S.layoutBackup = JSON.parse(JSON.stringify(S.cfg.blocks));
  S.layoutDense = S.cfg.dense;
  S.maxed = null;
  $("#backdrop")?.classList.remove("on");
  document.body.style.overflow = "";
  $("#lybar").hidden = false;
  $("#btnLayout").hidden = true;
  scheduleRender();
}
// exitLayout — Quitte le mode Disposition, en enregistrant ou en annulant.
function exitLayout(save) {
  S.layoutMode = false;
  $("#lybar").hidden = true;
  $("#btnLayout").hidden = !S.isAdmin;
  if (!save) {
    S.cfg.blocks = S.layoutBackup;
    S.cfg.dense = S.layoutDense;
  }
  S.layoutBackup = null;
  if (save) {
    (async () => {
      try {
        await grist.setOption("config", S.cfg);
      } catch {
        /* facultatif */
      }
      try {
        await saveConfigToTable(S.cfg);
        status("");
      } catch (e) {
        status(`Disposition appliquée mais non enregistrée : ${e.message || e}`, true);
      }
    })();
  }
  scheduleRender();
}
$("#btnLayout").addEventListener("click", enterLayout);
$("#lySave").addEventListener("click", () => exitLayout(true));
$("#lyCancel").addEventListener("click", () => exitLayout(false));
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && S.layoutMode && $("#config").hidden) exitLayout(false);
});

// blockOf — Bloc de configuration correspondant à une vue.
const blockOf = (id) => S.cfg.blocks.find((x) => x.id === id);
// kindOf — Type Grist d'une vue (record, single, detail, chart, custom).
const kindOf = (id) => S.meta.sections.get(id)?.parentKey;
let dragId = null;
$("#grid").addEventListener("dragstart", (ev) => {
  if (!S.layoutMode) return;
  const el = ev.target.closest?.(".block");
  if (!el || ev.target.closest(".lyr")) {
    ev.preventDefault();
    return;
  }
  dragId = Number(el.dataset.sec);
  el.classList.add("dragging");
  ev.dataTransfer.effectAllowed = "move";
  try {
    ev.dataTransfer.setData("text/plain", String(dragId));
  } catch {
    /* */
  }
});
// cible de dépôt = bloc le plus proche du pointeur (même dans un espace vide de la grille)
let dropAt = null;
// nearestDrop — Point d'insertion le plus proche du pointeur pendant un glisser-déposer.
function nearestDrop(x, y) {
  let best = null;
  for (const el of document.querySelectorAll("#grid > .block")) {
    if (Number(el.dataset.sec) === dragId) continue;
    const r = el.getBoundingClientRect();
    const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
    const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
    const d = dx * dx + dy * dy * 4; // la distance verticale compte double : on vise la bonne rangée
    if (!best || d < best.d) best = { el, d, after: x > r.left + r.width / 2 };
  }
  return best;
}
$("#grid").addEventListener("dragover", (ev) => {
  if (!S.layoutMode || dragId == null) return;
  ev.preventDefault();
  ev.dataTransfer.dropEffect = "move";
  const n = nearestDrop(ev.clientX, ev.clientY);
  if (n && dropAt && n.el === dropAt.el && n.after === dropAt.after) return;
  document
    .querySelectorAll(".drop-before, .drop-after")
    .forEach((x) => x.classList.remove("drop-before", "drop-after"));
  dropAt = n;
  if (n) n.el.classList.add(n.after ? "drop-after" : "drop-before");
});
$("#grid").addEventListener("drop", (ev) => {
  if (!S.layoutMode || dragId == null) return;
  ev.preventDefault();
  const n = dropAt || nearestDrop(ev.clientX, ev.clientY);
  dropAt = null;
  document
    .querySelectorAll(".drop-before, .drop-after")
    .forEach((x) => x.classList.remove("drop-before", "drop-after"));
  if (!n) return;
  const target = Number(n.el.dataset.sec),
    moved = blockOf(dragId),
    tb = blockOf(target);
  moved.start = 0; // placement libre après un déplacement
  // déposé au début d'une rangée : le bloc ouvre une nouvelle rangée (sinon il remonterait à côté du bloc précédent)
  const gl = $("#grid").getBoundingClientRect().left,
    rowStart = Math.abs(n.el.getBoundingClientRect().left - gl) < 6;
  moved.newLine = !n.after && rowStart;
  if (moved.newLine && tb.newLine) {
    tb.newLine = false;
    tb._restyle = true;
  }
  // l'ordre décide de la position : le remplissage automatique des trous et les colonnes imposées
  // pourraient sinon remettre le bloc à sa place d'origine
  if (S.cfg.dense !== false) {
    S.cfg.dense = false;
    $("#grid").classList.remove("dense");
    status("« Combler automatiquement les espaces libres » a été désactivé pour respecter l'ordre choisi.");
  }
  S.cfg.blocks = S.cfg.blocks.filter((x) => x.id !== dragId);
  const at = S.cfg.blocks.findIndex((x) => x.id === target);
  S.cfg.blocks.splice(at + (n.after ? 1 : 0), 0, moved);
  const dragged = $(`#grid > .block[data-sec="${dragId}"]`);
  if (dragged) {
    dragged.setAttribute("style", blockStyle(moved, kindOf(dragId)) + layoutRowsCss(moved));
    n.after ? n.el.after(dragged) : n.el.before(dragged);
  }
  if (tb._restyle) {
    delete tb._restyle;
    n.el.setAttribute("style", blockStyle(tb, kindOf(target)) + layoutRowsCss(tb));
  }
  setupMasonry($("#grid"));
});
$("#grid").addEventListener("dragend", () => {
  dragId = null;
  dropAt = null;
  document
    .querySelectorAll(".dragging, .drop-before, .drop-after")
    .forEach((x) => x.classList.remove("dragging", "drop-before", "drop-after"));
});
// redimensionnement : largeur en sixièmes de la page, hauteur en lignes (1 à 3)
$("#grid").addEventListener("pointerdown", (ev) => {
  const h = ev.target.closest(".lyr");
  if (!h || !S.layoutMode) return;
  ev.preventDefault();
  ev.stopPropagation();
  const el = h.closest(".block"),
    id = Number(h.dataset.lyr),
    b = blockOf(id),
    kind = kindOf(id);
  const grid = $("#grid"),
    gap = parseFloat(getComputedStyle(grid).getPropertyValue("--gap")) || 10;
  const colW = (grid.clientWidth - 5 * gap) / 6;
  const r0 = el.getBoundingClientRect(),
    x0 = ev.clientX,
    y0 = ev.clientY;
  const rows0 = b.rows || 1,
    rowH = r0.height / rows0;
  const maxW = b.start ? 7 - b.start : 6;
  const badge = document.createElement("span");
  badge.className = "lysize";
  el.append(badge);
  h.setPointerCapture(ev.pointerId);
  const move = (e) => {
    const w = Math.max(1, Math.min(maxW, Math.round((r0.width + (e.clientX - x0) + gap) / (colW + gap))));
    if (S.cfg.flux) b.fw = w;
    else b.width = w;
    if (!S.cfg.flux && !S.cfg.masonry)
      b.rows = Math.max(1, Math.min(3, Math.round((r0.height + (e.clientY - y0)) / rowH)));
    el.setAttribute("style", blockStyle(b, kind) + layoutRowsCss(b));
    el.classList.toggle("tall", !S.cfg.flux && (b.rows || 1) > 1);
    setupMasonry(grid);
    badge.textContent = `${w}/6${!S.cfg.flux && !S.cfg.masonry ? ` · ${b.rows || 1} ligne${(b.rows || 1) > 1 ? "s" : ""}` : ""}`;
  };
  const up = () => {
    h.removeEventListener("pointermove", move);
    h.removeEventListener("pointerup", up);
    badge.remove();
    el.querySelectorAll("table[data-fit]").forEach((t) => {
      delete t.dataset.locked;
    });
    setupMasonry(grid);
  };
  h.addEventListener("pointermove", move);
  h.addEventListener("pointerup", up);
  move(ev);
});

// addRow — Ajoute un enregistrement dans la table du bloc (AddRecord), lié à la sélection en cours
// (liaison Grist), puis le sélectionne et ouvre la saisie de son premier champ modifiable.
async function addRow(secId, btn) {
  const b = S.cfg.blocks.find((x) => x.id === secId),
    info = getInfo(secId);
  if (!blockAddable(b, info)) return;
  btn.disabled = true;
  try {
    const res = await grist.docApi.applyUserActions([["AddRecord", info.tableId, null, { ...(S.linkSet?.[secId] || {}) }]]);
    const rid = res?.retValues?.[0];
    const ref = info.sec.tableRef;
    for (const [id, t] of S.meta.tables)
      if (id === ref || t.summarySourceTable === ref) {
        delete S.cache[t.tableId];
        delete S.byId[t.tableId];
      }
    if (rid) S.sel[secId] = rid;
    S.search[secId] = ""; // la nouvelle ligne (vide) ne serait pas trouvée par la recherche
    scheduleRender();
    setTimeout(() => status("Ligne ajoutée"), 400);
    // après l'affichage : on se place sur la nouvelle ligne et on ouvre la saisie du premier champ
    for (let i = 0; rid && i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const c = document.querySelector(`#grid .block[data-sec="${secId}"] [data-rid="${rid}"][data-ed]`);
      if (c) {
        c.scrollIntoView({ block: "nearest" });
        startEdit(c);
        break;
      }
    }
  } catch (e) {
    const msg = String(e?.message || e);
    status(
      /access|acc[eè]s|permission|denied|blocked/i.test(msg)
        ? "Ajout refusé par les règles d'accès"
        : `Ajout impossible : ${msg}`,
      true,
    );
    btn.disabled = false;
  }
}
// delRow — Supprime la ligne sélectionnée du bloc (RemoveRecord). Premier clic : demande de confirmation dans le
// bouton lui-même (pas de fenêtre) ; second clic dans les 4 s : suppression. Les règles d'accès de Grist s'appliquent.
async function delRow(secId, btn) {
  const b = S.cfg.blocks.find((x) => x.id === secId),
    info = getInfo(secId);
  if (!blockAddable(b, info)) return;
  const tr = document.querySelector(`#grid .block[data-sec="${secId}"] .sel[data-row]`);
  const rid = Number(tr?.dataset.row) || 0;
  if (!rid) return status("Sélectionner d'abord la ligne à supprimer (clic sur la ligne).");
  if (!btn.classList.contains("confirm")) {
    btn.classList.add("confirm");
    btn.textContent = "Confirmer la suppression ?";
    tr.classList.add("todel");
    setTimeout(() => {
      btn.classList.remove("confirm");
      btn.textContent = "− Supprimer la ligne";
      tr.classList.remove("todel");
    }, 4000);
    return;
  }
  btn.disabled = true;
  try {
    await grist.docApi.applyUserActions([["RemoveRecord", info.tableId, rid]]);
    const ref = info.sec.tableRef;
    for (const [id, t] of S.meta.tables)
      if (id === ref || t.summarySourceTable === ref) {
        delete S.cache[t.tableId];
        delete S.byId[t.tableId];
      }
    delete S.sel[secId];
    scheduleRender();
    setTimeout(() => status("Ligne supprimée"), 400);
  } catch (e) {
    const msg = String(e?.message || e);
    status(
      /access|acc[eè]s|permission|denied|blocked/i.test(msg)
        ? "Suppression refusée par les règles d'accès"
        : `Suppression impossible : ${msg}`,
      true,
    );
    btn.disabled = false;
  }
}
$("#grid").addEventListener("click", (ev) => {
  const a = ev.target.closest("[data-addrow]");
  if (a) addRow(Number(a.dataset.addrow), a);
  const d = ev.target.closest("[data-delrow]");
  if (d) delRow(Number(d.dataset.delrow), d);
});
$("#grid").addEventListener("dblclick", (ev) => {
  const c = ev.target.closest("td[data-ed]");
  if (c) {
    ev.preventDefault();
    startEdit(c);
  }
});
$("#grid").addEventListener("keydown", (ev) => {
  // accessibilité : Entrée sur un champ éditable
  if (ev.key === "Enter" && ev.target.matches?.(".rlink")) {
    ev.preventDefault();
    openRecordCard(ev.target.dataset.rt, Number(ev.target.dataset.rr));
    return;
  }
  if (ev.key === "Enter" && ev.target.matches?.("[data-ed]")) {
    ev.preventDefault();
    startEdit(ev.target);
  }
});
$("#grid").addEventListener("click", (ev) => {
  if (S.layoutMode) return;
  const qt = ev.target.closest("[data-qftog]"); // filtre rapide compact : ouvrir / fermer la liste
  if (qt) {
    ev.stopPropagation();
    qfToggle(qt);
    return;
  }
  const qb = ev.target.closest("[data-qf]"); // filtre rapide : bouton d'une valeur
  if (qb) {
    ev.stopPropagation();
    const k = Number(qb.dataset.qk) || 1;
    if (ev.shiftKey) return qfSync(Number(qb.dataset.qf), qb.dataset.qv, k); // Maj+clic : tous les blocs
    S.qf[k === 2 ? `${qb.dataset.qf}:2` : Number(qb.dataset.qf)] = qb.dataset.qv;
    scheduleRender();
    return;
  }
  const fb = ev.target.closest("[data-filt]");
  if (fb) {
    ev.stopPropagation();
    openFilter(fb, Number(fb.closest("[data-sec]").dataset.sec), fb.dataset.filt);
    return;
  }
  const sb = ev.target.closest("[data-sort]");
  if (sb) {
    // tri : croissant → décroissant → ordre de la vue Grist
    const id = Number(sb.closest("[data-sec]").dataset.sec),
      c = sb.dataset.sort,
      cur = S.usort[id];
    if (!cur || cur.colId !== c) S.usort[id] = { colId: c, desc: false };
    else if (!cur.desc) cur.desc = true;
    else delete S.usort[id];
    scheduleRender();
    return;
  }
  if (onRlink(ev)) return;
  // tableau : un clic sur une cellule éditable d'une ligne déjà sélectionnée ouvre la saisie
  // (le double-clic échoue quand la sélection redessine la page entre les deux clics)
  const tc = ev.target.closest("td[data-ed]");
  if (tc && !ev.target.closest(".ed-input")) {
    const tr = tc.closest("tr");
    if (tc.dataset.kind === "sel" || tr?.classList.contains("sel")) {
      selectRow(tr); // la ligne devient la ligne courante…
      startEdit(tc); // …et la cellule s'ouvre en saisie (liste déroulante pour Référence / Choix)
      return;
    }
  }
  const fe = ev.target.closest("dd[data-ed]");
  if (fe && !ev.target.closest(".ed-input")) {
    startEdit(fe);
    return;
  }
  const mx = ev.target.closest("[data-max]");
  if (mx) {
    setMaxed(S.maxed === Number(mx.dataset.max) ? null : Number(mx.dataset.max));
    return;
  }
  // bloc replié : un clic n'importe où sur son en-tête le déplie
  const ch = ev.target.closest(".block.collapsed > .bh");
  const tog =
    ev.target.closest("[data-tog]") ||
    (ch && !ev.target.closest("button, input, a") ? ch.querySelector("[data-tog]") : null);
  if (tog) {
    const id = Number(tog.dataset.tog);
    S.collapsed[id] = !S.collapsed[id];
    tog.closest(".block").classList.toggle("collapsed", S.collapsed[id]);
    tog.textContent = S.collapsed[id] ? "▸" : "▾";
    updateFoldButton();
    if (!S.collapsed[id]) lockColumns(tog.closest(".block"));
    return;
  }
  const nav = ev.target.closest("[data-nav]");
  if (nav) {
    const id = Number(nav.dataset.sec),
      step = Number(nav.dataset.nav);
    rowsFor(id, { rows: new Map() }).then(async ({ rows }) => {
      const cur = await selectedRowId(id, { rows: new Map() });
      const i = rows.findIndex((r) => r.id === cur);
      const next = rows[(Math.max(0, i) + step + rows.length) % rows.length];
      if (next) {
        S.sel[id] = next.id;
        scheduleRender();
      }
    });
    return;
  }
  const rowEl = ev.target.closest("[data-row]");
  if (rowEl) selectRow(rowEl);
});
// clic milieu sur une valeur (ou sur la liste) d'un filtre rapide : synchroniser tous les blocs
$("#grid").addEventListener("mousedown", (ev) => {
  if (ev.button === 1 && ev.target.closest(".qf, [data-qfs]")) ev.preventDefault(); // pas de défilement auto
});
$("#grid").addEventListener("auxclick", (ev) => {
  if (ev.button !== 1 || S.layoutMode) return;
  const qb = ev.target.closest("[data-qf]"),
    qs = ev.target.closest("[data-qfs]");
  if (!qb && !qs) return;
  ev.preventDefault();
  ev.stopPropagation();
  if (qb) qfSync(Number(qb.dataset.qf), qb.dataset.qv, Number(qb.dataset.qk) || 1);
  else qfSync(Number(qs.dataset.qfs), qs.value, Number(qs.dataset.qk) || 1);
});
$("#grid").addEventListener("change", (ev) => {
  const qs = ev.target.closest("[data-qfs]"); // filtre rapide au-delà de 4 valeurs
  if (qs) {
    S.qf[Number(qs.dataset.qk) === 2 ? `${qs.dataset.qfs}:2` : Number(qs.dataset.qfs)] = qs.value;
    scheduleRender();
  }
});
$("#grid").addEventListener("input", (ev) => {
  const inp = ev.target.closest("[data-search]");
  if (inp) {
    const id = Number(inp.dataset.search);
    S.search[id] = inp.value;
    applySearch(id);
  }
});
const backdrop = document.createElement("div");
backdrop.id = "backdrop";
document.body.append(backdrop);
// setMaxed — Affiche un bloc en plein écran (ou revient à la page).
function setMaxed(id) {
  S.maxed = id || null;
  backdrop.classList.toggle("on", !!S.maxed);
  document.body.style.overflow = S.maxed ? "hidden" : "";
  scheduleRender();
}
backdrop.addEventListener("click", () => setMaxed(null));
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && S.maxed && $("#config").hidden) setMaxed(null);
});
window.addEventListener("scroll", () => $("#top").classList.toggle("stuck", window.scrollY > 4), {
  passive: true,
});
const tip = document.createElement("div");
tip.id = "tip";
document.body.append(tip);
$("#grid").addEventListener("mouseover", (ev) => {
  const d = ev.target.closest("[data-desc]"); // description de colonne (en-tête ou libellé de fiche)
  const h = d || ev.target.closest(".bh h2"); // ou titre de bloc tronqué
  if (!h || (!d && h.scrollWidth <= h.clientWidth)) return;
  tip.textContent = d ? d.dataset.desc : h.textContent;
  tip.classList.add("on");
  const r = h.getBoundingClientRect();
  tip.style.top = `${r.bottom + 4}px`;
  tip.style.left = `${Math.max(4, Math.min(r.left, window.innerWidth - tip.offsetWidth - 4))}px`;
});
$("#grid").addEventListener("mouseout", (ev) => {
  if (ev.target.closest(".bh h2, [data-desc]")) tip.classList.remove("on");
});
window.addEventListener(
  "scroll",
  (e) => {
    tip.classList.remove("on");
    if (!e.target.closest?.(".picker"))
      document.querySelector(".picker") && document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  },
  true,
);
$("#btnRefresh").addEventListener("click", () => refreshAll());
/* ---------- Impression / PDF ---------- */
function selectionSummary() {
  // « Département : Finistère · Circonscription : … »
  return [...document.querySelectorAll("#filters label")]
    .map((l) => {
      const sel = l.querySelector("select");
      return sel
        ? `${l.firstChild?.textContent?.trim() || ""} : ${sel.selectedOptions[0]?.textContent || ""}`
        : "";
    })
    .filter(Boolean)
    .join(" · ");
}
// printPage — Impression / PDF : tout déplier, attendre la fin de l'affichage, puis imprimer.
async function printPage() {
  const ph = $("#printhead"),
    sel = selectionSummary();
  ph.innerHTML = `<h1>${esc(S.cfg.title || S.cfg.name || "")}</h1>${sel ? `<p>${esc(sel)}</p>` : ""}<p>Édité le ${new Date().toLocaleDateString("fr-FR")}</p>`;
  // tout déplier, sortir du plein écran, et attendre la fin de l'affichage progressif des grands tableaux
  const saved = { ...S.collapsed },
    maxed = S.maxed;
  S.collapsed = Object.fromEntries(S.cfg.blocks.map((b) => [b.id, false]));
  S.maxed = null;
  $("#backdrop")?.classList.remove("on");
  document.body.style.overflow = "";
  document.querySelectorAll("#grid .block.collapsed").forEach((el) => el.classList.remove("collapsed"));
  document.querySelectorAll("#grid .block.maxed").forEach((el) => el.classList.remove("maxed"));
  // largeur d'une page A4 paysage : graphiques, cartes et tableaux se recalent avant l'impression
  document.documentElement.classList.add("printing");
  await new Promise((r) => setTimeout(r, 50));
  await new Promise((r) => setTimeout(r, 400));
  window.dispatchEvent(new Event("resize")); // graphiques et cartes à la bonne taille
  await new Promise((r) => setTimeout(r, 300));
  markPrintBig();
  const restore = () => {
    S.collapsed = saved;
    S.maxed = maxed;
    document.documentElement.classList.remove("printing");
    window.dispatchEvent(new Event("resize"));
    window.removeEventListener("afterprint", restore);
    scheduleRender();
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
// markPrintBig — Repère les blocs plus hauts qu'une page : à l'impression ils partent à la ligne
// et se coupent d'une page à l'autre (contenu complet mesuré, sans la hauteur limitée de l'écran).
function markPrintBig() {
  document.querySelectorAll("#grid > .block").forEach((el) => {
    const inner = [...el.querySelectorAll(":scope > .bb, .tbl-wrap, .cartes")].map((x) => x.scrollHeight + 40);
    const h = Math.max(el.offsetHeight, ...inner);
    el.classList.toggle("printbig", h > 600);
  });
}
window.addEventListener("beforeprint", markPrintBig); // impression lancée par Ctrl+P
$("#btnPrint").addEventListener("click", () => printPage());
// Plein écran : la page Grist qui contient ce widget, en mode page unique (sans les menus de Grist), nouvel onglet
$("#btnSingle").addEventListener("click", async () => {
  menuToggle(false);
  const base = safeBase(S.nav?.url) || safeBase(await guessDocUrl());
  const vid = hostView(S.cfg.name);
  if (!base || !vid) return status("Plein écran : page Grist du widget introuvable (adresse du document à renseigner dans la configuration).", true);
  window.open(pageUrl(base, vid, true), "_blank", "noopener");
});

/* ---------- Aide intégrée ----------
   Les fichiers Markdown du dépôt (à côté du widget sur GitHub Pages) sont lus à l'ouverture et affichés
   dans une fenêtre à onglets : déposer une nouvelle version sur GitHub met l'aide à jour.
   Mise en forme : marked ; HTML nettoyé par DOMPurify. Une pastille signale une nouvelle version. */
const HELP_DOCS = [
  { id: "guide", label: "Guide", file: "GUIDE-UTILISATEUR.md" },
  { id: "admin", label: "Administration", file: "GUIDE-ADMINISTRATEUR.md", admin: true }, // composer les pages
  { id: "news", label: "Nouveautés", file: "CHANGELOG.md" },
  { id: "about", label: "À propos", file: "README.md", admin: true }, // documentation technique : administrateurs
];
const SEEN_KEY = "uxwg_seen_version"; // dernière version dont l'utilisateur a vu les nouveautés (navigateur)
const helpCache = {};
let helpTab = "guide";
// seenVersion / markSeen — Version déjà vue (stockage local du navigateur, facultatif).
const seenVersion = () => {
  try {
    return localStorage.getItem(SEEN_KEY) || "";
  } catch {
    return VERSION; // stockage indisponible : pas de pastille
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, VERSION);
  } catch {
    /* facultatif */
  }
  updateHelpDot();
};
// updateHelpDot — Pastille « nouveau » sur le bouton Aide si la version a changé depuis la dernière visite.
function updateHelpDot() {
  const dot = $("#btnHelp .newdot"),
    isNew = seenVersion() !== VERSION;
  dot.hidden = !isNew;
  $("#btnMenu .newdot").hidden = !isNew; // visible aussi quand le menu est fermé
  $("#btnHelp").dataset.tip = isNew
    ? `Aide — nouvelle version ${VERSION} : voir les nouveautés`
    : `Aide : guide d'utilisation et nouveautés — UX widget grist ${VERSION}`;
  // infobulle du menu ☰ : version du widget (et rappel d'une nouvelle version)
  $("#btnMenu").dataset.tip = `Menu : actions de la page — UX widget grist ${VERSION}${isNew ? " (nouvelle version)" : ""}`;
}
// slug — Identifiant d'ancre d'un titre, comme GitHub (« 2. Composer une page » → « 2-composer-une-page »).
const slug = (t) =>
  t
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
// helpLoad — Lit et met en forme un fichier Markdown (mis en cache pour la session).
function helpLoad(doc) {
  return (helpCache[doc.id] ??= Promise.all([
    window.marked ? null : loadLib(LIBS.marked, "marked"),
    window.DOMPurify ? null : loadLib(LIBS.purify, "DOMPurify"),
  ])
    .then(() => fetch(new URL(doc.file, location.href), { cache: "no-cache" }))
    .then((r) => {
      if (!r.ok) throw new Error(`${doc.file} introuvable (HTTP ${r.status})`);
      return r.text();
    })
    .then((md) => DOMPurify.sanitize(marked.parse(md)))
    .catch((e) => {
      delete helpCache[doc.id];
      throw e;
    }));
}
// newsForUsers — Nouveautés vues par un utilisateur : seules les rubriques « Utilisateurs » de chaque version
// (les rubriques « Administrateurs » et « Développeurs » sont retirées, puis les versions restées vides).
function newsForUsers(body) {
  const until = (el, stop) => {
    const out = [];
    for (let n = el.nextElementSibling; n && !stop(n); n = n.nextElementSibling) out.push(n);
    return out;
  };
  for (const h3 of [...body.querySelectorAll("h3")])
    if (/^(administrateurs|d[ée]veloppeurs)$/i.test(h3.textContent.trim())) {
      until(h3, (n) => /^H[123]$/.test(n.tagName) || n.tagName === "HR").forEach((n) => n.remove());
      h3.remove();
    }
  for (const h2 of [...body.querySelectorAll("h2")]) {
    if (!/^\[/.test(h2.textContent.trim())) continue; // en-têtes de version « [0.9.2.2] — … »
    const part = until(h2, (n) => n.tagName === "H2" || n.tagName === "HR");
    if (!part.some((n) => n.tagName === "H3")) {
      part.forEach((n) => n.remove());
      h2.remove();
    }
  }
  // l'en-tête du journal : la mention des trois rubriques ne concerne pas l'utilisateur
  body.querySelectorAll("p").forEach((p) => {
    if (/^Qui est concerné/.test(p.textContent.trim())) {
      if (p.nextElementSibling?.tagName === "UL") p.nextElementSibling.remove();
      p.remove();
    } else if (/^Dans l'onglet Nouveautés/.test(p.textContent.trim())) p.remove();
  });
}
/* ---------- Message d'accueil (0.9.3) ----------
   Texte Markdown réglé par l'administrateur (S.nav.welcome, ligne _Navigation de W_Composition), affiché au
   démarrage. « Ne plus afficher » mémorise, dans le navigateur, l'empreinte du texte : un texte modifié s'affiche
   de nouveau. */
const welcomeKey = () => `uxwg_welcome_${S.docKey || "doc"}`;
const textHash = (t) => {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (Math.imul(31, h) + t.charCodeAt(i)) | 0;
  return String(h >>> 0);
};
// showWelcome — Affiche le message (force : aperçu depuis la configuration, même s'il a été masqué).
// mdFolds — Parties repliables du message d'accueil : une ligne « +++ Titre » ouvre une partie repliée (« +++! Titre » :
//   dépliée au départ), une ligne « +++ » seule la ferme ; parties imbriquables, fermeture implicite en fin de texte.
//   Converti en <details><summary> avant Markdown ; le contenu reste du Markdown (lignes vides autour).
function mdFolds(text) {
  let open = 0;
  const out = String(text)
    .split("\n")
    .map((line) => {
      const m = /^\s*\+\+\+(!?)\s*(.*?)\s*$/.exec(line);
      if (!m) return line;
      if (!m[2]) {
        if (!open) return line;
        open--;
        return "\n</details>\n";
      }
      open++;
      return `\n<details${m[1] ? " open" : ""}><summary>${marked.parseInline(m[2])}</summary>\n`;
    });
  while (open-- > 0) out.push("\n</details>\n");
  return out.join("\n");
}
async function showWelcome(force = false, text = S.nav?.welcome || "") {
  text = String(text || "").trim();
  if (!text) return force && status("Message d'accueil vide");
  const hash = textHash(text);
  let seen = null;
  try {
    seen = localStorage.getItem(welcomeKey());
  } catch {
    /* stockage indisponible : le message s'affiche à chaque fois */
  }
  if (!force && seen === hash) return;
  try {
    await Promise.all([
      window.marked ? null : loadLib(LIBS.marked, "marked"),
      window.DOMPurify ? null : loadLib(LIBS.purify, "DOMPurify"),
    ]);
  } catch {
    return; // bibliothèques indisponibles : pas de message plutôt qu'un texte brut
  }
  const box = $("#welcome");
  if (!box) return; // index.html antérieur à 0.9.3
  box.querySelector(".wbody").innerHTML = DOMPurify.sanitize(marked.parse(mdFolds(text)), { ADD_ATTR: ["open"] });
  box.querySelectorAll(".wbody a[href]").forEach((a) => Object.assign(a, { target: "_blank", rel: "noopener" }));
  $("#wNoMore").checked = seen === hash;
  box.dataset.hash = hash;
  box.hidden = false;
  $("#wClose").focus();
}
function closeWelcome() {
  const box = $("#welcome");
  if (!box || box.hidden) return;
  try {
    if ($("#wNoMore").checked) localStorage.setItem(welcomeKey(), box.dataset.hash);
    else localStorage.removeItem(welcomeKey());
  } catch {
    /* stockage indisponible */
  }
  box.hidden = true;
}
$("#wClose")?.addEventListener("click", closeWelcome); // (absent d'un index.html antérieur à 0.9.3)
$("#welcome")?.addEventListener("click", (ev) => {
  if (ev.target.id === "welcome") closeWelcome(); // clic sur le fond
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && $("#welcome") && !$("#welcome").hidden) closeWelcome();
});
// openHelp — Ouvre la fenêtre d'aide sur un onglet (et une ancre éventuelle).
async function openHelp(tab = helpTab, anchor = "") {
  const docs = HELP_DOCS.filter((d) => !d.admin || S.isAdmin);
  const doc = docs.find((d) => d.id === tab) || docs[0];
  helpTab = doc.id;
  $("#help").hidden = false;
  $("#helpTitle").textContent = `Aide — UX widget grist ${VERSION} · Ligures`;
  $("#help .htabs").innerHTML =
    docs
      .map((d) => `<button role="tab" data-htab="${d.id}" class="${d.id === doc.id ? "on" : ""}" aria-selected="${d.id === doc.id}">${esc(d.label)}</button>`)
      .join("") +
    // message d'accueil : le revoir à tout moment (même après « Ne plus afficher »)
    (String(S.nav?.welcome || "").trim() && $("#welcome")
      ? `<button data-hwelcome="1" title="Afficher de nouveau le message d'accueil">Message d'accueil</button>`
      : "");
  const body = $("#help .hbody");
  body.innerHTML = '<p class="msg">Chargement…</p>';
  try {
    body.innerHTML = await helpLoad(doc);
    if (doc.id === "news" && !S.isAdmin) newsForUsers(body);
    body.querySelectorAll("h1, h2, h3, h4").forEach((h) => (h.id = slug(h.textContent)));
    body.querySelectorAll("a[href]").forEach((a) => {
      if (/^https?:/i.test(a.getAttribute("href"))) Object.assign(a, { target: "_blank", rel: "noopener" });
    });
    if (doc.id === "news") markSeen();
    const target = anchor && body.querySelector(`#${CSS.escape(anchor)}`);
    if (target) target.scrollIntoView();
    else body.scrollTop = 0;
  } catch (e) {
    body.innerHTML = `<p class="msg err">Aide indisponible : ${esc(e.message || e)}.</p>
      <p class="msg">Les fichiers ${HELP_DOCS.map((d) => `<code>${d.file}</code>`).join(", ")} doivent être déposés à côté du widget.</p>`;
  }
}
const closeHelp = () => ($("#help").hidden = true);
$("#btnHelp").addEventListener("click", () => openHelp("guide")); // le guide d'abord ; la pastille signale les nouveautés
$("#helpClose").addEventListener("click", closeHelp);
$("#help").addEventListener("click", (ev) => {
  if (ev.target.id === "help") return closeHelp(); // clic sur le fond
  if (ev.target.closest("[data-hwelcome]")) {
    closeHelp();
    return showWelcome(true);
  }
  const t = ev.target.closest("[data-htab]");
  if (t) return openHelp(t.dataset.htab);
  const a = ev.target.closest("a[href]");
  if (!a) return;
  const href = a.getAttribute("href");
  if (href.startsWith("#")) {
    // ancre dans le document affiché
    ev.preventDefault();
    $("#help .hbody").querySelector(`#${CSS.escape(decodeURIComponent(href.slice(1)))}`)?.scrollIntoView();
    return;
  }
  const m = /^(?:\.\/)?([\w.-]+\.md)(?:#(.*))?$/i.exec(href); // lien vers un autre fichier de l'aide
  const doc = m && HELP_DOCS.find((d) => d.file.toLowerCase() === m[1].toLowerCase());
  if (doc) {
    ev.preventDefault();
    openHelp(doc.id, m[2] ? decodeURIComponent(m[2]) : "");
  }
});
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape" && !$("#help").hidden) closeHelp();
});
updateHelpDot();

// updateFoldButton — Libellé du bouton « Tout replier / Tout déplier » selon l'état des blocs.
function updateFoldButton() {
  const any = S.cfg.blocks.some((b) => S.collapsed[b.id]);
  const t = any ? "Tout déplier" : "Tout replier";
  $("#btnFold .lbl").textContent = t;
  $("#btnFold").dataset.tip = t;
  $("#btnFold").setAttribute("aria-label", t);
  $("#btnFold svg").innerHTML = any
    ? '<path d="M7 9l5-5 5 5M7 15l5 5 5-5"/>'
    : '<path d="M7 4l5 5 5-5M7 20l5-5 5 5"/>';
}
$("#btnFold").addEventListener("click", () => {
  const any = S.cfg.blocks.some((b) => S.collapsed[b.id]);
  for (const b of S.cfg.blocks) S.collapsed[b.id] = !any;
  document.querySelectorAll("#grid .block").forEach((el) => {
    el.classList.toggle("collapsed", !any);
    const t = el.querySelector(".tog");
    if (t) t.textContent = any ? "▾" : "▸";
  });
  if (any) lockColumns($("#grid"));
  updateFoldButton();
});
$("#btnConfig").addEventListener("click", () => openConfig());

/* Colonnes choisies dans la configuration : elles sont enregistrées par identifiant (colId), qui change quand
   on renomme une colonne dans Grist. On garde aussi leur numéro interne (colRef, stable) dans b._refs pour
   retrouver le nouvel identifiant automatiquement. */
const COL_FIELDS = ["mapLabel", "mapColor", "mapColor2", "mapRing", "mapCommune", "selCol", "selGroup", "zoneSum", "qfField", "qfField2", "legisCol", "collegeCol", "pieColorCol"];
const COL_SPECIAL = new Set(["", "__qpv", "__pos"]); // valeurs qui ne sont pas des colonnes
// colFieldTable — Table d'une option de colonne (zoneKey / zoneVal : table choisie pour colorer les zones).
function colFieldTable(b, f) {
  if (f === "zoneKey" || f === "zoneVal") return [...S.meta.tables.values()].find((t) => t.tableId === b.zoneTable)?.id;
  return S.meta.sections.get(b.id)?.tableRef;
}
// rememberColRefs — À l'enregistrement : mémorise le colRef de chaque colonne choisie.
function rememberColRefs(cfg) {
  for (const b of cfg.blocks || []) {
    const refs = {};
    for (const f of [...COL_FIELDS, "zoneKey", "zoneVal"]) {
      if (COL_SPECIAL.has(b[f] ?? "")) continue;
      const c = (S.meta.colsByTable.get(colFieldTable(b, f)) || []).find((x) => x.colId === b[f]);
      if (c) refs[f] = c.id;
    }
    b._refs = refs;
  }
}
// fixColIds — Au chargement : remplace l'identifiant d'une colonne renommée par son nouvel identifiant.
function fixColIds(cfg) {
  let changed = false;
  for (const b of cfg?.blocks || []) {
    for (const [f, ref] of Object.entries(b._refs || {})) {
      const cols = S.meta.colsByTable.get(colFieldTable(b, f)) || [];
      if (cols.some((x) => x.colId === b[f])) continue; // toujours valide
      const c = S.meta.cols.get(ref);
      if (c && cols.includes(c)) {
        b[f] = c.colId;
        changed = true;
      }
    }
  }
  return changed;
}
// refreshAll — Bouton Actualiser : vide les caches et relit métadonnées, configuration et données.
async function refreshAll() {
  S.cache = {};
  S.byId = {};
  try {
    status("Rechargement…");
    await loadMeta();
    fixColIds(S.cfg); // colonnes renommées dans Grist
    await render();
  } catch (e) {
    status(e.message || String(e), true);
  }
}

/* ---------- Panneau de configuration ---------- */
let draftNav = { url: "", items: [] };
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
/* Droit de configurer : contrôlé par une table témoin W_Admin, protégée par une règle d'accès.
   - seuls ceux qui en lisent au moins une ligne peuvent configurer ;
   - exception : document encore sans configuration (installation). W_Admin est alors créée au premier
     enregistrement, avec une ligne : il reste à la protéger par une règle d'accès. */
const ADMIN_TABLE = "W_Admin";
// checkAdmin — L'utilisateur peut-il configurer ? (lit au moins une ligne de W_Admin, ou installation).
async function checkAdmin() {
  /* Fermé par défaut (0.8.10). Configurer est permis :
     - à qui lit au moins une ligne de W_Admin (table protégée par une règle d'accès) ;
     - sinon, seulement tant que le document n'a encore aucune configuration (installation).
     Avant, une table W_Admin invisible était prise pour une table absente, sauf si un témoin « _Securite »
     avait été posé dans W_Composition et restait lisible : sans ce témoin, un éditeur qui ne voyait pas W_Admin
     pouvait tout de même configurer. */
  try {
    const t = await grist.docApi.fetchTable(ADMIN_TABLE); // échoue si la table est absente ou interdite
    if ((t.id || []).length > 0) return true;
  } catch {
    /* absente ou non lisible : voir ci-dessous */
  }
  try {
    const tables = await grist.docApi.listTables();
    if (tables.includes(ADMIN_TABLE)) return false; // table visible mais vide pour cet utilisateur
    // installation : aucune configuration enregistrée (en dehors des lignes techniques « _… »)
    const stored = tables.includes(CFG_TABLE) ? toRows(await grist.docApi.fetchTable(CFG_TABLE)) : [];
    const configured = stored.some((r) => !String(r.Nom || "").startsWith("_"));
    if (!configured) S.adminHint = true; // rappel : créer et protéger W_Admin
    return !configured;
  } catch {
    return false;
  }
}
// openConfig — Ouvre le panneau de configuration sur un brouillon (draft) de la configuration courante.
async function openConfig() {
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
    { communes: "code INSEE", epci: "SIREN de l'EPCI", iris: "code IRIS (9 caractères)", legis: "code de la circonscription (ex. 2901)", college: "UAI du collège" }[zoneMode(b)] || "code";
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
  ${G("Texte (Markdown)", "Widget Markdown de Grist : affiché sans possibilité de modification.", s.parentKey === "custom" && isMarkdownSection(s) ? L("Taille du texte", sel("mdSize", MD_SIZES, b.mdSize || ""), "Taille des caractères du texte affiché (les titres restent proportionnés).") : "")}
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
            ],
            zoneMode(b),
          ),
          "Dessine sous les points les communes qui en contiennent, les EPCI entiers (contours geo.api.gouv.fr, communes fusionnées), les IRIS des communes découpées en quartiers (service IGN, édition la plus récente), ou les circonscriptions législatives et les secteurs de collège (fichiers GeoJSON déposés à côté du widget).",
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
                  ["", zoneMode(b) === "epci" ? "une couleur par EPCI" : FILE_ZONES[zoneMode(b)] ? `une couleur par ${FILE_ZONES[zoneMode(b)].one}` : "couleur majoritaire des points"],
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
${C('id="cHideFields"', draft.hideEmptyFields, "Masquer les champs vides dans les fiches", "Les champs sans valeur ne sont pas affichés dans les fiches (sauf en édition, ou si le bloc demande à les afficher).")}
${C('id="cHideBlocks"', draft.hideEmptyBlocks, "Masquer les blocs sans données", "Un bloc sans aucune ligne à afficher (par exemple après filtrage) disparaît de la page.")}
${L("Hauteur des graphiques (px)", `<input type="number" id="cChartH" min="100" step="20" value="${draft.chartHeight || 260}" style="width:80px">`, "Hauteur par défaut des graphiques d'une ligne.")}
${L("Hauteur maximale des tableaux (px)", `<input type="number" id="cMaxH" min="120" step="20" value="${draft.tableMaxHeight}" style="width:80px">`, "Au-delà, le tableau défile à l'intérieur de son bloc (en-têtes fixes).")}
    </section>
    <section class="cs adv"><h4>Message d'accueil <small>— affiché au démarrage, à tous les utilisateurs</small></h4>
${L("Texte (Markdown)", `<textarea id="cWelcome" rows="6" style="width:100%" placeholder="## Bienvenue&#10;Ce tableau de bord présente…&#10;&#10;+++ En savoir plus&#10;Texte replié, affiché au clic sur le titre.&#10;+++">${esc(draftNav.welcome || "")}</textarea>`, "Texte en Markdown (titres #, gras **, listes -, liens [texte](https://…)) affiché dans une fenêtre à l'ouverture du widget. Partie repliable : une ligne « +++ Titre » (ou « +++! Titre » pour qu'elle soit dépliée au départ), le texte, puis une ligne « +++ ». Chaque personne peut cocher « Ne plus afficher ce message » ; si le texte est modifié, il s'affiche à nouveau à tous. Vide : pas de message.")}
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
      "collegeCol",
      "zoneColor",
      "zoneSum",
      "zoneTable",
      "zoneKey",
      "zoneVal",
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
      try {
        await saveConfigToTable({ name: NAV_NAME, nav: draftNav });
      } catch {
        /* droits insuffisants */
      }
    }
    scheduleRender();
  }
});

/* ---------- Navigation, enregistrement de la configuration et démarrage ---------- */
/* Sauvegarde durable de la configuration dans une table */
const CFG_TABLE = "W_Composition";
const NAV_NAME = "_Navigation";
/* ---------- Apparence : DSFR (services de l'État) ou neutre ----------
   Choix commun au document, rangé avec le menu commun (ligne _Navigation de W_Composition, nav.theme).
   Non choisi : apparence DSFR. Le choix se fait dans la configuration (section Affichage), par un administrateur. */
const NEUTRAL_BLUE = "#8c1c2c"; // rouge bordeaux (0.9.3.5) : distinct du bleu DSFR au premier coup d'œil
function applyTheme(theme) {
  const neutre = theme === "neutre";
  document.documentElement.classList.toggle("neutre", neutre);
  BRAND.c = neutre ? NEUTRAL_BLUE : "#000091";
  PALETTE[0] = MAP_COLORS[0] = BRAND.c;
}
// readNav — Lit le menu de navigation commun (ligne _Navigation de W_Composition).
async function readNav() {
  try {
    const tables = await grist.docApi.listTables();
    if (!tables.includes(CFG_TABLE)) return { url: "", items: [] };
    const row = toRows(await grist.docApi.fetchTable(CFG_TABLE)).find((r) => String(r.Nom || "") === NAV_NAME);
    const n = parseJSON(row?.Config, {})?.nav || {};
    return {
      url: n.url || "",
      singlePage: !!n.singlePage,
      inWidget: !!n.inWidget,
      items: Array.isArray(n.items) ? n.items : [],
      theme: n.theme === "neutre" || n.theme === "dsfr" ? n.theme : "", // "" : pas encore choisi
      home: n.home || "", // configuration ouverte à l'arrivée (mode « changer de page dans le widget »)
      welcome: typeof n.welcome === "string" ? n.welcome : "", // message d'accueil (Markdown)
    };
  } catch {
    return { url: "", items: [] };
  }
}
// guessDocUrl — Adresse du document déduite du jeton d'accès (proposée par défaut pour le menu).
async function guessDocUrl() {
  // adresse proposée par défaut : hôte + identifiant du document
  try {
    const t = await Promise.race([
      grist.docApi.getAccessToken({ readOnly: true }),
      new Promise((_, rej) => setTimeout(() => rej(), 3000)),
    ]);
    const m = /^(https?:\/\/[^/]+)\/api\/docs\/([^/?#]+)/.exec(t?.baseUrl || "");
    return m ? `${m[1]}/doc/${m[2]}` : "";
  } catch {
    return "";
  }
}
// safeBase — Adresse de base acceptée seulement en https (sécurité des liens du menu).
const safeBase = (u) => (/^https:\/\/[^\s"'<>\\]+$/i.test(String(u || "").trim()) ? String(u).trim() : ""); // https uniquement (pas de javascript:, data:…)
// pageUrl — Lien vers une page Grist du document.
const pageUrl = (base, viewId, single) =>
  `${String(base)
    .trim()
    .replace(/\/p\/\d+.*$/, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")}/p/${viewId}${single ? "?style=singlePage" : ""}`;
/* Sections nécessaires à une configuration : ses blocs + toute leur chaîne de liaisons */
function sectionsOf(cfg) {
  const ids = new Set();
  for (const b of cfg.blocks || []) {
    let s = S.meta.sections.get(b.id),
      g = 0;
    while (s && g++ < 12 && !ids.has(s.id)) {
      ids.add(s.id);
      s = s.linkSrcSectionRef ? S.meta.sections.get(s.linkSrcSectionRef) : null;
    }
  }
  return [...ids];
}
/* Charge en parallèle (au lieu d'une table après l'autre) toutes les tables utiles */
function prefetch(cfg) {
  return Promise.all(
    sectionsOf(cfg).map((id) => {
      const info = getInfo(id);
      return info?.tableId ? prepareSection(info).catch(() => null) : null;
    }),
  );
}
// prefetchOthers — En tâche de fond : précharge les tables des autres pages du menu.
function prefetchOthers() {
  // en tâche de fond : les autres pages du menu, pour un changement instantané
  if (!S.nav?.inWidget) return;
  const others = (S.nav.items || [])
    .map((x) => (S.stored || []).find((c) => c.name === x.cfg))
    .filter((c) => c && c.name !== S.cfg.name);
  setTimeout(() => others.reduce((p, c) => p.then(() => prefetch(c.cfg)), Promise.resolve()), 800);
}
// switchConfig — Change de configuration dans le widget (menu « changer de page dans le widget »).
function switchConfig(name) {
  S.collapsed = {};
  const x = (S.stored || []).find((c) => c.name === name);
  if (!x || x.name === S.cfg.name) return;
  S.cfg = { ...DEFAULTS, ...x.cfg, name: x.name };
  S.maxed = null;
  $("#backdrop")?.classList.remove("on");
  document.body.style.overflow = "";
  window.scrollTo(0, 0);
  scheduleRender();
}
$("#pnav").addEventListener("click", (ev) => {
  if (ev.target.closest(".pnav-tog")) return pnavToggle();
  if (ev.target.closest("a")) pnavToggle(false); // page choisie : la liste se referme
  const a = ev.target.closest("[data-gocfg]");
  if (!a || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button === 1) return; // clic normal : changement dans le widget
  ev.preventDefault();
  switchConfig(a.dataset.gocfg);
});
// cfgReadable — Une configuration est-elle lisible ? (au moins une table de ses blocs accessible à l'utilisateur)
function cfgReadable(name) {
  const c = (S.stored || []).find((x) => x.name === name)?.cfg,
    m = S.meta;
  if (!c || !m || !c.blocks?.length) return true;
  return c.blocks.some((b) => {
    const id = m.tables.get(m.sections.get(b.id)?.tableRef)?.tableId;
    return !!id && (!m.visibleTables || m.visibleTables.has(id));
  });
}
/* Une page du menu n'est proposée que si l'utilisateur peut lire au moins une table de ses vues (comme Grist) */
function viewReadable(vid) {
  const m = S.meta;
  if (!m) return true;
  const secs = m.sectionsByView.get(vid) || [];
  if (!secs.length) return true;
  return secs.some((s) => {
    const t = m.tables.get(s.tableRef),
      id = t?.tableId;
    return !!id && (!m.visibleTables || m.visibleTables.has(id));
  });
}
S.navAccess = {};
// renderNav — Affiche le menu des pages (masque celles que l'utilisateur ne peut pas lire).
// safeSvg — Icône SVG collée par l'administrateur (menu), nettoyée : seules les formes simples et leurs attributs
//   de dessin sont gardées (ni script, ni lien, ni style, ni image externe) ; les couleurs deviennent currentColor
//   pour suivre celle du lien (bleu sur la page courante). Résultat mis en cache.
const SVG_TAGS = new Set(["svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon"]);
const SVG_ATTRS = new Set(["viewbox", "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "points", "transform", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "fill-rule", "clip-rule", "opacity", "fill-opacity", "stroke-opacity"]);
const svgCache = new Map();
function safeSvg(src) {
  src = String(src || "").trim();
  // les fichiers téléchargés commencent souvent par <?xml …?>, un commentaire ou un DOCTYPE : on part de <svg
  const at = src.search(/<svg[\s>]/i);
  if (at < 0) return "";
  src = src.slice(at);
  if (svgCache.has(src)) return svgCache.get(src);
  let out = "";
  try {
    const doc = new DOMParser().parseFromString(src, "image/svg+xml");
    const root = doc.documentElement;
    if (root.nodeName.toLowerCase() === "svg" && !doc.querySelector("parsererror")) {
      // icônes « à classes » (Streamline Ultimate…) : <style>.a{fill:none;stroke:#000}</style> + class="a" →
      //   les déclarations des classes simples sont recopiées dans le style de chaque élément, avant nettoyage
      const css = [...doc.getElementsByTagName("style")].map((x) => x.textContent).join("\n");
      for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g))
        for (const one of sel.split(",")) {
          const cls = /^\s*\.([\w-]+)\s*$/.exec(one)?.[1];
          if (cls) for (const el of root.querySelectorAll("*")) if (el.classList?.contains(cls)) el.setAttribute("style", `${body};${el.getAttribute("style") || ""}`);
        }
      const clean = (el) => {
        for (const c of [...el.children]) {
          // conteneurs sans dessin propre (<switch> des icônes Streamline Carbon, <a>) : remplacés par leur contenu
          if (c.nodeName === "switch" || c.nodeName === "a") {
            c.replaceWith(...c.childNodes);
            return clean(el);
          }
          SVG_TAGS.has(c.nodeName) ? clean(c) : c.remove();
        }
        // style="fill:#000;stroke-width:1.5" → attributs (le style lui-même n'est pas gardé)
        for (const d of String(el.getAttribute("style") || "").split(";")) {
          const [k, ...v] = d.split(":");
          const n = String(k || "").trim().toLowerCase();
          if (SVG_ATTRS.has(n) && !el.hasAttribute(n)) el.setAttribute(n, v.join(":").trim());
        }
        for (const a of [...el.attributes]) {
          const n = a.name.toLowerCase(), v = a.value;
          if (!SVG_ATTRS.has(n) || /url\(|javascript:|[<>]/i.test(v)) el.removeAttribute(a.name);
          else if ((n === "fill" || n === "stroke") && !/^(none|currentcolor)$/i.test(v)) el.setAttribute(n, "currentColor");
        }
      };
      clean(root);
      for (const n of [...root.childNodes]) if (n.nodeType === 3) n.remove();
      if (!root.hasAttribute("fill")) root.setAttribute("fill", "currentColor"); // noir par défaut → couleur du lien
      if (!root.getAttribute("viewBox")) root.setAttribute("viewBox", `0 0 ${parseFloat(root.getAttribute("width")) || 24} ${parseFloat(root.getAttribute("height")) || 24}`);
      root.removeAttribute("width");
      root.removeAttribute("height");
      root.setAttribute("class", "nico");
      root.setAttribute("aria-hidden", "true");
      out = new XMLSerializer().serializeToString(root);
    }
  } catch (e) {
    out = "";
  }
  svgCache.set(src, out);
  return out;
}
// icoPreview — Aperçu de l'icône dans la configuration du menu (« ? » rouge : code non reconnu).
const icoPreview = (v) => safeSvg(v) || (v ? '<span style="color:var(--rouge)" title="Code SVG non reconnu">?</span>' : "");
function renderNav() {
  const nav = $("#pnav"),
    n = S.nav || { items: [] };
  if (!n.items.length || (!n.url && !n.inWidget)) {
    nav.replaceChildren();
    return;
  }
  // condition explicite : la page n'apparaît que si l'utilisateur voit au moins une ligne de la table choisie
  // (couvre les règles d'accès par ligne, qui laissent la table visible mais vide)
  const need = [...new Set(n.items.map((x) => x.needTable).filter((t) => t && !(t in S.navAccess)))];
  if (need.length) {
    for (const t of need) S.navAccess[t] = false;
    Promise.all(
      need.map((t) =>
        grist.docApi
          .fetchTable(t)
          .then((d) => {
            S.navAccess[t] = (d.id || []).length > 0;
          })
          .catch(() => {
            S.navAccess[t] = false;
          }),
      ),
    ).then(() => renderNav());
  }
  const links = n.items
    .map((x) =>
      x.viewId && S.meta?.pageOfView.has(x.viewId) ? x : { ...x, viewId: hostView(x.cfg) || x.viewId, host: true },
    )
    .filter((x) => {
      const page = !!x.viewId && !!S.meta?.pageOfView.has(x.viewId); // la page Grist existe encore
      if (!page && !(n.inWidget && x.cfg)) return false; // ni page, ni configuration à afficher dans le widget
      if (x.needTable && !S.navAccess[x.needTable]) return false;
      return page && !x.host ? viewReadable(x.viewId) : cfgReadable(x.cfg); // « ce widget » : droits de sa config
    })
    .map((x) => {
      const page = !!x.viewId && !!S.meta?.pageOfView.has(x.viewId);
      const url = page && safeBase(n.url) ? pageUrl(safeBase(n.url), x.viewId, n.singlePage && !n.inWidget) : ""; // lien Grist (clic du milieu)
      // infobulle : celle saisie dans la configuration, sinon l'adresse (sauf navigation dans le widget)
      const tip = String(x.tip || "").trim() || (n.inWidget ? "" : url);
      return `<a href="${url ? esc(url) : "#"}"${tip ? ` title="${esc(tip)}"` : ""} target="_top"${n.inWidget && x.cfg ? ` data-gocfg="${esc(x.cfg)}"` : ""} class="${x.cfg && x.cfg === S.cfg.name ? "cur" : ""}">${safeSvg(x.icon)}<span class="nlab">${esc(x.label || (page ? S.meta.pageOfView.get(x.viewId) : x.cfg) || "Page")}</span></a>`;
    });
  if (!links.length) {
    nav.replaceChildren();
    return;
  }
  // sur smartphone, les pages sont regroupées derrière un bouton (à gauche, icône de pages et nom de la page
  // courante) — distinct du menu ☰ des actions, à droite
  const cur = /<span class="nlab">([^<]*)<\/span><\/a>$/.exec(links.find((l) => l.includes('class="cur"')) || "")?.[1];
  nav.innerHTML = `<button type="button" class="pnav-tog" aria-expanded="false" aria-controls="pnavList" title="Changer de page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h9l3 3v12H8zM4 7v14h12" /></svg><span>${cur || "Pages"}</span><span class="qf-caret">▾</span></button><span class="pnav-list" id="pnavList">${links.join("")}</span>`;
}
// hostView — Page Grist qui contient ce widget, pour un lien « — ce widget — » : de préférence celle dont le
//   widget affiche la configuration du lien, sinon la première page où le widget est installé. Elle sert au lien
//   réel (clic du milieu, nouvel onglet, mode page unique) ; le clic normal change de page dans le widget.
function hostView(cfgName) {
  const m = S.meta;
  if (!m) return 0;
  const here = (location.host + location.pathname).replace(/\/index\.html$/, "/").replace(/\/+$/, "");
  let first = 0;
  for (const sec of m.sections.values()) {
    const cv = parseJSON(parseJSON(sec.options).customView, null);
    const url = String(cv?.url || "")
      .replace(/^https?:\/\//, "")
      .replace(/[?#].*$/, "")
      .replace(/\/index\.html$/, "/")
      .replace(/\/+$/, "");
    if (!url || url !== here || !m.pageOfView.has(sec.parentId)) continue;
    const name = parseJSON(cv.widgetOptions, {})?.config?.name;
    if (cfgName && name === cfgName) return sec.parentId;
    first ||= sec.parentId;
  }
  return first;
}
// pnavToggle — Ouvre / ferme la liste des pages (smartphone).
function pnavToggle(open = !$("#pnav").classList.contains("open")) {
  $("#pnav").classList.toggle("open", open);
  $("#pnav .pnav-tog")?.setAttribute("aria-expanded", String(open));
}
document.addEventListener("mousedown", (e) => {
  if ($("#pnav").classList.contains("open") && !e.target.closest("#pnav")) pnavToggle(false);
});
// readStoredConfigs — Lit toutes les configurations enregistrées dans W_Composition.
async function readStoredConfigs() {
  try {
    const tables = await grist.docApi.listTables();
    if (!tables.includes(CFG_TABLE)) return [];
    return toRows(await grist.docApi.fetchTable(CFG_TABLE))
      .map((r) => ({ id: r.id, name: String(r.Nom || ""), cfg: parseJSON(r.Config, null) }))
      .filter((x) => x.cfg && Array.isArray(x.cfg.blocks));
  } catch {
    return [];
  }
}
// saveConfigToTable — Enregistre (crée ou met à jour) une configuration dans W_Composition.
async function saveConfigToTable(cfg) {
  const tables = await grist.docApi.listTables();
  if (!tables.includes(CFG_TABLE)) {
    await grist.docApi.applyUserActions([
      [
        "AddTable",
        CFG_TABLE,
        [
          { id: "Nom", type: "Text" },
          { id: "Config", type: "Text" },
        ],
      ],
    ]);
  }
  if (S.adminHint && !tables.includes(ADMIN_TABLE)) {
    // installation : la table des administrateurs est créée avec une ligne (à protéger par une règle d'accès)
    try {
      await grist.docApi.applyUserActions([
        ["AddTable", ADMIN_TABLE, [{ id: "Note", type: "Text" }]],
        ["AddRecord", ADMIN_TABLE, null, { Note: "Qui lit cette ligne peut configurer le widget : réserver la lecture aux administrateurs (règle d'accès)." }],
      ]);
      S.adminHint = false;
    } catch {
      /* droits insuffisants pour créer une table */
    }
  }
  const rows = toRows(await grist.docApi.fetchTable(CFG_TABLE));
  const hit = rows.find((r) => String(r.Nom || "") === cfg.name);
  const json = JSON.stringify(cfg, null, 1);
  await grist.docApi.applyUserActions([
    hit
      ? ["UpdateRecord", CFG_TABLE, hit.id, { Config: json }]
      : ["AddRecord", CFG_TABLE, null, { Nom: cfg.name, Config: json }],
  ]);
  S.stored = await readStoredConfigs();
}

// showConfigChooser — Plusieurs configurations possibles : propose de choisir celle de cette page.
function showConfigChooser(list) {
  S.choosing = true;
  $("#grid").replaceChildren();
  $("#filters").replaceChildren();
  const st = $("#status");
  st.className = "";
  st.innerHTML =
    `Quelle configuration afficher sur cette page ? ` +
    list
      .map((x) => `<button class="btn" data-pick="${x.id}" style="margin:2px 4px">${esc(x.name)}</button>`)
      .join("");
  st.querySelectorAll("[data-pick]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const x = list.find((y) => y.id === Number(btn.dataset.pick));
      S.cfg = { ...DEFAULTS, ...x.cfg, name: x.name, dataTable: S.ext.tableId };
      S.choosing = false;
      if (S.isAdmin && !S.nav?.home) {
        // le choix devient la page par défaut pour tous (plus de question au prochain chargement)
        S.nav = { ...(S.nav || { url: "", items: [] }), home: x.name };
        try {
          await saveConfigToTable({ name: NAV_NAME, nav: S.nav });
        } catch {
          /* droits insuffisants */
        }
      }
      status("");
      try {
        await grist.setOption("config", S.cfg);
      } catch {
        /* facultatif */
      }
      if (S.isAdmin) {
        try {
          await saveConfigToTable(S.cfg);
        } catch {
          /* droits insuffisants */
        }
      } // mémorise la table du widget
      await render();
    }),
  );
}
// init — Démarrage : métadonnées, configurations enregistrées, menu, droits, puis premier rendu.
async function init() {
  try {
    await loadMeta();
    // La table W_Composition fait foi : elle survit aux changements de code du widget
    S.stored = await readStoredConfigs();
    S.nav = await readNav();
    S.isAdmin = await checkAdmin();
    S.docKey = /\/doc\/([^/?#]+)/.exec(await guessDocUrl())?.[1] || ""; // pour les sélections partagées
    applyTheme(S.nav.theme);
    $("#btnConfig").hidden = !S.isAdmin;
    $("#btnLayout").hidden = !S.isAdmin;
    $("#btnSingle").hidden = !S.isAdmin; // plein écran : réservé aux administrateurs (vue par défaut des utilisateurs)
    try {
      S.ext.tableId = await grist.selectedTable.getTableId();
    } catch {
      S.ext.tableId = null;
    }
    const opt = S.optCfg || {};
    let hit = opt.name ? S.stored.find((x) => x.name === opt.name) : null;
    // page d'accueil (réglée par l'administrateur, commune à tous) : elle s'impose en mode « changer de page
    // dans le widget », et sert de page par défaut quand le widget n'a pas de configuration enregistrée
    const home = S.nav.home && S.stored.find((x) => x.name === S.nav.home);
    if (home && cfgReadable(home.name) && (S.nav.inWidget || !hit)) hit = home;
    if (!hit && !opt.blocks?.length) {
      // options du widget absentes : on reconnaît la config par la table du widget
      const same = S.stored.filter((x) => x.cfg.dataTable && x.cfg.dataTable === S.ext.tableId);
      if (same.length === 1) hit = same[0];
      else if (S.stored.length === 1) hit = S.stored[0];
      else if (S.stored.length > 1) {
        // seul un administrateur choisit ; un utilisateur n'est jamais interrogé
        if (S.isAdmin) {
          S.ready = true;
          return showConfigChooser(same.length ? same : S.stored);
        }
        hit = same[0] || S.stored.find((x) => cfgReadable(x.name)) || S.stored[0];
      }
    }
    if (hit) S.cfg = { ...DEFAULTS, ...hit.cfg, name: hit.name };
    S.ready = true;
    await render();
    showWelcome(); // message d'accueil, s'il y en a un et s'il n'a pas été masqué
    const tot = S.fetchLog.reduce((x, [, ms]) => x + ms, 0);
    console.info(
      `[UX widget] premier chargement : ${S.fetchLog.length} lectures de tables, ${tot} ms cumulés — les plus longues : ` +
        [...S.fetchLog]
          .sort((x, y) => y[1] - x[1])
          .slice(0, 5)
          .map(([t, ms]) => `${t} ${ms} ms`)
          .join(", "),
    );
  } catch (e) {
    status(e.message || String(e), true);
  }
}
// applyOptions — Reçoit les options du widget (grist.onOptions) une seule fois, puis lance init().
function applyOptions(o) {
  if (S.optsApplied) return; // ne réappliquer les options qu'une fois (onOptions refire à chaque setOption)
  S.optsApplied = true;
  S.optCfg = o?.config || null;
  S.cfg = { ...DEFAULTS, ...(o?.config || {}) };
  init();
}
grist.ready({ requiredAccess: "full", onEditOptions: () => openConfig() });
grist.onOptions((o) => applyOptions(o));
grist.onRecord((r) => {
  S.ext.rowId = r?.id || null;
  if (S.ready) scheduleRender();
});
grist.onRecords(() => {
  if (!S.ready) return;
  if (S.ext.tableId) {
    delete S.cache[S.ext.tableId];
  }
  scheduleRender();
});
setTimeout(() => applyOptions(null), 1500);
// Icône AIA de l'aide : retirée si le fichier aia.png est absent (remplace un attribut onerror, interdit par la CSP)
{
  const img = document.querySelector(".aia-mini");
  if (img) {
    if (img.complete && !img.naturalWidth) img.remove();
    else img.addEventListener("error", () => img.remove());
  }
}
