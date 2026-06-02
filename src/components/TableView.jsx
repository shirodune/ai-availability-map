import { useMemo, useState } from "react";

// Sortable, searchable table of consumer-app (web) availability.
// Toggle: Countries (default) ⇄ Countries + Regions (full ISO 3166-1).
export default function TableView({ entries, statusFor, products, labels, selectedId, onSelect }) {
  const [scope, setScope] = useState("countries"); // countries | all
  const [sort, setSort] = useState({ key: "name", dir: 1 });
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const base = scope === "countries" ? entries.filter((e) => e.kind === "country") : entries;
    return base.map((e) => ({ ...statusFor(e.id), name: e.name, kind: e.kind }));
  }, [entries, scope, statusFor]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const rank = (st) => (st === "available" ? 2 : st === "unknown" ? 1 : 0);
    let r = qq ? rows.filter((s) => s.name.toLowerCase().includes(qq)) : rows;
    r = [...r].sort((a, b) => {
      let cmp;
      if (sort.key === "name") cmp = a.name.localeCompare(b.name);
      else if (sort.key === "count") cmp = a.count - b.count;
      else cmp = rank(a[sort.key]) - rank(b[sort.key]);
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
      return cmp * sort.dir;
    });
    return r;
  }, [rows, q, sort]);

  const setSortKey = (key) =>
    setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: key === "name" ? 1 : -1 }));
  const caret = (key) => (sort.key === key ? (sort.dir > 0 ? "▲" : "▼") : "");

  return (
    <div className="tableview">
      <div className="change-filter" style={{ justifyContent: "space-between" }}>
        <div className="seg" role="tablist" aria-label="Scope">
          <button className={"seg-btn" + (scope === "countries" ? " on" : "")} onClick={() => setScope("countries")}>
            Countries
          </button>
          <button className={"seg-btn" + (scope === "all" ? " on" : "")} onClick={() => setScope("all")}>
            Countries + Regions
          </button>
        </div>
        <div className="search">
          <input type="text" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <table className="avail-table">
        <thead>
          <tr>
            <th onClick={() => setSortKey("name")}>
              {scope === "all" ? "Country / region" : "Country"} <span className="sort-caret">{caret("name")}</span>
            </th>
            {products.map((p) => (
              <th key={p} onClick={() => setSortKey(p)}>
                {labels[p]} <span className="sort-caret">{caret(p)}</span>
              </th>
            ))}
            <th onClick={() => setSortKey("count")}>
              Available <span className="sort-caret">{caret("count")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr
              key={s.id}
              className={String(selectedId) === String(s.id) ? "sel" : ""}
              onClick={() => onSelect(String(s.id))}
            >
              <td className="country-cell">
                {s.name}
                {s.kind === "region" && <span className="region-tag">region</span>}
              </td>
              {products.map((p) => (
                <td key={p}>
                  <StatusCell state={s[p]} />
                </td>
              ))}
              <td>{s.anyUnknown ? "—" : `${s.count}/${products.length}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-foot">
        {filtered.length} {scope === "countries" ? "countries" : "countries & regions"} · web (free)
      </div>
    </div>
  );
}

function StatusCell({ state }) {
  const cls = state === "available" ? "cell-yes" : state === "unavailable" ? "cell-no" : "cell-unk";
  const txt = state === "available" ? "Yes" : state === "unavailable" ? "No" : "—";
  return (
    <span className={"cell-status " + cls}>
      <span className="cell-dot" />
      {txt}
    </span>
  );
}
