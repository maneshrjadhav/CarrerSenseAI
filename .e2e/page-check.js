const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONT = 'http://localhost:5275';

const token = fs.readFileSync(process.argv[2], 'utf8').trim();
const user = JSON.parse(fs.readFileSync(process.argv[3], 'utf8').trim());
const pagePath = '/' + (process.argv[4] || '').replace(/^\/+/, '');
const clicks = (process.argv[5] || '')
  .split('||')
  .map((s) => s.trim())
  .filter(Boolean);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--user-data-dir=D:/CareerSenseAI/.e2e/profile-pc-' + Date.now(),
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000 });

  const logs = [];
  page.on('console', (m) => {
    const t = m.text();
    if (!t.includes('[vite]') && !t.includes('React DevTools')) logs.push(m.type() + ': ' + t);
  });
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.on('response', (res) => {
    if (res.status() >= 400) logs.push('NETFAIL ' + res.status() + ' ' + res.request().method() + ' ' + res.url());
  });

  await page.evaluateOnNewDocument(
    (tok, usr) => {
      localStorage.setItem('careersense_token', tok);
      localStorage.setItem('careersense_user', JSON.stringify(usr));
      localStorage.setItem('careersense_remember', 'true');
    },
    token,
    user
  );

  await page.goto(FRONT + pagePath, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 3500));

  for (const label of clicks) {
    const ok = await page.evaluate((txt) => {
      const btn = Array.from(document.querySelectorAll('button')).find(
        (b) => (b.textContent || '').toLowerCase().includes(txt.toLowerCase()) && !b.disabled
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    }, label);
    console.log('clicked [' + label + ']:', ok);
    await new Promise((r) => setTimeout(r, 2500));
  }

  const state = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      url: location.href,
      buttons: Array.from(document.querySelectorAll('button'))
        .map((b) => (b.textContent || '').trim())
        .filter((t) => t && t.length < 60)
        .slice(0, 40),
      modalOpen: !!document.querySelector('[class*=modal], [role=dialog]'),
      snippet: txt.slice(0, 900).replace(/\n+/g, ' | '),
    };
  });
  console.log('PAGE STATE', JSON.stringify(state, null, 2));
  console.log('LOGS', JSON.stringify(logs.slice(-15), null, 2));

  await browser.close();
})().catch((e) => {
  console.error('E2E ERROR:', e.message);
  process.exit(1);
});
