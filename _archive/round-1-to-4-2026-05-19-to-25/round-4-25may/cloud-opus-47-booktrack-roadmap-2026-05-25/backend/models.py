from typing import Literal, Optional

from pydantic import BaseModel, Field

BookStatus = Literal["to-read", "reading", "done"]


class BookBase(BaseModel):
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    status: BookStatus


class BookCreate(BookBase):
    """Schema per la creazione di un nuovo libro."""
    pass


class BookUpdate(BaseModel):
    """Schema per l'aggiornamento di un libro (tutti i campi opzionali)."""
    title: Optional[str] = Field(None, min_length=1)
    author: Optional[str] = Field(None, min_length=1)
    status: Optional[BookStatus] = None


class Book(BookBase):
    """Schema completo di un libro come restituito dall'API."""
    id: int

    model_config = {"from_attributes": True}
