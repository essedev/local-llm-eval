const API_URL = 'http://localhost:8000/books'

async function handleResponse(response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export async function listBooks() {
  const response = await fetch(API_URL)
  return handleResponse(response)
}

export async function createBook(book) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(book),
  })

  return handleResponse(response)
}

export async function updateBookStatus(id, status) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })

  return handleResponse(response)
}
