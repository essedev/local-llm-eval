import { useState, useEffect, useCallback } from "react";
import { fetchBooks, addBook, updateStatus, deleteBook } from "./api";
import AddBookForm from "./components/AddBookForm";
import BookList from "./components/BookList";
import FilterBar from "./components/FilterBar";
import "./App.css";

const FILTERS = ["all", "to-read", "reading", "done"];

export default function App() {
  const [books, setBooks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchBooks();
      setBooks(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async (book) => {
    try {
      const created = await addBook(book);
      setBooks((prev) => [created, ...prev]);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const updated = await updateStatus(id, status);
      setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  const visible =
    filter === "all" ? books : books.filter((b) => b.status === filter);

  const counts = {
    all: books.length,
    "to-read": books.filter((b) => b.status === "to-read").length,
    reading: books.filter((b) => b.status === "reading").length,
    done: books.filter((b) => b.status === "done").length,
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📚 BookTrack</h1>
        <p className="subtitle">la tua libreria personale</p>
      </header>

      <main className="app-main">
        <AddBookForm onAdd={handleAdd} />

        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <FilterBar
          filters={FILTERS}
          active={filter}
          counts={counts}
          onChange={setFilter}
        />

        {loading ? (
          <div className="loading">Caricamento…</div>
        ) : (
          <BookList
            books={visible}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}
