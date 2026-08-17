import { useState } from 'react';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBookAdded = (newBook) => {
    // The BookList component will automatically refresh, but we can show a success message if needed
    console.log('Book added:', newBook);
  };

  const handleBookUpdated = (updatedBook) => {
    // The BookList component will automatically refresh
    console.log('Book updated:', updatedBook);
  };

  const handleBookDeleted = (deletedBookId) => {
    // The BookList component will automatically refresh
    console.log('Book deleted:', deletedBookId);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>BookTrack</h1>
        <p>Track the books you read</p>
      </header>
      
      <main className="app-main">
        <div className="app-content">
          <BookForm onBookAdded={handleBookAdded} />
          
          <div className="divider"></div>
          
          <BookList 
            onBookUpdated={handleBookUpdated} 
            onBookDeleted={handleBookDeleted} 
          />
        </div>
      </main>
    </div>
  );
}

export default App;