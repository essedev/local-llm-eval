from pydantic import BaseModel
from typing import Literal

BookStatus = Literal["to-read", "reading", "done"]

class BookCreate(BaseModel):
    title: str
    author: str
    status: BookStatus = "to-read"

class BookUpdate(BaseModel):
    status: BookStatus

class Book(BookCreate):
    id: int