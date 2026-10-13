# Scripts di Utilità & Automazione (360Pallix)

Questa cartella contiene gli strumenti di automazione, scraping, conversione link, validazione e sincronizzazione del catalogo per **360Pallix**.

---

## 🛠️ Script Principali

| Script | Comando NPM / Node | Descrizione |
|---|---|---|
| [`sync-original-prices.js`](file:///d:/Antigravity/CssBuy/scripts/sync-original-prices.js) | `npm run sync-prices` | **Ripristino e sync prezzi originali (RMB / EUR)**: sincronizza al 100% offline e senza traffico di rete i prezzi reali di listino (¥) ed Euro (€). |
| [`test-prices.js`](file:///d:/Antigravity/CssBuy/scripts/test-prices.js) | `npm test` | **Test suite catalogo & prezzi**: verifica l'integrità di tutti i prodotti, coerenza cambio Yuan/Euro e formattazione. |
| [`bot.js`](file:///d:/Antigravity/CssBuy/scripts/bot.js) | `npm run bot` | **Bot interattivo CSSBuy & iTaoBuy**: apre un browser Chromium con profilo persistente (`.bot-profile`) per importare o aggiornare ordini. |
| [`auto-scraper.js`](file:///d:/Antigravity/CssBuy/scripts/auto-scraper.js) | `npm run scrape` | **Scraper automatico con Playwright**: estrae i prodotti dal portale target e li predispone per il catalogo. |

---

## 🔍 Script di Verifica e Test

| Script | Comando | Descrizione |
|---|---|---|
| [`verify-admin.mjs`](file:///d:/Antigravity/CssBuy/scripts/verify-admin.mjs) | `node scripts/verify-admin.mjs` | Verifica le API admin (`/api/products`), autenticazione con cookie e gestione prodotti (aggiunta, modifica, eliminazione). |
| [`verify-doppelfit.mjs`](file:///d:/Antigravity/CssBuy/scripts/verify-doppelfit.mjs) | `node scripts/verify-doppelfit.mjs` | Verifica la corretta formattazione dei link e deep-link Doppelfit (`/item/{platform}/{id}`). |

---

## 📦 Script di Estrazione e Importazione

| Script | Descrizione |
|---|---|
| [`extract-universal.js`](file:///d:/Antigravity/CssBuy/scripts/extract-universal.js) | Parser universale per URL CSSBuy, iTaoBuy, Weidian, Taobao e 1688. |
| [`extract-cssbuy.js`](file:///d:/Antigravity/CssBuy/scripts/extract-cssbuy.js) | Estrattore specifico per payload e URL del portale CSSBuy. |
| [`extract-itaobuy.js`](file:///d:/Antigravity/CssBuy/scripts/extract-itaobuy.js) | Estrattore specifico per dati e ordini di iTaoBuy. |
| [`enrich-products.js`](file:///d:/Antigravity/CssBuy/scripts/enrich-products.js) | Script di arricchimento dati prodotto (recupero metadati da Weidian/Taobao/1688). |
| [`do-import.js`](file:///d:/Antigravity/CssBuy/scripts/do-import.js) | Inserimento e normalizzazione di prodotti estratti in `data/products.json`. |
| [`clean-import.js`](file:///d:/Antigravity/CssBuy/scripts/clean-import.js) | Pulizia e formattazione di dump JSON grezzi. |

---

## 📁 Dati Generati

- `.bot-profile/`: Profilo browser Chromium (memorizza le sessioni di login locali, ignorato da Git).
- `scripts/.bot-output/`: Dati grezzi temporanei estratti dal bot (ignorato da Git).
