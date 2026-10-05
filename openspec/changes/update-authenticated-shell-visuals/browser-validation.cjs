// Local UI validation only: fixtures stay in the browser, never in product code.
const { chromium } = require('C:/Users/vinic/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');
const phase = process.argv[2] || 'final';
const out = path.join(__dirname, 'validation', phase);
fs.mkdirSync(out, { recursive: true });
const user = { id: '00000000-0000-4000-8000-000000000000', email: 'ana@example.com', displayName: 'Ana', googleLinked: false, emailVerified: true, localPassword: true, avatarVersion: null };
let prefs = { tasks: true, subjects: true, flashcards: true, ai: false };
let prefsFailure = false;
let logoutFailure = true;
let logoutGate = null;
const routes = ['/app', '/app/tarefas', '/app/materias', '/app/flashcards', '/app/pomodoro', '/app/rotinas', '/app/estatisticas', '/app/progresso', '/conta'];
const empty = { items: [], page: 1, pageSize: 20, total: 0, totalPages: 0 };
async function main() {
  const contracts = await import(pathToFileURL(path.resolve('packages/contracts/dist/index.js')).href);
  const progress = { timeZone: 'UTC', trackingStartedAt: '2026-09-27T12:00:00.000Z', today: '2026-10-05', currentStreak: 0, longestStreak: 0, activeDays: 0, achievements: contracts.studyAchievementCatalog.map(x => ({ ...x, progress: 0, earnedAt: null })) };
  const week = { timeZone: 'UTC', period: { start: '2026-10-05', end: '2026-10-12', partial: true, days: 7 }, previousPeriod: { start: '2026-09-28', end: '2026-10-05', partial: false, days: 7 }, metrics: {}, series: [], frequency: { activeDays: 0, days: 7, status: 'available' } };
  const dashboard = { asOf: '2026-10-05T12:00:00.000Z', timeZone: 'UTC', preferences: prefs, tasks: { state: 'empty', data: { counts: { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 }, upcoming: [], withoutDeadline: 0 } }, subjects: { state: 'empty', data: null }, flashcards: { state: 'empty', data: { pending: 0 } }, pomodoro: { state: 'empty', data: { session: null, completedSessions: 0 } }, streak: { state: 'empty', data: progress }, week: { state: 'empty', data: week } };
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/vinic/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let body, status = 200;
      switch (url.pathname.replace(/^\/api/, '')) {
        case '/auth/me': body = { user }; break;
        case '/auth/logout':
          if (logoutGate) await logoutGate;
          if (!logoutFailure) { await route.fulfill({ status: 204 }); return; }
          body = { error: { code: 'UNKNOWN' } }; status = 503; break;
        case '/profile': body = user; break;
        case '/profile/preferences': body = prefsFailure ? { error: { code: 'UNKNOWN' } } : prefs; status = prefsFailure ? 503 : 200; break;
        case '/account/study-timezone': body = { timeZone: 'UTC', trackingStartedAt: progress.trackingStartedAt }; break;
        case '/study-progress': body = progress; break;
        case '/analytics/study': body = week; break;
        case '/dashboard': body = dashboard; break;
        case '/tasks': case '/subjects': case '/routines': case '/flashcard-decks': case '/pomodoro/sessions': body = empty; break;
        case '/routines/schedule': body = { items: [] }; break;
        case '/pomodoro/sessions/current': body = { session: null }; break;
        default: body = { error: { code: 'UNKNOWN' } }; status = 503;
      }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:5173', 'Access-Control-Allow-Credentials': 'true' } });
    });
    const page = await context.newPage();
    const results = process.argv[3] === 'interactions' ? JSON.parse(fs.readFileSync(path.join(out, 'results.json'), 'utf8')) : [];
    const widths = process.argv[3] === 'interactions' ? [] : phase === 'baseline' ? [320, 1440] : [320, 375, 768, 1023, 1024, 1440];
    for (const theme of ['light', 'dark']) {
      await page.goto('http://127.0.0.1:5173/');
      await page.evaluate(t => localStorage.setItem('edutrack.theme', t), theme);
      for (const width of widths) {
        await page.setViewportSize({ width, height: width === 1024 ? 480 : 800 });
        for (const href of routes) {
          await page.goto('http://127.0.0.1:5173' + href);
          await page.locator('.private-content').waitFor();
          await page.waitForTimeout(150);
          const slug = href.replaceAll('/', '-') || 'home';
          const record = await page.evaluate(() => ({ text: document.querySelector('.private-content').textContent.replace(/\s+/g, ' ').trim(), overflow: document.documentElement.scrollWidth > innerWidth, header: document.querySelector('.private-header').getBoundingClientRect().toJSON(), content: document.querySelector('.private-content').getBoundingClientRect().toJSON() }));
          if (phase === 'final') {
            assert.equal(record.overflow, false, `${href} ${theme} ${width}: overflow`);
            const nav = page.locator(width >= 1024 ? '.shell-sidebar nav' : '.shell-bottom-nav');
            assert.equal(await nav.isVisible(), true);
            if (width < 1024 && !['/app', '/app/tarefas', '/app/materias', '/app/flashcards'].includes(href)) assert.equal(await page.getByRole('button', { name: /Mais.*página atual/ }).count(), 1);
          }
          results.push({ href, theme, width, ...record });
          if ([320, 1440].includes(width)) await page.screenshot({ path: path.join(out, `${theme}-${width}${slug}.png`), fullPage: true });
        }
      }
    }
    const interactions = [];
    const contrastChecks = [];
    function luminance(rgb) { return rgb.map(x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0); }
    async function checkContrast(selectors) {
      const pairs = await page.evaluate(selectors => selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)).filter(el => el.getBoundingClientRect().width > 0).map(el => {
        let background = el;
        while (background.parentElement && ['rgba(0, 0, 0, 0)', 'transparent'].includes(getComputedStyle(background).backgroundColor)) background = background.parentElement;
        const style = getComputedStyle(el);
        const channels = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
        return { selector, foreground: channels(style.color), background: channels(getComputedStyle(background).backgroundColor) };
      })), selectors);
      for (const pair of pairs) {
        const values = [luminance(pair.foreground), luminance(pair.background)].sort((a, b) => a - b);
        const ratio = (values[1] + .05) / (values[0] + .05);
        assert(ratio >= 4.5, `${pair.selector}: contrast ${ratio}`);
        contrastChecks.push({ theme: await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light'), ...pair, ratio });
      }
    }
    if (phase === 'final') {
      for (const theme of ['light', 'dark']) {
        await page.evaluate(t => localStorage.setItem('edutrack.theme', t), theme);
        await page.setViewportSize({ width: 320, height: 480 });
        await page.goto('http://127.0.0.1:5173/app/tarefas');
        await page.locator('.shell-bottom-nav').waitFor();
        await checkContrast(['.shell-brand', '.shell-theme', '.shell-profile-link [data-slot="avatar-fallback"]', '.shell-bottom-nav a', '.shell-more-trigger']);
        const more = page.getByRole('button', { name: 'Mais' });
        await more.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Mais' });
        await dialog.waitFor();
        await checkContrast(['.shell-more-sheet a', '.shell-more-close', '.shell-signout', '[data-slot="sheet-title"]', '[data-slot="sheet-description"]']);
        const menuGeometry = await dialog.evaluate(el => ({ rect: el.getBoundingClientRect().toJSON(), controls: Array.from(el.querySelectorAll('a,button')).map(x => x.getBoundingClientRect().toJSON()), focused: el.contains(document.activeElement), animation: getComputedStyle(el).animationDuration }));
        assert.equal(menuGeometry.focused, true);
        assert(menuGeometry.controls.every(r => r.width >= 44 && r.height >= 44));
        await page.screenshot({ path: path.join(out, `${theme}-320-more.png`) });
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await more.evaluate(el => el === document.activeElement), true);
        await more.click();
        await dialog.waitFor();
        await page.setViewportSize({ width: 1440, height: 480 });
        await dialog.waitFor({ state: 'hidden' });
        const resized = await page.evaluate(() => ({ focusedVisible: document.activeElement.getBoundingClientRect().width > 0, locked: document.body.hasAttribute('data-scroll-locked'), mobileNav: !!document.querySelector('.shell-bottom-nav') }));
        assert.equal(resized.focusedVisible, true);
        assert.equal(resized.locked, false);
        assert.equal(resized.mobileNav, false);
        const sidebar = page.locator('.shell-sidebar nav');
        await checkContrast(['.shell-sidebar a', '.shell-signout']);
        await sidebar.getByRole('link', { name: 'Conta', exact: true }).focus();
        await page.keyboard.press('Tab');
        assert.equal(await page.getByRole('button', { name: 'Sair' }).evaluate(el => el === document.activeElement), true);
        await page.screenshot({ path: path.join(out, `${theme}-1440-short.png`) });
        await page.goto('http://127.0.0.1:5173/conta?google=linked#account-profile');
        const draft = page.getByLabel('Nome exibido');
        await draft.fill('Rascunho preservado');
        await page.locator('.shell-theme').click();
        assert.equal(await draft.inputValue(), 'Rascunho preservado');
        await page.getByRole('navigation', { name: 'Configurações da conta' }).getByRole('link', { name: /Aparência/ }).click();
        assert.equal(await draft.inputValue(), 'Rascunho preservado');
        await page.reload();
        assert.equal(new URL(page.url()).searchParams.get('google'), 'linked');
        await page.locator('.private-content').waitFor();
        await page.locator('.shell-sidebar').getByRole('link', { name: 'Tarefas', exact: true }).click();
        await page.locator('.tasks-module').waitFor();
        await page.goBack();
        await page.locator('.account-area').waitFor();
        await page.goForward();
        await page.locator('.tasks-module').waitFor();
        await page.setViewportSize({ width: 568, height: 320 });
        await page.getByRole('button', { name: 'Mais' }).click();
        await page.getByRole('dialog').waitFor();
        await page.getByRole('button', { name: 'Fechar menu Mais' }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.locator('.private-content button').last().scrollIntoViewIfNeeded();
        const last = await page.locator('.private-content button').last().boundingBox();
        const bar = await page.locator('.shell-bottom-nav').boundingBox();
        assert(last.y + last.height <= bar.y);
        const safeArea = await page.addStyleTag({ content: '.authenticated-shell { --shell-bottom-height:84px !important; } .shell-bottom-nav { padding-bottom:24px !important; }' });
        await page.waitForTimeout(100);
        await page.locator('.private-content button').last().evaluate(el => el.scrollIntoView({ block: 'center' }));
        const safeLast = await page.locator('.private-content button').last().boundingBox();
        const safeBar = await page.locator('.shell-bottom-nav').boundingBox();
        assert(safeLast.y + safeLast.height <= safeBar.y);
        assert.equal(safeBar.height, 84);
        await page.screenshot({ path: path.join(out, `${theme}-safe-area-20px.png`) });
        await safeArea.evaluate(el => el.remove());
        await page.setViewportSize({ width: 1440, height: 800 });
        await page.evaluate(() => document.body.style.zoom = '1.25');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        await page.screenshot({ path: path.join(out, `${theme}-zoom-125.png`) });
        await page.evaluate(() => document.body.style.zoom = '');
        interactions.push({ theme, menuGeometry, resized, last, bar, safeLast, safeBar });
      }
      prefs = { tasks: false, subjects: true, flashcards: false, ai: false };
      await page.setViewportSize({ width: 320, height: 640 });
      await page.goto('http://127.0.0.1:5173/app/tarefas');
      await page.getByText('Este módulo está desativado.', { exact: false }).waitFor();
      assert.deepEqual(await page.locator('.shell-bottom-nav a').evaluateAll(els => els.map(x => x.getAttribute('href'))), ['/app', '/app/materias']);
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 640 });
        await page.goto('http://127.0.0.1:5173/app/materias');
        if (width < 1024) await page.getByRole('button', { name: 'Mais' }).click();
        let release;
        logoutGate = new Promise(resolve => { release = resolve; });
        await page.getByRole('button', { name: 'Sair' }).click();
        if (width < 1024) await page.getByRole('button', { name: 'Mais' }).click();
        await page.getByRole('button', { name: 'Processando…' }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Processando…' }).isDisabled(), true);
        if (width < 1024) await page.getByRole('button', { name: 'Fechar menu Mais' }).click();
        release(); logoutGate = null;
        await page.getByText('Não foi possível sair agora. Tente novamente.').waitFor();
        const errorBox = await page.getByText('Não foi possível sair agora. Tente novamente.').boundingBox();
        assert(errorBox.y >= 64 && errorBox.y + errorBox.height <= (width < 1024 ? 576 : 640));
        await page.screenshot({ path: path.join(out, `logout-error-${width}.png`) });
        if (width < 1024) await page.getByRole('button', { name: 'Mais' }).click();
        logoutFailure = false;
        await page.getByRole('button', { name: 'Sair' }).click();
        await page.waitForURL('**/acesso');
        logoutFailure = true;
      }
      prefs = { tasks: true, subjects: true, flashcards: true, ai: false };
      const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'validation/baseline/results.json'), 'utf8'));
      const unchanged = baseline.map(old => ({ href: old.href, theme: old.theme, width: old.width, equal: old.text === results.find(x => x.href === old.href && x.theme === old.theme && x.width === old.width).text }));
      assert(unchanged.every(x => x.equal), 'Internal page text changed');
      fs.writeFileSync(path.join(out, 'interactions.json'), JSON.stringify({ interactions, unchanged, contrastChecks }, null, 2));
    }
    prefsFailure = true;
    await page.goto('http://127.0.0.1:5173/app/tarefas');
    await page.getByText('Não foi possível verificar as preferências.', { exact: false }).waitFor();
    await page.screenshot({ path: path.join(out, 'preferences-unavailable.png'), fullPage: true });
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify({ phase, combinations: results.length, overflow: results.filter(x => x.overflow).map(x => ({ href: x.href, theme: x.theme, width: x.width })) }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
