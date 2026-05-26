import { useState } from 'react';
import { createBook } from '../api';

export default function BookForm({ onBookCreated }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('to-read');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title || !author) {
      setError('Title and Author are required');
      return;
    }

    try {
      await createBook({ title, author, status });
      setTitle('');
      setAuthor('');
      setStatus('to-read');
      if (onBookCreated) {
        onBookCreated();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="book-form-container">
      <h2>Aggiungi un Libro</h2>
      {error && <div className="error-message" style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleSubmit} className="book-form">
        <div className="form-group">
          <label htmlFor="title">Titolo:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Il signore degli anelli"
          />
        </div>
        <div className="form-group">
          <label htmlFor="author">Autore:</label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="E.g., J.R.R. Tolkien"
          />
        </div>
        <div className="form-group">
          <label htmlFor="status">Stato:</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="to-read">Da leggere</option>
            <option value="reading">In lettura</option>
            <option value="done">Letto</option>
          </select>
        </div>
        <button type="submit">Aggiungi</button>
      </form>
    </div>
  );
}
