import { useState, useCallback } from "react";
import "./App.css";
import BookList from "./components/BookList";
import BookForm from "./components/BookForm";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleBookCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <div className="app">
      <h1>BookTrack — I miei libri</h1>
      <BookForm onBookCreated={handleBookCreated} />
      <BookList refreshKey={refreshKey} />
    </div>
  );
}

export default App
