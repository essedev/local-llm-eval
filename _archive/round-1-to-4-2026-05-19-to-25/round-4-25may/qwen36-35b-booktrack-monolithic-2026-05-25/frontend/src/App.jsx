import { useState, useEffect, useCallback } from 'react'

const API = '/api'

const STATUS_LABELS = {
  'to-read': '📚 Da leggere',
  'reading': '📖 In lettura',
  'done': '✅ Letto',
}

const STATUS_ORDER = ['to-read', 'reading', 'done']

function BookForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('to-read')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !author.trim()) {
      setError('Titolo e autore sono obbligatori')
      return
    }
    setError('')
    try {
      const res = await fetch(`${API}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), author: author.trim(), status }),
      })
      if (!res.ok) throw new Error('Errore')
      setTitle('')
      setAuthor('')
      setStatus('to-read')
      onAdd()
    } catch {
      setError('Errore nell\'aggiunta del libro')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <h2>Aggiungi un libro</h2>
      {error && <p className="error">{error}</p>}
      <div className="form-row">
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
          <option value="to-read">Da leggere</option>
          <option value="reading">In lettura</option>
          <option value="done">Letto</option>
        </select>
        <button type="submit">Aggiungi</button>
      </div>
    </form>
  )
}

function BookCard({ book, onStatusChange, onDelete }) {
  return (
    <div className="book-card">
      <div className="book-info">
        <h3>{book.title}</h3>
        <p className="book-author">di {book.author}</p>
      </div>
      <div className="book-actions">
        <select
          value={book.status}
          onChange={(e) => onStatusChange(book.id, e.target.value)}
          className="status-select"
        >
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button className="delete-btn" onClick={() => onDelete(book.id)}>🗑️</button>
      </div>
    </div>
  )
}

function BookList({ books, onStatusChange, onDelete }) {
  if (books.length === 0) {
    return <p className="empty">Nessun libro aggiunto. Inizia aggiungendone uno sopra!</p>
  }

  const grouped = {}
  STATUS_ORDER.forEach((s) => { grouped[s] = [] })
  books.forEach((b) => {
    if (grouped[b.status]) grouped[b.status].push(b)
  })

  return (
    <div className="book-list">
      {STATUS_ORDER.map((status) => {
        const list = grouped[status]
        if (list.length === 0) return null
        return (
          <div key={status} className="status-group">
            <h2>{STATUS_LABELS[status]} ({list.length})</h2>
            {list.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function App() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/books`)
      const data = await res.json()
      setBooks(data)
    } catch (e) {
      console.error('Errore nel caricamento:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API}/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      fetchBooks()
    } catch {
      alert('Errore nell\'aggiornamento')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo libro?')) return
    try {
      const res = await fetch(`${API}/books/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      fetchBooks()
    } catch {
      alert('Errore nell\'eliminazione')
    }
  }

  if (loading) return <div className="app"><p>Caricamento...</p></div>

  return (
    <div className="app">
      <header>
        <h1>📚 BookTrack</h1>
        <p>Il tuo tracker libri personale</p>
      </header>
      <BookForm onAdd={fetchBooks} />
      <BookList
        books={books}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </div>
  )
}
