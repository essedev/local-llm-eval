from pydantic import BaseModel
from typing import Optional

class Book(BaseModel):
    id: int
    title: str
    author: str
    status: str

class BookCreate(BaseModel):
    title: str
    author: str
    status: str

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = None