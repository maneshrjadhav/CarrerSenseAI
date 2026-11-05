const puppeteer = require('./node_modules/puppeteer-core');
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('response', res => {
    if (res.status() >= 400) {
      console.log('FAILED RESPONSE:', res.status(), res.url());
    }
  });
  await page.goto('http://localhost:5275', { waitUntil: 'networkidle2' });
  await browser.close();
})();

