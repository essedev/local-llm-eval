from fastapi import FastAPI, HTTPException
from models import BookCreate, BookUpdate, Book
from database import get_connection, init_db

app = FastAPI(title="BookTrack API")

init_db()


@app.get("/books")
def list_books() -> list[Book]:
    conn = get_connection()
    cursor = conn.execute("SELECT id, title, author, status FROM books")
    rows = cursor.fetchall()
    conn.close()
    return [Book(id=r[0], title=r[1], author=r[2], status=r[3]) for r in rows]


@app.post("/books", status_code=201)
def create_book(book: BookCreate) -> Book:
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return Book(id=new_id, title=book.title, author=book.author, status=book.status)


@app.patch("/books/{book_id}")
def update_book(book_id: int, update: BookUpdate) -> Book:
    conn = get_connection()
    cursor = conn.execute(
        "SELECT id, title, author, status FROM books WHERE id = ?", (book_id,)
    )
    row = cursor.fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")

    conn.execute("UPDATE books SET status = ? WHERE id = ?", (update.status, book_id))
    conn.commit()

    cursor = conn.execute(
        "SELECT id, title, author, status FROM books WHERE id = ?", (book_id,)
    )
    row = cursor.fetchone()
    conn.close()
    return Book(id=row[0], title=row[1], author=row[2], status=row[3])
