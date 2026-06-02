// Generic secondary page (About, Sources) with a back link.
export default function InfoPage({ title, onBack, children }) {
  return (
    <section className="about">
      <button className="about-back" onClick={onBack}>
        ← Back to the map
      </button>
      <h2 className="about-title">{title}</h2>
      {children}
    </section>
  );
}
