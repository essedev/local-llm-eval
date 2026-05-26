import { useEffect, useState } from 'react'
import { api } from './api'

const STATUSES = [
  { value: 'to-read', label: 'Da leggere' },
  { value: 'reading', label: 'In lettura' },
  { value: 'done', label: 'Letto' },
]

const STATUS_LABEL = Object.fromEntries(STATUSES.map(s => [s.value, s.label]))

export default function App() {
  const [books, setBooks] = useState([])
  const [filter, setFilter] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('to-read')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.list(filter || undefined)
      setBooks(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  async function handleAdd(e) {
    e.preventDefault()
    if (!title.trim() || !author.trim()) return
    try {
      await api.create({ title: title.trim(), author: author.trim(), status })
      setTitle(''); setAuthor(''); setStatus('to-read')
      load()
    } catch (e) { setError(e.message) }
  }

  async function handleStatus(book, newStatus) {
    try {
      await api.update(book.id, { status: newStatus })
      setBooks(bs => bs.map(b => b.id === book.id ? { ...b, status: newStatus } : b))
      if (filter && filter !== newStatus) {
        setBooks(bs => bs.filter(b => b.id !== book.id))
      }
    } catch (e) { setError(e.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo libro?')) return
    try {
      await api.remove(id)
      setBooks(bs => bs.filter(b => b.id !== id))
    } catch (e) { setError(e.message) }
  }

  const counts = books.reduce((acc, b) => { acc[b.status] = (acc[b.status]||0)+1; return acc }, {})

  return (
    <div className="container">
      <header>
        <h1>📚 BookTrack</h1>
        <p className="sub">La mia libreria personale</p>
      </header>

      <section className="card">
        <h2>Aggiungi libro</h2>
        <form onSubmit={handleAdd} className="form">
          <input
            placeholder="Titolo"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <input
            placeholder="Autore"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            required
          />
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="submit">Aggiungi</button>
        </form>
      </section>

      <section className="card">
        <div className="toolbar">
          <h2>Lista {filter ? `(${STATUS_LABEL[filter]})` : ''}</h2>
          <div className="filters">
            <button
              className={!filter ? 'chip active' : 'chip'}
              onClick={() => setFilter('')}
            >Tutti</button>
            {STATUSES.map(s => (
              <button
                key={s.value}
                className={filter === s.value ? 'chip active' : 'chip'}
                onClick={() => setFilter(s.value)}
              >{s.label}</button>
            ))}
          </div>
        </div>

        {error && <div className="error">⚠ {error}</div>}
        {loading && <div className="muted">Caricamento…</div>}
        {!loading && books.length === 0 && <div className="muted">Nessun libro.</div>}

        <ul className="books">
          {books.map(b => (
            <li key={b.id} className={`book status-${b.status}`}>
              <div className="book-info">
                <div className="book-title">{b.title}</div>
                <div className="book-author">{b.author}</div>
              </div>
              <div className="book-actions">
                <select
                  value={b.status}
                  onChange={e => handleStatus(b, e.target.value)}
                >
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button className="danger" onClick={() => handleDelete(b.id)}>×</button>
              </div>
            </li>
          ))}
        </ul>

        {!filter && books.length > 0 && (
          <div className="counts">
            {STATUSES.map(s => (
              <span key={s.value}>{s.label}: <b>{counts[s.value] || 0}</b></span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
