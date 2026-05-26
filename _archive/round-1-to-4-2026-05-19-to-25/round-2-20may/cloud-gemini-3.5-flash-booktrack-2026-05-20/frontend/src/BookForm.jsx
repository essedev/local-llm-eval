import { useState } from "react";
import { createBook } from "./api.js";

function BookForm({ onBookCreated }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("to-read");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newBook = await createBook({ title, author, status });
      // Reset dei campi
      setTitle("");
      setAuthor("");
      setStatus("to-read");
      // Callback per notificare il parent component dell'avvenuta creazione
      if (onBookCreated) {
        onBookCreated(newBook);
      }
    } catch (error) {
      console.error("Errore durante la creazione del libro:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Titolo:</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="author">Autore:</label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="status">Stato:</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="to-read">Da leggere</option>
          <option value="reading">In lettura</option>
          <option value="done">Letto</option>
        </select>
      </div>
      <button type="submit">Aggiungi</button>
    </form>
  );
}

export default BookForm;
