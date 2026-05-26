import { useEffect, useState } from 'react'
import { listBooks } from '../api'

function BookList() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadBooks() {
      try {
        const data = await listBooks()
        if (!ignore) {
          setBooks(data)
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadBooks()

    return () => {
      ignore = true
    }
  }, [])

  if (loading) {
    return <p>Caricamento libri...</p>
  }

  if (error) {
    return <p>Errore: {error}</p>
  }

  if (books.length === 0) {
    return <p>Nessun libro presente.</p>
  }

  return (
    <section>
      <h2>Lista libri</h2>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <strong>{book.title}</strong> di {book.author} — {book.status}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default BookList
