import './App.css'
import BookList from './components/BookList'
import BookForm from './components/BookForm'

function App() {
  return (
    <main>
      <h1>BookTrack</h1>
      <section>
        <h2>Aggiungi un libro</h2>
        <BookForm />
      </section>
      <section>
        <h2>I miei libri</h2>
        <BookList />
      </section>
    </main>
  )
}

export default App
