import { updateBookStatus } from './api';

const BookList = ({ books, onStatusChanged }) => {
  const handleStatusChange = async (bookId, newStatus) => {
    await updateBookStatus(bookId, newStatus);
    if (onStatusChanged) {
      onStatusChanged(bookId, newStatus);
    }
  };

  return (
    <ul>
      {books.map((book) => (
        <li key={book.id}>
          {book.title} —{' '}
          <select
            value={book.status}
            onChange={(e) => handleStatusChange(book.id, e.target.value)}
          >
            <option value="to-read">To Read</option>
            <option value="reading">Reading</option>
            <option value="done">Done</option>
          </select>
        </li>
      ))}
    </ul>
  );
};

export default BookList;
