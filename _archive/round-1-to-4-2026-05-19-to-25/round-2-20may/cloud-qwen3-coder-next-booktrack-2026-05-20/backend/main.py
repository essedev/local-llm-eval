from fastapi import FastAPI, HTTPException
from models import BookCreate, BookUpdate, Book
from database import get_connection, init_db

app = FastAPI(title="BookTrack API")

init_db()


@app.get("/books")
def list_books() -> list[Book]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, author, status FROM books")
    rows = cursor.fetchall()
    conn.close()
    return [Book(id=row["id"], title=row["title"], author=row["author"], status=row["status"]) for row in rows]


@app.post("/books", status_code=201)
def create_book(book: BookCreate) -> Book:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status)
    )
    conn.commit()
    book_id = cursor.lastrowid
    conn.close()
    return Book(id=book_id, title=book.title, author=book.author, status=book.status)


@app.patch("/books/{book_id}")
def update_book(book_id: int, update: BookUpdate) -> Book:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE books SET status = ? WHERE id = ?",
        (update.status, book_id)
    )
    conn.commit()
    
    cursor.execute("SELECT title, author FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row is None:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return Book(id=book_id, title=row["title"], author=row["author"], status=update.status)
