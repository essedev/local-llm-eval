#!/usr/bin/env bash
# Rilancia 5 roadmap cloud che il 25/05 hanno avuto task_3 e task_6 killati da SIGTERM
# Skip DeepSeek V4 Pro (era ok, exit 0 ovunque)
# Esecuzione: 5 modelli in parallelo, 6 task seriali per modello
# Robustezza: setsid + nohup per essere immune al kill del parent

set -o pipefail

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE="2026-05-25"
TASK_TIMEOUT="900"

MODEL_SLUGS=(
  "gpt-55"
  "opus-47"
  "sonnet-46"
  "gemini-35-flash"
  "deepseek-v4-flash"
)

MODEL_IDS=(
  "openai/gpt-5.5"
  "anthropic/claude-opus-4.7"
  "anthropic/claude-sonnet-4.6"
  "google/gemini-3.5-flash"
  "deepseek/deepseek-v4-flash"
)

TASK_TITLES=(
  ""
  "Task 1: Backend FastAPI scaffold"
  "Task 2: Schema SQLite"
  "Task 3: API CRUD"
  "Task 4: Frontend React+Vite scaffold"
  "Task 5: UI integrazione in App.jsx"
  "Task 6: Verifica E2E"
)

read -r -d '' TASK_PROMPT_1 <<'EOF' || true
Crea un progetto FastAPI in una sottocartella backend/ di questa cartella di lavoro.
Usa 'uv init backend' per generare il progetto Python (non scrivere pyproject.toml a mano).
Aggiungi le dipendenze: cd backend && uv add fastapi uvicorn.
In backend/main.py crea un'app FastAPI con titolo esatto "BookTrack API".
L'app deve essere importabile come 'from main import app'.
Verifica con: cd backend && uv run python -c "from main import app; print(app.title)" che stampi "BookTrack API".
Fermati qui, non andare oltre questo task.
EOF

read -r -d '' TASK_PROMPT_2 <<'EOF' || true
Nella cartella backend/ del progetto esistente, crea il modello dati per Book e l'inizializzazione database SQLite.
File da creare: backend/models.py, backend/database.py, backend/schema.sql.
La tabella books ha 4 colonne: id (INTEGER PRIMARY KEY AUTOINCREMENT), title (TEXT NOT NULL), author (TEXT NOT NULL), status (TEXT NOT NULL CHECK (status IN ('to-read','reading','done'))).
backend/database.py deve esportare una funzione get_connection() e una init_db() che esegue schema.sql.
backend/models.py deve avere classi Pydantic Book, BookCreate, BookUpdate.
Verifica con: cd backend && uv run python -c "from database import init_db; init_db()" && sqlite3 books.db ".schema books" che mostri la tabella.
Fermati qui, non andare oltre questo task.
EOF

read -r -d '' TASK_PROMPT_3 <<'EOF' || true
PRIMA leggi i file esistenti: backend/main.py, backend/models.py, backend/database.py.
POI implementa gli endpoint CRUD nel backend.
File da creare/modificare: backend/main.py (modifica), backend/routes/books.py (nuovo).
Endpoint richiesti:
- GET /books: ritorna lista di tutti i books
- POST /books: crea book, ritorna 201 con il nuovo book
- PATCH /books/{id}: aggiorna lo status di un book
- DELETE /books/{id}: elimina un book
main.py deve includere il router di routes/books.py.
Inizializza il db all'avvio (chiama init_db()).
Verifica: cd backend && uv run uvicorn main:app & sleep 3 && curl -s -X POST http://localhost:8000/books -H "Content-Type: application/json" -d '{"title":"Test","author":"Test","status":"to-read"}' deve ritornare 201 con il book creato.
Fermati qui, non andare oltre questo task.
EOF

read -r -d '' TASK_PROMPT_4 <<'EOF' || true
Crea un progetto React+Vite in una sottocartella frontend/ di questa cartella di lavoro.
Usa: pnpm create vite frontend --template react.
Poi cd frontend && pnpm install.
NON modificare ancora src/App.jsx in questo task (sara' Task 5). Lascia il template di default.
Verifica: cd frontend && pnpm run build esce con exit code 0.
Fermati qui, non andare oltre questo task.
EOF

read -r -d '' TASK_PROMPT_5 <<'EOF' || true
ATTENZIONE: questo e' il task di INTEGRAZIONE. Leggi prima i file esistenti.
PRIMA leggi: frontend/src/App.jsx (e' il template default di Vite con contatore e logo, devi sostituirlo), frontend/src/main.jsx, frontend/index.html.

Adesso modifica il frontend cosi':
1. Crea frontend/src/api.js con tre funzioni: listBooks(), createBook(book), updateBookStatus(id, status). Tutte chiamano http://localhost:8000/books con fetch.
2. Crea frontend/src/components/BookList.jsx: componente che chiama listBooks() in useEffect, mostra i books in una lista. Esporta default.
3. Crea frontend/src/components/BookForm.jsx: componente con form (input titolo, input autore, select status). On submit chiama createBook(). Esporta default.
4. MODIFICA frontend/src/App.jsx: rimuovi TUTTO il contenuto default Vite (contatore, logo react, logo vite, "Edit src/App.jsx", "Count is"). Sostituisci con un componente App che importa BookList e BookForm e li mostra. Deve esserci un h1 con "BookTrack" o "I miei libri" o simile.

Verifica: cat frontend/src/App.jsx | grep -E "BookList|BookForm" deve trovare entrambi; cat frontend/src/App.jsx | grep -E "count, setCount|Edit src/App\.jsx|Count is" NON deve trovare nulla; cd frontend && pnpm run build esce 0.
Fermati qui, non andare oltre questo task.
EOF

read -r -d '' TASK_PROMPT_6 <<'EOF' || true
Verifica finale end-to-end.
Avvia il backend in background: cd backend && uv run uvicorn main:app &
Avvia il frontend in background: cd frontend && pnpm run dev &
Aspetta 5 secondi che siano up.

Test:
1. curl -s http://localhost:8000/books deve ritornare 200 con JSON array (puo' essere vuoto).
2. curl -s http://localhost:5173 deve ritornare 200 con HTML che contiene "BookTrack" o "Libri".

Quando i test passano, ferma backend e frontend (kill dei processi).
Crea un README.md in radice con istruzioni di avvio.
EOF

TASK_PROMPTS=( "" "$TASK_PROMPT_1" "$TASK_PROMPT_2" "$TASK_PROMPT_3" "$TASK_PROMPT_4" "$TASK_PROMPT_5" "$TASK_PROMPT_6" )

log() {
  echo "[$(date '+%H:%M:%S')] $*"
}

run_roadmap_chain() {
  local slug="$1"
  local model_id="$2"
  local sandbox="$EVAL_DIR/cloud-${slug}-booktrack-roadmap-FIX-${DATE}"

  log "=== START $slug ($model_id) → $sandbox ==="
  rm -rf "$sandbox"
  mkdir -p "$sandbox"
  cd "$sandbox" || return 1

  local chain_start=$(date +%s)

  for task_num in 1 2 3 4 5 6; do
    local prompt="${TASK_PROMPTS[$task_num]}"
    local title="${TASK_TITLES[$task_num]}"
    local task_start=$(date +%s)
    log "  $slug $title"

    timeout "$TASK_TIMEOUT" pi -p \
      --provider openrouter \
      --model "$model_id" \
      --no-skills --no-extensions --no-prompt-templates --no-context-files \
      --mode json \
      --session-dir "$sandbox/sessions-task-${task_num}" \
      "$prompt" \
      > "$sandbox/turn-${task_num}.jsonl" 2> "$sandbox/turn-${task_num}.stderr"

    local task_exit=$?
    local task_end=$(date +%s)
    local task_dur=$((task_end - task_start))
    log "  $slug task_$task_num exit=$task_exit dur=${task_dur}s"
    echo "task_${task_num}_exit=$task_exit" >> "$sandbox/METRICS.md"
    echo "task_${task_num}_dur_seconds=$task_dur" >> "$sandbox/METRICS.md"
  done

  local chain_end=$(date +%s)
  local chain_dur=$((chain_end - chain_start))
  echo "model=$model_id" >> "$sandbox/METRICS.md"
  echo "mode=roadmap-fix" >> "$sandbox/METRICS.md"
  echo "duration_seconds=$chain_dur" >> "$sandbox/METRICS.md"
  log "=== END $slug dur=${chain_dur}s ==="
}

GLOBAL_START=$(date +%s)
log "Launching 5 roadmap chains in parallel (setsid-protected parent)"

pids=()
for i in "${!MODEL_SLUGS[@]}"; do
  slug="${MODEL_SLUGS[$i]}"
  model_id="${MODEL_IDS[$i]}"
  run_roadmap_chain "$slug" "$model_id" &
  pids+=($!)
done

log "PIDs: ${pids[*]}"
log "Waiting..."

for pid in "${pids[@]}"; do
  wait "$pid"
done

GLOBAL_END=$(date +%s)
TOTAL=$((GLOBAL_END - GLOBAL_START))
log "All 5 chains done in ${TOTAL}s"
