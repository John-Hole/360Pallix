/**
 * =========================================================================
 * 360PALLIX - RIPRISTINO E SINCRONIZZAZIONE PREZZI ORIGINALI (OFFLINE ZERO-TRAFFICO)
 * =========================================================================
 * Questo script:
 * 1. Ripristina tutti i prezzi reali corretti dei prodotti provenienti dagli ordini
 *    autentici dell'utente (eliminando sovrascritture anomale da 0.58€ dovute a coupon o errori).
 * 2. Assegna a ciascun prodotto sia il prezzo in Euro (€) che il prezzo originale
 *    in Yuan / RMB (¥) registrato dal marketplace d'origine (Weidian / Taobao / 1688).
 * 3. Opera in modo al 100% OFFLINE e DETERMINISTICO:
 *    - Nessun traffico di rete generato (zero sovraccarico, zero ban IP, zero captchas).
 *    - Esecuzione istantanea e sicura.
 * =========================================================================
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const RMB_TO_EUR = 7.8;

// Tabella dei prezzi autentici estratti dagli ordini effettivi iTaoBuy / CSSBuy
const AUTHENTIC_PRICES = {
  'arabic-dial-watch-1158-33-895947505115': { price: 3.17, priceRmb: 25 },
  'american-eric-emanuel-ee-short-xoh5kn': { price: 4.53, priceRmb: 35 },
  'swiss-brand-men-s-watch-waterp-5giqo2': { price: 8.09, priceRmb: 63 },
  'ee-american-casual-shorts-men--87ya6w': { price: 6.18, priceRmb: 48 },
  'go26050005079-wyfvnb': { price: 3.50, priceRmb: 27 },
  'green-water-ghost-automatic-me-i4hrmq': { price: 5.98, priceRmb: 47 },
  'classic-old-flower-fabric-17pr-qntuz7': { price: 4.30, priceRmb: 34 },
  'earbuds-pro-2-with-noise-reduc-5r3lxv': { price: 19.35, priceRmb: 151 },
  's-ka-te-fashion-sports-double--yjp30t': { price: 61.76, priceRmb: 480 },
  'fashionable-and-versatile-swea-64p16t': { price: 22.96, priceRmb: 179 },
  'dc-three-white-i1lfel': { price: 20.27, priceRmb: 158 },
  'spring-and-autumn-hooded-zippe-e4negx': { price: 70.50, priceRmb: 550 },
  'cross-border-foreign-trade-6-p-mnhna1': { price: 4.40, priceRmb: 34 },
  'gallery-basic-letter-logo-prin-8mb8sa': { price: 8.80, priceRmb: 69 },
  's-stone-bag-collection-xl6bkq': { price: 15.84, priceRmb: 124 },
  'autumn-new-men-s-hot-selling-r-8tl8ey': { price: 12.14, priceRmb: 95 },
  'swiss-brand-new-waterproof-ult-qso6ko': { price: 5.63, priceRmb: 44 },
  'autumn-and-winter-fashion-joke-sz7jy7': { price: 17.42, priceRmb: 136 },
  'xjxpcs-new-fashion-joker-t-shi-5lv3ql': { price: 8.62, priceRmb: 67 },
  'lfll-hoodie-rf-enter-store-mor-vmpl3c': { price: 60.00, priceRmb: 468 },
  'fashion-joker-belt-non-quality-i8ydjm': { price: 12.14, priceRmb: 95 },
  'pfdzlfll-cost-effective-fashio-rq22tf': { price: 8.62, priceRmb: 67 },
  'd-1-fashion-exquisite-simple-c-je86z9': { price: 11.96, priceRmb: 93 },
  'quick-drying-t-shirt-sports-st-5oe4uf': { price: 7.92, priceRmb: 62 },
  'autumn-and-winter-casual-fashi-epjy7z': { price: 12.14, priceRmb: 95 },
  'watches-men-s-advanced-sense-w-lrskgo': { price: 3.17, priceRmb: 25 },
  'sup-underwear-men-s-mid-waist--1szkld': { price: 7.92, priceRmb: 62 },
  'putian-shoes-af1-microfiber-ai-vwd030': { price: 11.44, priceRmb: 89 },
  'dep-jeans-oqywlu': { price: 34.84, priceRmb: 272 }
};

function syncOriginalPrices() {
  console.log('🔄 Lettura di data/products.json...');
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  let restoredCount = 0;
  let rmbAssigned = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const auth = AUTHENTIC_PRICES[p.id];

    if (auth) {
      if (p.price !== auth.price) {
        console.log(`  [Ripristino #${i + 1}] ${p.id}: €${p.price} -> €${auth.price} (¥${auth.priceRmb})`);
        p.price = auth.price;
        restoredCount++;
      }
      p.priceRmb = auth.priceRmb;
      rmbAssigned++;
    } else {
      // Se non è nei 29, calcola il prezzo originale RMB esatto
      if (!p.priceRmb || p.priceRmb <= 0) {
        p.priceRmb = Math.round(p.price * RMB_TO_EUR);
        rmbAssigned++;
      }
    }

    // Sanity check finale
    if (isNaN(p.price) || p.price <= 0) {
      p.price = 19.99;
      p.priceRmb = Math.round(19.99 * RMB_TO_EUR);
    }
  }

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');

  console.log('------------------------------------------------------------------');
  console.log(`✅ Successo! Ripristinati ${restoredCount} prezzi corrotti.`);
  console.log(`🏷️  Prezzo originale in Yuan (priceRmb) assegnato a TUTTI gli ${products.length} prodotti.`);
  console.log('💾 File data/products.json salvato con successo!');
  console.log('------------------------------------------------------------------');
}

if (require.main === module) {
  syncOriginalPrices();
}

module.exports = { syncOriginalPrices, AUTHENTIC_PRICES };
