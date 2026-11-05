const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONT = 'http://localhost:5275';

const token = fs.readFileSync(process.argv[2], 'utf8').trim();
const user = JSON.parse(fs.readFileSync(process.argv[3], 'utf8').trim());
const path = '/' + (process.argv[4] || 'skill-gap').replace(/^\/+/, '');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--user-data-dir=D:/CareerSenseAI/.e2e/profile-sg-' + Date.now(),
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 950 });

  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.on('response', (res) => {
    const u = res.url();
    if (u.includes('/api/') && (u.includes('skill-gap') || u.includes('dashboard') || res.status() >= 400)) {
      logs.push('NET ' + res.status() + ' ' + res.request().method() + ' ' + u);
    }
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

  await page.goto(FRONT + path, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 4000));

  const state = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      url: location.href,
      emptyState: txt.includes('No Skill Gap Analysis Found'),
      upgradeState: txt.includes('PREMIUM SUBSCRIPTION REQUIRED') || txt.includes('Unlock Skill Gap'),
      errorState: txt.includes('Unable to Load Skill Gap'),
      heading: (txt.match(/Skill Gap Intelligence|Your Skill Gap/g) || [])[0],
      hasGapSections: /HIGH PRIORITY|MEDIUM|LOW|Missing Skills|Matched Skills/i.test(txt),
      snippet: txt.slice(0, 500).replace(/\n+/g, ' | '),
      buttons: Array.from(document.querySelectorAll('button'))
        .map((b) => (b.textContent || '').trim())
        .filter(Boolean)
        .slice(0, 14),
    };
  });
  console.log('SKILLGAP STATE', JSON.stringify(state, null, 2));
  console.log('LOGS', JSON.stringify(logs.slice(-20), null, 2));

  await browser.close();
})().catch((e) => {
  console.error('E2E ERROR:', e.message);
  process.exit(1);
});
