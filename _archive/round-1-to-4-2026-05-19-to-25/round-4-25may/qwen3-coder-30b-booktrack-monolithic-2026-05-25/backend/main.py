from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os

# Initialize FastAPI app
app = FastAPI(title="Book Tracker", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE = "books.db"

def init_db():
    """Initialize the database with the books table"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Create books table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'to-read'
        )
    ''')
    
    conn.commit()
    conn.close()

# Pydantic models
class Book(BaseModel):
    id: Optional[int] = None
    title: str
    author: str
    status: str = "to-read"

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = None

# Initialize database
init_db()

# Routes
@app.get("/")
async def root():
    return {"message": "Book Tracker API"}

@app.get("/books", response_model=List[Book])
async def get_books():
    """Get all books"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, title, author, status FROM books ORDER BY id")
    rows = cursor.fetchall()
    
    books = []
    for row in rows:
        books.append(Book(id=row[0], title=row[1], author=row[2], status=row[3]))
    
    conn.close()
    return books

@app.post("/books", response_model=Book)
async def create_book(book: Book):
    """Create a new book"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status)
    )
    
    book_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Return the created book with its ID
    return Book(id=book_id, title=book.title, author=book.author, status=book.status)

@app.put("/books/{book_id}", response_model=Book)
async def update_book(book_id: int, book_update: BookUpdate):
    """Update a book"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    # Get the current book to preserve any unspecified fields
    cursor.execute("SELECT title, author, status FROM books WHERE id = ?", (book_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Prepare update values
    title = book_update.title if book_update.title is not None else row[0]
    author = book_update.author if book_update.author is not None else row[1]
    status = book_update.status if book_update.status is not None else row[2]
    
    # Update the book
    cursor.execute(
        "UPDATE books SET title = ?, author = ?, status = ? WHERE id = ?",
        (title, author, status, book_id)
    )
    
    conn.commit()
    conn.close()
    
    # Return the updated book
    return Book(id=book_id, title=title, author=author, status=status)

@app.delete("/books/{book_id}")
async def delete_book(book_id: int):
    """Delete a book"""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    
    conn.commit()
    conn.close()
    return {"message": "Book deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)