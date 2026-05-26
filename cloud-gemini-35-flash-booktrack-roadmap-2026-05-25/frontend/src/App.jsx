import { useState } from 'react';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="app-container">
      <header>
        <h1>BookTrack</h1>
      </header>
      <main>
        <BookForm onBookCreated={handleRefresh} />
        <BookList refreshTrigger={refreshTrigger} onStatusUpdate={handleRefresh} />
      </main>
    </div>
  );
}

export default App;
