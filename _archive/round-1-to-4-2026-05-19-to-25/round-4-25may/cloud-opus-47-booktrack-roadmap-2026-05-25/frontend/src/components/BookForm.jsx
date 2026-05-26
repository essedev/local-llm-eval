import { useState } from 'react'
import { createBook } from '../api'

export default function BookForm() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('to_read')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createBook({ title, author, status })
      setTitle('')
      setAuthor('')
      setStatus('to_read')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Titolo:{' '}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Autore:{' '}
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </label>
      </div>
      <div>
        <label>
          Stato:{' '}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="to_read">Da leggere</option>
            <option value="reading">In lettura</option>
            <option value="read">Letto</option>
          </select>
        </label>
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Salvataggio...' : 'Aggiungi libro'}
      </button>
      {error && <p>Errore: {error}</p>}
    </form>
  )
}
