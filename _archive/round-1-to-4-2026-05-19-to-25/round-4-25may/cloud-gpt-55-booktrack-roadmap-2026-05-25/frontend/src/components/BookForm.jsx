import { useState } from 'react'
import { createBook } from '../api'

function BookForm() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [status, setStatus] = useState('to-read')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    try {
      await createBook({ title, author, status })
      setTitle('')
      setAuthor('')
      setStatus('to-read')
      setMessage('Libro aggiunto con successo.')
    } catch (err) {
      setMessage(`Errore: ${err.message}`)
    }
  }

  return (
    <section>
      <h2>Aggiungi libro</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Titolo
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>

        <label>
          Autore
          <input
            type="text"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            required
          />
        </label>

        <label>
          Stato
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="to-read">Da leggere</option>
            <option value="reading">In lettura</option>
            <option value="done">Letto</option>
          </select>
        </label>

        <button type="submit">Salva</button>
      </form>
      {message && <p>{message}</p>}
    </section>
  )
}

export default BookForm
