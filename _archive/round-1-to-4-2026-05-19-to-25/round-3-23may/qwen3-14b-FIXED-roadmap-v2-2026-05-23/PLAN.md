# Esperimento 2026-05-23 - Roadmap-a-pezzi vs model size

Plan formale per il secondo round di test agentic coding locale su Mac M5 32 GB. Obiettivo: rispondere in modo difendibile alla domanda "su questo setup conta piu' la dimensione del modello o la tecnica di prompting?".

Background nel `README.md` (esperimenti 19/05 e 20/05).

---

## 1. Background e domanda aperta

Dai due esperimenti precedenti:

- **19/05 (monolithic)**: 5 modelli, 4 fail strutturali (parser/template), 1 partial success (GLM-4.7-Flash sotto Pi) con corruption sui numeri
- **20/05 (roadmap-a-pezzi)**: Qwen3.5 9B e Qwen3-14B testati con piano a 6 task + context reset. Niente corruption, ma `App.jsx` rimasto default Vite, componenti `BookForm.jsx` isolati. Task 5 (integrazione UI) non completato in nessuna delle due run

Domanda aperta: il difetto del 20/05 era della metodologia (PLAN non chiedeva esplicitamente di leggere file esistenti prima di modificare) o dei modelli (9B-14B non bastano per integrazione)? E parallelamente: GLM-4.7-Flash con roadmap evita la corruption?

## 2. Ipotesi da testare

**H1** - La tecnica roadmap-a-pezzi previene la corruption sui numeri anche su MoE 16 GB (GLM-4.7-Flash).

**H2** - Aggiungere istruzione esplicita "leggi i file esistenti prima di modificare" abilita il completamento end-to-end del task.

**H3** - I modelli piccoli (9B-14B) con roadmap + file-reading completano l'integrazione frontend (`App.jsx` modificato, componenti collegati).

**H4** - I modelli MoE 16 GB con roadmap + file-reading evitano la corruption ma hanno comunque memory pressure su 32 GB con altri tool aperti.

## 3. Modelli da testare

Tutti via `mlx_lm.server` 0.31.x con parser supportato (glm47, qwen, qwen3_coder).

| # | Modello | Size on-disk | Class | Profilo llm-up | Rationale |
|---|---|---|---|---|---|
| 1 | GLM-4.7-Flash MLX 4-bit | 16 GB | MoE 30B-A3B | `build` | Test H1 e H4. Modello del partial-success originale |
| 2 | Qwen3.5 9B MLX 4-bit | 5-6 GB | Dense 9B | (da configurare) | Test H3. Modello piccolo, RAM headroom |
| 3 | Qwen3-14B MLX 4-bit | 8 GB | Dense 14B | (da configurare) | Test H3. Step intermedio, controlla la curva size |
| 4 | Qwen3-Coder-30B-A3B MLX 4-bit | 16 GB | MoE coder-specialized | `coder-old` | Test H1 e H4. Secondo punto-dato fascia 16 GB, controlla che H1 non sia GLM-specifico |

I modelli che falliscono per ragioni strutturali (DeepSeek-Coder-V2-Lite, Devstral 2507, Qwen2.5-Coder-14B) sono esclusi: gia' documentati come fail nel `README.md`, rifarli sarebbe spreco.

## 4. Metodologia standard per tutte le run

Identica per ogni modello, l'unico modo di avere risultati comparabili.

### 4.1 Sandbox

Una per modello, naming convention:
```
~/Development/Projects/local-llm-eval/<model-slug>-booktrack-roadmap-v2-2026-05-23/
```

Slug:
- `glm47-flash`
- `qwen3_5-9b`
- `qwen3-14b`
- `qwen3-coder-30b-a3b`

Struttura attesa per ogni sandbox:
```
<sandbox>/
├── HUMAN_PROMPTS.md        prompt iniziale + steer eventuali, verbatim
├── PLAN.md                 il piano a 6 task usato (clone di sezione 6 sotto)
├── backend/                output backend del modello
├── frontend/               output frontend del modello
├── sessions/               session dir Pi
├── turn-NN.jsonl           transcript Pi per ogni run
├── turn-NN.stderr          stderr Pi per ogni run
└── METRICS.md              tabella metriche oggettive (sezione 7) compilata a fine run
```

### 4.2 Harness e flag

Pi minimal:
```bash
pi -p --provider mlx-local --model "<path-modello>" \
   --no-skills --no-extensions --no-prompt-templates --no-context-files \
   --mode json --session-dir <sandbox>/sessions "<prompt>"
```

### 4.3 Stato Mac prima di ogni run

- Chiudere browser (Chrome/Safari/Arc)
- Chiudere apps pesanti (Slack, Spotify, Notion desktop)
- Mantenere aperti solo: Terminal, eventualmente VSCode con sola la cartella del progetto
- Verificare RAM libera prima del run: `vm_stat | head -5`, target >= 14 GB free
- Modello attivo: un solo `mlx_lm.server` per volta (`llm-switch <profile>` tra una run e l'altra)

### 4.4 Sequenza esecuzione

Una run alla volta, in serie. Tra una run e l'altra:
1. `llm-down` (ferma server modello precedente)
2. Verifica memoria pulita (`vm_stat`)
3. `llm-up <profile>` per il modello successivo
4. Warmup: `curl localhost:1234/v1/models` per verificare ready
5. Procedi col PLAN

## 5. Task descrizione (uguale per tutti)

Il prompt iniziale al modello e' lo stesso del 19/05, per continuita':

```
Voglio un'app per tracciare i libri che leggo. Backend FastAPI con
SQLite, frontend React + Vite. Devo poter aggiungere un libro
(titolo, autore, status: to-read/reading/done), vedere la lista,
cambiare lo status. Niente login, e' solo per me locale. Genera tutto
in questa cartella, procedi senza chiedere conferme.
```

Quello che cambia rispetto al 19/05 e' che invece di lasciare al modello la liberta' di procedere monolithic, l'orchestratore (Claude Code o script bash) lo guida attraverso il PLAN qui sotto, un task alla volta.

## 6. PLAN.md template (v2 con file-reading esplicito)

Il punto critico: ogni task di modifica include esplicitamente l'istruzione di leggere i file esistenti prima.

```markdown
# Piano di Sviluppo - App BookTrack (v2)

## Task 1: Inizializzazione Backend FastAPI
- Titolo: Setup progetto backend con FastAPI e dipendenze
- File: `backend/main.py`, `backend/pyproject.toml`
- Istruzione: Usa `uv init backend` e `uv add fastapi uvicorn sqlite-utils` per creare il progetto. Non scrivere `pyproject.toml` a mano, lascia che `uv` lo generi.
- Criterio di verifica: `cd backend && uv run python -c "from main import app; print(app.title)"` restituisce "BookTrack API"

## Task 2: Schema Database SQLite
- Titolo: Creazione modello Book e inizializzazione database
- File: `backend/models.py`, `backend/database.py`, `backend/schema.sql`
- Istruzione: Crea i tre file. La tabella `books` ha colonne id (INTEGER PK), title (TEXT), author (TEXT), status (TEXT CHECK in 'to-read','reading','done').
- Criterio di verifica: `cd backend && sqlite3 books.db ".schema books"` mostra tabella books con le 4 colonne

## Task 3: Endpoint API CRUD
- Titolo: Implementazione endpoint GET, POST, PATCH per books
- File: `backend/main.py`, `backend/routes/books.py`, `backend/schemas.py`
- Istruzione: **Leggi prima `backend/main.py`, `backend/models.py` e `backend/database.py` esistenti**. Aggiungi i nuovi file e modifica `main.py` per includere il router. Endpoint: GET /books (list), POST /books (create), PATCH /books/{id} (update status).
- Criterio di verifica: `curl -X POST http://localhost:8000/books -H "Content-Type: application/json" -d '{"title":"Test","author":"Test","status":"to-read"}'` restituisce 201 con il libro creato

## Task 4: Setup Frontend React + Vite
- Titolo: Inizializzazione progetto frontend con React e Vite
- File: `frontend/package.json`, `frontend/vite.config.js`, `frontend/index.html`, `frontend/src/App.jsx`, `frontend/src/main.jsx`
- Istruzione: Usa `pnpm create vite frontend --template react` per generare lo scaffold. Non modificare ancora App.jsx in questo task, sara' il Task 5.
- Criterio di verifica: `cd frontend && pnpm install && pnpm run build` esce con 0

## Task 5: UI Form e Lista Books (INTEGRAZIONE)
- Titolo: Implementazione form creazione e lista con dropdown status, integrate in App.jsx
- File: `frontend/src/App.jsx` (MODIFICA), `frontend/src/components/BookList.jsx` (NEW), `frontend/src/components/BookForm.jsx` (NEW), `frontend/src/api.js` (NEW)
- Istruzione: **Leggi prima `frontend/src/App.jsx` esistente** (e' il default Vite, devi modificarlo). Crea i nuovi componenti `BookList.jsx` e `BookForm.jsx`, crea `api.js` con funzioni `listBooks()`, `createBook()`, `updateBookStatus()` che chiamano http://localhost:8000. Poi **modifica `App.jsx` per importare e usare i due componenti**, rimuovendo il template default Vite (contatore, logo). L'app finale deve mostrare la lista libri + form aggiunta.
- Criterio di verifica: `cat frontend/src/App.jsx | grep -E "BookList|BookForm"` deve trovare entrambi. `pnpm run build` deve uscire con 0. Nessun `<h1>Vite + React</h1>` o `count, setCount` rimasto in App.jsx.

## Task 6: Verifica End-to-End
- Titolo: Avvio backend e frontend, verifica integrazione
- File: nessun nuovo file, eventuale `README.md` con istruzioni
- Istruzione: Avvia backend (`cd backend && uv run uvicorn main:app --reload` in background) e frontend (`cd frontend && pnpm run dev` in background). Verifica che si possa creare un libro via API e che compaia nella lista nel frontend.
- Criterio di verifica: `curl http://localhost:8000/books` risponde 200 con JSON array. `curl http://localhost:5173` risponde 200 con HTML che NON e' il default Vite (deve contenere "BookTrack" o "Libri" nel body).
```

Tra Task 1, 2, 3, 4, 5, 6 va eseguito **reset del contesto Pi** (sandbox `--session-dir` nuova o `--no-session`). Cosi' ogni task vive con context fresco.

## 7. Criteri di successo oggettivi

Compilare per ogni run il file `METRICS.md`:

| Dimensione | Come misurare | Tipo | Note |
|---|---|---|---|
| backend_starts | `uv run python -c "from main import app; print(app.title)"` torna "BookTrack API" | bool | Task 1+3 |
| backend_endpoints_ok | curl GET /books = 200, POST /books = 201, PATCH /books/{id} = 200 | int 0-3 | Task 3 |
| frontend_builds | `pnpm run build` exit 0 | bool | Task 4 |
| app_jsx_integrated | `grep -E "BookList|BookForm" App.jsx` matches AND `grep "count, setCount" App.jsx` no match | bool | Task 5 critico |
| components_linked | `BookList.jsx` AND `BookForm.jsx` esistono e importati in `App.jsx` | bool | Task 5 |
| e2e_ux_works | Apertura `http://localhost:5173`, create book via form, riavviare browser e vedere libro persistente | bool | Task 6 (manuale o screenshot Playwright) |
| code_corruption | grep di pattern noti: `if2`, `useState\(true2`, `bg-.*-7 5`, `[0-9]+\.[0-9]+\.[0-9]+.5\.5\.5`, `127\.02\.5` | int (count) | Tutti i task |
| files_generated | `find . -type f -not -path "*/node_modules/*" -not -path "*/.venv/*" -not -path "*/__pycache__/*"` | int | Tutti |
| wall_clock_minutes | timestamp inizio - fine | int | Tutti |
| human_interventions | numero di steer manuali necessari | int | Auspicato 0 |

Una run e' "passing" se: backend_starts + backend_endpoints_ok = 3 + frontend_builds + app_jsx_integrated + components_linked + e2e_ux_works + code_corruption = 0.

## 8. Out of scope esplicito

Per evitare scope creep, NON facciamo in questo round:

- Server alternativi (`mlx-openai-server`, Rapid-MLX, LM Studio): post successivo dedicato
- Modelli che falliscono per ragioni strutturali con `mlx_lm.server` (DeepSeek-V2-Lite, Devstral, Qwen2.5-Coder, Gemma 4): gia' documentati nel README originale
- Quantizzazioni 6-bit o 8-bit: post successivo se reperibili su HF
- Hardware diverso (M3 Ultra 128 GB, Strix Halo): non disponibile
- Confronto cloud (sandboxes cloud-* del 20/05): post separato sulla comparison cloud/local
- Task diversi da booktrack: in questa run la variabile e' modello, non task

## 9. Esecuzione orchestrata

Lo script di esecuzione vive in `local-llm-eval/run-experiment-2026-05-23.sh` e fa:

1. Per ogni modello in ordine [GLM, Qwen3.5-9B, Qwen3-14B, Qwen3-Coder-30B-A3B]:
   1. `llm-down` se c'e' un server attivo
   2. Verifica RAM libera >= 14 GB
   3. `llm-up <profile>` (configura profilo se mancante)
   4. Warmup: `curl localhost:1234/v1/models`
   5. Crea sandbox
   6. Per ogni task in PLAN [1..6]:
      a. Esegui Pi con nuova session
      b. Log stdout in `turn-NN.jsonl`, stderr in `turn-NN.stderr`
      c. Esegui criterio di verifica del task
      d. Registra metriche parziali
   7. Compila `METRICS.md`
2. Genera `RESULTS-2026-05-23.md` con tabella comparativa

## 10. Stima tempi

- Setup script orchestrazione: 30-45 min (una tantum)
- Per ogni modello: 30-50 min (warmup + 6 task + analisi)
- 4 modelli: ~3 ore wall-clock
- Analisi finale e writeup: 30-45 min

**Totale: ~4 ore** tra cui circa 3 ore sono "wait" durante le esecuzioni del modello.

## 11. Deliverable finali

1. `local-llm-eval/<model>-booktrack-roadmap-v2-2026-05-23/` x 4 con artifact completi
2. `local-llm-eval/RESULTS-2026-05-23.md` con tabella comparativa + writeup
3. Aggiornamento del `local-llm-eval/README.md` con nuova sezione "Esperimento 2026-05-23"
4. Materiale aggiornato per il post LinkedIn + blog (`post-local-llm-benchmark/` del progetto doppia-linkedin)

## 12. Decisioni residue prima del go

- Verifica che i profili `qwen3_5-9b` e `qwen3-14b` siano configurati in `llm-serve` (o configurarli)
- Verifica che `pnpm` sia disponibile globalmente (per `pnpm create vite`)
- Verifica che `uv` sia disponibile globalmente
- Decidere se l'e2e_ux_works del Task 6 va automatizzato con Playwright o lasciato come check manuale (Playwright e' piu' rigoroso ma aggiunge 30 min di setup per ciascun test)
