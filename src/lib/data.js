// Data loading + derivation.
// Availability uses EXCEPTION semantics: a country is "available" for a given
// product + layer unless it's listed in that layer's `unavailable` set, or
// "unknown" if that source is stale / not-yet-fetched.

import { feature as topoFeature } from "topojson-client";

const BASE = import.meta.env?.BASE_URL || "/";

function fetchJson(path) {
  return fetch(`${BASE}${path}`).then((r) => {
    if (!r.ok) throw new Error(`Failed to load ${path}: ${r.status}`);
    return r.json();
  });
}

export async function loadData() {
  // Geometry is served as a separate cached asset (not bundled) so the JS stays lean.
  const [availability, notes, featuresDoc, changelog, isoRef, worldAtlas] = await Promise.all([
    fetchJson("data/availability.json"),
    fetchJson("data/notes.json"),
    fetchJson("data/features.json"),
    fetchJson("data/changelog.json"),
    fetchJson("data/iso-reference.json"),
    fetchJson("geo/countries-50m.json"),
  ]);

  const geo = topoFeature(worldAtlas, worldAtlas.objects.countries).features.filter(
    (f) => f.properties.name !== "Antarctica"
  );

  return {
    availability,
    notes: notes.annotations || [],
    features: featuresDoc.features || [],
    changelog: changelog || { entries: [] },
    iso: isoRef.entries || {},
    geo,
  };
}

export function nameByIdFrom(geo) {
  const m = {};
  geo.forEach((f) => {
    m[String(f.id)] = f.properties.name;
  });
  return m;
}

// Names for ALL ISO entries (countries + regions). Full reference names win;
// geometry names fill any gaps. Keyed by normalized numeric id.
export function nameByIdFromIso(iso, geo) {
  const m = {};
  if (geo) geo.forEach((f) => { m[String(Number(f.id))] = f.properties.name; });
  Object.entries(iso).forEach(([id, e]) => { m[String(Number(id))] = e.name; });
  return m;
}

export function kindOf(iso, id) {
  return iso[String(Number(id))]?.kind || "region";
}

export function countryIdsFrom(iso) {
  return Object.keys(iso).filter((id) => iso[id].kind === "country").map((id) => String(Number(id)));
}

// All ISO entries as a sorted list: { id, name, kind }.
export function isoList(iso) {
  return Object.entries(iso)
    .map(([id, e]) => ({ id: String(Number(id)), name: e.name, kind: e.kind }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function layerStale(availability, product, layer) {
  const ss = availability.sourceStatus?.[product]?.[layer];
  return !ss || ss.stale === true || ss.ok === false;
}

// Returns a function (id) => per-product status for one layer ("web" | "api").
// Territories inherit their sovereign's status when not explicitly listed:
// providers enumerate countries, not dependencies, so a territory's absence from
// a list means "follows its parent", not "unavailable". An explicit listing
// (the territory was matched → not in `unavailable`) always wins.
export function makeStatusFor(availability, layer, nameById, iso = {}) {
  const products = availability.products;
  const unavail = {};
  const stale = {};
  products.forEach((p) => {
    stale[p] = layerStale(availability, p, layer);
    unavail[p] = new Set(((availability.unavailable?.[p]?.[layer]) || []).map((x) => String(Number(x))));
  });

  const statusOf = (sid, p) => {
    if (stale[p]) return "unknown";
    if (!unavail[p].has(sid)) return "available"; // explicitly listed / not excluded
    const entry = iso[sid];
    if (entry && entry.kind === "region" && entry.parent) {
      const par = String(Number(entry.parent)); // un-enumerated territory → inherit sovereign
      return unavail[p].has(par) ? "unavailable" : "available";
    }
    return "unavailable";
  };

  return (id) => {
    const sid = String(Number(id));
    const out = { id: sid, name: nameById[sid] || "—", layer };
    let count = 0;
    let unknownCount = 0;
    products.forEach((p) => {
      const st = statusOf(sid, p);
      out[p] = st;
      if (st === "available") count++;
      if (st === "unknown") unknownCount++;
    });
    out.count = count;
    out.unknownCount = unknownCount;
    out.anyUnknown = unknownCount > 0;
    out.allUnknown = unknownCount === products.length;
    return out;
  };
}

// Per-product available COUNTRY totals for the header stat chips (denominator
// = the sovereign-country count, ~197).
export function summaryStats(availability, layer, countryIds) {
  const products = availability.products;
  const out = { total: countryIds.length };
  products.forEach((p) => {
    if (layerStale(availability, p, layer)) {
      out[p] = null; // unknown
    } else {
      const unavail = new Set((availability.unavailable?.[p]?.[layer] || []).map((x) => String(Number(x))));
      out[p] = countryIds.filter((id) => !unavail.has(id)).length;
    }
  });
  return out;
}

// notes lookup: annotations relevant to (id, product?, layer?)
export function makeNotesLookup(notes) {
  const byCountry = {};
  notes.forEach((n) => {
    const c = String(n.country);
    (byCountry[c] = byCountry[c] || []).push(n);
  });
  return (id, product, layer) => {
    const list = byCountry[String(id)] || [];
    return list.filter((n) => {
      const scopeOk = n.scope === "all" || !n.product || n.product === product;
      const layerOk = !n.layer || n.layer === layer;
      return scopeOk && layerOk;
    });
  };
}
