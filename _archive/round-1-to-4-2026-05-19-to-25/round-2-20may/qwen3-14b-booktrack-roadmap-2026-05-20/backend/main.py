from fastapi import FastAPI, HTTPException
from models import BookCreate, BookUpdate, Book
from database import get_connection, init_db

app = FastAPI(title="BookTrack API")

# Inizializza il database a livello modulo
init_db()

@app.get("/books")
def list_books() -> list[Book]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, author, status FROM books")
    books = cursor.fetchall()
    return [Book(id=row[0], title=row[1], author=row[2], status=row[3]) for row in books]

@app.post("/books", status_code=201)
def create_book(book: BookCreate) -> Book:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status)
    )
    conn.commit()
    last_id = cursor.lastrowid
    return Book(id=last_id, title=book.title, author=book.author, status=book.status)

@app.patch("/books/{book_id}")
def update_book(book_id: int, update: BookUpdate) -> Book:
    conn = get_connection()
    cursor = conn.cursor()
    
    # Verifica esistenza libro
    cursor.execute("SELECT 1 FROM books WHERE id = ?", (book_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Book not found")

    # Aggiorna status
    cursor.execute(
        "UPDATE books SET status = ? WHERE id = ?",
        (update.status, book_id)
    )
    conn.commit()

    # Recupera libro aggiornato
    cursor.execute("SELECT id, title, author, status FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    return Book(id=row[0], title=row[1], author=row[2], status=row[3])