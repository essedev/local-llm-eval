# BookTrack Backend

Backend per BookTrack, un'app per tracciare i libri che leggo.

## Tecnologie

- FastAPI
- SQLite

## Avvio

Per eseguire il backend:

```bash
# Installa le dipendenze
pip install -r requirements.txt

# Esegui l'app
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /books` - Ottiene tutti i libri
- `POST /books` - Aggiunge un nuovo libro
- `PUT /books/{book_id}` - Aggiorna lo status di un libro
- `DELETE /books/{book_id}` - Elimina un libro
- `GET /health` - Health check