import { useState } from "react";
import { createBook } from "../api";

export default function BookForm({ onBookCreated }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [status, setStatus] = useState("to-read");
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await createBook({ title, author, status });
      setTitle("");
      setAuthor("");
      setStatus("to-read");
      onBookCreated();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="book-form" onSubmit={handleSubmit}>
      {error && <p className="error">{error}</p>}
      <label>
        Title:
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label>
        Author:
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
      </label>
      <label>
        Status:
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="to-read">To Read</option>
          <option value="reading">Reading</option>
          <option value="completed">Completed</option>
        </select>
      </label>
      <button type="submit">Add Book</button>
    </form>
  );
}
