/* global React, d3 */
// MapView.jsx — SVG world map rendered from TopoJSON features via d3-geo.
// Paths are memoized; view/theme changes only swap fills.

const { useMemo, useState, useRef, useCallback } = React;

const PROJECTIONS = {
  equalEarth: () => d3.geoEqualEarth(),
  naturalEarth: () => d3.geoNaturalEarth1(),
  mercator: () => d3.geoMercator(),
};

function MapView({
  features,
  statusFor,
  view,
  featureCountries,
  featureLabel,
  selectedId,
  onSelect,
  projection: projName,
  showBorders,
  showGraticule,
}) {
  const W = 1000, H = 500;
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null); // { id, x, y }

  // Build projection + path generator once per (features, projection, size).
  const { pathFor, graticulePath, spherePath } = useMemo(() => {
    const fc = { type: "FeatureCollection", features };
    const proj = (PROJECTIONS[projName] || PROJECTIONS.equalEarth)();
    // Mercator can't fit Antarctica/poles cleanly; pad a touch.
    proj.fitExtent([[8, 8], [W - 8, H - 8]], fc);
    const path = d3.geoPath(proj);
    const grat = d3.geoGraticule10();
    return {
      pathFor: (f) => path(f),
      graticulePath: path(grat),
      spherePath: path({ type: "Sphere" }),
    };
  }, [features, projName]);

  const featureSet = useMemo(
    () => new Set((featureCountries || []).map(String)),
    [featureCountries]
  );

  const fillFor = useCallback((id) => {
    if (view === "feature") return featureSet.has(String(id)) ? "var(--c3)" : "var(--c0)";
    const s = statusFor(id);
    if (view === "combined") return `var(--c${s.count})`;
    return s[view] ? "var(--c3)" : "var(--c0)";
  }, [statusFor, view, featureSet]);

  const handleMove = useCallback((e, id) => {
    const r = wrapRef.current.getBoundingClientRect();
    setHover({ id, x: e.clientX - r.left, y: e.clientY - r.top });
  }, []);

  const hoverStatus = hover ? statusFor(hover.id) : null;

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg viewBox={`0 0 ${W} ${H}`} className="map-svg" role="img"
           aria-label="World map of AI assistant availability">
        <path d={spherePath} className="sphere" />
        {showGraticule && <path d={graticulePath} className="graticule" />}
        <g>
          {features.map((f, i) => {
            const isSel = selectedId === f.id;
            return (
              <path
                key={i}
                d={pathFor(f)}
                fill={fillFor(f.id)}
                className={
                  "country" +
                  (showBorders ? " bordered" : "") +
                  (isSel ? " selected" : "") +
                  (hover && hover.id === f.id ? " hovered" : "")
                }
                onMouseMove={(e) => handleMove(e, f.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(f.id)}
              />
            );
          })}
        </g>
      </svg>

      {hover && hoverStatus && (
        <div
          className="tip"
          style={{
            left: Math.min(hover.x + 14, W - 4),
            top: hover.y + 14,
            transform: hover.x > W * 0.66 ? "translateX(-100%)" : "none",
          }}
        >
          <div className="tip-name">{hoverStatus.name}</div>
          {view === "combined" ? (
            <div className="tip-rows">
              {["chatgpt", "claude", "gemini"].map((k) => (
                <span key={k} className={"tip-chip " + (hoverStatus[k] ? "on" : "off")}>
                  {AI_DATA.meta.labels[k]} {hoverStatus[k] ? "✓" : "✕"}
                </span>
              ))}
            </div>
          ) : view === "feature" ? (
            <div className="tip-single">
              {featureLabel}:{" "}
              <strong className={featureSet.has(String(hover.id)) ? "on" : "off"}>
                {featureSet.has(String(hover.id)) ? "Available" : "Not available"}
              </strong>
            </div>
          ) : (
            <div className="tip-single">
              {AI_DATA.meta.labels[view]}:{" "}
              <strong className={hoverStatus[view] ? "on" : "off"}>
                {hoverStatus[view] ? "Available" : "Not available"}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.MapView = MapView;
