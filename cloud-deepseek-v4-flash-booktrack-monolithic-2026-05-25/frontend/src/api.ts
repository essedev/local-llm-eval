import { Book } from './types';

const BASE = '/books';

export async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch books');
  return res.json();
}

export async function createBook(title: string, author: string): Promise<Book> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author }),
  });
  if (!res.ok) throw new Error('Failed to create book');
  return res.json();
}

export async function updateStatus(id: number, status: string): Promise<Book> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}
