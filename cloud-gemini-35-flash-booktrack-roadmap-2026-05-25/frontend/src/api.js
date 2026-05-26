const API_URL = 'http://localhost:8000/books';

export async function listBooks() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

export async function createBook(book) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(book),
  });
  if (!response.ok) {
    throw new Error('Failed to create book');
  }
  return response.json();
}

export async function updateBookStatus(id, status) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update book status');
  }
  return response.json();
}
