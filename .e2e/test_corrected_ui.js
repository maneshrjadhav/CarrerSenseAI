const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.join(__dirname, 'screenshots_corrected');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const BASE_URL = 'http://127.0.0.1:5275';

(async () => {
  console.log('===============================================================');
  console.log('CAREERSENSE AI — COMPREHENSIVE UI CORRECTION VERIFICATION');
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
  const failures = [];

  function record(title, pass, details = '') {
    totalTests++;
    if (pass) {
      passedTests++;
      console.log(`  [PASS] ${title} ${details ? '(' + details + ')' : ''}`);
    } else {
      failures.push({ title, details });
      console.log(`  [FAIL] ${title} ${details ? '— ' + details : ''}`);
    }
  }

  // =========================================================================
  // 1. HOMEPAGE & NAVBAR (1440x900 Desktop)
  // =========================================================================
  console.log('\n--- 1. Testing Homepage & Navbar (1440x900 Desktop) ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Navbar checks
  const navHeight = await page.$eval('.landing-sticky-navbar', el => el.getBoundingClientRect().height);
  record('Navbar height <= 64px', navHeight <= 65, `Actual: ${navHeight.toFixed(1)}px`);

  const hasCapsule = await page.$('.nav-links-capsule');
  record('Bulky capsule wrapper removed', hasCapsule === null, 'No .nav-links-capsule element');

  const navLinksDirect = await page.$$eval('.desktop-nav-menu .nav-anchor-link', els => els.length);
  record('Navigation links rendered directly on navbar', navLinksDirect === 5, `Found: ${navLinksDirect} links`);

  const ctaBtnText = await page.$eval('.nav-cta-btn', el => el.innerText.trim());
  record('Primary CTA is Get Started Free', ctaBtnText.includes('Get Started Free'), `Text: ${ctaBtnText}`);

  // Hero section checks
  const heroGridColumns = await page.$eval('.hero-two-column-layout', el => {
    return window.getComputedStyle(el).gridTemplateColumns;
  });
  record('Hero two-column layout on desktop', heroGridColumns.includes(' '), `Computed columns: ${heroGridColumns}`);

  const previewBox = await page.$eval('.hero-product-console-wrapper', el => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
  });
  record('Hero preview console visible in first viewport', previewBox.top < 900 && previewBox.top > 0, `Top: ${previewBox.top.toFixed(0)}px, Height: ${previewBox.height.toFixed(0)}px`);

  // Unverified claims check
  const heroText = await page.$eval('.hero-master-container', el => el.innerText);
  const hasDemoLabel = heroText.includes('SIMULATED PREVIEW') || heroText.includes('Demo') || heroText.includes('Simulation');
  record('Interactive console clearly labeled as DEMO/SIMULATED', hasDemoLabel, 'Sample data explicitly qualified');

  const hasFakeVerified = heroText.includes('Verified Profile');
  record('Fake "Verified Profile" claim removed', !hasFakeVerified, 'No unverified candidate badge');

  await page.screenshot({ path: path.join(outDir, 'hero_desktop_1440.png') });

  // =========================================================================
  // 2. HOMEPAGE ON LAPTOP (1366x768)
  // =========================================================================
  console.log('\n--- 2. Testing Homepage on Laptop (1366x768) ---');
  await page.setViewport({ width: 1366, height: 768 });
  await new Promise(r => setTimeout(r, 400));

  const laptopHeroBox = await page.$eval('.hero-two-column-layout', el => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, height: rect.height };
  });
  record('Hero section compact on 768px laptop screen', laptopHeroBox.height < 700, `Hero height: ${laptopHeroBox.height.toFixed(0)}px`);
  await page.screenshot({ path: path.join(outDir, 'hero_laptop_1366.png') });

  // Full homepage capture
  await page.screenshot({ path: path.join(outDir, 'homepage_full_1440.png'), fullPage: true });

  // =========================================================================
  // 3. LOGIN PAGE (1440x900 Desktop & 1366x768 Laptop)
  // =========================================================================
  console.log('\n--- 3. Testing Login Page Split Screen & Proportions ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));

  const splitWrapper = await page.$('.auth-split-screen-wrapper');
  record('Split screen authentication layout present', splitWrapper !== null);

  const leftShowcase = await page.$('.auth-split-showcase');
  record('Left navy showcase panel present on desktop', leftShowcase !== null);

  const loginCard = await page.$eval('.auth-form-card', el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      width: rect.width,
      height: rect.height,
      maxWidth: style.maxWidth,
      top: rect.top,
      bottom: rect.bottom
    };
  });
  record('Login card width constrained <= 420px', loginCard.width <= 422, `Actual width: ${loginCard.width.toFixed(1)}px, maxWidth: ${loginCard.maxWidth}`);

  // Test laptop 1366x768 fit
  await page.setViewport({ width: 1366, height: 768 });
  await new Promise(r => setTimeout(r, 300));
  const loginLaptopFit = await page.$eval('.auth-form-card', el => {
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
      windowHeight: window.innerHeight
    };
  });
  record('Login card fits standard 768px laptop screen', loginLaptopFit.height <= 620, `Card height: ${loginLaptopLaptopHeight = loginLaptopFit.height.toFixed(0)}px, top: ${loginLaptopFit.top.toFixed(0)}px, bottom: ${loginLaptopFit.bottom.toFixed(0)}px`);

  // Verify all essential form elements
  const hasEmail = (await page.$('input[name="email"]')) !== null;
  const hasPassword = (await page.$('input[name="password"]')) !== null;
  const hasToggle = (await page.$('.password-toggle-btn')) !== null;
  const hasRememberMe = (await page.$('input[name="rememberMe"]')) !== null;
  const hasForgotPassword = (await page.$('a[href="/forgot-password"]')) !== null;
  const hasCaptcha = (await page.$('.captcha-container')) !== null;
  const hasSubmitBtn = (await page.$('button[type="submit"]')) !== null;
  const hasCreateAccount = (await page.$('a[href="/register"]')) !== null;
  const hasBackToHome = (await page.$('.auth-back-link')) !== null;

  record('All required Login form fields present',
    hasEmail && hasPassword && hasToggle && hasRememberMe && hasForgotPassword && hasCaptcha && hasSubmitBtn && hasCreateAccount && hasBackToHome,
    'Email, Password, Toggle, RememberMe, ForgotPw, Captcha, Submit, Register, BackToHome verified'
  );

  await page.setViewport({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(outDir, 'login_desktop_1440.png') });

  await page.setViewport({ width: 1366, height: 768 });
  await page.screenshot({ path: path.join(outDir, 'login_laptop_1366.png') });

  // =========================================================================
  // 4. REGISTRATION PAGE
  // =========================================================================
  console.log('\n--- 4. Testing Registration Page Split Screen ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));

  const regSplit = (await page.$('.auth-split-screen-wrapper')) !== null;
  const regShowcase = (await page.$('.auth-split-showcase')) !== null;
  record('Registration split layout active', regSplit && regShowcase);

  const hasRegName = (await page.$('input[name="fullName"]')) !== null;
  const hasRegEmail = (await page.$('input[name="email"]')) !== null;
  const hasRegPhone = (await page.$('input[name="phone"]')) !== null;
  const hasRegDob = (await page.$('input[name="dob"]')) !== null;
  const hasRegPassword = (await page.$('input[name="password"]')) !== null;
  const hasRegConfirm = (await page.$('input[name="confirmPassword"]')) !== null;
  const hasRoleSelector = (await page.$('.role-selector-pills')) !== null;

  record('All Registration form fields present',
    hasRegName && hasRegEmail && hasRegPhone && hasRegDob && hasRegPassword && hasRegConfirm && hasRoleSelector,
    'Name, Email, Phone, DOB, Password, Confirm, Role pills verified'
  );

  await page.screenshot({ path: path.join(outDir, 'register_desktop_1440.png') });

  // =========================================================================
  // 5. RESPONSIVE VIEWPORTS
  // =========================================================================
  console.log('\n--- 5. Testing Multi-Device Responsiveness ---');
  const viewports = [
    { name: 'Mobile Small', width: 320, height: 640 },
    { name: 'Mobile Standard', width: 375, height: 667 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Laptop Standard', width: 1366, height: 768 },
    { name: 'Desktop Full HD', width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 400));

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    record(`Homepage responsive at ${vp.name} (${vp.width}x${vp.height})`, !overflow, overflow ? 'Horizontal overflow!' : 'No overflow');

    if (vp.width <= 768) {
      const hamburgerVisible = await page.$eval('.mobile-hamburger-btn', el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none';
      });
      record(`Mobile hamburger active on ${vp.name}`, hamburgerVisible);
    }
  }

  // Mobile screenshots
  await page.setViewport({ width: 375, height: 667 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, 'hero_mobile_375.png') });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, 'login_mobile_375.png') });

  // =========================================================================
  // 6. MULTI-ZOOM TESTING (50% to 200%)
  // =========================================================================
  console.log('\n--- 6. Testing Multi-Zoom Responsiveness (50% to 200%) ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });

  const zoomLevels = [0.5, 0.75, 0.9, 1.0, 1.25, 1.5, 1.75, 2.0];
  for (const zoom of zoomLevels) {
    await page.evaluate(z => {
      document.body.style.zoom = z;
    }, zoom);
    await new Promise(r => setTimeout(r, 200));

    const zoomOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 5;
    });
    record(`Zoom ${(zoom * 100).toFixed(0)}% stability`, !zoomOverflow, `Zoom level ${zoom}`);
  }
  await page.evaluate(() => { document.body.style.zoom = 1; });

  // =========================================================================
  // 7. CONSOLE ERRORS
  // =========================================================================
  console.log('\n--- 7. Console Errors Check ---');
  record('Zero unexpected frontend runtime errors', consoleErrors.length === 0, `${consoleErrors.length} errors found`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach(e => console.log('   Console Error:', e));
  }

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===============================================================');

  await browser.close();
  process.exit(failures.length === 0 ? 0 : 1);
})();
