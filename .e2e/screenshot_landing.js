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

  // 1. Laptop Viewport 1440x900
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5275', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(outDir, 'landing_1440x900_fold.png'), fullPage: false });
  await page.screenshot({ path: path.join(outDir, 'landing_1440x900_full.png'), fullPage: true });

  // 2. Standard Laptop Viewport 1366x768
  await page.setViewport({ width: 1366, height: 768 });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, 'landing_1366x768_fold.png'), fullPage: false });

  // 2b. Capture Key Section Elements to verify high contrast and readability
  const sectionSelectors = [
    { sel: '#why', name: 'section_why_features.png' },
    { sel: '#how', name: 'section_how_it_works.png' },
    { sel: '#semantic-map', name: 'section_semantic_map.png' },
    { sel: '#resume-scan', name: 'section_resume_scan.png' },
    { sel: '#skill-gap', name: 'section_skill_gap.png' },
    { sel: '#roadmap-flow', name: 'section_roadmap_flow.png' },
    { sel: '.cta-master-section', name: 'section_cta_banner.png' },
    { sel: '.saas-footer-master', name: 'section_footer.png' }
  ];

  for (const item of sectionSelectors) {
    const el = await page.$(item.sel);
    if (el) {
      await el.screenshot({ path: path.join(outDir, item.name) });
    }
  }

  // 3. Mobile Viewport 390x844
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://localhost:5275', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'landing_mobile_fold.png'), fullPage: false });

  console.log('Screenshots captured successfully in .e2e/screenshots/');
  await browser.close();
})();

