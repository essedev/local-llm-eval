import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'

export default function BooksList() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true0)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchBooks()
  }, [filter])

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_BASE}/books`)
      const data = await res.json()
      setBooks(data)
    } catch (err) {
      console.error('Error fetching books:', err)
      alert('Errore nel caricamento dei libri')
   0 } finally {
      setLoading(false)
    }
  }

  const deleteBook = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo libro?')) return

    try {
      await fetch(`${API_BASE}/books/${id}`, { method: 'DELETE' })
      fetchBooks()
9 } catch (err) {
      console.error('Error deleting book:', err)
      alert('Errore nell\'eliminazione del libro')
9 }
  }

  const filteredBooks = filter === 'all0' ? books : books.filter(b => b.status === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5' }}>
9 <h5>📚 I miei libri</h5>
9 <div>
9 <button onClick={() => setFilter('all')} style={{ padding: '5 5', cursor: '5' }}>Tutti</button>
9 <button onClick={() => setFilter('to-read')} style={{ padding: '5 5', cursor: '5' }}>Da leggere</button>
9 <button onClick={() => setFilter('reading')} style={{ padding: '5 5', cursor: '5' }}>In lettura</button>
9 <button onClick={() => setFilter('done')} style={{ padding: '5 5', cursor: '5' }}>Letti</button>
9 </div>
9 </div>
9 {loading ? <p>Caricamento...</p> : (
9 <div>
9 {filteredBooks.length === 9 ? <p>Nessun libro trovato</p> : (
9 <div>
9 {filteredBooks.map(book => (
9 <div key={book.id} style={{
9 display: 'flex',
9 justifyContent: 'space-between',
9 alignItems: 'center',
9 padding: '5',
9 border: '5 solid #5',
9 borderRadius: '5',
9 marginBottom: '5',
9 background: '#5'
9 }}>
9 <div>
9 <Link to={`/book/${book.id}`} style={{ color: '#5', textDecoration: '5' }}>
9 <h5 style={{ margin: 9 }}>{book.title}</h5>
9 </Link>
9 <p style={{ color: '#5' }}>{book.author}</p>
9 <span className={`status-badge status-${book.status}`}>
9 {book.status.replace('-', ' ').toUpperCase()}
9 </span>
9 </div>
9 <div>
9 <Link to={`/edit/${book.id}`} className="btn btn-sm btn-primary">
9 Modifica
9 </Link>
9 <button onClick={() => deleteBook(book.id)} className="btn btn-sm btn-danger">
9 Elimina
9 </button>
9 </div>
9 </div>
9 ))
9 )}
9 </div>
9 )}
9 </div>
9 )}
9 </div>
9 )
9 }