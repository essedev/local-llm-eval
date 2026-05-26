import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('to-read');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = () => {
    axios.get('http://localhost:8000/books')
      .then(res => setBooks(res.data))
      .catch(err => console.error(err));
  };

  const addBook = (e) => {
    e.preventDefault();
    axios.post('http://localhost:8000/books', { title, author, status })
      .then(res => {
        setBooks([...books, res.data]);
        setTitle('');
        setAuthor('');
        setStatus('to-read');
      })
      .catch(err => console.error(err));
  };

  const updateBook = (id, newStatus) => {
    axios.put(`http://localhost:8000/books/${id}`, { title: books.find(b => b.id === id).title, author: books.find(b => b.id === id).author, status: newStatus })
      .then(res => {
        setBooks(books.map(b => b.id === id ? res.data : b));
      })
      .catch(err => console.error(err));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Book Tracker</h1>
      <form onSubmit={addBook} style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="to-read">To Read</option>
          <option value="reading">Reading</option>
          <option value="done">Done</option>
        </select>
        <button type="submit">Add Book</button>
      </form>
      <div>
        {books.map(book => (
          <div key={book.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
            <h3>{book.title} by {book.author}</h3>
            <div>
              <button
                onClick={() => updateBook(book.id, 'to-read')}
                style={{ margin: '2px' }}
              >
                To Read
              </button>
              <button
                onClick={() => updateBook(book.id, 'reading')}
                style={{ margin: '2px' }}
              >
                Reading
              </button>
              <button
                onClick={() => updateBook(book.id, 'done')}
                style={{ margin: '2px' }}
              >
                Done
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;