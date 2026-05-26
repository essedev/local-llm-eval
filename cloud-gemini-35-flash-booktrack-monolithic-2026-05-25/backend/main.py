from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import database as db
import schemas

db.Base.metadata.create_all(bind=db.engine)

app = FastAPI(title="Book Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    database_session = db.SessionLocal()
    try:
        yield database_session
    finally:
        database_session.close()

@app.get("/books", response_model=list[schemas.BookResponse])
def get_books(db_session: Session = Depends(get_db)):
    return db_session.query(db.Book).all()

@app.get("/books/{book_id}", response_model=schemas.BookResponse)
def get_book(book_id: int, db_session: Session = Depends(get_db)):
    book = db_session.query(db.Book).filter(db.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@app.post("/books", response_model=schemas.BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book: schemas.BookCreate, db_session: Session = Depends(get_db)):
    db_book = db.Book(title=book.title, author=book.author, status=book.status)
    db_session.add(db_book)
    db_session.commit()
    db_session.refresh(db_book)
    return db_book

@app.put("/books/{book_id}", response_model=schemas.BookResponse)
def update_book(book_id: int, book_update: schemas.BookUpdate, db_session: Session = Depends(get_db)):
    db_book = db_session.query(db.Book).filter(db.Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    update_data = book_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_book, key, value)
        
    db_session.commit()
    db_session.refresh(db_book)
    return db_book

@app.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(book_id: int, db_session: Session = Depends(get_db)):
    db_book = db_session.query(db.Book).filter(db.Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
    db_session.delete(db_book)
    db_session.commit()
    return None
