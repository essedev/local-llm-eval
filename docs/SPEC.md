# SPEC - Contratto del task booktrack

Documento di specifica che descrive **cosa serve fare**, non **come scriverlo**. Inietta in ogni invocazione di Pi come `--append-system-prompt @docs/SPEC.md`. Vale identico per la modalità monolithic e per ogni singolo task della roadmap.

---

## Cosa è booktrack

Una micro-app locale per tracciare i libri che leggo. Niente login, niente multi-utente, niente filtri avanzati. Backend Python + frontend JavaScript, eseguibili sulla mia macchina.

## Funzionalità minime

1. Aggiungere un libro indicando titolo, autore e status iniziale.
2. Vedere la lista dei libri esistenti.
3. Cambiare lo status di un libro esistente.

L'eliminazione di un libro non è funzionalità minima richiesta. Se la implementi, esponi sia il backend sia la UI.

## Vincoli di dominio

- Lo status di un libro è un enum letterale: `to-read`, `reading`, `done`. Nessun altro valore è ammesso, né in DB, né nel payload API, né nelle option della UI. Nessuna traduzione in italiano dei valori interni: l'enum è letterale, le etichette mostrate all'utente possono essere tradotte ma il valore di stato che viaggia BE↔FE è quello indicato.
- Ogni libro ha un id intero generato dal backend.
- Field names del payload e del response BE↔FE: `id`, `title`, `author`, `status`. Letterali, in inglese.

## Vincoli tecnici

- Backend in **FastAPI con SQLite**, esposto sulla porta `8000`.
- Frontend in **React + Vite**, porta Vite di default `5173`.
- Backend e frontend girano su porte diverse: l'integrazione cross-origin va risolta in qualche modo (middleware sul backend, oppure proxy del dev server, oppure rewrite delle URL — la scelta è tua, basta che funzioni).
- Persistenza: il database SQLite vive sul disco, nei file del backend. Sopravvive a un riavvio.
- Il frontend deve riflettere immediatamente le modifiche fatte: un libro appena creato dev'essere visibile senza forzare un reload della pagina.

## Vincoli di code quality minimi

- Il backend distingue errori applicativi (404 su id inesistente, 422 o 400 su body invalido).
- Il frontend mostra all'utente almeno uno stato di caricamento e uno stato di errore quando una chiamata API fallisce.
- Gli endpoint del backend devono essere registrati in `backend/main.py` (direttamente, o via `APIRouter` incluso con `app.include_router`). `main.py` non deve restare un placeholder vuoto: a fine task, una grep di `@app.` o `include_router` su `main.py` deve trovare le route richieste dallo SPEC.

## Vincoli sui manifest dei pacchetti (regola HARD)

Non scrivere mai a mano i file di manifest e di lock di Python e Node:

- `pyproject.toml`, `uv.lock`, `requirements.txt`
- `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`

Devi ottenere e modificare questi file SOLO tramite i comandi ufficiali:

- Python: `uv init <name>` per il bootstrap, `uv add <pkg>` / `uv remove <pkg>` per le dipendenze.
- Node: `pnpm create vite <name> --template react` per il bootstrap, `pnpm add <pkg>` / `pnpm remove <pkg>` per le dipendenze.

Le versioni delle dipendenze sono quelle che escono dai comandi ufficiali al momento dell'esecuzione: non inventare numeri di versione e non copiare versioni dalla tua memoria. Se non riesci a eseguire questi comandi (es. shell non disponibile, errore di rete), fermati e segnala il problema invece di scrivere il manifest a mano.

## Cosa è esplicitamente fuori scope

- Login, registrazione, multi-utente
- Filtri o ricerca avanzata
- Importazione massiva, esportazione, sync esterni
- Tests automatici (a meno che il modello non li voglia per debug suo)
- Deploy in produzione

## Come è strutturata la repo (scaffold-based)

Lavora nella cartella corrente (il cwd del processo). Crea due sottocartelle `backend/` e `frontend/` direttamente lì, NON dentro una sottocartella `booktrack/` intermedia.

```
<cwd>/
├── backend/        creato da `uv init backend`
└── frontend/       creato da `pnpm create vite frontend --template react`
```

Dentro `backend/` e `frontend/` la struttura viene da `uv` e da Vite: non inventarne una alternativa, non duplicare cartelle (no `frontend/booktrack/` annidato, no `backend/frontend/` vuoto), non spostare la radice del progetto in una sottocartella aggiuntiva.
