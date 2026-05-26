const BASE_URL = 'http://127.0.0.1:8000';

export async function listBooks() {
  const response = await fetch(`${BASE_URL}/books`);
  if (!response.ok) throw new Error(`Failed to list books: ${response.statusText}`);
  return response.json();
}

export async function createBook(book) {
  const response = await fetch(`${BASE_URL}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  if (!response.ok) throw new Error(`Failed to create book: ${response.statusText}`);
  return response.json();
}

export async function updateBookStatus(id, status) {
  const response = await fetch(`${BASE_URL}/books/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error(`Failed to update book status: ${response.statusText}`);
  return response.json();
}