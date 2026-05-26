import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [books, setBooks] = useState([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('to-read')
  const [loading, setLoading] = useState(true)

  // Fetch books from backend
  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books')
      const data = await response.json()
      setBooks(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching books:', error)
      setLoading(false)
    }
  }

  // Add a new book
  const addBook = async (e) => {
    e.preventDefault()
    if (!title.trim() || !author.trim()) return

    try {
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          status: status
        })
      })

      const newBook = await response.json()
      setBooks([...books, newBook])
      setTitle('')
      setAuthor('')
      setStatus('to-read')
    } catch (error) {
      console.error('Error adding book:', error)
    }
  }

  // Update book status
  const updateBookStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      const updatedBook = await response.json()
      setBooks(books.map(book => 
        book.id === id ? updatedBook : book
      ))
    } catch (error) {
      console.error('Error updating book:', error)
    }
  }

  // Delete a book
  const deleteBook = async (id) => {
    try {
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBooks(books.filter(book => book.id !== id))
      }
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  if (loading) {
    return <div className="app">Loading...</div>
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Book Tracker</h1>
        
        <div className="add-book-form">
          <h2>Add New Book</h2>
          <form onSubmit={addBook}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="form-input"
              >
                <option value="to-read">To Read</option>
                <option value="reading">Reading</option>
                <option value="done">Done</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Add Book</button>
          </form>
        </div>

        <div className="books-list">
          <h2>My Books</h2>
          {books.length === 0 ? (
            <p>No books added yet.</p>
          ) : (
            <div className="books-grid">
              {books.map((book) => (
                <div key={book.id} className="book-card">
                  <div className="book-info">
                    <h3>{book.title}</h3>
                    <p className="author">by {book.author}</p>
                    <div className="status">
                      <span className={`status-badge ${book.status}`}>
                        {book.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="book-actions">
                    <select
                      value={book.status}
                      onChange={(e) => updateBookStatus(book.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="to-read">To Read</option>
                      <option value="reading">Reading</option>
                      <option value="done">Done</option>
                    </select>
                    <button
                      onClick={() => deleteBook(book.id)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App