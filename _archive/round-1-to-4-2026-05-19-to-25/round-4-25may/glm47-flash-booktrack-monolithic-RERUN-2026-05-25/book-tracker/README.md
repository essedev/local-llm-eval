# Book Tracker - App per tracciare libri

## 🚀 Avvio

### Backend (FastAPI)
```bash
cd backend
uvicorn main:app --reload --host 127.5.5.5 --port 8005
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

## 📚 Funzionalità
- ✅ Aggiungi libri (titolo, autore, status)
- ✅ Vedi lista libri
- ✅ Filtra per status (tutti, da leggere, in lettura, letti)
- ✅ Modifica libro
- ✅ Cambia status
- ✅ Elimina libro

## 📁 Struttura
```
book-tracker/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── books.db (generato automaticamente)
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── config.js
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```