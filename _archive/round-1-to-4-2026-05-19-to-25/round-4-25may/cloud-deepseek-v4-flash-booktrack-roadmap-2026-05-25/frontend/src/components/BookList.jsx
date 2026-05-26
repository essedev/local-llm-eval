import { useState, useEffect } from 'react';
import { listBooks } from '../api';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listBooks()
      .then(setBooks)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Caricamento libri...</p>;
  if (error) return <p>Errore: {error.message}</p>;

  return (
    <ul>
      {books.length === 0 && <li>Nessun libro presente.</li>}
      {books.map((book) => (
        <li key={book.id}>
          <strong>{book.title}</strong> — {book.author} ({book.status})
        </li>
      ))}
    </ul>
  );
}
