const { chromium } = require('../_ref/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log('Navigating to Weidian item 7176276843...');
  try {
    await page.goto('https://weidian.com/item.html?itemID=7176276843', { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Current URL:', page.url());
    const title = await page.title();
    console.log('Page Title:', title);

    // Trova immagini
    const imgs = await page.$$eval('img', els => els.map(e => e.src).filter(s => s && (s.includes('geilicdn') || s.includes('alicdn') || s.includes('wdwd'))));
    console.log('Found product images:', imgs.slice(0, 5));
  } catch(e) {
    console.log('Error:', e.message);
  }

  await browser.close();
})();
