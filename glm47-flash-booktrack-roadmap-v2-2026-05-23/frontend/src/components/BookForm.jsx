import { useState } from 'react';
import { createBook } from '../api';

export default function BookForm() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('reading');

  const handleSubmit = (e) => {
    e.preventDefault();
    createBook({ title, author, status })
      .then(() => {
        setTitle('');
        setAuthor('');
        setStatus('reading');
        
      })
      .catch(err => alert('Errore nella creazione del libro'));
  };

  return (
    <div>
      <h2>Aggiungi un libro</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Titolo:
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Autore:
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Stato:
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="reading">In lettura</option>
              <option value="completed">Completato</option>
              <option value="to-read">Da leggere</option>
            </select>
          </label>
        </div>
        <button type="submit">Aggiungi</button>
      </form>
    </div>
  );
}