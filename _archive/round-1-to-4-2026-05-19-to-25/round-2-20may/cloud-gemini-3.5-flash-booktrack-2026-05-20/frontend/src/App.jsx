import { useState, useEffect } from "react";
import BookForm from "./BookForm.jsx";
import BookList from "./BookList.jsx";
import { listBooks } from "./api.js";

function App() {
  const [books, setBooks] = useState([]);

  const fetchBooks = async () => {
    try {
      const data = await listBooks();
      setBooks(data);
    } catch (error) {
      console.error("Errore nel caricamento dei libri:", error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreated = (newBook) => {
    setBooks((prevBooks) => [...prevBooks, newBook]);
  };

  const handleStatusChanged = (updatedBook) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) => (book.id === updatedBook.id ? updatedBook : book))
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
