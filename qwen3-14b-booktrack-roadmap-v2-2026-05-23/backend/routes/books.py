from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
from .database import get_connection
from .models import Book, BookCreate, BookUpdate

router = APIRouter()

@router.get("/")
async def get_books():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM books")
    books = cursor.fetchall()
    conn.close()
    return [Book(id=row[0], title=row[1], author=row[2], status=row[3]) for row in books]

@router.post("/", status_code=201)
async def create_book(book: BookCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
                   (book.title, book.author, book.status))
    conn.commit()
    book_id = cursor.lastrowid
    conn.close()
    return Book(id=book_id, title=book.title, author=book.author, status=book.status)

@router.patch("/{book_id}")
async def update_book(book_id: int, book: BookUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    set_clause = []
    params = []
    if book.title:
        set_clause.append("title = ?")
        params.append(book.title)
    if book.author:
        set_clause.append("author = ?")
        params.append(book.author)
    if book.status:
        set_clause.append("status = ?")
        params.append(book.status)
    
    if not set_clause:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    params.append(book_id)
    query = f"UPDATE books SET {", ".join(set_clause)} WHERE id = ?"
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    return {"message": "Book updated"}

@router.delete("/{book_id}")
async def delete_book(book_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()
    return {"message": "Book deleted"}