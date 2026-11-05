const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.join(__dirname, 'screenshots_modern_login');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const BASE_URL = 'http://127.0.0.1:5275';

(async () => {
  console.log('===============================================================');
  console.log('CAREERSENSE AI — MODERN SPLIT-SCREEN LOGIN VERIFICATION');
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
  // 1. DESKTOP VIEWPORT (1440x900)
  // =========================================================================
  console.log('\n--- 1. Testing Modern Login on Desktop (1440x900) ---');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));

  // Check Centered Card Frame
  const cardFrame = await page.$('.auth-centered-card-frame');
  record('Centered large rounded container present', cardFrame !== null);

  // Proportions: Left 45%, Right 55%
  const panelLayout = await page.evaluate(() => {
    const left = document.querySelector('.auth-left-form-panel');
    const right = document.querySelector('.auth-right-visual-panel');
    const frame = document.querySelector('.auth-centered-card-frame');
    if (!left || !right || !frame) return null;
    const fWidth = frame.getBoundingClientRect().width;
    const lWidth = left.getBoundingClientRect().width;
    const rWidth = right.getBoundingClientRect().width;
    return {
      frameWidth: fWidth,
      leftRatio: lWidth / fWidth,
      rightRatio: rWidth / fWidth,
      leftWidth: lWidth,
      rightWidth: rWidth
    };
  });
  record('Desktop proportions balanced (45% left / 55% right)',
    panelLayout && panelLayout.leftRatio >= 0.42 && panelLayout.leftRatio <= 0.48 && panelLayout.rightRatio >= 0.52 && panelLayout.rightRatio <= 0.58,
    panelLayout ? `Left: ${(panelLayout.leftRatio * 100).toFixed(1)}%, Right: ${(panelLayout.rightRatio * 100).toFixed(1)}%` : 'Missing'
  );

  // Brand Logo
  const hasBrandLogo = await page.$eval('.auth-brand-badge-split', el => {
    return el.innerText.includes('CareerSense') && el.innerText.includes('AI');
  });
  record('CareerSense AI brand logo with sparkle icon present', hasBrandLogo);

  // Main Heading and Subtitle
  const headingText = await page.$eval('.auth-form-title', el => el.innerText.trim());
  record('Heading is "Welcome Back"', headingText === 'Welcome Back', `Actual: "${headingText}"`);

  const subtitleText = await page.$eval('.auth-form-subtitle', el => el.innerText.trim());
  record('Subtitle matches specification', subtitleText.includes('Sign in to continue your AI-powered career journey.'), `Actual: "${subtitleText}"`);

  // Form Fields
  const emailPlaceholder = await page.$eval('input[name="email"]', el => el.getAttribute('placeholder'));
  record('Email field with placeholder "Enter your email address"', emailPlaceholder === 'Enter your email address');

  const passwordPlaceholder = await page.$eval('input[name="password"]', el => el.getAttribute('placeholder'));
  record('Password field with placeholder "Enter your password"', passwordPlaceholder === 'Enter your password');

  const hasToggleBtn = (await page.$('.password-toggle-btn')) !== null;
  record('Show/Hide password toggle present', hasToggleBtn);

  const hasRememberMe = (await page.$('input[name="rememberMe"]')) !== null;
  record('Remember Me checkbox present', hasRememberMe);

  const hasForgotLink = (await page.$('a[href="/forgot-password"]')) !== null;
  record('Forgot Password link present', hasForgotLink);

  const submitBtnText = await page.$eval('button[type="submit"]', el => el.innerText.trim());
  record('Primary button is "Sign In to CareerSense"', submitBtnText === 'Sign In to CareerSense', `Text: "${submitBtnText}"`);

  const hasOrDivider = (await page.$('.auth-or-divider')) !== null;
  record('OR divider present', hasOrDivider);

  const hasCreateAccount = await page.$eval('.auth-footer-prompt', el => el.innerText.includes('Create Account'));
  record('Create Account link present', hasCreateAccount);

  const hasLegalRow = await page.$eval('.auth-legal-footer-row', el => {
    const text = el.innerText;
    return text.includes('Terms & Conditions') && text.includes('Privacy Policy') && text.includes('Back to Home');
  });
  record('Bottom links: Terms, Privacy, Back to Home present', hasLegalRow);

  // =========================================================================
  // 2. RIGHT VISUAL PANEL & 3 FLOATING CARDS
  // =========================================================================
  console.log('\n--- 2. Testing Right Visual Panel & Floating UI Cards ---');
  const rightPanel = await page.$('.auth-right-visual-panel');
  record('Right visual panel present', rightPanel !== null);

  const hasBgLayer = (await page.$('.auth-visual-image-layer')) !== null;
  record('Professional background image layer present', hasBgLayer);

  const floatingCards = await page.$$eval('.auth-floating-card', els => els.map(e => e.innerText));
  record('3 subtle floating UI cards present', floatingCards.length === 3, `Count: ${floatingCards.length}`);

  const card1Match = floatingCards.some(t => t.includes('AI Resume Analysis') && t.includes('Your career profile is ready for analysis.'));
  record('Card 1: "AI Resume Analysis" verified', card1Match);

  const card2Match = floatingCards.some(t => t.includes('Skill Intelligence') && t.includes('Discover your strengths and skill gaps.'));
  record('Card 2: "Skill Intelligence" verified', card2Match);

  const card3Match = floatingCards.some(t => t.includes('Career Roadmap') && t.includes('Build your next career milestone.'));
  record('Card 3: "Career Roadmap" verified', card3Match);

  // Capture Desktop Screenshot
  await page.screenshot({ path: path.join(outDir, 'modern_login_desktop_1440.png') });

  // =========================================================================
  // 3. LAPTOP VIEWPORT (1366x768)
  // =========================================================================
  console.log('\n--- 3. Testing on Laptop (1366x768) ---');
  await page.setViewport({ width: 1366, height: 768 });
  await new Promise(r => setTimeout(r, 400));

  const laptopFit = await page.evaluate(() => {
    const frame = document.querySelector('.auth-centered-card-frame');
    if (!frame) return null;
    const rect = frame.getBoundingClientRect();
    return {
      height: rect.height,
      top: rect.top,
      bottom: rect.bottom,
      windowHeight: window.innerHeight
    };
  });
  record('Centered container fits laptop viewport comfortably',
    laptopFit && laptopFit.height <= 720,
    `Card height: ${laptopFit.height.toFixed(0)}px, top: ${laptopFit.top.toFixed(0)}px, bottom: ${laptopFit.bottom.toFixed(0)}px`
  );

  await page.screenshot({ path: path.join(outDir, 'modern_login_laptop_1366.png') });

  // =========================================================================
  // 4. TABLET & MOBILE VIEWPORTS
  // =========================================================================
  console.log('\n--- 4. Testing Tablet & Mobile Viewports ---');
  // Tablet 1024x768
  await page.setViewport({ width: 1024, height: 768 });
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(outDir, 'modern_login_tablet_1024.png') });

  // Mobile 375x667
  await page.setViewport({ width: 375, height: 667 });
  await new Promise(r => setTimeout(r, 300));
  const mobileFormVisible = await page.$eval('.auth-left-form-panel', el => {
    const rect = el.getBoundingClientRect();
    return rect.width > 300 && rect.height > 400;
  });
  record('Mobile display prioritizes login form full-width', mobileFormVisible);

  const mobileOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth + 2;
  });
  record('Zero horizontal overflow on mobile', !mobileOverflow);

  await page.screenshot({ path: path.join(outDir, 'modern_login_mobile_375.png') });

  // =========================================================================
  // 5. MULTI-ZOOM TESTING (75% to 200%)
  // =========================================================================
  console.log('\n--- 5. Testing Multi-Zoom (75% to 200%) ---');
  await page.setViewport({ width: 1440, height: 900 });
  const zoomLevels = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  for (const zoom of zoomLevels) {
    await page.evaluate(z => { document.body.style.zoom = z; }, zoom);
    await new Promise(r => setTimeout(r, 150));
    const zOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 5;
    });
    record(`Zoom ${(zoom * 100).toFixed(0)}% stability`, !zOverflow);
  }
  await page.evaluate(() => { document.body.style.zoom = 1; });

  // =========================================================================
  // 6. FUNCTIONAL TEST: LOGIN SUBMISSION PRESERVATION
  // =========================================================================
  console.log('\n--- 6. Functional Login Validation ---');
  // Fill in candidate credentials
  await page.type('input[name="email"]', 'candidate_alpha_v25@careersense.ai');
  await page.type('input[name="password"]', 'CandidatePassword123!');
  // Read captcha code if rendered
  const captchaText = await page.$eval('.captcha-text', el => el.innerText.trim());
  await page.type('.captcha-input', captchaText);
  await new Promise(r => setTimeout(r, 200));

  // Submit form
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));

  const pageAlert = await page.evaluate(() => document.querySelector('.auth-alert-error')?.innerText || '');
  if (pageAlert) {
    console.log('  Page Alert displayed:', pageAlert);
  }

  const currentUrl = page.url();
  const loginSuccess = currentUrl.includes('/dashboard');
  record('Candidate login authenticated successfully and navigated to /dashboard', loginSuccess, `Destination: ${currentUrl}`);

  // Screenshot post-login dashboard
  await page.screenshot({ path: path.join(outDir, 'dashboard_post_login.png') });

  // Console Errors
  if (consoleErrors.length > 0) {
    console.log('\n--- Captured Console Errors ---');
    consoleErrors.forEach(err => console.log('  [ERROR]', err));
  }
  record('Zero unexpected console runtime errors', consoleErrors.length === 0, `${consoleErrors.length} errors`);

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('===============================================================');

  await browser.close();
  process.exit(failures.length === 0 ? 0 : 1);
})();
