const BASE_URL = 'http://localhost:8000/books'

export async function listBooks() {
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('Failed to list books')
  return res.json()
}

export async function createBook(book) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  })
  if (!res.ok) throw new Error('Failed to create book')
  return res.json()
}

export async function updateBookStatus(id, status) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update book status')
  return res.json()
}
