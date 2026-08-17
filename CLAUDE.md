# local-llm-eval - istruzioni per l'agent

Repo di **esperimenti**, non di prodotto: qui dentro si producono misure e transcript, non software da mantenere. Il codice dentro le sandbox è generato dai modelli sotto test e **non va corretto**: i suoi difetti sono il dato.

## Comandi

```bash
./scripts/run-local-2026-05-26.sh --dry-run    # elenca modelli e path, non lancia niente
./scripts/run-local-2026-05-26.sh --smoke      # solo qwen3_coder_30b, entrambe le modalita'
./scripts/run-local-2026-05-26.sh              # batch completo: 4 modelli x 2 modalita'
```

Il batch è sequenziale per forza: ogni modello carica e scarica `mlx_lm.server`, e su 32 GB ne gira uno per volta. Stima 60-90 minuti.

## Convenzioni

- **Una sandbox per cella dell'esperimento**, mai riusata: `<modello>-booktrack-<modalita>-<data>/`.
- Ogni sandbox contiene `PROMPT*.txt` (verbatim), `SPEC-snapshot.md` (la versione dello SPEC vista da quella run), `METRICS.md` (exit code, wall clock, file generati), i `turn-*.jsonl` e `sessions-*/`.
- **Lo snapshot dello SPEC non è ridondante**: lo SPEC si itera tra una run e l'altra, e senza snapshot non si sa più cosa il modello aveva letto.
- I risultati non si sovrascrivono: un rerun è una sandbox nuova con suffisso esplicito (`-RERUN-`).
- Prosa e documentazione in italiano, codice e identificatori in inglese.

## Gotcha

- **Mai lanciare gli orchestratori con `nohup ... &`**: nel round 4 il task tracker ha ucciso il process group e 5 sandbox cloud su 6 sono morte a metà generazione (SIGTERM 143). Usa foreground o `tmux`. Su macOS `setsid` non esiste.
- **Controlla la RAM libera prima di partire.** Sotto ~10 GB liberi i modelli da 16+ GB vanno in timeout o collassano a 10 t/s. Round 3: GLM in timeout con 7,9 GB liberi, 7 minuti con 18,6 GB.
- `wired_limit_mb=28000` deve essere attivo (`/usr/sbin/sysctl iogpu.wired_limit_mb`), altrimenti la memory pressure falsa ogni misura di throughput.
- **GLM-4.7-Flash e Qwen3.6-35B vogliono `--chat-template-args '{"enable_thinking":false}'`**, altrimenti bruciano token in reasoning e i tempi non sono confrontabili.
- **Per le run cloud** va rimosso `quantizations: ["fp8","bf16","fp16"]` da `~/.pi/agent/models.json`, altrimenti i modelli closed-source rispondono `404 No endpoints found`.
- **GPT-5.5 ha un content filter aggressivo**: "procedi senza chiedere conferme" nel prompt fa scattare `finish_reason=content_filter`. Documentato, non aggirato.
- I `turn-*.jsonl` pesano fino a 50 MB l'uno ma comprimono al ~1%: non gzipparli, git li impacchetta meglio da solo.

## Prima di committare

- **Nessuna chiave API nei file tracked.** I transcript catturano l'intero contesto: prima di aggiungere un round nuovo, `git grep -E "sk-or-|sk-ant-"` sui file in staging.
- **I transcript possono contenere skill o file personali** caricati dall'harness nel context (è già successo con opencode nel round 1). Sono un finding da annotare, non un contenuto da pubblicare: va sostituito con un placeholder.
- Un commit per unità: metodo, run, scoring e documentazione non si mischiano.

## Puntatori

| Dove | Cosa |
|---|---|
| `docs/PLAN.md` | Metodo del round in corso: domanda di ricerca, ipotesi, modelli, esecuzione |
| `docs/SPEC.md` | Contratto del task booktrack, iniettato come `--append-system-prompt` |
| `HISTORY.md` | Cronologia dei round 1-4 con i findings e gli errori di setup |
| `README.md` | Perimetro di validità, risultati, limiti |
| `_archive/.../INDEX.md` | Cosa c'è nei round archiviati e perché sono stati superati |
| [llm-dash](https://github.com/essedev/llm-dash) | Il setup che questi test misurano: profili, `llm-serve`, dashboard |
