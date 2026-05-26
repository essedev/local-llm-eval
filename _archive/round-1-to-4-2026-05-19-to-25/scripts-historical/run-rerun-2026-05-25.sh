#!/usr/bin/env bash
# Rerun mirate del 2026-05-25: 2 run locali, sequenziali (memory pressure)
# - qwen3.6-35B monolithic (conferma 18/18 vincitore locale)
# - GLM-4.7-Flash monolithic (conferma pattern corruption -9)

set -o pipefail

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATE="2026-05-25"
MLX_HOST="127.0.0.1"
MLX_PORT="1234"
MLX_LOG="/tmp/mlx-server-rerun-$DATE.log"
MLX_PID_FILE="/tmp/mlx-server-rerun-$DATE.pid"
PI_TIMEOUT="1800"
SERVER_READY_TIMEOUT="180"

read -r -d '' MONOLITHIC_PROMPT <<'EOF' || true
Voglio un'app per tracciare i libri che leggo. Backend FastAPI con SQLite, frontend React + Vite. Devo poter aggiungere un libro (titolo, autore, status: to-read/reading/done), vedere la lista, cambiare lo status. Niente login, e' solo per me locale. Genera tutto in questa cartella, procedi senza chiedere conferme.
EOF

log() {
  echo "[$(date '+%H:%M:%S')] $*" | tee -a "$EVAL_DIR/run-rerun-$DATE.log"
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

run_rerun() {
  local slug="$1"
  local model_id="$2"
  local chat_args="$3"
  local sandbox_name="${slug}-booktrack-monolithic-RERUN-${DATE}"
  local sb="$EVAL_DIR/$sandbox_name"

  log "=================================================="
  log "RERUN MODEL: $slug  ($model_id)"
  log "=================================================="

  rm -rf "$sb"
  mkdir -p "$sb"
  echo "$MONOLITHIC_PROMPT" > "$sb/PROMPT.txt"

  start_server "$model_id" "$chat_args" || { log "Server avvio fallito, skip"; return 1; }

  local start_ts=$(date +%s)
  log "Pi start: $sb"
  cd "$sb" || return 1

  timeout "$PI_TIMEOUT" pi -p \
    --provider mlx-local \
    --model "$model_id" \
    --no-skills --no-extensions --no-prompt-templates --no-context-files \
    --mode json \
    --session-dir "$sb/sessions-mono" \
    "$MONOLITHIC_PROMPT" \
    > "$sb/turn-mono.jsonl" 2> "$sb/turn-mono.stderr"

  local exit_code=$?
  local end_ts=$(date +%s)
  local duration=$((end_ts - start_ts))

  log "Pi end: exit=$exit_code duration=${duration}s"

  echo "model=$model_id" > "$sb/METRICS.md"
  echo "mode=monolithic-rerun" >> "$sb/METRICS.md"
  echo "duration_seconds=$duration" >> "$sb/METRICS.md"
  echo "exit_code=$exit_code" >> "$sb/METRICS.md"
  echo "start_ts=$start_ts" >> "$sb/METRICS.md"
  echo "end_ts=$end_ts" >> "$sb/METRICS.md"

  stop_server
}

log "=========================="
log "Rerun mirate 2026-05-25"
log "=========================="

# 1) qwen3.6-35B monolithic rerun
run_rerun "qwen36-35b" \
  "/Users/doppia/.lmstudio/models/unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit" \
  '{"enable_thinking":false}'

# 2) GLM-4.7-Flash monolithic rerun
run_rerun "glm47-flash" \
  "/Users/doppia/.lmstudio/models/lmstudio-community/GLM-4.7-Flash-MLX-4bit" \
  '{"enable_thinking":false}'

log "Rerun complete"
