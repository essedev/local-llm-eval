from fastapi import FastAPI
from routes.books import router as books_router

app = FastAPI(title="BookTrack API")
app.include_router(books_router)
