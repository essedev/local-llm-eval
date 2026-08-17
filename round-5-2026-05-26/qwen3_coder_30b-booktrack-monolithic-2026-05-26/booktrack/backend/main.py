from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os

# Inizializzazione dell'app FastAPI
app = FastAPI(title="BookTrack API")

# Path per il database SQLite
DB_PATH = "books.db"

# Modello per i libri
class Book(BaseModel):
    id: Optional[int] = None
    title: str
    author: str
    status: str  # to-read, reading, done

# Modello per la creazione di un libro
class BookCreate(BaseModel):
    title: str
    author: str
    status: str

# Inizializzazione del database
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# Inizializzazione del database all'avvio
init_db()

# Endpoint per ottenere tutti i libri
@app.get("/books", response_model=List[Book])
async def get_books():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, author, status FROM books")
    rows = cursor.fetchall()
    books = [Book(id=row[0], title=row[1], author=row[2], status=row[3]) for row in rows]
    conn.close()
    return books

# Endpoint per aggiungere un nuovo libro
@app.post("/books", response_model=Book, status_code=status.HTTP_201_CREATED)
async def add_book(book: BookCreate):
    # Validazione dello status
    valid_statuses = ["to-read", "reading", "done"]
    if book.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status)
    )
    conn.commit()
    book_id = cursor.lastrowid
    conn.close()
    
    # Ritorna il libro appena creato
    return Book(id=book_id, title=book.title, author=book.author, status=book.status)

# Endpoint per aggiornare lo status di un libro
@app.put("/books/{book_id}", response_model=Book)
async def update_book_status(book_id: int, book: BookCreate):
    # Validazione dello status
    valid_statuses = ["to-read", "reading", "done"]
    if book.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE books SET title=?, author=?, status=? WHERE id=?",
        (book.title, book.author, book.status, book_id)
    )
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Recupera il libro aggiornato
    cursor.execute("SELECT id, title, author, status FROM books WHERE id=?", (book_id,))
    row = cursor.fetchone()
    conn.close()
    
    return Book(id=row[0], title=row[1], author=row[2], status=row[3])

# Endpoint per eliminare un libro
@app.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(book_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM books WHERE id=?", (book_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    conn.close()

# Endpoint di health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}