export async function listBooks() {
  const response = await fetch('http://localhost:8000/books');
  if (!response.ok) {
    throw new Error('Failed to fetch books');
  }
  return response.json();
}

export async function createBook(book) {
  const response = await fetch('http://localhost:8000/books', {
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
  const response = await fetch(`http://localhost:8000/books/${id}`, {
    method: 'PUT',
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