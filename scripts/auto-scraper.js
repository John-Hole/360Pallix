/**
 * =========================================================================
 * 360PALLIX - AUTO-SCRAPER PRO VIA CSSBUY CONVERTER
 * =========================================================================
 * Questo script:
 * 1. Apre il browser reale con il profilo già loggato (.bot-profile).
 * 2. Visita direttamente la scheda convertita di CSSBuy per ogni prodotto:
 *    https://www.cssbuy.com/shop/goodsDetail?item-{type}-{id}.html&id={id}&type={type}
 * 3. CSSBuy fa da proxy verso Weidian, 1688 e Taobao:
 *    - div.product_name: contiene il VERO titolo in inglese/pulito
 *    - Prezzo in Yuan (¥) e Dollari ($) reale
 *    - Immagini originali in alta risoluzione (HD)
 * 4. Calcola il prezzo convertito in Euro (¥ / 7.8).
 * 5. Salva progressivamente in data/products.json.
 * =========================================================================
 */

const { chromium } = require('../_ref/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');
const PROFILE_DIR = path.join(__dirname, '..', '.bot-profile');
const CSSBUY_CODE = process.env.CSSBUY_PROMOTION_CODE || '2ab90a34eeaa437b';
const DOPPEL_REF = process.env.DOPPELFIT_REF || 'PPnCbrec';
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
  console.log('🤖 360PALLIX - AUTO-SCRAPER PREZZI & FOTO HD VIA CSSBUY');
  console.log('===============================================================');
  console.log('Avvio del browser reale con profilo persistente...');

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1350, height: 900 }
  });

  const page = ctx.pages()[0] || (await ctx.newPage());

  let products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  console.log(`Caricati ${products.length} prodotti da verificare.\n`);

  let updatedCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const u = p.cssbuyUrl || '';

    // Estrai Tipo e ID del prodotto
    let type = 'weidian';
    let id = null;

    const m = u.match(/item-(micro|1688|taobao)-(\d+)/i) || u.match(/id=(\d+)/i);
    const typeMatch = u.match(/type=(weidian|1688|taobao)/i);
    if (m) {
      type = (m[1] === 'micro' ? 'weidian' : m[1]) || (typeMatch && typeMatch[1]) || 'weidian';
      id = m[2] || m[1];
    }

    if (!id) {
      console.log(`[${i + 1}/${products.length}] ⏭️  ${p.title.slice(0, 30)} (nessun ID trovato, salto)`);
      continue;
    }

    const itemSlug = type === 'weidian' ? 'micro' : type;
    const targetUrl = `https://www.cssbuy.com/shop/goodsDetail?promotionCode=${CSSBUY_CODE}&item-${itemSlug}-${id}.html&id=${id}&type=${type}`;

    console.log(`[${i + 1}/${products.length}] 🌐 [${type.toUpperCase()}] #${id}: ${p.title.slice(0, 35)}...`);

    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await sleep(1500);

      // 🛡️ Auto-Click su "I accept the risks" o qualsiasi tastino di avviso CSSBuy
      await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('div, button, a, span'))
          .filter(el => {
            const t = el.innerText.trim().toLowerCase();
            return (
              t.includes('accept the risks') ||
              t.includes('i accept') ||
              t.includes('understood') ||
              t.includes('understand') ||
              t === 'confirm' ||
              t === 'agree' ||
              t === '确定' ||
              t === '我知道了'
            );
          });
        if (candidates.length > 0) {
          candidates[0].click();
        }
      });
      await sleep(1500);

      // Estrai Titolo da CSSBuy
      const scrapedData = await page.evaluate(() => {
        // Cerca il nome del prodotto
        const nameEl = document.querySelector('.product_name, .goods_name, [class*="product_name"], [class*="productName"]');
        let title = nameEl ? nameEl.innerText.trim() : '';

        // Cerca il prezzo
        const bodyText = document.body.innerText;
        let rmb = null;
        let usd = null;

        const rmbMatch = bodyText.match(/(?:￥|¥)\s*([\d.]+)/) || bodyText.match(/([\d.]+)\s*CNY/i);
        const usdMatch = bodyText.match(/\$\s*([\d.]+)/) || bodyText.match(/([\d.]+)\s*USD/i);

        if (rmbMatch) rmb = parseFloat(rmbMatch[1]);
        if (usdMatch) usd = parseFloat(usdMatch[1]);

        // Cerca foto HD del prodotto (esclude avatar, loghi, icone)
        const imgs = Array.from(document.querySelectorAll('img'))
          .map(img => img.currentSrc || img.src)
          .filter(src => src && (src.includes('geilicdn') || src.includes('alicdn') || src.includes('cssbuy') || src.includes('upload')) && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon') && !src.includes('brand.svg'));

        return {
          title,
          rmb,
          usd,
          images: imgs.slice(0, 5)
        };
      });

      let changed = false;

      // 1. Aggiorna Titolo se migliore o più completo
      const cleanT = cleanTitle(scrapedData.title);
      if (cleanT && cleanT.length > 5 && !cleanT.includes('Beijing Time') && cleanT !== p.title) {
        if (!p.title || p.title.length < 8 || p.title.startsWith('-') || /white|black/i.test(p.title) || p.title.includes('Item')) {
          console.log(`  🏷️  Nuovo Titolo: ${cleanT.slice(0, 45)}`);
          p.title = cleanT;
          changed = true;
        }
      }

      // 2. Aggiorna Prezzo
      let calculatedPrice = null;
      if (scrapedData.rmb && scrapedData.rmb > 0 && scrapedData.rmb < 15000) {
        calculatedPrice = parseFloat((scrapedData.rmb / RMB_TO_EUR).toFixed(2));
      } else if (scrapedData.usd && scrapedData.usd > 0) {
        calculatedPrice = parseFloat((scrapedData.usd * USD_TO_EUR).toFixed(2));
      }

      if (calculatedPrice && calculatedPrice > 0) {
        if (p.price === 19.99 || Math.abs(p.price - calculatedPrice) > 1.5) {
          console.log(`  💰 Prezzo aggiornato: €${p.price} -> €${calculatedPrice} (da ¥${scrapedData.rmb || '—'} / $${scrapedData.usd || '—'})`);
          p.price = calculatedPrice;
          changed = true;
        }
      }

      // 3. Aggiorna Foto HD se trovata
      if (scrapedData.images && scrapedData.images.length > 0) {
        const bestImg = scrapedData.images.find(s => s.includes('1200') || s.includes('800') || s.includes('750') || s.includes('pcitem') || s.includes('open') || s.includes('wdseller') || s.includes('ibank')) || scrapedData.images[0];
        const cleanImg = cleanImageUrl(bestImg);
        if (cleanImg && cleanImg !== p.image && (!p.image || p.image.includes('/products/p') || p.image.includes('commonImage'))) {
          console.log(`  📸 Nuova Foto HD: ${cleanImg.slice(0, 50)}...`);
          p.image = cleanImg;
          changed = true;
        }
      }

      // 4. Assicura il link affiliato completo
      p.cssbuyUrl = targetUrl;
      p.doppelfitUrl = `https://doppel.fit/?ref=${DOPPEL_REF}`;

      if (changed) {
        updatedCount++;
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
      }

    } catch (e) {
      console.log(`  ⚠️ Errore su #${id}: ${e.message.split('\n')[0]}`);
    }

    await sleep(600);
  }

  await ctx.close();

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
  console.log('\n===============================================================');
  console.log(`🎉 Scraping completato! Aggiornati ${updatedCount} prodotti con successo.`);
  console.log('💾 File data/products.json salvato!');
  console.log('===============================================================');
})();
