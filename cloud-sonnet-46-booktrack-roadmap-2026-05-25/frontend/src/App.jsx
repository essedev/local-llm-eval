import { useState } from 'react';
import BookList from './components/BookList';
import BookForm from './components/BookForm';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  function handleBookCreated() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <main>
      <h1>BookTrack</h1>

      <section>
        <h2>Aggiungi un libro</h2>
        <BookForm onCreated={handleBookCreated} />
      </section>

      <section>
        <h2>I miei libri</h2>
        <BookList key={refreshKey} />
      </section>
    </main>
  );
}

export default App;
