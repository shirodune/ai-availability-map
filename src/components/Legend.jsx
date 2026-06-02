// mode: "combined" | "single" | "feature"
export default function Legend({ mode, label, showUnknown }) {
  if (mode === "combined") {
    return (
      <div className="legend">
        <span className="legend-label">Products available</span>
        <div className="legend-scale">
          {[0, 1, 2, 3].map((n) => (
            <div className="legend-step" key={n}>
              <span className="legend-sw" style={{ background: `var(--c${n})` }} />
              <span>{n}</span>
            </div>
          ))}
          {showUnknown && (
            <div className="legend-step">
              <span className="legend-sw" style={{ background: "var(--unknown)" }} />
              <span>?</span>
            </div>
          )}
        </div>
        <span className="legend-hint">none → all three</span>
      </div>
    );
  }

  const offText = mode === "feature" ? "Not yet" : "Not available";
  return (
    <div className="legend">
      <span className="legend-label">{label}</span>
      <div className="legend-scale">
        <div className="legend-step">
          <span className="legend-sw" style={{ background: "var(--c3)" }} />
          <span>Available</span>
        </div>
        <div className="legend-step">
          <span className="legend-sw" style={{ background: "var(--c0)" }} />
          <span>{offText}</span>
        </div>
        {showUnknown && mode !== "feature" && (
          <div className="legend-step">
            <span className="legend-sw" style={{ background: "var(--unknown)" }} />
            <span>Unknown</span>
          </div>
        )}
      </div>
    </div>
  );
}
