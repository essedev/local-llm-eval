import { useState } from "react";
import { createBook } from "./api.js";

function BookForm({ onBookCreated }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("to-read");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createBook({ title, author, status });
    setTitle("");
    setAuthor("");
    setStatus("to-read");
    onBookCreated();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Titolo"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Autore"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        required
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="to-read">To Read</option>
        <option value="reading">Reading</option>
        <option value="done">Done</option>
      </select>
      <button type="submit">Aggiungi</button>
    </form>
  );
}

export default BookForm;
