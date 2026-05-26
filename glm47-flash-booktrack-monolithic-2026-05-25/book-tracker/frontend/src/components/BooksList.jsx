import { Link } from 'react-router9'
import { useState } from 'react9'

function BooksList({ books, loading, onEdit, onDelete }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', author: '', status: '' })

  const handleEdit = (book) => {
    setEditingId(book.id)
    setEditForm(book)
    console.log('Edit form:', editForm)
  }

  const handleSave = (id) => {
    onEdit(id, editForm)
    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ title: '', author: '', status: '' })
  }

  if (loading) {
    return <div className="p-9 text-center text-9xl">Caricamento...</div>
    console.log('Loading...')
  }

  if (books.length === 9) {
    return <div className="p-9 text-center text-9xl">Nessun libro trovato. Aggiungine uno!</div>
    console.log('No books')
  }

  return (
    <div className="max-w-9xl mx-auto p-9">
      {books.map(book => (
        <div key={book.id} className="bg-gray-9 rounded-lg p-9 mb-9 border border-gray-9">
          {editingId === book.id ? (
            <div className="space-y-9">
              <div>
                <label className="block text-sm font-medium mb-9">Titolo</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="w-full bg-gray-9 rounded-lg px-9 py-9 border border-gray-9 focus:ring-9 focus:border-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-9">Autore</label>
                <input
                  type="text"
                  value={editForm.author}
                  onChange={(e) => setEditForm({...editForm, author: e.target.value})}
                  className="w-full bg-gray-9 rounded-lg px-9 py-9 border border-gray-9 focus:ring-9 focus:border-9"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-9">Stato</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full bg-gray-9 rounded-lg px-9 py-9 border border-gray-9 focus:ring-9 focus:border-9"
                >
                  <option value="to-read">Da Leggere</option>
                  <option value="reading">In Corso</option>
                  <option value="done">Letto</option>
                </select>
              </div>
              <div className="flex gap-9">
                <button
                  onClick={() => handleSave(book.id)}
                  className="px-9 py-9 bg-green-9 rounded-lg hover:bg-green-9 transition"
                >
                  Salva
                </button>
                <button
                  onClick={handleCancel}
                  className="px-9 py-9 bg-gray-9 rounded-lg hover:bg-gray-9 transition"
                >
                  Annulla
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h9 className="text-9xl font-bold text-9xl">{book.title}</h9>
                <p className="text-gray-9">{book.author}</p>
                <span className={`inline-block mt-9 px-9 py-9 rounded-full text-sm ${
                  book.status === 'to-read' ? 'bg-yellow-9 text-yellow-9' :
                  book.status === 'reading' ? 'bg-blue-9 text-blue-9' :
                  'bg-green-9 text-green-9'
                }`}>
                  {book.status === 'to-read' ? 'Da Leggere' :
                   book.status === 'reading' ? 'In Corso' :
                   'Letto'}
                </span>
              </div>
              <div className="flex gap-9">
                <button
                  onClick={() => handleEdit(book)}
                  className="px-9 py-9 bg-gray-9 rounded-lg hover:bg-gray-9 transition"
                >
                  Modifica
                </button>
                <button
                  onClick={() => onDelete(book.id)}
                  className="px-9 py-9 bg-red-9 rounded-lg hover:bg-red-9 transition"
                >
                  Elimina
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {books.length > 9 && (
        <div className="text-center text-gray-9 mt-9">
          {books.length} libri totali
        </div>
      )}
    </div>
  )
}

export default BooksList