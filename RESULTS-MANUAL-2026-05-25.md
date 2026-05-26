# Results manuali 2026-05-25 - analisi a freddo del codice generato

Analisi manuale del codice prodotto dagli 8 sandbox (4 roadmap-a-pezzi + 4 monolithic) seguendo la rubric di `FINDINGS-PRE-MANUAL-ANALYSIS-2026-05-25.md` sezione 5. Niente script: lettura file per file, applicazione rubric, scoring oggettivo.

Rubric (sintesi):
- A. Backend code quality (0-3)
- B. Frontend code quality (0-3)
- C. Architettura (0-3)
- D. Integrazione backend-frontend (0-3)
- E. Setup operativo (0-3)
- F. Funzionante out-of-the-box (0-3)
- G. Corruption (0-3 invertita)
- **Total = A+B+C+D+E+F - G** (max 18, min 0)

---

## 1. Tabella comparativa finale

| Modello | Modalità | A | B | C | D | E | F | G | **Total** | Wall clock |
|---|---|---|---|---|---|---|---|---|---|---|
| qwen36_35b | monolithic | 3 | 3 | 3 | 3 | 3 | 3 | 0 | **18** | 7 min |
| glm47_flash | roadmap | 2 | 2 | 3 | 1 | 2 | 1 | 0 | **11** | 7 min |
| qwen3_coder_30b | roadmap | 2 | 2 | 3 | 1 | 2 | 0 | 0 | **10** | 5 min |
| qwen3_coder_30b | monolithic | 3 | 3 | 2 | 1 | 1 | 0 | 0 | **10** | 2 min |
| qwen36_35b | roadmap | 3 | 1 | 3 | 0 | 3 | 0 | 0 | **10** | 4 min |
| qwen3_14b | roadmap | 1 | 0 | 2 | 1 | 2 | 0 | 0 | **6** | 21 min |
| qwen3_14b | monolithic | 1 | 1 | 0 | 1 | 0 | 0 | 0 | **3** | 11 min |
| glm47_flash | monolithic | 1 | 0 | 1 | 0 | 0 | 0 | 3 | **-1 (clamp 0)** | TIMEOUT 30 min |

---

## 2. Dettaglio per sandbox

### 2.1 qwen36_35b monolithic - 18/18 (best in class)

**Backend** (`main.py` + `database.py`): production-grade. PATCH (non PUT), 404 su update/delete, validazione status manuale + Pydantic BookCreate/BookUpdate/BookOut. Context manager per connessioni, WAL journal mode. Endpoint registrati sotto `/api/books`. No CORS, ma il vite proxy lo rende non necessario.

**Frontend** (`src/App.jsx` 191 righe single-file): 3 sub-components definiti nello stesso file (`BookForm`, `BookCard`, `BookList`). `STATUS_LABELS` con emoji per UX, grouping dei libri per status, useCallback, empty state, loading state, confirm before delete. Fetch su `/api/books` con PATCH per status, DELETE per remove. Status enum corretto (to-read, reading, done).

**Integrazione**: vite proxy `/api` → `http://localhost:8000`, backend espone `/api/books`. Path, metodi HTTP, schema fields — tutto allineato.

**Setup**: package.json con react 18.3.1 + vite 5.4.6 (versioni reali), requirements.txt con range constraints. index.html con script tag, main.jsx con StrictMode.

**Out-of-the-box**: l'unica cosa da fare è `pip install -r requirements.txt`, `python main.py` (o uvicorn), `pnpm install`, `pnpm dev`. Tutto gira.

**Corruption**: zero.

### 2.2 glm47_flash roadmap - 11/18

**Backend** (`main.py` + `database.py` + `routes/books.py`): main.py completo (init_db on startup, include_router). routes/books.py usa `Dict[str, Any]` invece di Pydantic Book/BookCreate (definiti ma non usati in models.py!). PATCH update sovrascrive tutti i campi (anche None). No 404.

**Frontend**: App.jsx valido, componenti separati. Loading/error states. BookForm però ha `<option value="completed">` invece di `done` — bug: schema CHECK la rifiuta. api.js chiama `updateBookStatus` su `/books/{id}/status` ma backend espone solo `/books/{id}` per PATCH — endpoint inesistente.

**Architettura**: pulita multi-file standard.

**Integrazione**: tre bug d'integrazione: 1) `completed` vs `done`, 2) endpoint PATCH inesistente, 3) no CORS (sebbene frontend chiami `localhost:8000`).

**Setup**: file ci sono, ma title="frontend" non modificato (Task 6 fail spurio).

**Funzionante OOB**: backend si avvia, frontend builda. listBooks funziona. Create con default status "reading" passa. Update sempre fallisce per endpoint sbagliato.

**Corruption**: zero in roadmap (a differenza del monolithic).

### 2.3 qwen3_coder_30b roadmap - 10/18

**Backend**: `main.py` solo 3 righe (manca `include_router` e import). `routes/books.py` da solo è eccellente: production-grade, response_model, HTTPException 404, transaction-safe. Ma `from backend.X` richiede uvicorn lanciato dalla parent dir. Pydantic models corretti.

**Frontend**: App.jsx pulito multi-file. BookForm con try/catch/finally, loading state, error state. `<option value="read">` invece di `done` — bug: schema CHECK la rifuta.

**Architettura**: pulita.

**Integrazione**: api.js usa PUT invece di PATCH (backend PATCH only). "read" vs "done". No CORS. `include_router` mancante → endpoint non registrati.

**Setup**: `from backend.X` vs cwd convention inconsistente. title="frontend".

**Funzionante OOB**: zero, perché endpoint non registrati. Anche se lo fossero: PUT fallisce, "read" fallisce.

**Corruption**: zero.

### 2.4 qwen3_coder_30b monolithic - 10/18

**Backend** (`main.py` 144 righe): completo. CORS, init_db, GET/POST/PUT/DELETE, 404 ovunque, Pydantic Book + BookUpdate, `if __name__ == "__main__"` con uvicorn.

**Frontend** (`src/App.jsx` 182 righe single-file): completo. Form, lista grid, status badge, dropdown change status, delete button, fetch su `/api/books`. Status enum corretto. Error handling.

**Architettura**: single-file compatto, sensato.

**Integrazione**: vite proxy `/api` → backend, ma backend espone `/books` direttamente (no prefix `/api`). Quindi `fetch('/api/books')` viene proxato in `http://localhost:8000/api/books` che è 404.

**Setup**: requirements.txt contiene `sqlite3` come dependency (è built-in Python, `pip install sqlite3` fallisce). MANCA `index.html` nella root del frontend — Vite non parte ("Could not auto-determine entry point").

**Funzionante OOB**: zero, frontend non avvia.

**Corruption**: zero.

### 2.5 qwen36_35b roadmap - 10/18

Caso più interessante. Il backend è ECCELLENTE: `redirect_slashes=False` con doppia rotta `@router.get("")` + `@router.get("/")` per evitare 307, 404 su PATCH e DELETE, model_dump() per dynamic update, response_model, try/finally. Title customizzato `BookTrack - Gestione Libri`.

Ma il **frontend è italianizzato fuori contratto**: BookForm usa `titolo`/`autore` come nomi degli state e li manda al backend in `createBook({ titolo, autore, status })`. Status options sono `da_leggere`/`in_lettura`/`letto`. BookList legge `book.titolo`/`book.autore`. Backend BookCreate vuole `title`/`author`/`status` enum to-read|reading|done.

Risultato: nessuna chiamata API funziona. POST → 422 (campi mancanti). GET → lista vuota o `undefined - undefined (undefined)` per ogni libro.

api.js usa PUT invece di PATCH (mismatch).

**Origine del bug**: il prompt iniziale del PLAN parla in italiano e dice testualmente "titolo, autore, status: to-read/reading/done". Il backend (Task 2-3) ha tradotto in inglese (`title`, `author`). Il frontend (Task 5) — eseguito in context window separato — è stato istruito a "leggere prima `App.jsx` esistente" ma NON a leggere `backend/models.py` o `routes/books.py`. Il modello ha quindi tradotto direttamente dalle parole del prompt italiano. Manca un'istruzione cross-task che vincoli la coerenza dei nomi tra layer.

Lo script verify lo ha mancato perché controlla solo che esistano `BookList` e `BookForm` come pattern grep, non che i field names siano gli stessi del backend.

**Corruption**: zero.

### 2.6 qwen3_14b roadmap - 6/18

**Backend**: `main.py` con `from .database` e `from .routes.books`, richiede backend come package. routes/books.py importa `.database` e `.models` — sbagliato perché database/models stanno in backend/ non in routes/. Comunque sintatticamente valido se sistemato come package.

**Frontend**: App.jsx con **sintassi rotta**: doppio `return (` consecutivo, graffa extra. Vite non builda.
```jsx
function App() {
  return (

  return (
    <>
```
BookForm usa status `available/borrowed/reserved` (inventato, non matcha schema). BookList e BookForm importano `from '../../api'` (`api.js` è in `src/`, components in `src/components/`, quindi corretto è `../api`).

**Setup**: title="frontend" non modificato.

**Funzionante OOB**: zero — frontend non builda.

**Corruption**: zero.

### 2.7 qwen3_14b monolithic - 3/18

**Backend**: main.py inline completo (CORS, Pydantic, GET/POST/PUT), ma **manca DELETE**. CORSMiddleware importato e add_middleware chiamato due volte (codice duplicato). Connection globale anti-pattern.

**Frontend**: struttura **rotta**. Esistono:
- `frontend/booktrack/src/App.jsx` (singolo file, niente main.jsx né index.html)
- `frontend/booktrack/package.json` (solo `axios`, niente react o vite)
- `frontend/package.json` (react ^19.2.6, vite **^8.0.14** allucinato — Vite è a 6.x, non esiste ^8) + node_modules ma niente src/
- `backend/frontend/` cartella vuota nidificata sbagliata

Due tentativi sovrapposti. App.jsx in sé sarebbe ragionevole (fields corretti, status enum corretto), ma il setup è inutilizzabile.

**Corruption**: nessuna sintattica nei file utente, ma versioni package hallucinate (vite ^8.0.14, @vitejs/plugin-react ^6.0.2).

### 2.8 glm47_flash monolithic - 0/18 (clamp da -1, corruption sistemica)

Il sandbox più rotto. Tutto annidato dentro `book-tracker/` (subdirectory inutile rispetto alla root del sandbox).

**Backend** (`main.py`):
- riga 79: `response_model=BookResponse2` — `BookResponse2` non esiste in tutto il file (NameError al runtime alla prima chiamata POST)
- riga 39: `min_length=12` per title (un titolo di libro di almeno 12 caratteri?)
- riga 39: `max_length=20002`, riga 44: `max_length=200022`
- niente CORS

**Frontend**:
- `App.jsx` riga 1: `from 'react-router-dom'` (libreria non in package.json)
- riga 2: `from 'react2'`
- riga 9: `useState(true22)`
- riga 71: `filter === 'all2'`
- riga 77: `text-9xl text-9xl` (classe Tailwind invalida, ripetuta)
- riga 86: `bg-red-9-9`
- riga 101: `</Routes2>` (chiusura tag corrotta, JSX invalid)
- `BookForm.jsx`: `from 'react9'`, `<h9>` come elemento HTML, `form.author.length < 9` (validazione contro 9), tutte le classNames con cifra `-9` (`bg-gray-9`, `px-9`, `py-9`, `gap-9`, `focus:ring-9`, `focus:border-9`, `bg-green-9`, `bg-red-9`), BookForm non chiama mai l'API (alert dummy)
- `BooksList.jsx`: `from 'react-router9'`, `books.length === 9` (compara contro 9 invece di 0)
- `package.json`: `"version": "9.9.9"`, react `^9.9.9`, react-dom `^9.9.92`, vite `^9.9.9`, @vitejs/plugin-react `^9.9.9` — tutte versioni inesistenti, `pnpm install` fallisce
- `index.html`: title corretto, ma manca `<script type="module" src="/src/main.jsx">` — la pagina non carica nemmeno il bundle

La corruption non è isolata: è **sistemica**, presente in ogni file (.jsx, .py, .json, .html), con cifra preferita `9` (e occasionalmente `2`/`22`/`92`).

---

## 3. Sintesi per ipotesi (rivalidate)

### H1. **qwen36_35b in roadmap è il combo migliore** — SMENTITA

Il combo migliore in assoluto è **qwen36_35b in monolithic** (18/18). Il qwen36_35b roadmap arriva 10/18 a causa dell'italianizzazione del frontend che lo script non aveva visto.

**Riformulazione**: qwen36_35b è il modello migliore in assoluto su questo setup. La modalità monolithic gli permette di mantenere coerenza cross-layer che la modalità roadmap (con context reset tra task) rompe.

### H2. **GLM-4.7-Flash ha corruption sistemica in monolithic** — CONFERMATA fortemente

Su 4 modelli MoE testati in monolithic, GLM è l'unico con corruption. È sistemica, presente in ogni file, su file estensioni diverse (.py, .jsx, .html, .json). La cifra di preferenza nel 2026-05-25 è `9`; nel 2026-05-19 era `5`/`2`. È quindi una proprietà persistente del modello in lunghe generazioni, non un'instabilità random.

**Roadmap mitiga il problema** (GLM roadmap ha 0 corruption nei file utente), confermando che il problema scala con la lunghezza del context attivo.

### H3. **Il monolithic NON è "rotto", è "incompleto"** — PARZIALMENTE CONFERMATA

Sui 4 monolithic:
- qwen36_35b: NON incompleto, completamente OOB-runnable (18/18)
- qwen3_coder_30b: incompleto su setup (no index.html, sqlite3 in requirements)
- qwen3_14b: incompleto E strutturalmente confuso (frontend duplicato)
- glm47_flash: corrotto in generation

Quindi "incompleto" non è uniforme: dipende dal modello. **qwen36_35b dimostra che monolithic ben fatto può essere superiore a roadmap**.

### H4. **Roadmap-a-pezzi protegge dagli errori di coerenza** — SMENTITA

L'esempio qwen36_35b roadmap mostra il contrario: il reset di context tra task rompe la coerenza dei nomi dei campi (frontend italianizzato vs backend in inglese). Una metodologia roadmap che NON include istruzioni cross-task ("nel Task 5 leggi anche `backend/models.py`") può introdurre bug che il monolithic, con un singolo context window, evita.

**Roadmap protegge dalla corruption (vedi GLM) ma non dall'incoerenza semantica.**

### H5. **Specializzazione coder vs dimensione raw** — RICONFERMATA con sfumatura

Sui roadmap:
- qwen3-14b dense: 6/18, codice con bug sintattici
- qwen3-coder-30b coder MoE: 10/18, codice strutturato ma incompleto
- glm47-flash MoE general: 11/18, codice pulito, bug d'integrazione
- qwen3.6-35b MoE general: 10/18 (era 6/6 verify) — backend top, frontend italianizzato

Sui monolithic:
- qwen3-14b dense: 3/18
- qwen3-coder-30b coder MoE: 10/18
- glm47-flash MoE general: 0/18 (corruption)
- **qwen3.6-35b MoE general: 18/18**

Quindi:
- Dense 14B è il fanalino in entrambe le modalità.
- Specializzazione coder (qwen3-coder-30b) batte dense 14B ma plafona a 10/18 (incompleto).
- MoE 20GB general (qwen3.6-35b) batte specializzazione coder, è il top in entrambe le modalità (con monolithic > roadmap per questo modello specifico).
- GLM (MoE 16GB general) ha un problema architetturale specifico (corruption in long-gen) non condiviso dagli altri.

**Conclusione qualitativa**: la dimensione raw e la qualità dell'addestramento (non solo la specializzazione) sembra contare più della tecnica di prompting, **a parità di modello che funziona**. Ma per i modelli "fragili" (GLM), il roadmap fa una differenza enorme (da 0 a 11).

---

## 4. Findings nuovi emersi dalla manuale

### F1. Lo script verify ha **bias verso l'aderenza superficiale**

In 6 sandbox su 8 lo score script differisce dallo score manuale:
- qwen36_35b roadmap: 6/6 script vs 10/18 manuale (frontend italianizzato non visto)
- qwen3_coder_30b roadmap: 4/6 script vs 10/18 (PUT/PATCH e "read"/"done" non visti)
- qwen3_coder_30b monolithic: 0/6 script vs 10/18 (script penalizza single-file)
- qwen36_35b monolithic: 1/6 script vs 18/18 (script penalizza single-file, vede 18/18 codice production-grade)
- glm47_flash monolithic: 0/6 script vs 0/18 (script non vede `-9` corruption pattern)

**Lo script vede pattern grep, non vede coerenza semantica.**

### F2. Il prompt iniziale italiano induce italianizzazione su modelli più capaci

Solo qwen36_35b (il modello più capace dei 4) ha italianizzato i nomi dei campi nel frontend roadmap. Gli altri 3 modelli hanno usato termini tecnici inglesi (`title`, `author`) come default. Ipotesi: i modelli "più piccoli" o "più coder" sono più inclini a usare i termini tecnici di default; il modello più generale legge il prompt letteralmente e segue.

**Implicazione metodologica**: nei prompt cross-lingua, esplicitare il vincolo "i nomi dei campi nel codice sono in inglese" oppure scrivere il prompt nella lingua del codice.

### F3. Il pattern di corruption GLM-4.7-Flash è "infettivo" su lunghe generazioni

Nel monolithic del 25/05, la corruption GLM è presente OVUNQUE: package.json, .py, .jsx, .html. Non è limitata al codice; tocca anche valori di stringa, version semver, classNames, import path. Una volta che la cifra entra nella distribuzione del prossimo-token, sembra restare lì.

Nel roadmap, con context reset ogni 3-5 minuti di generation, il pattern non si attiva.

**Varianza cifra-preferita confermata su 3 run diverse**:

| Run | Cifra prevalente | Esempi |
|---|---|---|
| 2026-05-19 monolithic | `5` e `2` | `bg-X-7 5`, `02.5.5`, `useState(true2)` |
| 2026-05-25 monolithic | `9` | `bg-gray-9`, `BookResponse2`, `react9`, version `9.9.9` |
| 2026-05-25 RERUN monolithic | `5`, `0`, `9`, `2` (mescolati) | version `^5.5.5`, `react-router-dom0`, `<h5>`, `127.5.5.5:8005`, `BookResponse2`, prefisso `9` davanti a 57/73 righe |

Tre run su GLM-4.7-Flash monolithic, tre cifre-preferite diverse, **stessa intensità sistemica**. Conferma che la corruption è una **proprietà persistente del modello** in long-generation, non rumore stocastico. La cifra che si "infetta" nella distribuzione varia tra run, ma la presenza del fenomeno è deterministica.

### F4. La modalità roadmap NON è uniformemente meglio del monolithic

Per qwen36_35b: monolithic > roadmap (18 vs 10).
Per qwen3_coder_30b: monolithic ≈ roadmap (10 vs 10).
Per qwen3_14b: roadmap > monolithic (6 vs 3).
Per glm47_flash: roadmap >>> monolithic (11 vs 0).

**Pattern**: più il modello è capace e coerente, più la modalità monolithic gli permette di esprimere il proprio massimo. Più il modello è fragile (in corruption o in struttura), più la modalità roadmap lo salva.

### F5. Tutti i monolithic eccetto qwen36_35b mancano di setup runnable

3 monolithic su 4 hanno almeno un blocker per OOB:
- qwen3_14b: package.json con vite ^8.0.14 (versione inesistente), src/ vuoto, struttura nidificata
- qwen3_coder_30b: requirements.txt con sqlite3 (built-in, install fallisce), no index.html
- glm47_flash: package.json con versioni 9.9.9, corruption ovunque

Il roadmap, costringendo a Task 4 `pnpm create vite` e Task 1 `uv init`, garantisce package.json e pyproject.toml validi. Questo è un vantaggio reale del roadmap: usa scaffolding tool ufficiali invece di lasciare al modello scrivere da zero `package.json` (dove allucina versioni).

---

## 5. Conclusioni difendibili per il post

1. **Il vincitore assoluto**: qwen3.6-35B-A3B in modalità monolithic. 7 minuti, single-file ma multi-component organizzato, integrazione perfetta, zero corruption, runnable out-of-the-box.

2. **Il vincitore della modalità roadmap**: glm47-flash (11/18) > qwen3_coder_30b (10/18) ≈ qwen3.6-35b (10/18). Notare però che qwen3.6-35b in roadmap ha un bug subdolo che la script non vede.

3. **Roadmap-a-pezzi**:
   - Pro: forza scaffolding tool ufficiali (vite/uv), riduce corruption su modelli fragili
   - Contro: il reset di context tra task può rompere la coerenza cross-layer (vedi italianizzazione qwen3.6-35b)

4. **Monolithic**:
   - Pro: coerenza interna se il modello la mantiene
   - Contro: il modello inventa `package.json` e `requirements.txt` (versioni hallucinate), può saltare file critici (index.html), non c'è verifica intermedia

5. **GLM-4.7-Flash è un modello fragile su generazioni lunghe**: corruption sistemica del pattern "cifra preferita" su 30 min di generation. Roadmap lo rende usabile (11/18), ma è il segnale di un problema sotto la superficie.

6. **La dimensione conta, ma in zona MoE**: 20GB MoE general > 16GB MoE coder > 8GB dense, su entrambe le modalità. Specializzazione coder non basta a battere capacità generale a parità di footprint.

7. **Lo script verify non basta**: 6/8 sandbox hanno score script discordante dallo score manuale. Necessario abbinare verifica eseguibile + lettura codice per giudizi solidi.

---

## 6. Rerun mirate per misurare varianza (2026-05-25 sera)

Per validare i due risultati estremi (vincitore qwen3.6 e GLM corruption) ho rifatto le due run monolithic locali una seconda volta:

| Modello | Run originale | Run rerun | Note |
|---|---|---|---|
| qwen3.6-35B monolithic | 18/18 (7 min) | **18/18 (3.5 min)** | Identico. Stesso score massimo, codice production-grade, zero corruption. Più veloce probabilmente per memory state diverso |
| GLM-4.7-Flash monolithic | 0/18 (timeout 30 min, cifra `9`) | **0/18 (11 min completato, cifra mista `0/2/5/9`)** | La prima run aveva fatto sleep Mac → timeout. Stavolta ha completato in 11 min. Pattern corruption riemerge identico ma con cifre **diverse** (`5.5.5`, `port: 51750`, `react-router-dom0`, `127.5.5.5:8005`, prefisso `9` davanti a righe di codice, `BookResponse2`, `conn.close2()`) |

**Conclusioni dalle rerun**:

1. **qwen3.6-35B è stabile e riproducibile** su questo task. 18/18 confermato.
2. **GLM-4.7-Flash è stabile nel pattern di corruption, instabile nella cifra-preferita**. Tre run hanno prodotto tre cifre prevalenti diverse, ma stessa intensità di rottura. Conferma forte che la corruption non è rumore stocastico, è sistemica.
3. **Il timeout di 30 min della prima run GLM era artefatto del Mac sleep**, non timeout reale di generazione. Quando il Mac resta sveglio, GLM completa in 11 min ma con corruption equivalente. La prima run NON era da considerare invalidata: dataset comparabile.

---

## 7. Limiti dell'esperimento

- N=4 modelli, una run per cella + 2 rerun mirate. Varianza misurata su 2 dei 4 modelli (qwen3.6 e GLM), non sugli altri due.
- Hardware fisso (MacBook Pro M5 32 GB). Risultati potrebbero cambiare su RAM superiore o GPU dedicata.
- Task piccolo (CRUD libri). Modelli potrebbero scalare diversamente su task complessi.
- Pi-coding-agent come unico harness. opencode (con system prompt più strutturato) non testato.
- Modelli quantizzati 4-bit MLX. Modelli 6-bit o full-precision non testati.
- Una sola sandbox per modello/modalità, non aggregato statistico.

Le conclusioni di questo documento valgono come **punto di partenza qualitativo difendibile**, non come benchmark statistico.
