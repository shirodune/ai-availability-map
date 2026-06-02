import { useMemo, useState, useRef, useCallback } from "react";
import { CustomProjection } from "@visx/geo";
import { geoPath, geoGraticule10 } from "d3-geo";
import { PROJECTIONS } from "../lib/geo.js";

// Logical drawing size; the SVG scales to its container via viewBox.
const W = 1000;
const H = 500;

export default function MapView({
  features,
  statusFor,
  view, // "combined" | "chatgpt" | "claude" | "gemini" | "feature"
  featureCountries,
  featureLabel,
  selectedId,
  onSelect,
  projection: projName,
  showBorders,
  showGraticule,
  labels,
  products,
  singleLabel,
}) {
  const wrapRef = useRef(null);
  const [hover, setHover] = useState(null); // { id, x, y, w }

  // A pre-fitted projection so the map always fills the frame regardless of
  // which @visx/geo version is installed (we don't rely on its fit props).
  const projectionFactory = useMemo(() => {
    return () => {
      const p = (PROJECTIONS[projName] || PROJECTIONS.equalEarth)();
      p.fitExtent(
        [
          [8, 8],
          [W - 8, H - 8],
        ],
        { type: "FeatureCollection", features }
      );
      return p;
    };
  }, [features, projName]);

  const featureSet = useMemo(
    () => new Set((featureCountries || []).map(String)),
    [featureCountries]
  );

  const fillFor = useCallback(
    (id) => {
      if (view === "feature") {
        return featureSet.has(String(id)) ? "var(--c3)" : "var(--c0)";
      }
      const s = statusFor(id);
      if (view === "combined") {
        return s.anyUnknown ? "var(--unknown)" : `var(--c${s.count})`;
      }
      const st = s[view];
      return st === "available"
        ? "var(--c3)"
        : st === "unavailable"
        ? "var(--c0)"
        : "var(--unknown)";
    },
    [statusFor, view, featureSet]
  );

  const handleMove = useCallback((e, id) => {
    const r = wrapRef.current.getBoundingClientRect();
    setHover({ id, x: e.clientX - r.left, y: e.clientY - r.top, w: r.width });
  }, []);

  const hoverStatus = hover ? statusFor(hover.id) : null;

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="map-svg"
        role="img"
        aria-label="World map of AI product availability"
      >
        <CustomProjection projection={projectionFactory} data={features}>
          {(proj) => {
            const gp = geoPath(proj.projection);
            return (
              <g>
                <path d={gp({ type: "Sphere" }) || ""} className="sphere" />
                {showGraticule && (
                  <path d={gp(geoGraticule10()) || ""} className="graticule" />
                )}
                {proj.features.map(({ feature, path }, i) => {
                  const id = feature.id;
                  const isSel = String(selectedId) === String(id);
                  const isHover = hover && String(hover.id) === String(id);
                  return (
                    <path
                      key={i}
                      d={path || ""}
                      fill={fillFor(id)}
                      className={
                        "country" +
                        (showBorders ? " bordered" : "") +
                        (isSel ? " selected" : "") +
                        (isHover ? " hovered" : "")
                      }
                      onMouseMove={(e) => handleMove(e, id)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onSelect(String(id))}
                    />
                  );
                })}
              </g>
            );
          }}
        </CustomProjection>
      </svg>

      {hover && hoverStatus && (
        <div
          className="tip"
          style={{
            left: Math.min(hover.x + 14, (hover.w || W) - 4),
            top: hover.y + 14,
            transform: hover.x > (hover.w || W) * 0.66 ? "translateX(-100%)" : "none",
          }}
        >
          <div className="tip-name">{hoverStatus.name}</div>
          {view === "combined" ? (
            <div className="tip-rows">
              {products.map((k) => {
                const st = hoverStatus[k];
                const cls = st === "available" ? "" : st === "unavailable" ? "off" : "unk";
                const sym = st === "available" ? "✓" : st === "unavailable" ? "✕" : "?";
                return (
                  <span key={k} className={"tip-chip " + cls}>
                    {labels[k]} {sym}
                  </span>
                );
              })}
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
              {singleLabel || labels[view]}:{" "}
              <strong
                className={
                  hoverStatus[view] === "available"
                    ? "on"
                    : hoverStatus[view] === "unavailable"
                    ? "off"
                    : ""
                }
              >
                {hoverStatus[view] === "available"
                  ? "Available"
                  : hoverStatus[view] === "unavailable"
                  ? "Not available"
                  : "Unknown"}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
