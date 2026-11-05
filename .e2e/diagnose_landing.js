const puppeteer = require('./node_modules/puppeteer-core');
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://localhost:5275', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const diagnostics = await page.evaluate(() => {
    const results = [];
    const selectors = [
      'body',
      '.landing-master-wrapper',
      '.landing-sticky-navbar',
      '.hero-master-container',
      '.hero-headline-h1',
      '.hero-lead-description',
      '.hero-product-console-wrapper',
      '.stats-strip-container',
      '#why',
      '.section-main-heading',
      '.section-sub-heading',
      '.feature-card-glass',
      '.features-three-col-grid',
      '#how',
      '.how-timeline-flow-wrapper',
      '.timeline-step-tile',
      '.semantic-map-card',
      '.resume-scan-mockup-card',
      '.skill-gap-interactive-card',
      '.roadmap-flow-card',
      '#demo',
      '.cta-master-section',
      '.cta-banner-box',
      '.cta-headline',
      '.cta-subheading',
      '.saas-footer-master',
      '.footer-brand-title',
      '.footer-mission-text',
      '.footer-col-heading',
      '.footer-nav-link'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) {
        results.push({ selector: sel, found: false });
        continue;
      }
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      results.push({
        selector: sel,
        found: true,
        rect: { top: Math.round(rect.top), height: Math.round(rect.height), width: Math.round(rect.width) },
        opacity: cs.opacity,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 60) + '...' : 'none',
        filter: cs.filter,
        backdropFilter: cs.backdropFilter,
        maskImage: cs.maskImage !== 'none' ? cs.maskImage.slice(0, 60) + '...' : 'none',
        zIndex: cs.zIndex,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      });
    }

    // Also look for elements with opacity < 0.95 or transparent text
    const allElements = Array.from(document.querySelectorAll('.landing-master-wrapper *'));
    const lowOpacity = [];
    for (const el of allElements) {
      const cs = window.getComputedStyle(el);
      const op = parseFloat(cs.opacity);
      if (op < 0.7 && !el.classList.contains('live-pulse') && !el.classList.contains('gap-dot')) {
        lowOpacity.push({
          tag: el.tagName,
          className: el.className,
          opacity: op,
          color: cs.color,
          text: (el.innerText || '').slice(0, 40)
        });
      }
    }

    return { results, lowOpacityCount: lowOpacity.length, lowOpacitySample: lowOpacity.slice(0, 25) };
  });

  console.log('=== CSS & COMPUTED STYLES DIAGNOSTICS ===');
  console.log(JSON.stringify(diagnostics, null, 2));

  await browser.close();
})();

