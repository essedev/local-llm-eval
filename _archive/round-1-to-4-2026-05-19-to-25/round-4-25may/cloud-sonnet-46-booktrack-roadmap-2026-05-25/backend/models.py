"""Pydantic models for the Book resource."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel

# Allowed values for the reading status column.
StatusLiteral = Literal["to-read", "reading", "done"]


class BookCreate(BaseModel):
    """Payload required to create a new book."""

    title: str
    author: str
    status: StatusLiteral


class BookUpdate(BaseModel):
    """Payload for a partial update – all fields are optional."""

    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[StatusLiteral] = None


class Book(BaseModel):
    """Full book representation returned by the API."""

    id: int
    title: str
    author: str
    status: StatusLiteral

    model_config = {"from_attributes": True}
