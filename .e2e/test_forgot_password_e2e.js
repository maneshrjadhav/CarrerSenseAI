const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const outDir = path.join(__dirname, 'screenshots_forgot_password');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const BASE_URL = 'http://127.0.0.1:5275';
const TEST_EMAIL = 'candidate_alpha_v25@careersense.ai';
const INITIAL_PASSWORD = 'CandidatePassword123!';
const NEW_PASSWORD = 'CandidateReset2026!';

function getLatestDispatchedOtp(email) {
  // 1. Check backend/.latest_otp.json
  try {
    const otpFile = path.join(__dirname, '..', 'backend', '.latest_otp.json');
    if (fs.existsSync(otpFile)) {
      const data = JSON.parse(fs.readFileSync(otpFile, 'utf-8'));
      if (data.email === email && data.otp) {
        return String(data.otp);
      }
    }
  } catch (e) {}

  // 2. Check task logs for [DEV OTP DISPATCH]
  try {
    const tasksDir = 'C:\\Users\\manes\\.gemini\\antigravity\\brain\\b2ea0995-3618-4768-b7c3-ad550e5cfc6a\\.system_generated\\tasks';
    const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.log'));
    files.sort((a, b) => fs.statSync(path.join(tasksDir, b)).mtimeMs - fs.statSync(path.join(tasksDir, a)).mtimeMs);
    const regex = new RegExp(`To:\\s*${email}\\s*\\|\\s*Code:\\s*(\\d{6})`, 'g');
    for (const f of files) {
      const content = fs.readFileSync(path.join(tasksDir, f), 'utf-8');
      const matches = [...content.matchAll(regex)];
      if (matches.length > 0) {
        return matches[matches.length - 1][1];
      }
    }
  } catch (e) {}

  return null;
}

(async () => {
  console.log('===============================================================');
  console.log('CAREERSENSE AI — EMAIL OTP FORGOT & RESET PASSWORD E2E SUITE');
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

  page.on('request', req => {
    if (req.url().includes('/auth/')) {
      console.log(`[HTTP REQ] ${req.method()} ${req.url()} -> ${req.postData()}`);
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/auth/')) {
      try {
        const body = await res.text();
        console.log(`[HTTP ${res.status()}] ${res.url()} -> ${body}`);
      } catch (e) {}
    }
  });

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

  try {
    // Clean test state before starting
    console.log('--- Setup: Clearing previous test OTP state ---');
    execSync('.venv\\Scripts\\python.exe backend/restore_pwd.py', { stdio: 'inherit' });

    // =========================================================================
    // 1. STAGE 1: EMAIL REQUEST FORM
    // =========================================================================
    console.log('\n--- 1. Testing Forgot Password Screen (Stage 1: Email Request) ---');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/forgot-password`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    // Centered split layout check
    const cardFrame = await page.$('.auth-centered-card-frame');
    record('Split-screen card container rendered properly', cardFrame !== null);

    const titleText = await page.$eval('.auth-form-title', el => el.textContent.trim());
    record('Stage 1 Header Title matches "Forgot Password?"', titleText === 'Forgot Password?');

    const progressExists = await page.$('.otp-steps-progress');
    record('3-Step Progress Indicator visible on Stage 1', progressExists !== null);

    // Test Invalid Email submission
    await page.type('#forgot-email', 'invalid-email-format');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 300));

    const clientErrText = await page.$eval('.otp-feedback-alert.error', el => el.textContent.trim()).catch(() => '');
    record('Client validation catches malformed email', clientErrText.includes('valid email address'));

    // Clear input completely & Enter valid test email
    await page.evaluate(() => {
      const el = document.getElementById('forgot-email');
      if (el) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 100));
    await page.type('#forgot-email', TEST_EMAIL);

    // Screenshot Stage 1
    const s1Path = path.join(outDir, '01_stage1_email_input.png');
    await page.screenshot({ path: s1Path, fullPage: false });
    record('Captured Stage 1 Email Input screenshot', fs.existsSync(s1Path));

    // Submit Request for OTP
    console.log(`\n--- Requesting OTP for ${TEST_EMAIL} ---`);
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1800));

    // =========================================================================
    // 2. STAGE 2: 6-DIGIT OTP VERIFICATION
    // =========================================================================
    console.log('\n--- 2. Testing Stage 2: 6-Digit OTP Verification Screen ---');
    const s2Title = await page.$eval('.auth-form-title', el => el.textContent.trim());
    record('Transitioned to Stage 2: "Verify Your Identity"', s2Title === 'Verify Your Identity');

    const emailBadgeText = await page.$eval('.otp-email-badge', el => el.textContent.trim());
    record('Target email badge correctly displays candidate email', emailBadgeText.includes(TEST_EMAIL));

    const digitInputs = await page.$$('.otp-digit-field');
    record('Exactly 6 segmented numeric input boxes rendered', digitInputs.length === 6);

    const timerPill = await page.$('.otp-timer-pill');
    const timerText = await page.evaluate(el => el ? el.textContent.trim() : '', timerPill);
    record('5-minute Expiry countdown timer active', timerText.includes('Expires in 04:') || timerText.includes('Expires in 05:'));

    const resendBtnText = await page.$eval('.otp-resend-action', el => el.textContent.trim());
    record('60-second Resend cooldown active on freshly dispatched code', resendBtnText.includes('Resend in'));

    // Retrieve generated OTP from backend
    let dispatchedOtp = getLatestDispatchedOtp(TEST_EMAIL);
    console.log(`\nDispatched OTP read from backend: ${dispatchedOtp}`);
    record('Valid 6-digit OTP retrieved from secure service dispatch', dispatchedOtp !== null && dispatchedOtp.length === 6);

    // Test entering incorrect OTP
    console.log('\n--- Testing Incorrect OTP Handling ---');
    await digitInputs[0].focus();
    await page.keyboard.type('000000', { delay: 60 });
    await new Promise(r => setTimeout(r, 400));

    await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1500));

    const otpErrText = await page.$eval('.otp-feedback-alert.error', el => el.textContent.trim()).catch(() => '');
    console.log(`  [OTP Error Output]: "${otpErrText}"`);
    record('Invalid OTP rejected with attempts count tracking', otpErrText.includes('Invalid verification code') && otpErrText.includes('attempt(s) remaining'));

    // Screenshot Stage 2 Error
    const s2ErrPath = path.join(outDir, '02_stage2_otp_error.png');
    await page.screenshot({ path: s2ErrPath, fullPage: false });
    record('Captured Stage 2 OTP Error screenshot', fs.existsSync(s2ErrPath));

    // Clear boxes and type correct OTP digit-by-digit
    for (let i = 0; i < 6; i++) {
      await digitInputs[i].click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await digitInputs[i].type(dispatchedOtp[i]);
      await new Promise(r => setTimeout(r, 40));
    }

    // Screenshot Stage 2 Filled
    const s2FilledPath = path.join(outDir, '03_stage2_otp_filled.png');
    await page.screenshot({ path: s2FilledPath, fullPage: false });
    record('Captured Stage 2 OTP Filled screenshot', fs.existsSync(s2FilledPath));

    // Submit Verification
    await page.waitForFunction(() => !document.querySelector('button[type="submit"]').disabled);
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1600));

    // =========================================================================
    // 3. STAGE 3: NEW PASSWORD & CONFIRM PASSWORD
    // =========================================================================
    console.log('\n--- 3. Testing Stage 3: New Password Screen ---');
    const s3Title = await page.$eval('.auth-form-title', el => el.textContent.trim());
    record('Transitioned to Stage 3: "Set New Password"', s3Title === 'Set New Password');

    const newPwdInput = await page.$('#new-password');
    const confirmPwdInput = await page.$('#confirm-password');
    record('New password and confirm password fields rendered', newPwdInput !== null && confirmPwdInput !== null);

    // Live Password Strength Meter Test
    await page.type('#new-password', 'weak');
    await new Promise(r => setTimeout(r, 200));
    const strengthLabel = await page.$eval('.strength-value', el => el.textContent.trim());
    record('Password strength shows "Weak" for short string', strengthLabel === 'Weak');

    // Test password show/hide toggle
    const toggleBtns = await page.$$('.password-toggle-btn');
    if (toggleBtns.length > 0) {
      await toggleBtns[0].click();
      const inputType = await page.$eval('#new-password', el => el.type);
      record('Password show/hide toggle successfully switches to "text"', inputType === 'text');
      await toggleBtns[0].click(); // toggle back
    }

    // Type strong password
    await page.evaluate(() => {
      const el = document.getElementById('new-password');
      if (el) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 50));
    await page.type('#new-password', NEW_PASSWORD);
    await new Promise(r => setTimeout(r, 200));

    const strongLabel = await page.$eval('.strength-value', el => el.textContent.trim());
    record('Password strength shows "Strong" for compliant password', strongLabel === 'Strong');

    // Mismatched confirm password test
    await page.type('#confirm-password', 'DifferentPwd123!');
    const submitDisabled = await page.$eval('button[type="submit"]', el => el.disabled);
    record('Submit button remains disabled when passwords do not match', submitDisabled === true);

    // Matching confirm password
    await page.evaluate(() => {
      const el = document.getElementById('confirm-password');
      if (el) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 50));
    await page.type('#confirm-password', NEW_PASSWORD);
    await new Promise(r => setTimeout(r, 300));

    const submitEnabled = await page.$eval('button[type="submit"]', el => !el.disabled);
    record('Submit button unlocks when all complexity & match criteria are satisfied', submitEnabled === true);

    // Screenshot Stage 3
    const s3Path = path.join(outDir, '04_stage3_new_password.png');
    await page.screenshot({ path: s3Path, fullPage: false });
    record('Captured Stage 3 New Password screenshot', fs.existsSync(s3Path));

    // Submit Password Reset
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1600));

    // =========================================================================
    // 4. STAGE 4: SUCCESS CONFIRMATION
    // =========================================================================
    console.log('\n--- 4. Testing Stage 4: Success Confirmation Screen ---');
    const successTitle = await page.$eval('.otp-success-title', el => el.textContent.trim());
    record('Password Successfully Reset title displayed', successTitle.includes('Successfully Reset'));

    const successIcon = await page.$('.otp-success-icon-wrap');
    record('Emerald success checkmark icon displayed', successIcon !== null);

    // Screenshot Stage 4
    const s4Path = path.join(outDir, '05_stage4_success.png');
    await page.screenshot({ path: s4Path, fullPage: false });
    record('Captured Stage 4 Success Confirmation screenshot', fs.existsSync(s4Path));

    // Click Sign In with New Password button
    await page.click('.otp-success-view button');
    await new Promise(r => setTimeout(r, 800));

    const currentUrl = page.url();
    record('Redirects to /login on clicking Sign In button', currentUrl.includes('/login'));

    // =========================================================================
    // 5. STAGE 5: LOGIN WITH NEWLY RESET PASSWORD
    // =========================================================================
    console.log('\n--- 5. Logging in with Newly Reset Password ---');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.type('input[name="password"]', NEW_PASSWORD);

    // Read captcha directly from rendered component
    const captchaText = await page.$eval('.captcha-text', el => el.innerText.trim());
    console.log(`Rendered CAPTCHA code: ${captchaText}`);
    await page.type('.captcha-input', captchaText);
    await new Promise(r => setTimeout(r, 200));

    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2500));

    const postLoginUrl = page.url();
    record('Successfully logged in and navigated to Dashboard', postLoginUrl.includes('/dashboard'), `Destination: ${postLoginUrl}`);

    // Screenshot Stage 5 Dashboard
    const s5Path = path.join(outDir, '06_stage5_dashboard_login.png');
    await page.screenshot({ path: s5Path, fullPage: false });
    record('Captured Post-Reset Dashboard Login screenshot', fs.existsSync(s5Path));

  } catch (err) {
    record('E2E Execution Error', false, err.message);
    console.error(err);
  } finally {
    // Teardown: Restore original password in MySQL
    console.log('\n--- Teardown: Restoring Candidate Original Password ---');
    try {
      execSync('.venv\\Scripts\\python.exe backend/restore_pwd.py', { stdio: 'inherit' });
      record('Teardown candidate original password restored in MySQL', true);
    } catch (restoreErr) {
      console.error('Failed to restore candidate password:', restoreErr.message);
    }

    await browser.close();

    console.log('\n===============================================================');
    console.log(`SUMMARY: ${passedTests}/${totalTests} Tests Passed (${Math.round((passedTests/totalTests)*100)}%)`);
    if (failures.length > 0) {
      console.log('FAILURES:');
      failures.forEach(f => console.log(`  - ${f.title}: ${f.details}`));
    }
    console.log('===============================================================');
  }
})();
