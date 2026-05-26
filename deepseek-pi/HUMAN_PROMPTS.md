# Booktrack - DeepSeek-Coder-V2-Lite + Pi

Agent: pi (Mario Zechner) v0.73.1 in print mode (`-p`)
Provider: mlx-local (custom OpenAI-compatible)
Server: mlx_lm.server porta 1234 (avviato via llm-serve lite)
Model: mlx-community/DeepSeek-Coder-V2-Lite-Instruct-4bit
Size on disk: ~8.5 GB
Sandbox: /Users/doppia/Development/Projects/local-llm-eval/deepseek-pi

## Pi flags

- `-p` print mode (non-interactive)
- `--no-skills` no skill auto-loading
- `--no-extensions` no extension auto-loading
- `--no-prompt-templates` no prompt template auto-loading
- `--no-context-files` no AGENTS.md / CLAUDE.md discovery
- `--mode json` structured output
- `--session-dir <sandbox>/sessions/` session storage

## Regole "umane"

- Prompt iniziale: <=5 righe alto livello
- Steering: <=2 frasi, mai file path / nome funzione / snippet
- Max 3 steer per ostacolo
- Allowed: "errore: ...", "non funziona", "manca X", "cambia approccio"

---

## Turn 01 - prompt iniziale (da inviare appena server pronto)

```
Voglio un'app per tracciare i libri che leggo. Backend FastAPI con SQLite, frontend React + Vite. Devo poter aggiungere un libro (titolo, autore, status: to-read/reading/done), vedere la lista, cambiare lo status. Niente login, e' solo per me locale. Genera tutto in questa cartella, procedi senza chiedere conferme.
```

**Osservazioni turn 01:**
- Wall clock: 36s | Velocità: ~38 t/s (eccellente)
- System prompt Pi: 756 token (vs 24991 di opencode, ~33x più leggero)
- Tool call: 0 | File creati: 0
- Output: tutorial markdown italiano, 4 passi numerati, errore semantico (`npm start` su backend FastAPI)
- Diagnosi: modello non sa rispondere in formato agentic, fa chat-style

---

## Turn 02 - steer "usa i tool"

**Inviato:**

```
Non scrivere tutorial. Usa i tool che hai per creare davvero i file. Non spiegarmi nulla, fai.
```

**Osservazioni turn 02:**
- Wall clock: 18s | Output: 193 token
- Tool call: 0 | File: 0
- Modello ha PERSO il task originale: parla di `sample.txt` in `documents/` (totale fuori scope)
- Continua a emettere bash command in markdown
- Cita "il mio strumento di aiuto" ma non lo chiama

---

## Turn 03 - ultimo steer

**Inviato:**

```
Devi chiamare il tool che scrive file. Non parlare, chiama il tool ora.
```

**Osservazioni turn 03:**
- Wall clock: 15s | Output: 123 token | Cache read: 1833 (cache MLX/Pi efficiente)
- Tool call: 0 | File: 0
- Modello inventa tool fittizio "FileWriterPro" (non esiste in Pi)
- Continua sul falso scope sample.txt/documents (non recupera mai il task booktrack)

---

## Verdetto finale esperimento

**Fallimento strutturale dovuto al modello, NON al frame.**

- Pi: configurazione impeccabile, 756 token system prompt (vs 25K di opencode)
- DeepSeek-Coder-V2-Lite 4-bit MLX: incapace di formato tool-call agentic
- Sotto 3 steer di intensita crescente, il modello degrada: turn1 tutorial coerente, turn2 sample.txt fuori scope, turn3 tool fittizio "FileWriterPro"
- 0 tool call, 0 file creati, 0 % progresso sul task

**Conclusione**:
Sul tuo 32GB Mac, i modelli che fittano nel budget RAM (<12-14 GB) e sono coding-strong NON sono necessariamente agentic-capable. DeepSeek-Coder-V2-Lite e' un esempio: ottimo a generare codice in chat, inutile per Claude-Code-style workflows.

**Modelli agentic-capable che hai gia'**:
- GLM-4.7-Flash (16 GB, default opencode/Pi build agent)
- Qwen3-Coder-30B-A3B (16 GB, coder-old)
- Qwen3.6-35B-A3B-UD (20 GB, troppo grande)

Tutti pero' eccedono il tuo budget RAM realistico → causa rallentamenti macchina osservati prima.

Conclusione operativa: **sul tuo hardware attuale, il coding agentic locale e' marginale**. Il modello "leggero" non sa il formato, il modello "grosso" non ci sta. Servirebbe Mac 128 GB per fare il salto.

