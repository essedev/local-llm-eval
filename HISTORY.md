# HISTORY - Cronologia degli esperimenti

Documento cronologico di tutti i test agentic coding eseguiti su MacBook Pro M5 32 GB tra il 19/05 e il 26/05 2026.

> **Nota path 2026-05-26**: i materiali dei round 1-4 sono stati archiviati in `_archive/round-1-to-4-2026-05-19-to-25/` dopo la decisione di rifare l'esperimento con una nuova metodologia (vedi `docs/PLAN.md` + indice archivio in `_archive/round-1-to-4-2026-05-19-to-25/INDEX.md`). Tutti i riferimenti sottostanti a `RESULTS-*.md`, `PLAN-2026-05-23-*.md`, sandbox di run, ecc. puntano a quella sotto-cartella di archivio.

---

## Round 1 - 2026-05-19: scoperta dei limiti

**Setup**: Mac M5 32 GB, `wired_limit_mb=28000`, ~12-14 GB RAM operativa free.
**Inference**: `mlx_lm.server` 0.31.3.
**Harness**: `opencode` (system prompt ~25K token) e `pi-coding-agent` 0.73.1 (minimal, <1000 token, flag `--no-skills --no-extensions --no-prompt-templates --no-context-files`).
**Task**: micro-app booktrack (FastAPI + SQLite backend, React + Vite frontend, CRUD libri con status `to-read`/`reading`/`done`).
**Modalità**: monolithic (un singolo prompt).

**Esperimenti**:

| # | Harness | Modello | Size | Esito |
|---|---|---|---|---|
| 1 | opencode | GLM-4.7-Flash MLX 4-bit | 16 GB | Loop rotto: opencode auto-rejecta path fuori CWD |
| 2 | Pi minimal | DeepSeek-Coder-V2-Lite MLX 4-bit | 9 GB | `chat_template` senza branch per role `tool` |
| 3 | Pi minimal | Devstral-Small-2507 MLX 4-bit | 13 GB | Modello emette `[TOOL_CALLS]` (Mistral), parser mlx_lm non lo riconosce |
| 4 | Pi minimal | Qwen2.5-Coder-14B MLX 4-bit | 8 GB | Modello emette `<function>` legacy, parser cerca `<tool_call>` |
| 5 | Pi minimal | GLM-4.7-Flash MLX 4-bit | 16 GB | Loop funzionante. 15 file fullstack in 5 min, poi corruption `02.5.5`, `useState(true2)`, `react-router-dom2` |

**Findings principali**:

1. **Tripletta agentic**: per fare tool-calling locale servono 3 layer allineati: training del modello + chat_template + parser del server. Spezza un anello → fallimento silenzioso.
2. **Parser supportati da `mlx_lm.server` 0.31.x**: `glm47`, `qwen`, `qwen3_coder`, `kimi`, `minimax_m2`. NON supportati: Mistral `[TOOL_CALLS]`, Gemma 4, DeepSeek-V2, Qwen2.5-Coder.
3. **HumanEval/SWE-bench non implicano "agentic-capable"**: i modelli con benchmark eccellenti possono fallire perché chat_template + parser non si allineano.
4. **Corruption GLM 4-bit long-context**: cifra preferita `5` e `2`. Pattern emerge oltre i 15-20K token di context.

**Sandbox storiche** (in repo): `glm-build/`, `deepseek-pi/`, `devstral-pi/`, `qwen25c14-pi/`, `glm-pi/`.

---

## Round 2 - 2026-05-20: primo tentativo roadmap-a-pezzi

**Ipotesi**: spezzare il task in 6 sotto-task con context reset evita la corruption long-context del round 1.

**Modelli testati**: Qwen3.5-9B MLX 4-bit, Qwen3-14B MLX 4-bit (modelli successivamente cancellati dal disco per liberare spazio).

**Esito**:
- Niente corruption (✓ ipotesi confermata)
- MA: `App.jsx` rimasto al template default Vite, `BookForm.jsx`/`BookList.jsx` esistenti ma scollegati
- Task 5 (integrazione UI) non completato

**Diagnosi**: il PLAN non istruiva esplicitamente "leggi prima i file esistenti", quindi il modello generava nuovi componenti senza modificare `App.jsx` per importarli.

**Sandbox storiche** (in repo): `qwen35-booktrack-roadmap-2026-05-20/`, `qwen3-14b-booktrack-roadmap-2026-05-20/`. Anche alcuni test cloud preliminari (`cloud-deepseek-v4-flash-booktrack-2026-05-20/`, `cloud-gemini-3.5-flash-booktrack-2026-05-20/`, `cloud-qwen36-27b-booktrack-2026-05-20/`, ecc.) per orientamento.

---

## Round 3 - 2026-05-23: roadmap v2 con file-reading

**Documento di pianificazione**: `PLAN-2026-05-23-roadmap-vs-model-size.md`.

**Ipotesi**:
- H1: roadmap-a-pezzi previene corruption anche su MoE 16 GB
- H2: aggiungere "leggi i file esistenti prima di modificare" abilita il completamento end-to-end
- H3: modelli piccoli (9-14B) con roadmap + file-reading completano l'integrazione
- H4: MoE 16 GB con roadmap + file-reading evitano corruption ma hanno memory pressure
- H5: specializzazione coder conta più della dimensione raw?

**Modelli testati** (4):

| Slug | Modello | Path |
|---|---|---|
| `qwen3_14b` | Qwen3-14B MLX 4-bit | HF cache |
| `qwen3_coder_30b` | Qwen3-Coder-30B-A3B MLX 4-bit | LM Studio |
| `glm47_flash` | GLM-4.7-Flash MLX 4-bit | LM Studio, `enable_thinking=false` |
| `qwen36_35b` | Qwen3.6-35B-A3B MLX 4-bit | LM Studio, `enable_thinking=false` |

**Modalità**: roadmap-a-pezzi v2 con 6 task atomici, ognuno con istruzione esplicita di leggere i file esistenti. Context reset tra task.

**Script orchestratore**: `run-experiment-2026-05-23.sh`. Tutti i task hanno exit 0 (nessun SIGTERM).

**Verifica script (RESULTS-2026-05-23.md)**:

| Modello | Task pass script | Wall clock | File generati |
|---|---|---|---|
| qwen3_14b | 3/6 | 21 min | 57 |
| qwen3_coder_30b | 4/6 | 5 min | 57 |
| glm47_flash | 5/6 | 7 min | 54 |
| qwen36_35b | 6/6 | 4 min | 55 |

**Note operative**:
- GLM run 1 in timeout 15 min su Task 2/3 con RAM libera 7.9 GB. Run 2 con RAM libera 18.6 GB ha completato in 7 min.
- qwen3.6-35B con `enable_thinking=false` è risultato il più veloce e completo.

**Sandbox** (in repo, suffisso `-v2-2026-05-23`):
`qwen3-14b-booktrack-roadmap-v2-2026-05-23/`, `qwen3-coder-30b-booktrack-roadmap-v2-2026-05-23/`, `glm47-flash-booktrack-roadmap-v2-2026-05-23/`, `qwen36-35b-booktrack-roadmap-v2-2026-05-23/`.

---

## Round 4 - 2026-05-25: monolithic + analisi manuale + cloud

### 4.1 Monolithic locale (stesso prompt 19/05, 4 modelli round 3)

**Script orchestratore**: `run-monolithic-2026-05-25.sh`.
**Risultati script (RESULTS-monolithic-2026-05-25.md)**:

| Modello | Task pass script | Wall clock | File utente |
|---|---|---|---|
| qwen3_14b | 0/6 | 11 min | 8 |
| qwen3_coder_30b | 0/6 | 2 min | 14 |
| glm47_flash | 0/6 | TIMEOUT 30 min | 15 |
| qwen36_35b | 1/6 | 7 min | 12 |

Lo script verify era troppo restrittivo (grep di pattern multi-file ma alcuni modelli generavano single-file App.jsx). Vedi sezione 4.2.

### 4.2 Analisi manuale 8 sandbox locali (rubric A-G)

**Motivazione**: lo script verify ha bias di superficie, non vede coerenza semantica cross-layer.

**Rubric**: A backend code quality + B frontend + C architettura + D integrazione + E setup + F OOB-runnable − G corruption. Max 18, min 0.

**Risultati** (vedi `RESULTS-MANUAL-2026-05-25.md` per dettagli):

| Modello | Roadmap | Monolithic |
|---|---|---|
| qwen3.6-35B | 10 | **18** |
| glm47-flash | 11 | 0 (corruption sistemica) |
| qwen3-coder-30B | 10 | 10 |
| qwen3-14B | 6 | 3 |

**Findings principali**:

- **qwen3.6-35B in monolithic è il top locale** (18/18, 7 min, zero corruption).
- **GLM monolithic catastrofico**: corruption `-9` ovunque (`react9`, `BookResponse2`, `vite ^9.9.9`, classi Tailwind invalide).
- **qwen3.6 roadmap ha un bug subdolo**: italianizzazione frontend (`titolo`/`autore`/`da_leggere`) mentre il backend resta in inglese. La script verify non lo vede perché grep per "BookList"/"BookForm" passa lo stesso.
- **Roadmap salva i modelli fragili** (GLM 0 → 11), **rompe i modelli capaci** (qwen3.6 18 → 10).
- **Tutti i monolithic eccetto qwen3.6 mancano setup runnable**: versioni librerie allucinate, file critici mancanti.

### 4.3 Rerun mirate (varianza N=2)

**Motivazione**: validare i due risultati estremi.

| Modello | Run 1 | Rerun |
|---|---|---|
| qwen3.6-35B monolithic | 18/18 (7 min) | **18/18 (3.5 min)** |
| GLM-4.7-Flash monolithic | 0/18 (timeout 30 min, cifra `9`) | **0/18 (11 min completato, cifre `0/2/5/9` miste)** |

**Conferme**:
1. qwen3.6-35B è stabile e riproducibile.
2. GLM corruption è sistemica: 3 run, 3 cifre-preferite diverse (`5+2`, `9`, `0/2/5/9`), stessa intensità di rottura. La cifra che si "infetta" nella distribuzione varia, la presenza del fenomeno è deterministica. Conferma indipendente dalla community MLX (vedi unsloth docs su GLM-4.7-Flash: "stays coherent until 3-4K context, then collapses").
3. Il timeout 30 min della prima run GLM era artefatto del Mac sleep, non del modello.

**Sandbox**:
`qwen36-35b-booktrack-monolithic-RERUN-2026-05-25/`, `glm47-flash-booktrack-monolithic-RERUN-2026-05-25/`.

### 4.4 Confronto cloud via OpenRouter

**Setup**: stesso Pi-coding-agent minimal ma con `--provider openrouter`. 6 modelli × 2 modalità (monolithic + roadmap) = 12 run.

**Modelli e prezzi** (USD/1M token, snapshot 25/05):

| Modello | OpenRouter ID | $ in | $ out |
|---|---|---|---|
| GPT-5.5 | `openai/gpt-5.5` | 5.00 | 30.00 |
| Claude Opus 4.7 | `anthropic/claude-opus-4.7` | 5.00 | 25.00 |
| Claude Sonnet 4.6 | `anthropic/claude-sonnet-4.6` | 3.00 | 15.00 |
| Gemini 3.5 Flash | `google/gemini-3.5-flash` | 1.50 | 9.00 |
| DeepSeek V4 Pro | `deepseek/deepseek-v4-pro` | 0.43 | 0.87 |
| DeepSeek V4 Flash | `deepseek/deepseek-v4-flash` | 0.10 | 0.20 |

**Modifiche necessarie a Pi 0.75 per cloud**:
- Rimuovere `quantizations: ["fp8","bf16","fp16"]` da `~/.pi/agent/models.json` (filtro che escludeva i modelli closed-source con `404 No endpoints found`). Pi 0.73 non aveva questo filtro.

**Risultati scoring manuale (RESULTS-CLOUD-2026-05-25.md)**:

Monolithic (validi):

| Modello | Score | Costo per run |
|---|---:|---:|
| DeepSeek V4 Flash | 17/18 | $0.002 |
| Opus 4.7 | 17/18 | $0.756 |
| Sonnet 4.6 | 16/18 | $0.325 |
| DeepSeek V4 Pro | 14/18 | $0.015 |
| Gemini 3.5 Flash | 13/18 | $0.162 |
| GPT-5.5 | 12/18 | $0.752 |

Roadmap (vedi sezione 4.5 sotto - compromesso da SIGTERM, salvo DeepSeek V4 Pro).

**Findings principali**:

- **qwen3.6-35B locale 18/18 è alla pari con cloud top** (Opus 17, Sonnet 16, DeepSeek V4 Flash 17). Differenza di 1-2 punti su rubric soggettiva 0-3 in 7 dimensioni: dentro il rumore. NON "locale batte cloud", è "parità a costo zero su scaffold piccoli".
- **DeepSeek V4 Flash è il sweet spot cloud**: 17/18 a $0.002 (8500 score/dollaro). 380x più cheap di Opus 4.7 a parità di score.
- **GPT-5.5 ha content filter aggressivo**: il prompt monolithic originale ("procedi senza chiedere conferme") è stato bloccato 5 volte di seguito con `finish_reason=content_filter`. Rimosso quella frase, ha funzionato.

**Costo totale esperimento cloud**: $4.50 (cloud runs + retry GPT-5.5).

### 4.5 Bug di orchestrazione del round cloud roadmap

Verifica successiva ha rivelato un **bug nostro, non dei modelli**: in 5 sandbox roadmap cloud su 6, **task 3 e 6 sono morti con SIGTERM 143** dopo pochi secondi:

```
task_3: 4/6 exit 143
task_6: 5/6 exit 143
```

Esempio Sonnet 4.6 Task 3: il modello ha letto correttamente `main.py` + `models.py` + `database.py` + schema (4 tool call), poi è stato killato a metà dopo 4.3 secondi, prima di scrivere il codice del router.

**Causa**: lo script di orchestrazione è stato lanciato con `nohup bash run-cloud-2026-05-25.sh &` ma il task tracker ha killato il process group del padre dopo 176s. Tutti i 12 processi `pi` paralleli sono morti via process-group SIGTERM. I task brevi (1, 2, 4, 5) erano già completati. I task lunghi (3 = scrive endpoint, 6 = E2E con server avvio) sono morti mid-generation.

**Conferma**: DeepSeek V4 Pro è l'unico modello che ha completato tutti i task con exit 0 (è il più veloce). Tutti i suoi findings sono affidabili (6/18 con bug genuini come enum `completed` vs `done`).

**Implicazione**: le conclusioni "roadmap cloud è dominata dal monolithic" sui 5 modelli compromessi vanno prese con riserva. È stato pianificato un rilancio in foreground sequenziale, non eseguito.

**Locali OK**: tutti i 4 modelli locali round 3 hanno exit 0 su tutti i 6 task (script orchestratore in foreground sequenziale, non background). Findings locali validi.

---

## Round 5 - 2026-05-26: refit metodologico (in corso)

**Motivazione**: nei round 1-4 la modalità roadmap riceveva istruzioni più specifiche per task, quindi più informazione totale, mentre la monolithic riceveva un prompt minimo. Ogni differenza misurata era un misto tra "decomposizione" e "qualità del brief".

**Cambio di metodo**: entrambe le modalità ricevono lo stesso `docs/SPEC.md` come `--append-system-prompt`. Varia solo se il modello vede il compito in un singolo turn agentico o in 6 turn atomici con context fresco. Piano completo in `docs/PLAN.md`.

**Orchestratore**: `scripts/run-local-2026-05-26.sh`, sequenziale, 4 modelli locali × 2 modalità.

**Smoke test eseguito** (qwen3_coder_30b, entrambe le modalità, tutti i task exit 0):

| Modalità | Wall clock | File generati |
|---|---|---|
| monolithic | 205s (3 min) | 13 |
| roadmap (6 task) | 657s (10 min) | 35 |

Lo smoke ha esposto due lacune dello SPEC, poi irrigidite: endpoint non registrati in `main.py` e manifest dei pacchetti scritti a mano con versioni inventate.

**Non ancora fatto**: il batch sui 4 modelli locali, lo scoring, la fase cloud. I numeri del round 5 non esistono ancora, quindi le conclusioni pubblicate restano quelle dei round 3-4.

---

## Stato attuale (2026-05-26)

### Cosa è completo e affidabile

- 19/05 monolithic locale (5 modelli)
- 23/05 roadmap-a-pezzi locale (4 modelli, exit 0 su tutti i task)
- 25/05 monolithic locale (4 modelli, scoring manuale + 2 rerun di varianza)
- 25/05 monolithic cloud (6 modelli, scoring manuale, costi misurati)
- 25/05 roadmap cloud: solo DeepSeek V4 Pro è completo (gli altri 5 sono compromessi da SIGTERM)

### Cosa manca / open

1. **Rilancio 5 roadmap cloud compromessi** in foreground sequenziale (script pronto in `run-cloud-roadmap-fix-2026-05-25.sh`, da rilanciare con `tmux` o `setsid` su Linux — su macOS `setsid` non esiste). Costo stimato: $2-3 OpenRouter.
2. **Post LinkedIn + blog** (bozze in `~/Development/Projects/doppia-linkedin/post-local-llm-benchmark/`, vanno riscritte coi dati definitivi).
3. **Round 5 ipotetico** (non pianificato): N=3 sui due punti chiave (qwen3.6 mono + GLM mono), prompt in inglese (per isolare l'effetto del prompt italiano sulla "italianizzazione" del qwen3.6 roadmap), altri server (LM Studio/Ollama/llama.cpp), altri harness (opencode), task più realistico di booktrack, quantizzazioni 6-bit/8-bit.

### Limiti dichiarati dell'esperimento

- N=1 per cella nella maggioranza dei test (varianza misurata solo su qwen3.6 e GLM)
- Una sola task (booktrack CRUD piccolo, ~150 righe codice generato)
- Un solo harness (Pi-coding-agent 0.75.3)
- Un solo server di inferenza (`mlx_lm.server` 0.31.x)
- Un solo metodo di tool calling (auto-detect Pi)
- Un solo livello di quantization (4-bit MLX)
- Un solo stile di prompt (italiano)
- Scoring 0-3 con valori intermedi soggettivi (interrater agreement non misurato; il scoring manuale è stato fatto da subagent Claude separati con stessa rubric, ma non c'è ground truth)

---

## File di riferimento

| File | Contenuto |
|---|---|
| `README.md` | Entry point del repo |
| `HISTORY.md` | Questo file (cronologia round 1-4) |
| `PLAN-2026-05-23-roadmap-vs-model-size.md` | Piano dettagliato del round 3 |
| `FINDINGS-PRE-MANUAL-ANALYSIS-2026-05-25.md` | Bridge tra script-scoring e analisi manuale del round 4 |
| `RESULTS-2026-05-23.md` | Tabella script roadmap (round 3) |
| `RESULTS-monolithic-2026-05-25.md` | Tabella script monolithic (round 4) |
| `RESULTS-MANUAL-2026-05-25.md` | Scoring manuale 8 sandbox locali + 2 rerun (round 4) |
| `RESULTS-CLOUD-2026-05-25.md` | Scoring manuale 12 sandbox cloud (round 4) + costi |
| `ANALYSIS-2026-05-25.md` | Note brevi varie |
| `run-experiment-2026-05-23.sh` | Orchestratore round 3 roadmap |
| `run-monolithic-2026-05-25.sh` | Orchestratore round 4 monolithic locale |
| `run-rerun-2026-05-25.sh` | Orchestratore rerun mirate |
| `run-cloud-2026-05-25.sh` | Orchestratore cloud iniziale (parallel, compromesso) |
| `run-cloud-roadmap-fix-2026-05-25.sh` | Orchestratore cloud fix (sequenziale, da lanciare) |
