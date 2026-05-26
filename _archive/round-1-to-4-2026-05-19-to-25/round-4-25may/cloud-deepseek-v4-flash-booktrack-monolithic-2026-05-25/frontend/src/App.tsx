import { useState, useEffect, FormEvent } from 'react';
import { Book } from './types';
import { fetchBooks, createBook, updateStatus } from './api';
import './App.css';

const STATUS_LABELS: Record<string, string> = {
  'to-read': '📦 To Read',
  'reading': '📖 Reading',
  'done': '✅ Done',
};

const STATUS_ORDER: Array<Book['status']> = ['to-read', 'reading', 'done'];

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooks().then(setBooks).catch(() => setError('Failed to load books'));
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    try {
      const book = await createBook(title.trim(), author.trim());
      setBooks((prev) => [...prev, book]);
      setTitle('');
      setAuthor('');
    } catch {
      setError('Failed to add book');
    }
  }

  async function handleStatus(book: Book, newStatus: Book['status']) {
    try {
      const updated = await updateStatus(book.id, newStatus);
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch {
      setError('Failed to update status');
    }
  }

  function nextStatus(current: Book['status']): Book['status'] {
    const idx = STATUS_ORDER.indexOf(current);
    return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
  }

  return (
    <div className="app">
      <h1>📚 BookTrack</h1>

      {error && <p className="error">{error}</p>}

      <form className="add-form" onSubmit={handleAdd}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <button type="submit">Add Book</button>
      </form>

      <div className="columns">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="column">
            <h2>{STATUS_LABELS[status]}</h2>
            {books
              .filter((b) => b.status === status)
              .map((book) => (
                <div key={book.id} className="card">
                  <strong>{book.title}</strong>
                  <span className="author">{book.author}</span>
                  <button onClick={() => handleStatus(book, nextStatus(book.status))}>
                    Move to {STATUS_LABELS[nextStatus(book.status)]}
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
