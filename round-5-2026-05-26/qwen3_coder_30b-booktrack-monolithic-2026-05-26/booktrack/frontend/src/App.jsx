import React, { useState, useEffect } from 'react'

const App = () => {
  const [books, setBooks] = useState([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('to-read')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carica i libri dal backend
  const loadBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/books')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setBooks(data)
      setError(null)
    } catch (err) {
      setError('Errore nel caricamento dei libri')
      console.error('Errore nel caricamento dei libri:', err)
    } finally {
      setLoading(false)
    }
  }

  // Aggiunge un nuovo libro
  const addBook = async (e) => {
    e.preventDefault()
    
    if (!title.trim() || !author.trim()) {
      setError('Titolo e autore sono obbligatori')
      return
    }

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const newBook = await response.json()
      setBooks([...books, newBook])
      setTitle('')
      setAuthor('')
      setError(null)
    } catch (err) {
      setError('Errore nell\'aggiunta del libro')
      console.error('Errore nell\'aggiunta del libro:', err)
    }
  }

  // Aggiorna lo status di un libro
  const updateBookStatus = async (bookId, newStatus) => {
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: books.find(b => b.id === bookId).title,
          author: books.find(b => b.id === bookId).author,
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const updatedBook = await response.json()
      setBooks(books.map(book => 
        book.id === bookId ? updatedBook : book
      ))
      setError(null)
    } catch (err) {
      setError('Errore nell\'aggiornamento dello status del libro')
      console.error('Errore nell\'aggiornamento dello status del libro:', err)
    }
  }

  // Elimina un libro
  const deleteBook = async (bookId) => {
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setBooks(books.filter(book => book.id !== bookId))
      setError(null)
    } catch (err) {
      setError('Errore nell\'eliminazione del libro')
      console.error('Errore nell\'eliminazione del libro:', err)
    }
  }

  // Carica i libri all'avvio
  useEffect(() => {
    loadBooks()
  }, [])

  if (loading) {
    return (
      <div className="loading">
        <p>Caricamento in corso...</p>
      </div>
    )
  }

  return (
    <div>
      {error && (
        <div className="error">
          <p>{error}</p>
        </div>
      )}
      
      <form className="form" onSubmit={addBook}>
        <input
          type="text"
          placeholder="Titolo del libro"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Autore"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="to-read">Da leggere</option>
          <option value="reading">In lettura</option>
          <option value="done">Letto</option>
        </select>
        <button type="submit">Aggiungi libro</button>
      </form>

      <div className="books-list">
        {books.length === 0 ? (
          <p>Nessun libro aggiunto ancora.</p>
        ) : (
          books.map((book) => (
            <div key={book.id} className="book-item">
              <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">di {book.author}</div>
                <div className={`book-status status-${book.status}`}>
                  {book.status === 'to-read' ? 'Da leggere' : 
                   book.status === 'reading' ? 'In lettura' : 'Letto'}
                </div>
              </div>
              <div className="book-actions">
                <select
                  value={book.status}
                  onChange={(e) => updateBookStatus(book.id, e.target.value)}
                >
                  <option value="to-read">Da leggere</option>
                  <option value="reading">In lettura</option>
                  <option value="done">Letto</option>
                </select>
                <button className="delete-btn" onClick={() => deleteBook(book.id)}>
                  Elimina
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App