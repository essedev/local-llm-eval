# Book Tracker app

Una semplice applicazione monoutente per tracciare i libri che leggi (e i loro relativi stati: da leggere, in lettura, completato), creata con FastAPI (SQLite) e React + Vite.

## Struttura del Progetto

- `/backend`: API creata con FastAPI, SQLite, SQLAlchemy e Pydantic.
- `/frontend`: Applicazione Single Page creata con React, Vite e TypeScript.

---

## Avviare il Backend

### Prerequisiti
1. Python 3.10+ installato.
2. Ambiente virtuale consigliato.

### Installazione e Avvio
1. Entra nella cartella `backend`:
   ```bash
   cd backend
   ```

2. Crea ed attiva un ambiente virtuale (consigliato):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Su Windows: venv\\Scripts\\activate
   ```

3. Installa le dipendenze:
   ```bash
   pip install -r requirements.txt
   ```

4. Avvia l'applicazione con Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```

Il backend sarà disponibile all'indirizzo `http://localhost:8000`. Puoi anche visionare la documentazione interattiva OpenAPI (Swagger) su `http://localhost:8000/docs`.

---

## Avviare il Frontend

### Prerequisiti
1. Node.js (v18+) installato.

### Installazione e Avvio
1. Entra nella cartella `frontend`:
   ```bash
   cd frontend
   ```

2. Installa i pacchetti npm:
   ```bash
   npm install
   ```

3. Avvia il server di sviluppo Vite:
   ```bash
   npm run dev
   ```

L'applicazione sarà accessibile nel browser su `http://localhost:5173`.
