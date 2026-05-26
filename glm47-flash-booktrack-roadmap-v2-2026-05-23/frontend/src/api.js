export function listBooks() {
  return fetch('http://localhost:8000/books')
    .then(response => response.json())
    .catch(error => console.error('Error fetching books:', error));
}

export function createBook(book) {
  return fetch('http://localhost:8000/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(book),
  })
    .then(response => response.json())
    .catch(error => console.error('Error creating book:', error));
}

export function updateBookStatus(id, status) {
  return fetch(`http://localhost:8000/books/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })
    .then(response => response.json())
    .catch(error => console.error('Error updating book status:', error));
}