# Regole del Progetto (360Pallix / CssBuy)

## Sincronizzazione Automatica Git
Alla fine di ogni richiesta dell'utente (prompt), se sono stati creati, modificati o eliminati file o codice all'interno del progetto:
1. Esegui automaticamente la sincronizzazione Git:
   - `git add .`
   - `git commit -m "<messaggio descrittivo e sintetico delle modifiche>"`
   - `git push`
2. Esegui questa operazione in autonomia senza chiedere ogni volta conferma all'utente.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
