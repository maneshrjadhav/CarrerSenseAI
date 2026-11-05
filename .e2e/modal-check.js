const fs = require('fs');
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONT = 'http://localhost:5275';
const token = fs.readFileSync(process.argv[2], 'utf8').trim();
const user = JSON.parse(fs.readFileSync(process.argv[3], 'utf8').trim());
const pagePath = '/' + (process.argv[4] || '').replace(/^\/+/, '');
const clickLabel = process.argv[5] || '';
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run','--disable-extensions','--user-data-dir=D:/CareerSenseAI/.e2e/profile-mc-' + Date.now()] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1500, height: 1000 });
  await page.evaluateOnNewDocument((tok, usr) => {
    localStorage.setItem('careersense_token', tok);
    localStorage.setItem('careersense_user', JSON.stringify(usr));
    localStorage.setItem('careersense_remember', 'true');
  }, token, user);
  await page.goto(FRONT + pagePath, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 3000));
  if (clickLabel) {
    const ok = await page.evaluate((txt) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent||'').toLowerCase().includes(txt.toLowerCase()) && !b.disabled);
      if (btn) { btn.click(); return true; } return false;
    }, clickLabel);
    console.log('clicked [' + clickLabel + ']:', ok);
    await new Promise(r => setTimeout(r, 2000));
  }
  const res = await page.evaluate(() => {
    const txt = document.body.innerText;
    const overlay = document.querySelector('.modal-overlay, .upgrade-modal, [class*=overlay], [class*=Overlay]');
    const modalText = overlay ? overlay.innerText.slice(0, 700) : '';
    const hasUpgradeWords = /Upgrade|Unlock|Premium|ATS Report Pass|₹39|Subscribe/i.test(txt);
    return {
      hasUpgradeWords,
      modalText: modalText.replace(/\n+/g, ' | '),
      overlayClass: overlay ? overlay.className : null,
      ringText: (txt.match(/ATS Report Pass[\s\S]{0,160}/) || [''])[0].replace(/\n+/g, ' | '),
      upgradeSnippet: (txt.match(/Upgrade[\s\S]{0,200}/) || [''])[0].replace(/\n+/g, ' | '),
    };
  });
  console.log('MODAL STATE', JSON.stringify(res, null, 2));
  await browser.close();
})().catch(e => { console.error('E2E ERROR:', e.message); process.exit(1); });
