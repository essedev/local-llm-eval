const BASE = '/api'

async function handle(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const data = await res.json()
      if (data?.detail) msg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    } catch {}
    throw new Error(msg)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  list: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : ''
    return fetch(`${BASE}/books${qs}`).then(handle)
  },
  create: (book) =>
    fetch(`${BASE}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    }).then(handle),
  update: (id, patch) =>
    fetch(`${BASE}/books/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }).then(handle),
  remove: (id) =>
    fetch(`${BASE}/books/${id}`, { method: 'DELETE' }).then(handle),
}
