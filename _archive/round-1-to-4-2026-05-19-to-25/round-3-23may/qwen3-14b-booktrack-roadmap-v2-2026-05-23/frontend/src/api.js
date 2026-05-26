export async function listBooks() {
  const res = await fetch('http://localhost:8000/books');
  return await res.json();
}

export async function createBook(book) {
  const res = await fetch('http://localhost:8000/books', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(book)
  });
  return await res.json();
}

export async function updateBookStatus(id, status) {
  const res = await fetch(`http://localhost:8000/books/${id}`, {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ status })
  });
  return await res.json();
}