import React from 'react';
import { updateBookStatus } from './api.js';

function BookList({ books, onStatusChanged }) {
  const handleStatusChange = async (id, newStatus) => {
    try {
      const updatedBook = await updateBookStatus(id, newStatus);
      if (onStatusChanged) {
        onStatusChanged(updatedBook);
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dello stato del libro:', error);
    }
  };

  return (
    <div className="book-list">
      {books.length === 0 ? (
        <p>Non ci sono libri nella tua lista.</p>
      ) : (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              <span>{book.title} - {book.author} </span>
              <select
                value={book.status}
                onChange={(e) => handleStatusChange(book.id, e.target.value)}
              >
                <option value="to-read">to-read</option>
                <option value="reading">reading</option>
                <option value="done">done</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BookList;
