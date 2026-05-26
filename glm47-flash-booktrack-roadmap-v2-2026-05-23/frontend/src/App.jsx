import { useState } from 'react';
import BookList from './components/BookList';
import BookForm from './components/BookForm';

function App() {
  return (
    <div>
      <h1>BookTrack</h1>
      <BookList />
      <BookForm />
    </div>
  );
}

export default App;