#!/usr/bin/env bash
# Benchmark del prefill (lettura del prompt), separato dal decode.
#
# Perché serve: decode e prefill hanno colli di bottiglia diversi. Il decode è
# memory-bound (rilegge i pesi a ogni token), il prefill elabora molti token in
# parallelo e riusa i pesi già letti, quindi pesa il calcolo.
#
# Nel bench di throughput il prefill era misurato su 79 token, cioè una frazione
# di secondo: numero dominato dal rumore (varianza oltre 2x tra i run). Qui si usa
# un prompt di alcune migliaia di token e pochi token di output, per isolare il
# prefill e renderlo misurabile.
#
# Uso:
#   scripts/bench-prefill.sh              # 3 run per modello
#   scripts/bench-prefill.sh --runs 5

set -o pipefail

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$EVAL_DIR/throughput"
MODELS_ROOT="$HOME/.lmstudio/models"
RUNS=3
MAX_TOKENS=16   # basso di proposito: ci interessa il prefill, non la generazione

[ "${1:-}" = "--runs" ] && RUNS="$2"

mkdir -p "$OUT_DIR"

MODELS=(
  "qwen38_27b|lmstudio-community/Qwen3.8-27B-MLX-4bit|dense|15"
  "qwen36_35b_moe|unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit|moe-a3b|20"
  "qwen3_coder_30b_moe|lmstudio-community/Qwen3-Coder-30B-A3B-Instruct-MLX-4bit|moe-a3b|16"
)

# Prompt lungo e riproducibile: un file di codice reale del repo, seguito da una
# domanda. Il contenuto è lo stesso per tutti i modelli.
PROMPT_FILE="$OUT_DIR/.prefill-prompt.txt"
{
  echo "Leggi questo script bash e rispondi in una riga sola."
  echo
  cat "$EVAL_DIR/scripts/run-local-2026-05-26.sh"
  cat "$EVAL_DIR/scripts/bench-throughput.sh"
  echo
  echo "Domanda: in una riga, cosa fanno questi due script insieme?"
} > "$PROMPT_FILE"

CHARS=$(wc -c < "$PROMPT_FILE" | tr -d ' ')
STAMP=$(date '+%Y-%m-%d-%H%M')
CSV="$OUT_DIR/prefill-$STAMP.csv"
LOG="$OUT_DIR/prefill-$STAMP.log"

echo "slug,architettura,gb_disco,run,prompt_tokens,prefill_tok_s,decode_tok_s,peak_gb" > "$CSV"
: > "$LOG"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

log "==== BENCH PREFILL ($STAMP) ===="
log "Prompt: $CHARS caratteri, $RUNS run per modello, max-tokens $MAX_TOKENS"

for entry in "${MODELS[@]}"; do
  IFS='|' read -r slug rel_path arch gb <<< "$entry"
  model_path="$MODELS_ROOT/$rel_path"
  [ -d "$model_path" ] || { log "SKIP $slug (path assente)"; continue; }

  log "-------------------------------------------"
  log "MODELLO: $slug ($arch, ${gb} GB)"

  for i in $(seq 1 "$RUNS"); do
    raw=$(mlx_lm.generate --model "$model_path" --prompt - \
          --max-tokens "$MAX_TOKENS" --temp 0.0 --seed 42 < "$PROMPT_FILE" 2>&1)
    echo "$raw" >> "$LOG"
    ptok=$(echo "$raw" | grep -oE "Prompt: [0-9]+ tokens" | grep -oE "[0-9]+" | tail -1)
    pre=$(echo "$raw" | grep -oE "Prompt: [0-9]+ tokens, [0-9.]+ tokens-per-sec" | grep -oE "[0-9.]+ tokens-per" | grep -oE "^[0-9.]+" | tail -1)
    dec=$(echo "$raw" | grep -oE "Generation: [0-9]+ tokens, [0-9.]+ tokens-per-sec" | grep -oE "[0-9.]+ tokens-per" | grep -oE "^[0-9.]+" | tail -1)
    peak=$(echo "$raw" | grep -oE "Peak memory: [0-9.]+ GB" | grep -oE "[0-9.]+" | tail -1)
    log "  run $i/$RUNS: prompt ${ptok:-NA} token | prefill ${pre:-NA} tok/s | decode ${dec:-NA} tok/s"
    echo "$slug,$arch,$gb,$i,${ptok:-NA},${pre:-NA},${dec:-NA},${peak:-NA}" >> "$CSV"
  done
done

log "==== sintesi ===="
python3 - "$CSV" <<'PYEOF' | tee -a "$LOG"
import csv, sys
from collections import defaultdict
rows = list(csv.DictReader(open(sys.argv[1])))
by = defaultdict(list)
for r in rows:
    by[(r["slug"], r["architettura"], r["gb_disco"])].append(r)

def nums(v):
    return [float(x) for x in v if x not in ("NA", "")]

print(f"{'modello':24} {'arch':10} {'prefill medio':>14} {'min-max':>16} {'token prompt':>13}")
for (slug, arch, gb), rs in by.items():
    pre = nums([r["prefill_tok_s"] for r in rs])
    tok = nums([r["prompt_tokens"] for r in rs])
    if not pre:
        print(f"{slug:24} {arch:10} dati mancanti"); continue
    m = sum(pre)/len(pre)
    spread = (max(pre)-min(pre))/m*100
    print(f"{slug:24} {arch:10} {m:>13.1f} {min(pre):>7.1f}-{max(pre):<7.1f} {tok[0]:>13.0f}   (spread {spread:.0f}%)")
PYEOF

log "CSV: $CSV"
