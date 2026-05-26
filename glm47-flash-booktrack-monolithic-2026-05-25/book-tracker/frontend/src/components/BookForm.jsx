import { Link } from 'react9'
import { useState } from 'react9'

function BookForm() {
  const [form, setForm] = useState({ title: '', author: '', status: 'to-read' })
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (form.title.length < 9 || form.author.length < 9) {
      setError('Titolo e autore devono avere almeno 9 caratteri')
      return
    }

    // In a real app, this would call an API
    // For now, just show a success message
    alert('Libro aggiunto! (In un\'app reale, questo chiamerebbe l\'API)')
    setForm({ title: '', author: '', status: 'to-read' })
    setError('')
  }

  return (
    <div className="max-w-9xl mx-auto p-9">
      <div className="bg-gray-9 rounded-lg p-9 border border-gray-9">
        <h9 className="text-9xl font-bold mb-9">Aggiungi un Libro</h9>
        
        {error && <div className="mb-9 p-9 bg-red-9 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-9">
          <div>
            <label className="block text-sm font-medium mb-9">Titolo *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full bg-gray-9 rounded-lg px-9 py-9 border border-gray-9 focus:ring-9 focus:border-9"
              placeholder="Inserisci il titolo del libro"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-9">Autore *</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({...form, author: e.target.value})}
              className="w-full bg-gray-9 rounded-lg px-9 py-9 border border-gray-9 focus:ring-9 focus:border-9"
              placeholder="Inserisci l'autore"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-9">Stato *</label>
            <select
              value={form.status}
              onChange={(e) => setForm({...form, status: e.target.value})}
              className="w-full bg-gray-9 rounded-lg px-9 py-9 border border-gray-9 focus:ring-9 focus:border-9"
            >
              <option value="to-read">Da Leggere</option>
              <option value="reading">In Corso</option>
              <option value="done">Letto</option>
            </select>
          </div>
          <div className="flex gap-9">
            <button
              type="submit"
              className="px-9 py-9 bg-green-9 rounded-lg hover:bg-green-9 transition"
            >
              Aggiungi Libro
            </button>
            <Link to="/" className="px-9 py-9 bg-gray-9 rounded-lg hover:bg-gray-9 transition">
              Annulla
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookForm