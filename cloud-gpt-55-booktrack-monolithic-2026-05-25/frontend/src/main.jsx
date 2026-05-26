import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const statuses = [
  { value: 'to-read', label: 'Da leggere' },
  { value: 'reading', label: 'In lettura' },
  { value: 'done', label: 'Finito' },
]

function statusLabel(value) {
  return statuses.find((status) => status.value === value)?.label ?? value
}

function App() {
  const [books, setBooks] = useState([])
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('to-read')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filteredBooks = useMemo(() => {
    if (filter === 'all') return books
    return books.filter((book) => book.status === filter)
  }, [books, filter])

  async function loadBooks() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/books`)
      if (!response.ok) throw new Error('Errore nel caricamento dei libri')
      setBooks(await response.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
  }, [])

  async function addBook(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, status }),
      })
      if (!response.ok) throw new Error('Errore nel salvataggio del libro')
      const created = await response.json()
      setBooks((current) => [created, ...current])
      setTitle('')
      setAuthor('')
      setStatus('to-read')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(bookId, nextStatus) {
    setError('')
    const previousBooks = books
    setBooks((current) =>
      current.map((book) => (book.id === bookId ? { ...book, status: nextStatus } : book)),
    )
    try {
      const response = await fetch(`${API_URL}/books/${bookId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!response.ok) throw new Error('Errore durante il cambio status')
      const updated = await response.json()
      setBooks((current) => current.map((book) => (book.id === bookId ? updated : book)))
    } catch (err) {
      setBooks(previousBooks)
      setError(err.message)
    }
  }

  return (
    <main className="app">
      <header className="hero">
        <p className="eyebrow">Locale · senza login</p>
        <h1>BookTrack</h1>
        <p>Tieni traccia dei libri da leggere, in lettura e finiti.</p>
      </header>

      <section className="panel">
        <h2>Aggiungi libro</h2>
        <form onSubmit={addBook} className="form">
          <label>
            Titolo
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Autore
            <input value={author} onChange={(event) => setAuthor(event.target.value)} required />
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {statuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button disabled={saving}>{saving ? 'Salvataggio...' : 'Aggiungi'}</button>
        </form>
      </section>

      <section className="panel">
        <div className="listHeader">
          <h2>Lista libri</h2>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">Tutti</option>
            {statuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error">{error}</p>}
        {loading && <p className="muted">Caricamento...</p>}
        {!loading && filteredBooks.length === 0 && <p className="muted">Nessun libro da mostrare.</p>}

        <div className="books">
          {filteredBooks.map((book) => (
            <article className="book" key={book.id}>
              <div>
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <span className={`badge ${book.status}`}>{statusLabel(book.status)}</span>
              </div>
              <label className="statusControl">
                Cambia status
                <select value={book.status} onChange={(event) => changeStatus(book.id, event.target.value)}>
                  {statuses.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
