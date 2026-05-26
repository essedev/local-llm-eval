# BookTrack

Gestione libri con backend Python (FastAPI) e frontend React (Vite).

## Requisiti

- **Backend**: Python 3.10+, [uv](https://docs.astral.sh/uv/)
- **Frontend**: [Node.js](https://nodejs.org/) 18+, [pnpm](https://pnpm.io/)

## Avvio

### 1. Backend

```bash
cd backend
uv run uvicorn main:app
```

Il backend è disponibile su `http://localhost:8000`.

### 2. Frontend

```bash
cd frontend
pnpm install   # solo al primo avvio
pnpm run dev
```

Il frontend è disponibile su `http://localhost:5173`.

## Test end-to-end

```bash
# Backend
curl -s http://localhost:8000/books

# Frontend
curl -s http://localhost:5173
```

## Struttura

```
├── backend/          # FastAPI + SQLite
│   ├── main.py
│   ├── models.py
│   └── requirements.txt
└── frontend/         # React + Vite
    ├── src/
    └── index.html
```
