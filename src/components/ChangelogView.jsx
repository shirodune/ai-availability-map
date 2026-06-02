import { useMemo, useState } from "react";

// "Recent changes" — availability flips over time, newest first.
export default function ChangelogView({ changelog, labels, products }) {
  const [prod, setProd] = useState("all");
  const entries = changelog?.entries || [];
  const illustrative = changelog?.meta?.illustrative;

  const filtered = useMemo(() => {
    const r = prod === "all" ? entries : entries.filter((e) => e.product === prod);
    return [...r].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [entries, prod]);

  return (
    <div className="changelog">
      <div className="changelog-banner">
        <strong style={{ color: "var(--ink)" }}>Recent changes</strong>
        {illustrative && <span className="illus-tag">illustrative seed</span>}
        <span>— availability flips recorded over time. Real history accumulates automatically from scraper diffs.</span>
      </div>
      <div className="change-filter">
        <div className="seg">
          <button className={"seg-btn" + (prod === "all" ? " on" : "")} onClick={() => setProd("all")}>
            All
          </button>
          {products.map((p) => (
            <button
              key={p}
              className={"seg-btn" + (prod === p ? " on" : "")}
              onClick={() => setProd(p)}
            >
              {labels[p]}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="change-empty">No changes recorded yet for this filter.</div>
      ) : (
        filtered.map((e, i) => (
          <div className="change-row" key={i}>
            <span className="change-date">{e.date}</span>
            <span className="change-country">{e.name || e.country}</span>
            <span className="change-meta">
              <span className="change-prod">
                <span className="arow-dot" data-ai={e.product} />
                {labels[e.product] || e.product}
              </span>
              <span className="change-layer">{e.layer}</span>
            </span>
            <span className="change-flow">
              {e.from} →{" "}
              <span className={e.to === "available" ? "to-yes" : "to-no"}>{e.to}</span>
            </span>
          </div>
        ))
      )}
    </div>
  );
}
