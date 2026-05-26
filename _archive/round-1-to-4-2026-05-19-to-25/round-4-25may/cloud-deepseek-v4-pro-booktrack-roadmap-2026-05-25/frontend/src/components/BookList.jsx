import { useEffect, useState } from "react";
import { listBooks } from "../api";

export default function BookList({ refreshKey }) {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listBooks()
      .then((data) => {
        if (!cancelled) setBooks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (error) return <p className="error">Error: {error}</p>;

  if (books.length === 0) return <p>No books yet. Add one!</p>;

  return (
    <ul className="book-list">
      {books.map((book) => (
        <li key={book.id} className="book-item">
          <strong>{book.title}</strong> — {book.author}
          <span className={`status status-${book.status}`}>{book.status}</span>
        </li>
      ))}
    </ul>
  );
}
