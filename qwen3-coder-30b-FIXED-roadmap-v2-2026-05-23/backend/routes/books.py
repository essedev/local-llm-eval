from fastapi import APIRouter, HTTPException, status
from models import Book, BookCreate, BookUpdate
from database import get_connection
from typing import List

router = APIRouter(prefix="/books", tags=["books"])

def get_book_by_id(book_id: int) -> Book:
    """Get a book by its ID."""
    conn = get_connection()
    book = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()
    
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return Book(**book)

@router.get("/", response_model=List[Book])
def get_books():
    """Get all books."""
    conn = get_connection()
    books = conn.execute("SELECT * FROM books").fetchall()
    conn.close()
    
    return [Book(**book) for book in books]

@router.post("/", response_model=Book, status_code=status.HTTP_201_CREATED)
def create_book(book: BookCreate):
    """Create a new book."""
    conn = get_connection()
    
    cursor = conn.execute(
        "INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
        (book.title, book.author, book.status)
    )
    
    book_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return get_book_by_id(book_id)

@router.patch("/{id}", response_model=Book)
def update_book(id: int, book_update: BookUpdate):
    """Update a book by ID."""
    conn = get_connection()
    
    # Check if book exists
    existing_book = conn.execute("SELECT * FROM books WHERE id = ?", (id,)).fetchone()
    if existing_book is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Build the update query dynamically
    set_clause = []
    values = []
    
    if book_update.title is not None:
        set_clause.append("title = ?")
        values.append(book_update.title)
    
    if book_update.author is not None:
        set_clause.append("author = ?")
        values.append(book_update.author)
    
    if book_update.status is not None:
        set_clause.append("status = ?")
        values.append(book_update.status)
    
    if not set_clause:
        conn.close()
        raise HTTPException(status_code=400, detail="No update data provided")
    
    values.append(id)
    query = f"UPDATE books SET {', '.join(set_clause)} WHERE id = ?"
    conn.execute(query, values)
    conn.commit()
    
    updated_book = get_book_by_id(id)
    conn.close()
    
    return updated_book

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(id: int):
    """Delete a book by ID."""
    conn = get_connection()
    
    # Check if book exists
    existing_book = conn.execute("SELECT * FROM books WHERE id = ?", (id,)).fetchone()
    if existing_book is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    
    conn.execute("DELETE FROM books WHERE id = ?", (id,))
    conn.commit()
    conn.close()