# Booktrack - GLM-4.7-Flash + Pi (positive control)

Agent: pi v0.73.1 print mode
Provider: mlx-local
Model: lmstudio-community/GLM-4.7-Flash-MLX-4bit
Size: 16 GB (30B-A3B MoE, 3B active)
Parser: glm47 ✓ (verificato: emette tool_calls strutturato correttamente)
Sandbox: /Users/doppia/Development/Projects/local-llm-eval/glm-pi

## Warmup pre-Pi

- "Say only: ready" → "Ready" (instruction-following ottimo)
- Tool call test diretto: `tool_calls: [{function: {name: write_file, arguments: {...}}, id: ...}]` con `finish_reason: tool_calls` → PERFETTO

## Regole umane

- Prompt iniziale: <=5 righe alto livello
- Steering: <=2 frasi, mai file path / nome funzione / snippet
- Max 3 steer per ostacolo

---

## Turn 01 - prompt iniziale

**Inviato:**

```
Voglio un'app per tracciare i libri che leggo. Backend FastAPI con SQLite, frontend React + Vite. Devo poter aggiungere un libro (titolo, autore, status: to-read/reading/done), vedere la lista, cambiare lo status. Niente login, e' solo per me locale. Genera tutto in questa cartella, procedi senza chiedere conferme.
```

**Osservazioni turn 01 (50 min totali, di cui parte in suspend Mac):**
- File creati: 15 (backend/main.py + requirements.txt, frontend/index.html + vite.config + package.json + src/main.jsx + App.jsx + App.css + index.css + components/{AddBook, BooksList, EditBook}.jsx + relativi .css)
- Tool calling FUNZIONANTE: emette tool_calls strutturati, parser glm47 li decodifica
- Errori sostanziali:
  - Versioni allucinate in requirements.txt (`fastapi==02.5.5`) e package.json (`react: ^18.5.5`)
  - Bloccato in retry loop su `pip install ...==02.5.5` (versione inesistente)
  - `pip: command not found` → poi cercato `python3` esplicito
  - Aggiunto react-router e tailwind non richiesti (scope creep)
- KV cache arrivato a 7.6 GB (~50K tok su 65K)
- File ultimi modificati alle 12:24-12:29 (~5 min) - dopo: loop install
- Killed manualmente (mac suspend ha falsato il timing percepito)

---

## Turn 02 - steer "bypassa install"

**Inviato:**

```
Lascia stare i comandi di install per ora, completa gli endpoint backend mancanti e la logica di stato del frontend.
```

_Osservazioni: da compilare_
