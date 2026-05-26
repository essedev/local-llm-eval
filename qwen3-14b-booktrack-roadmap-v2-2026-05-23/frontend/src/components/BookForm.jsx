import { useState } from 'react';
import { createBook } from '../../api';

export default function BookForm() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('available');

  function handleSubmit(e) {
    e.preventDefault();
    createBook({ title, author, status });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Aggiungi libro</h2>
      <input
        type="text"
        placeholder="Titolo"
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
        <option value="available">Disponibile</option>
        <option value="borrowed">In prestito</option>
        <option value="reserved">Prenotato</option>
      </select>
      <button type="submit">Aggiungi</button>
    </form>
  );
}