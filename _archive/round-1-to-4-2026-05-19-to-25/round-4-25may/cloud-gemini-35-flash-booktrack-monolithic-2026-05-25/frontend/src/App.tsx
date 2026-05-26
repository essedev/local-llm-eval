import React, { useState, useEffect } from 'react';
import type { Book, BookStatus, BookCreate } from './types';

const API_URL = 'http://localhost:8000';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('to-read');
  const [filterStatus, setFilterStatus] = useState<BookStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all books
  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/books`);
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      const data = await response.json();
      setBooks(data);
    } catch (err: any) {
      setError(err.message || 'Qualcosa è andato storto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Handle adding a new book
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    setError(null);
    const newBook: BookCreate = {
      title: title.trim(),
      author: author.trim(),
      status
    };

    try {
      const response = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBook),
      });

      if (!response.ok) {
        throw new Error('Impossibile aggiungere il libro');
      }

      const createdBook = await response.json();
      setBooks((prev) => [...prev, createdBook]);
      setTitle('');
      setAuthor('');
      setStatus('to-read');
    } catch (err: any) {
      setError(err.message || 'Errore durante la creazione del libro');
    }
  };

  // Handle changing status
  const handleStatusChange = async (id: number, newStatus: BookStatus) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Impossibile aggiornare lo stato del libro');
      }

      const updatedBook = await response.json();
      setBooks((prev) =>
        prev.map((book) => (book.id === id ? updatedBook : book))
      );
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'aggiornamento dello stato');
    }
  };

  // Handle deleting a book
  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo libro?')) return;
    
    setError(null);
    try {
      const response = await fetch(`${API_URL}/books/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Impossibile eliminare il libro');
      }

      setBooks((prev) => prev.filter((book) => book.id !== id));
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'eliminazione del libro');
    }
  };

  const filteredBooks = books.filter((book) => {
    if (filterStatus === 'all') return true;
    return book.status === filterStatus;
  });

  return (
    <div className="container">
      <header>
        <h1>📚 Il mio Book Tracker</h1>
        <p className="subtitle">Gestisci e traccia i libri che leggi in locale</p>
      </header>

      <main className="content">
        <section className="form-section">
          <h2>Aggiungi un nuovo libro</h2>
          <form onSubmit={handleSubmit} className="book-form">
            <div className="form-group">
              <label htmlFor="title">Titolo</label>
              <input
                id="title"
                type="text"
                placeholder="E.g. Il signore degli anelli"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Autore</label>
              <input
                id="author"
                type="text"
                placeholder="E.g. J.R.R. Tolkien"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Stato di lettura</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BookStatus)}
              >
                <option value="to-read">Da leggere (To Read)</option>
                <option value="reading">In lettura (Reading)</option>
                <option value="done">Completato (Done)</option>
              </select>
            </div>

            <button type="submit" className="btn-primary">Aggiungi Libro</button>
          </form>
        </section>

        <section className="list-section">
          <div className="list-header">
            <h2>I Miei Libri ({filteredBooks.length})</h2>
            <div className="filter-controls">
              <label htmlFor="filter">Filtra per stato: </label>
              <select
                id="filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as BookStatus | 'all')}
              >
                <option value="all">Tutti</option>
                <option value="to-read">Da leggere</option>
                <option value="reading">In lettura</option>
                <option value="done">Completati</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <p className="loading">Caricamento libri...</p>
          ) : filteredBooks.length === 0 ? (
            <p className="empty-message">Nessun libro trovato. Inizia ad aggiungerne uno!</p>
          ) : (
            <div className="books-grid">
              {filteredBooks.map((book) => (
                <div key={book.id} className={`book-card card-status-${book.status}`}>
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">di {book.author}</p>
                  </div>
                  <div className="book-actions">
                    <div className="status-selector">
                      <label htmlFor={`status-${book.id}`}>Stato:</label>
                      <select
                        id={`status-${book.id}`}
                        value={book.status}
                        onChange={(e) => handleStatusChange(book.id, e.target.value as BookStatus)}
                      >
                        <option value="to-read">Da leggere</option>
                        <option value="reading">In lettura</option>
                        <option value="done">Completato</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="btn-danger"
                      title="Elimina"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
