const API_URL = 'http://localhost:8000/books';

export async function listBooks() {
  const res = await fetch(API_URL);
  return res.json();
}

export async function createBook(book) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  return res.json();
}

export async function updateBookStatus(id, status) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
}
