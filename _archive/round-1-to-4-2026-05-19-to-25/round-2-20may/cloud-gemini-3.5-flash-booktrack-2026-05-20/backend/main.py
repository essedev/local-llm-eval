from fastapi import FastAPI, HTTPException
from models import BookCreate, BookUpdate, Book
from database import get_connection, init_db

# Inizializza il database a livello di modulo
init_db()

app = FastAPI(title="BookTrack API")

@app.get("/books")
def list_books() -> list[Book]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, author, status FROM books")
        rows = cursor.fetchall()
        return [Book(id=row["id"], title=row["title"], author=row["author"], status=row["status"]) for row in rows]

@app.post("/books", status_code=201)
def create_book(book: BookCreate) -> Book:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
            (book.title, book.author, book.status)
        )
        conn.commit()
        book_id = cursor.lastrowid
        return Book(id=book_id, title=book.title, author=book.author, status=book.status)

@app.patch("/books/{book_id}")
def update_book(book_id: int, update: BookUpdate) -> Book:
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # Check first if the book exists to handle 404 correctly
        cursor.execute("SELECT id FROM books WHERE id = ?", (book_id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Perform the update
        cursor.execute(
            "UPDATE books SET status = ? WHERE id = ?",
            (update.status, book_id)
        )
        conn.commit()
        
        # Secondo SELECT per rileggere title, author, id, status
        cursor.execute("SELECT id, title, author, status FROM books WHERE id = ?", (book_id,))
        row = cursor.fetchone()
        return Book(id=row["id"], title=row["title"], author=row["author"], status=row["status"])
