import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  loadData,
  nameByIdFromIso,
  countryIdsFrom,
  isoList,
  makeStatusFor,
  makeNotesLookup,
  summaryStats,
  layerStale,
} from "./lib/data.js";
import MapView from "./components/MapView.jsx";
import Legend from "./components/Legend.jsx";
import { DetailPanel, SideList } from "./components/Sidebar.jsx";
import TableView from "./components/TableView.jsx";
import ChangelogView from "./components/ChangelogView.jsx";
import InfoPage from "./components/InfoPage.jsx";

const THEMES = ["editorial", "control", "minimal"];
const MODES = [
  ["map", "Map"],
  ["table", "Table"],
  ["changelog", "Changes"],
];
const PROJECTION = "equalEarth";
const SHOW_BORDERS = true;
const SHOW_GRATICULE = false;

function StatChip({ k, available, total, labels, providers }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-dot" data-ai={k} />
        <span className="stat-name">{labels[k]}</span>
        <span className="stat-prov">{providers[k]}</span>
      </div>
      <div className="stat-num">
        {available == null ? "—" : available}
        <span className="stat-den">/ {total}</span>
      </div>
      <div className="stat-cap">countries available</div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("editorial");
  const [mode, setMode] = useState("map"); // map | table | changelog
  const [view, setView] = useState("combined"); // combined | <product>
  const [facet, setFacet] = useState("web"); // <layer> (web|mobile|paid|api) | <featureId>
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState("main"); // main | about | sources
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const themeMenuRef = useRef(null);
  useEffect(() => {
    if (!themeMenuOpen) return;
    const onDoc = (e) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target)) setThemeMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [themeMenuOpen]);

  useEffect(() => {
    loadData()
      .then(setData)
      .catch((e) => {
        console.error(e);
        setError(e.message || "Failed to load data");
      });
  }, []);

  const availability = data?.availability;
  const geo = data?.geo;
  const products = availability?.products || ["chatgpt", "claude", "gemini"];
  const layers = availability?.layers || ["web", "api"];
  const baseFacet = layers[0] || "web";
  const labels = availability?.meta?.labels || {};
  const providers = availability?.meta?.providers || {};
  const facetLabels = availability?.meta?.facetLabels || {};
  const facetLabel = (f) => facetLabels[f] || f;

  // Country/region classification (Natural Earth). Map renders countries only;
  // the table can show countries + regions.
  const iso = data?.iso || {};
  const countryIds = useMemo(() => countryIdsFrom(iso), [iso]);
  const countryFeatures = useMemo(
    () => (geo ? geo.filter((f) => iso[String(Number(f.id))]?.kind === "country") : []),
    [geo, iso]
  );
  const isoEntries = useMemo(() => isoList(iso), [iso]);

  const nameById = useMemo(() => nameByIdFromIso(iso, geo), [iso, geo]);
  const statusFns = useMemo(() => {
    const m = {};
    if (availability) layers.forEach((f) => (m[f] = makeStatusFor(availability, f, nameById, iso)));
    return m;
  }, [availability, nameById, layers, iso]);
  const webStatus = statusFns[baseFacet] || (() => null);
  const notesLookup = useMemo(() => makeNotesLookup(data?.notes || []), [data]);
  const stats = useMemo(
    () => (availability ? summaryStats(availability, baseFacet, countryIds) : { total: 0 }),
    [availability, countryIds, baseFacet]
  );

  const featuresOf = (p) => (data?.features || []).filter((f) => f.product === p);
  const isProduct = view !== "combined";
  const isLayerFacet = layers.includes(facet);
  const activeFeature = isProduct && !isLayerFacet ? featuresOf(view).find((f) => f.id === facet) : null;

  const pickProduct = useCallback((v) => {
    setView(v);
    setFacet(baseFacet);
  }, [baseFacet]);
  const selectCountry = useCallback((id) => {
    setSelectedId(id);
    setQuery("");
  }, []);

  const mapStatusFor = isLayerFacet ? statusFns[facet] : webStatus;
  const mapView = view === "combined" ? "combined" : activeFeature ? "feature" : view;
  const singleLabel = isProduct
    ? facet === baseFacet
      ? labels[view]
      : `${labels[view]} · ${facetLabel(facet)}`
    : null;

  const currentStale = useMemo(() => {
    if (!availability) return false;
    if (view === "combined") return products.some((p) => layerStale(availability, p, baseFacet));
    if (isLayerFacet) return layerStale(availability, view, facet);
    return false;
  }, [availability, view, facet, products, isLayerFacet, baseFacet]);

  const legendMode = view === "combined" ? "combined" : activeFeature ? "feature" : "single";
  const legendLabel = activeFeature ? activeFeature.name : singleLabel;

  // Selection / detail
  const selWeb = selectedId ? webStatus(selectedId) : null;
  const detailMode =
    isProduct && (activeFeature || (isLayerFacet && facet !== baseFacet)) ? "facet" : "overview";

  const sourceFor = (product, f) => {
    const url = availability?.sourceStatus?.[product]?.[f]?.url;
    return url ? { label: `${labels[product]} ${facetLabel(f)}`, url } : null;
  };
  const facetDetail = useMemo(() => {
    if (!selWeb) return null;
    if (isLayerFacet && facet !== baseFacet) {
      return {
        name: facetLabel(facet),
        product: view,
        state: statusFns[facet](selectedId)?.[view] ?? "unknown",
        isFeature: false,
        source: sourceFor(view, facet),
      };
    }
    if (activeFeature) {
      return {
        name: activeFeature.name,
        product: activeFeature.product,
        state: activeFeature.countries.map(String).includes(String(selectedId))
          ? "available"
          : "unavailable",
        isFeature: true,
        note: activeFeature.note,
        source: activeFeature.source,
      };
    }
    return null;
  }, [selWeb, facet, activeFeature, selectedId, view, isLayerFacet, baseFacet, statusFns]);
  const notesLayer = isLayerFacet ? facet : baseFacet;

  // Combined "not available everywhere" list (web).
  const limited = useMemo(() => {
    if (!availability) return [];
    const ids = new Set();
    products.forEach((p) =>
      (availability.unavailable?.[p]?.[baseFacet] || []).forEach((id) => ids.add(String(id)))
    );
    return [...ids]
      .map((id) => webStatus(id))
      .filter((s) => s && nameById[s.id] && iso[String(Number(s.id))]?.kind === "country")
      .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));
  }, [availability, webStatus, nameById, products, baseFacet, iso]);

  const featureCountryList = useMemo(() => {
    if (!activeFeature) return [];
    return activeFeature.countries
      .map((id) => ({ id: String(id), name: nameById[String(id)] || String(id) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeFeature, nameById]);

  const side = useMemo(() => {
    const byName = (a, b) => a.name.localeCompare(b.name);
    const toRows = (ids, badgeClass, badgeText) =>
      ids
        .map((id) => ({ id: String(id), name: nameById[String(id)] || String(id), badgeClass, badgeText }))
        .sort(byName);

    if (!availability) return { pending: false, heading: "", total: 0, rows: [] };
    if (activeFeature) {
      return {
        pending: false,
        heading: "Available in",
        total: featureCountryList.length,
        rows: featureCountryList.map((c) => ({ ...c, badgeClass: "c3", badgeText: "live" })),
      };
    }
    if (isProduct && isLayerFacet && facet !== baseFacet) {
      if (currentStale)
        return {
          pending: true,
          heading: `Not available · ${labels[view]} ${facetLabel(facet)}`,
          text: `${labels[view]} ${facetLabel(facet)} data isn't available yet.`,
        };
      const ids = (availability.unavailable[view][facet] || []).filter((id) => iso[String(Number(id))]?.kind === "country");
      return {
        pending: false,
        heading: `Not available · ${labels[view]} ${facetLabel(facet)}`,
        total: ids.length,
        rows: toRows(ids, "c0", "✕"),
      };
    }
    if (isProduct) {
      const ids = (availability.unavailable[view][baseFacet] || []).filter((id) => iso[String(Number(id))]?.kind === "country");
      return { pending: false, heading: `Not available · ${labels[view]}`, total: ids.length, rows: toRows(ids, "c0", "✕") };
    }
    return {
      pending: false,
      heading: "Not available everywhere",
      total: limited.length,
      rows: limited.map((s) => ({
        id: s.id,
        name: s.name,
        sub: products.filter((k) => s[k] !== "available").map((k) => labels[k]).join(", ") || "history",
        badgeClass: s.anyUnknown ? "unk" : "c" + s.count,
        badgeText: (s.anyUnknown ? "?" : s.count) + "/" + products.length,
      })),
    };
  }, [availability, activeFeature, featureCountryList, isProduct, isLayerFacet, facet, baseFacet, currentStale, view, nameById, labels, limited, products, iso]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return countryFeatures
      .map((f) => webStatus(f.id))
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [query, countryFeatures, webStatus]);

  const segActive = (v) => (v === "combined" ? view === "combined" : view === v);

  if (error) {
    return (
      <div className="app">
        <p className="kicker">AI Availability Map</p>
        <h1>Couldn't load the data</h1>
        <p className="dek">{error}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="app">
        <p className="kicker">AI Availability Map</p>
        <h1>Where the world's AI products actually work</h1>
        <div className="map-col" style={{ marginTop: 24 }}>
          <div className="map-loading">Loading world map…</div>
        </div>
      </div>
    );
  }

  const PRODUCT_TABS = [["combined", "Combined"], ...products.map((p) => [p, labels[p]])];

  return (
    <div className="app">
      <header className="head">
        <div className="head-titles">
          <p className="kicker">AI Availability Map</p>
          <h1>Where the world's AI products actually work</h1>
          <p className="dek">Official availability of ChatGPT, Claude, and Gemini by country.</p>
        </div>
        <div className="stats">
          {products.map((k) => (
            <StatChip key={k} k={k} available={stats[k]} total={stats.total} labels={labels} providers={providers} />
          ))}
        </div>
      </header>

      {page === "about" ? (
        <InfoPage title="About" onBack={() => setPage("main")}>
          <div className="about-body">
            {(availability.meta.methodology || []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </InfoPage>
      ) : page === "sources" ? (
        <InfoPage title="Sources" onBack={() => setPage("main")}>
          <div className="about-sources foot-sources">
            <ul>
              {(availability.meta.sources || []).map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </InfoPage>
      ) : (
        <>
          <div className="modebar">
            <div className="seg" role="tablist" aria-label="View mode">
              {MODES.map(([m, label]) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  className={"seg-btn" + (mode === m ? " on" : "")}
                  onClick={() => setMode(m)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="modebar-right">
              <div className="menu" ref={themeMenuRef}>
                <button
                  className="menu-btn"
                  aria-haspopup="true"
                  aria-expanded={themeMenuOpen}
                  onClick={() => setThemeMenuOpen((o) => !o)}
                >
                  Theme ▾
                </button>
                {themeMenuOpen && (
                  <div className="menu-pop" role="menu">
                    <span className="menu-label">Theme</span>
                    {THEMES.map((t) => (
                      <button
                        key={t}
                        role="menuitemradio"
                        aria-checked={theme === t}
                        className={"menu-item" + (theme === t ? " on" : "")}
                        onClick={() => {
                          setTheme(t);
                          setThemeMenuOpen(false);
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {mode === "map" && (
            <>
              <div className="toolbar">
                <div className="toolbar-left">
                  <div className="seg" role="tablist" aria-label="Product">
                    {PRODUCT_TABS.map(([v, label]) => (
                      <button
                        key={v}
                        role="tab"
                        aria-selected={segActive(v)}
                        className={"seg-btn" + (segActive(v) ? " on" : "")}
                        onClick={() => pickProduct(v)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="search">
                  <input
                    type="text"
                    placeholder="Search a country…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && matches[0]) selectCountry(matches[0].id);
                    }}
                  />
                  {matches.length > 0 && (
                    <ul className="search-menu">
                      {matches.map((s) => (
                        <li key={s.id}>
                          <button onClick={() => selectCountry(s.id)}>
                            <span>{s.name}</span>
                            <span className={"mini-badge " + (s.anyUnknown ? "unk" : "c" + s.count)}>
                              {s.anyUnknown ? "?" : s.count}/{products.length}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {isProduct && (
                <div className="subtabs" role="tablist" aria-label="Facets">
                  <span className="subtabs-tag">{labels[view]} ›</span>
                  {layers.map((f) => (
                    <button
                      key={f}
                      className={"subtab" + (facet === f ? " on" : "")}
                      onClick={() => setFacet(f)}
                    >
                      {facetLabel(f)}
                    </button>
                  ))}
                  {featuresOf(view).map((f) => (
                    <button
                      key={f.id}
                      className={"subtab" + (facet === f.id ? " on" : "")}
                      onClick={() => setFacet(f.id)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}

              {activeFeature && (
                <div className="spotlight-bar">
                  <span className="spotlight-name">{activeFeature.name}</span>
                  <span className="spotlight-meta">
                    {labels[activeFeature.product]} · available in {featureCountryList.length}{" "}
                    {featureCountryList.length === 1 ? "country" : "countries"}
                    {featureCountryList.length <= 3 &&
                      featureCountryList.length > 0 &&
                      " (" + featureCountryList.map((c) => c.name).join(", ") + ")"}
                  </span>
                  <button className="spotlight-clear" onClick={() => setFacet(baseFacet)}>
                    Clear ✕
                  </button>
                </div>
              )}

              <main className="main">
                <section className="map-col">
                  <MapView
                    features={countryFeatures}
                    statusFor={mapStatusFor}
                    view={mapView}
                    featureCountries={activeFeature ? activeFeature.countries : null}
                    featureLabel={activeFeature ? activeFeature.name : null}
                    selectedId={selectedId}
                    onSelect={selectCountry}
                    projection={PROJECTION}
                    showBorders={SHOW_BORDERS}
                    showGraticule={SHOW_GRATICULE}
                    labels={labels}
                    products={products}
                    singleLabel={singleLabel}
                  />
                  <Legend mode={legendMode} label={legendLabel} showUnknown={!activeFeature && currentStale} />
                  {currentStale && (
                    <p className="stale-note">
                      No data for this view yet — shown as <strong>Unknown</strong>.
                    </p>
                  )}
                </section>

                <aside className="side">
                  <DetailPanel
                    status={selWeb}
                    mode={detailMode}
                    facet={facetDetail}
                    labels={labels}
                    products={products}
                    notesLookup={notesLookup}
                    notesLayer={notesLayer}
                  />
                  {side.pending ? (
                    <div className="side-list">
                      <div className="side-list-head">
                        <h4>{side.heading}</h4>
                        <span>—</span>
                      </div>
                      <p className="subtabs-hint" style={{ padding: "6px 2px 10px" }}>
                        {side.text}
                      </p>
                    </div>
                  ) : (
                    <SideList
                      heading={side.heading}
                      total={side.total}
                      rows={side.rows}
                      selectedId={selectedId}
                      onSelect={selectCountry}
                    />
                  )}
                </aside>
              </main>
            </>
          )}

          {mode === "table" && (
            <TableView
              entries={isoEntries}
              statusFor={webStatus}
              products={products}
              labels={labels}
              selectedId={selectedId}
              onSelect={selectCountry}
            />
          )}

          {mode === "changelog" && (
            <ChangelogView changelog={data.changelog} labels={labels} products={products} />
          )}

          <footer className="foot foot-slim">
            <p className="foot-note">Updated {availability.generatedAt?.slice(0, 10)}</p>
            <div className="foot-links">
              <button className="about-link" onClick={() => setPage("about")}>
                About →
              </button>
              <button className="about-link" onClick={() => setPage("sources")}>
                Sources →
              </button>
              <a
                className="about-link"
                href="https://github.com/shirodune/ai-availability-map"
                target="_blank"
                rel="noreferrer"
              >
                GitHub ↗
              </a>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
