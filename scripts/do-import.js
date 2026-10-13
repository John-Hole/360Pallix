const fs = require('fs');
const path = require('path');

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
    if (raw.sourceUrl && !raw.sourceUrl.includes('#') && existing.sourceUrl.includes('#')) {
      existing.sourceUrl = raw.sourceUrl;
    }
  }
}

const rawProducts = Array.from(map.values());

function classify(p) {
  const l = (p.title + ' ' + (p.category || '')).toLowerCase();
  let brand = '—';
  let category = 'OTHER';

  // Brand classification
  if (l.includes('vezere') || l.includes('moncler')) brand = 'Moncler';
  else if (l.includes('adizero')) brand = 'Adidas';
  else if (l.includes('cd') || l.includes('d-brand') || l.includes('dior')) brand = 'Dior';
  else if (l.includes('hellstar')) brand = 'Hellstar';
  else if (l.includes('cole buxton')) brand = 'Cole Buxton';
  else if (l.includes('1996') || l.includes('小标北棉') || l.includes('north')) brand = 'The North Face';
  else if (l.includes('1977') || l.includes('essentials')) brand = 'Essentials';
  else if (l.includes('centralcee') || l.includes('drill')) brand = 'Corteiz';
  else if (l.includes('balaclava') || l.includes('面罩') || l.includes('stone')) brand = 'Stone Island';
  else if (l.includes('binbond')) brand = 'BINBOND';
  else if (l.includes('nocta') || l.includes('hot step')) brand = 'Nike NOCTA';
  else if (l.includes('vomero') || l.includes('皮蓬') || l.includes('hv8150') || l.includes('nike')) brand = 'Nike';
  else if (l.includes('乔1') || l.includes('乔4') || l.includes('乔6') || l.includes('乔11') || l.includes('jordan')) brand = 'Jordan';
  else if (l.includes('yz slide') || l.includes('yeezy')) brand = 'Yeezy';
  else if (l.includes('rllpanda')) brand = 'RLLPANDA';

  // Category classification
  if (
    l.includes('shoe') || l.includes('sneaker') || l.includes('跑鞋') ||
    l.includes('板鞋') || l.includes('拖鞋') || l.includes('slide') ||
    l.includes('vomero') || l.includes('adizero') || l.includes('jordan') ||
    l.includes('nocta') || l.includes('乔')
  ) {
    category = 'SNEAKERS';
  } else if (l.includes('hoodie') || l.includes('felpa') || l.includes('sweater') || l.includes('zip') || l.includes('tracksuit')) {
    category = 'HOODIE';
  } else if (l.includes('t-shirt') || l.includes('tee') || l.includes('t恤') || l.includes('shirt') || l.includes('jersey') || l.includes('体桖') || l.includes('打底衫')) {
    category = 'TSHIRT';
  } else if (l.includes('short') || l.includes('pants') || l.includes('jeans') || l.includes('jogger') || l.includes('短裤') || l.includes('裤')) {
    category = 'PANTS';
  } else if (l.includes('jacket') || l.includes('puffer') || l.includes('coat') || l.includes('羽绒') || l.includes('giacca') || l.includes('vezere')) {
    category = 'JACKET';
  } else if (
    l.includes('sock') || l.includes('socks') || l.includes('calze') ||
    l.includes('watch') || l.includes('sunglasses') || l.includes('balaclava') ||
    l.includes('面罩') || l.includes('tube')
  ) {
    category = 'ACCESSORIES';
  }

  // Prezzo minimo realistico
  let price = p.price;
  if (!price || isNaN(price) || price < 0.1) price = 14.99;

  return {
    ...p,
    brand,
    category,
    price
  };
}

const classified = rawProducts.map(classify);

// Formattazione per data/products.json
const refCode = '2ab90a34eeaa437b';
const doppelfitRef = 'PPnCbrec';

const finalProducts = classified.map((item, idx) => {
  const slug = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32) || `product-${idx + 1}`;

  // Se c'è un'immagine placeholder CSSBuy, possiamo usare un'immagine di categoria o mantenerla
  let image = item.image;
  if (!image || image.includes('commonImage/cssbuy.png') || image.includes('trunanrk')) {
    image = `/products/p${(idx % 10) + 1}.jpg`;
  }

  // Link CSSBuy con codice affiliato
  let cssbuyUrl = item.sourceUrl;
  if (!cssbuyUrl || cssbuyUrl.includes('/shop/cate/order#')) {
    cssbuyUrl = `https://www.cssbuy.com/?promotionCode=${refCode}`;
  } else if (!cssbuyUrl.includes('promotionCode=')) {
    cssbuyUrl += (cssbuyUrl.includes('?') ? '&' : '?') + `promotionCode=${refCode}`;
  }

  return {
    id: `${slug}-${idx + 1}`,
    title: item.title,
    seller: item.seller || 'CSSBuy Order',
    category: item.category,
    brand: item.brand,
    price: item.price,
    image,
    cssbuyUrl,
    doppelfitUrl: `https://doppel.fit/?ref=${doppelfitRef}`
  };
});

const targetFile = path.join(__dirname, '..', 'data', 'products.json');
fs.writeFileSync(targetFile, JSON.stringify(finalProducts, null, 2), 'utf8');

console.log(`\n🎉 Salvati con successo ${finalProducts.length} prodotti in: ${targetFile}`);
