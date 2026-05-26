# macbook-m5-agentic-coding-eval

Esperimenti sul **coding agentico locale su MacBook Pro M5 32 GB**, con confronto contro modelli cloud via OpenRouter. Quattro round di test storici (19/05 → 26/05 2026, archiviati) più un round 5 in corso con metodologia ripulita. Task standard: `booktrack` — FastAPI + SQLite backend, React + Vite frontend, CRUD libri con status.

Setup, log turn-per-turn, codice generato, scoring manuale e dati di costo per ogni run sono nel repo.

---

## TL;DR

**Su scaffold piccolo (CRUD demo), un modello locale 4-bit MLX scelto bene può essere alla pari con cloud frontier**. Il modello locale che ha vinto questo test è `Qwen3.6-35B-A3B-UD-MLX-4bit`, scoring 18/18 in monolithic, 3.5-7 minuti per generare l'app, zero corruption, zero fix umani. Replicato due volte.

**Costo equivalente sui cloud**: Opus 4.7 17/18 a $0.76 per run, Sonnet 4.6 16/18 a $0.32, DeepSeek V4 Flash 17/18 a $0.002. Per questo task, la differenza locale-cloud è dentro il rumore della rubric, ma il costo per run varia di 4 ordini di grandezza.

**Cosa cambia per task più complessi** (refactor multi-file, long-context reasoning, debug profondi) **non l'abbiamo testato**. La conclusione vale solo per scaffold corti.

**Findings tecnici accessori**:

- **Tripletta agentic locale**: per fare tool-calling locale serve allineamento training del modello + chat_template + parser del server. Mistral, Gemma 4, DeepSeek-V2, Qwen2.5-Coder falliscono out-of-the-box su `mlx_lm.server` 0.31.x perché un anello è rotto.
- **GLM-4.7-Flash corruption sistemica in long-context**: 3 run, 3 cifre-preferite diverse (`5+2`, `9`, `0/2/5/9`), pattern strutturale identico. Conferma indipendente nei docs Unsloth ("stays coherent until 3-4K context, then collapses"). Il modello è inutilizzabile in monolithic ma performante in roadmap-a-pezzi (5/6 task pass).
- **Roadmap-a-pezzi non è uniformemente meglio**: salva i modelli fragili (GLM 0/18 → 11/18), ma rompe i modelli capaci (qwen3.6 18/18 → 10/18 perché il context reset tra task elimina la coerenza cross-layer e il frontend si italianizza out-of-spec).
- **Roadmap cloud parzialmente compromesso**: 5/6 sandbox sono stati killati da SIGTERM mid-generation per un bug di orchestrazione del nostro script (process group del padre ucciso prematuramente). Riscoperto a posteriori, da rilanciare.

---

## Stato attuale del repo

Il 2026-05-26 abbiamo deciso di rifare l'esperimento da zero con una metodologia ripulita (i 4 round precedenti avevano confronti monolithic vs roadmap sbilanciati e una serie di bug ricorrenti che il setup non vincolava). I materiali storici sono archiviati ma consultabili come baseline.

| Da dove partire | Vai a |
|---|---|
| Piano operativo del round 5 (in corso) | [`docs/PLAN.md`](./docs/PLAN.md) |
| Contratto del task booktrack (`--append-system-prompt` per ogni run) | [`docs/SPEC.md`](./docs/SPEC.md) |
| Cronologia di tutti i round (1-4 archiviati, 5 in pianificazione) | [`HISTORY.md`](./HISTORY.md) |
| Materiali archiviati (sandbox, scoring, script storici) | [`_archive/round-1-to-4-2026-05-19-to-25/`](./_archive/round-1-to-4-2026-05-19-to-25/) |
| Indice archivio (cosa c'è dentro, perché è stato superato) | [`_archive/round-1-to-4-2026-05-19-to-25/INDEX.md`](./_archive/round-1-to-4-2026-05-19-to-25/INDEX.md) |
| Scoring locale (round 3+4) | `_archive/.../docs-historical/RESULTS-MANUAL-2026-05-25.md` |
| Scoring cloud (round 4, con caveat) | `_archive/.../docs-historical/RESULTS-CLOUD-2026-05-25.md` |

---

## Setup ambiente per riprodurre

**Hardware**: MacBook Pro M5, 32 GB unified memory, `wired_limit_mb=28000`.

**Software**:
- Apple MLX: `mlx_lm.server` 0.31.x (`pip install -U mlx-lm`)
- Agent: `@earendil-works/pi-coding-agent` 0.75.5 (`pnpm install -g @earendil-works/pi-coding-agent`) — versione attiva del namespace precedentemente `@mariozechner/`
- OpenRouter API key in env: `export OPENROUTER_API_KEY=sk-or-...`

**Modelli locali usati** (4-bit MLX, da LM Studio o HF):
- `Qwen/Qwen3-14B-MLX-4bit`
- `lmstudio-community/Qwen3-Coder-30B-A3B-Instruct-MLX-4bit`
- `lmstudio-community/GLM-4.7-Flash-MLX-4bit`
- `unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit`

**Lancio Pi minimal** (no skill, no extensions, no template):
```bash
pi -p --provider mlx-local --model "<path-modello>" \
   --no-skills --no-extensions --no-prompt-templates --no-context-files \
   --mode json --session-dir <sandbox>/sessions "<prompt>"
```

**Lancio Pi cloud via OpenRouter**:
```bash
pi -p --provider openrouter --model "openai/gpt-5.5" \
   --no-skills --no-extensions --no-prompt-templates --no-context-files \
   --mode json --session-dir <sandbox>/sessions "<prompt>"
```

Su Pi 0.75 va modificato `~/.pi/agent/models.json` rimuovendo `quantizations: ["fp8","bf16","fp16"]` dalla config `openrouter.compat.openRouterRouting`, altrimenti modelli closed-source (GPT, Claude, Gemini) ritornano `404 No endpoints found`.

---

## Riproduzione di un singolo test

> Gli script `run-*.sh` del round 5 (`run-local-2026-05-26.sh`, `run-cloud-2026-05-26.sh`) saranno scritti dopo lo smoke test della nuova metodologia. Per ora sotto trovi il pattern Pi minimal con `--append-system-prompt @docs/SPEC.md` da usare per uno smoke test manuale.

```bash
# Smoke test locale (monolithic con SPEC iniettato)
cd <sandbox-vuota>
pi -p --provider mlx-local --model "<path-modello>" \
   --no-skills --no-extensions --no-prompt-templates --no-context-files \
   --append-system-prompt @../../docs/SPEC.md \
   --mode json --session-dir sessions \
   "Implementa l'app booktrack come descritta nello SPEC. Tutto in questa cartella. Procedi."

# Test cloud DeepSeek V4 Flash monolithic (target storico: 17/18 a $0.002)
mkdir -p test-deepseek && cd test-deepseek
pi -p --provider openrouter --model "deepseek/deepseek-v4-flash" \
   --no-skills --no-extensions --no-prompt-templates --no-context-files \
   --mode json --session-dir sessions \
   "Voglio un'app per tracciare i libri che leggo. Backend FastAPI con SQLite, frontend React + Vite. Devo poter aggiungere un libro (titolo, autore, status: to-read/reading/done), vedere la lista, cambiare lo status. Niente login, e' solo per me locale. Genera tutto in questa cartella, procedi senza chiedere conferme."
```

---

## Limiti

- **N=1 per cella** nella maggioranza dei test (varianza misurata solo su 2 modelli locali in monolithic).
- **Un solo task** (booktrack CRUD piccolo, ~150 righe codice generato). Modelli scalano diversamente su task complessi.
- **Un solo harness** (Pi-coding-agent minimal). opencode, aider, cline non testati.
- **Un solo server di inferenza locale** (`mlx_lm.server` 0.31). LM Studio, Ollama, llama.cpp non testati come baseline alternative.
- **Un solo livello di quantization** (4-bit). 6-bit, 8-bit, full-precision non testati.
- **Un solo stile di prompt** (italiano). L'effetto della lingua del prompt sul codice generato è documentato come bug del round 3, non isolato sperimentalmente.
- **Roadmap cloud parzialmente compromesso** da SIGTERM, da rilanciare.

Le conclusioni del repo valgono come **punto di partenza qualitativo difendibile**, non come benchmark statistico.

---

## Licenza

Repo personale, contenuti documentali. Codice generato dai modelli LLM nelle sandbox non è prodotto originale dell'autore: appartiene ai modelli che l'hanno generato e all'autore dei modelli stessi.
