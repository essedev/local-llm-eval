import { useEffect, useState } from 'react';
import { listBooks } from '../../api';

export default function BookList() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    listBooks().then(setBooks);
  }, []);

  return (
    <div>
      <h2>I miei libri</h2>
      <ul>
        {books.map(book => (
          <li key={book.id}>
            {book.title} by {book.author} - {book.status}
          </li>
        ))}
      </ul>
    </div>
  );
}