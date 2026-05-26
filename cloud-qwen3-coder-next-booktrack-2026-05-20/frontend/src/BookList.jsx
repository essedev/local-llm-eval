import React from 'react';
import { updateBookStatus } from './api.js';

function BookList({ books, onStatusChanged }) {
  const handleStatusChange = async (bookId, newStatus) => {
    try {
      await updateBookStatus(bookId, newStatus);
      if (onStatusChanged) {
        onStatusChanged(bookId, newStatus);
      }
    } catch (error) {
      console.error('Error updating book status:', error);
    }
  };

  return (
    <div className="book-list">
      {books.length === 0 ? (
        <p>No books available</p>
      ) : (
        <ul>
          {books.map((book) => (
            <li key={book.id} className="book-item">
              <span className="book-title">{book.title}</span>
              <select
                value={book.status}
                onChange={(e) => handleStatusChange(book.id, e.target.value)}
                className="status-select"
              >
                <option value="to-read">To Read</option>
                <option value="reading">Reading</option>
                <option value="read">Read</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BookList;
