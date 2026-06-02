// Detail panel + side list (the right column).

function SourceLink({ source }) {
  if (!source || !source.url) return null;
  return (
    <a className="source-link" href={source.url} target="_blank" rel="noopener noreferrer">
      {source.label || "Source"} ↗
    </a>
  );
}

function AvailRow({ label, dot, state }) {
  const cls = state === "available" ? "yes" : state === "unavailable" ? "no" : "unk";
  const text =
    state === "available" ? "Available" : state === "unavailable" ? "Not available" : "Unknown";
  return (
    <div className={"arow " + cls}>
      {dot && <span className="arow-dot" data-ai={dot} />}
      <span className="arow-label">{label}</span>
      <span className="arow-state">{text}</span>
    </div>
  );
}

function Notes({ notes }) {
  return notes.map((n, i) => (
    <p className="detail-note" key={i}>
      {n.tag && <span className="note-tag">{n.tag}</span>}
      {n.text}
      {n.source && (
        <>
          <br />
          <SourceLink source={n.source} />
        </>
      )}
    </p>
  ));
}

// status: the selected country's CONSUMER (app) status — provides .name + the
// product-overall context. facet: { name, product, state, isFeature, note, source }.
export function DetailPanel({ status, mode, facet, labels, products, notesLookup, notesLayer }) {
  if (!status) {
    return (
      <div className="detail empty">
        <p>Hover or click a country to see what's available there.</p>
      </div>
    );
  }

  if (mode === "facet" && facet) {
    const pill =
      facet.state === "available"
        ? "Available"
        : facet.state === "unknown"
        ? "Unknown"
        : facet.isFeature
        ? "Not yet"
        : "Not available";
    const pillCls = facet.state === "available" ? "yes" : "no";
    return (
      <div className="detail">
        <div className="detail-head">
          <h3>{status.name}</h3>
          <span className={"avail-pill " + pillCls}>{pill}</span>
        </div>
        <p className="detail-sub">
          <strong>{facet.name}</strong> · part of {labels[facet.product]}
        </p>
        <div className="arows">
          <AvailRow label={facet.name} state={facet.state} />
          <AvailRow
            label={labels[facet.product] + " (overall)"}
            dot={facet.product}
            state={status[facet.product]}
          />
        </div>
        {facet.note && <p className="detail-note">{facet.note}</p>}
        <Notes notes={notesLookup(status.id, facet.product, notesLayer)} />
        <SourceLink source={facet.source} />
      </div>
    );
  }

  // overview (combined / product "Overall") — consumer app statuses
  const badgeClass = status.anyUnknown ? "unk" : "c" + status.count;
  return (
    <div className="detail">
      <div className="detail-head">
        <h3>{status.name}</h3>
        <span className={"count-badge " + badgeClass}>
          {status.anyUnknown ? "?" : status.count}
          <span>/{products.length}</span>
        </span>
      </div>
      <div className="arows">
        {products.map((k) => (
          <AvailRow key={k} label={labels[k]} dot={k} state={status[k]} />
        ))}
      </div>
      <Notes notes={notesLookup(status.id, undefined, "app")} />
    </div>
  );
}

// Generic list. rows: [{ id, name, sub?, badgeClass, badgeText }]
export function SideList({ heading, total, rows, selectedId, onSelect }) {
  return (
    <div className="side-list">
      <div className="side-list-head">
        <h4>{heading}</h4>
        <span>{total}</span>
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            <button
              className={String(selectedId) === String(r.id) ? "on" : ""}
              onClick={() => onSelect(String(r.id))}
            >
              <span className="ll-name">{r.name}</span>
              {r.sub && <span className="ll-miss">{r.sub}</span>}
              <span className={"mini-badge " + r.badgeClass}>{r.badgeText}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
