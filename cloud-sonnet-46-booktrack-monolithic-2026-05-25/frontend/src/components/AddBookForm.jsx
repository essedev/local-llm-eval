import { useState } from "react";

const STATUSES = [
  { value: "to-read", label: "📋 Da leggere" },
  { value: "reading", label: "📖 In lettura" },
  { value: "done",    label: "✅ Letto" },
];

export default function AddBookForm({ onAdd }) {
  const [title, setTitle]   = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("to-read");
  const [busy, setBusy]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setBusy(true);
    await onAdd({ title: title.trim(), author: author.trim(), status });
    setTitle("");
    setAuthor("");
    setStatus("to-read");
    setBusy(false);
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2>Aggiungi libro</h2>
      <div className="form-row">
        <input
          className="input"
          type="text"
          placeholder="Titolo *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="input"
          type="text"
          placeholder="Autore *"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <select
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "…" : "Aggiungi"}
        </button>
      </div>
    </form>
  );
}
