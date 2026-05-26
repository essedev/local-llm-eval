from typing import Literal
from pydantic import BaseModel

BookStatus = Literal["to-read", "reading", "done"]


class BookCreate(BaseModel):
    title: str
    author: str
    status: BookStatus


class BookUpdate(BaseModel):
    status: BookStatus


class Book(BookCreate):
    id: int
