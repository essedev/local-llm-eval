import { useState } from 'react';
import { createBook } from '../api';

export default function BookForm() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('da leggere');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createBook({ title, author, status });
      setTitle('');
      setAuthor('');
      setStatus('da leggere');
    } catch (err) {
      console.error('Errore creazione libro:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Titolo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Autore"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        required
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="da leggere">Da leggere</option>
        <option value="in lettura">In lettura</option>
        <option value="letto">Letto</option>
      </select>
      <button type="submit">Aggiungi libro</button>
    </form>
  );
}
