const BASE = "http://localhost:8000";

export async function fetchBooks() {
  const res = await fetch(`${BASE}/books`);
  if (!res.ok) throw new Error("Failed to fetch books");
  return res.json();
}

export async function addBook(book) {
  const res = await fetch(`${BASE}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(book),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to add book");
  }
  return res.json();
}

export async function updateStatus(id, status) {
  const res = await fetch(`${BASE}/books/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update book");
  return res.json();
}

export async function deleteBook(id) {
  const res = await fetch(`${BASE}/books/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete book");
}
