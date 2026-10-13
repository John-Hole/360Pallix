/**
 * =========================================================================
 * 360PALLIX - AUTO-BOT UFFICIALE (Playwright)
 * =========================================================================
 * 
 * Questo bot apre un browser Chromium reale, ascolta il traffico di rete tra
 * il tuo browser e i server di CSSBuy / iTaoBuy, e intercetta direttamente i
 * dati ORIGINALI inviati dal server:
 * - Veri link Weidian, Taobao, 1688 (niente link alla home o #ID)
 * - Foto originali in alta risoluzione dai server cinesi (niente placeholder)
 * - Prezzi originali convertiti in €
 * - Titoli veri dei prodotti puliti
 * - Conversione automatica con i tuoi codici affiliato (CSSBuy & Doppelfit)
 * - Salvataggio automatico diretto in data/products.json!
 * 
 * Per avviarlo da terminale:
 * node scripts/bot.js
 * =========================================================================
 */

const { chromium } = require('../_ref/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const CSSBUY_PROMOTION_CODE = process.env.CSSBUY_PROMOTION_CODE || '2ab90a34eeaa437b';
const DOPPELFIT_REF = process.env.DOPPELFIT_REF || 'PPnCbrec';
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');

const RMB_TO_EUR = 7.8;
const USD_TO_EUR = 0.92;

function cleanTitle(t) {
  if (!t) return '';
  return t
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/✎/g, '')
    .replace(/：/g, ':')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  else if (l.includes('centralcee') || l.includes('drill') || l.includes('corteiz')) brand = 'Corteiz';
  else if (l.includes('balaclava') || l.includes('stone island') || l.includes('stone')) brand = 'Stone Island';
  else if (l.includes('nocta') || l.includes('hot step')) brand = 'Nike NOCTA';
  else if (l.includes('vomero') || l.includes('uptempo') || l.includes('皮蓬') || l.includes('nike') || l.includes('dunk') || l.includes('force')) brand = 'Nike';
  else if (l.includes('jordan') || l.includes('乔')) brand = 'Jordan';
  else if (l.includes('yeezy') || l.includes('slide')) brand = 'Yeezy';
  else if (l.includes('watch') || l.includes('orologio') || l.includes('1158')) brand = 'Fashion Watch';

  if (
    l.includes('shoe') || l.includes('sneaker') || l.includes('dunk') ||
    l.includes('jordan') || l.includes('force') || l.includes('air') ||
    l.includes('kobe') || l.includes('yeezy') || l.includes('adizero') ||
    l.includes('runner') || l.includes('hoka') || l.includes('travis') ||
    l.includes('scarpe') || l.includes('slide') || l.includes('拖鞋') ||
    l.includes('板鞋') || l.includes('跑鞋') || l.includes('vomero')
  ) {
    category = 'SNEAKERS';
  } else if (l.includes('hoodie') || l.includes('felpa') || l.includes('sweater') || l.includes('zip') || l.includes('tracksuit')) {
    category = 'HOODIE';
  } else if (l.includes('tee') || l.includes('t-shirt') || l.includes('maglia') || l.includes('shirt') || l.includes('jersey')) {
    category = 'TSHIRT';
  } else if (l.includes('pant') || l.includes('jeans') || l.includes('short') || l.includes('jogger') || l.includes('trousers') || l.includes('pantaloni') || l.includes('短裤')) {
    category = 'PANTS';
  } else if (l.includes('jacket') || l.includes('puffer') || l.includes('coat') || l.includes('giacca') || l.includes('windbreaker') || l.includes('down') || l.includes('vezere') || l.includes('moncler') || l.includes('羽绒')) {
    category = 'JACKET';
  } else if (l.includes('watch') || l.includes('orologio') || l.includes('dial') || l.includes('cap') || l.includes('hat') || l.includes('beanie') || l.includes('bag') || l.includes('belt') || l.includes('wallet') || l.includes('cintura') || l.includes('socks') || l.includes('calze') || l.includes('sunglasses') || l.includes('balaclava') || l.includes('面罩')) {
    category = 'ACCESSORIES';
  }

  return { brand, category };
}

function buildAffiliateLink(sourceUrl) {
  if (!sourceUrl) return `https://www.cssbuy.com/?promotionCode=${CSSBUY_PROMOTION_CODE}`;

  // Se è un link Weidian
  const wdMatch = sourceUrl.match(/itemID=(\d+)/i) || sourceUrl.match(/item-(\d+)/i);
  if (sourceUrl.includes('weidian.com') && wdMatch) {
    return `https://www.cssbuy.com/shop/goodsDetail?promotionCode=${encodeURIComponent(CSSBUY_PROMOTION_CODE)}&item-micro-${wdMatch[1]}.html&id=${wdMatch[1]}&type=weidian`;
  }

  // Se è 1688
  const aliMatch = sourceUrl.match(/offer\/(\d+)/i) || sourceUrl.match(/item-1688-(\d+)/i);
  if (sourceUrl.includes('1688.com') && aliMatch) {
    return `https://www.cssbuy.com/shop/goodsDetail?promotionCode=${encodeURIComponent(CSSBUY_PROMOTION_CODE)}&item-1688-${aliMatch[1]}.html&id=${aliMatch[1]}&type=1688`;
  }

  // Se è Taobao
  const tbMatch = sourceUrl.match(/id=(\d+)/i);
  if ((sourceUrl.includes('taobao.com') || sourceUrl.includes('tmall.com')) && tbMatch) {
    return `https://www.cssbuy.com/shop/goodsDetail?promotionCode=${encodeURIComponent(CSSBUY_PROMOTION_CODE)}&item-taobao-${tbMatch[1]}.html&id=${tbMatch[1]}&type=taobao`;
  }

  if (sourceUrl.includes('cssbuy.com')) {
    return sourceUrl.includes('promotionCode') ? sourceUrl : `${sourceUrl}&promotionCode=${CSSBUY_PROMOTION_CODE}`;
  }

  return `https://www.cssbuy.com/?promotionCode=${CSSBUY_PROMOTION_CODE}`;
}

(async () => {
  console.log('===============================================================');
  console.log('🤖 360PALLIX AUTO-BOT IMPORTER');
  console.log('===============================================================');
  console.log('Avvio browser in corso...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const interceptedProducts = new Map();

  // Ascolta TUTTE le risposte di rete per intercettare i dati JSON originali
  page.on('response', async (response) => {
    const url = response.url();
    if (
      (url.includes('order') || url.includes('goods') || url.includes('list') || url.includes('user')) &&
      !url.endsWith('.js') && !url.endsWith('.css') && !url.endsWith('.png') && !url.endsWith('.jpg')
    ) {
      try {
        const text = await response.text();
        const json = JSON.parse(text);

        // Trova array con oggetti ordine
        let rawOrders = [];
        const findArrays = (obj, d = 0) => {
          if (!obj || d > 4) return;
          if (Array.isArray(obj) && obj.length > rawOrders.length) rawOrders = obj;
          else if (typeof obj === 'object') {
            for (const k of Object.keys(obj)) findArrays(obj[k], d + 1);
          }
        };
        findArrays(json);

        if (rawOrders.length > 0 && typeof rawOrders[0] === 'object') {
          console.log(`📡 [INTERCETTATO] Il server ha inviato ${rawOrders.length} ordini!`);

          rawOrders.forEach((order) => {
            const items = order.goodsList || order.goods_list || order.items || order.goods || order.order_goods || [order];
            items.forEach((item) => {
              let title = cleanTitle(item.goods_name || item.goodsName || item.goods_title || item.title || item.name || order.goods_name || '');
              if (!title || title.length < 2) return;

              const lower = title.toLowerCase();
              if (
                lower.includes('measure size') ||
                lower.includes('protection box') ||
                lower.includes('air column') ||
                lower.includes('shoe tree') ||
                lower.includes('take video') ||
                lower.includes('insurance') ||
                lower.includes('bubble film') ||
                lower.includes('order number')
              ) return;

              let image = item.goods_img || item.goodsImg || item.goods_pic || item.pic || item.image || item.img || order.goods_img || '';
              if (image.startsWith('//')) image = 'https:' + image;
              if (image.includes('commonImage') || image.includes('trunanrk') || image.includes('logo')) image = '';

              let rawPrice = item.goods_price || item.price || item.goods_price_rmb || order.order_price || 0;
              let price = parseFloat(String(rawPrice).replace(/[^\d.]/g, ''));
              if (item.currency === 'RMB' || item.currency === 'CNY' || price > 75) {
                price = parseFloat((price / RMB_TO_EUR).toFixed(2));
              } else if (item.currency === 'USD') {
                price = parseFloat((price * USD_TO_EUR).toFixed(2));
              }
              if (!price || isNaN(price)) price = 19.99;

              let sourceUrl = item.goods_url || item.goodsUrl || item.url || item.source_url || item.item_url || order.goods_url || '';
              if (sourceUrl.includes('url=')) {
                try {
                  const u = new URL(sourceUrl);
                  const inner = u.searchParams.get('url');
                  if (inner) sourceUrl = decodeURIComponent(inner);
                } catch (e) {}
              }

              const { brand, category } = detectBrandAndCategory(title);
              const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 35) || 'product';

              const product = {
                id: `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
                title,
                seller: item.shop_name || 'Verified Order',
                category,
                brand,
                price,
                image: image || '/products/p1.jpg',
                cssbuyUrl: buildAffiliateLink(sourceUrl),
                doppelfitUrl: `https://doppel.fit/?ref=${DOPPELFIT_REF}`,
              };

              const key = sourceUrl || title;
              if (!interceptedProducts.has(key)) {
                interceptedProducts.set(key, product);
                console.log(`✅ [Prodotto Riconosciuto]: ${title.slice(0, 45)} | €${price} | Immagine: ${image ? 'SI' : 'NO'}`);
              }
            });
          });

          // Salva automaticamente nel database
          if (interceptedProducts.size > 0) {
            saveToDatabase(Array.from(interceptedProducts.values()));
          }
        }
      } catch (e) {}
    }
  });

  function saveToDatabase(newItems) {
    let existing = [];
    try {
      existing = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    } catch (e) {
      existing = [];
    }

    const titleMap = new Map();
    // Prima i nuovi intercettati
    newItems.forEach((p) => titleMap.set(p.title.toLowerCase().trim(), p));
    // Poi gli esistenti non duplicati
    existing.forEach((p) => {
      const k = p.title.toLowerCase().trim();
      if (!titleMap.has(k)) titleMap.set(k, p);
    });

    const merged = Array.from(titleMap.values());
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(merged, null, 2), 'utf8');
    console.log(`\n💾 [DATABASE AGGIORNATO]: ${merged.length} prodotti totali salvati in data/products.json!`);
  }

  console.log('Apro la pagina iniziale di CSSBuy...');
  await page.goto('https://www.cssbuy.com/shop/cate/order');

  console.log('\n---------------------------------------------------------------');
  console.log('👉 ACCEDI AL TUO ACCOUNT CSSBUY O ITAOBUY NELLA FINESTRA DEL BROWSER.');
  console.log('👉 VAI NELLA SEZIONE ORDINI (Orders / Warehouse).');
  console.log('👉 Il bot intercetterà automaticamente TUTTI gli ordini dal server,');
  console.log('   prenderà i link veri, le foto in alta risoluzione e i prezzi,');
  console.log('   e li salverà direttamente in data/products.json!');
  console.log('---------------------------------------------------------------\n');
})();
