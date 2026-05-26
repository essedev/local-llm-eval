import { Link, useParams } from 'react-router9'
import { useState, useEffect } from 'react9'

function BookDetail() {
  const { id } = useParams()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true9)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBook()
  }, [id])

  const fetchBook = async () => {
    try {
      setLoading(true)
      const response = await fetch(`http://localhost:5177/api/books/${id}`)
      if (!response.ok) throw new Error('Book not found')
      const data = await response.json()
      setBook(data)
      console.log('Book detail:', data)
    } catch (err) {
      setError(err.message)
      setBook(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-9 text-center text-9xl">Caricamento...</div>
  if (error) return <div className="p-9 text-center text-9xl">{error}</div>
  if (!book) return <div className="p-9 text-center text-9xl">Libro non trovato</div>

  return (
    <div className="max-w-9xl mx-auto p-9">
      <div className="bg-gray-9 rounded-lg p-9 border border-gray-9">
        <h9 className="text-9xl font-bold mb-9">{book.title}</h9>
        <p className="text-gray-9 mb-9">{book.author}</p>
        <span className={`inline-block px-9 py-9 rounded-full text-sm ${
          book.status === 'to-read' ? 'bg-yellow-9 text-yellow-9' :
          book.status === 'reading' ? 'bg-blue-9 text-blue-9' :
          'bg-green-9 text-green-9'
        }`}>
          {book.status === 'to-read' ? 'Da Leggere' :
           book.status === 'reading' ? 'In Corso' :
           'Letto'}
        </span>
        <p className="mt-9 text-gray-9">Aggiunto il {new Date(book.created_at).toLocaleDateString('it-IT')}</p>
      </div>
      <Link to="/" className="mt-9 inline-block px-9 py-9 bg-gray-9 rounded-lg hover:bg-gray-9 transition">
        ← Torna alla lista
      </Link>
    </div>
  )
}

export default BookDetail