import { useState, useEffect } from "react";
import { listBooks } from "./api.js";
import BookForm from "./BookForm";
import BookList from "./BookList";
import "./App.css";

function App() {
  const [books, setBooks] = useState([]);

  const fetchBooks = async () => {
    const data = await listBooks();
    setBooks(data);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreated = async () => {
    await fetchBooks();
  };

  const handleStatusChanged = async () => {
    await fetchBooks();
  };

  return (
    <div className="app">
      <h1>BookTrack</h1>
      <BookForm onBookCreated={handleCreated} />
      <BookList books={books} onStatusChanged={handleStatusChanged} />
    </div>
  );
}

export default App;
