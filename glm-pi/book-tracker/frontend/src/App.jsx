import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import BooksList from './components/BooksList.jsx'
import AddBook from './components/AddBook.jsx'
import EditBook from './components/EditBook.jsx'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center">📚 Libri</h1>
        <Routes>
          <Route path="/" element={<BooksList />} />
          <Route path="/add" element={<AddBook />} />
          <Route path="/edit/:id" element={<EditBook />} />
        </Routes>
      </div>
    </div>
  )
}

export default App