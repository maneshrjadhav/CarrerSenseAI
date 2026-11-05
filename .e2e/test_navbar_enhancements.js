const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.join(__dirname, 'screenshots_navbar');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const ZOOM_LEVELS = [0.5, 0.75, 0.9, 1.0, 1.25, 1.5, 1.75, 2.0];
const VIEWPORTS = [
  { name: 'Desktop_1440x900', width: 1440, height: 900 },
  { name: 'Laptop_1366x768', width: 1366, height: 768 },
  { name: 'Tablet_768x1024', width: 768, height: 1024 },
  { name: 'Mobile_390x844', width: 390, height: 844 }
];

(async () => {
  console.log('===============================================================');
  console.log('CAREERSENSE AI — NAVBAR REDESIGN & MULTI-ZOOM TEST SUITE');
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
  let failures = [];

  // -------------------------------------------------------------------------
  // TEST 1: Desktop Elements & Geometry (1440x900)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 1: Desktop Navigation Bar Geometry & Elements ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5275/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Check Navbar presence
  totalTests++;
  const navbar = await page.$('.landing-sticky-navbar');
  if (navbar) {
    const box = await navbar.boundingBox();
    console.log(`  ✓ Sticky Navbar detected [${box.width}x${box.height}px]`);
    passedTests++;
  } else {
    console.error('  ✗ Sticky Navbar not found');
    failures.push('Navbar not found');
  }

  // Check Logo
  totalTests++;
  const logo = await page.$('.landing-brand');
  const logoIcon = await page.$('.brand-icon-box');
  const logoText = await page.$('.brand-name-text');
  if (logo && logoIcon && logoText) {
    const brandTextContent = await page.evaluate(el => el.textContent.trim(), logoText);
    console.log(`  ✓ Logo & Sparkle Icon detected: "${brandTextContent}"`);
    passedTests++;
  } else {
    console.error('  ✗ Brand logo elements missing');
    failures.push('Logo elements missing');
  }

  // Check Navigation Links (5 required links)
  const expectedLinks = ['Capabilities', 'How It Works', 'Analytical Console', 'Career Roadmap', 'Pricing'];
  totalTests++;
  const navLinks = await page.$$eval('.desktop-nav-menu .nav-anchor-link', els => els.map(e => e.textContent.trim()));
  const allLinksPresent = expectedLinks.every(exp => navLinks.includes(exp));
  if (allLinksPresent) {
    console.log(`  ✓ All 5 Navigation Links Present: [${navLinks.join(', ')}]`);
    passedTests++;
  } else {
    console.error(`  ✗ Expected [${expectedLinks.join(', ')}] but found [${navLinks.join(', ')}]`);
    failures.push('Navigation links mismatch');
  }

  // Check Auth Buttons
  totalTests++;
  const signInBtn = await page.$('.nav-signin-btn');
  const ctaBtn = await page.$('.nav-cta-btn');
  if (signInBtn && ctaBtn) {
    const signInText = await page.evaluate(el => el.textContent.trim(), signInBtn);
    const ctaText = await page.evaluate(el => el.textContent.trim(), ctaBtn);
    const ctaHasSvg = await page.evaluate(el => el.querySelector('svg') !== null, ctaBtn);
    console.log(`  ✓ Auth Buttons: "${signInText}" & "${ctaText}" (Arrow Icon present: ${ctaHasSvg})`);
    passedTests++;
  } else {
    console.error('  ✗ Auth buttons missing');
    failures.push('Auth buttons missing');
  }

  // Check Active Section Detection
  totalTests++;
  const activeLink = await page.$('.nav-anchor-link.nav-link-active');
  if (activeLink) {
    const activeText = await page.evaluate(el => el.textContent.trim(), activeLink);
    console.log(`  ✓ Active link highlight working: "${activeText}"`);
    passedTests++;
  } else {
    console.warn('  ⚠ No active link currently highlighted');
  }

  // Check Single Row Alignment (No vertical stacking on desktop)
  totalTests++;
  const alignment = await page.evaluate(() => {
    const brand = document.querySelector('.landing-brand').getBoundingClientRect();
    const nav = document.querySelector('.desktop-nav-menu').getBoundingClientRect();
    const auth = document.querySelector('.desktop-auth-actions').getBoundingClientRect();
    
    // Check they share a similar vertical midline
    const brandMid = brand.top + brand.height / 2;
    const navMid = nav.top + nav.height / 2;
    const authMid = auth.top + auth.height / 2;

    const diff = Math.max(Math.abs(brandMid - navMid), Math.abs(brandMid - authMid));
    return {
      aligned: diff < 15,
      diff,
      brandY: brandMid,
      navY: navMid,
      authY: authMid
    };
  });

  if (alignment.aligned) {
    console.log(`  ✓ Single Aligned Row Verified (Vertical delta: ${alignment.diff.toFixed(1)}px)`);
    passedTests++;
  } else {
    console.error(`  ✗ Navigation elements not in a single row (delta: ${alignment.diff}px)`);
    failures.push('Elements misaligned vertically');
  }

  // Capture Desktop Screenshot
  await navbar.screenshot({ path: path.join(outDir, '01_desktop_navbar_1440x900.png') });
  console.log('  ✓ Saved 01_desktop_navbar_1440x900.png');

  // -------------------------------------------------------------------------
  // TEST 2: Multi-Zoom Responsiveness Matrix (50% to 200%)
  // -------------------------------------------------------------------------
  console.log('\n--- Test 2: Multi-Zoom Overflow & Layout Matrix (50% to 200%) ---');
  for (const vp of VIEWPORTS) {
    for (const zoom of ZOOM_LEVELS) {
      totalTests++;
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.evaluate(z => { document.body.style.zoom = z; }, zoom);
      await new Promise(r => setTimeout(r, 150));

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const scrollWidth = doc.scrollWidth;
        const clientWidth = doc.clientWidth;
        const diff = Math.max(0, scrollWidth - clientWidth);
        return {
          scrollWidth,
          clientWidth,
          hasOverflow: diff > 2,
          diff
        };
      });

      if (!overflow.hasOverflow) {
        passedTests++;
        console.log(`  ✓ [${vp.name}] Zoom ${(zoom * 100).toFixed(0)}%: No Horizontal Overflow (Client: ${overflow.clientWidth}px, Scroll: ${overflow.scrollWidth}px)`);
      } else {
        console.error(`  ✗ [${vp.name}] Zoom ${(zoom * 100).toFixed(0)}%: Overflow detected (${overflow.diff}px)`);
        failures.push(`Overflow on ${vp.name} @ ${zoom * 100}%`);
      }
    }
  }

  // Capture Zoom Screenshots
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => { document.body.style.zoom = 1.5; });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(outDir, '02_desktop_navbar_150pct_zoom.png'), clip: { x: 0, y: 0, width: 1440, height: 160 } });
  console.log('  ✓ Saved 02_desktop_navbar_150pct_zoom.png');

  await page.evaluate(() => { document.body.style.zoom = 2.0; });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(outDir, '03_desktop_navbar_200pct_zoom.png'), clip: { x: 0, y: 0, width: 1440, height: 200 } });
  console.log('  ✓ Saved 03_desktop_navbar_200pct_zoom.png');

  // Reset Zoom
  await page.evaluate(() => { document.body.style.zoom = 1.0; });

  // -------------------------------------------------------------------------
  // TEST 3: Mobile & Tablet Hamburger Toggle & Drawer Test
  // -------------------------------------------------------------------------
  console.log('\n--- Test 3: Mobile & Tablet Drawer Interactivity ---');
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://127.0.0.1:5275/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 400));

  // Verify Hamburger Button is visible on mobile
  totalTests++;
  const hamburger = await page.$('.mobile-hamburger-btn');
  const isHamburgerVisible = await page.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }, hamburger);

  if (isHamburgerVisible) {
    console.log('  ✓ Hamburger Menu Button is visible on Mobile');
    passedTests++;
  } else {
    console.error('  ✗ Hamburger Menu Button is hidden on Mobile');
    failures.push('Hamburger hidden on mobile');
  }

  // Screenshot Mobile Closed
  await page.screenshot({ path: path.join(outDir, '04_mobile_navbar_closed.png'), clip: { x: 0, y: 0, width: 390, height: 120 } });
  console.log('  ✓ Saved 04_mobile_navbar_closed.png');

  // Click Hamburger to Open Drawer
  totalTests++;
  await hamburger.click();
  await new Promise(r => setTimeout(r, 350));

  const drawer = await page.$('.mobile-nav-drawer');
  if (drawer) {
    console.log('  ✓ Mobile Navigation Drawer Opened Successfully');
    passedTests++;
    
    // Check Drawer Links
    const drawerLinks = await page.$$eval('.mobile-drawer-link', els => els.map(e => e.textContent.trim()));
    console.log(`  ✓ Drawer Links: [${drawerLinks.join(', ')}]`);

    // Screenshot Mobile Open
    await page.screenshot({ path: path.join(outDir, '05_mobile_navbar_drawer_open.png'), clip: { x: 0, y: 0, width: 390, height: 480 } });
    console.log('  ✓ Saved 05_mobile_navbar_drawer_open.png');
  } else {
    console.error('  ✗ Mobile Navigation Drawer failed to open');
    failures.push('Mobile drawer did not open');
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} checks passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log('===============================================================');

  await browser.close();
  process.exit(failures.length > 0 || consoleErrors.length > 0 ? 1 : 0);
})();

