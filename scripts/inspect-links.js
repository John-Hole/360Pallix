const https = require('https');
const http = require('http');

function fetchUrl(targetUrl) {
  return new Promise((resolve) => {
    try {
      const client = targetUrl.startsWith('https') ? https : http;
      const req = client.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,it;q=0.8'
        },
        timeout: 10000
      }, res => {
        let data = '';
        res.on('data', chunk => {
          if (data.length < 500000) data += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      });
      req.on('error', err => resolve({ error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'timeout' });
      });
    } catch(e) {
      resolve({ error: e.message });
    }
  });
}

(async () => {
  console.log('Testing Weidian fetch directly...');
  const res = await fetchUrl('https://weidian.com/item.html?itemID=7176276843');
  console.log('Weidian Status:', res.status);
  if (res.body) {
    const titleMatch = res.body.match(/<title>([^<]+)<\/title>/i);
    const ogImg = res.body.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
    console.log('Title:', titleMatch ? titleMatch[1] : 'None');
    console.log('OG Image:', ogImg ? ogImg[1] : 'None');
    console.log('Body length:', res.body.length);
  }
})();
