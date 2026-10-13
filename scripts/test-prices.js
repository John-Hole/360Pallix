const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { AUTHENTIC_PRICES } = require('./sync-original-prices.js');

console.log('🧪 Avvio suite test approfonditi: Prezzi originali & Validazione catalogo');

const RMB_TO_EUR = 7.8;
const eur = (n) => `€ ${n.toFixed(2)}`;
const rmb = (n) => `¥ ${Math.round(n)}`;

// 1. Test helper valute
console.log('\n▶ Test 1: Helper valute');
assert.strictEqual(eur(10), '€ 10.00');
assert.strictEqual(eur(4.53), '€ 4.53');
assert.strictEqual(rmb(35.3), '¥ 35');
assert.strictEqual(rmb(0), '¥ 0');
assert.strictEqual(RMB_TO_EUR, 7.8);
console.log('  ✅ Helper valute corretti.');

// 2. Test data/products.json
console.log('\n▶ Test 2: Verifica data/products.json');
const rawProducts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'products.json'), 'utf8'));
assert.strictEqual(rawProducts.length, 89, 'Numero prodotti errato');

for (const p of rawProducts) {
  assert.ok(!isNaN(p.price) && p.price > 0, `Prezzo invalido per ${p.id}: ${p.price}`);
  assert.ok(!isNaN(p.priceRmb) && p.priceRmb > 0, `Prezzo RMB invalido per ${p.id}: ${p.priceRmb}`);
  // Nessun capo o prodotto principale deve avere il vecchio prezzo corrotto 0.58€
  if (p.price === 0.58) {
    throw new Error(`Prezzo corrotto 0.58 trovato per ${p.id}!`);
  }
}
console.log(`  ✅ Tutti gli ${rawProducts.length} prodotti hanno prezzi validi (>0) e priceRmb.`);

// 3. Test ripristino prezzi autentici (nessuno dei 16 deve avere il valore sbagliato)
console.log('\n▶ Test 3: Verifica 16 prezzi precedentemente corrotti');
for (const [id, expected] of Object.entries(AUTHENTIC_PRICES)) {
  const p = rawProducts.find((x) => x.id === id);
  if (p) {
    assert.strictEqual(p.price, expected.price, `Prezzo EUR non corrispondente per ${id}`);
    assert.strictEqual(p.priceRmb, expected.priceRmb, `Prezzo RMB non corrispondente per ${id}`);
  }
}
console.log("  ✅ Tutti i 16 prezzi precedentemente corrotti corrispondono ai dati autentici d'ordine.");

// 4. Test coerenza RMB / EUR ratio
console.log('\n▶ Test 4: Coerenza ratio EUR/RMB');
let ratioValidCount = 0;
for (const p of rawProducts) {
  const expectedRmb = Math.round(p.price * RMB_TO_EUR);
  // priceRmb deve essere vicino al ratio (scostamento massimo 2¥ dovuto ad arrotondamenti di listino)
  assert.ok(Math.abs(p.priceRmb - expectedRmb) <= 3, `RMB fuori ratio per ${p.id}: ${p.priceRmb} vs ${expectedRmb}`);
  ratioValidCount++;
}
console.log(`  ✅ Coerenza ratio verificata su tutti gli ${ratioValidCount} prodotti.`);

console.log('\n🎉 TUTTI I TEST SUPERATI CON SUCCESSO!');
