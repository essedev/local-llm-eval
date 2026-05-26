# Piano di Sviluppo - App BookTrack

## Task 1: Inizializzazione Backend FastAPI
- **Titolo**: Setup progetto backend con FastAPI e dipendenze
- **File**: `main.py`, `requirements.txt`, `.env`
- **Criterio di verifica**: `uv run python -c "from main import app; print(app.title)"` restituisce "BookTrack API"

## Task 2: Schema Database SQLite
- **Titolo**: Creazione modello Book e inizializzazione database
- **File**: `models.py`, `database.py`, `schema.sql`
- **Criterio di verifica**: `sqlite3 database.db ".schema books"` mostra tabella books con colonne id, title, author, status

## Task 3: Endpoint API CRUD
- **Titolo**: Implementazione endpoint GET, POST, PATCH per books
- **File**: `main.py`, `routes/books.py`, `schemas.py`
- **Criterio di verifica**: `curl -X POST http://localhost:8000/books -H "Content-Type: application/json" -d '{"title":"Test","author":"Test","status":"to-read"}'` restituisce 201 e crea record

## Task 4: Setup Frontend React + Vite
- **Titolo**: Inizializzazione progetto frontend con React e Vite
- **File**: `package.json`, `vite.config.js`, `src/App.jsx`
- **Criterio di verifica**: `pnpm run dev` avvia server su http://localhost:5173 senza errori

## Task 5: UI Form e Lista Books
- **Titolo**: Implementazione form creazione e lista con dropdown status
- **File**: `src/App.jsx`, `src/components/BookList.jsx`, `src/components/BookForm.jsx`
- **Criterio di verifica**: UI mostra lista books con dropdown status e form con campi title, author, status

## Task 6: Integrazione e Test End-to-End
- **Titolo**: Connessione backend-frontend e test completi
- **File**: `src/App.jsx`, `src/api.js`, `tests/e2e.spec.js`
- **Criterio di verifica**: `pnpm run test:e2e` esegue test che creano, leggono, aggiornano book con successo
