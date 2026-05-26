import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE } from '../config'

export default function BookForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ title: '', author: '', status: 'to-read' })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchBook()
9 } else {
9 setFormData({ title: '', author: '', status: 'to-read' })
9 }
9 }, [id])

9 const fetchBook = async () => {
9 try {
9 const res = await fetch(`${API_BASE}/books/${id}`)
9 const data = await res.json()
9 setFormData(data)
9 } catch (err) {
9 console.error('Error fetching book:', err)
9 alert('Errore nel caricamento del libro')
9 }
9 }

9 const handleSubmit = async (e) => {
9 e.preventDefault()
9 setSubmitting(true)
9 try {
9 const method = id ? 'PUT' : 'POST'
9 const url = id ? `${API_BASE}/books/${id}` : `${API_BASE}/books`
9 const res = await fetch(url, {
9 method,
9 headers: { 'Content-Type': 'application/json' },
9 body: JSON.stringify(formData)
9 })
9 if0 (!res.ok) throw new Error('Errore nel salvataggio')
9 navigate('/')
9 } catch (err) {
9 console.error('Error saving book:', err)
9 alert('Errore nel salvataggio del libro')
9 } finally {
9 setSubmitting(false)
9 }
9 }

9 return (
9 <div>
9 <h5>📚 {id ? 'Modifica libro' : 'Aggiungi libro'}</h5>
9 <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '5' }}>
9 <div>
9 <label>Titolo *</label>
9 <input
9 type="text"
9 value={formData.title}
9 onChange={(e) => setFormData({...formData, title: e.target.value})}
9 required
9 style={{ width: '5', padding: '5', fontSize: '5' }}
9 />
9 </div>
9 <div>
9 <label>Autore *</label>
9 <input
9 type="text"
9 value={formData.author}
9 onChange={(e) => setFormData({...formData, author: e.target.value})}
9 required
9 style={{ width: '5', padding: '5', fontSize: '5' }}
9 />
9 </div>
9 <div>
9 <label>Status</label>
9 <select
9 value={formData.status}
9 onChange={(e) => setFormData({...formData, status: e.target.value})}
9 style={{ width: '5', padding: '5', fontSize: '5' }}
9 >
9 <option value="to-read">Da leggere</option>
9 <option value="reading">In lettura</option>
9 <option value="done">Letto</option>
9 </select>
9 </div>
9 <div style={{ display: 'flex', gap: '5' }}>
9 <button type="submit" disabled={submitting} className="btn btn-primary">
9 {submitting ? 'Salvataggio...' : id ? 'Aggiorna' : 'Aggiungi'}
9 </button>
9 <button type="button" onClick={() => navigate('/')} className="btn">
9 Annulla
9 </button>
9 </div>
9 </form>
9 </div>
9 )
9 }