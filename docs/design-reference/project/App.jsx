/* global React, ReactDOM, d3, topojson, MapView, useTweaks, TweaksPanel,
   TweakSection, TweakRadio, TweakToggle, TweakSelect */

const { useState, useEffect, useMemo, useCallback } = React;
const AIS = ["chatgpt", "claude", "gemini"];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "editorial",
  "selectorStyle": "twoTier",
  "projection": "equalEarth",
  "showBorders": true,
  "showGraticule": false
}/*EDITMODE-END*/;

const PRODUCT_TABS = [["combined", "Combined"], ["chatgpt", "ChatGPT"],
                      ["claude", "Claude"], ["gemini", "Gemini"]];

// ---- status helper -----------------------------------------------------------
function makeStatusFor(nameById) {
  const ov = AI_DATA.overrides;
  return (id) => {
    const o = ov[String(id)];
    const name = (o && o.name) || nameById[String(id)] || "—";
    const chatgpt = o ? o.chatgpt : true;
    const claude = o ? o.claude : true;
    const gemini = o ? o.gemini : true;
    const count = (chatgpt ? 1 : 0) + (claude ? 1 : 0) + (gemini ? 1 : 0);
    return { id: String(id), name, chatgpt, claude, gemini, count, note: o && o.note, source: o && o.source };
  };
}

// ---- small pieces ------------------------------------------------------------
function StatChip({ k, available, total }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span className="stat-dot" data-ai={k} />
        <span className="stat-name">{AI_DATA.meta.labels[k]}</span>
        <span className="stat-prov">{AI_DATA.meta.providers[k]}</span>
      </div>
      <div className="stat-num">{available}<span className="stat-den">/ {total}</span></div>
      <div className="stat-cap">countries available</div>
    </div>
  );
}

function AvailRow({ label, dot, on }) {
  return (
    <div className={"arow " + (on ? "yes" : "no")}>
      {dot && <span className="arow-dot" data-ai={dot} />}
      <span className="arow-label">{label}</span>
      <span className="arow-state">{on ? "Available" : "Not available"}</span>
    </div>
  );
}

function DetailPanel({ status, view, feature, featureAvailable }) {
  if (!status) {
    return (
      <div className="detail empty">
        <p>Hover or click a country to see what's available there.</p>
      </div>
    );
  }

  // Feature-spotlight detail
  if (view === "feature" && feature) {
    const productOn = status[feature.product];
    return (
      <div className="detail">
        <div className="detail-head">
          <h3>{status.name}</h3>
          <span className={"avail-pill " + (featureAvailable ? "yes" : "no")}>
            {featureAvailable ? "Available" : "Not yet"}
          </span>
        </div>
        <p className="detail-sub">
          <strong>{feature.name}</strong> · part of {AI_DATA.meta.labels[feature.product]}
        </p>
        <div className="arows">
          <AvailRow label={feature.name} on={featureAvailable} />
          <AvailRow label={AI_DATA.meta.labels[feature.product] + " (overall)"} dot={feature.product} on={productOn} />
        </div>
        {feature.note && <p className="detail-note">{feature.note}</p>}
        <SourceLink source={feature.source} />
      </div>
    );
  }

  // Product / combined detail
  return (
    <div className="detail">
      <div className="detail-head">
        <h3>{status.name}</h3>
        <span className={"count-badge c" + status.count}>{status.count}<span>/3</span></span>
      </div>
      <div className="arows">
        {AIS.map((k) => <AvailRow key={k} label={AI_DATA.meta.labels[k]} dot={k} on={status[k]} />)}
      </div>
      {status.note && <p className="detail-note">{status.note}</p>}
      <SourceLink source={status.source} />
    </div>
  );
}

function SourceLink({ source }) {
  if (!source) return null;
  return (
    <a className="source-link" href={source.url} target="_blank" rel="noopener noreferrer">
      {source.label || "Source"} ↗
    </a>
  );
}

function Legend({ view, featureLabel }) {
  if (view === "combined") {
    return (
      <div className="legend">
        <span className="legend-label">Assistants available</span>
        <div className="legend-scale">
          {[0, 1, 2, 3].map((n) => (
            <div className="legend-step" key={n}>
              <span className="legend-sw" style={{ background: `var(--c${n})` }} />
              <span>{n}</span>
            </div>
          ))}
        </div>
        <span className="legend-hint">none → all three</span>
      </div>
    );
  }
  const label = view === "feature" ? featureLabel : AI_DATA.meta.labels[view];
  const offText = view === "feature" ? "Not yet" : "Not available";
  return (
    <div className="legend">
      <span className="legend-label">{label}</span>
      <div className="legend-scale">
        <div className="legend-step">
          <span className="legend-sw" style={{ background: "var(--c3)" }} /><span>Available</span>
        </div>
        <div className="legend-step">
          <span className="legend-sw" style={{ background: "var(--c0)" }} /><span>{offText}</span>
        </div>
      </div>
    </div>
  );
}

// ---- app ---------------------------------------------------------------------
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [features, setFeatures] = useState(null);
  const [view, setView] = useState("combined");      // combined | chatgpt | claude | gemini
  const [featureId, setFeatureId] = useState(null);  // null or feature id
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => { document.documentElement.dataset.theme = t.theme; }, [t.theme]);

  useEffect(() => {
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((world) => {
        const feats = topojson
          .feature(world, world.objects.countries)
          .features.filter((f) => f.properties.name !== "Antarctica");
        setFeatures(feats);
      })
      .catch((err) => { console.error("map load failed", err); setFeatures([]); });
  }, []);

  const nameById = useMemo(() => {
    const m = {};
    (features || []).forEach((f) => { m[String(f.id)] = f.properties.name; });
    return m;
  }, [features]);

  const statusFor = useMemo(() => makeStatusFor(nameById), [nameById]);

  const featureList = AI_DATA.features || [];
  const activeFeature = featureId ? featureList.find((f) => f.id === featureId) : null;
  const effView = activeFeature ? "feature" : view;
  const featuresOf = (p) => featureList.filter((f) => f.product === p);
  const activeProduct = activeFeature ? activeFeature.product : (view !== "combined" ? view : null);
  const segActive = (v) =>
    t.selectorStyle === "twoTier"
      ? v === (activeFeature ? activeFeature.product : view)
      : (!activeFeature && view === v);

  // summary counts (product level)
  const stats = useMemo(() => {
    const total = (features || []).length;
    const acc = { chatgpt: total, claude: total, gemini: total };
    Object.keys(AI_DATA.overrides).forEach((id) => {
      if (!nameById[id]) return;
      const o = AI_DATA.overrides[id];
      AIS.forEach((k) => { if (!o[k]) acc[k] -= 1; });
    });
    return { total, ...acc };
  }, [features, nameById]);

  const limited = useMemo(() => {
    return Object.keys(AI_DATA.overrides)
      .map((id) => statusFor(id))
      .filter((s) => s.count < 3 && nameById[s.id])
      .sort((a, b) => a.count - b.count || a.name.localeCompare(b.name));
  }, [statusFor, nameById]);

  // countries where the active feature is available
  const featureCountryList = useMemo(() => {
    if (!activeFeature) return [];
    return activeFeature.countries
      .map((id) => ({ id: String(id), name: nameById[String(id)] || id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeFeature, nameById]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !features) return [];
    return features
      .map((f) => statusFor(f.id))
      .filter((s) => s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 6);
  }, [query, features, statusFor]);

  const selectCountry = useCallback((id) => { setSelectedId(id); setQuery(""); }, []);
  const pickProduct = useCallback((v) => { setView(v); setFeatureId(null); }, []);

  const selStatus = selectedId ? statusFor(selectedId) : null;
  const featureAvailable = activeFeature && selectedId
    ? activeFeature.countries.map(String).includes(String(selectedId)) : false;

  return (
    <div className="app">
      <header className="head">
        <div className="head-titles">
          <p className="kicker">AI Availability Map</p>
          <h1>Where the world's AI assistants actually work</h1>
          <p className="dek">
            Official availability of ChatGPT, Claude, and Gemini by country — plus
            spotlights on individual features that launched in only a few places.
            <span className="updated"> {AI_DATA.meta.updated}</span>
          </p>
        </div>
        <div className="stats">
          {AIS.map((k) => (
            <StatChip key={k} k={k} available={stats[k]} total={stats.total} />
          ))}
        </div>
      </header>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="seg" role="tablist" aria-label="View">
            {PRODUCT_TABS.map(([v, label]) => {
              const fc = v !== "combined" ? featuresOf(v).length : 0;
              return (
                <button key={v} role="tab" aria-selected={segActive(v)}
                        className={"seg-btn" + (segActive(v) ? " on" : "")}
                        onClick={() => pickProduct(v)}>
                  {label}
                  {fc > 0 && <span className="seg-count" title={fc + " feature spotlights"}>{fc}</span>}
                </button>
              );
            })}
          </div>

          {t.selectorStyle === "dropdown" && (
            <label className={"feature-pick" + (activeFeature ? " on" : "")}>
              <span className="feature-pick-tag">Feature</span>
              <select value={featureId || ""} onChange={(e) => setFeatureId(e.target.value || null)}>
                <option value="">Spotlight a feature…</option>
                {AIS.map((p) => {
                  const items = featuresOf(p);
                  if (!items.length) return null;
                  return (
                    <optgroup key={p} label={AI_DATA.meta.labels[p]}>
                      {items.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </optgroup>
                  );
                })}
              </select>
            </label>
          )}
        </div>
        <div className="search">
          <input
            type="text" placeholder="Search a country…" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) selectCountry(matches[0].id); }}
          />
          {matches.length > 0 && (
            <ul className="search-menu">
              {matches.map((s) => (
                <li key={s.id}>
                  <button onClick={() => selectCountry(s.id)}>
                    <span>{s.name}</span>
                    <span className={"mini-badge c" + s.count}>{s.count}/3</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {t.selectorStyle === "twoTier" && (
        <div className="subtabs" role="tablist" aria-label="Feature spotlights">
          {activeProduct && featuresOf(activeProduct).length > 0 ? (
            <React.Fragment>
              <span className="subtabs-tag">{AI_DATA.meta.labels[activeProduct]} ›</span>
              <button className={"subtab" + (!activeFeature ? " on" : "")}
                      onClick={() => { setView(activeProduct); setFeatureId(null); }}>Overall</button>
              {featuresOf(activeProduct).map((f) => (
                <button key={f.id} className={"subtab" + (featureId === f.id ? " on" : "")}
                        onClick={() => { setView(activeProduct); setFeatureId(f.id); }}>{f.name}</button>
              ))}
            </React.Fragment>
          ) : (
            <span className="subtabs-hint">
              <strong>Feature spotlights</strong> — open a product above to highlight features
              that launched in only a few countries, like Gemini Spark or Operator.
            </span>
          )}
        </div>
      )}

      {activeFeature && (
        <div className="spotlight-bar">
          <span className="spotlight-name">{activeFeature.name}</span>
          <span className="spotlight-meta">
            {AI_DATA.meta.labels[activeFeature.product]} · available in {featureCountryList.length}{" "}
            {featureCountryList.length === 1 ? "country" : "countries"}
            {featureCountryList.length <= 3 && featureCountryList.length > 0 &&
              " (" + featureCountryList.map((c) => c.name).join(", ") + ")"}
          </span>
          <button className="spotlight-clear" onClick={() => setFeatureId(null)}>Clear ✕</button>
        </div>
      )}

      <main className="main">
        <section className="map-col">
          {features === null ? (
            <div className="map-loading">Loading world map…</div>
          ) : features.length === 0 ? (
            <div className="map-loading">Couldn't load the map geometry.</div>
          ) : (
            <MapView
              features={features}
              statusFor={statusFor}
              view={effView}
              featureCountries={activeFeature ? activeFeature.countries : null}
              featureLabel={activeFeature ? activeFeature.name : null}
              selectedId={selectedId}
              onSelect={selectCountry}
              projection={t.projection}
              showBorders={t.showBorders}
              showGraticule={t.showGraticule}
            />
          )}
          <Legend view={effView} featureLabel={activeFeature ? activeFeature.name : null} />
        </section>

        <aside className="side">
          <DetailPanel status={selStatus} view={effView}
                       feature={activeFeature} featureAvailable={featureAvailable} />
          <div className="side-list">
            {activeFeature ? (
              <React.Fragment>
                <div className="side-list-head">
                  <h4>Available in</h4>
                  <span>{featureCountryList.length}</span>
                </div>
                <ul>
                  {featureCountryList.map((c) => (
                    <li key={c.id}>
                      <button className={selectedId === c.id ? "on" : ""}
                              onClick={() => selectCountry(c.id)}>
                        <span className="ll-name">{c.name}</span>
                        <span className="mini-badge c3">live</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div className="side-list-head">
                  <h4>Not available everywhere</h4>
                  <span>{limited.length}</span>
                </div>
                <ul>
                  {limited.map((s) => (
                    <li key={s.id}>
                      <button className={selectedId === s.id ? "on" : ""}
                              onClick={() => selectCountry(s.id)}>
                        <span className="ll-name">{s.name}</span>
                        <span className="ll-miss">
                          {AIS.filter((k) => !s[k]).map((k) => AI_DATA.meta.labels[k]).join(", ") || "history"}
                        </span>
                        <span className={"mini-badge c" + s.count}>{s.count}/3</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </React.Fragment>
            )}
          </div>
        </aside>
      </main>

      <footer className="foot">
        <div className="foot-main">
          <p className="foot-note">
            Availability shifts often and varies by product tier, payment method, and policy.
            Treat this as an editable best-effort snapshot, not legal guidance.
          </p>
          {(AI_DATA.meta.methodology || []).length > 0 && (
            <details className="methodology">
              <summary>Methodology &amp; scope</summary>
              <div className="methodology-body">
                {AI_DATA.meta.methodology.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </details>
          )}
        </div>
        {(AI_DATA.meta.sources || []).length > 0 && (
          <div className="foot-sources">
            <span className="foot-sources-label">Sources</span>
            <ul>
              {AI_DATA.meta.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label} ↗</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </footer>

      <TweaksPanel>
        <TweakSection label="Visual direction" />
        <TweakSelect label="Theme" value={t.theme}
          options={["editorial", "control", "minimal"]}
          onChange={(v) => setTweak("theme", v)} />
        <TweakSection label="Feature selector" />
        <TweakRadio label="Style" value={t.selectorStyle}
          options={["twoTier", "dropdown"]}
          onChange={(v) => setTweak("selectorStyle", v)} />
        <TweakSection label="Map" />
        <TweakSelect label="Projection" value={t.projection}
          options={["equalEarth", "naturalEarth", "mercator"]}
          onChange={(v) => setTweak("projection", v)} />
        <TweakToggle label="Country borders" value={t.showBorders}
          onChange={(v) => setTweak("showBorders", v)} />
        <TweakToggle label="Graticule" value={t.showGraticule}
          onChange={(v) => setTweak("showGraticule", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
