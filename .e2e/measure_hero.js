const puppeteer = require('./node_modules/puppeteer-core');
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  for (const vp of [{ w: 1440, h: 900 }, { w: 1366, h: 768 }]) {
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto('http://localhost:5275', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    const metrics = await page.evaluate((vh) => {
      const hero = document.querySelector('.hero-master-container');
      const badge = document.querySelector('.hero-pill-badge');
      const h1 = document.querySelector('.hero-headline-h1');
      const sub = document.querySelector('.hero-subtitles-block');
      const btns = document.querySelector('.hero-cta-buttons-row');
      const showcase = document.querySelector('.hero-showcase-wrapper');
      const mockup = document.querySelector('.product-pipeline-mockup');

      const heroRect = hero ? hero.getBoundingClientRect() : null;
      const badgeRect = badge ? badge.getBoundingClientRect() : null;
      const h1Rect = h1 ? h1.getBoundingClientRect() : null;
      const subRect = sub ? sub.getBoundingClientRect() : null;
      const btnsRect = btns ? btns.getBoundingClientRect() : null;
      const showcaseRect = showcase ? showcase.getBoundingClientRect() : null;
      const mockupRect = mockup ? mockup.getBoundingClientRect() : null;

      const visibleShowcaseHeight = mockupRect ? Math.max(0, Math.min(vh, mockupRect.bottom) - Math.max(0, mockupRect.top)) : 0;
      const visiblePercent = mockupRect ? Math.round((visibleShowcaseHeight / mockupRect.height) * 100) : 0;

      return {
        viewportHeight: vh,
        hero: heroRect ? { top: heroRect.top, height: heroRect.height, bottom: heroRect.bottom } : null,
        badge: badgeRect ? { top: badgeRect.top, bottom: badgeRect.bottom, height: badgeRect.height } : null,
        h1: h1Rect ? { top: h1Rect.top, bottom: h1Rect.bottom, height: h1Rect.height, fontSize: window.getComputedStyle(h1).fontSize } : null,
        sub: subRect ? { top: subRect.top, bottom: subRect.bottom, height: subRect.height } : null,
        btns: btnsRect ? { top: btnsRect.top, bottom: btnsRect.bottom, height: btnsRect.height } : null,
        mockup: mockupRect ? { top: mockupRect.top, bottom: mockupRect.bottom, height: mockupRect.height } : null,
        visibleShowcaseHeight,
        visiblePercent,
      };
    }, vp.h);

    console.log(`=== Viewport ${vp.w}x${vp.h} ===`);
    console.log(JSON.stringify(metrics, null, 2));
  }

  await browser.close();
})();

