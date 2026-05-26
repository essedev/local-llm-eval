import { useState } from "react";

const STATUS_META = {
  "to-read": { label: "Da leggere", icon: "📋", next: "reading",  nextLabel: "Inizia a leggere →" },
  reading:   { label: "In lettura", icon: "📖", next: "done",     nextLabel: "Segna come letto ✓" },
  done:      { label: "Letto",      icon: "✅", next: "to-read",  nextLabel: "Rimetti in lista ↺" },
};

export default function BookCard({ book, onStatusChange, onDelete }) {
  const [busy, setBusy] = useState(false);
  const meta = STATUS_META[book.status];

  const handleNext = async () => {
    setBusy(true);
    await onStatusChange(book.id, meta.next);
    setBusy(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Eliminare "${book.title}"?`)) return;
    await onDelete(book.id);
  };

  return (
    <li className={`book-card status-${book.status}`}>
      <div className="book-icon">{meta.icon}</div>
      <div className="book-info">
        <span className="book-title">{book.title}</span>
        <span className="book-author">{book.author}</span>
        <span className={`status-badge status-${book.status}`}>{meta.label}</span>
      </div>
      <div className="book-actions">
        <button
          className="btn btn-next"
          onClick={handleNext}
          disabled={busy}
          title={meta.nextLabel}
        >
          {busy ? "…" : meta.nextLabel}
        </button>
        <button
          className="btn btn-delete"
          onClick={handleDelete}
          title="Elimina"
        >
          🗑
        </button>
      </div>
    </li>
  );
}
