import { updateBookStatus } from './api.js';

export default function BookList({ books, onStatusChanged }) {
  if (!books || books.length === 0) {
    return <p className="book-list-empty">No books found.</p>;
  }

  const handleStatusChange = async (bookId, newStatus) => {
    try {
      const updatedBook = await updateBookStatus(bookId, newStatus);
      if (onStatusChanged) {
        onStatusChanged(updatedBook);
      }
    } catch (err) {
      console.error('Failed to update book status:', err);
    }
  };

  return (
    <div className="book-list">
      {books.map((book) => (
        <div key={book.id} className="book-list-item">
          <div className="book-list-info">
            <h3 className="book-list-title">{book.title}</h3>
            {book.author && <p className="book-list-author">{book.author}</p>}
          </div>
          <select
            className="book-list-status"
            value={book.status}
            onChange={(e) => handleStatusChange(book.id, e.target.value)}
          >
            <option value="to-read">To Read</option>
            <option value="reading">Reading</option>
            <option value="done">Done</option>
          </select>
        </div>
      ))}
    </div>
  );
}