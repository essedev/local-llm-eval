from pydantic import BaseModel
from typing import Optional

class Book(BaseModel):
    id: Optional[int] = None
    title: str
    author: str
    status: str  # Will be validated to be one of: 'to-read', 'reading', 'done'

class BookCreate(BaseModel):
    title: str
    author: str
    status: str  # Will be validated to be one of: 'to-read', 'reading', 'done'

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = None