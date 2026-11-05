const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.join(__dirname, 'screenshots_zoom');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const VIEWPORTS = [
  { name: 'Desktop_1440x900', width: 1440, height: 900 },
  { name: 'Laptop_1366x768', width: 1366, height: 768 },
  { name: 'Tablet_768x1024', width: 768, height: 1024 },
  { name: 'Mobile_390x844', width: 390, height: 844 }
];

const REQUIRED_SECTIONS = [
  { name: '1. Sticky Navbar', selector: '.landing-sticky-navbar' },
  { name: '2. Hero Section', selector: '.hero-master-container' },
  { name: '3. Platform Capabilities', selector: '#capabilities' },
  { name: '4. How It Works (4 Steps)', selector: '#how-it-works' },
  { name: '5. Deep Analytical Precision Dashboard', selector: '#analytics' },
  { name: '6. Sequential Career Roadmap', selector: '#roadmap' },
  { name: '7. Final Call to Action', selector: '.cta-master-section' },
  { name: '8. SaaS Master Footer', selector: '.saas-footer-master' }
];

(async () => {
  console.log('===============================================================');
  console.log('CAREERSENSE AI — MULTI-ZOOM & RESPONSIVENESS VERIFICATION SUITE');
  console.log('===============================================================');

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
  page.on('pageerror', err => consoleErrors.push(err.message));

  let totalTests = 0;
  let passedTests = 0;
  let overflowIssues = [];

  // Phase 1: Section Presence Verification at 100%
  console.log('\n--- Phase 1: Verifying All 8 Required Landing Page Sections ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5275/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  for (const sec of REQUIRED_SECTIONS) {
    totalTests++;
    const el = await page.$(sec.selector);
    if (el) {
      const box = await el.boundingBox();
      const isVisible = box && box.width > 0 && box.height > 0;
      if (isVisible) {
        console.log(`  ✓ ${sec.name} (${sec.selector}) -> PRESENT & VISIBLE [${Math.round(box.width)}x${Math.round(box.height)}px]`);
        passedTests++;
      } else {
        console.error(`  ✗ ${sec.name} (${sec.selector}) -> ELEMENT HAS 0 SIZE`);
      }
    } else {
      console.error(`  ✗ ${sec.name} (${sec.selector}) -> NOT FOUND IN DOM`);
    }
  }

  // Phase 2: Multi-Zoom Responsiveness Matrix
  console.log('\n--- Phase 2: Multi-Zoom Overflow & Layout Integrity Matrix ---');
  for (const vp of VIEWPORTS) {
    for (const zoom of ZOOM_LEVELS) {
      totalTests++;
      await page.setViewport({ width: vp.width, height: vp.height });
      
      // Apply browser zoom via CSS zoom / device scale factor emulation
      await page.evaluate((z) => {
        document.body.style.zoom = z;
      }, zoom);
      await new Promise(r => setTimeout(r, 200));

      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        const scrollWidth = docEl.scrollWidth;
        const clientWidth = docEl.clientWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        // In zoomed mode, scrollWidth should not substantially exceed clientWidth
        const diff = Math.max(0, scrollWidth - clientWidth);
        return {
          scrollWidth,
          clientWidth,
          diff,
          hasOverflow: diff > 2
        };
      });

      if (!overflow.hasOverflow) {
        passedTests++;
        console.log(`  ✓ [${vp.name}] Zoom ${(zoom * 100).toFixed(0)}%: No Horizontal Overflow (Client: ${overflow.clientWidth}px, Scroll: ${overflow.scrollWidth}px)`);
      } else {
        console.warn(`  ⚠ [${vp.name}] Zoom ${(zoom * 100).toFixed(0)}%: Overflow detected (${overflow.diff}px overflow)`);
        overflowIssues.push({ viewport: vp.name, zoom: `${zoom * 100}%`, overflow: overflow.diff });
      }
    }
  }

  // Phase 3: High-Resolution Visual Evidence Capture
  console.log('\n--- Phase 3: Capturing Verification Screenshots ---');
  // 1. Normal 100% Zoom Desktop
  await page.evaluate(() => { document.body.style.zoom = 1.0; });
  await page.setViewport({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(outDir, '01_desktop_100pct_fold.png'), fullPage: false });
  await page.screenshot({ path: path.join(outDir, '01_desktop_100pct_full.png'), fullPage: true });
  console.log('  ✓ Saved 01_desktop_100pct_full.png');

  // 2. 150% Zoom Desktop
  await page.evaluate(() => { document.body.style.zoom = 1.5; });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, '02_desktop_150pct_zoom.png'), fullPage: false });
  console.log('  ✓ Saved 02_desktop_150pct_zoom.png');

  // 3. 200% Zoom Desktop
  await page.evaluate(() => { document.body.style.zoom = 2.0; });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, '03_desktop_200pct_zoom.png'), fullPage: false });
  console.log('  ✓ Saved 03_desktop_200pct_zoom.png');

  // Reset zoom to 1.0 for section closeups
  await page.evaluate(() => { document.body.style.zoom = 1.0; });
  await page.setViewport({ width: 1440, height: 900 });

  // 4. Section Closeups
  const closeups = [
    { sel: '.hero-master-container', name: '04_section_hero_console.png' },
    { sel: '#how-it-works', name: '05_section_how_it_works_4steps.png' },
    { sel: '#analytics', name: '06_section_deep_precision_dashboard.png' },
    { sel: '#roadmap', name: '07_section_career_roadmap_flow.png' },
    { sel: '.cta-master-section', name: '08_section_final_cta.png' },
    { sel: '.saas-footer-master', name: '09_section_saas_footer.png' }
  ];

  for (const c of closeups) {
    const el = await page.$(c.sel);
    if (el) {
      await el.screenshot({ path: path.join(outDir, c.name) });
      console.log(`  ✓ Saved ${c.name}`);
    }
  }

  // 5. Mobile 390x844 Full Page
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://127.0.0.1:5275/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(outDir, '10_mobile_390x844_fold.png'), fullPage: false });
  await page.screenshot({ path: path.join(outDir, '10_mobile_390x844_full.png'), fullPage: true });
  console.log('  ✓ Saved 10_mobile_390x844_full.png');

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} checks passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console error details:', consoleErrors);
  }
  console.log(`Overflow Issues: ${overflowIssues.length}`);
  console.log('===============================================================');

  await browser.close();
  process.exit(overflowIssues.length > 0 || consoleErrors.length > 0 ? 1 : 0);
})();

