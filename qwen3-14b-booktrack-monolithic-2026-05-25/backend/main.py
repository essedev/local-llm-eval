from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sqlite3
from contextlib import closing

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
conn = sqlite3.connect('books.db', check_same_thread=False)
conn.execute('''CREATE TABLE IF NOT EXISTS books
             (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, author TEXT, status TEXT)''')

class Book(BaseModel):
    title: str
    author: str
    status: str

@app.post("/books", response_model=Book)
def create_book(book: Book):
    with closing(conn.cursor()) as c:
        c.execute("INSERT INTO books (title, author, status) VALUES (?, ?, ?)",
                  (book.title, book.author, book.status))
        conn.commit()
        return {**book.dict(), "id": c.lastrowid}

@app.get("/books", response_model=List[Book])
def get_books():
    with closing(conn.cursor()) as c:
        c.execute("SELECT * FROM books")
        rows = c.fetchall()
        return [{"id": row[0], "title": row[1], "author": row[2], "status": row[3]} for row in rows]

@app.put("/books/{book_id}", response_model=Book)
def update_book(book_id: int, book: Book):
    with closing(conn.cursor()) as c:
        c.execute("UPDATE books SET title=?, author=?, status=? WHERE id=?",
                  (book.title, book.author, book.status, book_id))
        conn.commit()
        if c.rowcount == 0:
            raise HTTPException(status_code=404, detail="Book not found")
        return {**book.dict(), "id": book_id}
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
