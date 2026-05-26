# PLAN - Refit metodologico 2026-05-26

Piano di esecuzione per il round 5 dell'esperimento. Sostituisce metodologicamente i round 1-4 archiviati in `_archive/round-1-to-4-2026-05-19-to-25/`.

---

## 1. Domanda di ricerca

> A parità di informazioni fornite al modello, **spezzare il task in 6 sotto-task atomici con context reset** tra l'uno e l'altro produce codice migliore di un singolo loop agentico monolithic?

Nei round precedenti questa domanda non era isolata: la modalità roadmap riceveva istruzioni più specifiche per task (e quindi più info totale), mentre la monolithic riceveva un prompt minimo. Quindi qualunque differenza misurata era un misto tra "decomposizione" e "qualità del brief".

In questo round le due modalità ricevono **identico contenuto informativo**, iniettato come `--append-system-prompt @docs/SPEC.md`. Cambia solo se il modello vede tutto il compito in un singolo turn agentico oppure suddiviso in 6 turn atomici con context fresco ciascuno.

## 2. Ipotesi

**H1** - Su modelli quantizzati 4-bit con context degradation nota (es. GLM-4.7-Flash), il **roadmap-ricco produrrà codice qualitativamente superiore** al monolithic-ricco, perché ogni task vive sotto la soglia di context-fill che innesca la corruption.

**H2** - Su modelli capaci e coerenti su long-context (es. Qwen3.6-35B), **monolithic-ricco e roadmap-ricco saranno qualitativamente equivalenti**, perché il modello non sfora la sua soglia di degradation. Quindi la decomposizione di per sé non è un'aggiunta di valore: aggiunge solo overhead di re-prefill.

**H3** - Il **costo cloud** del roadmap sarà comunque più alto (6 chiamate seriali con prompt iniziale rifatto), anche quando la qualità è equivalente. Quindi la decomposizione non è mai un win economico, solo un win di qualità su modelli fragili.

**H4** - I bug ricorrenti dei round precedenti (enum mismatch FE/BE, CORS mancante, no lifting state) **scompariranno in entrambe le modalità** una volta che lo SPEC.md è iniettato come system prompt addizionale. Se non scompaiono, il problema non era il setup roadmap-povero del round 3 ma una **lacuna del modello**.

## 3. Metodo

### 3.1 Stack tecnico

- Hardware: MacBook Pro M5 32 GB, `wired_limit_mb=28000`
- Inference locale: `mlx_lm.server` 0.31.x
- Agent: `@earendil-works/pi-coding-agent` 0.75.5 (versione attiva del namespace precedentemente `@mariozechner/`)
- Provider cloud: OpenRouter via `--provider openrouter`

### 3.2 Modelli (10 totali)

**Locale** (4):
- `qwen3_14b` → `Qwen/Qwen3-14B-MLX-4bit`
- `qwen3_coder_30b` → `lmstudio-community/Qwen3-Coder-30B-A3B-Instruct-MLX-4bit`
- `glm47_flash` → `lmstudio-community/GLM-4.7-Flash-MLX-4bit` (chat-template-args `{"enable_thinking":false}`)
- `qwen36_35b` → `unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit` (chat-template-args `{"enable_thinking":false}`)

**Cloud** (6, fase 2):
- `openai/gpt-5.5`
- `anthropic/claude-opus-4.7`
- `anthropic/claude-sonnet-4.6`
- `google/gemini-3.5-flash`
- `deepseek/deepseek-v4-pro`
- `deepseek/deepseek-v4-flash`

### 3.3 Le due modalità sotto test

Entrambe ricevono lo **stesso `docs/SPEC.md`** come `--append-system-prompt`. La differenza è solo nella decomposizione del prompt utente.

#### Monolithic-ricco

Una singola invocazione di Pi. Prompt utente:

```
Implementa l'app booktrack come descritta nello SPEC che ti è stato fornito.
Tutto in questa cartella. Procedi.
```

#### Roadmap-ricco

Sei invocazioni di Pi, ognuna con `--session-dir` nuova (context reset). Prompt utente per ogni task:

```
Task <N>/6: <obiettivo del task in 1 frase>.
Vincoli e contesto nello SPEC fornito. Stesso scope, stessa cartella di lavoro.
PRIMA di scrivere, leggi i file esistenti rilevanti per questo task per
mantenere coerenza con quello che è già lì.
```

Sei task atomici (versione pulita dei round precedenti):

1. **Setup backend FastAPI**: `uv init`, `uv add fastapi uvicorn`, app importabile, niente endpoint reali. Verifica: import `app` funziona.
2. **Schema database + modelli**: schema SQL con la tabella `books`, modelli Pydantic, init_db. Verifica: `.schema books` mostra le 4 colonne attese e il CHECK constraint sullo status.
3. **Endpoint CRUD**: implementazione di GET/POST/PATCH (+ DELETE se serve), CORS o equivalente. Verifica: avvio server, POST/GET/PATCH funzionanti.
4. **Setup frontend React+Vite**: `pnpm create vite ... --template react`, `pnpm install`, build con exit 0. Niente UI custom in questo task.
5. **Integrazione UI**: api client, BookForm, BookList, App.jsx che lega tutto, status enum identico al backend, refresh immediato dopo create. Verifica: build OK + grep dei componenti in App.jsx.
6. **Verifica E2E**: avvio backend + frontend in background, smoke test fetch, **kill esplicito dei processi alla fine**. README con istruzioni di avvio.

Il task 6 include esplicitamente il pattern `kill $SRV_PID` per ogni server in background, per evitare il bug pi-coding-agent visto sul forge (server-eterno → SIGTERM al bash tool).

### 3.4 Per ogni sandbox - struttura

```
<modello>-booktrack-<modalita>-2026-05-26/
├── PROMPT.txt          (testo verbatim del prompt utente)
├── SPEC-snapshot.md    (copia dello SPEC.md vigente all'istante della run)
├── METRICS.md          (exit codes, durata, cifre raw)
├── turn-mono.jsonl     (solo per monolithic)
├── turn-N.jsonl        (per roadmap, N=1..6)
├── sessions-*/         (transcript Pi)
├── backend/
└── frontend/
```

Lo snapshot dello SPEC dentro la sandbox è importante: se itero lo SPEC tra una run e la successiva, voglio sapere quale versione esatta il modello ha visto.

### 3.5 Scoring

Identica rubric A-G usata nei round precedenti (documentata in `RESULTS-MANUAL-2026-05-25.md`). Scoring manuale via subagent paralleli (un subagent per modello, ognuno scora le sue 2 sandbox monolithic + roadmap).

In aggiunta alle metriche precedenti, traccio:
- **Total token I/O** per run (sommando i `usage.cost.total` dei jsonl)
- **Wall clock** per ogni task del roadmap (per vedere se la decomposizione introduce overhead di re-prefill non banale)
- **Re-prefill cost stimato**: differenza tra "costo singola run monolithic" e "somma costo 6 task roadmap" (a parità di output token)

## 4. Esecuzione

### 4.1 Pre-requisiti

- Archiviazione dei round 1-4: tutto il contenuto attuale di `local-llm-eval/` esclusi `docs/`, `README.md`, `HISTORY.md`, `.gitignore`, gli script `run-*.sh` storici (che restano come riferimento) va spostato in `_archive/round-1-to-4-2026-05-19-to-25/` con un piccolo `INDEX.md` che spiega cosa c'è.
- Repo GitHub aggiornata (con commit che archivia e un commit che introduce il nuovo metodo).
- `docs/SPEC.md` iterato e bloccato.
- Smoke test del nuovo flow.

### 4.2 Smoke test (prima del batch)

Eseguo **una sola run** con `qwen3_coder_30b` (il modello locale più veloce, ~5 min per chain), in entrambe le modalità. Verifico:

1. Pi riceve correttamente lo SPEC come system prompt addizionale.
2. La sandbox finisce con i file attesi (backend + frontend con i componenti).
3. Il manual review veloce non trova i due bug ricorrenti (enum mismatch, CORS mancante).

Se lo smoke test fallisce su uno dei tre punti, **fermo e itero**: o lo SPEC è ancora incompleto, o lo script ha un bug. Se passa, procedo con il batch.

### 4.3 Batch locale (fase 1)

`run-local-2026-05-26.sh` che esegue, sequenzialmente:

- qwen3_coder_30b monolithic
- qwen3_coder_30b roadmap
- qwen3_14b monolithic
- qwen3_14b roadmap
- glm47_flash monolithic
- glm47_flash roadmap
- qwen36_35b monolithic
- qwen36_35b roadmap

Sequenziale perché ogni modello carica/scarica `mlx_lm.server`. Tempo stimato: 60-90 minuti totali.

### 4.4 Batch cloud (fase 2)

Dopo top-up OpenRouter, `run-cloud-2026-05-26.sh` con 12 chain in parallelo (modello cloud non ha memory pressure). Tempo stimato: 10-15 minuti totali.

Costo stimato (basato sui round precedenti): $3-5.

### 4.5 Scoring + write-up

- 10 subagent paralleli per scoring delle 20 sandbox.
- Compilo `docs/RESULTS-2026-05-26.md` con tabelle pulite.
- Update `HISTORY.md` per aggiungere il round 5.
- Update `README.md` per riflettere la nuova narrativa.
- Commit + push.

## 5. Out of scope per questo round

- Test in inglese (la lingua del prompt resta italiano per confrontabilità storica)
- Altri harness oltre Pi (opencode, aider, cline)
- Altri server di inferenza oltre `mlx_lm.server` (LM Studio, Ollama, llama.cpp)
- Altre quantizzazioni oltre 4-bit (no 6-bit, no 8-bit)
- Task diversi da booktrack
- N=3 di varianza per cella (eventuale rerun mirato post-batch sui casi più interessanti)
- Setup orchestrator + subagent (pi-advisor, multi-agent)

## 6. Rischi noti e mitigazioni

- **Lo SPEC potrebbe essere ancora troppo prescrittivo** (test diventa "esegui istruzioni" invece di "decidi bene"). Mitigazione: smoke test review qualitativo prima del batch.
- **Lo SPEC potrebbe essere ancora troppo loose** (i bug ricorrenti restano in entrambe le modalità). Mitigazione: dopo smoke test, se i bug restano, irrigidisco lo SPEC e ri-faccio lo smoke test. Iterazione fino a convergenza prima del batch.
- **Pi 0.75.5 ha il filtro quantizations attivo** che blocca i modelli closed-source: rimuoverlo da `~/.pi/agent/models.json` prima della fase cloud.
- **Server background che non vengono killati**: il task 6 deve includere kill esplicito. Verifica nello smoke test.

## 7. Cosa il post finale dovrà dire

Indipendentemente dall'esito numerico, il post dovrà essere strutturato così:

- Storia dei round 1-4 (cosa abbiamo provato, cosa abbiamo sbagliato come setup, perché abbiamo rifatto)
- Setup del round 5 (questa metodologia, lo SPEC condiviso, perché isolare la variabile "decomposizione")
- Risultati del round 5 (numeri + interpretazione)
- Cosa cambia tra monolithic-ricco e roadmap-ricco — la risposta alla domanda di ricerca
- Cosa resta open (i lim out-of-scope sopra)

Tieni il post onesto sui retry: il setup l'abbiamo dovuto correggere tre volte. È parte della storia.

## 8. Step concreti da fare ora, in ordine

1. **Confermare lo SPEC** (`docs/SPEC.md` draft v1). Iterare se serve.
2. **Archiviare round 1-4** in `_archive/`.
3. **Scrivere `run-local-2026-05-26.sh`** (sequenziale, 4 modelli × 2 modalità).
4. **Smoke test** su `qwen3_coder_30b`.
5. Se smoke OK, lanciare il **batch locale**.
6. Scoring locale + interpretazione → decisione se procedere con il cloud.
7. (Solo dopo) Top-up OpenRouter + scrivere `run-cloud-2026-05-26.sh` + lanciare batch cloud.
8. Scoring cloud + write-up `RESULTS-2026-05-26.md`.
9. Update `README.md` + `HISTORY.md` + commit + push.
10. Riscrittura del post LinkedIn + blog (dopo che abbiamo i numeri del round 5).
