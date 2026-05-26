from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional


class Book(BaseModel):
    id: int
    title: str
    author: str
    status: str  # 'to-read' | 'reading' | 'done'


class BookCreate(BaseModel):
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    status: str = Field(default="to-read", pattern=r"^(to-read|reading|done)$")


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    author: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = Field(None, pattern=r"^(to-read|reading|done)$")
