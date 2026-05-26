# INDEX - Archivio round 1-4 (19-26 maggio 2026)

Questa cartella contiene tutti i materiali dei round 1-4, archiviati il 2026-05-26 quando abbiamo deciso di rifare l'esperimento con una nuova metodologia (vedi `../../docs/PLAN.md` nella root del repo).

Niente è stato cancellato. Tutto resta consultabile sia come riferimento storico, sia come baseline contro cui confrontare i nuovi numeri.

---

## Perché abbiamo archiviato

I 4 round precedenti hanno prodotto numeri che, riletti con calma, hanno **due falle metodologiche**:

1. **Confronto sbilanciato monolithic vs roadmap**: la modalità roadmap riceveva istruzioni più specifiche per ogni task (e quindi più informazione totale al modello), mentre il monolithic riceveva solo un prompt breve. Qualunque differenza misurata era un misto tra "decomposizione" e "qualità del brief". Non era isolata la variabile di interesse.

2. **Bug ricorrenti sistemici non risolti dal prompt**: in tutti i round, sia locali sia cloud, l'output roadmap aveva **gli stessi 2-3 bug**: enum status disallineato tra backend e frontend (`to_read`/`read` o italianizzazioni), nessun CORS configurato, nessun lifting state per refresh post-create. Il prompt PLAN non specificava il contratto cross-layer.

3. **Bug di orchestrazione** (limitato al round 4 cloud): script bash launchato con `nohup &` + 12 chain parallele veniva killato dal task tracker dopo 176s. Tutti i `pi` figli morti via process-group SIGTERM. Task 3 e task 6 (i più lunghi) sistematicamente uccisi mid-generation. Diagnosticato a posteriori il 26/05 sul forge, dopo 3 retry sul server. Il vero pattern era diverso: pi-coding-agent crasha quando un task chiede `uvicorn main:app &` senza kill esplicito del processo background.

Il round 5 risolve la falla 1 (entrambe le modalità ricevono `SPEC.md` come `--append-system-prompt`) e la falla 3 (i prompt task includono `kill` esplicito dei server in background).

## Cosa c'è qui dentro

```
.
├── INDEX.md                            (questo file)
├── _logs/                              (cartella legacy, vuota)
├── docs-historical/                    (writeup e scoring storici)
│   ├── ANALYSIS-2026-05-25.md
│   ├── FINDINGS-PRE-MANUAL-ANALYSIS-2026-05-25.md
│   ├── PLAN-2026-05-23-roadmap-vs-model-size.md
│   ├── RESULTS-2026-05-23.md
│   ├── RESULTS-CLOUD-2026-05-25.md
│   ├── RESULTS-MANUAL-2026-05-25.md
│   └── RESULTS-monolithic-2026-05-25.md
├── scripts-historical/                 (orchestratori dei round 1-4)
│   ├── run-experiment-2026-05-23.sh
│   ├── run-monolithic-2026-05-25.sh
│   ├── run-rerun-2026-05-25.sh
│   ├── run-cloud-2026-05-25.sh
│   ├── run-cloud-roadmap-fix-2026-05-25.sh
│   └── run-*.log / run-*.summary
├── round-1-19may/                      (5 sandbox: 19/05 monolithic locale, 5 modelli)
│   ├── glm-build/                      esp 1: opencode + GLM (fail permissions)
│   ├── deepseek-pi/                    esp 2: Pi + DeepSeek-V2-Lite (no template)
│   ├── devstral-pi/                    esp 3: Pi + Devstral-2507 (no parser)
│   ├── qwen25c14-pi/                   esp 4: Pi + Qwen2.5-Coder-14B (format mismatch)
│   ├── glm-pi/                         esp 5: Pi + GLM-4.7-Flash (partial success, corruption 5/2)
│   └── qwen36-coder/                   (cartella vuota legacy)
├── round-2-20may/                      (7 sandbox: 20/05 roadmap prime + cloud orientativi)
│   ├── qwen35-booktrack-roadmap-2026-05-20/
│   ├── qwen3-14b-booktrack-roadmap-2026-05-20/
│   ├── cloud-deepseek-v4-flash-booktrack-2026-05-20/
│   ├── cloud-gemini-3.5-flash-booktrack-2026-05-20/
│   ├── cloud-qwen36-27b-booktrack-2026-05-20/
│   ├── cloud-qwen36-35b-a3b-booktrack-2026-05-20/
│   └── cloud-qwen3-coder-next-booktrack-2026-05-20/
├── round-3-23may/                      (6 sandbox: 23/05 roadmap v2 con file-reading)
│   ├── qwen3-14b-booktrack-roadmap-v2-2026-05-23/
│   ├── qwen3-coder-30b-booktrack-roadmap-v2-2026-05-23/
│   ├── glm47-flash-booktrack-roadmap-v2-2026-05-23/
│   ├── qwen36-35b-booktrack-roadmap-v2-2026-05-23/
│   ├── qwen3-14b-FIXED-roadmap-v2-2026-05-23/        (post-fix umani)
│   └── qwen3-coder-30b-FIXED-roadmap-v2-2026-05-23/  (post-fix umani)
└── round-4-25may/                      (18 sandbox: 25/05 monolithic locale + rerun + cloud)
    ├── qwen3-14b-booktrack-monolithic-2026-05-25/
    ├── qwen3-coder-30b-booktrack-monolithic-2026-05-25/
    ├── glm47-flash-booktrack-monolithic-2026-05-25/
    ├── qwen36-35b-booktrack-monolithic-2026-05-25/
    ├── glm47-flash-booktrack-monolithic-RERUN-2026-05-25/
    ├── qwen36-35b-booktrack-monolithic-RERUN-2026-05-25/
    └── cloud-{deepseek-v4-flash,deepseek-v4-pro,gemini-35-flash,gpt-55,opus-47,sonnet-46}-booktrack-{monolithic,roadmap}-2026-05-25/
```

## Quale risultato storico va riletto come?

| File | Cosa contiene | Validità |
|---|---|---|
| `docs-historical/RESULTS-MANUAL-2026-05-25.md` | Scoring manuale 8 sandbox locali round 3+4 + 2 rerun varianza | **Valido come baseline**. Locali roadmap esibiscono i 2 bug ricorrenti |
| `docs-historical/RESULTS-CLOUD-2026-05-25.md` | Scoring manuale 12 sandbox cloud round 4 | **Monolithic valido**, **roadmap compromesso** dal SIGTERM (diagnosticato dopo) |
| `docs-historical/PLAN-2026-05-23-roadmap-vs-model-size.md` | Piano del round 3 | **Storia metodologica**, non più operativo |
| `docs-historical/FINDINGS-PRE-MANUAL-ANALYSIS-2026-05-25.md` | Bridge tra script-scoring e analisi manuale del round 4 | **Storia metodologica** |

## Riferimenti per la nuova metodologia (round 5)

- Piano: `../../docs/PLAN.md`
- Contratto del task: `../../docs/SPEC.md`
- Cronologia generale (incluso archivio): `../../HISTORY.md`
