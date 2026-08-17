#!/usr/bin/env bash
# Benchmark di throughput puro (decode tok/s), non di qualità.
#
# Perché esiste: il resto del repo misura quanto bene un modello genera un'app
# (rubric manuale, soggettiva, lenta). Qui misuriamo una cosa sola e fisica:
# quanti token al secondo escono, sulla stessa macchina, con lo stesso prompt.
# È ripetibile e non richiede scoring.
#
# La domanda a cui risponde: un denso da 27B e un MoE da 35B sulla stessa
# macchina vanno alla stessa velocità? (No: il denso rilegge tutti i pesi a
# ogni token, il MoE ne attiva una frazione.)
#
# Uso:
#   scripts/bench-throughput.sh                  # tutti i modelli, 3 run
#   scripts/bench-throughput.sh --runs 5         # 5 run per modello
#   scripts/bench-throughput.sh --validate       # 1 run corto su un modello piccolo
#   scripts/bench-throughput.sh qwen38_27b       # un modello solo

set -o pipefail

EVAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$EVAL_DIR/throughput"
MODELS_ROOT="$HOME/.lmstudio/models"
RUNS=3
MAX_TOKENS=400
SEED=42

mkdir -p "$OUT_DIR"

# slug|path relativo a MODELS_ROOT|architettura|GB su disco|chat-template-config
MODELS=(
  "qwen38_27b|lmstudio-community/Qwen3.8-27B-MLX-4bit|dense|15|"
  "qwen36_35b_moe|unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit|moe-a3b|20|{\"enable_thinking\":false}"
  "qwen3_coder_30b_moe|lmstudio-community/Qwen3-Coder-30B-A3B-Instruct-MLX-4bit|moe-a3b|16|"
)

VALIDATE_MODEL="mlx-community/Qwen3.5-9B-MLX-4bit"

# Prompt unico per tutti i modelli. Realistico ma corto: ci interessa il decode,
# non il prefill, quindi l'input resta piccolo e l'output lungo.
PROMPT="Scrivi una funzione Python che, dato un file JSON di eventi con campi timestamp e tipo, raggruppa gli eventi per giorno e restituisce un dizionario ordinato. Gestisci timestamp in formato ISO 8601 con timezone. Includi docstring e type hints."

log() {
  echo "[$(date '+%H:%M:%S')] $*"
}

# Estrae le metriche dall'output di mlx_lm.generate.
# Il formato atteso include righe tipo:
#   Prompt: 123 tokens, 456.789 tokens-per-sec
#   Generation: 400 tokens, 12.345 tokens-per-sec
#   Peak memory: 16.234 GB
parse_metrics() {
  local raw="$1"
  local gen_tps prompt_tps gen_tokens peak_mem
  gen_tps=$(echo "$raw" | grep -oE "Generation: [0-9]+ tokens, [0-9.]+ tokens-per-sec" | grep -oE "[0-9.]+ tokens-per-sec" | grep -oE "^[0-9.]+" | tail -1)
  gen_tokens=$(echo "$raw" | grep -oE "Generation: [0-9]+ tokens" | grep -oE "[0-9]+" | tail -1)
  prompt_tps=$(echo "$raw" | grep -oE "Prompt: [0-9]+ tokens, [0-9.]+ tokens-per-sec" | grep -oE "[0-9.]+ tokens-per-sec" | grep -oE "^[0-9.]+" | tail -1)
  peak_mem=$(echo "$raw" | grep -oE "Peak memory: [0-9.]+ GB" | grep -oE "[0-9.]+" | tail -1)
  echo "${gen_tps:-NA}|${gen_tokens:-NA}|${prompt_tps:-NA}|${peak_mem:-NA}"
}

run_one() {
  local model_path="$1" chat_args="$2" max_tokens="$3" logfile="$4"
  local extra=()
  if [ -n "$chat_args" ]; then
    extra=(--chat-template-config "$chat_args")
  fi
  mlx_lm.generate \
    --model "$model_path" \
    --prompt "$PROMPT" \
    --max-tokens "$max_tokens" \
    --temp 0.0 \
    --seed "$SEED" \
    "${extra[@]}" 2>&1 | tee -a "$logfile"
}

# ---------- validate ----------

if [ "${1:-}" = "--validate" ]; then
  log "Validazione parsing su modello piccolo: $VALIDATE_MODEL"
  logfile="$OUT_DIR/validate.log"
  : > "$logfile"
  raw=$(run_one "$MODELS_ROOT/$VALIDATE_MODEL" "" 20 "$logfile")
  metrics=$(parse_metrics "$raw")
  log "Metriche estratte (gen_tps|gen_tokens|prompt_tps|peak_gb): $metrics"
  if [ "${metrics%%|*}" = "NA" ]; then
    log "ERRORE: parsing fallito. Controlla il formato in $logfile e aggiorna parse_metrics()."
    exit 1
  fi
  log "Parsing OK. Lo script è pronto per il run vero."
  exit 0
fi

# ---------- args ----------

ONLY_SLUG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --runs) RUNS="$2"; shift 2 ;;
    --max-tokens) MAX_TOKENS="$2"; shift 2 ;;
    *) ONLY_SLUG="$1"; shift ;;
  esac
done

STAMP=$(date '+%Y-%m-%d-%H%M')
RESULT_MD="$OUT_DIR/THROUGHPUT-$STAMP.md"
RESULT_CSV="$OUT_DIR/throughput-$STAMP.csv"
RUN_LOG="$OUT_DIR/run-$STAMP.log"

echo "slug,architettura,gb_disco,run,gen_tok_s,gen_tokens,prompt_tok_s,peak_gb" > "$RESULT_CSV"

log "==== BENCH THROUGHPUT ($STAMP) ===="
log "Run per modello: $RUNS, max-tokens: $MAX_TOKENS, temp 0, seed $SEED"
log "Prompt identico per tutti i modelli."

for entry in "${MODELS[@]}"; do
  IFS='|' read -r slug rel_path arch gb chat_args <<< "$entry"
  [ -n "$ONLY_SLUG" ] && [ "$ONLY_SLUG" != "$slug" ] && continue

  model_path="$MODELS_ROOT/$rel_path"
  if [ ! -d "$model_path" ]; then
    log "SKIP $slug: path non trovato ($model_path)"
    continue
  fi

  log "-------------------------------------------"
  log "MODELLO: $slug ($arch, ${gb} GB su disco)"

  for i in $(seq 1 "$RUNS"); do
    log "  run $i/$RUNS"
    raw=$(run_one "$model_path" "$chat_args" "$MAX_TOKENS" "$RUN_LOG")
    IFS='|' read -r gen_tps gen_tokens prompt_tps peak <<< "$(parse_metrics "$raw")"
    log "    decode: ${gen_tps} tok/s | prefill: ${prompt_tps} tok/s | peak: ${peak} GB"
    echo "$slug,$arch,$gb,$i,$gen_tps,$gen_tokens,$prompt_tps,$peak" >> "$RESULT_CSV"
  done
done

# ---------- report ----------

{
  echo "# Throughput locale - $STAMP"
  echo
  echo "Misura di decode puro: stesso prompt, stessa macchina, temp 0, seed $SEED, max-tokens $MAX_TOKENS, $RUNS run per modello."
  echo "Non misura qualità: solo velocità di generazione."
  echo
  echo "| Modello | Arch | GB disco | decode tok/s (media) | min-max | prefill tok/s | peak GB |"
  echo "|---|---|---|---|---|---|---|"
} > "$RESULT_MD"

python3 - "$RESULT_CSV" >> "$RESULT_MD" <<'PYEOF'
import csv, sys
from collections import defaultdict

rows = list(csv.DictReader(open(sys.argv[1])))
by = defaultdict(list)
for r in rows:
    by[(r["slug"], r["architettura"], r["gb_disco"])].append(r)

def nums(vals):
    return [float(v) for v in vals if v not in ("NA", "")]

for (slug, arch, gb), rs in by.items():
    dec = nums([r["gen_tok_s"] for r in rs])
    pre = nums([r["prompt_tok_s"] for r in rs])
    peak = nums([r["peak_gb"] for r in rs])
    if not dec:
        print(f"| {slug} | {arch} | {gb} | dati mancanti | | | |")
        continue
    media = sum(dec) / len(dec)
    print(f"| {slug} | {arch} | {gb} | {media:.1f} | {min(dec):.1f}-{max(dec):.1f} | "
          f"{(sum(pre)/len(pre)):.0f} | {(max(peak) if peak else 0):.1f} |")

print()
print("## Banda effettiva stimata")
print()
print("Per un modello **denso** la banda di memoria effettiva si stima come "
      "`GB del modello x decode tok/s`: a ogni token il modello rilegge tutti i pesi. "
      "Per un **MoE** la formula non vale (legge solo gli esperti attivi), quindi il numero "
      "sotto è riportato solo per i densi.")
print()
for (slug, arch, gb), rs in by.items():
    dec = nums([r["gen_tok_s"] for r in rs])
    if not dec or arch != "dense":
        continue
    media = sum(dec) / len(dec)
    print(f"- **{slug}**: {float(gb):.0f} GB x {media:.1f} tok/s = **~{float(gb)*media:.0f} GB/s effettivi**")
PYEOF

log "==== FATTO ===="
log "Report:  $RESULT_MD"
log "CSV:     $RESULT_CSV"
log "Log run: $RUN_LOG"
