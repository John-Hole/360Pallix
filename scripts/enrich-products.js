/**
 * =========================================================================
 * 360PALLIX - AUTO-VERIFICATORE & ARRICCHITORE PRODOTTI WEIDIAN & 1688
 * =========================================================================
 * Questo script:
 * 1. Apre ciascun link Weidian / 1688 originale con un browser headless.
 * 2. Verifica se il prodotto esiste ancora e ne ricava il titolo pulito.
 * 3. Scarica e assegna la foto originale ad altissima definizione (HD).
 * 4. Calcola il prezzo convertito in Euro.
 * 5. Assegna il brand e la categoria accurati.
 * 6. Aggiorna data/products.json in automatico.
 * =========================================================================
 */

const { chromium } = require('../_ref/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const RMB_TO_EUR = 7.8;
const CSSBUY_CODE = '2ab90a34eeaa437b';
const DOPPEL_REF = 'PPnCbrec';

function detectBrandAndCategory(title) {
  const l = title.toLowerCase();
  let brand = '—';
  let category = 'OTHER';

  if (l.includes('vezere') || l.includes('moncler')) brand = 'Moncler';
  else if (l.includes('adizero')) brand = 'Adidas';
  else if (l.includes('d-brand') || l.includes('cd') || l.includes('dior')) brand = 'Dior';
  else if (l.includes('hellstar')) brand = 'Hellstar';
  else if (l.includes('cole buxton')) brand = 'Cole Buxton';
  else if (l.includes('1996') || l.includes('nuptse') || l.includes('north')) brand = 'The North Face';
  else if (l.includes('1977') || l.includes('essentials')) brand = 'Essentials';
  else if (l.includes('corteiz') || l.includes('centralcee') || l.includes('drill')) brand = 'Corteiz';
  else if (l.includes('stone island') || l.includes('stone bag') || l.includes('s stone')) brand = 'Stone Island';
  else if (l.includes('nocta') || l.includes('hot step')) brand = 'Nike NOCTA';
  else if (l.includes('af1') || l.includes('air force') || l.includes('vomero') || l.includes('uptempo') || l.includes('皮蓬') || l.includes('nike') || l.includes('dunk')) brand = 'Nike';
  else if (l.includes('jordan') || l.includes('乔')) brand = 'Jordan';
  else if (l.includes('yeezy') || l.includes('slide')) brand = 'Yeezy';
  else if (l.includes('eric emanuel') || l.includes('ee shorts') || l.includes('ee american')) brand = 'Eric Emanuel';
  else if (l.includes('swiss') || l.includes('watch') || l.includes('water ghost') || l.includes('orologio') || l.includes('1158') || l.includes('binbond')) brand = 'Fashion Watch';
  else if (l.includes('gallery dept') || l.includes('gallery')) brand = 'Gallery Dept';
  else if (l.includes('earbuds') || l.includes('airpods') || l.includes('apple')) brand = 'Apple Audio';
  else if (l.includes('sup ') || l.includes('supreme')) brand = 'Supreme';
  else if (l.includes('sp5der') || l.includes('spider')) brand = 'Sp5der';
  else if (l.includes('bape')) brand = 'Bape';
  else if (l.includes('denim tears')) brand = 'Denim Tears';

  if (
    l.includes('shoe') || l.includes('sneaker') || l.includes('dunk') ||
    l.includes('jordan') || l.includes('force') || l.includes('af1') ||
    l.includes('air') || l.includes('adizero') || l.includes('runner') ||
    l.includes('hoka') || l.includes('travis') || l.includes('scarpe') ||
    l.includes('slide') || l.includes('拖鞋') || l.includes('vomero') ||
    l.includes('s*ka*te') || l.includes('s * ka * te') || l.includes('putian') ||
    l.includes('shoes') || l.includes('sneakers')
  ) {
    category = 'SNEAKERS';
  } else if (l.includes('hoodie') || l.includes('felpa') || l.includes('sweater') || l.includes('zip') || l.includes('tracksuit')) {
    category = 'HOODIE';
  } else if (l.includes('tee') || l.includes('t-shirt') || l.includes('maglia') || l.includes('shirt') || l.includes('jersey') || l.includes('体桖') || l.includes('短袖')) {
    category = 'TSHIRT';
  } else if (l.includes('pant') || l.includes('jeans') || l.includes('short') || l.includes('jogger') || l.includes('trousers') || l.includes('pantaloni') || l.includes('短裤') || l.includes('shorts')) {
    category = 'PANTS';
  } else if (l.includes('jacket') || l.includes('puffer') || l.includes('coat') || l.includes('giacca') || l.includes('windbreaker') || l.includes('down') || l.includes('vezere') || l.includes('moncler') || l.includes('羽绒')) {
    category = 'JACKET';
  } else if (l.includes('watch') || l.includes('water ghost') || l.includes('orologio') || l.includes('dial') || l.includes('cap') || l.includes('hat') || l.includes('beanie') || l.includes('bag') || l.includes('belt') || l.includes('wallet') || l.includes('cintura') || l.includes('socks') || l.includes('calze') || l.includes('balaclava') || l.includes('earbuds') || l.includes('card bag') || l.includes('underwear') || l.includes('sunglasses')) {
    category = 'ACCESSORIES';
  }

  return { brand, category };
}

function cleanTitle(title) {
  if (!title) return '';
  return title
    .replace(/^【[^】]+】\s*/, '')
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanImageUrl(imgUrl) {
  if (!imgUrl) return '';
  // Se è un'immagine con parametri di thumbnail (?w=30&h=30), rimuovili o imposta alta risoluzione
  let clean = imgUrl.split('?')[0];
  if (clean.startsWith('//')) clean = 'https:' + clean;
  return clean;
}

(async () => {
  console.log('===============================================================');
  console.log('🔍 360PALLIX - ISPEZIONE E ARRICCHIMENTO AUTOMATICO LINK WEIDIAN');
  console.log('===============================================================');

  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  console.log(`Caricati ${products.length} prodotti dal database.\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const u = p.cssbuyUrl || '';
    
    // Controlla se è un link Weidian
    const weidianMatch = u.match(/id=(\d+)/i) || u.match(/item-micro-(\d+)/i) || (p.sourceUrl && p.sourceUrl.match(/itemID=(\d+)/i));
    
    if (u.includes('weidian') || (p.sourceUrl && p.sourceUrl.includes('weidian.com')) || weidianMatch) {
      const itemId = weidianMatch ? weidianMatch[1] : null;
      if (!itemId) continue;

      const targetUrl = `https://weidian.com/item.html?itemID=${itemId}`;
      console.log(`[${i + 1}/${products.length}] 🌐 Ispezione Weidian #${itemId}: ${p.title.slice(0, 30)}...`);

      try {
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
        
        // Estrai titolo ufficiale
        const rawTitle = await page.title();
        const cleanedTitle = cleanTitle(rawTitle);

        // Estrai immagini ad alta risoluzione
        const imgs = await page.$$eval('img', els => els.map(e => e.src).filter(s => s && (s.includes('geilicdn') || s.includes('alicdn'))));
        
        // Trova l'immagine migliore (quella di dimensioni maggiori o del prodotto)
        const bestImg = imgs.find(img => img.includes('pcitem') || img.includes('wdseller') || img.includes('open') || img.includes('1200') || img.includes('640') || img.includes('750')) || imgs[0];

        // Estrai prezzo se presente nel DOM
        let price = p.price;
        try {
          const domPrice = await page.$eval('.price, .item-price, [class*="price"]', el => el.innerText).catch(() => null);
          if (domPrice) {
            const num = parseFloat(domPrice.replace(/[^\d.]/g, ''));
            if (num > 0 && num < 10000) {
              price = parseFloat((num / RMB_TO_EUR).toFixed(2));
            }
          }
        } catch (e) {}

        let changed = false;

        if (bestImg) {
          const hdImg = cleanImageUrl(bestImg);
          if (hdImg && hdImg !== p.image) {
            console.log(`  📸 Nuova foto HD trovata: ${hdImg.slice(0, 60)}...`);
            p.image = hdImg;
            changed = true;
          }
        }

        if (cleanedTitle && cleanedTitle.length > 3 && !cleanedTitle.includes('Weidian') && cleanedTitle !== p.title) {
          console.log(`  🏷️  Nuovo titolo: ${cleanedTitle.slice(0, 50)}`);
          p.title = cleanedTitle;
          changed = true;
        }

        // Ricalcola Brand e Categoria
        const meta = detectBrandAndCategory(p.title);
        if (meta.brand !== '—' && p.brand === '—') {
          p.brand = meta.brand;
          changed = true;
        }
        if (meta.category !== 'OTHER' && p.category === 'OTHER') {
          p.category = meta.category;
          changed = true;
        }

        // Assicura il link affiliato corretto
        p.cssbuyUrl = `https://www.cssbuy.com/shop/goodsDetail?promotionCode=${CSSBUY_CODE}&item-micro-${itemId}.html&id=${itemId}&type=weidian`;
        p.doppelfitUrl = `https://doppel.fit/item/weidian/${itemId}?ref=${DOPPEL_REF}`;

        if (changed) updatedCount++;

      } catch (err) {
        console.log(`  ⚠️ Errore su #${itemId}: ${err.message}`);
      }
    }
  }

  await browser.close();

  // Salva il file aggiornato
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  console.log('\n===============================================================');
  console.log(`✨ Completato! Aggiornati con foto HD e dettagli: ${updatedCount} prodotti.`);
  console.log('💾 File data/products.json salvato con successo!');
  console.log('===============================================================');
})();
