import { useState } from 'react';
import { createBook } from '../api';

export default function BookForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('to_read');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const book = await createBook({ title, author, status });
      setTitle('');
      setAuthor('');
      setStatus('to_read');
      if (onCreated) onCreated(book);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Titolo</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="author">Autore</label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="status">Stato</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="to_read">Da leggere</option>
          <option value="reading">In lettura</option>
          <option value="read">Letto</option>
        </select>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Aggiungi libro</button>
    </form>
  );
}
