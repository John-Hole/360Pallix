/**
 * 360PALLIX - BOT IMPORT ORDINI (CSSBuy + iTaoBuy)
 *
 * Uso:  npm run bot
 *  1. Si apre Chromium con un profilo persistente (.bot-profile, NON committato):
 *     il login resta salvato in locale, niente cookie da condividere.
 *  2. Fai login sulle due schede e apri la lista ordini. Premi INVIO nel terminale.
 *  3. Il bot scorre da solo tutte le pagine, cattura i dati degli ordini dal server,
 *     apre ogni link Weidian/Taobao/1688 per foto HD + titolo, e aggiorna data/products.json.
 *
 * I dati grezzi catturati vanno in scripts/.bot-output/raw.json (debug, non committato).
 */

const { chromium } = require('../_ref/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSSBUY_CODE = process.env.CSSBUY_PROMOTION_CODE || '2ab90a34eeaa437b';
const DOPPEL_REF = process.env.DOPPELFIT_REF || 'PPnCbrec';
const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const PROFILE_DIR = path.join(__dirname, '..', '.bot-profile');
const OUT_DIR = path.join(__dirname, '.bot-output');
const RMB_TO_EUR = 7.8;

const SERVICE_WORDS = ['measure size', 'protection box', 'air column', 'shoe tree', 'take video', 'insurance', 'bubble film', 'order number', 'contact us', 'beijing time'];
const GENERIC_TITLES = new Set(['white', 'black', 'item', 'shoes', 'tee', 'confirmed', 'mall', '商品详情']);

const ask = (q) => new Promise((r) => { const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); rl.question(q, () => { rl.close(); r(); }); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanTitle(t) {
  return String(t || '').replace(/&#0?39;?/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/✎/g, '').replace(/：/g, ':').replace(/\s+/g, ' ').trim();
}

// ---- Estrazione ID/URL sorgente ----
const SRC_RE = /(weidian\.com|taobao\.com|tmall\.com|1688\.com)/i;

function normalizeSource(u) {
  if (!u || typeof u !== 'string') return null;
  if (u.startsWith('//')) u = 'https:' + u;
  try {
    // link tipo itaobuy.com/product-detail?url=<encoded>
    if (/[?&]url=/.test(u)) {
      const inner = new URL(u).searchParams.get('url');
      if (inner) u = decodeURIComponent(inner);
    }
  } catch (e) {}
  if (!SRC_RE.test(u)) return null;
  let m;
  if ((m = u.match(/itemID=(\d+)/i)) && /weidian/i.test(u)) return { type: 'weidian', id: m[1], url: `https://weidian.com/item.html?itemID=${m[1]}` };
  if ((m = u.match(/1688\.com\/offer\/(\d+)/i))) return { type: '1688', id: m[1], url: `https://detail.1688.com/offer/${m[1]}.html` };
  if ((m = u.match(/[?&]id=(\d+)/i)) && /(taobao|tmall)/i.test(u)) return { type: 'taobao', id: m[1], url: `https://item.taobao.com/item.htm?id=${m[1]}` };
  return null;
}

function affiliateLink(src) {
  const slug = { weidian: 'micro', '1688': '1688', taobao: 'taobao' }[src.type];
  return `https://www.cssbuy.com/shop/goodsDetail?promotionCode=${CSSBUY_CODE}&item-${slug}-${src.id}.html&id=${src.id}&type=${src.type}`;
}

// ---- Cattura: cammina ogni JSON e prende oggetti che contengono un link sorgente ----
const captured = new Map(); // key type-id -> {src, title, image, price, seller}
const rawDump = [];

function pick(o, keys) { for (const k of keys) if (o[k] != null && o[k] !== '') return o[k]; return ''; }

function walk(node, depth = 0) {
  if (!node || depth > 8) return;
  if (Array.isArray(node)) return node.forEach((n) => walk(n, depth + 1));
  if (typeof node !== 'object') return;

  let src = null;
  for (const v of Object.values(node)) {
    if (typeof v === 'string' && (src = normalizeSource(v))) break;
  }
  if (src) {
    const title = cleanTitle(pick(node, ['goods_name', 'goodsName', 'goods_title', 'goodsTitle', 'title', 'name', 'item_name']));
    let image = String(pick(node, ['goods_img', 'goodsImg', 'goods_pic', 'goodsPic', 'pic', 'image', 'img', 'picUrl', 'thumb']));
    if (image.startsWith('//')) image = 'https:' + image;
    if (/commonImage|logo|\.svg|\/products\/p\d+/i.test(image)) image = '';
    const rawPrice = parseFloat(String(pick(node, ['goods_price', 'goodsPrice', 'price', 'unit_price', 'item_price'])).replace(/[^\d.]/g, '')) || 0;
    const key = `${src.type}-${src.id}`;
    const prev = captured.get(key) || {};
    captured.set(key, {
      src,
      title: prev.title || title,
      image: prev.image || image,
      priceRmb: prev.priceRmb || rawPrice,
      seller: pick(node, ['shop_name', 'shopName', 'seller']) || prev.seller || '',
    });
  }
  for (const v of Object.values(node)) walk(v, depth + 1);
}

function attachListener(page) {
  page.on('response', async (res) => {
    const url = res.url();
    if (!/(cssbuy\.com|itaobuy\.com)/i.test(url)) return;
    // Solo endpoint dei TUOI ordini (esclude carrello, prodotti consigliati, acquisti di altri utenti)
    if (!/(\/user\/order|getUserOrderDetail|order\/front\/order|orderList|OrderPage)/i.test(url)) return;
    if (/(cart|spuProduct|pageList|statistics|buyReport|realTime)/i.test(url)) return;
    if (/cssbuy\.com\/api\/v3\/user\/order/.test(url)) global.cssHeaders = res.request().headers();
    const ct = (res.headers()['content-type'] || '');
    if (!ct.includes('json')) return;
    try {
      const json = await res.json();
      const before = captured.size;
      walk(json);
      if (captured.size > before) {
        rawDump.push({ url, sample: JSON.stringify(json).slice(0, 4000) });
        console.log(`  📡 ${url.split('?')[0].slice(-60)} -> totale link catturati: ${captured.size}`);
      }
    } catch (e) {}
  });
}

// ---- Auto-paginazione generica ----
async function paginate(page, label) {
  console.log(`\n▶ Scorro le pagine ordini di ${label}...`);
  const nextSelectors = ['.el-pagination .btn-next', 'button.btn-next', '.ant-pagination-next', 'li.next:not(.disabled) a', '[class*="pagination"] [class*="next"]', 'a[rel="next"]'];
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await sleep(1200);
    let clicked = false;
    for (const sel of nextSelectors) {
      const el = await page.$(sel);
      if (!el) continue;
      const disabled = await el.evaluate((n) => n.disabled || n.classList.contains('disabled') || n.getAttribute('aria-disabled') === 'true' || n.className.includes('disabled')).catch(() => true);
      if (disabled) continue;
      await el.click().catch(() => {});
      clicked = true;
      await sleep(1800);
      break;
    }
    if (!clicked) { console.log(`  Ultima pagina raggiunta (${i + 1} pagine).`); break; }
  }
}

// Scarica tutte le pagine ordini CSSBuy direttamente dall'API (sessione gia loggata)
async function fetchAllCssOrders(page) {
  console.log('\n▶ Scarico tutti gli ordini CSSBuy via API...');
  for (let p = 1; p <= 30; p++) {
    const json = await page.evaluate(async ([n, hdrs]) => {
      const clean = {};
      for (const [k, v] of Object.entries(hdrs || {})) {
        if (/^(host|cookie|content-length|connection|accept-encoding|referer|origin|user-agent|sec-|:)/i.test(k)) continue;
        clean[k] = v;
      }
      const r = await fetch('/api/v3/user/order?page=' + n + '&pageSize=10', { credentials: 'include', headers: clean });
      return r.json();
    }, [p, global.cssHeaders]).catch((e) => { console.log('  ⚠️ fetch fallita: ' + e.message.split('\n')[0]); return null; });
    if (p === 1) console.log('  risposta pagina 1:', JSON.stringify(json).slice(0, 200));
    const recs = json && json.data && json.data.records;
    if (!recs || !recs.length) break;
    walk(json);
    console.log('  pagina ' + p + ': ' + recs.length + ' ordini (link totali: ' + captured.size + ')');
    if (p * 10 >= Number(json.data.total || 0)) break;
  }
}

// ---- Arricchimento da pagina prodotto ----
async function enrich(page, entry) {
  const { src } = entry;
  try {
    await page.goto(src.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(1500);
    const title = cleanTitle(await page.title());
    const img = await page.$$eval('img', (els) => els.map((e) => e.currentSrc || e.src).filter((s) => s && /(geilicdn|alicdn)/.test(s) && !/hz_img_|avatar|logo|icon/.test(s)));
    const og = await page.$eval('meta[property="og:image"]', (m) => m.content).catch(() => '');
    const best = og || img[0] || '';
    if (title && !GENERIC_TITLES.has(title.toLowerCase()) && !/登录|login|验证|验证码/i.test(title)) entry.pageTitle = title;
    if (best) entry.pageImage = best.startsWith('//') ? 'https:' + best : best.split('?')[0];
  } catch (e) {
    console.log(`  ⚠️ ${src.url}: ${e.message.split('\n')[0]}`);
  }
}

function detect(title) {
  const l = title.toLowerCase();
  const brands = [['Moncler', ['moncler', 'vezere']], ['Adidas', ['adizero', 'adidas']], ['Hellstar', ['hellstar']], ['Cole Buxton', ['cole buxton']], ['The North Face', ['north face', 'nuptse', '1996']], ['Essentials', ['essentials', '1977']], ['Corteiz', ['corteiz', 'centralcee']], ['Stone Island', ['stone island', 'stone bag']], ['Nike NOCTA', ['nocta']], ['Nike', ['nike', 'dunk', 'af1', 'air force', 'vomero', 'uptempo']], ['Jordan', ['jordan', '乔']], ['Yeezy', ['yeezy', 'slide']], ['Eric Emanuel', ['eric emanuel', ' ee ']], ['Gallery Dept', ['gallery']], ['Supreme', ['supreme', 'sup ']], ['Denim Tears', ['denim tears']], ['Bape', ['bape']]];
  let brand = '—';
  for (const [b, ks] of brands) if (ks.some((k) => l.includes(k))) { brand = b; break; }
  const cats = [['SNEAKERS', ['shoe', 'sneaker', 'dunk', 'af1', 'force', 'adizero', 'slide', '拖鞋', 'vomero', 'ska']], ['JACKET', ['jacket', 'puffer', 'coat', 'down', '羽绒']], ['HOODIE', ['hoodie', 'sweater', 'zip', 'tracksuit', 'fleece']], ['TSHIRT', ['t-shirt', 'tee', 'jersey', 'shirt']], ['PANTS', ['pant', 'jeans', 'short', 'jogger', '短裤']], ['ACCESSORIES', ['watch', 'bag', 'belt', 'wallet', 'cardholder', 'socks', 'balaclava', 'earbuds', 'sunglasses', 'cap', 'hat', 'underwear']]];
  let category = 'OTHER';
  for (const [c, ks] of cats) if (ks.some((k) => l.includes(k))) { category = c; break; }
  return { brand, category };
}

(async () => {
  console.log('🤖 360PALLIX BOT - profilo persistente in .bot-profile');
  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { headless: false, viewport: { width: 1400, height: 900 } });
  ctx.on('page', attachListener);
  const cssPage = ctx.pages()[0] || (await ctx.newPage());
  attachListener(cssPage);
  await cssPage.goto('https://www.cssbuy.com/shop/cate/order').catch(() => {});
  const itaoPage = await ctx.newPage();
  await itaoPage.goto('https://www.itaobuy.com/user-center/order').catch(() => {});

  console.log('\n👉 Fai login su ENTRAMBE le schede e apri la lista ordini (prima pagina visibile).');
  await ask('Premi INVIO quando sei pronto... ');

  for (const [pg, label, url] of [[cssPage, 'CSSBuy', 'https://www.cssbuy.com/shop/cate/order'], [itaoPage, 'iTaoBuy', 'https://www.itaobuy.com/user-center/order']]) {
    await pg.bringToFront();
    if (!pg.url().includes(new URL(url).hostname)) await pg.goto(url).catch(() => {});
    else await pg.reload().catch(() => {}); // ricarica per ricatturare la pagina 1
    await sleep(3000);
    await paginate(pg, label);
    if (label === 'CSSBuy') await fetchAllCssOrders(pg);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'raw.json'), JSON.stringify(rawDump, null, 2));
  console.log(`\n✅ Link sorgente catturati: ${captured.size}`);

  if (captured.size === 0) {
    console.log('❌ Nessun link catturato. Controlla scripts/.bot-output/raw.json e dimmi cosa vedi.');
    await ctx.close();
    return;
  }

  // Arricchimento: apri ogni link per foto/titolo se mancano o sono generici
  const work = await ctx.newPage();
  const entries = [...captured.values()];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const needs = !e.image || !e.title || GENERIC_TITLES.has(e.title.toLowerCase());
    if (needs && e.src.type === 'weidian') {
      console.log(`[${i + 1}/${entries.length}] 🌐 ${e.src.url}`);
      await enrich(work, e);
    }
  }
  await work.close();

  // Merge in products.json
  let products = [];
  try { products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8')); } catch (e) {}
  const byKey = new Map();
  products.forEach((p) => { const m = (p.cssbuyUrl || '').match(/item-(micro|1688|taobao)-(\d+)/); byKey.set(m ? `${m[1] === 'micro' ? 'weidian' : m[1]}-${m[2]}` : `id-${p.id}`, p); });

  let added = 0, updated = 0, noPhoto = 0;
  for (const e of entries) {
    const title = cleanTitle(e.title && !GENERIC_TITLES.has(e.title.toLowerCase()) ? e.title : e.pageTitle || e.title);
    if (!title || title.length < 3 || SERVICE_WORDS.some((w) => title.toLowerCase().includes(w))) continue;
    const image = e.image || e.pageImage || '';
    if (!image) noPhoto++;
    const key = `${e.src.type}-${e.src.id}`;
    const old = byKey.get(key);
    const { brand, category } = detect(title);
    const price = e.priceRmb ? parseFloat((e.priceRmb / RMB_TO_EUR).toFixed(2)) : old ? old.price : 19.99;
    const prod = {
      id: old ? old.id : `${e.src.type}-${e.src.id}`,
      title,
      seller: e.seller || (old && old.seller) || 'Verified Order',
      category: old && old.category !== 'OTHER' ? old.category : category,
      brand: old && old.brand !== '—' ? old.brand : brand,
      price,
      image: image || (old && old.image) || '/products/p1.jpg',
      cssbuyUrl: affiliateLink(e.src),
      doppelfitUrl: `https://doppel.fit/?ref=${DOPPEL_REF}`,
    };
    if (old) { Object.assign(old, prod); updated++; } else { products.push(prod); byKey.set(key, prod); added++; }
  }
  const capTitles = new Set(entries.map((e) => cleanTitle(e.title).toLowerCase()));
  const before = products.length;
  products = products.filter((p) => /item-(micro|1688|taobao)-/.test(p.cssbuyUrl || '') || !(capTitles.has(cleanTitle(p.title).toLowerCase()) || /\/products\/p\d+/.test(p.image || '')));
  console.log('🧹 Rimossi ' + (before - products.length) + ' duplicati/segnaposto vecchi senza link.');
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  console.log(`\n💾 data/products.json: +${added} nuovi, ${updated} aggiornati, ${noPhoto} senza foto. Totale ${products.length}.`);
  await ctx.close();
})();
