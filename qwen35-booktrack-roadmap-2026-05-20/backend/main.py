from fastapi import FastAPI, HTTPException
from models import BookCreate, BookUpdate, Book
from database import get_connection, init_db

init_db()

app = FastAPI(title="BookTrack API")

@app.get("/books")
def list_books() -> list[Book]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, author, status FROM books")
    rows = cursor.fetchall()
    books = [
        {
            "id": row[0],
            "title": row[1],
            "author": row[2],
            "status": row[3]
        }
        for row in rows
    ]
    return books

@app.post("/books", status_code=201)
def create_book(book: BookCreate) -> Book:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status)
    )
    book_id = cursor.lastrowid
    conn.commit()
    new_book = Book(id=book_id, title=book.title, author=book.author, status=book.status)
    return new_book

@app.patch("/books/{book_id}")
def update_book(book_id: int, update: BookUpdate) -> Book:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    cursor.execute(
        "UPDATE books SET status = ? WHERE id = ?",
        (update.status, book_id)
    )
    updated_book = Book(id=book_id, title=update.title if update.title else None, author=update.author if update.author else None, status=update.status)
    return updated_book
