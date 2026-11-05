const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Desktop Login
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5275/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'auth_login_desktop_initial.png') });

  // Desktop Register
  await page.goto('http://localhost:5275/register', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'auth_register_desktop_initial.png') });

  // Mobile Login
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://localhost:5275/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'auth_login_mobile_initial.png') });

  // Mobile Register
  await page.goto('http://localhost:5275/register', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'auth_register_mobile_initial.png') });

  console.log('Auth screenshots captured successfully');
  await browser.close();
})();

