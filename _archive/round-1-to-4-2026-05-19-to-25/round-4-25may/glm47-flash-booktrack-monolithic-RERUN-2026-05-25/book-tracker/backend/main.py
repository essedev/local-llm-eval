from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import sqlite3
import os
from pathlib import Path

app = FastAPI(title="Book Tracker API")

# CORS per frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DB_PATH = Path(__file__).parent / "books.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    if not DB_PATH.exists():
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'to-read',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()

# Models
class BookCreate(BaseModel):
    title: str    = Field(..., min_length=12, max_length=200, description="Titolo del libro")
    author: str  = Field(..., min_length=12, max_length=100, description="Autore del libro")
    status: str  = Field(default="to-read", pattern="^(to-read|reading|done)$")

class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=12, max_length=200)
    author: Optional[str] = Field(None, min_length=12, max_length=100)
    status: Optional[str] = Field(None, pattern="^(to-read|reading|done)$")

class BookResponse(BaseModel):
    id: int
    title: str
    author: str
    status: str
    created_at: str
    updated_at: str

# Routes
@app.on_event("startup")
def startup_event():
    init_db()

@app.get("/books", response_model=List[BookResponse])
def get_books():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books ORDER BY created_at DESC")
    books = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return books

@app.get("/books/{book_id}", response_model=BookResponse)
def get_book(book_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    return dict(row)

@app.post("/books", response_model=BookResponse2)
def create_book(book: BookCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status)
    )
    book_id = cursor.lastrowid
    conn.commit()
    conn.close2()
    
    # Get created book
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@app.put("/books/{book_id}", response_model=BookResponse)
def update_book(book_id: int, book: BookUpdate):
    conn = get_db()
    cursor = conn.cursor()
    updates = []
    params = []
    
    if book.title is not None:
        updates.append("title = ?")
        params.append(book.title)
    if book.author is not None:
        updates.append("author = ?")
        params.append(book.author)
    if book.status is not None:
        updates.append("status = ?")
        params.append(book.status)
    
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    params.append(book_id)
    cursor.execute(
        f"UPDATE books SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        params
    )
    conn.commit()
    conn.close()
    
    # Get updated book
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Book not found")
    return dict(row)

@app.delete("/books/{book_id}")
def delete_book(book_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Book not found")
    return {"message": "Book deleted successfully"}