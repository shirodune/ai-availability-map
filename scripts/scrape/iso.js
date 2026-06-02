// Country-name → ISO 3166-1 numeric resolver + the world-atlas "universe".
import countries from "i18n-iso-countries";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { feature as topoFeature } from "topojson-client";

const __dir = dirname(fileURLToPath(import.meta.url));
const NM = (p) => join(__dir, "../../node_modules", p);

countries.registerLocale(JSON.parse(readFileSync(NM("i18n-iso-countries/langs/en.json"), "utf8")));

// Provider phrasings that differ from the canonical English names. name(lowercased) → alpha2.
const ALIASES = {
  turkey: "TR", türkiye: "TR", turkiye: "TR",
  "south korea": "KR", "korea, south": "KR", "republic of korea": "KR",
  "north korea": "KP", "korea, north": "KP",
  russia: "RU", "russian federation": "RU",
  vietnam: "VN", "viet nam": "VN",
  czechia: "CZ", "czech republic": "CZ",
  "ivory coast": "CI", "cote d'ivoire": "CI", "côte d'ivoire": "CI",
  "united states": "US", "united states of america": "US", usa: "US", "u.s.": "US", "u.s.a.": "US",
  "united kingdom": "GB", uk: "GB", "u.k.": "GB", "great britain": "GB",
  "united arab emirates": "AE", uae: "AE",
  "cape verde": "CV", "cabo verde": "CV",
  swaziland: "SZ", eswatini: "SZ",
  macedonia: "MK", "north macedonia": "MK",
  moldova: "MD", "republic of moldova": "MD",
  laos: "LA", "lao people's democratic republic": "LA",
  syria: "SY", "syrian arab republic": "SY",
  iran: "IR", "iran, islamic republic of": "IR",
  bolivia: "BO", venezuela: "VE", tanzania: "TZ", brunei: "BN",
  "democratic republic of the congo": "CD", "dr congo": "CD", drc: "CD", "congo (kinshasa)": "CD",
  "republic of the congo": "CG", "congo (brazzaville)": "CG", congo: "CG",
  palestine: "PS", "palestinian territories": "PS", "state of palestine": "PS",
  "hong kong": "HK", taiwan: "TW", macau: "MO", macao: "MO",
  myanmar: "MM", burma: "MM",
};

const WORLD = JSON.parse(readFileSync(NM("world-atlas/countries-50m.json"), "utf8"));

export const universe = (() => {
  const feats = topoFeature(WORLD, WORLD.objects.countries).features.filter(
    (f) => f.properties.name !== "Antarctica"
  );
  const ids = new Set();
  const nameById = {};
  feats.forEach((f) => {
    const n = Number(f.id);
    if (!Number.isFinite(n)) return; // skip no-ISO features (Kosovo-shape, Siachen, …)
    const id = String(n);
    ids.add(id);
    nameById[id] = f.properties.name;
  });
  return { ids, nameById };
})();

function numFromAlpha2(a2) {
  const n = countries.alpha2ToNumeric(a2);
  return n ? String(Number(n)) : null;
}

export function normalizeToNumeric(rawName) {
  if (!rawName) return null;
  let s = String(rawName)
    .replace(/\[[^\]]*\]/g, "") // [1] footnotes
    .replace(/\(.*?\)/g, "") // (parentheticals)
    .replace(/[*†‡]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s || s.length > 60) return null;
  const key = s.toLowerCase();
  if (ALIASES[key]) return numFromAlpha2(ALIASES[key]);
  const a2 = countries.getAlpha2Code(s, "en");
  if (a2) return numFromAlpha2(a2);
  return null;
}

// ---- dictionary-scan matcher (robust to page structure) --------------------
// Normalize: lowercase, strip accents, non-alphanumerics → spaces.
const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

// All country/territory name variants (i18n "all" aliases + our overrides),
// stored as space-padded needles, longest first.
const VARIANTS = (() => {
  let all;
  try { all = countries.getNames("en", { select: "all" }); } catch { all = countries.getNames("en"); }
  const list = [];
  const push = (name, a2) => {
    const num = numFromAlpha2(a2);
    const n = norm(name);
    if (num && n.length >= 4) list.push([" " + n + " ", num]);
  };
  for (const [a2, names] of Object.entries(all)) (Array.isArray(names) ? names : [names]).forEach((nm) => push(nm, a2));
  for (const [name, a2] of Object.entries(ALIASES)) push(name, a2);
  const seen = new Set();
  return list.filter(([nd]) => (seen.has(nd) ? false : (seen.add(nd), true))).sort((a, b) => b[0].length - a[0].length);
})();

// Returns the numeric ids of every country whose name (or alias) appears as a
// whole phrase in `text`. Masks each match so shorter sub-names can't re-trip.
export function matchCountriesIn(text) {
  let hay = " " + norm(text) + " ";
  const ids = new Set();
  for (const [needle, id] of VARIANTS) {
    if (hay.includes(needle)) {
      ids.add(id);
      hay = hay.split(needle).join(" ".repeat(needle.length));
    }
  }
  return [...ids];
}
