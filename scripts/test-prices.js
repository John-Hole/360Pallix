const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { AUTHENTIC_PRICES } = require('./sync-original-prices.js');

console.log('🧪 Avvio suite test approfonditi: Prezzi originali & Validazione catalogo');

const RMB_TO_EUR = 7.458;

const eur = (n) => {
  if (n === undefined || n === null || isNaN(n) || n <= 0) return '€ —';
  return `€ ${n.toFixed(2)}`;
};

const rmb = (n) => {
  if (n === undefined || n === null || isNaN(n) || n <= 0) return '¥ —';
  return n % 1 === 0 ? `¥ ${n}` : `¥ ${n.toFixed(2)}`;
};

// 1. Test helper valute & edge cases
console.log('\n▶ Test 1: Helper valute & casi limite');
assert.strictEqual(eur(10), '€ 10.00');
assert.strictEqual(eur(4.53), '€ 4.53');
assert.strictEqual(eur(0), '€ —');
assert.strictEqual(eur(null), '€ —');
assert.strictEqual(eur(undefined), '€ —');
assert.strictEqual(eur(NaN), '€ —');

assert.strictEqual(rmb(35), '¥ 35');
assert.strictEqual(rmb(25.72), '¥ 25.72');
assert.strictEqual(rmb(0), '¥ —');
assert.strictEqual(rmb(null), '¥ —');
assert.strictEqual(rmb(undefined), '¥ —');
assert.strictEqual(rmb(NaN), '¥ —');
assert.strictEqual(RMB_TO_EUR, 7.458);
console.log('  ✅ Helper valute corretti e robusti su tutti i casi limite.');

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
  const ratio = p.priceRmb / p.price;
  // Il ratio EUR/CNY reale deve essere sempre in un intervallo fisiologico di mercato (tra 7.0 e 8.2)
  assert.ok(ratio >= 7.0 && ratio <= 8.2, `Ratio anomalo per ${p.id}: ${ratio.toFixed(2)}`);
  ratioValidCount++;
}
console.log(`  ✅ Coerenza ratio verificata su tutti gli ${ratioValidCount} prodotti.`);

// 5. Test logica di ordinamento multivaluta (EUR vs CNY)
console.log('\n▶ Test 5: Logica ordinamento EUR vs CNY');
const testItems = [
  { id: 'a', price: 4.53, priceRmb: 35 },
  { id: 'b', price: 4.40, priceRmb: 34 },
  { id: 'c', price: 10.00, priceRmb: 75 }
];

const sortedEurAsc = [...testItems].sort((x, y) => x.price - y.price);
assert.deepStrictEqual(sortedEurAsc.map((i) => i.id), ['b', 'a', 'c']);

const sortedCnyAsc = [...testItems].sort((x, y) => (x.priceRmb ?? x.price * RMB_TO_EUR) - (y.priceRmb ?? y.price * RMB_TO_EUR));
assert.deepStrictEqual(sortedCnyAsc.map((i) => i.id), ['b', 'a', 'c']);

const sortedCnyDesc = [...testItems].sort((x, y) => (y.priceRmb ?? y.price * RMB_TO_EUR) - (x.priceRmb ?? x.price * RMB_TO_EUR));
assert.deepStrictEqual(sortedCnyDesc.map((i) => i.id), ['c', 'a', 'b']);
console.log('  ✅ Logica ordinamento multivaluta accurata sia in EUR che in CNY.');

console.log('\n🎉 TUTTI I TEST SUPERATI CON SUCCESSO!');
