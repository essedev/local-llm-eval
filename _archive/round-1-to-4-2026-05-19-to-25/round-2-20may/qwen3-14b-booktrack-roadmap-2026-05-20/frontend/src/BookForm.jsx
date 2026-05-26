import { useState } from 'react';
import { createBook } from './api.js';

function BookForm({ onBookCreated }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('to-read');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createBook({ title, author, status });
    setTitle('');
    setAuthor('');
    setStatus('to-read');
    onBookCreated(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Titolo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Autore"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="to-read">Da leggere</option>
        <option value="reading">In lettura</option>
        <option value="done">Completato</option>
      </select>
      <button type="submit">Aggiungi</button>
    </form>
  );
}

export default BookForm;