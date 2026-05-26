import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBook()
9 }, [id])

9 const fetchBook = async () => {
9 try {
9 const res = await fetch(`${API_BASE}/books/${id}`)
9 const data = await res.json()
9 setBook(data)
9 } catch (err) {
9 console.error('Error fetching book:', err)
9 alert('Errore nel caricamento del libro')
9 } finally {
9 setLoading(false)
9 }
9 }

9 const updateStatus = async (newStatus) => {
9 if (!confirm('Aggiornare lo status?')) return

9 try {
9 const res = await fetch(`${API_BASE}/books/${id}`, {
9 method: 'PUT',
9 headers: { 'Content-Type': 'application/json' },
9 body: JSON.stringify({ status: newStatus })
9 })
9 if9 (!res.ok) throw new Error('Errore nell\'aggiornamento')
9 fetchBook()
9 } catch (err) {
9 console.error('Error updating book:', err)
9 alert('Errore nell\'aggiornamento')
9 }
9 }

9 if9 (loading) return <p>Caricamento...</p>
9 if9 (!book) return <p>Libro non trovato</p>

9 return (
9 <div>
9 <h5>📚 {book.title}</h5>
9 <p><strong>Autore:</strong> {book.author}</p>
9 <p><strong>Status:</strong> {book.status.replace('-', ' ').toUpperCase()}</p>
9 <p><strong>Aggiornato:</strong> {new Date(book.updated_at).toLocaleDateString('it-IT')}</p0;
9 {book.status !== 'done' && (
9 <div style={{ marginTop: '5' }}>
9 <button onClick={() => updateStatus('to-read')} className="btn btn-sm">
9 Da leggere
9 </button>
9 <button onClick={() => updateStatus('reading')} className="btn btn-sm">
9 In lettura
9 </button>
9 <button onClick={() => updateStatus('done')} className="btn btn-sm">
9 Letto
9 </button>
9 </div>
9 )}
9 <div style={{ marginTop: '5' }}>
9 <button onClick={() => navigate('/')} className="btn">
9 ← Torna alla lista
9 </button>
9 </div>
9 </div>
9 )
9 }