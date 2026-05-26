import { createBook } from './api.js';

function BookForm({ onBookCreated }) {
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !author || !status) {
      setError('Tutti i campi sono obbligatori');
      return;
    }

    try {
      const book = { title, author, status };
      const createdBook = await createBook(book);
      onBookCreated(createdBook);
      setTitle('');
      setAuthor('');
      setStatus('');
    } catch (err) {
      setError(err.message || 'Errore durante la creazione del libro');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Aggiungi un nuovo libro</h2>
      
      {error && (
        <div className="error" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="title">Titolo:</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Inserisci il titolo del libro"
          required
          style={{
            padding: '8px',
            width: '200px',
            marginLeft: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="author">Autore:</label>
        <input
          id="author"
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Inserisci l'autore"
          required
          style={{
            padding: '8px',
            width: '200px',
            marginLeft: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="status">Status:</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          required
          style={{
            padding: '8px',
            width: '200px',
            marginLeft: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        >
          <option value="">Seleziona uno status</option>
          <option value="reading">In lettura</option>
          <option value="read">Lettura completata</option>
          <option value="to-read">Da leggere</option>
        </select>
      </div>

      <button
        type="submit"
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Aggiungi Libro
      </button>
    </form>
  );
}

export default BookForm;