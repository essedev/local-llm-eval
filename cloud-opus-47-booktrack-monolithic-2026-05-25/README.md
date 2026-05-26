# BookTrack

App locale per tracciare i libri che leggo. Backend FastAPI + SQLite, frontend React + Vite.

## Struttura

```
backend/   FastAPI + SQLModel (SQLite booktrack.db)
frontend/  React + Vite
```

## Avvio

### Backend (porta 8000)

```bash
cd backend
bash run.sh
```

Lo script crea un venv, installa le dipendenze e avvia uvicorn con reload.

In alternativa, manualmente:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Docs interattive: http://localhost:8000/docs

### Frontend (porta 5173)

```bash
cd frontend
npm install
npm run dev
```

Apri http://localhost:5173 — Vite proxy gira tutte le `/api/*` verso il backend.

## API

| Metodo | Endpoint            | Descrizione                              |
|--------|---------------------|------------------------------------------|
| GET    | `/api/books`        | Lista libri (filtro `?status=...`)       |
| POST   | `/api/books`        | Crea libro `{title, author, status}`     |
| GET    | `/api/books/{id}`   | Dettaglio                                |
| PATCH  | `/api/books/{id}`   | Aggiorna parziale (es. `{status:"done"}`)|
| DELETE | `/api/books/{id}`   | Elimina                                  |

`status` ∈ `to-read | reading | done` (default: `to-read`).

## Note

- Niente login: pensata per uso locale.
- Il database SQLite viene creato in `backend/booktrack.db` al primo avvio.
- CORS abilitato per `localhost:5173`.
