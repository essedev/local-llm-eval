from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import get_db, init_db

app = FastAPI(title="BookTrack")

init_db()


class BookCreate(BaseModel):
    title: str
    author: str
    status: str = "to-read"


class BookUpdate(BaseModel):
    status: str


class BookOut(BaseModel):
    id: int
    title: str
    author: str
    status: str


@app.get("/api/books", response_model=List[BookOut])
def get_books():
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, title, author, status FROM books ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@app.post("/api/books", response_model=BookOut, status_code=201)
def add_book(book: BookCreate):
    if book.status not in ("to-read", "reading", "done"):
        raise HTTPException(400, "Invalid status. Use: to-read, reading, done")
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (book.title, book.author, book.status),
        )
        book_id = cursor.lastrowid
    return {"id": book_id, "title": book.title, "author": book.author, "status": book.status}


@app.patch("/api/books/{book_id}", response_model=BookOut)
def update_status(book_id: int, update: BookUpdate):
    if update.status not in ("to-read", "reading", "done"):
        raise HTTPException(400, "Invalid status. Use: to-read, reading, done")
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Book not found")
        conn.execute(
            "UPDATE books SET status = ? WHERE id = ?", (update.status, book_id)
        )
    return {"id": book_id, "title": row["title"], "author": row["author"], "status": update.status}


@app.delete("/api/books/{book_id}", status_code=204)
def delete_book(book_id: int):
    with get_db() as conn:
        row = conn.execute(
            "SELECT id FROM books WHERE id = ?", (book_id,)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Book not found")
        conn.execute("DELETE FROM books WHERE id = ?", (book_id,))
    return None
