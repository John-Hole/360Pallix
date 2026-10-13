# 360Pallix

Piattaforma Next.js per la consultazione e gestione del catalogo prodotti, spreadsheet interattivo, conversione link di acquisto (CSSBuy, Doppelfit) e pannello di amministrazione con supporto doppia valuta (**€ EUR** e **¥ CNY**).

---

## 🚀 Avvio Rapido

```bash
# Installazione dipendenze
npm install

# Avvio server di sviluppo (http://localhost:3000)
npm run dev

# Controllo tipi TypeScript
npm run typecheck

# Suite di test catalogo e prezzi
npm test

# Build di produzione e avvio
npm run build
npm start
```

> **Nota di compilazione:** I comandi npm utilizzano il flag `--webpack` per garantire la compatibilità dell'App Router e stabilità di bundling.

---

## 📂 Struttura del Progetto

```
CssBuy/
├── app/                       # Next.js App Router
│   ├── page.tsx               # Homepage con hero, ricerca, categorie e tutorial
│   ├── spreadsheet/           # Pagina Spreadsheet con filtri avanzati e selettore valuta
│   ├── item/[id]/             # Scheda di dettaglio singolo prodotto
│   ├── admin/                 # Pannello di amministrazione (aggiunta, modifica, eliminazione)
│   ├── api/                   # Endpoint REST API (auth, convert, products, upload)
│   ├── globals.css            # Stili globali e componenti UI (tema dark)
│   └── layout.tsx             # Layout root e viewport
├── data/                      # Persistenza dati JSON
│   ├── products.json          # Catalogo principale dei prodotti
│   └── deleted_ids.json       # Registro ID eliminati (tombstones)
├── lib/                       # Moduli di utilità e logica di business
│   ├── auth.ts                # Autenticazione e gestione sessione cookie admin
│   ├── convert.ts             # Logica di conversione e formattazione link marketplace
│   ├── product-store.ts       # Store prodotti con CRUD, sanitizzazione e tombstoning
│   └── products.ts            # Tipi prodotto, costanti e sample base
├── public/                    # File statici serviti direttamente
│   ├── products/              # Immagini di catalogo predefinite
│   └── uploads/               # Immagini caricate tramite pannello admin
├── scripts/                   # Strumenti di automazione e scraping (vedi scripts/README.md)
│   ├── sync-original-prices.js# Sincronizzazione prezzi originali ¥ RMB e € EUR
│   ├── test-prices.js         # Validazione catalogo e prezzi
│   ├── bot.js                 # Bot Chromium per sincronizzazione ordini
│   └── auto-scraper.js        # Scraper Playwright
├── package.json               # Configurazione del progetto e comandi npm
├── tsconfig.json              # Configurazione TypeScript
└── next.config.mjs            # Configurazione Next.js
```

---

## ⚙️ Comandi NPM Disponibili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo su `http://localhost:3000` |
| `npm run build` | Compila l'applicazione per la produzione |
| `npm start` | Avvia il server di produzione su porta 3000 |
| `npm run typecheck` | Esegue il controllo dei tipi TypeScript senza generare output |
| `npm test` | Esegue i test di integrità del catalogo e dei prezzi |
| `npm run sync-prices` | Sincronizza i prezzi reali in Yuan (¥) ed Euro (€) offline |
| `npm run bot` | Avvia il bot interattivo di importazione ordini |
| `npm run scrape` | Esegue lo scraper automatico |

---

## 🔐 Pannello Admin & Sicurezza

- La pagina `/admin` permette di aggiungere nuovi articoli (con caricamento immagine), modificare titoli, venditori, prezzi in EUR e RMB, categorie e link, oppure eliminare articoli.
- L'autenticazione impiega cookie di sessione protetti per eliminare conflitti con password manager del browser.
- Le API accettano sia sessione cookie sia password diretta per script esterni.
