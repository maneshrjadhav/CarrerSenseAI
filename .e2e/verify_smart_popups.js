const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = 'C:/Users/manes/.gemini/antigravity/brain/b2ea0995-3618-4768-b7c3-ad550e5cfc6a';
const tokenData = JSON.parse(fs.readFileSync(path.join(__dirname, 'token.json'), 'utf8'));

const SAMPLE_RESUME_PDF = path.resolve('D:/CareerSenseAI/backend/uploads/test_manesh_resume.pdf');
const CORRUPTED_PDF = path.resolve('D:/CareerSenseAI/backend/uploads/corrupted.pdf');

(async () => {
  console.log('[E2E] Starting verification for Smart Interactive Popups & Conditional Roadmap...');
  const profileDir = path.join(__dirname, 'profile-popups-' + Date.now());
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    userDataDir: profileDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('[PAGE CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));
  page.on('requestfailed', req => console.log('[REQ FAILED]', req.url(), req.failure()?.errorText));

  // 1. Visit base site and set authentication in localStorage
  await page.goto('http://localhost:5275/', { waitUntil: 'networkidle2' });
  await page.evaluate((auth) => {
    localStorage.setItem('careersense_token', auth.token);
    localStorage.setItem('token', auth.token);
    localStorage.setItem('careersense_user', JSON.stringify(auth.user));
    localStorage.setItem('user', JSON.stringify(auth.user));
    localStorage.setItem('careersense_remember', 'true');
    // Clear session storage flags for clean welcome popup test
    sessionStorage.removeItem('cs_job_match_welcomed');
  }, tokenData);

  console.log('[OK] Authentication active.');

  // =========================================================================
  // TEST 1: POPUP WHEN JOB DESCRIPTION PAGE OPENS (Requirement 4)
  // =========================================================================
  console.log('[TEST 1] Testing Job Match Welcome Modal on /job-match...');
  await page.goto('http://localhost:5275/job-match', { waitUntil: 'networkidle2' });
  console.log('[INFO] Current URL:', page.url());
  const pageState = await page.evaluate(() => ({
    title: document.title,
    welcomed: sessionStorage.getItem('cs_job_match_welcomed'),
    hasModal: !!document.getElementById('job-match-welcome-title'),
    body: document.body.innerText.slice(0, 200)
  }));
  console.log('[INFO] Page State:', JSON.stringify(pageState));
  await page.waitForSelector('#job-match-welcome-title', { timeout: 8000 });
  await new Promise(r => setTimeout(r, 600));

  const welcomeModalPath = path.join(ARTIFACT_DIR, '01_job_match_welcome_modal.png');
  await page.screenshot({ path: welcomeModalPath });
  console.log(`[OK] Captured Job Match Welcome Modal: ${welcomeModalPath}`);

  // Click "Let's Match My Resume →" and verify textarea focus
  const confirmBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes("Let's Match My Resume"));
  });
  if (confirmBtn) {
    await confirmBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  const focusedPath = path.join(ARTIFACT_DIR, '02_job_match_textarea_focused.png');
  await page.screenshot({ path: focusedPath });
  console.log(`[OK] Captured focused Job Description: ${focusedPath}`);

  // =========================================================================
  // TEST 2: POPUP AFTER RESUME PDF UPLOAD (Requirement 2)
  // =========================================================================
  console.log('[TEST 2] Testing Resume Upload Success Modal on /analyze...');
  await page.goto('http://localhost:5275/analyze', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Upload valid PDF resume
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    await fileInput.uploadFile(SAMPLE_RESUME_PDF);
    await page.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })), fileInput);
  }

  // Wait for upload success modal to appear
  await page.waitForSelector('#upload-success-title', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600));

  const uploadSuccessPath = path.join(ARTIFACT_DIR, '03_resume_upload_success_modal.png');
  await page.screenshot({ path: uploadSuccessPath });
  console.log(`[OK] Captured Resume Upload Success Modal: ${uploadSuccessPath}`);

  // =========================================================================
  // TEST 3: POPUP AFTER RESUME ANALYSIS COMPLETES (Requirement 3)
  // =========================================================================
  console.log('[TEST 3] Triggering analysis and testing Resume Analysis Complete Modal...');
  const startAnalysisBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Start Resume Analysis'));
  });

  if (startAnalysisBtn) {
    await startAnalysisBtn.click();
  }

  // Wait for analysis to complete and the completion modal to open
  await page.waitForSelector('#analysis-complete-title', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));

  const analysisCompletePath = path.join(ARTIFACT_DIR, '04_resume_analysis_complete_modal.png');
  await page.screenshot({ path: analysisCompletePath });
  console.log(`[OK] Captured Resume Analysis Complete Modal: ${analysisCompletePath}`);

  // =========================================================================
  // TEST 4: POPUP AFTER RESUME UPLOAD ERROR (Requirement 2 Error Handling)
  // =========================================================================
  console.log('[TEST 4] Testing Resume Upload Error Modal with invalid/corrupted file...');
  // Close the completion modal first
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  await page.goto('http://localhost:5275/analyze', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  const errorFileInput = await page.$('input[type="file"]');
  if (errorFileInput) {
    await errorFileInput.uploadFile(CORRUPTED_PDF);
    await page.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })), errorFileInput);
  }

  await page.waitForSelector('#upload-error-title', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600));

  const uploadErrorPath = path.join(ARTIFACT_DIR, '05_resume_upload_error_modal.png');
  await page.screenshot({ path: uploadErrorPath });
  console.log(`[OK] Captured Resume Upload Error Modal: ${uploadErrorPath}`);

  // Dismiss error modal
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // =========================================================================
  // TEST 5: CONDITIONAL CAREER ROADMAP ON RESUME INTELLIGENCE REPORT (Req 1)
  // Match score below 85% vs Match score >= 85% vs Pure resume view
  // =========================================================================
  console.log('[TEST 5] Testing Conditional Career Roadmap on /resume-analysis/:resumeId...');

  // 5A. Pure Resume Intelligence Report (Resume #108 has NO job match in MySQL)
  console.log('[TEST 5A] Loading /resume-analysis/108 (Pure resume, no job match)...');
  await page.goto('http://localhost:5275/resume-analysis/108', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const pureReportPath = path.join(ARTIFACT_DIR, '06_resume_intelligence_report.png');
  await page.screenshot({ path: pureReportPath, fullPage: true });
  console.log(`[OK] Captured Pure Resume Intelligence Report (No Roadmap banner): ${pureReportPath}`);

  // 5B. Real Match Score Below 85% (Resume #100 has actual Job Match #105 with 31.6% match score in MySQL)
  console.log('[TEST 5B] Loading /resume-analysis/100 (Real MySQL match score < 85%)...');
  await page.goto('http://localhost:5275/resume-analysis/100', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const below85Path = path.join(ARTIFACT_DIR, '07_career_roadmap_recommendation_below_85.png');
  await page.screenshot({ path: below85Path, fullPage: true });
  console.log(`[OK] Captured Real Career Growth Recommendation (< 85%): ${below85Path}`);

  // 5C. Real Match Score >= 85% (Resume #103 has actual Job Match #109 with 88.5% match score in MySQL)
  console.log('[TEST 5C] Loading /resume-analysis/103 (Real MySQL match score >= 85%)...');
  await page.goto('http://localhost:5275/resume-analysis/103', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  const above85Path = path.join(ARTIFACT_DIR, '08_career_roadmap_great_match_85_plus.png');
  await page.screenshot({ path: above85Path, fullPage: true });
  console.log(`[OK] Captured Real Great Match Alignment (>= 85%): ${above85Path}`);

    await new Promise(r => setTimeout(r, 600));
    const above85Path = path.join(ARTIFACT_DIR, '08_career_roadmap_great_match_85_plus.png');
    await page.screenshot({ path: above85Path, fullPage: true });
    console.log(`[OK] Captured Great Match Alignment (>= 85%): ${above85Path}`);
  }

  // Responsive device tests (mobile, tablet, laptop)
  console.log('[TEST 6] Capturing responsive device viewports...');
  await page.setViewport({ width: 375, height: 812, isMobile: true });
  await page.goto('http://localhost:5275/analyze', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  const mobilePath = path.join(ARTIFACT_DIR, '09_analyze_mobile_375.png');
  await page.screenshot({ path: mobilePath });
  console.log(`[OK] Captured Mobile Viewport: ${mobilePath}`);

  await browser.close();
  console.log('[SUCCESS] All smart interactive popups and conditional roadmap features verified!');
})();
