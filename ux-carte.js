/* UX widget grist — cartes (version 0.9.5.2). Développeur : Ligures. Licence MIT (voir LICENSE).
   Chargé à la demande par ux-widget.js (loadPart("carte")) quand la page contient une carte, ou à l'ouverture de la
   configuration. Partage l'espace global de ux-widget.js (objet S, esc, textOf…), qui doit être chargé avant.
   Contenu : conversions de coordonnées et codes communes ; contours (geo.api.gouv.fr, IRIS de l'IGN, fichiers
   GeoJSON) et fusion des communes (dissolve) ; couleurs des points et règles ; QPV ; zonages (drawZones,
   regroupements, choix de l'utilisateur) ; renderMap ; gestes (molette, deux doigts) ; impression et export
   d'une carte seule (printMap, exportMap). */
"use strict";
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
// cachedJson — Réponse JSON gardée 30 jours dans le cache du navigateur (0.9.4.17) : les contours d'un département
//   (plusieurs Mo) ne sont plus téléchargés à chaque ouverture. Sans cache disponible : téléchargement simple.
async function cachedJson(url, days = 30) {
  let c = null;
  try {
    c = await caches.open("uxwg-geo-1");
    const r = await c.match(url);
    if (r && Date.now() - Number(r.headers.get("x-uxwg-date") || 0) < days * 864e5) return await r.json();
  } catch {
    c = null;
  }
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const txt = await r.text();
  if (c)
    c.put(url, new Response(txt, { headers: { "content-type": "application/json", "x-uxwg-date": String(Date.now()) } })).catch(() => {});
  return JSON.parse(txt);
}
// fetchCommuneShapes — Contours des communes d'un département (geo.api.gouv.fr), avec leur EPCI. Mis en cache.
function fetchCommuneShapes(dep) {
  S.geoCache[dep] ??= cachedJson(
    `https://geo.api.gouv.fr/departements/${dep}/communes?format=geojson&geometry=contour&fields=nom,code,codeEpci,epci`,
  )
    .catch((e) => {
      delete S.geoCache[dep];
      throw e;
    });
  return S.geoCache[dep];
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
// zoneMode — Zonage demandé pour un bloc carte : "", "communes", "epci", "iris", "legis", "college" ou "groupe".
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
// dissolve — Fusion rapide (0.9.4.17) de polygones jointifs (communes d'un EPCI ou d'un regroupement) : les côtés communs à deux
//   polygones (mêmes sommets, contours d'une même source) s'annulent, les côtés restants sont enchaînés en anneaux.
//   Résultat : un Polygon à plusieurs anneaux, rempli en pair-impair (règle de Leaflet) ; null si l'enchaînement échoue.
function dissolve(geoms) {
  const edges = new Map();
  const pk = (p) => p[0] + "," + p[1];
  for (const g of geoms)
    for (const pg of polysOf(g))
      for (const ring of pg)
        for (let i = 0; i + 1 < ring.length; i++) {
          const a = ring[i],
            b = ring[i + 1],
            ka = pk(a),
            kb = pk(b);
          if (ka === kb) continue;
          const k = ka < kb ? ka + "|" + kb : kb + "|" + ka;
          if (edges.has(k)) edges.delete(k);
          else edges.set(k, [a, b, ka, kb]);
        }
  const at = new Map(); // sommet → côtés restants qui y aboutissent
  const list = [...edges.values()];
  list.forEach((e, i) => {
    for (const k of [e[2], e[3]]) (at.get(k) || at.set(k, []).get(k)).push(i);
  });
  const used = new Uint8Array(list.length),
    rings = [];
  for (let s = 0; s < list.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const [a, b, ka] = list[s],
      ring = [a, b];
    let cur = list[s][3];
    while (cur !== ka) {
      const n = (at.get(cur) || []).find((i) => !used[i]);
      if (n === undefined) return null; // contour ouvert : sommets non partagés
      used[n] = 1;
      const e = list[n],
        fwd = e[2] === cur;
      ring.push(fwd ? e[1] : e[0]);
      cur = fwd ? e[3] : e[2];
    }
    if (ring.length >= 4) rings.push(ring);
  }
  return rings.length ? { type: "Polygon", coordinates: rings } : null;
}
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
const zoneTableValues = (b) => tableMap(b.zoneTable, b.zoneKey, b.zoneVal);
// tableMap — Table Grist lue en dictionnaire code → valeur (codes en majuscules, sans espaces ; code INSEE numérique
//   à 4 chiffres complété d'un zéro). Sert aux couleurs « selon une table » et aux regroupements de communes.
//   group (0.9.4.21) : table qui peut avoir plusieurs lignes par commune (ex. REF_ETAB, une ligne par établissement) ;
//   la commune prend la valeur la plus fréquente parmi ses lignes non vides, et une référence vers la table des
//   communes est lue par son code INSEE même si sa colonne d'affichage est le nom.
async function tableMap(tableId, keyId, valId, group = false) {
  const t = [...S.meta.tables.values()].find((x) => x.tableId === tableId);
  if (!t || !keyId || !valId) return null;
  const cols = S.meta.colsByTable.get(t.id) || [];
  const kC = cols.find((c) => c.colId === keyId),
    vC = cols.find((c) => c.colId === valId);
  if (!kC || !vC) return null;
  await ensureRefTables([kC, vC]);
  const rows = await fetchRows(t.tableId);
  const kO = parseJSON(kC.widgetOptions),
    vO = parseJSON(vC.widgetOptions),
    m = new Map(),
    votes = new Map();
  const norm = (x) =>
    String(x ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s/g, "")
      .replace(/^(\d{4})$/, "0$1");
  const insee = (x) => /^(\d{5}|2[AB]\d{3}|97\d{3})$/.test(x);
  for (const r of rows) {
    let k = norm(textOf(kC, kO, r[kC.colId]));
    if (group && k && !insee(k) && baseType(kC) === "Ref") {
      const row = S.byId[refTarget(kC)]?.get(r[kC.colId]);
      const c = row && Object.values(row).map(norm).find(insee);
      if (c) k = c;
    }
    if (!k) continue;
    const v = r[vC.colId];
    const val = typeof v === "number" && !["Ref", "RefList"].includes(baseType(vC)) ? v : isEmpty(v) || isErr(v) ? null : textOf(vC, vO, v);
    if (!group) m.set(k, val);
    else if (val !== null && val !== "") {
      const n = votes.get(k) || votes.set(k, new Map()).get(k);
      n.set(String(val), (n.get(String(val)) || 0) + 1);
    }
  }
  for (const [k, n] of votes) m.set(k, [...n].sort((a, c) => c[1] - a[1])[0][0]);
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
  // zonage différé (0.9.4.17) : la page et les points s'affichent d'abord, les zones quand le navigateur est libre
  await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 200)));
  if (!map._container?.isConnected) return;
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
    // regroupement de communes : commune → groupe lu dans la table ; chaque groupe des points est dessiné en entier
    let grp = null,
      grpIn = null;
    const gn = grpN(mode);
    if (isGrp(mode)) {
      grp = grpReady(b, gn) ? await tableMap(grpOpt(b, gn, "Table"), grpOpt(b, gn, "Key"), grpOpt(b, gn, "Col"), true) : null;
      if (!map._container?.isConnected) return;
      if (!grp) return note(`${grpLabel(b, gn)} : table, colonne du code INSEE et colonne de regroupement à choisir`);
      for (const [c, g] of grp.map) grp.map.set(c, g === null || g === undefined ? "" : String(g));
      grpIn = new Set(codes.map((c) => grp.map.get(c)).filter(Boolean));
      if (!grpIn.size) return note(`${grpLabel(b, gn)} : aucune commune des points dans la table ${grpOpt(b, gn, "Table")}`);
    }
    const deps = [...new Set((grp ? [...grp.map].filter(([, g]) => grpIn.has(g)).map(([c]) => c) : codes).map(depOf))];
    const merged = mode === "epci" || isGrp(mode); // communes fusionnées en zones
    const [fcs, irisFeats, tv, fileFeats] = await Promise.all([
      mode === "iris" || fileZ ? [] : Promise.all(deps.map(fetchCommuneShapes)),
      mode === "iris" ? fetchIris(codes) : [],
      how === "table" ? zoneTableValues(b) : null,
      merged ? loadClip() : null,
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
    } else if (isGrp(mode)) {
      for (const f of all) {
        const c = codeOf(f),
          g = grp.map.get(c);
        if (!g || !grpIn.has(g)) continue;
        if (!zones.has(g)) zones.set(g, { key: g, name: g, feats: [], pts: [] });
        zones.get(g).feats.push(f);
        zones.get(g).pts.push(...(byCode.get(c) || []));
      }
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
      // communes non découpées en IRIS (0.9.4.22) : la commune entière, sous le code IRIS INSEE + « 0000 »
      const split = new Set(irisFeats.map((f) => String(f.properties?.code_insee).toUpperCase()));
      const whole = codes.filter((c) => !split.has(c));
      if (whole.length) {
        const shp = (await Promise.all([...new Set(whole.map(depOf))].map(fetchCommuneShapes))).flatMap((fc) => fc.features || []);
        if (!map._container?.isConnected) return;
        for (const c of whole) {
          const f = shp.find((x) => codeOf(x) === c);
          if (!f) continue;
          const z = { key: `${c}0000`, name: `${f.properties.nom} (commune non découpée)`, feats: [f], pts: byCode.get(c) || [] };
          for (const p of z.pts) p.iris = z.name;
          zones.set(z.key, z);
        }
      }
      // IRIS des points seulement (0.9.4.23) : par leur code (colonne « Rattachement ») ou par leur position
      if (b.irisCol) {
        const byIris = b.irisCol !== "__pts";
        const nIris = (v) =>
          String(v ?? "")
            .trim()
            .toUpperCase()
            .replace(/\s/g, "")
            .replace(/^(\d{8})$/, "0$1");
        if (byIris) {
          const at = new Map();
          for (const p of pts) {
            const k = nIris(p.zc?.iris);
            if (k) (at.get(k) || at.set(k, []).get(k)).push(p);
          }
          for (const z of zones.values()) {
            z.pts = at.get(String(z.key).toUpperCase()) || [];
            for (const p of z.pts) p.iris = z.name;
          }
        }
        for (const [k, z] of zones) if (!z.pts.length) zones.delete(k);
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
        ? (tv?.map.get(String(z.key).toUpperCase().replace(/\s/g, "")) ?? null)
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
        : merged || fileZ
          ? distinctColor(i)
          : mode === "iris"
            ? "#6A6AF4"
            : majority(z);
    });
    // géométrie : fusion des communes pour un EPCI
    const geomOf = (z) => {
      if (z.feats.length === 1) return z.feats[0].geometry;
      const fast = dissolve(z.feats.map((f) => f.geometry));
      if (fast) return fast;
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
    // fusion zone par zone, en rendant la main au navigateur toutes les 30 ms : la page reste réactive
    // IRIS limités aux quartiers des points, en zonage principal (0.9.4.24) : trait et fond comme les communes
    const irisPts = mode === "iris" && !!b.irisCol && !outline;
    const feats = [];
    let t0 = performance.now();
    for (const z of ordered) {
      feats.push({ type: "Feature", properties: z, geometry: geomOf(z) });
      if (performance.now() - t0 > 30) {
        await new Promise((r) => setTimeout(r));
        if (!map._container?.isConnected) return;
        t0 = performance.now();
      }
    }
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
            ? { color: "#161616", weight: mode === "iris" ? 0.8 : 1, opacity: 0.7, dashArray: "4 4", fill: false } // discret (0.9.4.25)
            : noFill
              ? { color: "#3a3a3a", weight: mode === "iris" ? 1 : 1.5, opacity: 0.8, fillOpacity: 0 } // fond transparent : survol conservé
              : ({
          color: how ? "#1d3fb8" : f.properties.color,
          weight: merged || fileZ ? 2.5 : mode === "iris" ? (irisPts ? 2 : 1) : 1.5,
          opacity: 0.9,
          fillColor: f.properties.color,
          fillOpacity: how ? 0.55 : mode === "iris" && !irisPts ? 0.06 : 0.18,
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
    // cadrage : points + zones (IRIS compris depuis 0.9.4.24 : tous les quartiers dessinés sont visibles à l'ouverture)
    if (feats.length) map._uxExtend?.(layer.getBounds(), keepView);
    if (scale?.items.length && !outline) {
      const c = L.control({ position: "topright" });
      c.onAdd = () => {
        const d = L.DomUtil.create("div", "map-legend");
        d.innerHTML =
          `<b>${fileZ ? fileZ.label : (isGrp(mode) ? grpLabel(b, grpN(mode)) : { epci: "EPCI", iris: "IRIS", communes: "Communes" }[mode])} : ${esc(what || "nombre de points")}</b>` +
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
      if (b.irisCol && b.irisCol !== "__pts") {
        const inZ = new Set([...zones.values()].flatMap((z) => z.pts));
        const lost = pts.filter((p) => !inZ.has(p)).length;
        if (lost) note(`IRIS : ${lost} point(s) sans quartier reconnu (code IRIS vide ou introuvable)`);
      } else {
        const missing = codes.filter((c) => ![...zones.values()].some((z) => z.pts.some((p) => p.code === c))).length;
        if (missing && !b.irisCol) note(`IRIS : ${missing} commune(s) sans contour`);
      }
    } else {
      const missing = codes.filter((c) => !all.some((f) => codeOf(f) === c)).length;
      if (missing) note(`Zonage : ${missing} code(s) INSEE sans contour`);
    }
  } catch (e) {
    note(`${fileZ ? fileZ.label : "Contours"} indisponibles (${e.message || e})`);
  }
}
// renderMap — Affiche un widget carte : points, couleurs, contours, QPV, zonage, légendes. Le dessin Leaflet est différé (jobs).
// Zonage choisi par l'utilisateur (0.9.4.7) : liste « Zonage » dans l'en-tête de la carte, gardée pour la session
// (0.9.4.20) ; null = celui de la configuration.
// Regroupement de communes (0.9.4.16) : zones formées des communes qui partagent une valeur dans une table Grist
//   (ex. réseau pédagogique de P_Communes), contours fusionnés comme pour les EPCI
// Jusqu'à trois regroupements par carte (0.9.4.19) : zonages "groupe", "groupe2", "groupe3", options grpTable… /
//   grp2Table… / grp3Table…
const GRP_MAX = 3;
const isGrp = (mode) => /^groupe[23]?$/.test(mode || "");
const grpN = (mode) => Number(String(mode).slice(6)) || 1;
const grpMode = (n) => (n > 1 ? `groupe${n}` : "groupe");
const grpF = (n, f) => `${n > 1 ? `grp${n}` : "grp"}${f}`; // grpF(2, "Table") → "grp2Table"
const grpOpt = (b, n, f) => b[grpF(n, f)];
const grpReady = (b, n = 1) => !!(grpOpt(b, n, "Table") && grpOpt(b, n, "Key") && grpOpt(b, n, "Col"));
const grpLabel = (b, n = 1) => grpOpt(b, n, "Label") || `Regroupements de communes${n > 1 ? ` ${n}` : ""}`;
// zoneChoices — Zonages proposés à l'utilisateur pour une carte (les regroupements seulement s'ils sont configurés)
const zoneChoices = (b) =>
  ZONE_CHOICES.filter(([k]) => !isGrp(k) || grpReady(b, grpN(k))).map(([k, t]) => (isGrp(k) ? [k, grpLabel(b, grpN(k))] : [k, t]));
const ZONE_CHOICES = [
  ["", "Aucun zonage"],
  ["communes", "Communes"],
  ["epci", "Intercommunalités"],
  ["iris", "Quartiers IRIS"],
  ["legis", "Circonscriptions législatives"],
  ["college", "Secteurs de collège"],
  ["groupe", "Regroupements de communes"],
  ["groupe2", "Regroupements de communes 2"],
  ["groupe3", "Regroupements de communes 3"],
];
const zoneKey = (id) => `uxwg_zone_${S.docKey || "doc"}_${S.cfg?.name || ""}_${id}`;
function userZone(id, k = 1) {
  // choix encore proposé par cette carte (0.9.4.18) : un regroupement retiré de la configuration est ignoré ;
  // k = 2 : second zonage (contours), choisi par l'utilisateur depuis 0.9.4.21 ("" = aucun)
  const b = S.cfg?.blocks?.find((x) => x.id === id) || {},
    ok = (v) => (k === 2 && v === "") || zoneChoices(b).some(([z]) => z === v),
    key = zoneKey(id) + (k === 2 ? "_2" : ""),
    mem = k === 2 ? "zoneSel2" : "zoneSel";
  if (S[mem]?.[id] !== undefined) return ok(S[mem][id]) ? S[mem][id] : null;
  // mémorisé pour la session seulement (0.9.4.20) : à la réouverture du document, zonage de la configuration
  try {
    localStorage.removeItem(key); // choix enregistré par les versions 0.9.4.7 à 0.9.4.19
    const v = sessionStorage.getItem(key);
    if (v !== null && ok(v)) return ((S[mem] ??= {})[id] = v);
  } catch {
    /* stockage indisponible */
  }
  return null;
}
function setUserZone(id, v, k = 1) {
  (S[k === 2 ? "zoneSel2" : "zoneSel"] ??= {})[id] = v;
  try {
    sessionStorage.setItem(zoneKey(id) + (k === 2 ? "_2" : ""), v);
  } catch {
    /* stockage indisponible : choix gardé jusqu'au rechargement */
  }
}
// mapCtlHtml — En-tête d'un bloc carte : zonage au choix, imprimer la carte seule, exporter en HTML interactif.
function mapCtlHtml(b) {
  const cur = userZone(b.id) ?? zoneMode(b);
  let cur2 = userZone(b.id, 2) ?? (b.mapZone2 || "");
  if (cur2 === cur) cur2 = "";
  const zone = `<select class="mapzone" data-mzone="${b.id}" title="Zonage affiché sur la carte (votre choix est gardé jusqu'à la fermeture de l'onglet)" aria-label="Zonage">${zoneChoices(b).map(
    ([v, t]) => `<option value="${v}" ${v === cur ? "selected" : ""}>${esc(t)}</option>`,
  ).join("")}</select>`;
  const zone2 = `<select class="mapzone mapzone2" data-mzone="${b.id}" data-mk="2" title="Second zonage : contours en pointillés par-dessus le premier (votre choix est gardé jusqu'à la fermeture de l'onglet)" aria-label="Second zonage">${[
    ["", "Aucun second zonage"],
    ...zoneChoices(b)
      .filter(([v]) => v && v !== cur)
      .map(([v, t]) => [v, `+ ${t}`]),
  ]
    .map(([v, t]) => `<option value="${v}" ${v === cur2 ? "selected" : ""}>${esc(t)}</option>`)
    .join("")}</select>`;
  const pr = `<button type="button" class="mapbtn" data-mprint="${b.id}" title="Imprimer cette carte seule (A4 paysage)" aria-label="Imprimer la carte"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" /></svg></button>`;
  const ex =
    b.mapExportAdmin && !S.isAdmin
      ? ""
      : `<button type="button" class="mapbtn" data-mexport="${b.id}" title="Exporter la carte : fichier HTML interactif (zoom, étiquettes, infobulles), à ouvrir dans un navigateur" aria-label="Exporter la carte"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 19h16" /></svg></button>`;
  return `<span class="mapctl">${zone}${zone2}${pr}${ex}</span>`;
}
async function renderMap(info, rows, body, jobs, selId, b = {}) {
  // zonage choisi par l'utilisateur : remplace celui de la configuration (et ses couleurs propres à ce zonage)
  const uz = userZone(b.id);
  if (uz !== null && uz !== zoneMode(b))
    b = { ...b, mapZone: uz, mapCommunes: false, zoneColor: "", zoneHover: "", mapZone2: b.mapZone2 === uz ? "" : b.mapZone2 };
  const uz2 = userZone(b.id, 2); // second zonage choisi par l'utilisateur
  if (uz2 !== null && uz2 !== (b.mapZone2 || ""))
    b = { ...b, mapZone2: uz2 === zoneMode(b) ? "" : uz2, zoneHover: "" };
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
  // quartiers IRIS (0.9.4.23) : code IRIS des points lu dans une colonne
  const irisC = b.irisCol && b.irisCol !== "__pts" && cols.find((c) => c.colId === b.irisCol);
  if (irisC) zcCols.push(["iris", irisC]);
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
      // zoom plus progressif (0.9.4.8) : demi-niveaux aux boutons, quarts de niveau au cadrage, molette deux fois plus douce
      const map = L.map(el, { zoomControl: true, attributionControl: true, ...MAP_ZOOM }).setView(
        [pts[0].lat, pts[0].lng],
        11,
      ); // vue initiale sûre
      S.maps.push(map);
      (S.mapOf ??= {})[b.id] = { map, tiles: spec.tiles, attribution: spec.attribution };
      mapGestures(map, el, b);
      S.mapOf[b.id].tileLayer = L.tileLayer(spec.tiles, { attribution: spec.attribution, maxZoom: 19 }).addTo(map);
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
        // couleurs du cadre de l'étiquette, reprises par l'export de la carte
        m._uxTc = () => {
          const on = p.id === (S.sel[info.secId] ?? selId);
          return [ptColor(on, p.fill), ptRing(on, p.fill, p.ring)];
        };
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
        if (S.mapPrinting) return; // impression de la carte seule : son cadrage ne doit pas être refait
        if ((el.clientWidth !== lastW || el.clientHeight !== lastH) && !userMoved) fitAll(); // cadre redimensionné
        lastW = el.clientWidth;
        lastH = el.clientHeight;
      }).observe(el);
    } catch (e) {
      el.outerHTML = `<div class="msg err">Carte : ${esc(e.message || e)}</div>`;
    }
  });
}
const MAP_ZOOM = { zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, wheelDebounceTime: 60 };
// mapGestures — Carte posée dans une page qui défile (0.9.4.5) : la molette fait défiler la page, Ctrl (ou ⌘) +
//   molette zoome ; sur écran tactile, un doigt fait défiler la page et deux doigts déplacent et zooment la carte.
//   Un court message l'indique. Bloc en plein écran, ou option « Zoom à la molette sans Ctrl » : carte libre.
function mapGestures(map, el, b) {
  if (b?.mapWheel) return; // ancien comportement demandé pour ce bloc
  const free = () => !!el.closest(".block.maxed");
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const hint = document.createElement("div");
  hint.className = "map-hint";
  hint.setAttribute("aria-hidden", "true");
  el.appendChild(hint);
  let timer = 0;
  const say = (msg) => {
    hint.textContent = msg;
    hint.classList.add("on");
    clearTimeout(timer);
    timer = setTimeout(() => hint.classList.remove("on"), 1300);
  };
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  // molette : sans Ctrl, l'évènement n'atteint pas Leaflet (arrêté à la phase de capture) et la page défile
  el.addEventListener(
    "wheel",
    (e) => {
      if (free() || e.ctrlKey || e.metaKey) return; // pincement du pavé tactile : ctrlKey, zoom de la carte
      e.stopPropagation();
      say(isMac ? "⌘ + molette pour zoomer sur la carte" : "Ctrl + molette pour zoomer sur la carte");
    },
    { capture: true },
  );
  // glisser : à la souris, la carte se déplace ; au doigt, seulement en plein écran (un doigt fait défiler la
  // page, deux doigts déplacent et zooment la carte par le pincement de Leaflet)
  const sync = (touch) => {
    if (touch && !free()) map.dragging.disable();
    else map.dragging.enable();
  };
  sync(coarse);
  el.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && sync(false));
  el.addEventListener("pointerdown", (e) => e.pointerType === "touch" && sync(true), { capture: true });
  // message « deux doigts » : seulement pour un vrai glissement à un doigt commencé sur la carte (pas pendant ni à
  // la fin d'un geste à deux doigts, quand un doigt se lève avant l'autre), et au plus une fois toutes les 30 s
  let multi = false,
    start = null,
    lastSay = 0;
  el.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length > 1) multi = true;
      start = e.touches.length === 1 && !multi ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    },
    { passive: true },
  );
  el.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 1) multi = true;
      if (multi || !start || free() || e.touches.length !== 1 || e.target.closest?.(".leaflet-control")) return;
      const t = e.touches[0];
      if (Math.hypot(t.clientX - start.x, t.clientY - start.y) < 40 || Date.now() - lastSay < 30000) return;
      lastSay = Date.now();
      say("Utilisez deux doigts pour déplacer la carte");
    },
    { passive: true },
  );
  const end = (e) => {
    if (!e.touches.length) {
      multi = false;
      start = null;
    }
  };
  el.addEventListener("touchend", end, { passive: true });
  el.addEventListener("touchcancel", end, { passive: true });
  map.on("resize", () => sync(coarse)); // passage en plein écran du bloc, ou retour
}
// mapPrintHead — En-tête d'une carte imprimée ou exportée : titre, sélections, filtres, zonage, date.
function mapPrintHead(id) {
  const blk = document.querySelector(`#grid > .block[data-sec="${id}"]`);
  const b = S.cfg.blocks.find((x) => x.id === id) || {};
  const z1 = userZone(id) ?? zoneMode(b),
    z2 = userZone(id, 2) ?? (b.mapZone2 || "");
  const zl = zoneChoices(b).find(([k]) => k === z1)?.[1],
    zl2 = z2 && z2 !== z1 ? zoneChoices(b).find(([k]) => k === z2)?.[1] : "";
  return {
    title: getInfo(id)?.title || "",
    lines: [
      selectionSummary(),
      [...(blk?.querySelectorAll(".qf-print") || [])].map((e) => e.textContent).join(" · "),
      [zl && zl !== "Aucun zonage" ? `Zonage : ${zl}` : "", zl2 ? `Contours : ${zl2}` : ""].filter(Boolean).join(" · "),
    ].filter(Boolean),
  };
}
// printMap — Imprime une carte seule (0.9.4.7) : A4 paysage, carte à pleine page avec ses légendes, cadrage de
//   l'écran conservé (même centre, même zoom).
async function printMap(id) {
  const m = S.mapOf?.[id],
    blk = document.querySelector(`#grid > .block[data-sec="${id}"]`);
  if (!m || !blk) return;
  const head = mapPrintHead(id);
  // une seule ligne pour les choix : la carte doit tenir sur la page
  $("#printhead").innerHTML = `${pageIcon("phicon")}<div><h1>${esc(head.title)}</h1><p>${esc([...head.lines, `Édité le ${new Date().toLocaleDateString("fr-FR")}`].join(" · "))}</p></div>`;
  const center = m.map.getCenter(),
    zoom = m.map.getZoom(),
    bounds = m.map.getBounds(),
    snap = m.map.options.zoomSnap;
  // carte au format de la page (275 × 158 mm). Plus grande à l'écran (plein écran) : même étendue, zoom
  // fractionnaire (0.9.4.15, sans réduction CSS ni copie des tuiles : le fond de carte manquait sur les imprimantes) ;
  // plus petite : même centre, même zoom
  const box = m.map.getContainer(),
    big = box.offsetWidth > (275 * 96) / 25.4 || box.offsetHeight > (158 * 96) / 25.4;
  const h = document.documentElement;
  S.mapPrinting = true;
  h.classList.add("printone");
  blk.classList.add("printme");
  status("Préparation de l'impression de la carte…");
  await new Promise((r) => setTimeout(r, 60));
  m.map.invalidateSize();
  if (big) {
    m.map.options.zoomSnap = 0;
    m.map.fitBounds(bounds, { animate: false });
  } else m.map.setView(center, zoom, { animate: false });
  // fond de carte : attendre que toutes les tuiles visibles soient chargées (8 s au plus), sinon elles manquent
  // sur le papier
  await new Promise((r) => setTimeout(r, 120));
  const tl = m.tileLayer;
  if (tl?.isLoading?.())
    await new Promise((r) => {
      const t = setTimeout(r, 8000);
      tl.once("load", () => {
        clearTimeout(t);
        r();
      });
    });
  await new Promise((r) => setTimeout(r, 300)); // fondu des dernières tuiles
  status("");
  const restore = () => {
    S.mapPrinting = false;
    h.classList.remove("printone");
    blk.classList.remove("printme");
    m.map.options.zoomSnap = snap;
    m.map.invalidateSize();
    m.map.setView(center, zoom, { animate: false });
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  window.print();
}
// exportMap — Carte exportée en fichier HTML autonome (0.9.4.7) : Leaflet (CDN, empreinte SRI), fond de carte, points,
//   zones et légendes tels qu'affichés, étiquettes et infobulles comprises. Les données du fichier ne sont plus
//   protégées par les règles d'accès de Grist.
function exportMap(id) {
  const m = S.mapOf?.[id];
  if (!m || !window.L) return;
  const map = m.map;
  const html = (x, l) => {
    try {
      if (x === null || x === undefined) return null;
      if (typeof x === "function") x = x(l);
      return x instanceof HTMLElement ? x.outerHTML : String(x);
    } catch {
      return null;
    }
  };
  const KEYS = ["color", "weight", "opacity", "fillColor", "fillOpacity", "dashArray", "fill", "stroke", "pane", "interactive", "lineCap", "lineJoin"];
  const sty = (o) => Object.fromEntries(KEYS.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));
  const tipOf = (l) => {
    const t = l.getTooltip?.();
    if (!t) return null;
    const o = t.options,
      off = o.offset ? L.point(o.offset) : null;
    return { c: html(t._content, l), p: !!o.permanent, d: o.direction, cl: o.className || "", s: !!o.sticky, o: off ? [off.x, off.y] : null };
  };
  const popOf = (l) => {
    const p = l.getPopup?.();
    return p ? { c: html(p._content, l), w: p.options.maxWidth } : null;
  };
  const layers = [];
  map.eachLayer((l) => {
    if (l instanceof L.TileLayer || l instanceof L.LayerGroup) return;
    if (l instanceof L.CircleMarker) {
      const ll = l.getLatLng();
      layers.push({ k: "c", ll: [ll.lat, ll.lng], r: l.getRadius(), s: sty(l.options), t: tipOf(l), p: popOf(l), tc: l._uxTc?.() || null });
    } else if (l instanceof L.Path && l.toGeoJSON) {
      const g = l.toGeoJSON();
      if (g?.geometry) layers.push({ k: "g", g: g.geometry, s: sty(l.options), t: tipOf(l), p: popOf(l) });
    }
  });
  const std = ["mapPane", "tilePane", "overlayPane", "shadowPane", "markerPane", "tooltipPane", "popupPane"];
  const panes = Object.entries(map.getPanes())
    .filter(([n]) => !std.includes(n))
    .map(([n, el]) => [n, el.style.zIndex || "", el.style.pointerEvents || ""]);
  const legends = [...map.getContainer().querySelectorAll(".map-legend")].map((el) => {
    const c = el.closest(".leaflet-top, .leaflet-bottom")?.className || "";
    const pos = `${/leaflet-top/.test(c) ? "top" : "bottom"}${/leaflet-right/.test(c) ? "right" : "left"}`;
    return [pos, el.innerHTML];
  });
  const head = mapPrintHead(id);
  const bd = map.getBounds(); // zone visible à l'écran, retrouvée quelle que soit la taille de la fenêtre
  // points au-dessus des zones (ordre de création différent dans le widget, où les zones ont leur propre volet)
  layers.sort((a, z) => (a.k === "c") - (z.k === "c"));
  // fond OpenStreetMap : ses serveurs refusent un fichier ouvert depuis le poste (« Access blocked ») ;
  // l'export prend alors le Plan IGN de la Géoplateforme, sans clé ni restriction
  const osm = /tile\.openstreetmap\.org/.test(m.tiles || "");
  const tiles = osm
    ? "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}"
    : m.tiles;
  const attribution = osm ? '&copy; <a href="https://www.ign.fr/">IGN</a> — Plan IGN' : m.attribution;
  const data = { title: head.title, lines: head.lines, date: new Date().toLocaleDateString("fr-FR"), tiles, attribution, bounds: [[bd.getSouth(), bd.getWest()], [bd.getNorth(), bd.getEast()]], panes, layers, legends, brand: "#000091" };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  // couleur principale : celle du style (bleu État ou bordeaux), en version claire même si l'écran est en mode sombre
  data.brand = document.documentElement.classList.contains("neutre") ? NEUTRAL_BLUE : "#000091";
  const doc = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(head.title || "Carte")}</title>
<link rel="stylesheet" href="${LIBS.leafletCss[0]}" integrity="${LIBS.leafletCss[1]}" crossorigin="anonymous">
<style>
html,body{margin:0;height:100%;font:13px/1.4 Arial,sans-serif;color:#161616}
header{position:absolute;top:0;left:0;right:0;height:64px;box-sizing:border-box;padding:8px 14px;border-bottom:2px solid var(--b);overflow:hidden}
header h1{margin:0;font-size:17px;color:var(--b)}header p{margin:2px 0 0;font-size:12px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#map{position:absolute;top:64px;left:0;right:0;bottom:0}
.leaflet-container{font:12px Arial,sans-serif}
.leaflet-tooltip.uxp,.leaflet-popup.uxp .leaflet-popup-content-wrapper{border-radius:0;border:2px solid var(--tc,#c8c8c8);box-shadow:inset 0 0 0 8px var(--tc2,#fff),0 3px 14px rgba(0,0,0,.25)}
.leaflet-tooltip.uxp.leaflet-tooltip-top::before{border-top-color:var(--tc,#c8c8c8)}
.leaflet-tooltip.lbl{font-size:11px;padding:1px 5px;box-shadow:none;opacity:.9}
.map-legend{background:rgba(255,255,255,.92);padding:6px 8px;border-radius:4px;font-size:11px;line-height:1.5;max-height:180px;overflow:auto;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.map-legend b{display:block;margin-bottom:2px}
.map-legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px;border:1px solid #fff;box-shadow:0 0 0 1px #ddd}
.qpvinfo{margin-top:3px;font-size:11px;color:#ce0500;font-weight:700}
</style></head><body>
<header><h1></h1><p id="lines"></p></header><div id="map"></div>
<script src="${LIBS.leaflet[0]}" integrity="${LIBS.leaflet[1]}" crossorigin="anonymous"></script>
<script type="application/json" id="data">${json}</script>
<script>
// Carte exportée depuis UX widget grist — données figées au moment de l'export.
const D = JSON.parse(document.getElementById("data").textContent);
document.documentElement.style.setProperty("--b", D.brand);
document.querySelector("header h1").textContent = D.title;
document.getElementById("lines").textContent = [...D.lines, "Exportée le " + D.date].join(" · ");
const map = L.map("map", { zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 120 }).fitBounds(D.bounds);
L.tileLayer(D.tiles, { attribution: D.attribution, maxZoom: 19 }).addTo(map);
for (const [n, z, pe] of D.panes) { const p = map.createPane(n); if (z) p.style.zIndex = z; if (pe) p.style.pointerEvents = pe; }
let bad = 0;
for (const x of D.layers) try {
  const l = x.k === "c" ? L.circleMarker(x.ll, { ...x.s, radius: x.r }) : L.geoJSON(x.g, { style: x.s, pane: x.s.pane || "overlayPane" });
  if (x.t && x.t.c) l.bindTooltip(x.t.c, { permanent: x.t.p, direction: x.t.d || "auto", sticky: x.t.s, offset: x.t.o || [0, 0], className: (x.t.cl + (x.tc ? " uxp" : "")).trim() });
  if (x.p && x.p.c) l.bindPopup(x.p.c, { maxWidth: x.p.w || 420, className: x.tc ? "uxp" : "" });
  if (x.tc) {
    const paint = (e) => { const el = (e.tooltip || e.popup).getElement(); if (el) { el.style.setProperty("--tc", x.tc[0]); el.style.setProperty("--tc2", x.tc[1]); } };
    l.on("tooltipopen popupopen", paint);
  }
  l.addTo(map);
  if (x.tc && l.isTooltipOpen && l.isTooltipOpen()) l.getTooltip().getElement()?.style.setProperty("--tc", x.tc[0]);
} catch (e) { bad++; }
if (bad) console.warn(bad + " élément(s) de la carte n'ont pas pu être affichés");
for (const [pos, h] of D.legends) {
  const c = L.control({ position: pos });
  c.onAdd = () => { const d = L.DomUtil.create("div", "map-legend"); d.innerHTML = h; L.DomEvent.disableScrollPropagation(d); return d; };
  c.addTo(map);
}
<\/script></body></html>`;
  const name = `${(head.title || "carte").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "carte"}.html`;
  const url = URL.createObjectURL(new Blob([doc], { type: "text/html" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  status(`Carte exportée : ${name} (${layers.length} éléments). Les données qu'il contient ne sont plus protégées par les droits de Grist.`);
}
