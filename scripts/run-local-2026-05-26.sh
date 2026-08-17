#!/usr/bin/env bash
# Round 5 - batch locale (4 modelli x 2 modalita) 2026-05-26
#
# Differenze rispetto agli script del round 4:
# - Entrambe le modalita (monolithic + roadmap) ricevono lo stesso SPEC come
#   --append-system-prompt @docs/SPEC.md, per isolare la variabile "decomposizione".
# - Roadmap = 6 invocazioni Pi separate con --session-dir nuova per ognuna
#   (context reset esplicito). Task 6 contiene istruzione di kill dei server in background.
# - Snapshot dello SPEC dentro ogni sandbox (SPEC-snapshot.md) per riproducibilita.
# - Sandbox in round-5-2026-05-26/ (preparato per archiviazione futura).
#
# Uso:
#   scripts/run-local-2026-05-26.sh                  # batch completo (4 modelli x 2 modi)
#   scripts/run-local-2026-05-26.sh --smoke          # solo qwen3_coder_30b (smoke test)
#   scripts/run-local-2026-05-26.sh <slug>           # un singolo modello (entrambi i modi)
#   scripts/run-local-2026-05-26.sh <slug> <modalita>  # un singolo modello in una sola modalita
#   scripts/run-local-2026-05-26.sh --dry-run        # stampa cosa farebbe e basta

set -o pipefail

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_DIR="$EVAL_DIR/scripts"
ROUND_DIR="$EVAL_DIR/round-5-2026-05-26"
SPEC_PATH="$EVAL_DIR/docs/SPEC.md"
DATE="2026-05-26"
MLX_HOST="127.0.0.1"
MLX_PORT="1234"
MLX_LOG="/tmp/mlx-server-$DATE.log"
MLX_PID_FILE="/tmp/mlx-server-$DATE.pid"
PI_TIMEOUT_MONO="1800"        # 30 min monolithic
PI_TIMEOUT_TASK="900"          # 15 min per ogni task della roadmap
SERVER_READY_TIMEOUT="180"

mkdir -p "$ROUND_DIR"

MODEL_SLUGS=(
  "qwen3_coder_30b"
  "qwen3_14b"
  "glm47_flash"
  "qwen36_35b"
)

MODEL_IDS=(
  "/Users/doppia/.lmstudio/models/lmstudio-community/Qwen3-Coder-30B-A3B-Instruct-MLX-4bit"
  "Qwen/Qwen3-14B-MLX-4bit"
  "/Users/doppia/.lmstudio/models/lmstudio-community/GLM-4.7-Flash-MLX-4bit"
  "/Users/doppia/.lmstudio/models/unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit"
)

MODEL_CHAT_ARGS=(
  ""
  ""
  '{"enable_thinking":false}'
  '{"enable_thinking":false}'
)

# ---------- prompts ----------

MONOLITHIC_PROMPT="Implementa l'app booktrack come descritta nello SPEC che ti e' stato fornito come system prompt addizionale. Tutto in questa cartella. Procedi."

# 6 task atomici - prompt utente di ognuno. SPEC e' iniettato come system prompt addizionale,
# quindi qui non duplichiamo i vincoli, solo l'obiettivo del task.
ROADMAP_PROMPTS=(
"Task 1/6: setup backend FastAPI scaffold.

Crea sottocartella backend/ con uv init backend, aggiungi fastapi e uvicorn come dipendenze con uv add. L'app FastAPI deve essere importabile (from main import app). Niente endpoint reali in questo task. PRIMA di scrivere, leggi i file esistenti nella cartella corrente per coerenza. Stesso scope, stessa cartella di lavoro."

"Task 2/6: schema database + modelli.

In backend/, definisci la tabella books (id, title, author, status) come specificato nello SPEC. Modelli Pydantic per request/response. Funzione init_db che crea il file SQLite e la tabella. Niente endpoint ancora. PRIMA di scrivere, leggi i file esistenti per coerenza con il task 1."

"Task 3/6: endpoint CRUD + cross-origin.

In backend/, implementa gli endpoint richiesti dallo SPEC (list, create, update status; delete e' opzionale). Configura la cross-origin verso il dev server frontend (porta 5173) come ritieni opportuno.

REGOLA CRITICA: backend/main.py esiste gia' dai task precedenti come placeholder. DEVI editarlo in place per aggiungere le route, NON creare un file nuovo accanto. A fine task, una grep '@app.' o 'include_router' su backend/main.py deve trovare le route richieste.

Avvia uvicorn brevemente per verifica POST/GET/PATCH effettiva sugli endpoint /books, poi killa il processo prima di terminare. PRIMA di scrivere, leggi backend/main.py, backend/database.py e backend/models.py per non duplicare strutture."

"Task 4/6: setup frontend React+Vite scaffold.

Crea sottocartella frontend/ con pnpm create vite frontend --template react. Esegui pnpm install. Verifica che pnpm run build abbia exit 0. Niente UI custom in questo task: solo lo scaffold pulito di Vite. PRIMA di scrivere, leggi cosa c'e' gia' nella cartella corrente."

"Task 5/6: integrazione UI completa.

In frontend/src/, sostituisci il template Vite con i componenti dell'app booktrack: client API verso il backend, BookList, BookForm, App che lega tutto. Lo status DEVE essere l'enum letterale dello SPEC (to-read, reading, done) identico al backend. Refresh immediato dopo create senza reload pagina. Stati di loading e error visibili. PRIMA di scrivere, leggi backend/ per assicurarti che gli enum coincidano e leggi i file frontend/ esistenti."

"Task 6/6: verifica E2E + README.

Avvia backend (uv run uvicorn main:app --port 8000) e frontend (pnpm run dev --port 5173) in background. Lo smoke test E2E DEVE colpire gli endpoint reali del backend (POST /books, GET /books), NON la root /. Esempio:

  curl -X POST http://localhost:8000/books -H 'Content-Type: application/json' -d '{\"title\":\"T\",\"author\":\"A\",\"status\":\"to-read\"}'
  curl http://localhost:8000/books

Verifica anche che il frontend risponda 200 su /. Dopo lo smoke test DEVI killare esplicitamente entrambi i processi che hai avviato (usa kill \$BE_PID e kill \$FE_PID, NON lasciare processi in background).

Scrivi un README.md nella cartella corrente con istruzioni: prerequisiti, come avviare BE, come avviare FE, come fermare. PRIMA di iniziare, leggi backend/ e frontend/ per sapere come avviare ogni pezzo."
)

# ---------- helpers ----------

log() {
  echo "[$(date '+%H:%M:%S')] $*" | tee -a "$SCRIPT_DIR/run-local-$DATE.log"
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
  log "  PID: $pid"
  local elapsed=0
  while [ $elapsed -lt $SERVER_READY_TIMEOUT ]; do
    if curl -s --max-time 3 "http://$MLX_HOST:$MLX_PORT/v1/models" > /dev/null 2>&1; then
      log "  Server ready dopo ${elapsed}s"
      return 0
    fi
    sleep 3
    elapsed=$((elapsed + 3))
  done
  log "  ERROR: server non pronto dopo ${SERVER_READY_TIMEOUT}s"
  tail -30 "$MLX_LOG" | sed 's/^/    /'
  return 1
}

count_files() {
  local sb="$1"
  find "$sb" -type f \
    -not -path "*/node_modules/*" -not -path "*/.venv/*" -not -path "*/__pycache__/*" \
    -not -path "*/sessions*" -not -name "turn-*.jsonl" -not -name "turn-*.stderr" \
    -not -name "METRICS.md" -not -name "SPEC-snapshot.md" -not -name "PROMPT*.txt" \
    2>/dev/null | wc -l | tr -d ' '
}

snapshot_spec() {
  local sb="$1"
  cp "$SPEC_PATH" "$sb/SPEC-snapshot.md"
}

# ---------- modalita: monolithic ----------

run_monolithic() {
  local slug="$1"
  local model_id="$2"
  local chat_args="$3"

  local sb="$ROUND_DIR/${slug}-booktrack-monolithic-${DATE}"
  if [ -d "$sb" ]; then
    log "  [monolithic] sandbox esiste, skip: $sb"
    return 0
  fi
  mkdir -p "$sb"
  snapshot_spec "$sb"
  echo "$MONOLITHIC_PROMPT" > "$sb/PROMPT.txt"

  log "  [monolithic] lancio Pi (timeout ${PI_TIMEOUT_MONO}s)"
  local t_start=$(date +%s)
  local session_dir="$sb/sessions-mono"
  mkdir -p "$session_dir"

  cd "$sb"
  timeout "$PI_TIMEOUT_MONO" pi -p \
    --provider mlx-local --model "$model_id" \
    --no-skills --no-extensions --no-prompt-templates --no-context-files \
    --append-system-prompt "@$SPEC_PATH" \
    --mode json --session-dir "$session_dir" \
    "$MONOLITHIC_PROMPT" > "$sb/turn-mono.jsonl" 2> "$sb/turn-mono.stderr"
  local pi_exit=$?
  local t_end=$(date +%s)
  local elapsed=$((t_end - t_start))
  log "  [monolithic] Pi exit: $pi_exit (in ${elapsed}s = $((elapsed/60)) min)"

  local files=$(count_files "$sb")
  cat > "$sb/METRICS.md" <<METEOF
# Metrics for $slug - monolithic

- Modello: $model_id
- Chat args: ${chat_args:-none}
- Pi exit: $pi_exit
- Wall clock: ${elapsed}s ($((elapsed / 60)) min)
- File generati: $files
- SPEC: vedi SPEC-snapshot.md
METEOF
}

# ---------- modalita: roadmap (6 task con context reset) ----------

run_roadmap() {
  local slug="$1"
  local model_id="$2"
  local chat_args="$3"

  local sb="$ROUND_DIR/${slug}-booktrack-roadmap-${DATE}"
  if [ -d "$sb" ]; then
    log "  [roadmap] sandbox esiste, skip: $sb"
    return 0
  fi
  mkdir -p "$sb"
  snapshot_spec "$sb"

  local total_start=$(date +%s)
  local task_metrics=""

  for n in 1 2 3 4 5 6; do
    local idx=$((n - 1))
    local prompt="${ROADMAP_PROMPTS[$idx]}"
    echo "$prompt" > "$sb/PROMPT-task-${n}.txt"

    local session_dir="$sb/sessions-task-${n}"
    mkdir -p "$session_dir"

    log "  [roadmap] task $n/6 lancio Pi (timeout ${PI_TIMEOUT_TASK}s)"
    local t_start=$(date +%s)

    cd "$sb"
    timeout "$PI_TIMEOUT_TASK" pi -p \
      --provider mlx-local --model "$model_id" \
      --no-skills --no-extensions --no-prompt-templates --no-context-files \
      --append-system-prompt "@$SPEC_PATH" \
      --mode json --session-dir "$session_dir" \
      "$prompt" > "$sb/turn-${n}.jsonl" 2> "$sb/turn-${n}.stderr"
    local pi_exit=$?
    local t_end=$(date +%s)
    local elapsed=$((t_end - t_start))
    log "    task $n exit: $pi_exit ($((elapsed))s)"
    task_metrics+="- task $n: exit=$pi_exit wall=${elapsed}s"$'\n'

    # safety net: se il task ha lasciato server in background, killali
    pkill -f "uvicorn main:app" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
  done

  local total_end=$(date +%s)
  local total_elapsed=$((total_end - total_start))
  local files=$(count_files "$sb")

  cat > "$sb/METRICS.md" <<METEOF
# Metrics for $slug - roadmap (6 task)

- Modello: $model_id
- Chat args: ${chat_args:-none}
- Wall clock totale: ${total_elapsed}s ($((total_elapsed / 60)) min)
- File generati: $files
- SPEC: vedi SPEC-snapshot.md

## Per task
$task_metrics
METEOF
}

# ---------- runner per un singolo modello ----------

run_model() {
  local idx="$1"
  local only_mode="$2"  # "" | "monolithic" | "roadmap"
  local slug="${MODEL_SLUGS[$idx]}"
  local model_id="${MODEL_IDS[$idx]}"
  local chat_args="${MODEL_CHAT_ARGS[$idx]}"

  log "=================================================="
  log "MODEL: $slug  ($model_id)"
  log "=================================================="

  stop_server
  check_memory
  if ! start_server "$model_id" "$chat_args"; then
    log "Server failed, skip $slug"
    return 1
  fi

  if [ -z "$only_mode" ] || [ "$only_mode" = "monolithic" ]; then
    run_monolithic "$slug" "$model_id" "$chat_args"
  fi
  if [ -z "$only_mode" ] || [ "$only_mode" = "roadmap" ]; then
    run_roadmap "$slug" "$model_id" "$chat_args"
  fi

  stop_server
  log "MODEL $slug done"
}

# ---------- entry point ----------

if [ ! -f "$SPEC_PATH" ]; then
  echo "ERROR: $SPEC_PATH non trovato"
  exit 1
fi

ARG1="${1:-}"
ARG2="${2:-}"

if [ "$ARG1" = "--dry-run" ]; then
  log "DRY-RUN local round 5"
  log "SPEC: $SPEC_PATH"
  log "Round dir: $ROUND_DIR"
  check_memory
  for i in "${!MODEL_SLUGS[@]}"; do
    log "  [${MODEL_SLUGS[$i]}] ${MODEL_IDS[$i]} (chat_args=${MODEL_CHAT_ARGS[$i]:-none})"
  done
  exit 0
fi

log "==== ROUND 5 LOCALE INIZIATO ($DATE) ===="
log "SPEC path: $SPEC_PATH"
log "Round dir: $ROUND_DIR"
check_memory

if [ "$ARG1" = "--smoke" ]; then
  # smoke = solo qwen3_coder_30b, entrambe le modalita
  for i in "${!MODEL_SLUGS[@]}"; do
    [ "${MODEL_SLUGS[$i]}" = "qwen3_coder_30b" ] && run_model "$i" ""
  done
elif [ -n "$ARG1" ]; then
  # singolo slug, eventualmente con modalita
  idx=-1
  for i in "${!MODEL_SLUGS[@]}"; do
    [ "${MODEL_SLUGS[$i]}" = "$ARG1" ] && idx=$i && break
  done
  if [ "$idx" = "-1" ]; then
    log "ERROR: slug sconosciuto: $ARG1"
    log "Slug validi: ${MODEL_SLUGS[*]}"
    exit 1
  fi
  if [ -n "$ARG2" ] && [ "$ARG2" != "monolithic" ] && [ "$ARG2" != "roadmap" ]; then
    log "ERROR: modalita sconosciuta: $ARG2 (usa 'monolithic' o 'roadmap')"
    exit 1
  fi
  run_model "$idx" "$ARG2"
else
  # batch completo: tutti i modelli in entrambe le modalita
  for i in "${!MODEL_SLUGS[@]}"; do
    run_model "$i" ""
  done
fi

log "==== ROUND 5 LOCALE COMPLETATO ===="
