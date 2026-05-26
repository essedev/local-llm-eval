from contextlib import asynccontextmanager

from fastapi import FastAPI

from database import init_db
from routes.books import router as books_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="BookTrack API", lifespan=lifespan)
app.include_router(books_router)


def main():
    import uvicorn

    uvicorn.run("main:app", reload=True)


if __name__ == "__main__":
    main()
