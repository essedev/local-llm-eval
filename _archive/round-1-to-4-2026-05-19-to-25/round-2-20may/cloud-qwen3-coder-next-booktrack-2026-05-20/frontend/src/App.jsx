import { useState, useEffect } from "react";
import BookForm from "./BookForm";
import BookList from "./BookList";
import { listBooks } from "./api.js";

function App() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await listBooks();
        setBooks(data);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };
    fetchBooks();
  }, []);

  const handleBookCreated = async () => {
    const data = await listBooks();
    setBooks(data);
  };

  return (
    <div>
      <h1>BookTrack</h1>
      <BookForm onBookCreated={handleBookCreated} />
      <BookList books={books} />
    </div>
  );
}

export default App;
