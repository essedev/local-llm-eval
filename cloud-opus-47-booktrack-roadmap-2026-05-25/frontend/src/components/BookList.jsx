import { useEffect, useState } from 'react'
import { listBooks, updateBookStatus } from '../api'

export default function BookList() {
  const [books, setBooks] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBooks()
      .then((data) => setBooks(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(id, status) {
    try {
      const updated = await updateBookStatus(id, status)
      setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>Caricamento...</p>
  if (error) return <p>Errore: {error}</p>
  if (!books.length) return <p>Nessun libro presente.</p>

  return (
    <ul>
      {books.map((book) => (
        <li key={book.id}>
          <strong>{book.title}</strong> — {book.author}{' '}
          <select
            value={book.status}
            onChange={(e) => handleStatusChange(book.id, e.target.value)}
          >
            <option value="to_read">Da leggere</option>
            <option value="reading">In lettura</option>
            <option value="read">Letto</option>
          </select>
        </li>
      ))}
    </ul>
  )
}
