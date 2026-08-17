#!/usr/bin/env bash
# Confronto decode con e senza MTP, stessa versione di mlx-lm (fork feat/mtp-native),
# stesso checkpoint fuso, stesso prompt del bench principale.
# Il confronto va fatto a parità di versione: altrimenti si mescola l'effetto MTP
# con l'effetto della versione del runtime.

SP=/private/tmp/claude-501/-Users-doppia-Development-Projects-doppia-linkedin/1305d7b9-ec4d-44be-bd83-1acf4280b9fa/scratchpad
PY="$SP/mtp-env/bin/python"
MODEL="$SP/qwen38-27b-mtp-fused"
OUT="$SP/mtp-results.csv"
LOG="$SP/mtp-run.log"
RUNS=3
MAX_TOKENS=400

PROMPT="Scrivi una funzione Python che, dato un file JSON di eventi con campi timestamp e tipo, raggruppa gli eventi per giorno e restituisce un dizionario ordinato. Gestisci timestamp in formato ISO 8601 con timezone. Includi docstring e type hints."

echo "config,run,gen_tok_s,gen_tokens,prompt_tok_s,peak_gb" > "$OUT"
: > "$LOG"

run_config() {
  local label="$1"; shift
  for i in $(seq 1 "$RUNS"); do
    echo "[$(date '+%H:%M:%S')] $label run $i/$RUNS" | tee -a "$LOG"
    raw=$("$PY" -m mlx_lm generate --model "$MODEL" \
      --prompt "$PROMPT" --max-tokens "$MAX_TOKENS" --temp 0.0 --seed 42 \
      "$@" 2>&1)
    echo "$raw" >> "$LOG"
    gen=$(echo "$raw" | grep -oE "Generation: [0-9]+ tokens, [0-9.]+ tokens-per-sec" | grep -oE "[0-9.]+ tokens-per" | grep -oE "^[0-9.]+" | tail -1)
    gent=$(echo "$raw" | grep -oE "Generation: [0-9]+ tokens" | grep -oE "[0-9]+" | tail -1)
    pre=$(echo "$raw" | grep -oE "Prompt: [0-9]+ tokens, [0-9.]+ tokens-per-sec" | grep -oE "[0-9.]+ tokens-per" | grep -oE "^[0-9.]+" | tail -1)
    peak=$(echo "$raw" | grep -oE "Peak memory: [0-9.]+ GB" | grep -oE "[0-9.]+" | tail -1)
    echo "    decode ${gen:-NA} tok/s | peak ${peak:-NA} GB" | tee -a "$LOG"
    echo "$label,$i,${gen:-NA},${gent:-NA},${pre:-NA},${peak:-NA}" >> "$OUT"
  done
}

run_config "baseline_fork"
run_config "mtp" --mtp

echo "==== risultati ====" | tee -a "$LOG"
python3 - "$OUT" <<'PYEOF' | tee -a "$LOG"
import csv, sys
from collections import defaultdict
rows = list(csv.DictReader(open(sys.argv[1])))
by = defaultdict(list)
for r in rows:
    try: by[r["config"]].append(float(r["gen_tok_s"]))
    except ValueError: pass
med = {}
for cfg, vals in by.items():
    m = sum(vals)/len(vals)
    med[cfg] = m
    print(f"{cfg}: media {m:.2f} tok/s | min-max {min(vals):.2f}-{max(vals):.2f} | n={len(vals)}")
if "baseline_fork" in med and "mtp" in med and med["baseline_fork"]:
    print(f"speedup MTP: {med['mtp']/med['baseline_fork']:.2f}x")
PYEOF
