# BookTrack

App per tracciare i libri letti, in lettura e da leggere.

## Stack

- **Backend**: FastAPI (Python 3.12+) + SQLite
- **Frontend**: React 19 + Vite 8

## Avvio

### Prerequisiti

- Python 3.12+ e [uv](https://docs.astral.sh/uv/)
- Node.js 18+ e [pnpm](https://pnpm.io/)

### Backend (porta 8000)

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

API disponibile su `http://localhost:8000`.  
Swagger UI su `http://localhost:8000/docs`.

### Frontend (porta 5173)

```bash
cd frontend
pnpm install
pnpm run dev
```

App disponibile su `http://localhost:5173`.

## API Endpoints

| Metodo   | Path         | Descrizione         |
| -------- | ------------ | ------------------- |
| `GET`    | `/books`     | Lista tutti i libri |
| `POST`   | `/books`     | Aggiunge un libro   |
| `PATCH`  | `/books/{id}`| Modifica un libro   |
| `DELETE` | `/books/{id}`| Elimina un libro    |

### Esempio POST

```json
{
  "title": "Il nome della rosa",
  "author": "Umberto Eco",
  "status": "reading"
}
```

Stati validi: `to-read`, `reading`, `done`.
