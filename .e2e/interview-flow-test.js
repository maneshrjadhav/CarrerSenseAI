const fs = require('fs');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FRONT = 'http://localhost:5275';

const token = fs.readFileSync(process.argv[2], 'utf8').trim();
const user = JSON.parse(fs.readFileSync(process.argv[3], 'utf8').trim());
const matchId = process.argv[4];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--user-data-dir=D:/CareerSenseAI/.e2e/profile-' + Date.now(),
    ],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 950 });

  const logs = [];
  page.on('console', (m) => {
    if (m.type() === 'error') logs.push('CONSOLE-ERR: ' + m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message.slice(0, 200)));
  page.on('response', async (res) => {
    const u = res.url();
    if (u.includes('/api/interview') && res.request().method() !== 'OPTIONS') {
      let body = '';
      try {
        body = (await res.text()).slice(0, 120);
      } catch {}
      logs.push('NET ' + res.status() + ' ' + res.request().method() + ' ' + u.replace('http://127.0.0.1:5000', '') + ' :: ' + body.replace(/\n/g, ' '));
    } else if (u.includes('/api/') && res.status() >= 400) {
      logs.push('FAILED ' + res.status() + ' ' + u);
    }
  });

  await page.evaluateOnNewDocument(
    (tok, usr) => {
      localStorage.setItem('careersense_token', tok);
      localStorage.setItem('careersense_user', JSON.stringify(usr));
      localStorage.setItem('careersense_remember', 'true');
    },
    token,
    user
  );

  const clickText = (text) =>
    page.evaluate((t) => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => (x.textContent || '').includes(t));
      if (!b) return false;
      b.click();
      return true;
    }, text);

  const waitFor = async (checkFn, timeoutMs, label) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const ok = await page.evaluate(checkFn);
      if (ok) return true;
      await sleep(400);
    }
    console.log('TIMEOUT waiting for: ' + label);
    return false;
  };

  const typeIn = (placeholderPart, value) =>
    page.evaluate(
      (pp, v) => {
        const el = Array.from(document.querySelectorAll('textarea')).find((t) => (t.placeholder || '').includes(pp));
        if (!el) return false;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(el, v);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      },
      placeholderPart,
      value
    );

  const snapshot = () =>
    page.evaluate(() => {
      const txt = document.body.innerText;
      const toasts = Array.from(document.querySelectorAll('.toast, [class*=toast]'))
        .map((e) => (e.textContent || '').trim())
        .filter((t) => t && t.length < 140);
      return {
        stage: (txt.match(/Stage: [A-Z]+/) || [])[0] || null,
        questionOf: (txt.match(/Question \d+ of \d+/) || [])[0] || null,
        maskedNote: txt.includes('Model answer is masked until you click submit'),
        modelAnswerHidden: !txt.includes('Revealed Model Reference Answer'),
        evalCardShown: txt.includes('AI Pedagogical Answer Evaluation'),
        scoreLine: (txt.match(/Score:\s*\n?\s*(\d+(?:\.\d+)?)\/100/) || [])[1] || null,
        skillBadge: (txt.match(/Target Skill: ([^\n]{2,60})/) || [])[1] || null,
        toasts: Array.from(new Set(toasts)).slice(0, 5),
      };
    });

  await page.goto(FRONT + '/interview-prep/' + matchId, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3000);

  console.log('S1 url:', page.url());
  const started = await clickText('Start Mock Interview Session');
  console.log('S1 startClicked:', started);

  const introUp = await waitFor(() => document.body.innerText.includes('Candidate Self-Introduction'), 15000, 'intro stage');
  console.log('S2 introStageRendered:', introUp);

  const introTyped = await typeIn('Provide a quick outline', 'Final year CS student. Built a Flask and React career platform with NLP skill extraction, TF-IDF matching and MySQL persistence.');
  console.log('S2 introTyped:', introTyped);
  await sleep(600);
  const introClicked = await clickText('Submit Introduction');
  console.log('S2 introSubmitted:', introClicked);

  const qUp = await waitFor(() => /Question \d+ of \d+/.test(document.body.innerText), 15000, 'questions stage');
  console.log('S3 questionsStageRendered:', qUp);
  const s3 = await snapshot();
  console.log('S3_QUESTIONS_BEFORE_SUBMIT', JSON.stringify(s3, null, 2));

  const a1Typed = await typeIn('Explain your approach', 'REST APIs use stateless HTTP verbs over resources. I built Express routes with middleware for auth and validation, MongoDB via Mongoose for persistence, and added pagination, rate limiting and structured error handling to keep services reliable under load.');
  console.log('S3 answerTyped:', a1Typed);
  await sleep(600);
  const a1Clicked = await clickText('Submit Answer for AI Pedagogical Evaluation');
  console.log('S3 answerSubmitted:', a1Clicked);

  const evalUp = await waitFor(() => document.body.innerText.includes('Revealed Model Reference Answer'), 20000, 'evaluation card');
  console.log('S4 evalCardRendered:', evalUp);
  const s4 = await snapshot();
  console.log('S4_AFTER_ANSWER_SUBMIT', JSON.stringify(s4, null, 2));

  const jumped = await page.evaluate(() => {
    const btn = document.querySelector('button[title="Jump to Question 5"]');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('S4 jumpedToQ5:', jumped);
  await sleep(1200);

  const a5Typed = await typeIn('Explain your approach', 'Situation: our team project had flaky deploys. Task: stabilize delivery. Action: I introduced Git feature branches, code review and a staging environment with automated checks. Result: deploy failures dropped and the team shipped weekly with confidence.');
  console.log('S4 answer5Typed:', a5Typed);
  await sleep(600);
  const a5Clicked = await clickText('Submit Answer for AI Pedagogical Evaluation');
  console.log('S4 answer5Submitted:', a5Clicked);

  const completeVisible = await waitFor(
    () => !!Array.from(document.querySelectorAll('button')).find((b) => (b.textContent || '').includes('Complete Interview')),
    20000,
    'complete button'
  );
  console.log('S5 completeButtonVisible:', completeVisible);
  const completed = await clickText('Complete Interview');
  console.log('S5 completeClicked:', completed);

  const reportUp = await waitFor(() => document.body.innerText.includes('Performance Evaluation Report'), 20000, 'report stage');
  console.log('S5 reportRendered:', reportUp);
  const s5 = await page.evaluate(() => {
    const txt = document.body.innerText;
    return {
      overallPct: (txt.match(/(\d+)%\s*\n?\s*SCORE/) || [])[1] || null,
      verdict: (txt.match(/OVERALL RATING\s*\n\s*([^\n]+)/) || [])[1] || null,
      competencyEmptyState: txt.includes('No competency scores recorded'),
      fakeCompetencyCards: /Domain Knowledge|Communication & Structure|Problem Solving & Architecture|Self-Introduction Delivery/.test(txt),
      qReviewScores: (txt.match(/\d+\/100/g) || []).slice(0, 6),
      modelSolutionSections: (txt.match(/Model Solution:/g) || []).length,
      realSkillNamesOnReport: /REST|API|Git|React|Node|Mongo|Express|Docker|SQL|JavaScript/i.test(txt),
    };
  });
  console.log('S5_REPORT', JSON.stringify(s5, null, 2));

  console.log('NETLOG', JSON.stringify(logs.slice(-24), null, 2));
  await browser.close();
})().catch((e) => {
  console.error('E2E ERROR:', e.message);
  process.exit(1);
});
