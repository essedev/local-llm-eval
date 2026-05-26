#!/usr/bin/env bash
# Orchestration script for experiment 2026-05-23 (roadmap-a-pezzi vs model size)
# Reference: PLAN-2026-05-23-roadmap-vs-model-size.md

set -o pipefail

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE="2026-05-23"
MLX_HOST="127.0.0.1"
MLX_PORT="1234"
MLX_LOG="/tmp/mlx-server-$DATE.log"
MLX_PID_FILE="/tmp/mlx-server-$DATE.pid"
TASK_TIMEOUT="900"
SERVER_READY_TIMEOUT="180"

# Indexed parallel arrays (evita problemi associativi con bash + dash + digits)
# slug, model_id, chat_template_args, sandbox_name
# Mantengo l'ordine small-to-big per minimizzare memory pressure all'inizio
MODEL_SLUGS=(
  "qwen3_14b"
  "qwen3_coder_30b"
  "glm47_flash"
  "qwen36_35b"
)

MODEL_IDS=(
  "Qwen/Qwen3-14B-MLX-4bit"
  "/Users/doppia/.lmstudio/models/lmstudio-community/Qwen3-Coder-30B-A3B-Instruct-MLX-4bit"
  "/Users/doppia/.lmstudio/models/lmstudio-community/GLM-4.7-Flash-MLX-4bit"
  "/Users/doppia/.lmstudio/models/unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit"
)

# chat-template-args opzionale (es. disabilitare thinking). Stringa vuota = niente
MODEL_CHAT_ARGS=(
  ""
  ""
  '{"enable_thinking":false}'
  '{"enable_thinking":false}'
)

MODEL_SANDBOX_NAMES=(
  "qwen3-14b-booktrack-roadmap-v2-${DATE}"
  "qwen3-coder-30b-booktrack-roadmap-v2-${DATE}"
  "glm47-flash-booktrack-roadmap-v2-${DATE}"
  "qwen36-35b-booktrack-roadmap-v2-${DATE}"
)

# Trova l'index di un slug
slug_index() {
  local target="$1"
  local i
  for i in "${!MODEL_SLUGS[@]}"; do
    if [ "${MODEL_SLUGS[$i]}" = "$target" ]; then
      echo $i
      return 0
    fi
  done
  echo -1
  return 1
}

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

Verifica: cat frontend/src/App.jsx | grep -E "BookList|BookForm" deve trovare entrambi; cat frontend/src/App.jsx | grep -E "count, setCount|Edit src/App.jsx|Count is" NON deve trovare nulla; cd frontend && pnpm run build esce 0.
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

verify_task_1() {
  local sb="$1"
  [ -d "$sb/backend" ] || return 1
  cd "$sb/backend" || return 1
  uv run python -c "from main import app; assert app.title == 'BookTrack API'" 2>&1 | tee "$sb/verify-1.log"
  return ${PIPESTATUS[0]}
}

verify_task_2() {
  local sb="$1"
  cd "$sb/backend" 2>/dev/null || return 1
  [ -f models.py ] && [ -f database.py ] && [ -f schema.sql ] || return 1
  uv run python -c "from database import init_db; init_db()" 2>&1 | tee -a "$sb/verify-2.log"
  sqlite3 books.db ".schema books" 2>&1 | tee -a "$sb/verify-2.log" | grep -q "title.*TEXT"
}

verify_task_3() {
  local sb="$1"
  cd "$sb/backend" 2>/dev/null || return 1
  pkill -f "uvicorn main:app" 2>/dev/null || true
  sleep 1
  uv run uvicorn main:app --port 8000 > /tmp/uvicorn-$DATE.log 2>&1 &
  local pid=$!
  sleep 5
  local status=0
  curl -s -o /tmp/post-resp -w "%{http_code}" -X POST http://localhost:8000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"Test","author":"Test","status":"to-read"}' 2>&1 | tee "$sb/verify-3.log" | grep -q "^201" || status=1
  kill $pid 2>/dev/null || true
  sleep 1
  return $status
}

verify_task_4() {
  local sb="$1"
  [ -d "$sb/frontend" ] || return 1
  cd "$sb/frontend" || return 1
  pnpm run build > "$sb/verify-4.log" 2>&1
}

verify_task_5() {
  local sb="$1"
  local app="$sb/frontend/src/App.jsx"
  [ -f "$app" ] || return 1
  local status=0
  > "$sb/verify-5.log"
  grep -q "BookList" "$app" || { echo "App.jsx non importa BookList" >> "$sb/verify-5.log"; status=1; }
  grep -q "BookForm" "$app" || { echo "App.jsx non importa BookForm" >> "$sb/verify-5.log"; status=1; }
  if grep -qE "count, setCount|Edit src/App\.jsx|Count is" "$app"; then
    echo "App.jsx contiene ancora template default Vite" >> "$sb/verify-5.log"
    status=1
  fi
  ( cd "$sb/frontend" && pnpm run build >> "$sb/verify-5.log" 2>&1 ) || status=1
  return $status
}

verify_task_6() {
  local sb="$1"
  pkill -f "uvicorn main:app" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  sleep 1
  ( cd "$sb/backend" && uv run uvicorn main:app --port 8000 > /tmp/uvicorn-$DATE.log 2>&1 ) &
  local be_pid=$!
  ( cd "$sb/frontend" && pnpm run dev --port 5173 > /tmp/vite-$DATE.log 2>&1 ) &
  local fe_pid=$!
  sleep 10
  local status=0
  > "$sb/verify-6.log"
  curl -s -o /tmp/get-books -w "%{http_code}" http://localhost:8000/books 2>&1 | tee -a "$sb/verify-6.log" | grep -q "^200" || status=1
  curl -s -o /tmp/get-frontend -w "%{http_code}" http://localhost:5173 2>&1 | tee -a "$sb/verify-6.log" | grep -q "^200" || status=1
  if ! grep -qE "BookTrack|Libri|i miei libri" /tmp/get-frontend 2>/dev/null; then
    echo "HTML frontend non contiene BookTrack/Libri" >> "$sb/verify-6.log"
    status=1
  fi
  kill $be_pid $fe_pid 2>/dev/null || true
  pkill -f "uvicorn main:app" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  sleep 1
  return $status
}

count_corruption() {
  local sb="$1"
  local count=0
  if [ -d "$sb/backend" ] || [ -d "$sb/frontend" ]; then
    count=$(find "$sb/backend" "$sb/frontend" -type f \( -name "*.py" -o -name "*.jsx" -o -name "*.js" -o -name "*.json" -o -name "*.toml" -o -name "*.txt" \) 2>/dev/null \
      -not -path "*/node_modules/*" -not -path "*/.venv/*" -not -path "*/__pycache__/*" \
      -exec grep -lE "if2 \(|useState\(true2|bg-(gray|blue|green)-7 5|[0-9]+\.[0-9]+\.[0-9]+\.5\.5\.5|127\.02\.5" {} \; 2>/dev/null | wc -l | tr -d ' ')
  fi
  echo $count
}

count_files() {
  local sb="$1"
  find "$sb" -type f \
    -not -path "*/node_modules/*" -not -path "*/.venv/*" -not -path "*/__pycache__/*" \
    -not -path "*/sessions*" -not -name "turn-*.jsonl" -not -name "turn-*.stderr" \
    -not -name "verify-*.log" -not -name "METRICS.md" -not -name "PLAN.md" \
    -not -name "task-results.csv" \
    2>/dev/null | wc -l | tr -d ' '
}

log() {
  echo "[$(date '+%H:%M:%S')] $*" | tee -a "$EVAL_DIR/run-2026-05-23.log"
}

check_memory() {
  local free_gb=$(vm_stat | awk '/^Pages free:/{free=$3} /^Pages inactive:/{inactive=$3} /^Pages speculative:/{spec=$3} END {
    printf "%.1f", ((free+inactive+spec) * 16384) / (1024*1024*1024)
  }' | tr -d '.')
  local free_real=$(vm_stat | awk '/^Pages free:/{free=$3} /^Pages inactive:/{inactive=$3} /^Pages speculative:/{spec=$3} END {
    printf "%.1f", ((free+inactive+spec) * 16384) / (1024*1024*1024)
  }')
  log "RAM free+reclaimable: ${free_real} GB"
}

stop_server() {
  if [ -f "$MLX_PID_FILE" ]; then
    kill "$(cat "$MLX_PID_FILE")" 2>/dev/null || true
    rm -f "$MLX_PID_FILE"
  fi
  pkill -f "mlx_lm.server" 2>/dev/null || true
  sleep 4
}

start_server() {
  local model_id="$1"
  local chat_args="$2"
  log "Avvio mlx_lm.server: $model_id (chat_args: ${chat_args:-none})"

  local extra_args=()
  if [ -n "$chat_args" ]; then
    extra_args=(--chat-template-args "$chat_args")
  fi

  nohup mlx_lm.server \
    --model "$model_id" \
    --host "$MLX_HOST" --port "$MLX_PORT" \
    --log-level INFO \
    --temp 0.0 \
    --max-tokens 8192 \
    --prefill-step-size 2048 \
    "${extra_args[@]}" \
    > "$MLX_LOG" 2>&1 &
  local pid=$!
  echo $pid > "$MLX_PID_FILE"
  log "PID: $pid"
  local elapsed=0
  while [ $elapsed -lt $SERVER_READY_TIMEOUT ]; do
    if curl -s --max-time 3 "http://$MLX_HOST:$MLX_PORT/v1/models" > /dev/null 2>&1; then
      log "Server ready dopo ${elapsed}s"
      return 0
    fi
    sleep 3
    elapsed=$((elapsed + 3))
  done
  log "ERROR: server non pronto dopo ${SERVER_READY_TIMEOUT}s"
  tail -30 "$MLX_LOG"
  return 1
}

run_task() {
  local sb="$1"
  local task_num="$2"
  local model_id="$3"
  local prompt="${TASK_PROMPTS[$task_num]}"
  local session_dir="$sb/sessions-task-$task_num"
  mkdir -p "$session_dir"

  log "  Task $task_num: ${TASK_TITLES[$task_num]}"
  local t_start=$(date +%s)

  cd "$sb"
  timeout "$TASK_TIMEOUT" pi -p \
    --provider mlx-local --model "$model_id" \
    --no-skills --no-extensions --no-prompt-templates --no-context-files \
    --mode json --session-dir "$session_dir" \
    "$prompt" > "$sb/turn-${task_num}.jsonl" 2> "$sb/turn-${task_num}.stderr"
  local pi_exit=$?

  local t_end=$(date +%s)
  local elapsed=$((t_end - t_start))
  log "  Pi exit: $pi_exit (in ${elapsed}s)"

  local verify_status=1
  "verify_task_${task_num}" "$sb" && verify_status=0
  log "  Verify: $([ $verify_status -eq 0 ] && echo PASS || echo FAIL)"

  echo "$task_num,$pi_exit,$verify_status,$elapsed" >> "$sb/task-results.csv"
}

run_model() {
  local idx="$1"
  local slug="${MODEL_SLUGS[$idx]}"
  local model_id="${MODEL_IDS[$idx]}"
  local chat_args="${MODEL_CHAT_ARGS[$idx]}"
  local sandbox_name="${MODEL_SANDBOX_NAMES[$idx]}"
  local sb="$EVAL_DIR/$sandbox_name"

  log "=================================================="
  log "MODEL: $slug  ($model_id)"
  log "=================================================="

  if [ -d "$sb" ]; then
    log "Sandbox esiste, skip: $sb"
    return 0
  fi

  mkdir -p "$sb"
  cp "$EVAL_DIR/PLAN-2026-05-23-roadmap-vs-model-size.md" "$sb/PLAN.md"
  echo "task_num,pi_exit,verify_status,elapsed_s" > "$sb/task-results.csv"

  stop_server
  check_memory
  if ! start_server "$model_id" "$chat_args"; then
    log "Server failed, skip $slug"
    return 1
  fi

  local model_start=$(date +%s)
  for task in 1 2 3 4 5 6; do
    run_task "$sb" "$task" "$model_id" || true
  done
  local model_end=$(date +%s)
  local model_elapsed=$((model_end - model_start))

  stop_server

  local corruption=$(count_corruption "$sb")
  local files=$(count_files "$sb")
  local passed=$(awk -F, 'NR>1 && $3==0 {n++} END {print n+0}' "$sb/task-results.csv")
  local total=$(awk -F, 'NR>1' "$sb/task-results.csv" | wc -l | tr -d ' ')

  cat > "$sb/METRICS.md" <<METEOF
# Metrics for $slug

- Modello: $model_id
- Chat args: ${chat_args:-none}
- Wall clock totale: ${model_elapsed}s ($((model_elapsed / 60)) min)
- Task passati: $passed / $total
- File generati: $files
- Corruption count: $corruption

## Per-task detail

\`\`\`csv
$(cat "$sb/task-results.csv")
\`\`\`
METEOF

  log "MODEL $slug DONE: $passed/$total task, $corruption corruption, ${model_elapsed}s"
}

compile_results() {
  log "Compilazione RESULTS-$DATE.md"
  local out="$EVAL_DIR/RESULTS-$DATE.md"
  cat > "$out" <<EOF
# RESULTS - Esperimento $DATE - Roadmap-a-pezzi vs model size

Risultati comparativi. Plan in PLAN-$DATE-roadmap-vs-model-size.md.

## Tabella riepilogo

| Modello | Task passati | File generati | Corruption | Wall clock |
|---|---|---|---|---|
EOF
  local i
  for i in "${!MODEL_SLUGS[@]}"; do
    local slug="${MODEL_SLUGS[$i]}"
    local sandbox_name="${MODEL_SANDBOX_NAMES[$i]}"
    local sb="$EVAL_DIR/$sandbox_name"
    if [ -f "$sb/METRICS.md" ]; then
      local passed=$(grep "^- Task passati" "$sb/METRICS.md" | sed 's/^- Task passati: //')
      local files=$(grep "^- File generati" "$sb/METRICS.md" | awk '{print $4}')
      local corr=$(grep "^- Corruption count" "$sb/METRICS.md" | awk '{print $4}')
      local wc=$(grep "^- Wall clock totale" "$sb/METRICS.md" | sed 's/^- Wall clock totale: //')
      echo "| $slug | $passed | $files | $corr | $wc |" >> "$out"
    else
      echo "| $slug | NOT RUN | - | - | - |" >> "$out"
    fi
  done
  echo >> "$out"
  echo "## Sandbox per dettagli" >> "$out"
  echo >> "$out"
  for i in "${!MODEL_SLUGS[@]}"; do
    echo "- \`${MODEL_SANDBOX_NAMES[$i]}/METRICS.md\`" >> "$out"
  done
  log "RESULTS scritti in $out"
}

# Main
ARG="${1:-}"

if [ "$ARG" = "--dry-run" ]; then
  log "DRY-RUN check"
  check_memory
  for i in "${!MODEL_SLUGS[@]}"; do
    log "  [${MODEL_SLUGS[$i]}] ${MODEL_IDS[$i]} (chat_args: ${MODEL_CHAT_ARGS[$i]:-none})"
  done
  log "OK dry-run. Per partire: bash $(basename $0)"
  exit 0
fi

log "==== ESPERIMENTO $DATE INIZIATO ===="
check_memory

if [ -n "$ARG" ]; then
  idx=$(slug_index "$ARG")
  if [ "$idx" = "-1" ]; then
    log "ERROR: slug sconosciuto: $ARG"
    log "Disponibili: ${MODEL_SLUGS[@]}"
    exit 1
  fi
  run_model "$idx"
else
  for i in "${!MODEL_SLUGS[@]}"; do
    run_model "$i"
  done
fi

compile_results
log "==== ESPERIMENTO COMPLETATO ===="
