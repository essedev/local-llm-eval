from fastapi import FastAPI, HTTPException
from sqlite3 import Row
from models import BookCreate, BookUpdate, Book
from database import get_connection, init_db

app = FastAPI(title="BookTrack API")

init_db()


@app.get("/books")
def list_books() -> list[Book]:
    conn = get_connection()
    try:
        conn.row_factory = Row
        rows = conn.execute("SELECT id, title, author, status FROM books").fetchall()
        return [Book(**dict(row)) for row in rows]
    finally:
        conn.close()


@app.post("/books", status_code=201)
def create_book(book: BookCreate) -> Book:
    conn = get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (book.title, book.author, book.status),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?",
            (cur.lastrowid,),
        ).fetchone()
        return Book(**dict(row))
    finally:
        conn.close()


@app.patch("/books/{book_id}")
def update_book(book_id: int, update: BookUpdate) -> Book:
    conn = get_connection()
    try:
        row = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?",
            (book_id,),
        ).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Book not found")
        conn.execute(
            "UPDATE books SET status = ? WHERE id = ?",
            (update.status, book_id),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, title, author, status FROM books WHERE id = ?",
            (book_id,),
        ).fetchone()
        return Book(**dict(row))
    finally:
        conn.close()
