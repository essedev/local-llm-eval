# Booktrack - GLM-4.7-Flash (build)

Server: mlx_lm.server porta 1234
Model: /Users/doppia/.lmstudio/models/lmstudio-community/GLM-4.7-Flash-MLX-4bit
Warmup: 3.0s per 2 token (cold/load time)
Sandbox: /Users/doppia/Development/Projects/local-llm-eval/glm-build

## Regole

- Prompt iniziale: <=5 righe alto livello
- Steering: <=2 frasi, mai file path / nome funzione / snippet
- Max 3 steer per ostacolo
- Allowed steering keywords: "errore: ...", "non funziona", "manca X", "cambia approccio"

---

## Turn 01 - prompt iniziale

**Inviato:** _t=start_

```
Voglio un'app per tracciare i libri che leggo. Backend FastAPI con SQLite, frontend React + Vite. Devo poter aggiungere un libro (titolo, autore, status: to-read/reading/done), vedere la lista, cambiare lo status di un libro. Niente login, e' solo per me locale. Genera tutto in questa cartella.
```

**Osservazioni turn 01:**
- Wall clock: 242s
- Token: 24991 in / ~260 out
- GLM ha caricato la skill `init-project` (esposta da opencode dalle ~/.claude/skills/) e seguito la fase di brainstorming della skill
- Output: piano testuale (nome progetto, stack, entita', porte) e poi STOP - 0 file creati
- Comportamento corretto per la semantica della skill (pensata per interazione), ma frustrante: ha trasformato un task semplice in un workflow opinionato
- Tool call totali: 1 (skill load)

---

## Turn 02 - steer "procedi"

**Inviato:**

```
Procedi, hai gia' tutto quello che ti serve. Non aspettare conferme, vai e genera codice e file.
```

**Osservazioni:** _(da compilare)_
