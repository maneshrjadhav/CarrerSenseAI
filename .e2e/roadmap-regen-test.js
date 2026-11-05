const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONT = 'http://localhost:5275';
const BACK = 'http://127.0.0.1:5000';

const token = fs.readFileSync(process.argv[2], 'utf8').trim();
const user = JSON.parse(fs.readFileSync(process.argv[3], 'utf8').trim());
const matchId = process.argv[4];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--user-data-dir=D:/CareerSenseAI/.e2e/profile-' + Date.now(),
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 950 });

  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.on('response', async (res) => {
    const u = res.url();
    const interesting =
      u.includes('/api/') && (u.includes('regenerate') || u.includes('career-roadmap') || res.status() >= 400);
    if (interesting) {
      let body = '';
      try {
        const t = await res.text();
        body = t.slice(0, 200);
      } catch {}
      logs.push('NET ' + res.status() + ' ' + res.request().method() + ' ' + u + ' :: ' + body);
    }
    if (res.status() >= 400) {
      logs.push('FAILED ' + res.status() + ' ' + res.request().method() + ' ' + u);
    }
  });
  page.on('requestfailed', (req) => {
    logs.push('REQFAILED ' + req.method() + ' ' + req.url() + ' :: ' + (req.failure() || {}).errorText);
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

  await page.goto(matchId === 'none' ? FRONT + '/career-roadmap' : FRONT + '/career-roadmap/' + matchId, {
    waitUntil: 'networkidle2',
    timeout: 90000,
  });
  await new Promise((r) => setTimeout(r, 3000));

  const state1 = await page.evaluate(() => ({
    url: location.href,
    applyBtn: !!Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Apply Timeline')),
    durationLabels: (document.body.innerText.match(/\d+ Weeks/g) || []).slice(0, 4),
    hasNoRoadmapState: document.body.innerText.includes('No Career Roadmap'),
    bodyHead: document.body.innerText.slice(0, 300),
  }));
  console.log('STATE1', JSON.stringify(state1, null, 2));

  const chipClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').trim() === '12 Weeks');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('clickedChip12Weeks:', chipClicked);
  await new Promise((r) => setTimeout(r, 600));

  const applyClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Apply Timeline'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('clickedApply:', applyClicked);
  await new Promise((r) => setTimeout(r, 2500));

  const toastState = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.toast, [class*=toast]'))
      .map((e) => (e.textContent || '').trim())
      .filter(Boolean)
      .slice(0, 5)
  );
  console.log('toasts:', JSON.stringify(toastState));
  await new Promise((r) => setTimeout(r, 3000));

  const state2 = await page.evaluate(() => ({
    durationLabels: (document.body.innerText.match(/\d+ Weeks/g) || []).slice(0, 4),
    progressHead: (document.body.innerText.match(/OVERALL ROADMAP PROGRESS[\s\S]{0,120}/) || [''])[0].replace(/\n/g, ' | '),
    toasts: Array.from(document.querySelectorAll('div,span,p'))
      .filter((el) => el.children.length === 0 && /updated|regenerat|fail|error/i.test(el.textContent || ''))
      .map((e) => (e.textContent || '').trim())
      .filter((t) => t.length < 120)
      .slice(0, 6),
  }));
  console.log('STATE2', JSON.stringify(state2, null, 2));

  console.log('LOGS', JSON.stringify(logs.slice(-25), null, 2));

  await browser.close();
})().catch((e) => {
  console.error('E2E ERROR:', e.message);
  process.exit(1);
});
