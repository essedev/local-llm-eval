const BASE_URL = 'http://127.0.0.1:8000';

export async function listBooks() {
  const res = await fetch(`${BASE_URL}/books`);
  return res.json();
}

export async function createBook(book) {
  const res = await fetch(`${BASE_URL}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  return res.json();
}

export async function updateBookStatus(id, status) {
  const res = await fetch(`${BASE_URL}/books/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
}
