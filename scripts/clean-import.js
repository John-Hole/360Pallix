const fs = require('fs');

const files = [
  'c:/Users/giova/Downloads/cssbuy_prodotti_11.json',
  'c:/Users/giova/Downloads/cssbuy_prodotti_27.json',
  'c:/Users/giova/Downloads/cssbuy_prodotti_43.json'
];

let items = [];
for (const f of files) {
  try {
    items = items.concat(JSON.parse(fs.readFileSync(f, 'utf8')));
  } catch (e) {
    console.error('Error reading', f, e.message);
  }
}

console.log('Total items loaded from all files:', items.length);

function cleanText(t) {
  if (!t) return '';
  return t
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/✎/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const invalidTitles = new Set([
  'confirmed', 'submitted', 'invalid', 'shipped', 'beijing time', 'pending',
  'unpaid', 'in warehouse', 'trash', 'product review', 'service review', 'buy it again'
]);

const map = new Map();

for (const raw of items) {
  let title = cleanText(raw.title);
  if (!title || title.length < 2) continue;
  if (invalidTitles.has(title.toLowerCase())) continue;
  if (title.toLowerCase().startsWith('beijing time')) continue;

  const key = title.toLowerCase();
  const existing = map.get(key);

  let img = raw.image || '';
  const isBetterImg = img && !img.includes('commonImage') && !img.includes('trunanrk') && !img.includes('static/img/order');

  if (!existing) {
    map.set(key, { ...raw, title });
  } else {
    if (isBetterImg && (!existing.image || existing.image.includes('commonImage'))) {
      existing.image = img;
    }
    if (raw.price && raw.price !== 19.99 && existing.price === 19.99) {
      existing.price = raw.price;
    }
  }
}

const cleanedList = Array.from(map.values());
console.log('Unique valid products after cleaning:', cleanedList.length);
cleanedList.forEach((p, i) => {
  console.log((i + 1).toString().padStart(2), '|', p.title.slice(0, 40).padEnd(40), '| €', p.price.toString().padStart(5), '|', (p.image || '').slice(0, 45));
});
