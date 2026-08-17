# BookTrack

Una micro-app locale per tracciare i libri che leggo.

## Struttura

L'app è composta da due componenti:

1. **Backend**: FastAPI con SQLite
2. **Frontend**: React + Vite

## Avvio dell'applicazione

### Backend

Per eseguire il backend:

```bash
cd booktrack/backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

Per eseguire il frontend:

```bash
cd booktrack/frontend
npm install
npm run dev
```

L'applicazione sarà accessibile all'indirizzo `http://localhost:5173`.

## Funzionalità

- Aggiungere un libro indicando titolo, autore e status iniziale
- Vedere la lista dei libri esistenti
- Cambiare lo status di un libro esistente
- Eliminare un libro

## Vincoli

- Lo status di un libro è un enum letterale: `to-read`, `reading`, `done`
- Ogni libro ha un id intero generato dal backend
- I field names del payload e del response BE↔FE: `id`, `title`, `author`, `status`
- Il backend è esposto sulla porta `8000`
- Il frontend è esposto sulla porta `5173`
- Il database SQLite vive sul disco, nei file del backend
- Il frontend riflette immediatamente le modifiche fatte