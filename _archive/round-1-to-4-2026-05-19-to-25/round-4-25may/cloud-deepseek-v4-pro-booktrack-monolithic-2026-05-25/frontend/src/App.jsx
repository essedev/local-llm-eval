import { useState, useEffect, useCallback } from "react";

const API = "/api/books";

const STATUSES = ["to-read", "reading", "done"];
const STATUS_LABEL = {
  "to-read": "Da leggere",
  reading: "In lettura",
  done: "Finito",
};

function App() {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    title: "",
    author: "",
    status: "to-read",
  });

  const fetchBooks = useCallback(async () => {
    const url = filter ? `${API}?status=${filter}` : API;
    const res = await fetch(url);
    const data = await res.json();
    setBooks(data);
  }, [filter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", author: "", status: "to-read" });
    fetchBooks();
  };

  const handleStatusChange = async (id, newStatus) => {
    await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchBooks();
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchBooks();
  };

  return (
    <div className="container">
      <h1>📚 Book Tracker</h1>

      {/* Add form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Titolo"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Autore"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          required
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <button type="submit">Aggiungi</button>
      </form>

      {/* Filter buttons */}
      <div className="filters">
        <button
          className={filter === "" ? "active" : ""}
          onClick={() => setFilter("")}
        >
          Tutti
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={filter === s ? "active" : ""}
            onClick={() => setFilter(s)}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Book list */}
      {books.length === 0 ? (
        <p className="empty">Nessun libro trovato.</p>
      ) : (
        <ul className="book-list">
          {books.map((b) => (
            <li key={b.id} className="book-card">
              <div className="book-info">
                <div className="title">{b.title}</div>
                <div className="author">{b.author}</div>
              </div>
              <div className="book-actions">
                <span className={`status-badge ${b.status}`}>
                  {STATUS_LABEL[b.status]}
                </span>
                <select
                  value={b.status}
                  onChange={(e) => handleStatusChange(b.id, e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  className="delete-btn"
                  title="Elimina"
                  onClick={() => handleDelete(b.id)}
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
