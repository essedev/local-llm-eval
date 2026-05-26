# BookTrack

App locale per tracciare libri letti/in lettura/da leggere.

## Stack

- Backend: FastAPI + SQLite
- Frontend: React + Vite
- Nessun login

## Avvio backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API su `http://localhost:8000`. Il database SQLite viene creato automaticamente in `backend/books.db`.

## Avvio frontend

In un secondo terminale:

```bash
cd frontend
npm install
npm run dev
```

Frontend su `http://localhost:5173`.

## Endpoint principali

- `GET /books` lista libri
- `POST /books` crea libro con `{ "title": "...", "author": "...", "status": "to-read" }`
- `PATCH /books/{id}/status` cambia status con `{ "status": "reading" }`

Status validi: `to-read`, `reading`, `done`.
