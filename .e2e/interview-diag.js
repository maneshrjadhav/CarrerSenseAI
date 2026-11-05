const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONT = 'http://localhost:5275';

const token = fs.readFileSync(process.argv[2], 'utf8').trim();
const user = JSON.parse(fs.readFileSync(process.argv[3], 'utf8').trim());
const matchId = process.argv[4];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 300)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('404')) console.log('CONSOLE-ERR:', m.text().slice(0, 300));
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

  await page.goto(FRONT + '/interview-prep/' + matchId, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3000);

  const probe = () =>
    page.evaluate(() => {
      const txt = document.body.innerText;
      const ta = Array.from(document.querySelectorAll('textarea')).map((t) => (t.placeholder || '').slice(0, 40));
      return {
        t: Date.now(),
        stage: (txt.match(/Stage: [A-Z]+/) || [])[0] || null,
        questionOf: (txt.match(/Question \d+ of \d+/) || [])[0] || null,
        textareas: ta,
        btnStart: !!Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Start Mock Interview Session')),
        btnSubmitIntro: !!Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Submit Introduction')),
        btnSubmitAnswer: !!Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Submit Answer for AI')),
        maskedNote: txt.includes('Model answer is masked'),
      };
    });
  console.log('T0', JSON.stringify(await probe()));

  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').includes('Start Mock Interview Session'));
    if (b) b.click();
  });
  await sleep(2500);
  console.log('AFTER-START', JSON.stringify(await probe()));

  const typed = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('textarea')).find((t) => (t.placeholder || '').includes('Provide a quick outline'));
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(el, 'Test intro: final year student, Flask + React project with NLP matching.');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  });
  console.log('introTyped:', typed);
  await sleep(500);

  const clicked = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').includes('Submit Introduction'));
    if (!b) return 'NOT_FOUND';
    return { disabled: b.disabled, clicked: (b.click(), true) };
  });
  console.log('introSubmitClick:', JSON.stringify(clicked));

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    console.log('POLL+' + ((i + 1) * 500) + 'ms', JSON.stringify(await probe()));
  }

  await browser.close();
})().catch((e) => {
  console.error('DIAG ERROR:', e.message);
  process.exit(1);
});
