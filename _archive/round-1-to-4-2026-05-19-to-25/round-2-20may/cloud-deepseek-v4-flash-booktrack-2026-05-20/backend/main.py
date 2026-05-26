from fastapi import FastAPI, HTTPException
from models import BookCreate, BookUpdate, Book
from database import get_connection, init_db

app = FastAPI(title="BookTrack API")

init_db()


@app.get("/books", response_model=list[Book])
def list_books():
    conn = get_connection()
    rows = conn.execute("SELECT id, title, author, status FROM books").fetchall()
    conn.close()
    return [Book(**dict(row)) for row in rows]


@app.post("/books", status_code=201, response_model=Book)
def create_book(book: BookCreate):
    conn = get_connection()
    cur = conn.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status),
    )
    conn.commit()
    book_id = cur.lastrowid
    conn.close()
    return Book(id=book_id, **book.model_dump())


@app.patch("/books/{book_id}", response_model=Book)
def update_book(book_id: int, update: BookUpdate):
    conn = get_connection()
    cur = conn.execute("SELECT id, title, author, status FROM books WHERE id = ?", (book_id,))
    row = cur.fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")

    conn.execute("UPDATE books SET status = ? WHERE id = ?", (update.status, book_id))
    conn.commit()

    cur = conn.execute("SELECT id, title, author, status FROM books WHERE id = ?", (book_id,))
    updated_row = cur.fetchone()
    conn.close()
    return Book(**dict(updated_row))