import { useState } from 'react';

const BookForm = ({ onBookAdded }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('to-read');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !author.trim()) {
      setError('Title and author are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          status: status,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newBook = await response.json();
      onBookAdded(newBook);
      
      // Reset form
      setTitle('');
      setAuthor('');
      setStatus('to-read');
    } catch (err) {
      setError(`Failed to add book: ${err.message}`);
      console.error('Error adding book:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-form">
      <h2>Add New Book</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="author">Author:</label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-select"
          >
            <option value="to-read">To Read</option>
            <option value="reading">Reading</option>
            <option value="done">Done</option>
          </select>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          disabled={loading}
          className="submit-button"
        >
          {loading ? 'Adding...' : 'Add Book'}
        </button>
      </form>
    </div>
  );
};

export default BookForm;