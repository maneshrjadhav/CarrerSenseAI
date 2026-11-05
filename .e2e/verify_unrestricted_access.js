const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = 'C:/Users/manes/.gemini/antigravity/brain/b2ea0995-3618-4768-b7c3-ad550e5cfc6a';

const tokenData = JSON.parse(fs.readFileSync(path.join(__dirname, 'token.json'), 'utf8'));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Visit base site and set authentication in localStorage
  await page.goto('http://localhost:5275/', { waitUntil: 'networkidle2' });
  await page.evaluate((auth) => {
    localStorage.setItem('careersense_token', auth.token);
    localStorage.setItem('token', auth.token);
    localStorage.setItem('careersense_user', JSON.stringify(auth.user));
    localStorage.setItem('user', JSON.stringify(auth.user));
    localStorage.setItem('careersense_remember', 'true');
  }, tokenData);

  console.log('[OK] Candidate authentication credentials set in browser localStorage.');

  // 2. Navigate to /pricing
  await page.goto('http://localhost:5275/pricing', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const pricingPath = path.join(ARTIFACT_DIR, '01_free_access_pricing.png');
  await page.screenshot({ path: pricingPath, fullPage: true });
  console.log(`[OK] Captured: ${pricingPath}`);

  // 3. Navigate to /career-roadmap
  await page.goto('http://localhost:5275/career-roadmap', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const roadmapPath = path.join(ARTIFACT_DIR, '02_career_roadmap_unlocked.png');
  await page.screenshot({ path: roadmapPath, fullPage: true });
  console.log(`[OK] Captured: ${roadmapPath}`);

  // 4. Navigate to /skill-gap
  await page.goto('http://localhost:5275/skill-gap', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const skillGapPath = path.join(ARTIFACT_DIR, '03_skill_gap_unlocked.png');
  await page.screenshot({ path: skillGapPath, fullPage: true });
  console.log(`[OK] Captured: ${skillGapPath}`);

  // 5. Navigate to /profile
  await page.goto('http://localhost:5275/profile', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const profilePath = path.join(ARTIFACT_DIR, '04_profile_free_access.png');
  await page.screenshot({ path: profilePath, fullPage: true });
  console.log(`[OK] Captured: ${profilePath}`);

  await browser.close();
  console.log('[OK] All verification screenshots captured successfully!');
})();

