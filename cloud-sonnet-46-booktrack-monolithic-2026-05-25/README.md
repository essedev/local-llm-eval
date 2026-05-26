# 📚 BookTrack

App locale per tenere traccia dei libri che leggi.

## Stack

| Livello | Tech |
|---------|------|
| Backend | FastAPI + SQLite |
| Frontend | React + Vite |

## Avvio rapido

```bash
./start.sh
```

Apri **http://localhost:5173** nel browser.

> Il primo avvio crea automaticamente il virtual env Python e installa le dipendenze.

---

## Avvio manuale

### Backend
```bash
cd backend
python3 -m venv .venv          # solo la prima volta
.venv/bin/pip install -r requirements.txt  # solo la prima volta
.venv/bin/uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install        # solo la prima volta
npm run dev
```

---

## Funzionalità

- **Aggiungi** un libro con titolo, autore e stato iniziale
- **Filtra** per stato: Tutti / Da leggere / In lettura / Letti
- **Avanza** lo stato con un click: `Da leggere → In lettura → Letto → Da leggere`
- **Elimina** un libro

## API

Documentazione interattiva disponibile su **http://localhost:8000/docs**

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/books` | Lista tutti i libri |
| POST | `/books` | Aggiunge un libro |
| PATCH | `/books/{id}` | Aggiorna lo status |
| DELETE | `/books/{id}` | Elimina un libro |

## Struttura

```
.
├── start.sh
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── booktrack.db        ← creato al primo avvio
└── frontend/
    └── src/
        ├── App.jsx
        ├── App.css
        ├── api.js
        └── components/
            ├── AddBookForm.jsx
            ├── FilterBar.jsx
            ├── BookList.jsx
            └── BookCard.jsx
```
