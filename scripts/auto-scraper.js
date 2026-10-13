/**
 * =========================================================================
 * 360PALLIX - AUTO-SCRAPER INTELLIGENTE & PRICE VERIFIER
 * =========================================================================
 * Funzionalità:
 * 1. Usa il profilo persistente (.bot-profile) in modalità browser reale.
 * 2. Scorre tutti i prodotti in data/products.json.
 * 3. Apre ciascun link Weidian / 1688 / Taobao.
 * 4. Legge il prezzo reale originale in Yuan (¥) o Euro e lo aggiorna.
 * 5. Verifica e cattura le foto originali ad altissima risoluzione (HD).
 * 6. Ripulisce e perfeziona i titoli e i venditori.
 * 7. Salva progressivamente in data/products.json senza perdere nulla.
 * =========================================================================
 */

const { chromium } = require('../_ref/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const PROFILE_DIR = path.join(__dirname, '..', '.bot-profile');
const RMB_TO_EUR = 7.8;
const USD_TO_EUR = 0.92;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanTitle(t) {
  if (!t) return '';
  return t
    .replace(/^【[^】]+】\s*/, '')
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/&#0?39;?/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/✎/g, '')
    .replace(/：/g, ':')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanImageUrl(imgUrl) {
  if (!imgUrl) return '';
  let clean = imgUrl.split('?')[0];
  if (clean.startsWith('//')) clean = 'https:' + clean;
  return clean;
}

(async () => {
  console.log('===============================================================');
  console.log('🤖 360PALLIX - AUTO-SCRAPER PREZZI & FOTO HD IN BACKGROUND');
  console.log('===============================================================');
  console.log('Avvio del browser reale con profilo utente...');

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1300, height: 850 }
  });

  const page = ctx.pages()[0] || (await ctx.newPage());

  let products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  console.log(`Caricati ${products.length} prodotti da verificare.\n`);

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const u = p.cssbuyUrl || '';

    // Estrai ID e Tipo
    const m = u.match(/item-(micro|1688|taobao)-(\d+)/i) || u.match(/id=(\d+)/i);
    const typeMatch = u.match(/type=(weidian|1688|taobao)/i);
    const type = (m && m[1] === 'micro' ? 'weidian' : (m && m[1])) || (typeMatch && typeMatch[1]) || 'weidian';
    const id = m ? m[2] || m[1] : null;

    if (!id) continue;

    let targetUrl = '';
    if (type === 'weidian') {
      targetUrl = `https://weidian.com/item.html?itemID=${id}`;
    } else if (type === '1688') {
      targetUrl = `https://detail.1688.com/offer/${id}.html`;
    } else if (type === 'taobao') {
      targetUrl = `https://item.taobao.com/item.htm?id=${id}`;
    }

    console.log(`[${i + 1}/${products.length}] 🔍 [${type.toUpperCase()}] #${id}: ${p.title.slice(0, 35)}... (Prezzo attuale: €${p.price})`);

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
      await sleep(1500);

      const pageTitle = await page.title();

      // Controllo se c'è un captcha o login wall
      if (/Just a moment|Cloudflare|验证码|Login/i.test(pageTitle) && !pageTitle.includes('Weidian')) {
        console.log(`  ⚠️ Richiesta verifica/captcha, provo fallback CSSBuy...`);
        // Prova ad aprire direttamente la scheda su CSSBuy
        const cssUrl = `https://www.cssbuy.com/shop/goodsDetail?item-${type === 'weidian' ? 'micro' : type}-${id}.html&id=${id}&type=${type}`;
        await page.goto(cssUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
        await sleep(2500);
      }

      // Estrai Prezzo
      const scrapedPrice = await page.evaluate(() => {
        const body = document.body.innerText;
        // Cerca pattern tipo: ¥ 120, ￥120, $15.50, 120 起
        const rmbMatch = body.match(/(?:￥|¥)\s*([\d.]+)/) || body.match(/([\d.]+)\s*(?:元|起\s*¥)/);
        const usdMatch = body.match(/\$\s*([\d.]+)/);
        const eurMatch = body.match(/€\s*([\d.]+)/);

        if (eurMatch) return { val: parseFloat(eurMatch[1]), curr: 'EUR' };
        if (rmbMatch) return { val: parseFloat(rmbMatch[1]), curr: 'RMB' };
        if (usdMatch) return { val: parseFloat(usdMatch[1]), curr: 'USD' };
        return null;
      });

      let changed = false;

      if (scrapedPrice && scrapedPrice.val > 0) {
        let newEurPrice = p.price;
        if (scrapedPrice.curr === 'RMB' && scrapedPrice.val > 0 && scrapedPrice.val < 10000) {
          newEurPrice = parseFloat((scrapedPrice.val / RMB_TO_EUR).toFixed(2));
        } else if (scrapedPrice.curr === 'USD') {
          newEurPrice = parseFloat((scrapedPrice.val * USD_TO_EUR).toFixed(2));
        } else if (scrapedPrice.curr === 'EUR') {
          newEurPrice = scrapedPrice.val;
        }

        if (newEurPrice > 0 && (p.price === 19.99 || Math.abs(p.price - newEurPrice) > 0.01)) {
          console.log(`  💰 Prezzo aggiornato: €${p.price} -> €${newEurPrice}`);
          p.price = newEurPrice;
          changed = true;
        }
      }

      // Estrai Foto HD se migliore
      const imgs = await page.$$eval('img', els => els.map(e => e.currentSrc || e.src).filter(s => s && (s.includes('geilicdn') || s.includes('alicdn')) && !s.includes('avatar') && !s.includes('logo') && !s.includes('icon')));
      const bestImg = imgs.find(img => img.includes('1200') || img.includes('800') || img.includes('750') || img.includes('pcitem') || img.includes('open') || img.includes('wdseller') || img.includes('ibank')) || imgs[0];

      if (bestImg) {
        const clean = cleanImageUrl(bestImg);
        if (clean && clean !== p.image && (!p.image || p.image.includes('/products/p') || p.image.includes('commonImage') || clean.includes('1200') || clean.includes('800'))) {
          console.log(`  📸 Foto HD aggiornata: ${clean.slice(0, 55)}...`);
          p.image = clean;
          changed = true;
        }
      }

      // Estrai Titolo pulito se quello attuale è troppo corto o generico
      const cleanT = cleanTitle(pageTitle);
      if (cleanT && cleanT.length > 5 && !/Weidian|Taobao|1688|CSSBuy|Login/i.test(cleanT)) {
        if (!p.title || p.title.length < 8 || p.title.startsWith('-') || /white|black/i.test(p.title)) {
          console.log(`  🏷️ Titolo perfezionato: ${cleanT.slice(0, 45)}`);
          p.title = cleanT;
          changed = true;
        }
      }

      if (changed) {
        updatedCount++;
        // Salva incrementalmente
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
      }

    } catch (e) {
      console.log(`  ⚠️ Salto (${e.message.split('\n')[0]})`);
    }

    await sleep(800);
  }

  await ctx.close();

  // Salvataggio finale
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  console.log('\n===============================================================');
  console.log(`🎉 Auto-Scraping completato! Aggiornati ${updatedCount} prodotti con prezzi e foto HD.`);
  console.log('💾 File data/products.json salvato con successo!');
  console.log('===============================================================');
})();
