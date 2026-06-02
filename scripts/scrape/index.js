// Scraper orchestrator.
//   node scripts/scrape/index.js            → fetch, regenerate data, write files
//   node scripts/scrape/index.js --dry-run  → fetch + report only, write nothing
//
// Safe by design: a source that fails validation keeps its last-known-good
// data and is flagged stale (so a broken page can never blank the map).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SOURCES, PAID, fetchSupported, fetchPaidSections } from "./sources.js";
import { universe } from "./iso.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dir, "../../public/data");
const AV_PATH = join(DATA_DIR, "availability.json");
const CL_PATH = join(DATA_DIR, "changelog.json");
const DRY = process.argv.includes("--dry-run");
const now = new Date().toISOString();
const date = now.slice(0, 10);

// Markets none of the three currently serve. Used only as a SOFT warning: if one
// ever parses as "supported" we surface it for a human to verify, rather than
// hard-overriding — so a genuine future change is detected, not silently masked.
const MUST_EXCLUDE = ["156", "643", "408", "364", "192", "760", "112"]; // China, Russia, N.Korea, Iran, Cuba, Syria, Belarus
const MAX_SUPPORTED = 260; // a touch above the ~249 ISO countries+territories

// The changelog tracks COUNTRIES only — matching the UI, which never shows
// territory-level churn (territories inherit their sovereign).
const isoEntries = JSON.parse(readFileSync(join(DATA_DIR, "iso-reference.json"), "utf8")).entries;
const isCountry = (id) => { const e = isoEntries[String(Number(id))]; return e && e.kind === "country"; };

const prev = JSON.parse(readFileSync(AV_PATH, "utf8"));
const products = prev.products;
const layers = prev.layers;
const next = JSON.parse(JSON.stringify(prev));
next.generatedAt = now;
next.updatedLabel = `${date} · auto-fetched`;

const report = [];
for (const src of SOURCES) {
  let ids = [];
  let err = null;
  let warn = "";
  try {
    ids = await fetchSupported(src);
  } catch (e) {
    err = e.message || String(e);
  }

  let unavail = null;
  if (!err) {
    if (ids.length < src.expectMin || ids.length > MAX_SUPPORTED) {
      err = `parsed ${ids.length} countries (expected ${src.expectMin}–${MAX_SUPPORTED})`;
    } else {
      const supported = new Set(ids);
      unavail = [...universe.ids]
        .filter((id) => !supported.has(id))
        .sort((a, b) => Number(a) - Number(b));
      const leaked = MUST_EXCLUDE.filter((id) => supported.has(id));
      if (leaked.length) warn = `  ⚠ verify: ${leaked.map((id) => universe.nameById[id]).join(", ")} parsed as supported`;
    }
  }

  if (unavail) {
    next.unavailable[src.product][src.layer] = unavail;
    next.sourceStatus[src.product][src.layer] = { ok: true, stale: false, fetchedAt: now, url: src.url };
    const names = unavail.map((id) => universe.nameById[id]);
    const sample = names.slice(0, 14).join(", ") + (names.length > 14 ? " …" : "");
    report.push(`✓ ${src.product}/${src.layer}: ${ids.length} supported · ${unavail.length} unavailable [${sample}]${warn}`);
  } else {
    const ss = next.sourceStatus[src.product][src.layer] || {};
    next.sourceStatus[src.product][src.layer] = { ok: false, stale: true, fetchedAt: ss.fetchedAt ?? null, url: src.url };
    report.push(`✗ ${src.product}/${src.layer}: ${err} — kept last-known-good, marked stale`);
  }
}

// ---- changelog diff (only for layers that scraped successfully) ----
function statusOf(av, product, layer, id) {
  const ss = av.sourceStatus[product][layer];
  if (!ss || ss.stale || !ss.ok) return "unknown";
  return (av.unavailable[product][layer] || []).includes(id) ? "unavailable" : "available";
}
const newEntries = [];
for (const p of products) {
  for (const l of layers) {
    const ns = next.sourceStatus[p][l];
    if (!ns.ok || ns.stale) continue;
    for (const id of universe.ids) {
      if (!isCountry(id)) continue;
      const before = statusOf(prev, p, l, id);
      const after = statusOf(next, p, l, id);
      if (before !== after && before !== "unknown" && after !== "unknown") {
        newEntries.push({
          date,
          country: id,
          name: universe.nameById[id] || id,
          product: p,
          layer: l,
          from: before,
          to: after,
        });
      }
    }
  }
}

const changelog = existsSync(CL_PATH) ? JSON.parse(readFileSync(CL_PATH, "utf8")) : { entries: [] };
if (newEntries.length) {
  const kept = (changelog.entries || []).filter((e) => !e.illustrative);
  changelog.meta = { illustrative: false, note: "Auto-generated from scraper diffs." };
  changelog.entries = [...newEntries, ...kept].slice(0, 500);
}

// ---- Gemini paid tiers → refresh feature-spotlight allow-lists ----
const FE_PATH = join(DATA_DIR, "features.json");
const paidReport = [];
try {
  const paid = await fetchPaidSections();
  const fdoc = JSON.parse(readFileSync(FE_PATH, "utf8"));
  let changed = false;
  for (const sec of PAID.sections) {
    const r = paid[sec.featureId];
    const feat = fdoc.features.find((f) => f.id === sec.featureId);
    if (r && r.ok && feat) {
      feat.countries = r.ids;
      changed = true;
      paidReport.push(`✓ gemini/${sec.name}: ${r.ids.length} supported`);
    } else {
      paidReport.push(`✗ gemini/${sec.name}: ${r ? r.ids.length : 0} parsed — kept last-known-good`);
    }
  }
  if (changed && !DRY) writeFileSync(FE_PATH, JSON.stringify(fdoc, null, 2) + "\n");
} catch (e) {
  paidReport.push(`✗ gemini paid: ${e.message || e}`);
}

console.log(report.join("\n"));
console.log("\n" + paidReport.join("\n"));
console.log(`\nchangelog: +${newEntries.length} new ${newEntries.length === 1 ? "entry" : "entries"}`);

if (DRY) {
  console.log("\n[dry-run] no files written");
  process.exit(0);
}
writeFileSync(AV_PATH, JSON.stringify(next, null, 2) + "\n");
writeFileSync(CL_PATH, JSON.stringify(changelog, null, 2) + "\n");
console.log("\nwrote public/data/availability.json + changelog.json");
