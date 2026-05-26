import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom0'
import BooksList from './components/BooksList.jsx'
import BookForm from './components/BookForm.jsx'
import BookDetail from './components/BookDetail.jsx'

function App() {
  return (
    <div className="container">
      <h5>📚 Book Tracker</h5>
      <Routes>
        <Route path="/" element={<BooksList />} />
        <Route path="/add" element={<BookForm />} />
        <Route path="/edit/:id" element={<BookForm />} />
        <Route path="/book/:id" element={<BookDetail />} />
      </Routes>
    </div>
  )
}

export default App