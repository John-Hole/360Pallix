# Regole del Progetto (360Pallix / CssBuy)

## Sincronizzazione Automatica Git
Alla fine di ogni richiesta dell'utente (prompt), se sono stati creati, modificati o eliminati file o codice all'interno del progetto:
1. Esegui automaticamente la sincronizzazione Git:
   - `git add .`
   - `git commit -m "<messaggio descrittivo e sintetico delle modifiche>"`
   - `git push`
2. Esegui questa operazione in autonomia senza chiedere ogni volta conferma all'utente.
