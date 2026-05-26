const LABELS = {
  all:      "Tutti",
  "to-read": "Da leggere",
  reading:  "In lettura",
  done:     "Letti",
};

export default function FilterBar({ filters, active, counts, onChange }) {
  return (
    <div className="filter-bar">
      {filters.map((f) => (
        <button
          key={f}
          className={`filter-btn ${active === f ? "active" : ""}`}
          onClick={() => onChange(f)}
        >
          {LABELS[f]}
          <span className="badge">{counts[f]}</span>
        </button>
      ))}
    </div>
  );
}
