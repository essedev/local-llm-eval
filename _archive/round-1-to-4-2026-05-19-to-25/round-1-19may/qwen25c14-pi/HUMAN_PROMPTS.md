# Booktrack - Qwen2.5-Coder-14B + Pi

Agent: pi v0.73.1 in print mode
Provider: mlx-local
Model: lmstudio-community/Qwen2.5-Coder-14B-Instruct-MLX-4bit
Size on disk: ~8 GB
Tool template: XML <tools>/<tool_call> con JSON (qwen family standard)
Parser mlx_lm.server: qwen (auto-detect) - confermato supportato
Sandbox: /Users/doppia/Development/Projects/local-llm-eval/qwen25c14-pi

## Regole "umane"

- Prompt iniziale: <=5 righe alto livello
- Steering: <=2 frasi, mai file path / nome funzione / snippet
- Max 3 steer per ostacolo

---

## Turn 01 - prompt iniziale (da inviare dopo download + server pronto)

```
Voglio un'app per tracciare i libri che leggo. Backend FastAPI con SQLite, frontend React + Vite. Devo poter aggiungere un libro (titolo, autore, status: to-read/reading/done), vedere la lista, cambiare lo status. Niente login, e' solo per me locale. Genera tutto in questa cartella, procedi senza chiedere conferme.
```

**Osservazioni turn 01:**
- Wall clock: 109s | Output: 1171 token | content 4457 char
- Tool call: 0 | File: 0
- Output: tutorial italiano 6 step con codice FastAPI + React in markdown
- Errori: `pip install sqlite3` (builtin), FastAPI `Depends()` syntax sbagliata

**Diagnosi root + verifica diretta:**

Test isolato con tool_choice="required" + system prompt "USA i tool" + tools esplicito:
```
"content": "<function-call>\n  {\"name\": \"write_file\", \"arguments\": {...}}\n</function-call>"
```

Qwen2.5-Coder-14B emette formati inconsistenti:
- `<function>` nel primo warmup
- `<function-call>` nel test forzato
- MAI `<tool_call>` (che e' quello documentato nel suo chat template)

Nessuno di questi formati viene parsato dal parser `qwen` di mlx_lm.server (che cerca `<tool_call>`). Risultato: tool call resta in `content` come stringa, Pi non lo riconosce, agent loop non parte.

**Verdetto**: modello con "tool calling support" formale ma inconsistente in pratica. Tipico per modelli coding sub-16B.

---

## Conclusione strutturale dell'esperimento globale

4 setup testati, tutti falliti sotto i 16 GB on-disk per ragioni diverse:
- GLM-4.7 + opencode: opencode permissions
- DeepSeek-V2-Lite + Pi: template senza tool
- Devstral-2507 + Pi: parser server senza Mistral
- Qwen2.5-Coder-14B + Pi: model emette formati inconsistenti

**Floor agentic affidabile su mlx_lm.server = 16 GB on-disk** (GLM-4.7-Flash, Qwen3-Coder-30B, coder-old).

