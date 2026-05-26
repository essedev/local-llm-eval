import { useEffect, useState } from 'react';
import { listBooks } from '../api';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBooks()
      .then(setBooks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Caricamento libri...</p>;
  if (error) return <p>Errore: {error}</p>;
  if (books.length === 0) return <p>Nessun libro presente.</p>;

  return (
    <ul>
      {books.map((book) => (
        <li key={book.id}>
          <strong>{book.title}</strong> — {book.author}{' '}
          <em>({book.status})</em>
        </li>
      ))}
    </ul>
  );
}
