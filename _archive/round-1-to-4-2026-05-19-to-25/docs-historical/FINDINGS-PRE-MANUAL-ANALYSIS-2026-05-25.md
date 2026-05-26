# Findings pre-analisi-manuale 2026-05-25

Documento di stato per riprendere dopo /compact. Sintesi di tutto quello che abbiamo trovato fin qui sull'esperimento agentic coding locale, paths alle sandbox, e la rubric proposta per l'analisi manuale che andra' fatta sui sandbox.

---

## 1. Contesto esperimento

**Hardware**: MacBook Pro M5, 32 GB RAM unificata, `wired_limit_mb=28000`.

**Software**:
- `mlx_lm.server` 0.31.x (parser auto-detect, NO `--tool-call-parser` come flag CLI)
- `pi-coding-agent` 0.75.3 come harness agentico (system prompt <1000 token), invocato con `--no-skills --no-extensions --no-prompt-templates --no-context-files`
- Task standard: `booktrack` (micro-app FastAPI + SQLite backend, React + Vite frontend, CRUD per libri con status to-read/reading/done)

**Modelli testati** (path fissi):
- `qwen3_14b` → `Qwen/Qwen3-14B-MLX-4bit` (HF cache, ~8 GB)
- `qwen3_coder_30b` → `~/.lmstudio/models/lmstudio-community/Qwen3-Coder-30B-A3B-Instruct-MLX-4bit` (16 GB MoE)
- `glm47_flash` → `~/.lmstudio/models/lmstudio-community/GLM-4.7-Flash-MLX-4bit` (16 GB MoE, chat-template-args `{"enable_thinking":false}`)
- `qwen36_35b` → `~/.lmstudio/models/unsloth/Qwen3.6-35B-A3B-UD-MLX-4bit` (20 GB MoE, chat-template-args `{"enable_thinking":false}`)

**Due metodologie a confronto**:

A. **roadmap-a-pezzi** (2026-05-23): PLAN.md con 6 task atomici, ognuno con prompt esplicito che include "leggi i file esistenti prima di modificare". Pi invocato 6 volte con context reset (`--session-dir` nuovo) tra un task e l'altro. Verifica eseguibile per ogni task.

B. **monolithic** (2026-05-25): prompt singolo di 5 righe (verbatim dal 19/05), Pi invocato 1 volta con timeout 30 min. Verifica eseguibile post-hoc sulle 6 stesse dimensioni del roadmap.

---

## 2. Sandbox paths

Tutte sotto `/Users/doppia/Development/Projects/local-llm-eval/`.

**Roadmap-a-pezzi (2026-05-23)**:
- `qwen3-14b-booktrack-roadmap-v2-2026-05-23/`
- `qwen3-coder-30b-booktrack-roadmap-v2-2026-05-23/`
- `glm47-flash-booktrack-roadmap-v2-2026-05-23/`
- `qwen36-35b-booktrack-roadmap-v2-2026-05-23/`

**Monolithic (2026-05-25)**:
- `qwen3-14b-booktrack-monolithic-2026-05-25/`
- `qwen3-coder-30b-booktrack-monolithic-2026-05-25/`
- `glm47-flash-booktrack-monolithic-2026-05-25/`
- `qwen36-35b-booktrack-monolithic-2026-05-25/`

**Sandbox "FIXED" usate per test** (qwen3-coder e qwen3-14b dopo applicazione fix umani al codice del roadmap):
- `qwen3-coder-30b-FIXED-roadmap-v2-2026-05-23/`
- `qwen3-14b-FIXED-roadmap-v2-2026-05-23/`

**Storico esperimenti precedenti** (riassunti, vedi `README.md` per dettagli):
- `glm-pi/`, `deepseek-pi/`, `devstral-pi/`, `qwen25c14-pi/`, `glm-build/`: esperimento 19/05 in monolithic, con corruption del pattern 5/2 su GLM
- `qwen35-booktrack-roadmap-2026-05-20/`, `qwen3-14b-booktrack-roadmap-2026-05-20/`: tentativi del 20/05 con modelli ora cancellati dal disco (Qwen3.5-9B). Avevano frontend rimasto al template default Vite

**File di scoring grezzi** (basati su script verify, da rivalutare a mano):
- `RESULTS-2026-05-23.md`
- `RESULTS-monolithic-2026-05-25.md`

---

## 3. Risultati grezzi (verify-script, da rivalutare manualmente)

### Roadmap-a-pezzi (2026-05-23)

| Modello | Task pass script | Wall clock | File | Corruption count script |
|---|---|---|---|---|
| qwen3_14b | 3/6 | 21 min | 57 | 0 |
| qwen3_coder_30b | 4/6 | 5 min | 57 | 0 |
| glm47_flash | 5/6 | 7 min | 54 | 0 |
| qwen36_35b | 6/6 | 4 min | 55 | 0 |

### Monolithic (2026-05-25)

| Modello | Task pass script | Wall clock | File utente | Corruption count script |
|---|---|---|---|---|
| qwen3_14b | 0/6 | 11 min | 8 | 0 (ma vedi sotto) |
| qwen3_coder_30b | 0/6 | 2 min | 14 | 0 |
| glm47_flash | 0/6 | TIMEOUT 30 min | 15 | 0 (ma vedi sotto) |
| qwen36_35b | 1/6 | 7 min | 12 | 0 |

---

## 4. Findings emersi durante l'analisi parziale

### 4.1 La corruption ESISTE su GLM monolithic ma e' specifica

Nel verify-script il `count_corruption` usava regex troppo strette (`react-router-dom2`, `useState(true2)`, `bg-X-7 5`, `127\.02\.5`). Quei pattern erano del 19/05.

Nel monolithic 2026-05-25, **GLM ha generato CORRUPTION SISTEMICA** ma con cifra preferita diversa (9 invece di 5/2):
- `className="bg-gray-9 rounded-lg px-9 py-9 border border-gray-9"`
- `className="flex gap-9"`
- `bg-blue-9`, `bg-green-9`, `bg-yellow-9`, `bg-red-9-9`
- `p-9`, `mt-9`, `mb-9`, `focus:ring-9`, `focus:border-9`

In GLM monolithic l'app non e' nemmeno completata (Pi timeout 30 min), `main.py` non e' mai stato scritto, era ancora a `BookForm.jsx` quando il timeout ha chiuso.

Negli altri 3 modelli (qwen3_14b, qwen3_coder_30b, qwen3.6_35b) in monolithic: **NO corruption** nemmeno con regex allargata. Codice sintatticamente pulito. Versioni pacchetti corrette.

Quindi la corruption del 19/05 era **specifica a GLM in modalita' monolithic**, non un fenomeno generale del 4-bit MoE su 32GB.

### 4.2 Le verify-script penalizzano fortemente il monolithic

I 0/6 dei monolithic NON significano "codice rotto". Significano "non aderente alle aspettative dello script". Esempi:

**qwen3_coder_30b monolithic**:
- `backend/main.py` (130 righe): codice production-grade, CRUD completo inline (no `routes/`, no `models.py`), CORS, init_db, endpoints `/books` GET/POST/PUT/DELETE
- `frontend/src/App.jsx` (200+ righe): single-file React completo - form aggiunta libro, lista grid con status badge, dropdown change status, delete button, useEffect fetch all'avvio
- `backend/requirements.txt` esiste, `package.json` con versioni reali (react ^18.2.0, vite ^5.2.0)
- Verify-1 fallisce solo perche' nessuno ha runato `pip install -r requirements.txt`
- Verify-5 fallisce perche' cerca `import BookList` e `import BookForm`, ma il modello ha messo tutto in App.jsx

**qwen3_14b monolithic**:
- Backend ha creato venv ma fastapi NON installato
- Struttura confusa: `backend/frontend/` (cartella annidata sbagliata)
- `frontend/src/` VUOTO
- Generati 1179 file totali per via di venv Python (972 in `__pycache__`) + node_modules pnpm
- Questo invece e' un fail vero: organizzazione rotta

**qwen36_35b monolithic**:
- Backend `main.py`: inizio buono con `from database import get_db, init_db`, endpoint `/api/books`
- `App.jsx` ha tutti componenti inline (BookForm definito DENTRO App.jsx)
- Verify-5 passa per pattern grep (BookList e BookForm come function names interne)
- Le altre verifiche falliscono per deps non installate

**glm47_flash monolithic**:
- Tutto messo in subdirectory `book-tracker/` invece che nella root della sandbox
- Corruption nei classNames Tailwind
- `main.py` mai scritto (timeout)
- File presenti: `BookForm.jsx`, `BookList.jsx`, `BookDetail.jsx`, `App.jsx`, ma tutti con corruption
- 30 minuti pieni di generation senza completamento

### 4.3 Roadmap-a-pezzi: cosa funziona e cosa no a livello reale

Dall'analisi gia' fatta sui sandbox roadmap-v2:

**qwen36_35b roadmap (6/6)** - REALMENTE 6/6:
- Codice pulito, multi-file, importazioni corrette
- `routes/books.py` con doppia route `@router.get("")` + `@router.get("/")` per evitare il 307 redirect (anticipa il problema)
- `<title>BookTrack - Gestione Libri</title>` in index.html
- Nessun bug, niente da fixare

**glm47_flash roadmap (5/6)** - 5/6 con 1 fail spurio:
- Task 6 fail perche' il modello ha lasciato `<title>frontend</title>` di default (1 riga di HTML mancante)
- Il bundle JS contiene BookTrack (e' SPA React, renderizza client-side)
- Funzionalmente: app fullstack working end-to-end
- Codice pulito, niente corruption (qui)

**qwen3_coder_30b roadmap (4/6)** - 4/6 ma fixabile in 2 righe:
- `main.py` solo 3 righe (manca `app.include_router(books_router)` + import)
- Test live conferma: dopo aver aggiunto 2 righe + cambiato `from backend.X` a `from X` in 1 file, TUTTI gli endpoint funzionano:
  - POST /books/ → 201
  - GET /books/ → 200 con array
  - PATCH /books/1 → 200
  - DELETE /books/1 → 204
- Codice complessivo: production-grade, idiomatico React, FastAPI con APIRouter ben strutturato

**qwen3_14b roadmap (3/6)** - 3/6 con piu' bug veri:
- App.jsx sintassi rotta (double `return (` + graffa extra)
- BookList/BookForm import path sbagliato (`../../api` invece di `../api`)
- Backend imports con `.` prefix (convention mismatch, non bug puro)
- Dopo i fix manuali (5-8 righe): backend risponde correttamente, frontend builda
- Codice qualita': mediamente buono ma con bug di dettaglio piu' "umani"

### 4.4 Confronto temporale stesso modello

| Modello | Roadmap time | Monolithic time |
|---|---|---|
| qwen3_14b | 21 min (3/6) | 11 min (0/6 ma con struttura confusa) |
| qwen3_coder_30b | 5 min (4/6) | 2 min (0/6 ma codice ottimo) |
| glm47_flash | 7 min (5/6) | TIMEOUT 30 min (corruption) |
| qwen36_35b | 4 min (6/6) | 7 min (1/6 ma codice valido) |

### 4.5 Memory pressure e' importante per GLM ma non spiega tutto

Nella prima esecuzione di GLM in roadmap (run 1 del 23/05), GLM andava in timeout 15 min per Task 2 e Task 3. RAM libera era 7.9 GB (memory pressure alta).

Nella seconda esecuzione (run 2 del 23/05), RAM libera 18.6 GB, GLM ha completato 5/6 in 7 minuti senza timeout.

MA nel monolithic del 25/05 (questa esecuzione), RAM libera 23.6 GB, GLM e' di nuovo andato in timeout 30 min con corruption. Quindi GLM ha proprio un problema sistemico con generazioni monolithic lunghe, non solo con memory pressure.

---

## 5. Rubric proposta per scoring manuale

Per ogni sandbox (8 totali: 4 roadmap + 4 monolithic), valutare a mano queste dimensioni indipendentemente da come funziona lo script verify:

### Dimensioni di scoring

| # | Dimensione | Descrizione | Scala |
|---|---|---|---|
| A | Backend code quality | Sintassi corretta, logica CRUD ben implementata, error handling presente | 0-3 |
| B | Frontend code quality | Sintassi corretta, JSX valido, React idiomatico, componenti ragionevoli | 0-3 |
| C | Architettura | Struttura cartelle sensata (no annidamenti strani), file dove dovrebbero stare | 0-3 |
| D | Integrazione | Backend e frontend si parlano? Endpoint giusti, CORS configurato, fetch dal frontend al backend | 0-3 |
| E | Setup operativo | requirements/package.json corretti, deps installabili, app avviabile con istruzioni standard (anche se l'agent non le ha runate da solo) | 0-3 |
| F | Funzionante out-of-the-box | Si puo' davvero avviare backend + frontend e fare CRUD via UI **senza modifiche umane**? | 0-3 |
| G | Corruption | 0 = nessuna; 1 = casi isolati; 2 = pattern presenti; 3 = corruption sistemica | 0-3 (invertito: piu' alto = peggio) |

**Score totale di qualita'**: A+B+C+D+E+F - G (max 18, min 0).

### Per ogni sandbox, registrare anche

- File generati (count solo file utente, esclusi venv/node_modules/cache)
- Tempo di generazione
- Stile (multi-file vs single-file)
- Note specifiche su cosa funziona e cosa no
- Quante righe di "fix umano" servono per renderlo funzionante (proxy del costo human-in-the-loop)

### Output atteso

Una tabella comparativa finale con tutti gli 8 sandbox e i loro punteggi. Poi:

- Quale modello e' il "migliore" considerando code quality + funzionalita' + tempo?
- Roadmap vs monolithic: la differenza e' davvero quella che pensiamo?
- Corruption: e' un problema generale, GLM-specific, o context-length-specific?

---

## 6. Conclusioni preliminari (da rivalidare con scoring manuale)

Ipotesi da confermare/smentire con l'analisi a mano:

H1. **Qwen3.6-35B-A3B in roadmap-a-pezzi e' il combo migliore** su questo setup: 6/6 verify pass, 4 minuti, zero corruption, zero fix.

H2. **GLM-4.7-Flash ha un problema specifico di corruption su monolithic lunghe**, non condiviso dagli altri modelli MoE. La corruption riemerge sistematicamente. Roadmap-a-pezzi lo mitiga (5/6 in 7 min) ma non lo elimina (vedi se ci sono pattern residui).

H3. **Il monolithic NON e' "rotto", e' "incompleto"**. I modelli scrivono codice valido ma:
   - Non installano deps (lasciano requirements.txt da fare a mano)
   - Saltano integrazione end-to-end (il modello pensa di aver finito ma manca il setup)
   - Usano stile single-file (architetturalmente diverso dal multi-file del roadmap)

H4. **La differenza chiave tra roadmap e monolithic** non e' "anti-corruption", e':
   - Verifiche eseguibili per task → costringono il modello a non saltare passi operativi
   - Reset context tra task → riduce KV-cache pressure
   - Step espliciti di integrazione → il modello e' guidato a connettere i pezzi

H5. **La specializzazione coder conta piu' della dimensione raw** fino a una certa soglia: Qwen3-Coder-30B (16 GB MoE) batte Qwen3-14B (8 GB dense) sia in tempo (5 vs 21 min) sia in qualita' codice. MA Qwen3.6-35B (20 GB MoE general) batte Qwen3-Coder-30B (16 GB MoE coder). Quindi non e' solo specializzazione, e' anche capacita' raw.

---

## 7. Prossimo step (post-compact)

1. Per ogni sandbox (8 totali), leggere a mano il codice principale:
   - `backend/main.py`, `backend/routes/`, `backend/models.py`, `backend/database.py`
   - `frontend/src/App.jsx`, `frontend/src/components/`, `frontend/src/api.js`
   - `frontend/package.json`, `backend/requirements.txt` (o pyproject.toml)
2. Per ognuna applicare la rubric della sezione 5
3. Compilare `RESULTS-MANUAL-2026-05-25.md` con tabella comparativa
4. Aggiornare le bozze del post (`post-local-llm-benchmark/linkedin.md` e `blog.md`) con la narrativa che emerge

Il risultato dovrebbe essere: una valutazione difendibile, basata su lettura del codice e non solo su script verify rigidi, che permetta di scrivere un post tecnicamente solido senza claim contestabili.
