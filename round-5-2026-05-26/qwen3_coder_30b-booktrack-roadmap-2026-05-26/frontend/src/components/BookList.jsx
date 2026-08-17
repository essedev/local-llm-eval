import { useState, useEffect } from 'react';

const BookList = ({ onBookUpdated, onBookDeleted }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/books');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setBooks(data);
      setError(null);
    } catch (err) {
      setError(`Failed to fetch books: ${err.message}`);
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedBook = await response.json();
      onBookUpdated(updatedBook);
      fetchBooks(); // Refresh the list
    } catch (err) {
      setError(`Failed to update book status: ${err.message}`);
      console.error('Error updating book:', err);
    }
  };

  const deleteBook = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/books/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      onBookDeleted(id);
      fetchBooks(); // Refresh the list
    } catch (err) {
      setError(`Failed to delete book: ${err.message}`);
      console.error('Error deleting book:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  if (loading) {
    return <div className="loading">Loading books...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="book-list">
      <h2>My Books</h2>
      {books.length === 0 ? (
        <p>No books in the list yet.</p>
      ) : (
        <ul className="books">
          {books.map((book) => (
            <li key={book.id} className="book-item">
              <div className="book-info">
                <h3>{book.title}</h3>
                <p>by {book.author}</p>
                <div className="book-status">
                  <span className="status-label">Status:</span>
                  <select
                    value={book.status}
                    onChange={(e) => updateBookStatus(book.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="to-read">To Read</option>
                    <option value="reading">Reading</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => deleteBook(book.id)}
                className="delete-button"
                aria-label={`Delete ${book.title}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookList;