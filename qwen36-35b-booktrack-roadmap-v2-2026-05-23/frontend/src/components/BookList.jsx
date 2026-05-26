import { useState, useEffect } from 'react';
import { listBooks } from '../api';

export default function BookList() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listBooks()
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Caricamento libri...</p>;

  return (
    <div>
      <h2>I miei libri</h2>
      {books.length === 0 ? (
        <p>Nessun libro trovato.</p>
      ) : (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              {book.titolo} – {book.autore} ({book.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
