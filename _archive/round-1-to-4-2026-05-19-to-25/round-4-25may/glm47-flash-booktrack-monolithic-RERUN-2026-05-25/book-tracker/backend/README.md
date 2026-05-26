# Book Tracker - Backend

## Avvio

```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## API Endpoints

- `GET /books` - Lista tutti i libri
- `GET /books/{id}` - Dettaglio libro
- `POST /books` - Crea nuovo libro
- `PUT /books/{id}` - Aggiorna libro
- `DELETE /books/{id}` - Elimina libro