#!/usr/bin/env bash
# Esperimento monolithic 2026-05-25 - stesso prompt singolo di 19/05
# Misura: quanti dei 6 task del PLAN il modello completa "in libera"
# Reference: confronto vs roadmap-a-pezzi (2026-05-23)

set -o pipefail

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE="2026-05-25"
MLX_HOST="127.0.0.1"
MLX_PORT="1234"
MLX_LOG="/tmp/mlx-server-$DATE.log"
MLX_PID_FILE="/tmp/mlx-server-$DATE.pid"
PI_TIMEOUT="1800"   # 30 min per la singola invocazione monolithic
SERVER_READY_TIMEOUT="180"

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

MODEL_CHAT_ARGS=(
  ""
  ""
  '{"enable_thinking":false}'
  '{"enable_thinking":false}'
)

MODEL_SANDBOX_NAMES=(
  "qwen3-14b-booktrack-monolithic-${DATE}"
  "qwen3-coder-30b-booktrack-monolithic-${DATE}"
  "glm47-flash-booktrack-monolithic-${DATE}"
  "qwen36-35b-booktrack-monolithic-${DATE}"
)

# Prompt originale del 19/05 (stesso testo verbatim)
read -r -d '' MONOLITHIC_PROMPT <<'EOF' || true
Voglio un'app per tracciare i libri che leggo. Backend FastAPI con SQLite, frontend React + Vite. Devo poter aggiungere un libro (titolo, autore, status: to-read/reading/done), vedere la lista, cambiare lo status. Niente login, e' solo per me locale. Genera tutto in questa cartella, procedi senza chiedere conferme.
EOF

# ----- verify functions (cloned dal run roadmap, applicate a fine generazione) -----

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
  [ -f models.py ] && [ -f database.py ] || return 1
  uv run python -c "from database import init_db; init_db()" 2>&1 | tee -a "$sb/verify-2.log"
  [ -f books.db ] && sqlite3 books.db ".schema books" 2>&1 | tee -a "$sb/verify-2.log" | grep -q "title.*TEXT"
}

verify_task_3() {
  local sb="$1"
  cd "$sb/backend" 2>/dev/null || return 1
  pkill -f "uvicorn main:app" 2>/dev/null || true
  sleep 1
  uv run uvicorn main:app --port 8000 > /tmp/uvicorn-mono-$DATE.log 2>&1 &
  local pid=$!
  sleep 5
  local status=0
  # provo prima senza, poi con trailing slash
  local code=$(curl -s -o /tmp/post-resp -w "%{http_code}" -X POST http://localhost:8000/books \
    -H "Content-Type: application/json" \
    -d '{"title":"Test","author":"Test","status":"to-read"}' 2>&1)
  echo "POST /books -> $code" >> "$sb/verify-3.log"
  if [ "$code" != "201" ]; then
    code=$(curl -s -o /tmp/post-resp -w "%{http_code}" -X POST http://localhost:8000/books/ \
      -H "Content-Type: application/json" \
      -d '{"title":"Test","author":"Test","status":"to-read"}' 2>&1)
    echo "POST /books/ -> $code" >> "$sb/verify-3.log"
  fi
  [ "$code" = "201" ] || status=1
  kill $pid 2>/dev/null || true
  sleep 1
  return $status
}

verify_task_4() {
  local sb="$1"
  [ -d "$sb/frontend" ] || return 1
  cd "$sb/frontend" || return 1
  pnpm install > "$sb/verify-4.log" 2>&1 || true
  pnpm run build >> "$sb/verify-4.log" 2>&1
}

verify_task_5() {
  local sb="$1"
  local app="$sb/frontend/src/App.jsx"
  [ -f "$app" ] || return 1
  local status=0
  > "$sb/verify-5.log"
  grep -q "BookList" "$app" || { echo "App.jsx non importa BookList" >> "$sb/verify-5.log"; status=1; }
  grep -q "BookForm\|BookCreate\|AddBook" "$app" || { echo "App.jsx non importa BookForm/AddBook" >> "$sb/verify-5.log"; status=1; }
  if grep -qE "count, setCount|Edit src/App\.jsx|Count is" "$app"; then
    echo "App.jsx contiene ancora template default Vite" >> "$sb/verify-5.log"
    status=1
  fi
  return $status
}

verify_task_6() {
  local sb="$1"
  pkill -f "uvicorn main:app" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  sleep 1
  ( cd "$sb/backend" && uv run uvicorn main:app --port 8000 > /tmp/uvicorn-mono-$DATE.log 2>&1 ) &
  local be_pid=$!
  ( cd "$sb/frontend" && pnpm run dev --port 5173 > /tmp/vite-mono-$DATE.log 2>&1 ) &
  local fe_pid=$!
  sleep 10
  local status=0
  > "$sb/verify-6.log"
  # backend: provo entrambe le forme
  local be_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/books 2>&1)
  if [ "$be_code" != "200" ]; then
    be_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/books/ 2>&1)
  fi
  echo "backend code: $be_code" >> "$sb/verify-6.log"
  [ "$be_code" = "200" ] || status=1
  # frontend
  local fe_code=$(curl -s -o /tmp/get-frontend -w "%{http_code}" http://localhost:5173 2>&1)
  echo "frontend code: $fe_code" >> "$sb/verify-6.log"
  [ "$fe_code" = "200" ] || status=1
  # cerca BookTrack/Libri sia in HTML servito che nel bundle JS (per SPA)
  if grep -qE "BookTrack|Libri|i miei libri" /tmp/get-frontend 2>/dev/null; then
    echo "HTML contiene token (server-side)" >> "$sb/verify-6.log"
  elif find "$sb/frontend/dist/assets" -name "*.js" 2>/dev/null | xargs grep -lE "BookTrack|BookList|BookForm" 2>/dev/null | head -1 | grep -q .; then
    echo "Bundle JS contiene token (client-side ok)" >> "$sb/verify-6.log"
  else
    echo "Nessun token trovato ne HTML ne bundle" >> "$sb/verify-6.log"
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
    -not -name "verify-*.log" -not -name "METRICS.md" \
    2>/dev/null | wc -l | tr -d ' '
}

log() {
  echo "[$(date '+%H:%M:%S')] $*" | tee -a "$EVAL_DIR/run-monolithic-$DATE.log"
}

check_memory() {
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
  echo "$MONOLITHIC_PROMPT" > "$sb/PROMPT.txt"

  stop_server
  check_memory
  if ! start_server "$model_id" "$chat_args"; then
    log "Server failed, skip $slug"
    return 1
  fi

  log "Lancio Pi monolithic (single invocation, timeout ${PI_TIMEOUT}s)"
  local t_start=$(date +%s)
  local session_dir="$sb/sessions-mono"
  mkdir -p "$session_dir"

  cd "$sb"
  timeout "$PI_TIMEOUT" pi -p \
    --provider mlx-local --model "$model_id" \
    --no-skills --no-extensions --no-prompt-templates --no-context-files \
    --mode json --session-dir "$session_dir" \
    "$MONOLITHIC_PROMPT" > "$sb/turn-mono.jsonl" 2> "$sb/turn-mono.stderr"
  local pi_exit=$?
  local t_end=$(date +%s)
  local elapsed=$((t_end - t_start))
  log "Pi exit: $pi_exit (in ${elapsed}s = $((elapsed/60)) min)"

  # applico le 6 verifiche
  log "Esecuzione verifiche post-hoc"
  local pass_count=0
  for n in 1 2 3 4 5 6; do
    if "verify_task_${n}" "$sb"; then
      log "  Task $n: PASS"
      pass_count=$((pass_count + 1))
    else
      log "  Task $n: FAIL"
    fi
  done

  stop_server

  local corruption=$(count_corruption "$sb")
  local files=$(count_files "$sb")

  cat > "$sb/METRICS.md" <<METEOF
# Metrics for $slug (MONOLITHIC)

- Modello: $model_id
- Chat args: ${chat_args:-none}
- Pi exit: $pi_exit
- Wall clock generazione: ${elapsed}s ($((elapsed / 60)) min)
- Verifiche superate: $pass_count / 6
- File generati: $files
- Corruption count: $corruption
METEOF

  log "MODEL $slug DONE: $pass_count/6 verifiche, $corruption corruption, ${elapsed}s gen"
}

compile_results() {
  log "Compilazione RESULTS-monolithic-$DATE.md"
  local out="$EVAL_DIR/RESULTS-monolithic-$DATE.md"
  cat > "$out" <<EOF
# RESULTS - Esperimento monolithic $DATE

Single-prompt baseline da confrontare con roadmap-a-pezzi (RESULTS-2026-05-23.md).

## Tabella riepilogo

| Modello | Pi exit | Verifiche | File | Corruption | Wall clock |
|---|---|---|---|---|---|
EOF
  for i in "${!MODEL_SLUGS[@]}"; do
    local slug="${MODEL_SLUGS[$i]}"
    local sb="$EVAL_DIR/${MODEL_SANDBOX_NAMES[$i]}"
    if [ -f "$sb/METRICS.md" ]; then
      local exitc=$(grep "^- Pi exit" "$sb/METRICS.md" | awk '{print $4}')
      local passed=$(grep "^- Verifiche" "$sb/METRICS.md" | sed 's/^- Verifiche superate: //')
      local files=$(grep "^- File generati" "$sb/METRICS.md" | awk '{print $4}')
      local corr=$(grep "^- Corruption count" "$sb/METRICS.md" | awk '{print $4}')
      local wc=$(grep "^- Wall clock generazione" "$sb/METRICS.md" | sed 's/^- Wall clock generazione: //')
      echo "| $slug | $exitc | $passed | $files | $corr | $wc |" >> "$out"
    else
      echo "| $slug | NOT RUN | - | - | - | - |" >> "$out"
    fi
  done
  log "RESULTS scritti in $out"
}

ARG="${1:-}"
if [ "$ARG" = "--dry-run" ]; then
  log "DRY-RUN monolithic"
  check_memory
  for i in "${!MODEL_SLUGS[@]}"; do
    log "  [${MODEL_SLUGS[$i]}] ${MODEL_IDS[$i]}"
  done
  exit 0
fi

log "==== ESPERIMENTO MONOLITHIC $DATE INIZIATO ===="
check_memory

if [ -n "$ARG" ]; then
  idx=-1
  for i in "${!MODEL_SLUGS[@]}"; do
    [ "${MODEL_SLUGS[$i]}" = "$ARG" ] && idx=$i && break
  done
  if [ "$idx" = "-1" ]; then
    log "ERROR: slug sconosciuto: $ARG"
    exit 1
  fi
  run_model "$idx"
else
  for i in "${!MODEL_SLUGS[@]}"; do
    run_model "$i"
  done
fi

compile_results
log "==== ESPERIMENTO MONOLITHIC COMPLETATO ===="
