import { useState, useEffect, useCallback } from 'react';

const STATUS_LABELS = {
  'to-read': 'Da leggere',
  'reading': 'Lettura',
  'done': 'Letto',
};

const STATUS_ORDER = ['to-read', 'reading', 'done'];

function cycleStatus(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('to-read');
  const [loading, setLoading] = useState(false);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      setBooks(data);
    } catch (e) {
      console.error('Errore nel caricamento:', e);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), author: author.trim(), status }),
      });
      if (res.ok) {
        setTitle('');
        setAuthor('');
        setStatus('to-read');
        await fetchBooks();
      }
    } catch (e) {
      console.error('Errore nell\'aggiunta:', e);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) await fetchBooks();
    } catch (e) {
      console.error('Errore nell\'aggiornamento:', e);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      if (res.ok) await fetchBooks();
    } catch (e) {
      console.error('Errore nella cancellazione:', e);
    }
  };

  const counts = {
    'to-read': books.filter(b => b.status === 'to-read').length,
    'reading': books.filter(b => b.status === 'reading').length,
    'done': books.filter(b => b.status === 'done').length,
  };

  return (
    <div>
      <h1>📚 Book<span>Track</span></h1>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Titolo del libro"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Autore"
          value={author}
          onChange={e => setAuthor(e.target.value)}
        />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="to-read">Da leggere</option>
          <option value="reading">Lettura</option>
          <option value="done">Letto</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Aggiungendo...' : 'Aggiungi'}
        </button>
      </form>

      <div className="stats">
        <div className="stat to-read">
          <div className="num">{counts['to-read']}</div>
          <div className="label">Da leggere</div>
        </div>
        <div className="stat reading">
          <div className="num">{counts['reading']}</div>
          <div className="label">Lettura</div>
        </div>
        <div className="stat done">
          <div className="num">{counts['done']}</div>
          <div className="label">Letto</div>
        </div>
      </div>

      <div className="book-list">
        {books.length === 0 && (
          <div className="empty">Nessun libro ancora. Aggiungine uno!</div>
        )}
        {books.map(book => (
          <div className="book-card" key={book.id}>
            <div className="book-info">
              <div className="book-title">{book.title}</div>
              <div className="book-author">{book.author}</div>
            </div>
            <button
              className={`book-status ${book.status}`}
              onClick={() => handleStatusChange(book.id, cycleStatus(book.status))}
              title="Clicca per cambiare stato"
            >
              {STATUS_LABELS[book.status]}
            </button>
            <button
              className="delete-btn"
              onClick={() => handleDelete(book.id)}
              title="Elimina"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
