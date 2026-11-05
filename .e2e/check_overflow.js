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

  const viewports = [
    { w: 1440, h: 900, name: 'Desktop Large' },
    { w: 1366, h: 768, name: 'Standard Laptop' },
    { w: 768, h: 1024, name: 'Tablet' },
    { w: 390, h: 844, isMobile: true, name: 'Mobile iPhone' },
  ];

  let allClean = true;

  for (const vp of viewports) {
    await page.setViewport({ width: vp.w, height: vp.h, isMobile: !!vp.isMobile });
    await page.goto('http://localhost:5275', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const check = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const hasHOverflow = docW > winW;

      // Check broken images
      const imgs = Array.from(document.querySelectorAll('img'));
      const brokenImgs = imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src);

      return {
        docW,
        winW,
        hasHOverflow,
        brokenImgsCount: brokenImgs.length,
        brokenImgs
      };
    });

    console.log(`[${vp.name} (${vp.w}x${vp.h})] ScrollWidth: ${check.docW}, InnerWidth: ${check.winW}, Horizontal Overflow: ${check.hasHOverflow ? 'FAIL' : 'PASS'}, Broken Images: ${check.brokenImgsCount}`);
    if (check.hasHOverflow || check.brokenImgsCount > 0) allClean = false;
  }

  console.log('Console Errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log(consoleErrors);
  }

  console.log(`\nOverall Integrity: ${allClean && consoleErrors.length === 0 ? 'ALL PASSED' : 'FAILURES DETECTED'}`);
  await browser.close();
  process.exit(allClean && consoleErrors.length === 0 ? 0 : 1);
})();

