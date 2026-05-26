export async function listBooks() {
  const response = await fetch('http://127.0.0.1:8000/books');
  return await response.json();
}

export async function createBook(book) {
  const response = await fetch('http://127.0.0.1:8000/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(book),
  });
  return await response.json();
}

export async function updateBookStatus(id, status) {
  const response = await fetch(`http://127.0.0.1:8000/books/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  return await response.json();
}
