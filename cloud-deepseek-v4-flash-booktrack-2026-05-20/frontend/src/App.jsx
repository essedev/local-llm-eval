import { useState, useEffect } from 'react';
import BookForm from './BookForm';
import BookList from './BookList';
import { listBooks } from './api';

function App() {
  const [books, setBooks] = useState([]);

  const fetchBooks = async () => {
    try {
      const data = await listBooks();
      setBooks(data);
    } catch (err) {
      console.error('Failed to fetch books:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreated = () => {
    fetchBooks();
  };

  const handleStatusChanged = (updatedBook) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === updatedBook.id ? updatedBook : b))
    );
  };

  return (
    <div>
      <h1>BookTrack</h1>
      <BookForm onBookCreated={handleCreated} />
      <BookList books={books} onStatusChanged={handleStatusChanged} />
    </div>
  );
}

export default App;