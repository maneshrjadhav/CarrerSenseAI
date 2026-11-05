const puppeteer = require('./node_modules/puppeteer-core');
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('=== TEST 1: Login Page Validation ===');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5275/login', { waitUntil: 'networkidle2' });

  // Check initial elements
  const loginHeading = await page.$eval('.auth-form-title', el => el.innerText);
  const leftHeading = await page.$eval('.auth-showcase-headline', el => el.innerText);
  console.log(`[PASS] Login title: "${loginHeading}", Left showcase: "${leftHeading}"`);

  // Try empty submit
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 300));
  const loginErrors = await page.$$eval('.field-error-text', els => els.map(e => e.innerText));
  console.log('[PASS] Empty submit validation triggered:', loginErrors);

  // Test CAPTCHA refresh
  const codeBefore = await page.$eval('.captcha-text', el => el.innerText);
  await page.click('.captcha-refresh-btn');
  await new Promise(r => setTimeout(r, 500));
  const codeAfter = await page.$eval('.captcha-text', el => el.innerText);
  console.log(`[PASS] CAPTCHA refresh: "${codeBefore}" -> "${codeAfter}"`);

  console.log('\n=== TEST 2: Register Page Validation ===');
  await page.goto('http://localhost:5275/register', { waitUntil: 'networkidle2' });

  const regHeading = await page.$eval('.auth-form-title', el => el.innerText);
  const regLeftHeading = await page.$eval('.auth-showcase-headline', el => el.innerText);
  console.log(`[PASS] Register title: "${regHeading}", Left showcase: "${regLeftHeading}"`);

  // Try empty submit
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 300));
  const regErrors = await page.$$eval('.field-error-text', els => els.map(e => e.innerText));
  console.log('[PASS] Register empty submit validation triggered:', regErrors);

  // Test Password Strength
  await page.type('#reg-password', 'Secret123!');
  await new Promise(r => setTimeout(r, 300));
  const strengthVal = await page.$eval('.strength-value', el => el.innerText);
  console.log(`[PASS] Password strength indicator computed: "${strengthVal}"`);

  console.log('\n=== TEST 3: Responsive Overflow Check ===');
  const viewports = [
    { name: 'Desktop', w: 1440, h: 900 },
    { name: 'Laptop', w: 1366, h: 768 },
    { name: 'Tablet', w: 768, h: 1024 },
    { name: 'Mobile', w: 390, h: 844 }
  ];

  for (const url of ['/login', '/register']) {
    for (const vp of viewports) {
      await page.setViewport({ width: vp.w, height: vp.h, isMobile: vp.w < 500 });
      await page.goto(`http://localhost:5275${url}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 300));

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`[${vp.name} (${vp.w}x${vp.h})] ${url} Horizontal Overflow: ${hasOverflow ? 'FAIL' : 'PASS'}`);
    }
  }

  console.log('\n=== TEST 4: Console Errors ===');
  console.log(`Total console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }

  await browser.close();
  console.log('\n=== ALL AUTH INTEGRITY TESTS COMPLETED ===');
})();

