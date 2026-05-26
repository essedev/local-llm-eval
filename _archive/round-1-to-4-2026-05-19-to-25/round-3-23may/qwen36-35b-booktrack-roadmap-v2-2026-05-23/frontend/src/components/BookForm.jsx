import { useState } from 'react';
import { createBook } from '../api';

export default function BookForm() {
  const [titolo, setTitolo] = useState('');
  const [autore, setAutore] = useState('');
  const [status, setStatus] = useState('da_leggere');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createBook({ titolo, autore, status });
    setTitolo('');
    setAutore('');
    setStatus('da_leggere');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Aggiungi un libro</h2>
      <div>
        <label htmlFor="titolo">Titolo</label>
        <input
          id="titolo"
          type="text"
          value={titolo}
          onChange={(e) => setTitolo(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="autore">Autore</label>
        <input
          id="autore"
          type="text"
          value={autore}
          onChange={(e) => setAutore(e.target.value)}
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
          <option value="da_leggere">Da leggere</option>
          <option value="in_lettura">In lettura</option>
          <option value="letto">Letto</option>
        </select>
      </div>
      <button type="submit">Aggiungi</button>
    </form>
  );
}
