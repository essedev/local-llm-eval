# Booktrack - Devstral-Small-2507 + Pi

Agent: pi (Mario Zechner) v0.73.1 in print mode (`-p`)
Provider: mlx-local
Server: mlx_lm.server porta 1234 (avviato via llm-serve devstral)
Model: lmstudio-community/Devstral-Small-2507-MLX-4bit
Size on disk: ~13.3 GB
Tool template: nativo Mistral con [AVAILABLE_TOOLS]/[TOOL_CALLS]/[ARGS]/[CALL_ID]
Sandbox: /Users/doppia/Development/Projects/local-llm-eval/devstral-pi

## Pi flags (identici al run DeepSeek)

- `-p` print mode
- `--no-skills --no-extensions --no-prompt-templates --no-context-files`
- `--mode json`
- `--session-dir <sandbox>/sessions/`

## Regole "umane"

- Prompt iniziale: <=5 righe alto livello
- Steering: <=2 frasi, mai file path / nome funzione / snippet
- Max 3 steer per ostacolo

---

## Turn 01 - prompt iniziale (da inviare dopo fine download e server pronto)

```
Voglio un'app per tracciare i libri che leggo. Backend FastAPI con SQLite, frontend React + Vite. Devo poter aggiungere un libro (titolo, autore, status: to-read/reading/done), vedere la lista, cambiare lo status. Niente login, e' solo per me locale. Genera tutto in questa cartella, procedi senza chiedere conferme.
```

**Osservazioni turn 01:**
- Wall clock: 19s
- Output: 24 token ma `content: []` vuoto
- Tool call: 0 | File: 0

**Causa root** (diagnosticata):
- Devstral genera `[TOOL_CALLS]name[ARGS]{...}` (formato Mistral nativo) come previsto
- mlx_lm.server 0.31.3 NON parsa il formato Mistral tool-call, scarta i token come "special"
- Pi riceve `content: []` e `tool_calls: []`, agent loop esce immediatamente
- Confermato: GitHub issue ml-explore/mlx-lm#1096, discussion #859
- Lista parser tool in mlx_lm.server: GLM, Kimi, MiniMax M2, Qwen Coder. Devstral NON incluso

**Verifica controprova**:
- Prompt non-agentic ("cosa proponi come stack?") → 200 token corretti in italiano, content pieno
- Modello sano, problema 100% lato inference server

**Implicazione hardware**:
Sul tuo Mac 32GB con mlx_lm.server come inference layer:
- Modelli <14GB tool-aware = ZERO opzioni nel breve termine
- Per agentic locale: GLM-4.7-Flash o Qwen3-Coder-30B (16 GB) sono gli unici realistici, ma eccedono budget RAM
- Alternativa: cambiare server di inferenza (es. mlx-openai-server cubist38, LM Studio app)

