import { useState, useEffect } from 'react';
import { listBooks, updateBookStatus } from '../api';

export default function BookList({ refreshTrigger, onStatusUpdate }) {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);

  const fetchBooks = async () => {
    try {
      const data = await listBooks();
      setBooks(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [refreshTrigger]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateBookStatus(id, newStatus);
      fetchBooks();
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="book-list-container">
      <h2>I Miei Libri</h2>
      {books.length === 0 ? (
        <p>Nessun libro trovato.</p>
      ) : (
        <ul className="book-list">
          {books.map((book) => (
            <li key={book.id} className="book-item">
              <div>
                <strong>{book.title}</strong> di {book.author}
              </div>
              <div className="book-status-control">
                <span>Stato: </span>
                <select
                  value={book.status || 'to-read'}
                  onChange={(e) => handleStatusChange(book.id, e.target.value)}
                >
                  <option value="to-read">Da leggere</option>
                  <option value="reading">In lettura</option>
                  <option value="done">Letto</option>
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
