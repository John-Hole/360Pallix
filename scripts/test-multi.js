const { chromium } = require('../_ref/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const testUrls = [
    'https://weidian.com/item.html?itemID=7459271083',
    'https://weidian.com/item.html?itemID=7459856923',
    'https://weidian.com/item.html?itemID=7521685649'
  ];

  for (const url of testUrls) {
    console.log('\n--- Checking:', url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const title = await page.title();
      const imgs = await page.$$eval('img', els => els.map(e => e.src).filter(s => s && (s.includes('geilicdn') || s.includes('alicdn')) && (s.includes('750') || s.includes('pcitem') || s.includes('open') || s.includes('wdseller'))));
      console.log('Title:', title);
      console.log('Main image:', imgs[0]);
    } catch(e) {
      console.log('Error:', e.message);
    }
  }

  await browser.close();
})();
